import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import puppeteer, { Browser } from 'puppeteer';
import { Result, ResultBuilder } from '../../../../common/classes/result.class';
import { PdfRendererPort } from '../../application/ports/pdf-renderer.port';

const RENDER_TIMEOUT_MS = 15_000;

@Injectable()
export class PuppeteerPdfRendererPortImplementation
  implements PdfRendererPort, OnModuleDestroy
{
  private readonly logger = new Logger(
    PuppeteerPdfRendererPortImplementation.name,
  );
  private browser?: Promise<Browser>;

  async render(html: string): Promise<Result<Buffer>> {
    const builder = new ResultBuilder<Buffer>();

    try {
      const browser = await this.getBrowser();
      const page = await browser.newPage();

      try {
        await page.setJavaScriptEnabled(false);
        await page.setContent(html, {
          waitUntil: 'load',
          timeout: RENDER_TIMEOUT_MS,
        });
        const pdf = await page.pdf({
          preferCSSPageSize: true,
          printBackground: true,
          timeout: RENDER_TIMEOUT_MS,
        });

        return builder.setSuccess(true).setDto(Buffer.from(pdf)).build();
      } finally {
        await page.close().catch(() => undefined);
      }
    } catch (error) {
      this.logger.error(`PDF rendering failed: ${String(error)}`);
      return builder
        .setSuccess(false)
        .setMessage('PDF could not be generated')
        .build();
    }
  }

  async onModuleDestroy(): Promise<void> {
    await (await this.browser)?.close().catch(() => undefined);
  }

  private getBrowser(): Promise<Browser> {
    this.browser ??= puppeteer.launch().then((browser) => {
      browser.once('disconnected', () => {
        this.browser = undefined;
      });
      return browser;
    });
    this.browser.catch(() => {
      this.browser = undefined;
    });

    return this.browser;
  }
}

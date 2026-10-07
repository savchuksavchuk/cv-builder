import { Migration } from '@mikro-orm/migrations';

export class Migration20261007205848 extends Migration {
  override name = 'Migration20261007205848';

  override up(): void | Promise<void> {
    this.addSql(
      `update "cvs" set "status" = 'processing' where "status" = 'generating';`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(
      `update "cvs" set "status" = 'generating' where "status" = 'processing';`,
    );
  }
}

import { z } from 'zod'
import { CV_LIMITS } from '@/entities/cv'

const formatNumber = (value: number) => value.toLocaleString('en-US')

export const CvCreateSchema = z
  .object({
    targetRole: z
      .string()
      .trim()
      .min(1, 'Target role is required')
      .max(
        CV_LIMITS.TARGET_ROLE,
        `Target role must be at most ${CV_LIMITS.TARGET_ROLE} characters`,
      ),
    text: z
      .string()
      .trim()
      .max(
        CV_LIMITS.INPUT_TEXT,
        `Text must be at most ${formatNumber(CV_LIMITS.INPUT_TEXT)} characters`,
      ),
    file: z
      .instanceof(File)
      .refine(
        (f) => f.type === 'application/pdf',
        'Only PDF files are supported',
      )
      .refine(
        (f) => f.size <= CV_LIMITS.PDF_BYTES,
        `File is larger than ${CV_LIMITS.PDF_BYTES / 1024 / 1024} MB`,
      )
      .optional(),
  })
  .refine((data) => data.text || data.file, {
    path: ['text'],
    message: 'Provide text, a PDF file, or both',
  })

export type CvCreateFormData = z.infer<typeof CvCreateSchema>

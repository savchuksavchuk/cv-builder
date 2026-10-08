import { z } from 'zod'

const MAX_FILE_SIZE = 10 * 1024 * 1024

export const CvCreateSchema = z
  .object({
    targetRole: z
      .string()
      .trim()
      .min(1, 'Target role is required')
      .max(120, 'Target role must be at most 120 characters'),
    text: z.string().max(20000, 'Text must be at most 20 000 characters'),
    file: z
      .instanceof(File)
      .refine(
        (f) => f.type === 'application/pdf',
        'Only PDF files are supported',
      )
      .refine((f) => f.size <= MAX_FILE_SIZE, 'File is larger than 10 MB')
      .optional(),
  })
  .refine((data) => data.text.trim() || data.file, {
    path: ['text'],
    message: 'Provide text, a PDF file, or both',
  })

export type CvCreateFormData = z.infer<typeof CvCreateSchema>

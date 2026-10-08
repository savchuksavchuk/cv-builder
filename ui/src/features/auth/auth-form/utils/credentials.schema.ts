import { z } from 'zod'

export const CredentialsSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email('Invalid email')),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters'),
})

export type CredentialsFormData = z.infer<typeof CredentialsSchema>

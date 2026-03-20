import { z } from 'zod'

export const UpdateFamilySchema = z.object({
  name: z.string().min(1, 'Family name is required').max(100),
  evalIntervalDays: z
    .number()
    .int()
    .min(7, 'Minimum 7 days')
    .max(365, 'Maximum 365 days'),
})

export type UpdateFamilyInput = z.infer<typeof UpdateFamilySchema>

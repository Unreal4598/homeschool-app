import { z } from 'zod'

export const StudentAllocationSchema = z.object({
  studentId: z.string().uuid(),
  allocatedMinutes: z.number().int().min(1),
  isOverride: z.boolean().default(false),
})

export const CreateEntrySchema = z.object({
  entryDate: z.string().min(1, 'Date is required'),
  subjectId: z.string().uuid('Subject is required'),
  totalMinutes: z.number().int().min(1, 'Duration must be at least 1 minute').max(1440),
  location: z.enum(['home', 'off_site']),
  notes: z.string().max(1000).optional(),
  studentAllocations: z
    .array(StudentAllocationSchema)
    .min(1, 'At least one student is required'),
})

export const UpdateEntrySchema = CreateEntrySchema

export type CreateEntryInput = z.infer<typeof CreateEntrySchema>

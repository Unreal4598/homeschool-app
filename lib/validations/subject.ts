import { z } from 'zod'

export const CreateSubjectSchema = z.object({
  name: z.string().min(1, 'Subject name is required').max(100),
  isCore: z.boolean(),
})

export const UpdateSubjectSchema = CreateSubjectSchema

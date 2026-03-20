import { z } from 'zod'

export const EVAL_TYPES = [
  { value: 'portfolio', label: 'Portfolio Review' },
  { value: 'interview', label: 'Structured Interview' },
  { value: 'standardized_test', label: 'Standardized Test' },
  { value: 'written', label: 'Written Evaluation' },
  { value: 'other', label: 'Other' },
] as const

export type EvalTypeValue = (typeof EVAL_TYPES)[number]['value']

export const CreateEvaluationSchema = z.object({
  studentId: z.string().uuid(),
  evalDate: z.string().min(1, 'Date is required'),
  evalType: z.enum(['portfolio', 'interview', 'standardized_test', 'written', 'other']),
  subjectId: z.string().uuid().optional(),
  notes: z.string().max(1000).optional(),
  attachmentId: z.string().uuid().optional(),
})

export type CreateEvaluationInput = z.infer<typeof CreateEvaluationSchema>

import { z } from 'zod'

export const CreateAttachmentSchema = z.object({
  studentId: z.string().uuid(),
  entryId: z.string().uuid().optional(),
  subjectId: z.string().uuid().optional(),
  fileName: z.string().min(1).max(255),
  filePath: z.string().min(1),
  fileSize: z.number().int().positive().optional(),
  mimeType: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
  uploadDate: z.string().min(1),
})

export type CreateAttachmentInput = z.infer<typeof CreateAttachmentSchema>

export const ACCEPTED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

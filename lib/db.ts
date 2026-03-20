import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Reuse PrismaClient instance across hot reloads in development
const client =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = client
}

// Models that use soft delete (deletedAt column).
// Auto-applies WHERE deleted_at IS NULL to all findMany/findFirst/count queries.
const SOFT_DELETE_MODELS = new Set([
  'User',
  'Student',
  'Subject',
  'ActivityEntry',
  'Attachment',
  'ProgressEvaluation',
])

// eslint-disable-next-line @typescript-eslint/no-explicit-any
client.$use(async (params: any, next: any) => {
  if (params.model && SOFT_DELETE_MODELS.has(params.model)) {
    const readOps = ['findMany', 'findFirst', 'findFirstOrThrow', 'count']
    if (readOps.includes(params.action)) {
      params.args = params.args ?? {}
      params.args.where = { deletedAt: null, ...params.args.where }
    }
  }
  return next(params)
})

export const db = client

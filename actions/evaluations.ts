'use server'

import { db } from '@/lib/db'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { CreateEvaluationSchema } from '@/lib/validations/evaluation'

async function getAuthContext() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const membership = await db.familyMembership.findFirst({
    where: { userId: user.id },
    select: { familyId: true },
  })
  if (!membership) throw new Error('No family found')

  return { userId: user.id, familyId: membership.familyId }
}

export async function createEvaluation(data: unknown) {
  try {
    const { familyId } = await getAuthContext()

    const parsed = CreateEvaluationSchema.safeParse(data)
    if (!parsed.success) {
      return { error: parsed.error.flatten().fieldErrors }
    }

    const student = await db.student.findFirst({
      where: { id: parsed.data.studentId, familyId },
      select: { id: true },
    })
    if (!student) return { error: 'Student not found' }

    if (parsed.data.attachmentId) {
      const attachment = await db.attachment.findFirst({
        where: { id: parsed.data.attachmentId, familyId },
        select: { id: true },
      })
      if (!attachment) return { error: 'Attachment not found' }
    }

    await db.progressEvaluation.create({
      data: {
        familyId,
        studentId: parsed.data.studentId,
        evalDate: new Date(parsed.data.evalDate),
        evalType: parsed.data.evalType,
        subjectId: parsed.data.subjectId ?? null,
        notes: parsed.data.notes ?? null,
        attachmentId: parsed.data.attachmentId ?? null,
      },
    })

    revalidatePath(`/students/${parsed.data.studentId}/evaluations`)
    revalidatePath(`/students/${parsed.data.studentId}`)
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Something went wrong' }
  }
}

export async function deleteEvaluation(id: string) {
  try {
    const { familyId } = await getAuthContext()

    const evaluation = await db.progressEvaluation.findFirst({
      where: { id, familyId },
    })
    if (!evaluation) return { error: 'Evaluation not found' }

    await db.progressEvaluation.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    revalidatePath(`/students/${evaluation.studentId}/evaluations`)
    revalidatePath(`/students/${evaluation.studentId}`)
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Something went wrong' }
  }
}

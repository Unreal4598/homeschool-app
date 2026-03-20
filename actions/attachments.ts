'use server'

import { db } from '@/lib/db'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { CreateAttachmentSchema } from '@/lib/validations/attachment'

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

  return { userId: user.id, familyId: membership.familyId, supabase }
}

export async function createAttachment(data: unknown) {
  try {
    const { familyId } = await getAuthContext()

    const parsed = CreateAttachmentSchema.safeParse(data)
    if (!parsed.success) {
      return { error: parsed.error.flatten().fieldErrors }
    }

    // Verify student belongs to this family
    const student = await db.student.findFirst({
      where: { id: parsed.data.studentId, familyId },
      select: { id: true },
    })
    if (!student) return { error: 'Student not found' }

    const attachment = await db.attachment.create({
      data: {
        familyId,
        studentId: parsed.data.studentId,
        entryId: parsed.data.entryId ?? null,
        subjectId: parsed.data.subjectId ?? null,
        fileName: parsed.data.fileName,
        filePath: parsed.data.filePath,
        fileSize: parsed.data.fileSize ?? null,
        mimeType: parsed.data.mimeType ?? null,
        notes: parsed.data.notes ?? null,
        uploadDate: new Date(parsed.data.uploadDate),
      },
    })

    revalidatePath(`/students/${parsed.data.studentId}/portfolio`)
    return { success: true, id: attachment.id }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Something went wrong' }
  }
}

export async function deleteAttachment(id: string) {
  try {
    const { familyId, supabase } = await getAuthContext()

    const attachment = await db.attachment.findFirst({
      where: { id, familyId },
    })
    if (!attachment) return { error: 'Attachment not found' }

    // Delete from storage first
    const { error: storageError } = await supabase.storage
      .from('attachments')
      .remove([attachment.filePath])

    if (storageError) {
      console.error('Storage delete error:', storageError)
      // Continue with soft-delete even if storage fails
    }

    await db.attachment.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    revalidatePath(`/students/${attachment.studentId}/portfolio`)
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Something went wrong' }
  }
}

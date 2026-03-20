'use server'

import { db } from '@/lib/db'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { CreateSubjectSchema, UpdateSubjectSchema } from '@/lib/validations/subject'

async function getFamilyId() {
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
  return membership.familyId
}

export async function createSubject(data: unknown) {
  try {
    const familyId = await getFamilyId()

    const parsed = CreateSubjectSchema.safeParse(data)
    if (!parsed.success) {
      return { error: parsed.error.flatten().fieldErrors }
    }

    // Determine sort order (after existing custom subjects)
    const maxSort = await db.subject.findFirst({
      where: { familyId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    })

    await db.subject.create({
      data: {
        ...parsed.data,
        familyId,
        isSystem: false,
        sortOrder: (maxSort?.sortOrder ?? 20) + 1,
      },
    })

    revalidatePath('/settings/subjects')
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Something went wrong' }
  }
}

export async function updateSubject(
  id: string,
  data: { name: string; isCore: boolean }
) {
  try {
    const familyId = await getFamilyId()

    const parsed = UpdateSubjectSchema.safeParse(data)
    if (!parsed.success) {
      return { error: parsed.error.flatten().fieldErrors }
    }

    // Only allow updating custom (non-system) subjects belonging to this family
    const subject = await db.subject.findFirst({
      where: { id, familyId, isSystem: false },
    })
    if (!subject) return { error: 'Subject not found or cannot be edited' }

    await db.subject.update({ where: { id }, data: parsed.data })

    revalidatePath('/settings/subjects')
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Something went wrong' }
  }
}

export async function archiveSubject(id: string) {
  try {
    const familyId = await getFamilyId()

    const subject = await db.subject.findFirst({
      where: { id, familyId, isSystem: false },
    })
    if (!subject) return { error: 'Subject not found or cannot be archived' }

    await db.subject.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    revalidatePath('/settings/subjects')
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Something went wrong' }
  }
}

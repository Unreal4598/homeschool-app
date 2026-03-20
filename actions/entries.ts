'use server'

import { db } from '@/lib/db'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { CreateEntrySchema } from '@/lib/validations/entry'

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

export async function createEntry(data: unknown) {
  try {
    const { userId, familyId } = await getAuthContext()

    const parsed = CreateEntrySchema.safeParse(data)
    if (!parsed.success) {
      return { error: parsed.error.flatten().fieldErrors }
    }

    const { studentAllocations, ...entryData } = parsed.data

    // Validate all students belong to this family
    const studentIds = studentAllocations.map((a) => a.studentId)
    const validStudents = await db.student.findMany({
      where: { id: { in: studentIds }, familyId },
      select: { id: true },
    })
    if (validStudents.length !== studentIds.length) {
      return { error: 'One or more students not found' }
    }

    // Validate subject belongs to this family or is a system subject
    const subject = await db.subject.findFirst({
      where: {
        id: entryData.subjectId,
        OR: [{ familyId: null }, { familyId }],
      },
    })
    if (!subject) return { error: 'Subject not found' }

    await db.activityEntry.create({
      data: {
        familyId,
        createdById: userId,
        entryDate: new Date(entryData.entryDate),
        subjectId: entryData.subjectId,
        totalMinutes: entryData.totalMinutes,
        location: entryData.location,
        notes: entryData.notes ?? null,
        isShared: studentAllocations.length > 1,
        allocations: {
          createMany: {
            data: studentAllocations.map((a) => ({
              studentId: a.studentId,
              allocatedMinutes: a.allocatedMinutes,
              isOverride: a.isOverride,
            })),
          },
        },
      },
    })

    revalidatePath('/dashboard')
    revalidatePath('/history')
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Something went wrong' }
  }
}

export async function updateEntry(id: string, data: unknown) {
  try {
    const { familyId } = await getAuthContext()

    const entry = await db.activityEntry.findFirst({ where: { id, familyId } })
    if (!entry) return { error: 'Entry not found' }

    const parsed = CreateEntrySchema.safeParse(data)
    if (!parsed.success) {
      return { error: parsed.error.flatten().fieldErrors }
    }

    const { studentAllocations, ...entryData } = parsed.data

    // Replace allocations atomically
    await db.$transaction(async (tx) => {
      await tx.entryStudentAllocation.deleteMany({ where: { entryId: id } })
      await tx.activityEntry.update({
        where: { id },
        data: {
          entryDate: new Date(entryData.entryDate),
          subjectId: entryData.subjectId,
          totalMinutes: entryData.totalMinutes,
          location: entryData.location,
          notes: entryData.notes ?? null,
          isShared: studentAllocations.length > 1,
        },
      })
      await tx.entryStudentAllocation.createMany({
        data: studentAllocations.map((a) => ({
          entryId: id,
          studentId: a.studentId,
          allocatedMinutes: a.allocatedMinutes,
          isOverride: a.isOverride,
        })),
      })
    })

    revalidatePath('/dashboard')
    revalidatePath('/history')
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Something went wrong' }
  }
}

export async function deleteEntry(id: string) {
  try {
    const { familyId } = await getAuthContext()

    const entry = await db.activityEntry.findFirst({ where: { id, familyId } })
    if (!entry) return { error: 'Entry not found' }

    await db.activityEntry.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    revalidatePath('/dashboard')
    revalidatePath('/history')
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Something went wrong' }
  }
}

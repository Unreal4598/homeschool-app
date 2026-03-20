'use server'

import { db } from '@/lib/db'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { CreateStudentSchema, UpdateStudentSchema } from '@/lib/validations/student'

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

export async function createStudent(data: unknown) {
  try {
    const { familyId } = await getAuthContext()

    const parsed = CreateStudentSchema.safeParse(data)
    if (!parsed.success) {
      return { error: parsed.error.flatten().fieldErrors }
    }

    await db.student.create({
      data: {
        ...parsed.data,
        gradeLevel: parsed.data.gradeLevel ?? null,
        notes: parsed.data.notes ?? null,
        familyId,
        dateOfBirth: new Date(parsed.data.dateOfBirth),
      },
    })

    revalidatePath('/students')
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Something went wrong' }
  }
}

export async function updateStudent(id: string, data: unknown) {
  try {
    const { familyId } = await getAuthContext()

    const student = await db.student.findFirst({ where: { id, familyId } })
    if (!student) return { error: 'Student not found' }

    const parsed = UpdateStudentSchema.safeParse(data)
    if (!parsed.success) {
      return { error: parsed.error.flatten().fieldErrors }
    }

    await db.student.update({
      where: { id },
      data: {
        ...parsed.data,
        gradeLevel: parsed.data.gradeLevel ?? null,
        notes: parsed.data.notes ?? null,
        dateOfBirth: new Date(parsed.data.dateOfBirth),
      },
    })

    revalidatePath('/students')
    revalidatePath(`/students/${id}`)
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Something went wrong' }
  }
}

export async function deleteStudent(id: string) {
  try {
    const { familyId } = await getAuthContext()

    const student = await db.student.findFirst({ where: { id, familyId } })
    if (!student) return { error: 'Student not found' }

    await db.student.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    revalidatePath('/students')
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Something went wrong' }
  }
}

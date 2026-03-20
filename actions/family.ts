'use server'

import { db } from '@/lib/db'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { UpdateFamilySchema } from '@/lib/validations/family'

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

export async function updateFamily(data: unknown) {
  try {
    const { familyId } = await getAuthContext()

    const parsed = UpdateFamilySchema.safeParse(data)
    if (!parsed.success) {
      return { error: parsed.error.flatten().fieldErrors }
    }

    await db.family.update({
      where: { id: familyId },
      data: {
        name: parsed.data.name,
        evalIntervalDays: parsed.data.evalIntervalDays,
      },
    })

    revalidatePath('/settings/family')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Something went wrong' }
  }
}

export async function joinFamily(familyId: string) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Check if already in a family
    const existing = await db.familyMembership.findFirst({
      where: { userId: user.id },
    })
    if (existing) return { error: 'You are already a member of a family.' }

    // Verify the family exists
    const family = await db.family.findFirst({ where: { id: familyId } })
    if (!family) return { error: 'Invite link is invalid.' }

    // Upsert user record then create membership
    await db.user.upsert({
      where: { id: user.id },
      create: { id: user.id, email: user.email! },
      update: { email: user.email! },
    })

    await db.familyMembership.create({
      data: {
        familyId,
        userId: user.id,
        role: 'member',
        joinedAt: new Date(),
      },
    })

    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Something went wrong' }
  }
}

'use server'

import { db } from '@/lib/db'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createFamily(name: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const trimmed = name.trim()
  if (!trimmed) return { error: 'Family name is required' }
  if (trimmed.length > 100) return { error: 'Family name is too long' }

  // Check if user already has a family
  const existing = await db.familyMembership.findFirst({
    where: { userId: user.id },
  })
  if (existing) redirect('/dashboard')

  // Ensure user record exists
  await db.user.upsert({
    where: { id: user.id },
    create: { id: user.id, email: user.email! },
    update: { email: user.email! },
  })

  // Create family + membership in one transaction
  await db.family.create({
    data: {
      name: trimmed,
      members: {
        create: {
          userId: user.id,
          role: 'admin',
          joinedAt: new Date(),
        },
      },
    },
  })

  redirect('/dashboard')
}

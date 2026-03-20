import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { FamilyProvider } from '@/components/providers/FamilyProvider'
import { AppShell } from '@/components/layout/AppShell'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) redirect('/login')

  // Ensure user record exists in our DB
  await db.user.upsert({
    where: { id: authUser.id },
    create: { id: authUser.id, email: authUser.email! },
    update: { email: authUser.email! },
  })

  // Check for family membership
  const membership = await db.familyMembership.findFirst({
    where: { userId: authUser.id },
    include: { family: true },
  })

  if (!membership) {
    redirect('/onboarding')
  }

  const { family } = membership

  const students = await db.student.findMany({
    where: { familyId: family.id, isActive: true },
    orderBy: { firstName: 'asc' },
  })

  return (
    <FamilyProvider
      family={{
        id: family.id,
        name: family.name,
        state: family.state,
        evalIntervalDays: family.evalIntervalDays,
      }}
      students={students.map((s) => ({
        id: s.id,
        firstName: s.firstName,
        lastName: s.lastName,
        dateOfBirth: s.dateOfBirth.toISOString(),
        gradeLevel: s.gradeLevel,
        notes: s.notes,
        isActive: s.isActive,
        familyId: s.familyId,
      }))}
      userId={authUser.id}
    >
      <AppShell>{children}</AppShell>
    </FamilyProvider>
  )
}

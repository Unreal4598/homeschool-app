import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { LogEntryForm } from '@/components/forms/LogEntryForm'

export default async function LogPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const membership = await db.familyMembership.findFirst({
    where: { userId: user!.id },
    select: { familyId: true },
  })

  const subjects = await db.subject.findMany({
    where: {
      OR: [{ familyId: null }, { familyId: membership!.familyId }],
    },
    orderBy: [{ isCore: 'desc' }, { name: 'asc' }],
    select: { id: true, name: true, isCore: true },
  })

  return (
    <main className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-6">Log Activity</h1>
      <LogEntryForm subjects={subjects} />
    </main>
  )
}

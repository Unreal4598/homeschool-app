import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { HistoryClient } from './HistoryClient'

export default async function HistoryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const membership = await db.familyMembership.findFirst({
    where: { userId: user!.id },
    select: { familyId: true },
  })

  const entries = await db.activityEntry.findMany({
    where: { familyId: membership!.familyId },
    orderBy: { entryDate: 'desc' },
    include: {
      subject: { select: { name: true, isCore: true } },
      allocations: {
        include: { student: { select: { firstName: true } } },
      },
    },
  })

  const serialized = entries.map((e) => ({
    id: e.id,
    entryDate: e.entryDate.toISOString().split('T')[0],
    subjectName: e.subject.name,
    isCore: e.subject.isCore,
    totalMinutes: e.totalMinutes,
    location: e.location,
    notes: e.notes,
    isShared: e.isShared,
    allocations: e.allocations.map((a) => ({
      studentName: a.student.firstName,
      allocatedMinutes: a.allocatedMinutes,
    })),
  }))

  return (
    <main className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">History</h1>
        <span className="text-xs text-muted-foreground">{serialized.length} entries</span>
      </div>
      <HistoryClient entries={serialized} />
    </main>
  )
}

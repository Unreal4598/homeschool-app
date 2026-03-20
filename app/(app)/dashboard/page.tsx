import { signOut } from '@/actions/auth'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { BookOpen } from 'lucide-react'
import Link from 'next/link'
import { getSchoolYear, calculateCompliance, isAgeExempt } from '@/lib/compliance'
import { ComplianceCard } from '@/components/shared/ComplianceCard'

function formatMinutes(total: number) {
  const h = Math.floor(total / 60)
  const m = total % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const membership = await db.familyMembership.findFirst({
    where: { userId: user!.id },
    include: { family: { select: { name: true } } },
  })

  const familyName = membership?.family.name ?? 'Your Family'

  const students = await db.student.findMany({
    where: { familyId: membership!.familyId, isActive: true },
    orderBy: { firstName: 'asc' },
  })

  const schoolYear = getSchoolYear(new Date())

  const recentEntries = await db.activityEntry.findMany({
    where: { familyId: membership!.familyId },
    orderBy: { entryDate: 'desc' },
    take: 5,
    include: {
      subject: { select: { name: true } },
      allocations: {
        include: { student: { select: { firstName: true } } },
      },
    },
  })

  // Fetch allocations for all students in one query
  const allAllocations = await db.entryStudentAllocation.findMany({
    where: {
      studentId: { in: students.map((s) => s.id) },
      entry: {
        entryDate: { gte: schoolYear.start, lte: schoolYear.end },
        deletedAt: null,
      },
    },
    include: {
      entry: {
        select: {
          location: true,
          subject: { select: { isCore: true } },
        },
      },
    },
  })

  // Group allocations by studentId
  const byStudent = new Map(students.map((s) => [s.id, [] as typeof allAllocations]))
  for (const a of allAllocations) {
    byStudent.get(a.studentId)?.push(a)
  }

  const studentCompliance = students.map((s) => ({
    student: s,
    exempt: isAgeExempt(s.dateOfBirth),
    data: calculateCompliance(byStudent.get(s.id) ?? []),
  }))

  return (
    <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm">{familyName}</span>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Sign out
          </button>
        </form>
      </div>

      {/* Welcome */}
      <div className="rounded-lg border bg-card p-4">
        <h1 className="text-lg font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{user?.email}</p>
      </div>

      {/* Compliance per student */}
      {studentCompliance.length === 0 ? (
        <div className="rounded-lg border bg-card p-4 text-center">
          <p className="text-sm text-muted-foreground">
            No active students.{' '}
            <a href="/students" className="underline">
              Add a student
            </a>{' '}
            to start tracking.
          </p>
        </div>
      ) : (
        studentCompliance.map(({ student, exempt, data }) => (
          <div key={student.id}>
            {studentCompliance.length > 1 && (
              <p className="text-xs font-medium text-muted-foreground mb-1 px-1">
                {student.firstName} {student.lastName}
              </p>
            )}
            <ComplianceCard
              data={data}
              exempt={exempt}
              schoolYearLabel={schoolYear.label}
            />
          </div>
        ))
      )}

      {/* Recent activity */}
      <div className="rounded-lg border bg-card">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h2 className="text-sm font-semibold">Recent Activity</h2>
          <Link href="/history" className="text-xs text-primary hover:underline">
            View all
          </Link>
        </div>
        {recentEntries.length === 0 ? (
          <div className="px-4 pb-4">
            <p className="text-sm text-muted-foreground">
              No activity yet.{' '}
              <Link href="/log" className="underline">
                Log your first entry
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {recentEntries.map((e) => (
              <div key={e.id} className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{e.subject.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {e.allocations.map((a) => a.student.firstName).join(', ')}
                    {' · '}
                    {new Date(e.entryDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatMinutes(e.totalMinutes)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

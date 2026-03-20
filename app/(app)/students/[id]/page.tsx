import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { StudentDetailClient } from './StudentDetailClient'
import { getSchoolYear, calculateCompliance, isAgeExempt } from '@/lib/compliance'
import { ComplianceCard } from '@/components/shared/ComplianceCard'

interface Props {
  params: Promise<{ id: string }>
}

function getEvalStatus(lastEvalDate: Date | null, intervalDays: number) {
  if (!lastEvalDate) return 'none' as const
  const due = new Date(lastEvalDate)
  due.setDate(due.getDate() + intervalDays)
  const daysUntil = Math.floor((due.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (daysUntil < 0) return 'overdue' as const
  if (daysUntil <= 7) return 'due_soon' as const
  return 'on_track' as const
}

export default async function StudentDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const membership = await db.familyMembership.findFirst({
    where: { userId: user!.id },
    include: { family: { select: { evalIntervalDays: true } } },
  })

  const student = await db.student.findFirst({
    where: { id, familyId: membership!.familyId },
  })

  if (!student) notFound()

  const schoolYear = getSchoolYear(new Date())
  const exempt = isAgeExempt(student.dateOfBirth)

  const [allocations, lastEval, recentActivity] = await Promise.all([
    exempt
      ? Promise.resolve([])
      : db.entryStudentAllocation.findMany({
          where: {
            studentId: id,
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
        }),
    db.progressEvaluation.findFirst({
      where: { studentId: id, familyId: membership!.familyId },
      orderBy: { evalDate: 'desc' },
      select: { evalDate: true, evalType: true },
    }),
    db.entryStudentAllocation.findMany({
      where: { studentId: id, entry: { deletedAt: null } },
      orderBy: { entry: { entryDate: 'desc' } },
      take: 5,
      include: {
        entry: {
          select: {
            entryDate: true,
            totalMinutes: true,
            location: true,
            subject: { select: { name: true } },
          },
        },
      },
    }),
  ])

  const complianceData = calculateCompliance(allocations)
  const evalIntervalDays = membership!.family.evalIntervalDays
  const evalStatus = getEvalStatus(lastEval?.evalDate ?? null, evalIntervalDays)

  const dueDate = lastEval
    ? new Date(new Date(lastEval.evalDate).getTime() + evalIntervalDays * 24 * 60 * 60 * 1000)
    : null

  const serialized = {
    id: student.id,
    firstName: student.firstName,
    lastName: student.lastName,
    dateOfBirth: student.dateOfBirth.toISOString(),
    gradeLevel: student.gradeLevel,
    notes: student.notes,
    isActive: student.isActive,
    familyId: student.familyId,
  }

  const statusConfig = {
    none: { label: 'No evaluations yet', className: 'text-muted-foreground' },
    on_track: { label: 'On Track', className: 'text-green-600 font-medium' },
    due_soon: { label: 'Due Soon', className: 'text-yellow-600 font-medium' },
    overdue: { label: 'Overdue', className: 'text-destructive font-medium' },
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/students"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">
            {student.firstName} {student.lastName}
          </h1>
          {student.gradeLevel && (
            <p className="text-sm text-muted-foreground">
              Grade {student.gradeLevel}
            </p>
          )}
        </div>
        <StudentDetailClient student={serialized} />
      </div>

      <ComplianceCard
        data={complianceData}
        exempt={exempt}
        schoolYearLabel={schoolYear.label}
      />

      <div className="space-y-3 mt-4">
        {/* Recent Activity */}
        <div className="rounded-lg border bg-card">
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <p className="text-sm font-semibold">Recent Activity</p>
            <Link href="/history" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </div>
          {recentActivity.length === 0 ? (
            <p className="px-4 pb-4 text-sm text-muted-foreground">No activity logged yet.</p>
          ) : (
            <div className="divide-y">
              {recentActivity.map((a) => (
                <div key={a.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.entry.subject.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(a.entry.entryDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                      {' · '}
                      {a.entry.location === 'home' ? 'At Home' : 'Off-Site'}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {(() => {
                      const h = Math.floor(a.allocatedMinutes / 60)
                      const m = a.allocatedMinutes % 60
                      if (h === 0) return `${m}m`
                      if (m === 0) return `${h}h`
                      return `${h}h ${m}m`
                    })()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Evaluations status card */}
        <Link
          href={`/students/${id}/evaluations`}
          className="block rounded-lg border bg-card p-4 hover:bg-accent transition-colors"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Evaluations</p>
            <span className={`text-xs ${statusConfig[evalStatus].className}`}>
              {statusConfig[evalStatus].label}
            </span>
          </div>
          {lastEval && (
            <p className="text-xs text-muted-foreground mt-1">
              Last:{' '}
              {new Date(lastEval.evalDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
              {dueDate && (
                <>
                  {' · '}Next due:{' '}
                  {dueDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </>
              )}
            </p>
          )}
        </Link>

        {/* Portfolio link */}
        <Link
          href={`/students/${id}/portfolio`}
          className="block rounded-lg border bg-card p-4 text-center hover:bg-accent transition-colors"
        >
          <p className="text-sm font-medium">Portfolio</p>
          <p className="text-xs text-muted-foreground mt-0.5">View &amp; upload files →</p>
        </Link>
      </div>
    </div>
  )
}

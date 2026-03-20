import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { getSchoolYear } from '@/lib/compliance'
import { FileText } from 'lucide-react'

const REPORT_TYPES = [
  { type: 'annual_summary', label: 'Annual Summary', description: 'Hours by subject, compliance progress' },
  { type: 'activity_log', label: 'Activity Log', description: 'All logged entries for the school year' },
  { type: 'evaluation_report', label: 'Evaluation History', description: 'All evaluations recorded' },
  { type: 'portfolio_index', label: 'Portfolio Index', description: 'List of all uploaded files' },
]

export default async function ReportsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const membership = await db.familyMembership.findFirst({
    where: { userId: user!.id },
    select: { familyId: true },
  })

  const students = await db.student.findMany({
    where: { familyId: membership!.familyId, isActive: true },
    orderBy: { firstName: 'asc' },
    select: { id: true, firstName: true, lastName: true },
  })

  const schoolYear = getSchoolYear(new Date())

  return (
    <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <h1 className="text-xl font-bold">Reports</h1>

      {students.length === 0 ? (
        <div className="rounded-lg border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">
            No active students. Add a student to generate reports.
          </p>
        </div>
      ) : (
        students.map((student) => (
          <div key={student.id}>
            <p className="text-sm font-semibold mb-2">
              {student.firstName} {student.lastName}
            </p>
            <div className="rounded-lg border bg-card divide-y">
              {REPORT_TYPES.map(({ type, label, description }) => (
                <a
                  key={type}
                  href={`/api/reports?type=${type}&studentId=${student.id}&schoolYear=${schoolYear.label}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 hover:bg-accent transition-colors"
                >
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{description}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">PDF ↓</span>
                </a>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1 px-1">
              School year {schoolYear.label} (Jul 1 – Jun 30)
            </p>
          </div>
        ))
      )}
    </main>
  )
}

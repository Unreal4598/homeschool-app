import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { EvaluationsClient } from './EvaluationsClient'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EvaluationsPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const membership = await db.familyMembership.findFirst({
    where: { userId: user!.id },
    select: { familyId: true },
  })

  const student = await db.student.findFirst({
    where: { id, familyId: membership!.familyId },
    select: { id: true, firstName: true, lastName: true },
  })

  if (!student) notFound()

  const [evaluations, subjects, attachments] = await Promise.all([
    db.progressEvaluation.findMany({
      where: { studentId: id, familyId: membership!.familyId },
      orderBy: { evalDate: 'desc' },
      select: {
        id: true,
        evalDate: true,
        evalType: true,
        notes: true,
        subject: { select: { name: true } },
        attachment: { select: { id: true, fileName: true } },
      },
    }),
    db.subject.findMany({
      where: { OR: [{ familyId: null }, { familyId: membership!.familyId }] },
      orderBy: [{ isCore: 'desc' }, { name: 'asc' }],
      select: { id: true, name: true, isCore: true },
    }),
    db.attachment.findMany({
      where: { studentId: id, familyId: membership!.familyId },
      orderBy: { uploadDate: 'desc' },
      select: { id: true, fileName: true },
    }),
  ])

  const serializedEvals = evaluations.map((ev) => ({
    id: ev.id,
    evalDate: ev.evalDate.toISOString().split('T')[0],
    evalType: ev.evalType,
    notes: ev.notes,
    subject: ev.subject ?? null,
    attachment: ev.attachment ?? null,
  }))

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/students/${id}`}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <p className="text-xs text-muted-foreground">
            {student.firstName} {student.lastName}
          </p>
        </div>
      </div>

      <EvaluationsClient
        studentId={id}
        evaluations={serializedEvals}
        subjects={subjects}
        attachments={attachments}
      />
    </div>
  )
}

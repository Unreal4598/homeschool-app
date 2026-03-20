import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { PortfolioClient } from './PortfolioClient'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PortfolioPage({ params }: Props) {
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

  const attachments = await db.attachment.findMany({
    where: { studentId: id, familyId: membership!.familyId },
    orderBy: { uploadDate: 'desc' },
    select: {
      id: true,
      fileName: true,
      fileSize: true,
      mimeType: true,
      notes: true,
      uploadDate: true,
    },
  })

  const serialized = attachments.map((a) => ({
    id: a.id,
    fileName: a.fileName,
    // BigInt → string to cross the server/client boundary
    fileSize: a.fileSize != null ? String(a.fileSize) : null,
    mimeType: a.mimeType,
    notes: a.notes,
    uploadDate: a.uploadDate.toISOString().split('T')[0],
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
        <h1 className="text-xl font-bold">
          {student.firstName}&apos;s Portfolio
        </h1>
      </div>

      <PortfolioClient studentId={id} attachments={serialized} />
    </div>
  )
}

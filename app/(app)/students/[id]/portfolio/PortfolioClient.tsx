'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { FileText, Image, Trash2, Download } from 'lucide-react'
import { deleteAttachment } from '@/actions/attachments'
import { FileUploadForm } from '@/components/forms/FileUploadForm'

interface Attachment {
  id: string
  fileName: string
  fileSize: string | null
  mimeType: string | null
  notes: string | null
  uploadDate: string
}

interface PortfolioClientProps {
  studentId: string
  attachments: Attachment[]
}

function FileIcon({ mimeType }: { mimeType: string | null }) {
  if (mimeType?.startsWith('image/')) return <Image className="h-4 w-4 text-muted-foreground" />
  return <FileText className="h-4 w-4 text-muted-foreground" />
}

function formatBytes(bytes: string | null) {
  if (!bytes) return null
  const n = parseInt(bytes)
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

function groupByMonth(attachments: Attachment[]) {
  const groups: Record<string, Attachment[]> = {}
  for (const a of attachments) {
    const d = new Date(a.uploadDate)
    const key = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    if (!groups[key]) groups[key] = []
    groups[key].push(a)
  }
  return groups
}

export function PortfolioClient({ studentId, attachments: initial }: PortfolioClientProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    setDeletingId(id)
    const result = await deleteAttachment(id)
    if (result.error) {
      toast.error(typeof result.error === 'string' ? result.error : 'Delete failed')
    } else {
      toast.success('File deleted')
      router.refresh()
    }
    setDeletingId(null)
  }

  const groups = groupByMonth(initial)
  const months = Object.keys(groups)

  return (
    <div className="space-y-6">
      {/* Upload form */}
      <div className="rounded-lg border bg-card p-4">
        <h2 className="text-sm font-semibold mb-3">Add File</h2>
        <FileUploadForm studentId={studentId} onSuccess={() => router.refresh()} />
      </div>

      {/* File list */}
      {initial.length === 0 ? (
        <div className="rounded-lg border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">
            No files yet. Upload work samples, photos, or documents.
          </p>
        </div>
      ) : (
        months.map((month) => (
          <div key={month}>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              {month}
            </p>
            <div className="rounded-lg border bg-card divide-y">
              {groups[month].map((a) => (
                <div key={a.id} className="flex items-center gap-3 p-3">
                  <FileIcon mimeType={a.mimeType} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {[formatBytes(a.fileSize), a.notes].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <a
                    href={`/api/files/${a.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground p-1"
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                  <button
                    onClick={() => handleDelete(a.id)}
                    disabled={deletingId === a.id}
                    className="text-muted-foreground hover:text-destructive p-1 disabled:opacity-50"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Trash2, Paperclip } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { EvaluationForm } from '@/components/forms/EvaluationForm'
import { deleteEvaluation } from '@/actions/evaluations'
import { EVAL_TYPES } from '@/lib/validations/evaluation'

interface Evaluation {
  id: string
  evalDate: string
  evalType: string
  notes: string | null
  subject: { name: string } | null
  attachment: { id: string; fileName: string } | null
}

interface Subject {
  id: string
  name: string
  isCore: boolean
}

interface Attachment {
  id: string
  fileName: string
}

interface EvaluationsClientProps {
  studentId: string
  evaluations: Evaluation[]
  subjects: Subject[]
  attachments: Attachment[]
}

function evalTypeLabel(value: string) {
  return EVAL_TYPES.find((t) => t.value === value)?.label ?? value
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function EvaluationsClient({
  studentId,
  evaluations,
  subjects,
  attachments,
}: EvaluationsClientProps) {
  const router = useRouter()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    setDeletingId(id)
    const result = await deleteEvaluation(id)
    if (result.error) {
      toast.error(typeof result.error === 'string' ? result.error : 'Delete failed')
    } else {
      toast.success('Evaluation deleted')
      router.refresh()
    }
    setDeletingId(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Evaluations</h1>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
            <SheetHeader className="mb-4">
              <SheetTitle>Record Evaluation</SheetTitle>
            </SheetHeader>
            <EvaluationForm
              studentId={studentId}
              subjects={subjects}
              attachments={attachments}
              onSuccess={() => {
                setSheetOpen(false)
                router.refresh()
              }}
            />
          </SheetContent>
        </Sheet>
      </div>

      {evaluations.length === 0 ? (
        <div className="rounded-lg border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">
            No evaluations recorded yet.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border bg-card divide-y">
          {evaluations.map((ev) => (
            <div key={ev.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{evalTypeLabel(ev.evalType)}</span>
                    {ev.subject && (
                      <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                        {ev.subject.name}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(ev.evalDate)}
                  </p>
                  {ev.notes && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {ev.notes}
                    </p>
                  )}
                  {ev.attachment && (
                    <a
                      href={`/api/files/${ev.attachment.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary mt-1 hover:underline"
                    >
                      <Paperclip className="h-3 w-3" />
                      {ev.attachment.fileName}
                    </a>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(ev.id)}
                  disabled={deletingId === ev.id}
                  className="text-muted-foreground hover:text-destructive p-1 shrink-0 disabled:opacity-50"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

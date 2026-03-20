'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { deleteEntry } from '@/actions/entries'

interface Allocation {
  studentName: string
  allocatedMinutes: number
}

interface Entry {
  id: string
  entryDate: string
  subjectName: string
  isCore: boolean
  totalMinutes: number
  location: string
  notes: string | null
  isShared: boolean
  allocations: Allocation[]
}

interface HistoryClientProps {
  entries: Entry[]
}

function formatMinutes(total: number) {
  const h = Math.floor(total / 60)
  const m = total % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function groupByMonth(entries: Entry[]) {
  const groups: Record<string, Entry[]> = {}
  for (const e of entries) {
    const d = new Date(e.entryDate)
    const key = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    if (!groups[key]) groups[key] = []
    groups[key].push(e)
  }
  return groups
}

export function HistoryClient({ entries }: HistoryClientProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    setDeletingId(id)
    const result = await deleteEntry(id)
    if (result.error) {
      toast.error(typeof result.error === 'string' ? result.error : 'Delete failed')
    } else {
      toast.success('Entry deleted')
      router.refresh()
    }
    setDeletingId(null)
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">No activity logged yet.</p>
      </div>
    )
  }

  const groups = groupByMonth(entries)

  return (
    <div className="space-y-6">
      {Object.entries(groups).map(([month, monthEntries]) => (
        <div key={month}>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            {month}
          </p>
          <div className="rounded-lg border bg-card divide-y">
            {monthEntries.map((entry) => (
              <div key={entry.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{entry.subjectName}</span>
                      {entry.isCore && (
                        <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                          Core
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(entry.entryDate).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                      {' · '}
                      {formatMinutes(entry.totalMinutes)}
                      {' · '}
                      {entry.location === 'home' ? 'At Home' : 'Off-Site'}
                    </p>
                    {entry.isShared ? (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {entry.allocations
                          .map((a) => `${a.studentName} (${formatMinutes(a.allocatedMinutes)})`)
                          .join(', ')}
                      </p>
                    ) : (
                      entry.allocations[0] && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {entry.allocations[0].studentName}
                        </p>
                      )
                    )}
                    {entry.notes && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {entry.notes}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    disabled={deletingId === entry.id}
                    className="text-muted-foreground hover:text-destructive p-1 shrink-0 disabled:opacity-50"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

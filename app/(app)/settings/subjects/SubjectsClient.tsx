'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Lock, Plus, Pencil, Archive } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { createSubject, updateSubject, archiveSubject } from '@/actions/subjects'

interface Subject {
  id: string
  name: string
  isCore: boolean
  isSystem: boolean
  familyId: string | null
}

interface SubjectsClientProps {
  subjects: Subject[]
}

export function SubjectsClient({ subjects }: SubjectsClientProps) {
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newIsCore, setNewIsCore] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editIsCore, setEditIsCore] = useState(false)

  const coreSubjects = subjects.filter((s) => s.isCore)
  const nonCoreSubjects = subjects.filter((s) => !s.isCore)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const result = await createSubject({ name: newName, isCore: newIsCore })
    if (result.error) {
      toast.error(typeof result.error === 'string' ? result.error : 'Failed to add subject')
    } else {
      toast.success('Subject added')
      setNewName('')
      setNewIsCore(false)
      setAdding(false)
      router.refresh()
    }
    setSaving(false)
  }

  function startEdit(subject: Subject) {
    setEditingId(subject.id)
    setEditName(subject.name)
    setEditIsCore(subject.isCore)
  }

  async function handleSaveEdit(id: string) {
    setSaving(true)
    const result = await updateSubject(id, { name: editName, isCore: editIsCore })
    if (result.error) {
      toast.error(typeof result.error === 'string' ? result.error : 'Failed to update')
    } else {
      toast.success('Subject updated')
      setEditingId(null)
      router.refresh()
    }
    setSaving(false)
  }

  async function handleArchive(id: string, name: string) {
    if (!confirm(`Archive "${name}"? It won't appear in new entries.`)) return
    const result = await archiveSubject(id)
    if (result.error) {
      toast.error(typeof result.error === 'string' ? result.error : 'Failed to archive')
    } else {
      toast.success('Subject archived')
      router.refresh()
    }
  }

  function SubjectRow({ subject }: { subject: Subject }) {
    const isEditing = editingId === subject.id

    if (isEditing) {
      return (
        <div className="p-3 rounded-lg border bg-accent/30 space-y-3">
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            autoFocus
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                checked={editIsCore}
                onCheckedChange={setEditIsCore}
                id={`edit-core-${subject.id}`}
              />
              <Label htmlFor={`edit-core-${subject.id}`} className="text-sm">
                Core subject
              </Label>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditingId(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => handleSaveEdit(subject.id)}
                disabled={saving}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="flex items-center gap-3 py-2.5 px-1">
        {subject.isSystem ? (
          <Lock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        ) : (
          <div className="w-3.5" />
        )}
        <span className="flex-1 text-sm">{subject.name}</span>
        {!subject.isSystem && (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => startEdit(subject)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground"
              onClick={() => handleArchive(subject.id, subject.name)}
            >
              <Archive className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/settings"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold flex-1">Subjects</h1>
        <Button size="sm" onClick={() => setAdding(true)} disabled={adding}>
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      {/* Add subject form */}
      {adding && (
        <form
          onSubmit={handleAdd}
          className="mb-6 p-4 rounded-lg border bg-accent/30 space-y-3"
        >
          <p className="text-sm font-medium">New Subject</p>
          <Input
            placeholder="Subject name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
            autoFocus
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                checked={newIsCore}
                onCheckedChange={setNewIsCore}
                id="new-core"
              />
              <Label htmlFor="new-core" className="text-sm">
                Core subject
              </Label>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => { setAdding(false); setNewName('') }}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? 'Adding...' : 'Add'}
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Core subjects */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Core Subjects
          </h2>
          <Badge variant="secondary" className="text-xs">
            {coreSubjects.length}
          </Badge>
        </div>
        <div className="rounded-lg border bg-card divide-y">
          {coreSubjects.map((s) => (
            <SubjectRow key={s.id} subject={s} />
          ))}
        </div>
      </div>

      <Separator className="mb-6" />

      {/* Non-core subjects */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Other Subjects
          </h2>
          <Badge variant="secondary" className="text-xs">
            {nonCoreSubjects.length}
          </Badge>
        </div>
        <div className="rounded-lg border bg-card divide-y">
          {nonCoreSubjects.map((s) => (
            <SubjectRow key={s.id} subject={s} />
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1">
        <Lock className="h-3 w-3" /> System subjects cannot be edited or archived.
      </p>
    </div>
  )
}

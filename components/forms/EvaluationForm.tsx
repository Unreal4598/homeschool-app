'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createEvaluation } from '@/actions/evaluations'
import { EVAL_TYPES } from '@/lib/validations/evaluation'

interface Subject {
  id: string
  name: string
  isCore: boolean
}

interface Attachment {
  id: string
  fileName: string
}

interface EvaluationFormProps {
  studentId: string
  subjects: Subject[]
  attachments: Attachment[]
  onSuccess: () => void
}

function todayString() {
  return new Date().toISOString().split('T')[0]
}

export function EvaluationForm({
  studentId,
  subjects,
  attachments,
  onSuccess,
}: EvaluationFormProps) {
  const [evalDate, setEvalDate] = useState(todayString())
  const [evalType, setEvalType] = useState('')
  const [subjectId, setSubjectId] = useState('none')
  const [notes, setNotes] = useState('')
  const [attachmentId, setAttachmentId] = useState('none')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})

    if (!evalType) {
      toast.error('Select an evaluation type')
      return
    }

    setLoading(true)

    const result = await createEvaluation({
      studentId,
      evalDate,
      evalType,
      subjectId: subjectId !== 'none' ? subjectId : undefined,
      notes: notes || undefined,
      attachmentId: attachmentId !== 'none' ? attachmentId : undefined,
    })

    if (result.error) {
      if (typeof result.error === 'string') {
        toast.error(result.error)
      } else {
        setErrors(result.error as Record<string, string[]>)
      }
      setLoading(false)
      return
    }

    toast.success('Evaluation recorded')
    onSuccess()
    setLoading(false)
  }

  const coreSubjects = subjects.filter((s) => s.isCore)
  const nonCoreSubjects = subjects.filter((s) => !s.isCore)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="evalDate">Date</Label>
        <Input
          id="evalDate"
          type="date"
          value={evalDate}
          onChange={(e) => setEvalDate(e.target.value)}
          max={todayString()}
          required
        />
        {errors.evalDate && (
          <p className="text-xs text-destructive">{errors.evalDate[0]}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Type</Label>
        <Select value={evalType} onValueChange={setEvalType}>
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {EVAL_TYPES.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.evalType && (
          <p className="text-xs text-destructive">{errors.evalType[0]}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>
          Subject <span className="text-muted-foreground text-xs">(optional)</span>
        </Label>
        <Select value={subjectId} onValueChange={setSubjectId}>
          <SelectTrigger>
            <SelectValue placeholder="All subjects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">All subjects</SelectItem>
            {coreSubjects.length > 0 && (
              <SelectGroup>
                <SelectLabel>Core</SelectLabel>
                {coreSubjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            )}
            {nonCoreSubjects.length > 0 && (
              <SelectGroup>
                <SelectLabel>Non-Core</SelectLabel>
                {nonCoreSubjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            )}
          </SelectContent>
        </Select>
      </div>

      {attachments.length > 0 && (
        <div className="space-y-1.5">
          <Label>
            Attach File <span className="text-muted-foreground text-xs">(optional)</span>
          </Label>
          <Select value={attachmentId} onValueChange={setAttachmentId}>
            <SelectTrigger>
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {attachments.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.fileName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="notes">
          Notes <span className="text-muted-foreground text-xs">(optional)</span>
        </Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What was covered or assessed?"
          rows={3}
          maxLength={1000}
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Saving...' : 'Record Evaluation'}
      </Button>
    </form>
  )
}

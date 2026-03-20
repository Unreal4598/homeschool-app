'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ChevronDown, ChevronUp } from 'lucide-react'
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
import { useFamily } from '@/components/providers/FamilyProvider'
import { createEntry } from '@/actions/entries'

interface Subject {
  id: string
  name: string
  isCore: boolean
}

interface LogEntryFormProps {
  subjects: Subject[]
}

function todayString() {
  return new Date().toISOString().split('T')[0]
}

function computeEqualAllocations(
  studentIds: string[],
  totalMinutes: number
): { studentId: string; allocatedMinutes: number; isOverride: boolean }[] {
  if (studentIds.length === 0 || totalMinutes === 0) return []
  // Each student gets the full duration — if two kids study together for 1hr,
  // each earns 1hr toward their compliance totals.
  return studentIds.map((id) => ({
    studentId: id,
    allocatedMinutes: totalMinutes,
    isOverride: false,
  }))
}

export function LogEntryForm({ subjects }: LogEntryFormProps) {
  const router = useRouter()
  const { students } = useFamily()

  const [entryDate, setEntryDate] = useState(todayString())
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [subjectId, setSubjectId] = useState('')
  const [hours, setHours] = useState('0')
  const [mins, setMins] = useState('0')
  const [location, setLocation] = useState<'home' | 'off_site'>('home')
  const [notesOpen, setNotesOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [allocationMode, setAllocationMode] = useState<'equal' | 'custom'>('equal')
  const [customMins, setCustomMins] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  const totalMinutes = parseInt(hours) * 60 + parseInt(mins)

  const equalAllocations = useMemo(
    () => computeEqualAllocations(selectedStudents, totalMinutes),
    [selectedStudents, totalMinutes]
  )

  const coreSubjects = subjects.filter((s) => s.isCore)
  const nonCoreSubjects = subjects.filter((s) => !s.isCore)

  function toggleStudent(id: string) {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  function formatMins(m: number) {
    if (m < 60) return `${m}m`
    const h = Math.floor(m / 60)
    const rem = m % 60
    return rem === 0 ? `${h}h` : `${h}h ${rem}m`
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})

    if (selectedStudents.length === 0) {
      toast.error('Select at least one student')
      return
    }
    if (!subjectId) {
      toast.error('Select a subject')
      return
    }
    if (totalMinutes < 1) {
      toast.error('Duration must be at least 1 minute')
      return
    }

    let studentAllocations
    if (allocationMode === 'custom') {
      const invalid = selectedStudents.some((id) => (parseInt(customMins[id] ?? '0') || 0) < 1)
      if (invalid) {
        toast.error('Each student must have at least 1 minute')
        return
      }
      studentAllocations = selectedStudents.map((id) => ({
        studentId: id,
        allocatedMinutes: parseInt(customMins[id] ?? '0') || 0,
        isOverride: true,
      }))
    } else {
      studentAllocations = equalAllocations
    }

    setLoading(true)
    const result = await createEntry({
      entryDate,
      subjectId,
      totalMinutes,
      location,
      notes: notes || undefined,
      studentAllocations,
    })

    if (result.error) {
      if (typeof result.error === 'string') {
        toast.error(result.error)
      } else {
        setErrors(result.error as Record<string, string[]>)
        toast.error('Please fix the errors below')
      }
      setLoading(false)
      return
    }

    toast.success('Activity logged')
    router.push('/dashboard')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Date */}
      <div className="space-y-1.5">
        <Label htmlFor="entryDate">Date</Label>
        <Input
          id="entryDate"
          type="date"
          value={entryDate}
          onChange={(e) => setEntryDate(e.target.value)}
          max={todayString()}
          required
        />
        {errors.entryDate && (
          <p className="text-xs text-destructive">{errors.entryDate[0]}</p>
        )}
      </div>

      {/* Students */}
      <div className="space-y-1.5">
        <Label>Student{students.length !== 1 ? 's' : ''}</Label>
        <div className="flex flex-wrap gap-2">
          {students.map((s) => {
            const selected = selectedStudents.includes(s.id)
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleStudent(s.id)}
                className={`rounded-full px-3 py-1 text-sm border transition-colors ${
                  selected
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-foreground border-input hover:bg-accent'
                }`}
              >
                {s.firstName}
              </button>
            )
          })}
        </div>
        {students.length === 0 && (
          <p className="text-xs text-muted-foreground">No active students. Add a student first.</p>
        )}
      </div>

      {/* Subject */}
      <div className="space-y-1.5">
        <Label>Subject</Label>
        <Select value={subjectId} onValueChange={setSubjectId}>
          <SelectTrigger>
            <SelectValue placeholder="Select subject" />
          </SelectTrigger>
          <SelectContent>
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
        {errors.subjectId && (
          <p className="text-xs text-destructive">{errors.subjectId[0]}</p>
        )}
      </div>

      {/* Duration */}
      <div className="space-y-1.5">
        <Label>Duration</Label>
        <div className="flex gap-2">
          <div className="flex-1">
            <Select value={hours} onValueChange={setHours}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 13 }, (_, i) => (
                  <SelectItem key={i} value={String(i)}>
                    {i}h
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Select value={mins} onValueChange={setMins}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                  <SelectItem key={m} value={String(m)}>
                    {m}m
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {totalMinutes > 0 && (
          <p className="text-xs text-muted-foreground">Total: {formatMins(totalMinutes)}</p>
        )}
        {errors.totalMinutes && (
          <p className="text-xs text-destructive">{errors.totalMinutes[0]}</p>
        )}
      </div>

      {/* Location */}
      <div className="space-y-1.5">
        <Label>Location</Label>
        <div className="flex rounded-md border overflow-hidden">
          <button
            type="button"
            onClick={() => setLocation('home')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              location === 'home'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-foreground hover:bg-accent'
            }`}
          >
            At Home
          </button>
          <button
            type="button"
            onClick={() => setLocation('off_site')}
            className={`flex-1 py-2 text-sm font-medium border-l transition-colors ${
              location === 'off_site'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-foreground hover:bg-accent'
            }`}
          >
            Off-Site
          </button>
        </div>
      </div>

      {/* Allocation panel — only when students + minutes selected */}
      {selectedStudents.length > 1 && totalMinutes > 0 && (
        <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Time Allocation</span>
            <div className="flex rounded-md border overflow-hidden text-xs">
              <button
                type="button"
                onClick={() => setAllocationMode('equal')}
                className={`px-2 py-1 transition-colors ${
                  allocationMode === 'equal'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background text-foreground hover:bg-accent'
                }`}
              >
                Equal
              </button>
              <button
                type="button"
                onClick={() => setAllocationMode('custom')}
                className={`px-2 py-1 border-l transition-colors ${
                  allocationMode === 'custom'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background text-foreground hover:bg-accent'
                }`}
              >
                Custom
              </button>
            </div>
          </div>

          {allocationMode === 'equal' ? (
            <p className="text-sm text-muted-foreground">
              Each student earns {formatMins(totalMinutes)} — full duration credited to all.
            </p>
          ) : (
            <div className="space-y-2">
              {selectedStudents.map((id) => {
                const student = students.find((s) => s.id === id)
                return (
                  <div key={id} className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground w-20 shrink-0">
                      {student?.firstName}
                    </span>
                    <Input
                      type="number"
                      min={1}
                      value={customMins[id] ?? ''}
                      onChange={(e) =>
                        setCustomMins((prev) => ({ ...prev, [id]: e.target.value }))
                      }
                      placeholder="min"
                      className="h-8 text-sm"
                    />
                    <span className="text-xs text-muted-foreground">min</span>
                  </div>
                )
              })}
              <p className="text-xs text-muted-foreground">
                Enter the actual minutes each student participated.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Notes (collapsible) */}
      <div>
        <button
          type="button"
          onClick={() => setNotesOpen((v) => !v)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {notesOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
          Notes (optional)
        </button>
        {notesOpen && (
          <div className="mt-2">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did you cover today?"
              rows={3}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {notes.length}/1000
            </p>
          </div>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Saving...' : 'Log Activity'}
      </Button>
    </form>
  )
}

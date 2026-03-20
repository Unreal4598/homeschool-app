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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createStudent, updateStudent } from '@/actions/students'
import { GRADE_LEVELS } from '@/lib/validations/student'
import type { FamilyStudent } from '@/components/providers/FamilyProvider'

interface StudentFormProps {
  student?: FamilyStudent
  onSuccess: () => void
}

export function StudentForm({ student, onSuccess }: StudentFormProps) {
  const [firstName, setFirstName] = useState(student?.firstName ?? '')
  const [lastName, setLastName] = useState(student?.lastName ?? '')
  const [dateOfBirth, setDateOfBirth] = useState(
    student?.dateOfBirth
      ? new Date(student.dateOfBirth).toISOString().split('T')[0]
      : ''
  )
  const [gradeLevel, setGradeLevel] = useState(student?.gradeLevel ?? '')
  const [notes, setNotes] = useState(student?.notes ?? '')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    const data = {
      firstName,
      lastName,
      dateOfBirth,
      gradeLevel: gradeLevel || undefined,
      notes: notes || undefined,
    }

    const result = student
      ? await updateStudent(student.id, data)
      : await createStudent(data)

    if (result.error) {
      if (typeof result.error === 'string') {
        toast.error(result.error)
      } else {
        setErrors(result.error as Record<string, string[]>)
      }
    } else {
      toast.success(student ? 'Student updated' : 'Student added')
      onSuccess()
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            autoFocus
          />
          {errors.firstName && (
            <p className="text-xs text-destructive">{errors.firstName[0]}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
          {errors.lastName && (
            <p className="text-xs text-destructive">{errors.lastName[0]}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="dob">Date of Birth</Label>
        <Input
          id="dob"
          type="date"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
          required
          max={new Date().toISOString().split('T')[0]}
        />
        {errors.dateOfBirth && (
          <p className="text-xs text-destructive">{errors.dateOfBirth[0]}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Grade Level <span className="text-muted-foreground text-xs">(optional)</span></Label>
        <Select value={gradeLevel} onValueChange={setGradeLevel}>
          <SelectTrigger>
            <SelectValue placeholder="Select grade" />
          </SelectTrigger>
          <SelectContent>
            {GRADE_LEVELS.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">
          Notes <span className="text-muted-foreground text-xs">(optional)</span>
        </Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any notes about this student..."
          rows={3}
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Saving...' : student ? 'Save Changes' : 'Add Student'}
      </Button>
    </form>
  )
}

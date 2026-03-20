'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Users, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { StudentForm } from '@/components/forms/StudentForm'
import { EmptyState } from '@/components/shared/EmptyState'
import { useFamily } from '@/components/providers/FamilyProvider'

function getAge(dobIso: string): number {
  const dob = new Date(dobIso)
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const m = today.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
  return age
}

export default function StudentsPage() {
  const { students } = useFamily()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Students</h1>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom">
            <SheetHeader className="mb-6">
              <SheetTitle>Add Student</SheetTitle>
            </SheetHeader>
            <StudentForm
              onSuccess={() => {
                setOpen(false)
                router.refresh()
              }}
            />
          </SheetContent>
        </Sheet>
      </div>

      {students.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No students yet"
          description="Add your first student to start tracking hours."
          action={
            <Button size="sm" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Student
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {students.map((student) => (
            <Link key={student.id} href={`/students/${student.id}`}>
              <div className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary flex-shrink-0">
                  {student.firstName[0]}
                  {student.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {student.firstName} {student.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {student.gradeLevel
                      ? `Grade ${student.gradeLevel}`
                      : 'Grade not set'}{' '}
                    · Age {getAge(student.dateOfBirth)}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

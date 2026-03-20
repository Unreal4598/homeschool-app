'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { StudentForm } from '@/components/forms/StudentForm'
import type { FamilyStudent } from '@/components/providers/FamilyProvider'

export function StudentDetailClient({ student }: { student: FamilyStudent }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <Pencil className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader className="mb-6">
          <SheetTitle>Edit Student</SheetTitle>
        </SheetHeader>
        <StudentForm
          student={student}
          onSuccess={() => {
            setOpen(false)
            router.refresh()
          }}
        />
      </SheetContent>
    </Sheet>
  )
}

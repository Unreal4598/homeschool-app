'use client'

import { createContext, useContext } from 'react'

export interface FamilyStudent {
  id: string
  firstName: string
  lastName: string
  dateOfBirth: string // ISO string
  gradeLevel: string | null
  notes: string | null
  isActive: boolean
  familyId: string
}

export interface FamilyData {
  id: string
  name: string
  state: string
  evalIntervalDays: number
}

interface FamilyContextType {
  family: FamilyData
  students: FamilyStudent[]
  userId: string
}

const FamilyContext = createContext<FamilyContextType | null>(null)

export function FamilyProvider({
  family,
  students,
  userId,
  children,
}: FamilyContextType & { children: React.ReactNode }) {
  return (
    <FamilyContext.Provider value={{ family, students, userId }}>
      {children}
    </FamilyContext.Provider>
  )
}

export function useFamily() {
  const ctx = useContext(FamilyContext)
  if (!ctx) throw new Error('useFamily must be used within FamilyProvider')
  return ctx
}

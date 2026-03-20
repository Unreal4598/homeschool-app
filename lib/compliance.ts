export interface SchoolYear {
  start: Date
  end: Date
  label: string // e.g. "2024–25"
}

export function getSchoolYear(date: Date): SchoolYear {
  const year = date.getFullYear()
  const month = date.getMonth() // 0-indexed

  // School year starts July 1 (month 6)
  const startYear = month >= 6 ? year : year - 1
  const endYear = startYear + 1

  return {
    start: new Date(startYear, 6, 1), // July 1
    end: new Date(endYear, 5, 30, 23, 59, 59, 999), // June 30 end of day
    label: `${startYear}–${String(endYear).slice(2)}`,
  }
}

export interface AllocationForCompliance {
  allocatedMinutes: number
  entry: {
    location: string
    subject: {
      isCore: boolean
    }
  }
}

export interface ComplianceData {
  totalMinutes: number
  coreMinutes: number
  atHomeCoreMinutes: number
  totalHours: number
  coreHours: number
  atHomeCoreHours: number
  totalPct: number
  corePct: number
  atHomeCorePct: number
}

const TARGETS = {
  total: 1000 * 60,      // 1,000 hours in minutes
  core: 600 * 60,        // 600 hours
  atHomeCore: 400 * 60,  // 400 hours
}

export function calculateCompliance(
  allocations: AllocationForCompliance[]
): ComplianceData {
  let totalMinutes = 0
  let coreMinutes = 0
  let atHomeCoreMinutes = 0

  for (const a of allocations) {
    totalMinutes += a.allocatedMinutes
    if (a.entry.subject.isCore) {
      coreMinutes += a.allocatedMinutes
      if (a.entry.location === 'home') {
        atHomeCoreMinutes += a.allocatedMinutes
      }
    }
  }

  return {
    totalMinutes,
    coreMinutes,
    atHomeCoreMinutes,
    totalHours: Math.floor(totalMinutes / 60),
    coreHours: Math.floor(coreMinutes / 60),
    atHomeCoreHours: Math.floor(atHomeCoreMinutes / 60),
    totalPct: Math.min(100, Math.round((totalMinutes / TARGETS.total) * 100)),
    corePct: Math.min(100, Math.round((coreMinutes / TARGETS.core) * 100)),
    atHomeCorePct: Math.min(100, Math.round((atHomeCoreMinutes / TARGETS.atHomeCore) * 100)),
  }
}

export function isAgeExempt(dateOfBirth: Date): boolean {
  const today = new Date()
  const age = today.getFullYear() - dateOfBirth.getFullYear()
  const hadBirthday =
    today.getMonth() > dateOfBirth.getMonth() ||
    (today.getMonth() === dateOfBirth.getMonth() &&
      today.getDate() >= dateOfBirth.getDate())
  return age > 16 || (age === 16 && hadBirthday)
}

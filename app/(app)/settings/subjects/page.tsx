import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { SubjectsClient } from './SubjectsClient'

export default async function SubjectsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const membership = await db.familyMembership.findFirst({
    where: { userId: user!.id },
    select: { familyId: true },
  })

  const subjects = await db.subject.findMany({
    where: {
      OR: [
        { familyId: null, isSystem: true },
        { familyId: membership!.familyId },
      ],
    },
    orderBy: { sortOrder: 'asc' },
  })

  const serialized = subjects.map((s) => ({
    id: s.id,
    name: s.name,
    isCore: s.isCore,
    isSystem: s.isSystem,
    familyId: s.familyId,
  }))

  return <SubjectsClient subjects={serialized} />
}

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { FamilySettingsClient } from './FamilySettingsClient'

export default async function FamilySettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const membership = await db.familyMembership.findFirst({
    where: { userId: user!.id },
    include: { family: true },
  })

  const family = membership!.family

  const members = await db.familyMembership.findMany({
    where: { familyId: family.id },
    include: { user: { select: { email: true } } },
    orderBy: { createdAt: 'asc' },
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/settings"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold">Family Settings</h1>
      </div>

      <FamilySettingsClient
        familyId={family.id}
        initialName={family.name}
        initialEvalIntervalDays={family.evalIntervalDays}
        members={members.map((m) => ({
          id: m.id,
          email: m.user.email,
          role: m.role,
          joinedAt: m.joinedAt?.toISOString() ?? null,
        }))}
        appUrl={appUrl}
      />
    </div>
  )
}

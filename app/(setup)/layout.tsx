import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

// Auth check only — no family requirement (used for onboarding)
export default async function SetupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return <>{children}</>
}

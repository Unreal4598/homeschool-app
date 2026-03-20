'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import { BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { joinFamily } from '@/actions/family'

export default function JoinFamilyPage() {
  const router = useRouter()
  const params = useParams()
  const familyId = params.familyId as string
  const [loading, setLoading] = useState(false)

  async function handleJoin() {
    setLoading(true)
    const result = await joinFamily(familyId)
    if (result.error) {
      toast.error(result.error)
      setLoading(false)
      return
    }
    toast.success('Welcome to the family!')
    router.push('/dashboard')
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-sm w-full space-y-6 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-primary/10 p-4">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
        </div>

        <div>
          <h1 className="text-xl font-bold">You&apos;ve been invited</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Click below to join the family and access the homeschool records.
          </p>
        </div>

        <Button className="w-full" onClick={handleJoin} disabled={loading}>
          {loading ? 'Joining...' : 'Join Family'}
        </Button>

        <p className="text-xs text-muted-foreground">
          Already a member of a different family? Contact your family admin.
        </p>
      </div>
    </main>
  )
}

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { sendMagicLink } from '@/actions/auth'
import { BookOpen, CheckCircle } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = await sendMagicLink(email)

    if (result?.error) {
      setError(result.error)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm text-center space-y-4">
          <CheckCircle className="mx-auto h-12 w-12 text-primary" />
          <h1 className="text-2xl font-bold">Check your email</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            We sent a magic link to <strong>{email}</strong>.
            <br />
            Click the link to sign in — no password needed.
          </p>
          <button
            onClick={() => { setSent(false); setEmail('') }}
            className="text-sm text-muted-foreground underline underline-offset-4"
          >
            Use a different email
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo / branding */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="rounded-full bg-primary/10 p-3">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Homeschool Tracker</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Missouri compliance recordkeeping
            </p>
          </div>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Sending...' : 'Send magic link'}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          No password needed. We&apos;ll email you a secure sign-in link.
        </p>
      </div>
    </div>
  )
}

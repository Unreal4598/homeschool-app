'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateFamily } from '@/actions/family'

interface Member {
  id: string
  email: string
  role: string
  joinedAt: string | null
}

interface FamilySettingsClientProps {
  familyId: string
  initialName: string
  initialEvalIntervalDays: number
  members: Member[]
  appUrl: string
}

export function FamilySettingsClient({
  familyId,
  initialName,
  initialEvalIntervalDays,
  members,
  appUrl,
}: FamilySettingsClientProps) {
  const [name, setName] = useState(initialName)
  const [evalIntervalDays, setEvalIntervalDays] = useState(String(initialEvalIntervalDays))
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [copied, setCopied] = useState(false)

  const joinUrl = `${appUrl}/join/${familyId}`

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})
    setLoading(true)

    const result = await updateFamily({
      name,
      evalIntervalDays: parseInt(evalIntervalDays),
    })

    if (result.error) {
      if (typeof result.error === 'string') {
        toast.error(result.error)
      } else {
        setErrors(result.error as Record<string, string[]>)
      }
    } else {
      toast.success('Family settings saved')
    }

    setLoading(false)
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(joinUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Settings form */}
      <form onSubmit={handleSubmit} className="rounded-lg border bg-card p-4 space-y-4">
        <h2 className="text-sm font-semibold">Family Details</h2>

        <div className="space-y-1.5">
          <Label htmlFor="name">Family Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name[0]}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="evalInterval">Evaluation Interval (days)</Label>
          <Input
            id="evalInterval"
            type="number"
            min={7}
            max={365}
            value={evalIntervalDays}
            onChange={(e) => setEvalIntervalDays(e.target.value)}
            required
          />
          <p className="text-xs text-muted-foreground">
            How often to conduct evaluations. Default: 42 days (~every 6 weeks).
          </p>
          {errors.evalIntervalDays && (
            <p className="text-xs text-destructive">{errors.evalIntervalDays[0]}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>

      {/* Members list */}
      <div className="rounded-lg border bg-card p-4">
        <h2 className="text-sm font-semibold mb-3">Family Members</h2>
        <div className="space-y-2">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between">
              <div>
                <p className="text-sm">{m.email}</p>
                {m.joinedAt && (
                  <p className="text-xs text-muted-foreground">
                    Joined{' '}
                    {new Date(m.joinedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                )}
              </div>
              <span className="text-xs text-muted-foreground capitalize">{m.role}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Invite */}
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <div>
          <h2 className="text-sm font-semibold">Invite a Member</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Share this link. Anyone who opens it and logs in will join your family.
          </p>
        </div>
        <div className="flex gap-2">
          <Input value={joinUrl} readOnly className="text-xs" />
          <Button type="button" variant="outline" size="sm" onClick={handleCopy} className="shrink-0">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}

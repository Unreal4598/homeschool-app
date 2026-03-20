import type { ComplianceData } from '@/lib/compliance'

interface Bar {
  label: string
  hours: number
  target: number
  pct: number
}

interface ComplianceCardProps {
  data: ComplianceData
  exempt?: boolean
  schoolYearLabel?: string
}

export function ComplianceCard({ data, exempt, schoolYearLabel }: ComplianceCardProps) {
  if (exempt) {
    return (
      <div className="rounded-lg border bg-card p-4">
        <h2 className="text-sm font-semibold mb-1">Compliance Progress</h2>
        <p className="text-xs text-muted-foreground">
          Age 16+ — exempt from hour tracking (RSMo 167.012)
        </p>
      </div>
    )
  }

  const bars: Bar[] = [
    { label: 'Total Hours', hours: data.totalHours, target: 1000, pct: data.totalPct },
    { label: 'Core Hours', hours: data.coreHours, target: 600, pct: data.corePct },
    { label: 'At-Home Core', hours: data.atHomeCoreHours, target: 400, pct: data.atHomeCorePct },
  ]

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold">Compliance Progress</h2>
        {schoolYearLabel && (
          <span className="text-xs text-muted-foreground">{schoolYearLabel}</span>
        )}
      </div>
      <div className="space-y-3">
        {bars.map(({ label, hours, target, pct }) => (
          <div key={label}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">{label}</span>
              <span
                className={`text-xs tabular-nums ${
                  pct >= 100 ? 'text-green-600 font-medium' : 'text-muted-foreground'
                }`}
              >
                {hours.toLocaleString()} / {target.toLocaleString()} hrs
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  pct >= 100 ? 'bg-green-500' : 'bg-primary'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

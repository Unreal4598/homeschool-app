import { BottomNav } from './BottomNav'

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <main className="pb-20">{children}</main>
      <BottomNav />
    </div>
  )
}

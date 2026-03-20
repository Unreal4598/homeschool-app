import Link from 'next/link'
import { BookOpen, FileText, Users, ChevronRight } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-6">Settings</h1>

      <div className="space-y-2">
        <Link href="/settings/subjects">
          <div className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer">
            <div className="rounded-md bg-primary/10 p-2">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Subjects</p>
              <p className="text-sm text-muted-foreground">
                Manage core and non-core subjects
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </Link>

        <Link href="/reports">
          <div className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer">
            <div className="rounded-md bg-primary/10 p-2">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Reports</p>
              <p className="text-sm text-muted-foreground">
                Download PDF reports for compliance
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </Link>

        <Link href="/settings/family">
          <div className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer">
            <div className="rounded-md bg-primary/10 p-2">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Family</p>
              <p className="text-sm text-muted-foreground">
                Name, eval interval, invite members
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </Link>
      </div>
    </div>
  )
}

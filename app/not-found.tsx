import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-sm">
        <div className="flex justify-center">
          <div className="rounded-full bg-muted p-4">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
        <div>
          <h1 className="text-xl font-bold">Page not found</h1>
          <p className="text-sm text-muted-foreground mt-1">
            This page doesn&apos;t exist or was moved.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    </main>
  )
}

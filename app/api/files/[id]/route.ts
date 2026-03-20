import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const membership = await db.familyMembership.findFirst({
    where: { userId: user.id },
    select: { familyId: true },
  })

  if (!membership) {
    return new NextResponse('No family found', { status: 403 })
  }

  const attachment = await db.attachment.findFirst({
    where: { id, familyId: membership.familyId },
  })

  if (!attachment) {
    return new NextResponse('Not found', { status: 404 })
  }

  const { data, error } = await supabase.storage
    .from('attachments')
    .createSignedUrl(attachment.filePath, 60 * 60) // 1 hour

  if (error || !data?.signedUrl) {
    return new NextResponse('Could not generate download URL', { status: 500 })
  }

  return NextResponse.redirect(data.signedUrl)
}

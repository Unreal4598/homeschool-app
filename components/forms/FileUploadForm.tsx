'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Paperclip, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { createAttachment } from '@/actions/attachments'
import { useFamily } from '@/components/providers/FamilyProvider'
import { ACCEPTED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from '@/lib/validations/attachment'

interface FileUploadFormProps {
  studentId: string
  onSuccess: () => void
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_')
}

export function FileUploadForm({ studentId, onSuccess }: FileUploadFormProps) {
  const { family } = useFamily()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (!selected) return

    if (!ACCEPTED_MIME_TYPES.includes(selected.type)) {
      toast.error('File type not supported. Use images, PDF, or Word documents.')
      return
    }
    if (selected.size > MAX_FILE_SIZE_BYTES) {
      toast.error('File exceeds 10 MB limit.')
      return
    }

    setFile(selected)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) {
      toast.error('Please select a file.')
      return
    }

    setLoading(true)

    const supabase = createClient()
    const sanitized = sanitizeFileName(file.name)
    const filePath = `${family.id}/${studentId}/${Date.now()}-${sanitized}`

    const { error: uploadError } = await supabase.storage
      .from('attachments')
      .upload(filePath, file, { contentType: file.type })

    if (uploadError) {
      toast.error(`Upload failed: ${uploadError.message}`)
      setLoading(false)
      return
    }

    const result = await createAttachment({
      studentId,
      fileName: file.name,
      filePath,
      fileSize: file.size,
      mimeType: file.type,
      notes: notes || undefined,
      uploadDate: new Date().toISOString().split('T')[0],
    })

    if (result.error) {
      // DB record failed — clean up the orphaned storage file
      await supabase.storage.from('attachments').remove([filePath])
      toast.error(typeof result.error === 'string' ? result.error : 'Failed to save file.')
      setLoading(false)
      return
    }

    toast.success('File uploaded')
    setFile(null)
    setNotes('')
    if (inputRef.current) inputRef.current.value = ''
    onSuccess()
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Drop zone */}
      <div
        className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-accent transition-colors"
        onClick={() => inputRef.current?.click()}
      >
        {file ? (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-left">
              <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate max-w-[200px]">{file.name}</span>
              <span className="text-muted-foreground shrink-0">{formatBytes(file.size)}</span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setFile(null)
                if (inputRef.current) inputRef.current.value = ''
              }}
              className="text-muted-foreground hover:text-foreground ml-2"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            <Paperclip className="h-5 w-5 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Tap to select a file
            </p>
            <p className="text-xs text-muted-foreground">
              Images, PDF, Word · max 10 MB
            </p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_MIME_TYPES.join(',')}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {file && (
        <div className="space-y-1.5">
          <Label htmlFor="notes">
            Notes <span className="text-muted-foreground text-xs">(optional)</span>
          </Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What is this file?"
            rows={2}
            maxLength={500}
          />
        </div>
      )}

      {file && (
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Uploading...' : 'Upload File'}
        </Button>
      )}
    </form>
  )
}

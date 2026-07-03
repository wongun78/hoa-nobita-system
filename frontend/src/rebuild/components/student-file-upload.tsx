import { useCallback, useMemo, useRef, useState } from 'react'
import { UploadCloud, FileText, X, CheckCircle2, AlertCircle } from 'lucide-react'
import { clsx } from 'clsx'
import { api } from '../core/api'
import type { FileItem } from '../core/types'
import { Button } from '../layout/ui'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ACCEPTED_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
  'video/mp4',
])

const ACCEPTED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.mp4']

type UploadState = 'idle' | 'ready' | 'uploading' | 'uploaded' | 'error'

type StudentFileUploadProps = Readonly<{
  value?: FileItem | null
  onUploaded: (file: FileItem | null) => void
  disabled?: boolean
}>

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function validateFile(file: File) {
  if (file.size > MAX_FILE_SIZE) return 'Tệp tối đa 10MB.'
  if (!ACCEPTED_TYPES.has(file.type)) return 'Chỉ hỗ trợ PDF, DOC, DOCX, PNG, JPG/JPEG, MP4.'
  return null
}

export function StudentFileUpload({ value, onUploaded, disabled }: StudentFileUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [state, setState] = useState<UploadState>(value ? 'uploaded' : 'idle')
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const previewName = value?.originalFileName ?? selectedFile?.name
  const previewSize = value?.fileSize ?? selectedFile?.size

  const helperText = useMemo(() => ACCEPTED_EXTENSIONS.join(', ').toUpperCase(), [])

  const chooseFile = useCallback((file: File | null) => {
    if (!file) return
    const validationError = validateFile(file)
    if (validationError) {
      setSelectedFile(null)
      setState('error')
      setError(validationError)
      onUploaded(null)
      return
    }
    setSelectedFile(file)
    setState('ready')
    setProgress(0)
    setError(null)
    onUploaded(null)
  }, [onUploaded])

  const uploadSelected = useCallback(async () => {
    if (!selectedFile || disabled) return
    setState('uploading')
    setError(null)
    setProgress(18)
    const timer = globalThis.setInterval(() => {
      setProgress((current) => Math.min(current + 18, 88))
    }, 220)
    try {
      const uploaded = await api.uploadFile(selectedFile)
      globalThis.clearInterval(timer)
      setProgress(100)
      setState('uploaded')
      onUploaded(uploaded)
    } catch (uploadError) {
      globalThis.clearInterval(timer)
      setState('error')
      setProgress(0)
      setError(uploadError instanceof Error ? uploadError.message : 'Không thể tải tệp lên.')
      onUploaded(null)
    }
  }, [disabled, onUploaded, selectedFile])

  const clearFile = useCallback(() => {
    setSelectedFile(null)
    setState('idle')
    setError(null)
    setProgress(0)
    onUploaded(null)
    if (inputRef.current) inputRef.current.value = ''
  }, [onUploaded])

  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={disabled || state === 'uploading'}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setIsDragging(false)
          chooseFile(event.dataTransfer.files.item(0))
        }}
        className={clsx(
          'flex min-h-36 w-full flex-col items-center justify-center rounded-3xl border border-dashed p-5 text-center transition focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60',
          isDragging ? 'border-indigo-300 bg-indigo-50' : 'border-sky-200 bg-gradient-to-br from-white to-sky-50/70 hover:bg-sky-50'
        )}
        aria-label="Chọn hoặc kéo thả tệp bài làm"
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={ACCEPTED_EXTENSIONS.join(',')}
          onChange={(event) => chooseFile(event.target.files?.item(0) ?? null)}
        />
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-pink-100 text-indigo-600">
          <UploadCloud size={24} />
        </div>
        <div className="mt-3 text-sm font-black text-slate-900">Kéo thả tệp hoặc bấm để chọn</div>
        <div className="mt-1 text-xs leading-5 text-slate-500">{helperText} · tối đa 10MB</div>
      </button>

      {previewName && (
        <div className="rounded-3xl border border-sky-100 bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
              <FileText size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold text-slate-950">{previewName}</div>
              <div className="mt-1 text-xs text-slate-500">{previewSize ? formatBytes(previewSize) : 'Đã tải lên'}</div>
              {state === 'uploading' && (
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${progress}%` }} />
                </div>
              )}
              {state === 'uploaded' && (
                <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">
                  <CheckCircle2 size={14} /> Đã sẵn sàng
                </div>
              )}
            </div>
            <button type="button" className="flex min-h-11 min-w-11 items-center justify-center rounded-2xl text-slate-500 hover:bg-slate-50" onClick={clearFile} aria-label="Gỡ tệp đã chọn">
              <X size={18} />
            </button>
          </div>
          {state === 'ready' && (
            <Button type="button" className="mt-3 min-h-11 w-full" onClick={uploadSelected} disabled={disabled}>
              Tải tệp lên
            </Button>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          <AlertCircle className="mt-0.5 shrink-0" size={16} />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}

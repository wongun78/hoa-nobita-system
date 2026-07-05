import { useCallback, useRef, useState } from 'react'
import { Plus, X, FileText, Loader2 } from 'lucide-react'
import { api } from '../core/api'
import type { FileItem } from '../core/types'

type MultiFileUploadProps = Readonly<{
  value?: FileItem[]
  onChange: (files: FileItem[]) => void
  disabled?: boolean
  maxFiles?: number
}>

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

const ACCEPTED_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.txt', '.csv', '.zip', '.rar', '.7z',
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp',
  '.mp3', '.wav', '.ogg',
  '.mp4', '.webm', '.mov', '.avi',
]

export function MultiFileUpload({ value = [], onChange, disabled, maxFiles = 10 }: MultiFileUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadingName, setUploadingName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const canAdd = value.length < maxFiles && !disabled && !uploading

  const uploadFile = useCallback(async (file: File) => {
    if (!canAdd) return
    setUploading(true)
    setUploadingName(file.name)
    setError(null)
    try {
      const uploaded = await api.uploadFile(file)
      onChange([...value, uploaded])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải tệp.')
    } finally {
      setUploading(false)
      setUploadingName('')
      if (inputRef.current) inputRef.current.value = ''
    }
  }, [canAdd, onChange, value])

  const removeFile = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div
      className="rounded-2xl border border-dashed transition-colors"
      style={{
        borderColor: isDragging ? '#818cf8' : error ? '#fda4af' : '#e0e7ff',
        backgroundColor: isDragging ? '#eef2ff' : '#fafbff',
      }}
      onDragOver={(e) => { e.preventDefault(); if (canAdd) setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setIsDragging(false)
        const file = e.dataTransfer.files.item(0)
        if (file && canAdd) uploadFile(file)
      }}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={ACCEPTED_EXTENSIONS.join(',')}
        onChange={(e) => { const f = e.target.files?.item(0); if (f) uploadFile(f) }}
      />

      {/* Chip list */}
      {(value.length > 0 || uploading) && (
        <div className="flex flex-wrap gap-2 p-3 pb-0">
          {value.map((f, i) => (
            <span
              key={f.id}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-sky-100 pl-2.5 pr-1.5 py-1.5 text-xs font-bold text-slate-700 shadow-sm group"
            >
              <FileText size={13} className="shrink-0 text-indigo-400" />
              <span className="max-w-[140px] truncate">{f.originalFileName}</span>
              <span className="text-slate-400 font-normal">{formatBytes(f.fileSize ?? 0)}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="ml-0.5 rounded-md p-0.5 text-slate-300 opacity-0 group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-500 transition"
                  aria-label="Xóa"
                >
                  <X size={12} />
                </button>
              )}
            </span>
          ))}
          {uploading && (
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 border border-indigo-100 px-2.5 py-1.5 text-xs font-bold text-indigo-600">
              <Loader2 size={13} className="animate-spin" />
              <span className="max-w-[120px] truncate">{uploadingName}</span>
            </span>
          )}
        </div>
      )}

      {/* Inline add button */}
      {canAdd && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full items-center gap-2 px-3 py-2.5 text-xs font-bold text-indigo-500 hover:text-indigo-700 transition"
        >
          <Plus size={14} />
          {value.length === 0 ? 'Chọn tệp đính kèm hoặc kéo thả vào đây' : `Thêm tệp (${value.length}/${maxFiles})`}
        </button>
      )}

      {/* Error */}
      {error && (
        <div className="px-3 pb-2 text-xs font-bold text-rose-500">{error}</div>
      )}
    </div>
  )
}

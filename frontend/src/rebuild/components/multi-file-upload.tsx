import { useState } from 'react'
import { Plus, X, FileText } from 'lucide-react'
import { StudentFileUpload } from './student-file-upload'
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

export function MultiFileUpload({ value = [], onChange, disabled, maxFiles = 10 }: MultiFileUploadProps) {
  const [showUpload, setShowUpload] = useState(false)

  const handleUploaded = (file: FileItem | null) => {
    if (file) {
      onChange([...value, file])
      setShowUpload(false)
    }
  }

  const removeFile = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      {/* List of already uploaded files */}
      {value.map((f, i) => (
        <div key={f.id} className="flex items-center gap-3 rounded-2xl border border-sky-100 bg-white p-3 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
            <FileText size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold text-slate-950">{f.originalFileName}</div>
            <div className="text-xs text-slate-500">{f.fileSize ? formatBytes(f.fileSize) : 'Đã tải lên'}</div>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={() => removeFile(i)}
              className="rounded-xl p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500"
              aria-label="Xóa tệp"
            >
              <X size={16} />
            </button>
          )}
        </div>
      ))}

      {/* Upload area (single file at a time) */}
      {showUpload && (
        <StudentFileUpload value={null} onUploaded={handleUploaded} disabled={disabled} />
      )}

      {/* Add file button */}
      {!showUpload && value.length < maxFiles && !disabled && (
        <button
          type="button"
          onClick={() => setShowUpload(true)}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-sky-200 bg-sky-50/50 text-sm font-bold text-sky-600 hover:bg-sky-100 transition"
        >
          <Plus size={16} />
          Thêm tệp đính kèm ({value.length}/{maxFiles})
        </button>
      )}

      {/* Close upload area if user wants to cancel */}
      {showUpload && !disabled && (
        <button
          type="button"
          onClick={() => setShowUpload(false)}
          className="text-xs font-bold text-slate-400 hover:text-slate-600"
        >
          Hủy thêm tệp
        </button>
      )}
    </div>
  )
}

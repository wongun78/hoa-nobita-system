import { useCallback, useEffect } from 'react'
import { X, Download, ExternalLink } from 'lucide-react'
import { api } from '../core/api'
import { Button } from '../layout/ui'

type FilePreviewModalProps = Readonly<{
  fileId: string
  fileName: string
  contentType?: string | null
  onClose: () => void
}>

const IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp'])
const PDF_TYPE = 'application/pdf'
const VIDEO_TYPES = new Set(['video/mp4', 'video/webm', 'video/quicktime'])
const AUDIO_TYPES = new Set(['audio/mpeg', 'audio/wav', 'audio/ogg'])

const EXT_TO_MIME: Record<string, string> = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif',
  webp: 'image/webp', svg: 'image/svg+xml', bmp: 'image/bmp',
  pdf: 'application/pdf',
  mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime',
  mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg',
}

/** Try contentType first; if null/unknown, guess from file extension */
function resolveContentType(contentType: string | null | undefined, fileName: string): string | null {
  if (contentType && contentType !== 'application/octet-stream') return contentType
  const ext = fileName.split('.').pop()?.toLowerCase()
  return ext ? (EXT_TO_MIME[ext] ?? null) : null
}

function isImage(ct: string | null) { return ct ? IMAGE_TYPES.has(ct) : false }
function isPdf(ct: string | null) { return ct === PDF_TYPE }
function isVideo(ct: string | null) { return ct ? VIDEO_TYPES.has(ct) : false }
function isAudio(ct: string | null) { return ct ? AUDIO_TYPES.has(ct) : false }

export function FilePreviewModal({ fileId, fileName, contentType, onClose }: FilePreviewModalProps) {
  const previewUrl = api.previewFileUrl(fileId)
  const downloadUrl = api.downloadFileUrl(fileId)
  const resolvedType = resolveContentType(contentType, fileName)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose],
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [handleKeyDown])

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/* Modal container */}
      <div className="relative flex max-h-[92vh] w-[95vw] max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-3">
          <h2 className="flex-1 truncate text-sm font-bold text-slate-800">{fileName}</h2>
          <a
            href={downloadUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
          >
            <Download size={14} /> Tải xuống
          </a>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {isImage(resolvedType) ? (
            <div className="flex items-center justify-center bg-slate-50 p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt={fileName}
                className="max-h-[80vh] max-w-full rounded-xl object-contain shadow-lg"
              />
            </div>
          ) : isPdf(resolvedType) ? (
            <iframe
              src={previewUrl}
              title={fileName}
              className="h-[85vh] w-full border-0"
            />
          ) : isVideo(resolvedType) ? (
            <div className="flex items-center justify-center bg-black p-4">
              <video
                src={previewUrl}
                controls
                className="max-h-[80vh] max-w-full rounded-xl"
              >
                Trình duyệt không hỗ trợ phát video.
              </video>
            </div>
          ) : isAudio(resolvedType) ? (
            <div className="flex flex-col items-center justify-center gap-6 bg-slate-50 p-12">
              <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-500">
                <ExternalLink size={40} />
              </div>
              <p className="text-sm font-medium text-slate-700">{fileName}</p>
              <audio src={previewUrl} controls className="w-full max-w-md">
                Trình duyệt không hỗ trợ phát audio.
              </audio>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-6 bg-slate-50 p-16">
              <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-sky-50 text-sky-500">
                <ExternalLink size={40} />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-slate-800">{fileName}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Không thể preview loại tệp này. Nhấn &quot;Tải xuống&quot; để xem.
                </p>
              </div>
              <a href={downloadUrl} target="_blank" rel="noreferrer">
                <Button type="button">
                  <Download size={16} /> Tải xuống
                </Button>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, Download, ExternalLink, Eye, RotateCcw, Send } from 'lucide-react'
import { useNewAuth } from '../auth/use-auth'
import { EmptyState, ErrorState, FilterSelect, PageHeader, PaginationControls, SearchInput, SkeletonCard, StatusBadge } from '../components/foundation'
import { FilePreviewModal } from '../components/file-preview-modal'
import { MultiFileUpload } from '../components/multi-file-upload'
import { api } from '../core/api'
import { ApiClientError } from '../core/http'
import type { AssignmentItem, FileItem, SubmissionItem } from '../core/types'
import { Button, Card, Input, TextArea } from '../layout/ui'
import { asPage, fmtDate } from './phase2-utils'

export function GradingV2Page() {
  const qc = useQueryClient()
  const { hasRole } = useNewAuth()
  const isTeacher = hasRole('TEACHER_OWNER')
  const [classId, setClassId] = useState('')
  const [assignmentId, setAssignmentId] = useState('')
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [score, setScore] = useState('')
  const [feedback, setFeedback] = useState('')
  const [feedbackFiles, setFeedbackFiles] = useState<FileItem[]>([])
  const [feedbackLink, setFeedbackLink] = useState<string>('')
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [previewFile, setPreviewFile] = useState<{ id: string; name: string; type?: string } | null>(null)
  const [downloadingZip, setDownloadingZip] = useState(false)

  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t) }, [toast])
  const showError = (err: unknown, fallback: string) => { const msg = err instanceof ApiClientError ? err.message : fallback; console.error('[grading]', msg, err); setToast({ type: 'error', message: msg }) }

  const classes = useQuery({ queryKey: ['classes', 'grading-v2'], queryFn: () => api.classesPage({ page: 0, size: 100 }) })
  const classPage = asPage(classes.data, 0, 100)

  const assignments = useQuery({
    queryKey: ['assignments-for-class', classId],
    queryFn: () => api.assignmentsPage({ classId, page: 0, size: 100 }),
    enabled: Boolean(classId),
  })
  const assignmentsList = asPage(assignments.data, 0, 100).items as AssignmentItem[]

  const submissions = useQuery({
    queryKey: ['grading-v2', classId, assignmentId, page, search, isTeacher],
    queryFn: () => {
      if (assignmentId) return api.submissionsByAssignmentPage(assignmentId, { page, size: 12, search })
      if (isTeacher) return api.gradingSubmissionsPage({ page, size: 12, search, classId: classId || undefined })
      return api.classGradingSubmissionsPage(classId, { page, size: 12, search })
    },
    enabled: isTeacher || Boolean(classId),
  })

  const queue = asPage(submissions.data, page, 12)
  const selected = useMemo<SubmissionItem | null>(() => queue.items.find((item) => item.id === selectedId) ?? queue.items[0] ?? null, [queue.items, selectedId])
  const draftKey = selected ? `grading-draft:${selected.id}` : ''

  useEffect(() => {
    if (!selected) return
    setSelectedId(selected.id)
    setScore(String(selected.score ?? ''))
    setFeedback(localStorage.getItem(`grading-draft:${selected.id}`) ?? selected.feedback ?? '')
    setFeedbackFiles([])
    setFeedbackLink(selected.feedbackLink ?? '')
  }, [selected])
  useEffect(() => { if (draftKey) localStorage.setItem(draftKey, feedback) }, [draftKey, feedback])

  const handleDownloadFeedback = async () => {
    try {
      await api.downloadFeedbackFile(selected!.id, selected!.feedbackFileName || `feedback-${selected!.id}`)
    } catch (err) {
      showError(err, 'Không thể tải tệp phản hồi.')
    }
  }

  const handleExportZip = async () => {
    if (!assignmentId) return
    setDownloadingZip(true)
    try {
      await api.downloadSubmissionsZip(assignmentId, classId || undefined)
      setToast({ type: 'success', message: 'Đã tải ZIP bài nộp thành công.' })
    } catch (err) {
      showError(err, 'Không thể tải ZIP. Vui lòng thử lại.')
    } finally {
      setDownloadingZip(false)
    }
  }

  const feedbackFileId = feedbackFiles.length > 0 ? feedbackFiles[0].id : undefined

  const save = useMutation({
    mutationFn: () => {
      const payload: { score: number; feedback?: string; feedbackFileId?: string; feedbackLink?: string } = { score: Number(score), feedback: feedback || undefined }
      if (feedbackFileId) payload.feedbackFileId = feedbackFileId
      if (feedbackLink) payload.feedbackLink = feedbackLink
      return selected?.gradeId ? api.updateGrade(selected.gradeId, payload) : api.gradeSubmission(selected!.id, payload)
    },
    onSuccess: async () => { if (draftKey) localStorage.removeItem(draftKey); setToast({ type: 'success', message: 'Đã lưu điểm.' }); await qc.invalidateQueries({ queryKey: ['grading-v2', classId] }) },
    onError: (err) => showError(err, 'Không thể lưu điểm. Vui lòng thử lại.'),
  })
  const resubmit = useMutation({
    mutationFn: () => api.requestResubmit(selected!.id),
    onSuccess: async () => { setToast({ type: 'success', message: 'Đã yêu cầu nộp lại.' }); await qc.invalidateQueries({ queryKey: ['grading-v2', classId] }) },
    onError: (err) => showError(err, 'Không thể yêu cầu nộp lại.'),
  })
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && selected && score) { event.preventDefault(); save.mutate() }
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault()
        const index = queue.items.findIndex((item) => item.id === selectedId)
        const next = event.key === 'ArrowDown' ? Math.min(queue.items.length - 1, index + 1) : Math.max(0, index - 1)
        if (queue.items[next]) setSelectedId(queue.items[next].id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [queue.items, save, score, selected, selectedId])

  const selectedAssignment = assignmentsList.find((a) => a.id === (selected?.assignmentId ?? assignmentId))

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Quản lý chấm bài" title="Chấm điểm" description={isTeacher ? 'Bạn có thể xem toàn bộ bài nộp toàn hệ thống.' : 'Chọn lớp và bài tập để bắt đầu chấm điểm.'} />

      {/* Filters: Class → Assignment → Search */}
      <Card className="flex flex-col gap-3 md:flex-row">
        <FilterSelect value={classId} onChange={(v) => { setClassId(v); setAssignmentId(''); setPage(0); setSelectedId('') }} options={classPage.items.map((item) => ({ value: item.id, label: item.name }))} placeholder={isTeacher ? 'Tất cả lớp' : 'Chọn lớp'} />
        <FilterSelect value={assignmentId} onChange={(v) => { setAssignmentId(v); setPage(0); setSelectedId('') }} options={assignmentsList.map((a) => ({ value: a.id, label: a.title }))} placeholder="Tất cả bài tập" disabled={!classId} />
        <SearchInput value={search} onChange={(e) => { setPage(0); setSearch(e.target.value) }} placeholder="Tìm học viên/bài tập" />
        {(isTeacher || hasRole('CLASS_ADMIN')) && (
          <Button type="button" variant="secondary" disabled={!assignmentId || downloadingZip} onClick={handleExportZip}>
            <Download size={16} /> {downloadingZip ? 'Đang tạo ZIP...' : 'Tải tất cả bài nộp (.zip)'}
          </Button>
        )}
      </Card>

      <div className="grid gap-5 xl:grid-cols-[390px_1fr]">
        {/* Submission queue */}
        <Card className="rounded-3xl">
          {!isTeacher && !classId && <EmptyState title="Chọn lớp để bắt đầu" />}
          {submissions.isLoading && <SkeletonCard />}
          {submissions.isError && <ErrorState onRetry={() => void submissions.refetch()} />}
          {(isTeacher || classId) && !submissions.isLoading && queue.items.length === 0 && <EmptyState title="Không có bài cần chấm" />}
          {queue.items.length > 0 && <>
            <div className="max-h-[650px] space-y-2 overflow-auto pr-1">
              {queue.items.map((item) => (
                <button key={item.id} className={`w-full rounded-2xl border p-3 text-left transition ${selectedId === item.id ? 'border-indigo-300 bg-indigo-50' : 'border-sky-100 bg-white hover:bg-sky-50'}`} onClick={() => setSelectedId(item.id)}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-slate-950">{item.studentName}</p>
                      <p className="text-xs text-slate-500">{item.assignmentTitle}</p>
                    </div>
                    <StatusBadge value={item.status} />
                  </div>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{item.className}</p>
                  <p className="mt-2 text-xs text-slate-400">{fmtDate(item.submittedAt)}</p>
                </button>
              ))}
            </div>
            <div className="mt-4"><PaginationControls page={queue.page} totalPages={queue.totalPages} onPageChange={setPage} /></div>
          </>}
        </Card>

        {/* Grading panel */}
        <Card className="min-h-[640px] rounded-3xl">
          {!selected ? (
            <EmptyState title="Chọn bài nộp" description="Nội dung và panel chấm điểm sẽ hiển thị tại đây." />
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-black text-slate-950">{selected.assignmentTitle}</h2>
                  <p className="text-sm text-slate-500">{selected.studentName} · {selected.className}</p>
                  {selectedAssignment?.skill && <span className="mt-1 inline-block rounded-xl bg-violet-50 px-2 py-0.5 text-xs font-bold text-violet-700">{selectedAssignment.skill}</span>}
                </div>
                <StatusBadge value={selected.status} />
              </div>

              <div className="rounded-3xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">{selected.contentText || 'Không có nội dung văn bản.'}</div>
              {selected.contentUrl && <a className="text-sm font-bold text-indigo-600" href={selected.contentUrl} target="_blank" rel="noreferrer">Mở URL bài làm</a>}
              {(() => {
                const fileMetas = selected.fileMetas && selected.fileMetas.length > 0
                  ? selected.fileMetas
                  : selected.fileId
                    ? [{ fileId: selected.fileId, fileName: selected.fileName, contentType: selected.fileContentType }]
                    : []
                if (fileMetas.length === 0) return null
                return (
                  <div className="space-y-2">
                    {fileMetas.map((fm) => (
                      <div key={fm.fileId} className="flex items-center gap-2">
                        <button type="button" className="inline-flex min-h-11 items-center gap-1 rounded-2xl bg-indigo-600 px-3 text-sm font-bold text-white transition hover:bg-indigo-700" onClick={() => api.downloadFile(fm.fileId, fm.fileName || `submission-${selected.id}`)}>
                          <Download size={16} /> Tải
                        </button>
                        <button type="button" className="inline-flex min-h-11 items-center gap-1 rounded-2xl border border-sky-200 px-3 text-sm font-bold text-slate-700 transition hover:bg-sky-50" onClick={() => setPreviewFile({ id: fm.fileId, name: fm.fileName || 'Bài nộp', type: fm.contentType ?? undefined })}>
                          <Eye size={16} /> Xem trước
                        </button>
                        <span className="truncate text-xs text-slate-400">{fm.fileName}</span>
                      </div>
                    ))}
                  </div>
                )
              })()}

              <div className="grid gap-3 md:grid-cols-[180px_1fr]">
                <Input type="number" min="0" max={selected.maxScore ?? 100} value={score} onChange={(e) => setScore(e.target.value)} placeholder="Điểm" />
                <TextArea rows={8} value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Nhận xét cho học viên" />
              </div>

              {/* Feedback attachments */}
              <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-4 space-y-3">
                <h3 className="text-sm font-bold text-slate-700">Tệp đính kèm phản hồi</h3>
                {selected.feedbackFileId && selected.feedbackFileName && (
                  <div className="flex flex-wrap items-center gap-2">
                    <button type="button" className="inline-flex min-h-11 items-center gap-1 rounded-2xl bg-indigo-600 px-3 text-sm font-bold text-white transition hover:bg-indigo-700" onClick={handleDownloadFeedback}>
                      <Download size={16} /> Tải
                    </button>
                    <button type="button" className="inline-flex min-h-11 items-center gap-1 rounded-2xl border border-sky-200 px-3 text-sm font-bold text-slate-700 transition hover:bg-sky-50" onClick={() => setPreviewFile({ id: selected.feedbackFileId!, name: selected.feedbackFileName || 'Phản hồi', type: selected.feedbackFileContentType ?? undefined })}>
                      <Eye size={16} /> Xem trước
                    </button>
                    <span className="text-xs text-slate-500">({selected.feedbackFileSize ? Math.round(selected.feedbackFileSize / 1024) + ' KB' : ''})</span>
                  </div>
                )}
                {selected.feedbackLink && (
                  <a className="inline-flex items-center gap-1 text-sm font-bold text-indigo-600" href={selected.feedbackLink} target="_blank" rel="noreferrer">
                    <ExternalLink size={14} /> {selected.feedbackLink}
                  </a>
                )}
                <MultiFileUpload value={feedbackFiles} onChange={setFeedbackFiles} disabled={save.isPending} maxFiles={3} />
                <Input type="text" value={feedbackLink} onChange={(e) => setFeedbackLink(e.target.value)} placeholder="Link phản hồi (tuỳ chọn)" />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="button" disabled={!score || save.isPending} onClick={() => save.mutate()}><Send size={16} /> Lưu điểm</Button>
                <Button type="button" variant="secondary" disabled={resubmit.isPending} onClick={() => resubmit.mutate()}><RotateCcw size={16} /> Yêu cầu nộp lại</Button>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span className="inline-flex items-center gap-1"><kbd className="rounded border border-slate-200 bg-white px-1">⌘</kbd>+<kbd className="rounded border border-slate-200 bg-white px-1">Enter</kbd> lưu</span>
                <span className="inline-flex items-center gap-1"><ArrowUp size={12} /><ArrowDown size={12} /> đổi bài</span>
              </div>
            </div>
          )}
        </Card>
      </div>

      {toast && (
        <div className={`fixed bottom-4 right-4 z-[60] rounded-2xl px-4 py-3 text-sm font-bold shadow-lg ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
          {toast.message}
        </div>
      )}
      {previewFile && <FilePreviewModal fileId={previewFile.id} fileName={previewFile.name} contentType={previewFile.type} onClose={() => setPreviewFile(null)} />}
    </div>
  )
}

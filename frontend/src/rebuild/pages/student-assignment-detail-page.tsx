import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Clock3, Download, ExternalLink, Eye, Sparkles, Trash2 } from 'lucide-react'
import { api } from '../core/api'
import { ConfirmDialog, EmptyState, ErrorState, SkeletonCard, StatusBadge } from '../components/foundation'
import { FilePreviewModal } from '../components/file-preview-modal'
import { MultiFileUpload } from '../components/multi-file-upload'
import { Button, Card, Input, TextArea } from '../layout/ui'
import { fmtDate } from './phase2-utils'
import type { AssignmentItem, FileItem, PageResponse, SubmissionItem } from '../core/types'

function deadlineText(dueAt?: string | null) {
  if (!dueAt) return 'Không giới hạn hạn nộp'
  const minutes = Math.floor((new Date(dueAt).getTime() - Date.now()) / 60000)
  if (minutes < 0) return `Đã quá hạn ${Math.abs(Math.ceil(minutes / 1440)) || 1} ngày`
  if (minutes < 60) return `Còn ${minutes} phút`
  if (minutes < 1440) return `Còn ${Math.ceil(minutes / 60)} giờ`
  return `Còn ${Math.ceil(minutes / 1440)} ngày`
}

function isPastDue(assignment?: AssignmentItem) {
  return assignment?.dueAt ? new Date(assignment.dueAt).getTime() < Date.now() : false
}

function isSubmissionLate(assignment?: AssignmentItem, submission?: SubmissionItem | null) {
  if (!assignment?.dueAt) return false
  if (!submission) return isPastDue(assignment)
  return new Date(submission.submittedAt).getTime() > new Date(assignment.dueAt).getTime()
}

function canEditSubmission(assignment?: AssignmentItem, submission?: SubmissionItem | null) {
  if (!assignment || !submission) return false
  if (assignment.status === 'CLOSED') return false
  if (submission.status === 'GRADED' || submission.score != null) return false
  if (submission.status === 'RESUBMIT_REQUESTED') return true
  return !isPastDue(assignment)
}

function SubmissionSummary({ assignment, submission }: Readonly<{ assignment: AssignmentItem; submission?: SubmissionItem | null }>) {
  const [previewFile, setPreviewFile] = useState<{ id: string; name: string; type?: string } | null>(null)
  if (!submission) return <EmptyState title="Bạn chưa nộp bài" description="Hoàn thiện nội dung bên dưới để gửi bài làm cho giáo viên." />
  const late = isSubmissionLate(assignment, submission)
  return (
    <Card className="rounded-3xl bg-gradient-to-br from-white to-sky-50/60">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-black text-slate-950">Bài nộp hiện tại</h2><StatusBadge value={submission.status} /></div>
          <p className="mt-1 text-sm text-slate-500">Nộp lúc {fmtDate(submission.submittedAt)}{late ? ' · Nộp muộn' : ''}</p>
        </div>
        {submission.score != null && <div className="rounded-2xl bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700">{submission.score}/{submission.maxScore ?? assignment.maxScore}</div>}
      </div>
      {submission.contentText && <div className="mt-4 rounded-2xl bg-white p-3 text-sm leading-6 text-slate-700">{submission.contentText}</div>}
      {submission.contentUrl && <a className="mt-3 inline-flex min-h-11 items-center rounded-2xl border border-sky-200 px-4 text-sm font-bold text-slate-700" href={submission.contentUrl} target="_blank" rel="noreferrer">Mở URL bài làm</a>}
      {(() => {
        const fileMetas = submission.fileMetas && submission.fileMetas.length > 0
          ? submission.fileMetas
          : submission.fileId
            ? [{ fileId: submission.fileId, fileName: submission.fileName, contentType: submission.fileContentType }]
            : []
        if (fileMetas.length === 0) return null
        return (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {fileMetas.map((fm) => (
              <span key={fm.fileId} className="inline-flex items-center gap-2">
                <Button type="button" variant="secondary" className="min-h-11" onClick={() => api.downloadFile(fm.fileId, fm.fileName || submission.assignmentTitle)}><Download size={16} />{fm.fileName || 'Tải tệp'}</Button>
                <Button type="button" variant="secondary" className="min-h-11" onClick={() => setPreviewFile({ id: fm.fileId, name: fm.fileName || submission.assignmentTitle, type: fm.contentType ?? undefined })}><Eye size={16} /></Button>
              </span>
            ))}
          </div>
        )
      })()}
      {previewFile && <FilePreviewModal fileId={previewFile.id} fileName={previewFile.name} contentType={previewFile.type} onClose={() => setPreviewFile(null)} />}
      {submission.feedback && <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-sm leading-6 text-emerald-800"><b>Nhận xét:</b> {submission.feedback}</div>}
      {(submission.feedbackFileId || submission.feedbackLink) && (
        <div className="mt-3 rounded-2xl border border-indigo-100 bg-indigo-50 p-3 space-y-2">
          <h3 className="text-xs font-bold text-indigo-700">Tệp đính kèm từ giáo viên</h3>
          {submission.feedbackFileId && (
            <><Button type="button" variant="secondary" className="min-h-9" onClick={() => setPreviewFile({ id: submission.feedbackFileId!, name: submission.feedbackFileName || 'Phản hồi', type: submission.feedbackFileContentType ?? undefined })}>
              <Eye size={14} /> Xem trước
            </Button><Button type="button" variant="secondary" className="min-h-9" onClick={() => api.downloadFeedbackFile(submission.id, submission.feedbackFileName || `feedback-${submission.id}`)}>
              <Download size={14} /> {submission.feedbackFileName || 'Tải tệp phản hồi'}
            </Button></>
          )}
          {submission.feedbackLink && <a className="inline-flex items-center gap-1 text-sm font-bold text-indigo-600" href={submission.feedbackLink} target="_blank" rel="noreferrer"><ExternalLink size={14} /> {submission.feedbackLink}</a>}
        </div>
      )}
    </Card>
  )
}

function FileRow({ fileId, label, onPreview }: Readonly<{ fileId: string; label: string; onPreview: (id: string, name: string, type?: string) => void }>) {
  const meta = useQuery({ queryKey: ['file-meta', fileId], queryFn: () => api.fileMetadata(fileId), enabled: Boolean(fileId) })
  const displayName = meta.data?.originalFileName || label
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button type="button" variant="secondary" className="min-h-11" onClick={() => api.downloadFile(fileId, displayName)}><Download size={16} />{displayName}</Button>
      <Button type="button" variant="secondary" className="min-h-11" onClick={() => { if (meta.data) onPreview(meta.data.id, meta.data.originalFileName, meta.data.contentType) }}><Eye size={16} />Xem trước</Button>
    </div>
  )
}

function AssignmentFileSection({ fileId, fileIds, onPreview }: Readonly<{ fileId?: string | null; fileIds?: string[] | null; onPreview: (id: string, name: string, type?: string) => void }>) {
  const allFileIds = fileIds && fileIds.length > 0 ? fileIds : fileId ? [fileId] : []
  if (allFileIds.length === 0) return null

  if (allFileIds.length === 1) {
    return <div className="mt-3"><FileRow fileId={allFileIds[0]} label="Tài liệu" onPreview={onPreview} /></div>
  }

  return (
    <div className="mt-3 space-y-2">
      {allFileIds.map((fid, idx) => (
        <FileRow key={fid} fileId={fid} label={`Tài liệu ${idx + 1}`} onPreview={onPreview} />
      ))}
    </div>
  )
}

export function StudentAssignmentDetailPage() {
  const { assignmentId = '' } = useParams()
  const qc = useQueryClient()
  const [contentText, setContentText] = useState('')
  const [contentUrl, setContentUrl] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<FileItem[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [successPulse, setSuccessPulse] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [previewFile, setPreviewFile] = useState<{ id: string; name: string; type?: string } | null>(null)

  const assignment = useQuery({ queryKey: ['student', 'assignment', assignmentId], queryFn: () => api.assignmentById(assignmentId), enabled: Boolean(assignmentId) })
  const submissions = useQuery({ queryKey: ['student', 'assignment', assignmentId, 'my-submissions'], queryFn: () => api.mySubmissionsPage({ page: 0, size: 100 }), enabled: Boolean(assignmentId) })

  const submissionItems = useMemo(() => Array.isArray(submissions.data) ? submissions.data : submissions.data?.items ?? [], [submissions.data])
  const mySubmission = useMemo(() => submissionItems.find((item) => item.assignmentId === assignmentId) ?? null, [assignmentId, submissionItems])
  const editable = canEditSubmission(assignment.data, mySubmission)
  const late = isSubmissionLate(assignment.data, mySubmission)
  const needsResubmit = mySubmission?.status === 'RESUBMIT_REQUESTED'

  const resetForm = () => {
    setContentText('')
    setContentUrl('')
    setUploadedFiles([])
    setIsEditing(false)
  }

  const onSuccess = async (text: string) => {
    setMessage(text)
    setSuccessPulse(true)
    globalThis.setTimeout(() => setSuccessPulse(false), 1200)
    resetForm()
    await qc.invalidateQueries({ queryKey: ['student', 'assignment', assignmentId, 'my-submissions'] })
    await qc.invalidateQueries({ queryKey: ['student', 'assignments', 'my-submissions'] })
  }

  const submit = useMutation({
    mutationFn: () => api.submitAssignment(assignmentId, { contentText: contentText || undefined, contentUrl: contentUrl || undefined, fileIds: uploadedFiles.length > 0 ? uploadedFiles.map((f) => f.id) : undefined }),
    onSuccess: () => onSuccess('Nộp bài thành công. Giáo viên sẽ nhận được bài làm của bạn.'),
  })

  const update = useMutation({
    mutationFn: () => api.updateSubmission(mySubmission!.id, { contentText: contentText || undefined, contentUrl: contentUrl || undefined, fileIds: uploadedFiles.length > 0 ? uploadedFiles.map((f) => f.id) : undefined }),
    onSuccess: () => onSuccess('Đã cập nhật bài nộp.'),
  })

  const remove = useMutation({
    mutationFn: () => api.deleteSubmission(mySubmission!.id),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['student', 'assignment', assignmentId, 'my-submissions'] })
      const previous = qc.getQueryData<PageResponse<SubmissionItem> | SubmissionItem[]>(['student', 'assignment', assignmentId, 'my-submissions'])
      qc.setQueryData(['student', 'assignment', assignmentId, 'my-submissions'], (old: PageResponse<SubmissionItem> | SubmissionItem[] | undefined) => {
        if (!old || !mySubmission) return old
        if (Array.isArray(old)) return old.filter((item) => item.id !== mySubmission.id)
        return { ...old, items: old.items.filter((item) => item.id !== mySubmission.id), totalItems: Math.max(old.totalItems - 1, 0) }
      })
      return { previous }
    },
    onError: (_error, _variables, context) => qc.setQueryData(['student', 'assignment', assignmentId, 'my-submissions'], context?.previous),
    onSuccess: () => {
      setConfirmDelete(false)
      onSuccess('Đã xoá bài nộp.')
    },
  })

  if (assignment.isLoading || submissions.isLoading) return <div className="space-y-4 pb-20 md:pb-0"><SkeletonCard lines={5} /><SkeletonCard lines={6} /></div>
  if (assignment.isError || submissions.isError || !assignment.data) return <ErrorState title="Không tải được bài tập" description="Bài tập có thể không tồn tại hoặc bạn không có quyền xem." onRetry={() => { assignment.refetch(); submissions.refetch() }} />

  const canSubmitNew = !mySubmission && assignment.data.status === 'PUBLISHED'
  const locked = mySubmission && !editable
  const submitDisabled = (!contentText.trim() && !contentUrl.trim() && uploadedFiles.length === 0) || submit.isPending || update.isPending

  return (
    <div className="space-y-5 pb-20 md:pb-0">
      <div className="student-animate-in relative overflow-hidden rounded-3xl border border-white/70 bg-gradient-to-br from-indigo-600 via-indigo-500 to-sky-400 p-6 text-white shadow-lg">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge value={assignment.data.status} />
            {assignment.data.skill && <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur">{assignment.data.skill}</span>}
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur">Điểm tối đa: {assignment.data.maxScore}</span>
          </div>
          <h1 className="mt-3 text-2xl font-black tracking-tight md:text-3xl">{assignment.data.title}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/80">
            <span>{assignment.data.className || 'Lớp học'}</span>
            <span className="inline-flex items-center gap-1"><Clock3 size={14} /> Hạn: {fmtDate(assignment.data.dueAt)}</span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${isPastDue(assignment.data) ? 'bg-rose-400/30' : 'bg-white/20'} backdrop-blur`}>{deadlineText(assignment.data.dueAt)}</span>
          </p>
        </div>
      </div>

      {message && (
        <div className={`rounded-3xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-emerald-700 transition ${successPulse ? 'scale-[1.01] shadow-lg' : ''}`}>
          <CheckCircle2 className="mr-2 inline" size={18} />{message}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <div className="space-y-4">
          <Card className="rounded-3xl">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-600">
              <span className="inline-flex min-h-8 items-center gap-1 rounded-full bg-sky-50 px-3"><Clock3 size={14} /> {deadlineText(assignment.data.dueAt)}</span>
              {late && <span className="inline-flex min-h-8 items-center gap-1 rounded-full bg-rose-50 px-3 text-rose-700"><AlertTriangle size={14} /> {mySubmission ? 'Bài nộp muộn' : 'Đã quá hạn'}</span>}
              {needsResubmit && <span className="inline-flex min-h-8 items-center gap-1 rounded-full bg-amber-50 px-3 text-amber-700"><Sparkles size={14} /> Giáo viên yêu cầu nộp lại</span>}
            </div>
            <h2 className="mt-4 text-lg font-black text-slate-950">Yêu cầu bài tập</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600">{assignment.data.instruction || assignment.data.description || 'Giáo viên chưa thêm hướng dẫn chi tiết.'}</p>
            <div className="mt-4 text-sm font-bold text-slate-700">Điểm tối đa: {assignment.data.maxScore}</div>
            {assignment.data.skill && <div className="mt-2"><span className="rounded-xl bg-violet-50 px-2 py-0.5 text-xs font-bold text-violet-700">{assignment.data.skill}</span></div>}
            {assignment.data.externalLink && <a className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-2xl border border-sky-200 px-4 text-sm font-bold text-slate-700 transition hover:bg-sky-50" href={assignment.data.externalLink} target="_blank" rel="noreferrer"><ExternalLink size={14} />Tài liệu tham khảo</a>}
            <AssignmentFileSection fileId={assignment.data.fileId} fileIds={assignment.data.fileIds} onPreview={(id, name, type) => setPreviewFile({ id, name, type })} />
          </Card>

          <SubmissionSummary assignment={assignment.data} submission={mySubmission} />
        </div>

        <Card className="rounded-3xl">
          <h2 className="text-lg font-black text-slate-950">{isEditing ? 'Sửa bài nộp' : needsResubmit ? 'Nộp lại bài' : 'Gửi bài làm'}</h2>
          {locked && <p className="mt-2 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">Bài đã chấm hoặc đã khóa, bạn không thể chỉnh sửa thêm.</p>}
          {!canSubmitNew && !editable && !isEditing && !needsResubmit && !locked && <p className="mt-2 rounded-2xl bg-amber-50 p-3 text-sm text-amber-700">Bài hiện không mở để nộp mới.</p>}

          {(canSubmitNew || editable || isEditing || needsResubmit) && !locked && (
            <form
              className="mt-4 space-y-3"
              onSubmit={(event) => {
                event.preventDefault()
                if (mySubmission && (isEditing || needsResubmit)) update.mutate()
                else submit.mutate()
              }}
            >
              <TextArea rows={7} value={contentText} onChange={(event) => setContentText(event.target.value)} placeholder="Nhập nội dung bài làm..." />
              <Input value={contentUrl} onChange={(event) => setContentUrl(event.target.value)} placeholder="URL bài làm ngoài (nếu có)" />
              <MultiFileUpload value={uploadedFiles} onChange={setUploadedFiles} disabled={submit.isPending || update.isPending} maxFiles={5} />
              <Button type="submit" className="min-h-11 w-full" disabled={submitDisabled}>{mySubmission ? 'Lưu bài nộp' : 'Gửi bài'}</Button>
            </form>
          )}

          {mySubmission && editable && !isEditing && (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" variant="secondary" className="min-h-11" onClick={() => {
                setIsEditing(true)
                setContentText(mySubmission.contentText || '')
                setContentUrl(mySubmission.contentUrl || '')
                const existingFiles = mySubmission.fileMetas && mySubmission.fileMetas.length > 0
                  ? mySubmission.fileMetas.map(fm => ({ id: fm.fileId, originalFileName: fm.fileName || 'file', contentType: fm.contentType || 'application/octet-stream', fileSize: fm.fileSize || 0 }))
                  : mySubmission.fileId
                    ? [{ id: mySubmission.fileId, originalFileName: mySubmission.fileName || 'file', contentType: mySubmission.fileContentType || 'application/octet-stream', fileSize: mySubmission.fileSize || 0 }]
                    : []
                setUploadedFiles(existingFiles as FileItem[])
              }}>Sửa bài nộp</Button>
              <Button type="button" variant="ghost" className="min-h-11 text-rose-600" onClick={() => setConfirmDelete(true)} disabled={remove.isPending}><Trash2 size={16} />Xoá</Button>
            </div>
          )}
        </Card>
      </div>
      <ConfirmDialog open={confirmDelete} title="Xoá bài nộp này?" description="Bài nộp sẽ được xoá khỏi danh sách của bạn. Nếu bài tập còn mở, bạn có thể nộp lại sau." confirmLabel={remove.isPending ? 'Đang xoá...' : 'Xoá bài nộp'} onCancel={() => setConfirmDelete(false)} onConfirm={() => remove.mutate()} />
      {previewFile && <FilePreviewModal fileId={previewFile.id} fileName={previewFile.name} contentType={previewFile.type} onClose={() => setPreviewFile(null)} />}
    </div>
  )
}

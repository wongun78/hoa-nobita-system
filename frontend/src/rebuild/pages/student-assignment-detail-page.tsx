import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Clock3, Download, Sparkles, Trash2 } from 'lucide-react'
import { api } from '../core/api'
import { EmptyState, ErrorState, PageHeader, SkeletonCard, StatusBadge } from '../components/foundation'
import { StudentFileUpload } from '../components/student-file-upload'
import { Button, Card, Input, TextArea } from '../layout/ui'
import { fmtDate } from './phase2-utils'
import type { AssignmentItem, FileItem, SubmissionItem } from '../core/types'

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
      {submission.fileId && <Button type="button" variant="secondary" className="mt-3 min-h-11" onClick={() => api.downloadFile(submission.fileId!, submission.assignmentTitle)}><Download size={16} />Tải tệp bài làm</Button>}
      {submission.feedback && <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-sm leading-6 text-emerald-800"><b>Nhận xét:</b> {submission.feedback}</div>}
    </Card>
  )
}

export function StudentAssignmentDetailPage() {
  const { assignmentId = '' } = useParams()
  const qc = useQueryClient()
  const [contentText, setContentText] = useState('')
  const [contentUrl, setContentUrl] = useState('')
  const [uploadedFile, setUploadedFile] = useState<FileItem | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [successPulse, setSuccessPulse] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

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
    setUploadedFile(null)
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
    mutationFn: () => api.submitAssignment(assignmentId, { contentText: contentText || undefined, contentUrl: contentUrl || undefined, fileId: uploadedFile?.id }),
    onSuccess: () => onSuccess('Nộp bài thành công. Giáo viên sẽ nhận được bài làm của bạn.'),
  })

  const update = useMutation({
    mutationFn: () => api.updateSubmission(mySubmission!.id, { contentText: contentText || undefined, contentUrl: contentUrl || undefined, fileId: uploadedFile?.id }),
    onSuccess: () => onSuccess('Đã cập nhật bài nộp.'),
  })

  const remove = useMutation({
    mutationFn: () => api.deleteSubmission(mySubmission!.id),
    onSuccess: () => onSuccess('Đã xoá bài nộp.'),
  })

  if (assignment.isLoading || submissions.isLoading) return <div className="space-y-4 pb-20 md:pb-0"><SkeletonCard lines={5} /><SkeletonCard lines={6} /></div>
  if (assignment.isError || submissions.isError || !assignment.data) return <ErrorState title="Không tải được bài tập" description="Bài tập có thể không tồn tại hoặc bạn không có quyền xem." onRetry={() => { assignment.refetch(); submissions.refetch() }} />

  const canSubmitNew = !mySubmission && assignment.data.status === 'PUBLISHED'
  const locked = mySubmission && !editable
  const submitDisabled = (!contentText.trim() && !contentUrl.trim() && !uploadedFile) || submit.isPending || update.isPending

  return (
    <div className="space-y-5 pb-20 md:pb-0">
      <PageHeader
        eyebrow="과제 제출"
        title={assignment.data.title}
        description={`${assignment.data.className || 'Lớp học'} · Hạn nộp ${fmtDate(assignment.data.dueAt)} · ${deadlineText(assignment.data.dueAt)}`}
        actions={<StatusBadge value={assignment.data.status} />}
      />

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
              <StudentFileUpload value={uploadedFile} onUploaded={setUploadedFile} disabled={submit.isPending || update.isPending} />
              <Button type="submit" className="min-h-11 w-full" disabled={submitDisabled}>{mySubmission ? 'Lưu bài nộp' : 'Gửi bài'}</Button>
            </form>
          )}

          {mySubmission && editable && !isEditing && (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" variant="secondary" className="min-h-11" onClick={() => { setIsEditing(true); setContentText(mySubmission.contentText || ''); setContentUrl(mySubmission.contentUrl || '') }}>Sửa bài nộp</Button>
              <Button type="button" variant="ghost" className="min-h-11 text-rose-600" onClick={() => { if (globalThis.confirm('Bạn chắc chắn muốn xoá bài nộp?')) remove.mutate() }} disabled={remove.isPending}><Trash2 size={16} />Xoá</Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { Download, ExternalLink, Eye, FileText, MessageSquareText } from 'lucide-react'
import { api } from '../core/api'
import { EmptyState, ErrorState, FilterBar, PaginationControls, SearchInput, SkeletonCard, StatusBadge } from '../components/foundation'
import { FilePreviewModal } from '../components/file-preview-modal'
import { Button, Card } from '../layout/ui'
import { asPage, fmtDate } from './phase2-utils'
import type { SubmissionItem, SubmissionStatus } from '../core/types'

const statusOptions: Array<'ALL' | SubmissionStatus> = ['ALL', 'SUBMITTED', 'LATE', 'GRADED', 'RESUBMIT_REQUESTED']
const statusFilterLabel: Record<string, string> = { ALL: 'Tất cả', SUBMITTED: 'Đã nộp', LATE: 'Nộp trễ', GRADED: 'Đã chấm', RESUBMIT_REQUESTED: 'Yêu cầu nộp lại' }

function scoreTone(score: number, maxScore?: number | null) {
  if (!maxScore) return 'bg-slate-50 text-slate-700'
  const pct = (score / maxScore) * 100
  if (pct >= 80) return 'bg-emerald-50 text-emerald-700'
  if (pct >= 60) return 'bg-amber-50 text-amber-700'
  return 'bg-rose-50 text-rose-700'
}

function scoreTextTone(score: number, maxScore?: number | null) {
  if (!maxScore) return 'text-slate-950'
  const pct = (score / maxScore) * 100
  if (pct >= 80) return 'text-emerald-600'
  if (pct >= 60) return 'text-amber-600'
  return 'text-rose-600'
}

function SubmissionCard({ item }: Readonly<{ item: SubmissionItem }>) {
  return (
    <a href={`/student/submissions/${item.id}`} className="block rounded-3xl focus:outline-none focus:ring-4 focus:ring-indigo-100">
      <Card className="rounded-3xl transition hover:-translate-y-0.5 hover:shadow-lg">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2"><h2 className="line-clamp-2 text-lg font-black text-slate-950">{item.assignmentTitle}</h2><StatusBadge value={item.status} /></div>
            <p className="mt-1 text-sm text-slate-500">{item.className} · Nộp lúc {fmtDate(item.submittedAt)}</p>
            {item.contentText && <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{item.contentText}</p>}
          </div>
          <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
            <div className={`rounded-2xl px-3 py-2 text-sm font-black ${item.score == null ? 'bg-slate-50 text-slate-700' : scoreTone(Number(item.score), item.maxScore)}`}>{item.score == null ? 'Chưa chấm' : `${item.score}/${item.maxScore ?? '-'}`}</div>
            {item.feedback && <span className="inline-flex min-h-8 items-center gap-1 rounded-full bg-emerald-50 px-3 text-xs font-bold text-emerald-700"><MessageSquareText size={14} /> Có phản hồi</span>}
          </div>
        </div>
      </Card>
    </a>
  )
}

function StudentSubmissionDetail({ submissionId }: Readonly<{ submissionId: string }>) {
  const query = useQuery({ queryKey: ['student', 'submission', submissionId], queryFn: () => api.submissionById(submissionId), enabled: Boolean(submissionId) })
  const [previewFile, setPreviewFile] = useState<{ id: string; name: string; type?: string } | null>(null)

  if (query.isLoading) return <div className="space-y-4 pb-20 md:pb-0"><SkeletonCard lines={5} /><SkeletonCard lines={4} /></div>
  if (query.isError || !query.data) return <ErrorState title="Không tải được bài nộp" description="Bài nộp có thể không tồn tại hoặc bạn không có quyền xem." onRetry={() => query.refetch()} />

  const item = query.data
  return (
    <div className="space-y-5 pb-20 md:pb-0">
      <div className="student-animate-in relative overflow-hidden rounded-3xl border border-white/70 bg-gradient-to-br from-indigo-600 via-indigo-500 to-sky-400 p-6 text-white shadow-lg">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge value={item.status} />
          </div>
          <h1 className="mt-3 text-2xl font-black tracking-tight md:text-3xl">{item.assignmentTitle}</h1>
          <p className="mt-2 text-sm text-white/80">{item.className} · Nộp lúc {fmtDate(item.submittedAt)}</p>
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <Card className="rounded-3xl">
          <h2 className="text-lg font-black text-slate-950">Nội dung bài làm</h2>
          {item.contentText ? <div className="mt-4 whitespace-pre-line rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-700">{item.contentText}</div> : <EmptyState title="Không có nội dung văn bản" description="Bài nộp có thể dùng URL hoặc tệp đính kèm." />}
          <div className="mt-4 flex flex-wrap gap-2">
            {item.contentUrl && <a className="inline-flex min-h-11 items-center rounded-2xl border border-sky-200 px-4 text-sm font-bold text-slate-700" href={item.contentUrl} target="_blank" rel="noreferrer">Mở URL</a>}
            {(() => {
              const fileMetas = item.fileMetas && item.fileMetas.length > 0
                ? item.fileMetas
                : item.fileId
                  ? [{ fileId: item.fileId, fileName: item.fileName, contentType: item.fileContentType }]
                  : []
              return fileMetas.map((fm) => (
                <span key={fm.fileId} className="inline-flex items-center gap-2">
                  <Button type="button" variant="secondary" className="min-h-11" onClick={() => setPreviewFile({ id: fm.fileId, name: fm.fileName || item.assignmentTitle, type: fm.contentType ?? undefined })}><Eye size={16} />{fm.fileName || 'Xem trước'}</Button>
                  <Button type="button" variant="secondary" className="min-h-11" onClick={() => api.downloadFile(fm.fileId, fm.fileName || item.assignmentTitle)}><Download size={16} /></Button>
                </span>
              ))
            })()}
          </div>
          {(item.feedbackFileId || item.feedbackLink) && (
            <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50 p-3 space-y-2">
              <h3 className="text-xs font-bold text-indigo-700">Tệp đính kèm từ giáo viên</h3>
              {item.feedbackFileId && (
                <Button type="button" variant="secondary" className="min-h-9" onClick={() => api.downloadFeedbackFile(item.id, item.feedbackFileName || `feedback-${item.id}`)}>
                  <Download size={14} /> {item.feedbackFileName || 'Tải tệp phản hồi'}
                </Button>
              )}
              {item.feedbackFileId && <Button type="button" variant="secondary" className="min-h-9" onClick={() => setPreviewFile({ id: item.feedbackFileId!, name: item.feedbackFileName || 'Phản hồi', type: item.feedbackFileContentType ?? undefined })}><Eye size={14} /> Xem trước</Button>}
              {item.feedbackLink && <a className="inline-flex items-center gap-1 text-sm font-bold text-indigo-600" href={item.feedbackLink} target="_blank" rel="noreferrer"><ExternalLink size={14} /> {item.feedbackLink}</a>}
            </div>
          )}
        </Card>
        <Card className="rounded-3xl bg-gradient-to-br from-white to-emerald-50/60">
          <h2 className="text-lg font-black text-slate-950">Điểm & phản hồi</h2>
          <div className={`mt-5 text-5xl font-black ${item.score != null ? scoreTextTone(Number(item.score), item.maxScore) : 'text-slate-950'}`}>{item.score == null ? '-' : item.score}</div>
          <p className="mt-1 text-sm text-slate-500">/ {item.maxScore ?? 'điểm tối đa'}</p>
          {item.feedback ? <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm leading-7 text-emerald-800">{item.feedback}</div> : <p className="mt-5 text-sm text-slate-500">Giáo viên chưa để lại nhận xét.</p>}
        </Card>
      </div>
      {previewFile && <FilePreviewModal fileId={previewFile.id} fileName={previewFile.name} contentType={previewFile.type} onClose={() => setPreviewFile(null)} />}
    </div>
  )
}

export function StudentSubmissionsPage() {
  const { submissionId } = useParams()
  const [page, setPage] = useState(0)
  const [status, setStatus] = useState<'ALL' | SubmissionStatus>('ALL')
  const [search, setSearch] = useState('')

  const query = useQuery({ queryKey: ['student', 'submissions', page, status], queryFn: () => api.mySubmissionsPage({ page, size: 10, status: status === 'ALL' ? undefined : status }) })
  const pageData = asPage(query.data, page, 10)
  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return pageData.items
    return pageData.items.filter((item) => [item.assignmentTitle, item.className, item.feedback].some((value) => value?.toLowerCase().includes(keyword)))
  }, [pageData.items, search])

  if (submissionId) return <StudentSubmissionDetail submissionId={submissionId} />

  if (query.isLoading) return <div className="space-y-4 pb-20 md:pb-0"><SkeletonCard lines={4} /><SkeletonCard /><SkeletonCard /></div>
  if (query.isError) return <ErrorState title="Không tải được bài nộp" description="Vui lòng thử lại sau ít phút." onRetry={() => query.refetch()} />

  return (
    <div className="space-y-5 pb-20 md:pb-0">
      <div className="student-animate-in relative overflow-hidden rounded-3xl border border-white/70 bg-gradient-to-br from-indigo-600 via-indigo-500 to-sky-400 p-6 text-white shadow-lg">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <h1 className="text-2xl font-black tracking-tight md:text-3xl">Bài nộp của tôi</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">Theo dõi toàn bộ bài đã nộp, trạng thái chấm điểm và phản hồi từ giáo viên.</p>
        </div>
      </div>
      <FilterBar>
        <div className="min-w-0 flex-1"><SearchInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm bài nộp, lớp, phản hồi..." aria-label="Tìm bài nộp" /></div>
        <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
          {statusOptions.map((item) => <button key={item} type="button" onClick={() => { setStatus(item); setPage(0) }} className={`min-h-11 shrink-0 rounded-2xl px-4 text-sm font-bold ${status === item ? 'bg-indigo-600 text-white' : 'border border-sky-100 bg-white text-slate-600 hover:bg-sky-50'}`}>{statusFilterLabel[item] ?? item}</button>)}
        </div>
      </FilterBar>
      {filteredItems.length ? <div className="space-y-3">{filteredItems.map((item) => <SubmissionCard key={item.id} item={item} />)}</div> : <EmptyState title="Chưa có bài nộp phù hợp" description="Thử đổi bộ lọc hoặc quay lại sau khi bạn nộp bài." action={<FileText className="mx-auto text-indigo-400" />} />}
      <PaginationControls page={pageData.page} totalPages={pageData.totalPages} onPageChange={setPage} />
    </div>
  )
}

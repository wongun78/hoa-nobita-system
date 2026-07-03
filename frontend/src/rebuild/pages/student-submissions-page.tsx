import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { Download, FileText, MessageSquareText, Search } from 'lucide-react'
import { api } from '../core/api'
import { EmptyState, ErrorState, FilterBar, PageHeader, PaginationControls, SearchInput, SkeletonCard, StatusBadge } from '../components/foundation'
import { Button, Card, Input } from '../layout/ui'
import { asPage, fmtDate } from './phase2-utils'
import type { SubmissionItem, SubmissionStatus } from '../core/types'

const statusOptions: Array<'ALL' | SubmissionStatus> = ['ALL', 'SUBMITTED', 'LATE', 'GRADED', 'RESUBMIT_REQUESTED']

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
            <div className="rounded-2xl bg-slate-50 px-3 py-2 text-sm font-black text-slate-700">{item.score == null ? 'Chưa chấm' : `${item.score}/${item.maxScore ?? '-'}`}</div>
            {item.feedback && <span className="inline-flex min-h-8 items-center gap-1 rounded-full bg-emerald-50 px-3 text-xs font-bold text-emerald-700"><MessageSquareText size={14} /> Có phản hồi</span>}
          </div>
        </div>
      </Card>
    </a>
  )
}

function StudentSubmissionDetail({ submissionId }: Readonly<{ submissionId: string }>) {
  const query = useQuery({ queryKey: ['student', 'submission', submissionId], queryFn: () => api.submissionById(submissionId), enabled: Boolean(submissionId) })

  if (query.isLoading) return <div className="space-y-4 pb-20 md:pb-0"><SkeletonCard lines={5} /><SkeletonCard lines={4} /></div>
  if (query.isError || !query.data) return <ErrorState title="Không tải được bài nộp" description="Bài nộp có thể không tồn tại hoặc bạn không có quyền xem." onRetry={() => query.refetch()} />

  const item = query.data
  return (
    <div className="space-y-5 pb-20 md:pb-0">
      <PageHeader eyebrow="내 제출" title={item.assignmentTitle} description={`${item.className} · Nộp lúc ${fmtDate(item.submittedAt)}`} actions={<StatusBadge value={item.status} />} />
      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <Card className="rounded-3xl">
          <h2 className="text-lg font-black text-slate-950">Nội dung bài làm</h2>
          {item.contentText ? <div className="mt-4 whitespace-pre-line rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-700">{item.contentText}</div> : <EmptyState title="Không có nội dung văn bản" description="Bài nộp có thể dùng URL hoặc tệp đính kèm." />}
          <div className="mt-4 flex flex-wrap gap-2">
            {item.contentUrl && <a className="inline-flex min-h-11 items-center rounded-2xl border border-sky-200 px-4 text-sm font-bold text-slate-700" href={item.contentUrl} target="_blank" rel="noreferrer">Mở URL</a>}
            {item.fileId && <Button type="button" variant="secondary" className="min-h-11" onClick={() => api.downloadFile(item.fileId!, item.assignmentTitle)}><Download size={16} />Tải tệp</Button>}
          </div>
        </Card>
        <Card className="rounded-3xl bg-gradient-to-br from-white to-emerald-50/60">
          <h2 className="text-lg font-black text-slate-950">Điểm & phản hồi</h2>
          <div className="mt-5 text-5xl font-black text-slate-950">{item.score == null ? '-' : item.score}</div>
          <p className="mt-1 text-sm text-slate-500">/ {item.maxScore ?? 'điểm tối đa'}</p>
          {item.feedback ? <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm leading-7 text-emerald-800">{item.feedback}</div> : <p className="mt-5 text-sm text-slate-500">Giáo viên chưa để lại nhận xét.</p>}
        </Card>
      </div>
    </div>
  )
}

export function StudentSubmissionsPage() {
  const { submissionId } = useParams()
  const [page, setPage] = useState(0)
  const [status, setStatus] = useState<'ALL' | SubmissionStatus>('ALL')
  const [classId, setClassId] = useState('')
  const [search, setSearch] = useState('')

  const query = useQuery({ queryKey: ['student', 'submissions', page, status, classId], queryFn: () => api.mySubmissionsPage({ page, size: 10, status: status === 'ALL' ? undefined : status, classId: classId || undefined }) })
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
      <PageHeader eyebrow="내 제출" title="Bài nộp của tôi" description="Theo dõi toàn bộ bài đã nộp, trạng thái chấm điểm và phản hồi từ giáo viên." />
      <FilterBar>
        <div className="min-w-0 flex-1"><SearchInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm bài nộp, lớp, phản hồi..." aria-label="Tìm bài nộp" /></div>
        <Input value={classId} onChange={(event) => { setClassId(event.target.value); setPage(0) }} placeholder="classId" className="md:max-w-56" />
        <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
          {statusOptions.map((item) => <button key={item} type="button" onClick={() => { setStatus(item); setPage(0) }} className={`min-h-11 shrink-0 rounded-2xl px-4 text-sm font-bold ${status === item ? 'bg-indigo-600 text-white' : 'border border-sky-100 bg-white text-slate-600 hover:bg-sky-50'}`}>{item}</button>)}
        </div>
      </FilterBar>
      {filteredItems.length ? <div className="space-y-3">{filteredItems.map((item) => <SubmissionCard key={item.id} item={item} />)}</div> : <EmptyState title="Chưa có bài nộp phù hợp" description="Thử đổi bộ lọc hoặc quay lại sau khi bạn nộp bài." action={<FileText className="mx-auto text-indigo-400" />} />}
      <PaginationControls page={pageData.page} totalPages={pageData.totalPages} onPageChange={setPage} />
      <div className="rounded-3xl border border-white/70 bg-gradient-to-r from-sky-50 to-pink-50 p-4 text-sm text-slate-600"><Search className="mr-2 inline text-indigo-500" size={16} />Mẹo: dùng bộ lọc trạng thái để tìm nhanh bài cần nộp lại hoặc bài đã chấm.</div>
    </div>
  )
}

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle2, Clock3, FilePenLine, Search } from 'lucide-react'
import { api } from '../core/api'
import { EmptyState, ErrorState, FilterBar, PageHeader, SearchInput, SkeletonCard, StatusBadge } from '../components/foundation'
import { Card } from '../layout/ui'
import { fmtDate } from './phase2-utils'
import type { AssignmentItem, SubmissionItem } from '../core/types'

type StudentAssignmentState = 'CHƯA NỘP' | 'ĐÃ NỘP' | 'ĐÃ CHẤM' | 'NỘP LẠI' | 'QUÁ HẠN'

function minutesUntil(dueAt?: string | null) {
  if (!dueAt) return null
  return Math.floor((new Date(dueAt).getTime() - Date.now()) / 60000)
}

function deadlineText(dueAt?: string | null) {
  const minutes = minutesUntil(dueAt)
  if (minutes == null) return 'Không giới hạn hạn nộp'
  if (minutes < 0) return `Quá hạn ${Math.abs(Math.ceil(minutes / 1440)) || 1} ngày`
  if (minutes < 60) return `Còn ${minutes} phút`
  if (minutes < 1440) return `Còn ${Math.ceil(minutes / 60)} giờ`
  return `Còn ${Math.ceil(minutes / 1440)} ngày`
}

function isLateByDueAt(assignment: AssignmentItem, submission?: SubmissionItem) {
  if (!assignment.dueAt) return false
  const isPastDue = new Date(assignment.dueAt).getTime() < Date.now()
  if (!submission) return isPastDue
  return new Date(submission.submittedAt).getTime() > new Date(assignment.dueAt).getTime()
}

function getStudentState(assignment: AssignmentItem, submission?: SubmissionItem): StudentAssignmentState {
  if (submission?.status === 'GRADED' || submission?.score != null) return 'ĐÃ CHẤM'
  if (submission?.status === 'RESUBMIT_REQUESTED') return 'NỘP LẠI'
  if (submission) return 'ĐÃ NỘP'
  if (isLateByDueAt(assignment)) return 'QUÁ HẠN'
  return 'CHƯA NỘP'
}

function stateToneClass(state: StudentAssignmentState) {
  if (state === 'ĐÃ CHẤM') return 'border-emerald-100 bg-emerald-50 text-emerald-700'
  if (state === 'ĐÃ NỘP') return 'border-sky-100 bg-sky-50 text-sky-700'
  if (state === 'NỘP LẠI') return 'border-amber-100 bg-amber-50 text-amber-700'
  if (state === 'QUÁ HẠN') return 'border-rose-100 bg-rose-50 text-rose-700'
  return 'border-slate-100 bg-slate-50 text-slate-700'
}

function AssignmentCard({ item, submission }: Readonly<{ item: AssignmentItem; submission?: SubmissionItem }>) {
  const state = getStudentState(item, submission)
  const late = isLateByDueAt(item, submission)
  const locked = state === 'ĐÃ CHẤM' || item.status === 'CLOSED'
  return (
    <a href={`/student/assignments/${item.id}`} className="block rounded-3xl focus:outline-none focus:ring-4 focus:ring-indigo-100">
      <Card className={`rounded-3xl transition hover:-translate-y-0.5 hover:shadow-lg ${late && !submission ? 'border-rose-100 bg-rose-50/50' : ''}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="line-clamp-2 text-lg font-black text-slate-950">{item.title}</h2>
              <StatusBadge value={item.status} />
            </div>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{item.description || item.instruction || 'Bài luyện TOPIK'}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-600">
              <span className="inline-flex min-h-8 items-center gap-1 rounded-full bg-white px-3"><Clock3 size={14} /> {deadlineText(item.dueAt)}</span>
              <span className="inline-flex min-h-8 items-center rounded-full bg-white px-3">Hạn: {fmtDate(item.dueAt)}</span>
              {late && <span className="inline-flex min-h-8 items-center gap-1 rounded-full bg-rose-100 px-3 text-rose-700"><AlertTriangle size={14} /> {submission ? 'Nộp muộn' : 'Chưa nộp quá hạn'}</span>}
            </div>
          </div>
          <div className="flex min-w-36 flex-col items-start gap-2 sm:items-end">
            <span className={`inline-flex min-h-9 items-center rounded-full border px-3 text-xs font-black ${stateToneClass(state)}`}>{state}</span>
            <span className="text-xs font-semibold text-slate-500">{locked ? 'Đã khóa sửa' : submission ? 'Có thể sửa khi còn hạn' : 'Sẵn sàng nộp'}</span>
            {submission?.score != null && <span className="text-sm font-black text-emerald-600">{submission.score}/{submission.maxScore ?? item.maxScore}</span>}
          </div>
        </div>
      </Card>
    </a>
  )
}

export function StudentAssignmentsPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'ALL' | StudentAssignmentState>('ALL')
  const assignments = useQuery({ queryKey: ['student', 'assignments'], queryFn: () => api.assignmentsPage({ page: 0, size: 100 }) })
  const submissions = useQuery({ queryKey: ['student', 'assignments', 'my-submissions'], queryFn: () => api.mySubmissionsPage({ page: 0, size: 100 }) })

  const assignmentItems = useMemo(() => Array.isArray(assignments.data) ? assignments.data : assignments.data?.items ?? [], [assignments.data])
  const submissionItems = useMemo(() => Array.isArray(submissions.data) ? submissions.data : submissions.data?.items ?? [], [submissions.data])
  const submissionByAssignment = useMemo(() => new Map(submissionItems.map((item) => [item.assignmentId, item])), [submissionItems])

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return assignmentItems.filter((item) => {
      const submission = submissionByAssignment.get(item.id)
      const state = getStudentState(item, submission)
      const matchesFilter = filter === 'ALL' || state === filter
      const matchesSearch = !keyword || [item.title, item.className, item.description, item.instruction].some((value) => value?.toLowerCase().includes(keyword))
      return matchesFilter && matchesSearch
    })
  }, [assignmentItems, filter, search, submissionByAssignment])

  if (assignments.isLoading || submissions.isLoading) {
    return <div className="space-y-4 pb-20 md:pb-0"><SkeletonCard lines={4} /><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
  }

  if (assignments.isError || submissions.isError) {
    return <ErrorState title="Không tải được bài tập" description="Vui lòng thử lại sau ít phút." onRetry={() => { assignments.refetch(); submissions.refetch() }} />
  }

  return (
    <div className="space-y-5 pb-20 md:pb-0">
      <PageHeader eyebrow="Bài tập" title="Bài tập của tôi" description="Theo dõi deadline, trạng thái nộp bài và điểm số cho các lớp bạn đang tham gia." />

      <FilterBar>
        <div className="min-w-0 flex-1"><SearchInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm bài tập, lớp học..." aria-label="Tìm bài tập" /></div>
        <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
          {(['ALL', 'CHƯA NỘP', 'ĐÃ NỘP', 'ĐÃ CHẤM', 'NỘP LẠI', 'QUÁ HẠN'] as const).map((item) => (
            <button key={item} type="button" onClick={() => setFilter(item)} className={`min-h-11 shrink-0 rounded-2xl px-4 text-sm font-bold transition ${filter === item ? 'bg-indigo-600 text-white' : 'border border-sky-100 bg-white text-slate-600 hover:bg-sky-50'}`}>{item === 'ALL' ? 'Tất cả' : item}</button>
          ))}
        </div>
      </FilterBar>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="rounded-3xl"><div className="flex items-center gap-2 text-sm font-bold text-slate-600"><FilePenLine size={18} /> Tổng bài</div><div className="mt-2 text-3xl font-black">{assignmentItems.length}</div></Card>
        <Card className="rounded-3xl"><div className="flex items-center gap-2 text-sm font-bold text-slate-600"><Clock3 size={18} /> Chưa nộp</div><div className="mt-2 text-3xl font-black">{assignmentItems.filter((item) => getStudentState(item, submissionByAssignment.get(item.id)) === 'CHƯA NỘP').length}</div></Card>
        <Card className="rounded-3xl"><div className="flex items-center gap-2 text-sm font-bold text-slate-600"><CheckCircle2 size={18} /> Đã chấm</div><div className="mt-2 text-3xl font-black">{assignmentItems.filter((item) => getStudentState(item, submissionByAssignment.get(item.id)) === 'ĐÃ CHẤM').length}</div></Card>
      </div>

      {filtered.length ? (
        <div className="space-y-3">
          {filtered.map((item) => <AssignmentCard key={item.id} item={item} submission={submissionByAssignment.get(item.id)} />)}
        </div>
      ) : (
        <EmptyState
          title={search || filter !== 'ALL' ? 'Không tìm thấy bài tập phù hợp' : 'Chưa có bài tập'}
          description={search || filter !== 'ALL' ? 'Thử đổi từ khóa hoặc bộ lọc trạng thái.' : 'Bài tập từ các lớp bạn tham gia sẽ xuất hiện tại đây.'}
          action={<Search className="mx-auto text-indigo-400" />}
        />
      )}
    </div>
  )
}

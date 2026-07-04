import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Award, BarChart3, GraduationCap, TrendingUp } from 'lucide-react'
import { api } from '../core/api'
import { EmptyState, ErrorState, FilterBar, MetricCard, PageHeader, SearchInput, SkeletonCard, StatusBadge } from '../components/foundation'
import { Card } from '../layout/ui'
import { fmtDate } from './phase2-utils'
import type { SubmissionItem } from '../core/types'

type ClassGradeSummary = {
  className: string
  classId: string
  gradedCount: number
  totalScore: number
  average: number
  latest?: SubmissionItem
}

function buildClassSummaries(items: SubmissionItem[]): ClassGradeSummary[] {
  const map = new Map<string, { className: string; classId: string; rows: SubmissionItem[] }>()
  for (const item of items.filter((row) => row.score != null)) {
    const key = item.className || 'unknown'
    const current = map.get(key) ?? { className: item.className || 'Lớp học', classId: key, rows: [] }
    current.rows.push(item)
    map.set(key, current)
  }
  return Array.from(map.values()).map((group) => {
    const sorted = group.rows.slice().sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
    const totalScore = group.rows.reduce((sum, item) => sum + Number(item.score), 0)
    return { className: group.className, classId: group.classId, gradedCount: group.rows.length, totalScore, average: totalScore / group.rows.length, latest: sorted[0] }
  }).sort((a, b) => b.average - a.average)
}

export function StudentGradesPage() {
  const [search, setSearch] = useState('')
  const [selectedClass, setSelectedClass] = useState('ALL')
  const query = useQuery({ queryKey: ['student', 'grades', 'submissions'], queryFn: () => api.mySubmissionsPage({ page: 0, size: 200, status: 'GRADED' }) })

  const submissions = useMemo(() => Array.isArray(query.data) ? query.data : query.data?.items ?? [], [query.data])
  const graded = useMemo(() => submissions.filter((item) => item.score != null), [submissions])
  const summaries = useMemo(() => buildClassSummaries(graded), [graded])
  const overallAverage = useMemo(() => graded.length ? graded.reduce((sum, item) => sum + Number(item.score), 0) / graded.length : null, [graded])
  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return graded.filter((item) => {
      const matchesClass = selectedClass === 'ALL' || item.className === selectedClass
      const matchesSearch = !keyword || [item.assignmentTitle, item.className, item.feedback].some((value) => value?.toLowerCase().includes(keyword))
      return matchesClass && matchesSearch
    })
  }, [graded, search, selectedClass])

  if (query.isLoading) return <div className="space-y-4 pb-20 md:pb-0"><SkeletonCard lines={4} /><SkeletonCard /><SkeletonCard /></div>
  if (query.isError) return <ErrorState title="Không tải được điểm số" description="Vui lòng thử lại sau ít phút." onRetry={() => query.refetch()} />

  return (
    <div className="space-y-5 pb-20 md:pb-0">
      <PageHeader eyebrow="Điểm số" title="Điểm của tôi" description="Tổng hợp điểm đã chấm từ các bài nộp của bạn, kèm trung bình theo từng lớp." />

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="Điểm trung bình" value={overallAverage == null ? '-' : overallAverage.toFixed(1)} hint="Tất cả bài đã chấm" icon={<TrendingUp size={20} />} tone="emerald" />
        <MetricCard label="Bài đã chấm" value={graded.length} hint="Có điểm hoặc phản hồi" icon={<Award size={20} />} tone="indigo" />
        <MetricCard label="Số lớp có điểm" value={summaries.length} hint="Tổng hợp theo lớp" icon={<BarChart3 size={20} />} tone="sky" />
      </div>

      {summaries.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {summaries.map((item) => (
            <Card key={item.classId} className="rounded-3xl bg-gradient-to-br from-white to-emerald-50/50">
              <div className="flex items-start justify-between gap-3"><div><h2 className="font-black text-slate-950">{item.className}</h2><p className="mt-1 text-xs text-slate-500">{item.gradedCount} bài đã chấm</p></div><div className="text-3xl font-black text-emerald-600">{item.average.toFixed(1)}</div></div>
              {item.latest && <p className="mt-4 text-sm text-slate-600">Mới nhất: <b>{item.latest.assignmentTitle}</b> · {item.latest.score}/{item.latest.maxScore ?? '-'}</p>}
            </Card>
          ))}
        </div>
      )}

      <FilterBar>
        <div className="min-w-0 flex-1"><SearchInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm bài đã chấm, lớp, nhận xét..." aria-label="Tìm điểm" /></div>
        <select className="min-h-11 rounded-2xl border border-sky-100 bg-white px-4 text-sm font-bold text-slate-600" value={selectedClass} onChange={(event) => setSelectedClass(event.target.value)}>
          <option value="ALL">Tất cả lớp</option>
          {summaries.map((item) => <option key={item.classId} value={item.className}>{item.className}</option>)}
        </select>
      </FilterBar>

      {filtered.length ? (
        <div className="space-y-3">
          {filtered.map((item) => (
            <a key={item.id} href={`/student/submissions/${item.id}`} className="block rounded-3xl focus:outline-none focus:ring-4 focus:ring-indigo-100">
              <Card className="rounded-3xl">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="font-black text-slate-950">{item.assignmentTitle}</h2><StatusBadge value={item.status} /></div><p className="mt-1 text-sm text-slate-500">{item.className} · {fmtDate(item.submittedAt)}</p></div>
                  <div className="rounded-2xl bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700">{item.score}/{item.maxScore ?? '-'}</div>
                </div>
                {item.feedback && <p className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm leading-6 text-slate-600">{item.feedback}</p>}
              </Card>
            </a>
          ))}
        </div>
      ) : (
        <EmptyState title="Chưa có điểm phù hợp" description="Điểm sẽ xuất hiện khi giáo viên chấm bài nộp của bạn." action={<GraduationCap className="mx-auto text-indigo-400" />} />
      )}
    </div>
  )
}

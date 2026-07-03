import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, Copy, Eye, Trash2 } from 'lucide-react'
import { EmptyState, ErrorState, FilterBar, MetricCard, PageHeader, PaginationControls, SearchInput, SkeletonCard, StatusBadge } from '../components/foundation'
import { api } from '../core/api'
import { Button, Card } from '../layout/ui'
import { asPage, fmtDate } from './phase2-utils'

export function AssignmentsV2Page() {
  const qc = useQueryClient()
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [classId, setClassId] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const classes = useQuery({ queryKey: ['classes', 'assignment-filter'], queryFn: () => api.classesPage({ page: 0, size: 100 }) })
  const query = useQuery({ queryKey: ['assignments-v2', page, search, status, classId], queryFn: () => api.assignmentsPage({ page, size: 10, search, status, classId }) })
  const selected = useQuery({ queryKey: ['assignment', selectedId], queryFn: () => api.assignmentById(selectedId), enabled: Boolean(selectedId) })
  const progress = useQuery({ queryKey: ['assignment', selectedId, 'progress'], queryFn: () => api.assignmentProgress(selectedId), enabled: Boolean(selectedId) })
  const missing = useQuery({ queryKey: ['assignment', selectedId, 'missing'], queryFn: () => api.assignmentMissingStudents(selectedId), enabled: Boolean(selectedId) })
  const pageData = asPage(query.data, page, 10)
  const classesPage = asPage(classes.data, 0, 100)
  const copy = useMutation({ mutationFn: () => api.copyAssignment(selectedId), onSuccess: async () => qc.invalidateQueries({ queryKey: ['assignments-v2'] }) })
  const publish = useMutation({ mutationFn: () => api.publishAssignment(selectedId), onSuccess: async () => qc.invalidateQueries({ queryKey: ['assignments-v2'] }) })
  const close = useMutation({ mutationFn: () => api.closeAssignment(selectedId), onSuccess: async () => qc.invalidateQueries({ queryKey: ['assignments-v2'] }) })
  const remove = useMutation({ mutationFn: () => api.deleteAssignment(selectedId), onSuccess: async () => { setSelectedId(''); await qc.invalidateQueries({ queryKey: ['assignments-v2'] }) } })
  const reminder = useMutation({ mutationFn: () => api.sendAssignmentReminder(selectedId) })
  const selectedAssignment = useMemo(() => selected.data ?? pageData.items.find((item) => item.id === selectedId), [pageData.items, selected.data, selectedId])

  return <div className="space-y-5"><PageHeader eyebrow="과제 운영" title="Global assignments" description="Phân trang server-side, lọc theo trạng thái/lớp, xem progress và missing students." />
    <FilterBar><SearchInput value={search} onChange={(e) => { setPage(0); setSearch(e.target.value) }} placeholder="Tìm bài tập" /><select className="rounded-2xl border border-sky-100 bg-white px-3 py-2.5 text-sm" value={status} onChange={(e) => { setPage(0); setStatus(e.target.value) }}><option value="">Tất cả trạng thái</option><option value="DRAFT">DRAFT</option><option value="PUBLISHED">PUBLISHED</option><option value="CLOSED">CLOSED</option></select><select className="rounded-2xl border border-sky-100 bg-white px-3 py-2.5 text-sm" value={classId} onChange={(e) => { setPage(0); setClassId(e.target.value) }}><option value="">Tất cả lớp</option>{classesPage.items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></FilterBar>
    <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
      <Card>{query.isLoading && <SkeletonCard />}{query.isError && <ErrorState onRetry={() => void query.refetch()} />}{!query.isLoading && pageData.items.length === 0 && <EmptyState title="Chưa có bài tập" />}{pageData.items.length > 0 && <><div className="overflow-auto"><table className="w-full min-w-[880px] text-sm"><thead><tr className="border-b border-sky-100 text-left text-slate-500"><th className="px-3 py-3">Bài tập</th><th className="px-3 py-3">Lớp</th><th className="px-3 py-3">Hạn</th><th className="px-3 py-3">Trạng thái</th><th className="px-3 py-3">Điểm</th><th className="px-3 py-3">Hành động</th></tr></thead><tbody>{pageData.items.map((item) => <tr key={item.id} className={`border-b border-sky-50 ${selectedId === item.id ? 'bg-indigo-50/60' : ''}`}><td className="px-3 py-3 font-bold">{item.title}</td><td className="px-3 py-3">{item.className || item.classId}</td><td className="px-3 py-3">{fmtDate(item.dueAt)}</td><td className="px-3 py-3"><StatusBadge value={item.status} /></td><td className="px-3 py-3">{item.maxScore}</td><td className="px-3 py-3"><Button variant="ghost" onClick={() => setSelectedId(item.id)}><Eye size={14} /> Chi tiết</Button></td></tr>)}</tbody></table></div><div className="mt-4"><PaginationControls page={pageData.page} totalPages={pageData.totalPages} onPageChange={setPage} /></div></>}</Card>
      <Card className="rounded-3xl">{!selectedAssignment ? <EmptyState title="Chọn bài tập" description="Progress, missing students và action sẽ hiển thị tại đây." /> : <div className="space-y-4"><div><h2 className="text-xl font-black text-slate-950">{selectedAssignment.title}</h2><p className="mt-1 text-sm text-slate-500">{selectedAssignment.description || 'Không có mô tả'}</p></div><div className="grid grid-cols-2 gap-3"><MetricCard label="Đã nộp" value={progress.data?.submittedCount ?? '-'} /><MetricCard label="Thiếu" value={progress.data?.missingCount ?? '-'} /><MetricCard label="Đã chấm" value={progress.data?.gradedCount ?? '-'} /><MetricCard label="Cần chấm" value={progress.data?.needGradingCount ?? '-'} /></div><div className="flex flex-wrap gap-2"><Button variant="secondary" disabled={publish.isPending} onClick={() => publish.mutate()}>Publish</Button><Button variant="secondary" disabled={close.isPending} onClick={() => close.mutate()}>Close</Button><Button variant="secondary" disabled={copy.isPending} onClick={() => copy.mutate()}><Copy size={14} /> Copy</Button><Button variant="secondary" disabled={reminder.isPending} onClick={() => reminder.mutate()}><Bell size={14} /> Reminder</Button><Button variant="ghost" disabled={remove.isPending} onClick={() => remove.mutate()}><Trash2 size={14} /> Delete</Button></div><div><h3 className="font-bold">Missing students</h3><div className="mt-2 space-y-2">{(missing.data?.missingStudents ?? []).slice(0, 8).map((student) => <div key={student.studentId} className="rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{student.fullName}</div>)}{missing.data && missing.data.missingCount === 0 && <p className="text-sm text-slate-500">Không có học viên thiếu bài.</p>}</div></div></div>}</Card>
    </div>
  </div>
}

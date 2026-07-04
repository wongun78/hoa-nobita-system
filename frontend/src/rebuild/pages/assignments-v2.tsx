import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, Copy, Eye, Trash2, X } from 'lucide-react'
import { ConfirmDialog, EmptyState, ErrorState, FilterBar, MetricCard, PageHeader, PaginationControls, SearchInput, SkeletonCard, StatusBadge } from '../components/foundation'
import { api } from '../core/api'
import { ApiClientError } from '../core/http'
import { Button, Card } from '../layout/ui'
import { asPage, fmtDate } from './phase2-utils'
import type { AssignmentItem, PageResponse } from '../core/types'

function patchItemInPage(old: PageResponse<AssignmentItem> | AssignmentItem[] | undefined, id: string, patch: Partial<AssignmentItem>) {
  if (!old) return old
  if (Array.isArray(old)) return old.map((item) => item.id === id ? { ...item, ...patch } : item)
  return { ...old, items: old.items.map((item) => item.id === id ? { ...item, ...patch } : item) }
}

export function AssignmentsV2Page() {
  const qc = useQueryClient()
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [classId, setClassId] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const assignmentsQueryKey = ['assignments-v2', page, search, status, classId] as const

  useEffect(() => {
    if (!selectedId) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [selectedId])

  useEffect(() => {
    if (!selectedId) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelectedId('') }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectedId])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(timer)
  }, [toast])

  const classes = useQuery({ queryKey: ['classes', 'assignment-filter'], queryFn: () => api.classesPage({ page: 0, size: 100 }) })
  const query = useQuery({ queryKey: assignmentsQueryKey, queryFn: () => api.assignmentsPage({ page, size: 10, search, status, classId }) })
  const selected = useQuery({ queryKey: ['assignment', selectedId], queryFn: () => api.assignmentById(selectedId), enabled: Boolean(selectedId) })
  const progress = useQuery({ queryKey: ['assignment', selectedId, 'progress'], queryFn: () => api.assignmentProgress(selectedId), enabled: Boolean(selectedId) })
  const missing = useQuery({ queryKey: ['assignment', selectedId, 'missing'], queryFn: () => api.assignmentMissingStudents(selectedId), enabled: Boolean(selectedId) })
  const pageData = asPage(query.data, page, 10)
  const classesPage = asPage(classes.data, 0, 100)
  const selectedAssignment = useMemo(() => selected.data ?? pageData.items.find((item) => item.id === selectedId), [pageData.items, selected.data, selectedId])

  const showError = (err: unknown, fallback: string) => { setToast({ type: 'error', message: err instanceof ApiClientError ? err.message : fallback }) }

  const invalidateAll = async () => {
    await qc.invalidateQueries({ queryKey: ['assignments-v2'] })
    await qc.invalidateQueries({ queryKey: ['assignment', selectedId] })
  }

  const optimisticStatus = async (id: string, newStatus: string) => {
    await qc.cancelQueries({ queryKey: assignmentsQueryKey })
    const previous = qc.getQueryData(assignmentsQueryKey)
    qc.setQueryData(assignmentsQueryKey, (old) => patchItemInPage(old, id, { status: newStatus as AssignmentItem['status'] }))
    return { previous }
  }

  const copy = useMutation({
    mutationFn: () => api.copyAssignment(selectedId),
    onSuccess: async () => { await qc.invalidateQueries({ queryKey: ['assignments-v2'] }); setToast({ type: 'success', message: 'Đã sao chép bài tập.' }) },
    onError: (err) => showError(err, 'Không thể sao chép bài tập.'),
  })

  const publish = useMutation({
    mutationFn: () => api.publishAssignment(selectedId),
    onMutate: () => optimisticStatus(selectedId, 'PUBLISHED'),
    onError: (err, _v, ctx) => { if (ctx?.previous) qc.setQueryData(assignmentsQueryKey, ctx.previous); showError(err, 'Không thể xuất bản bài tập.') },
    onSuccess: async () => { await invalidateAll(); setToast({ type: 'success', message: 'Đã xuất bản bài tập.' }) },
  })

  const close = useMutation({
    mutationFn: () => api.closeAssignment(selectedId),
    onMutate: () => optimisticStatus(selectedId, 'CLOSED'),
    onError: (err, _v, ctx) => { if (ctx?.previous) qc.setQueryData(assignmentsQueryKey, ctx.previous); showError(err, 'Không thể đóng bài tập.') },
    onSuccess: async () => { await invalidateAll(); setToast({ type: 'success', message: 'Đã đóng bài tập.' }) },
  })

  const remove = useMutation({
    mutationFn: () => api.deleteAssignment(selectedId),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: assignmentsQueryKey })
      const previous = qc.getQueryData(assignmentsQueryKey)
      qc.setQueryData(assignmentsQueryKey, (old) => {
        if (!old) return old
        if (Array.isArray(old)) return old.filter((item) => item.id !== selectedId)
        return { ...old, items: old.items.filter((item) => item.id !== selectedId), totalItems: Math.max(old.totalItems - 1, 0) }
      })
      return { previous }
    },
    onError: (err, _v, ctx) => { if (ctx?.previous) qc.setQueryData(assignmentsQueryKey, ctx.previous); showError(err, 'Không thể xoá bài tập.') },
    onSuccess: async () => { setConfirmDelete(false); setSelectedId(''); await qc.invalidateQueries({ queryKey: ['assignments-v2'] }); setToast({ type: 'success', message: 'Đã xoá bài tập.' }) },
  })

  const reminder = useMutation({
    mutationFn: () => api.sendAssignmentReminder(selectedId),
    onSuccess: async (data) => { await qc.invalidateQueries({ queryKey: ['assignments-v2'] }); setToast({ type: 'success', message: `Đã gửi nhắc nhở đến ${data.recipientCount ?? 0} học viên.` }) },
    onError: (err) => showError(err, 'Không thể gửi nhắc nhở.'),
  })

  return <>
    <div className="space-y-5">
      <PageHeader eyebrow="Quản lý bài tập" title="Bài tập" description="Phân trang server-side, lọc theo trạng thái/lớp, xem progress và missing students." />
      <FilterBar>
        <SearchInput value={search} onChange={(e) => { setPage(0); setSearch(e.target.value) }} placeholder="Tìm bài tập" />
        <select className="rounded-2xl border border-sky-100 bg-white px-3 py-2.5 text-sm" value={status} onChange={(e) => { setPage(0); setStatus(e.target.value) }}>
          <option value="">Tất cả trạng thái</option>
          <option value="DRAFT">Nháp</option>
          <option value="PUBLISHED">Đã đăng</option>
          <option value="CLOSED">Đã đóng</option>
        </select>
        <select className="rounded-2xl border border-sky-100 bg-white px-3 py-2.5 text-sm" value={classId} onChange={(e) => { setPage(0); setClassId(e.target.value) }}>
          <option value="">Tất cả lớp</option>
          {classesPage.items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </FilterBar>
      <Card className="max-w-full min-w-0">
        {query.isLoading && <SkeletonCard />}
        {query.isError && <ErrorState onRetry={() => void query.refetch()} />}
        {!query.isLoading && pageData.items.length === 0 && <EmptyState title="Chưa có bài tập" />}
        {pageData.items.length > 0 && <>
          <div className="overflow-auto">
            <table className="w-full min-w-[880px] text-sm">
              <thead>
                <tr className="border-b border-sky-100 text-left text-slate-500">
                  <th className="px-3 py-3">Bài tập</th>
                  <th className="px-3 py-3">Lớp</th>
                  <th className="px-3 py-3">Hạn</th>
                  <th className="px-3 py-3">Trạng thái</th>
                  <th className="px-3 py-3">Điểm</th>
                  <th className="px-3 py-3">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {pageData.items.map((item) => (
                  <tr key={item.id} className="border-b border-sky-50">
                    <td className="px-3 py-3 font-bold">{item.title}</td>
                    <td className="px-3 py-3">{item.className || item.classId}</td>
                    <td className="px-3 py-3">{fmtDate(item.dueAt)}</td>
                    <td className="px-3 py-3"><StatusBadge value={item.status} /></td>
                    <td className="px-3 py-3">{item.maxScore}</td>
                    <td className="px-3 py-3"><Button variant="ghost" onClick={() => setSelectedId(item.id)}><Eye size={14} /> Chi tiết</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4"><PaginationControls page={pageData.page} totalPages={pageData.totalPages} onPageChange={setPage} /></div>
        </>}
      </Card>
    </div>

    {selectedId && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelectedId('')}>
        <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-sky-100 bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-950">{selectedAssignment?.title ?? 'Đang tải...'}</h2>
            <button type="button" onClick={() => setSelectedId('')} className="rounded-xl p-1 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
          </div>
          {selected.isLoading && <p className="text-sm text-slate-500">Đang tải chi tiết bài tập...</p>}
          {selected.isError && <EmptyState title="Lỗi tải bài tập" description="Không thể tải chi tiết. Vui lòng thử lại." />}
          {selectedAssignment && (
            <div className="space-y-4">
              <p className="text-sm text-slate-500">{selectedAssignment.description || 'Không có mô tả'}</p>
              <div className="grid grid-cols-2 gap-3">
                <MetricCard label="Đã nộp" value={progress.data?.submittedCount ?? '-'} />
                <MetricCard label="Thiếu" value={progress.data?.missingCount ?? '-'} />
                <MetricCard label="Đã chấm" value={progress.data?.gradedCount ?? '-'} />
                <MetricCard label="Cần chấm" value={progress.data?.needGradingCount ?? '-'} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" disabled={publish.isPending || selectedAssignment.status === 'PUBLISHED'} onClick={() => publish.mutate()}>Xuất bản</Button>
                <Button variant="secondary" disabled={close.isPending || selectedAssignment.status === 'CLOSED'} onClick={() => close.mutate()}>Đóng bài</Button>
                <Button variant="secondary" disabled={copy.isPending} onClick={() => copy.mutate()}><Copy size={14} /> Sao chép</Button>
                <Button variant="secondary" disabled={reminder.isPending} onClick={() => reminder.mutate()}><Bell size={14} /> Nhắc nộp</Button>
                <Button variant="ghost" disabled={remove.isPending} onClick={() => setConfirmDelete(true)}><Trash2 size={14} /> Xoá</Button>
              </div>
              <div>
                <h3 className="font-bold">Học viên thiếu bài</h3>
                <div className="mt-2 space-y-2">
                  {(missing.data?.missingStudents ?? []).slice(0, 8).map((student) => <div key={student.studentId} className="rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{student.fullName}</div>)}
                  {missing.data && missing.data.missingCount === 0 && <p className="text-sm text-slate-500">Không có học viên thiếu bài.</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )}

    {toast && (
      <div className={`fixed bottom-4 right-4 z-[60] rounded-2xl px-4 py-3 text-sm font-bold shadow-lg ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
        {toast.message}
      </div>
    )}

    <ConfirmDialog open={confirmDelete} title="Xoá bài tập này?" description="Bài tập sẽ bị xoá khỏi danh sách. Hãy kiểm tra bài nộp liên quan trước khi xác nhận." confirmLabel={remove.isPending ? 'Đang xoá...' : 'Xoá bài tập'} onCancel={() => setConfirmDelete(false)} onConfirm={() => remove.mutate()} />
  </>
}

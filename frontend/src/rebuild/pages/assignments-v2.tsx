import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { Bell, Check, Copy, Download, Edit3, Eye, FileText, LinkIcon, Plus, Trash2 } from 'lucide-react'
import { ConfirmDialog, EmptyState, ErrorState, FilterBar, FilterSelect, MetricCard, Modal, PageHeader, PaginationControls, SearchInput, SkeletonCard, StatusBadge } from '../components/foundation'
import { api } from '../core/api'
import { ApiClientError } from '../core/http'
import { MultiFileUpload } from '../components/multi-file-upload'
import { FilePreviewModal } from '../components/file-preview-modal'
import { Button, Card, FieldLabel, Input, TextArea } from '../layout/ui'
import { asPage, fmtDate } from './phase2-utils'
import type { AssignmentItem, ClassItem, FileItem, PageResponse } from '../core/types'

function patchItemInPage(old: PageResponse<AssignmentItem> | AssignmentItem[] | undefined, id: string, patch: Partial<AssignmentItem>) {
  if (!old) return old
  if (Array.isArray(old)) return old.map((item) => item.id === id ? { ...item, ...patch } : item)
  return { ...old, items: old.items.map((item) => item.id === id ? { ...item, ...patch } : item) }
}

const SKILL_OPTIONS = ['듣기 (Nghe)', 'Đọc (Đọc)', '쓰기 (Viết)', '말하기 (Nói)', 'Tổng hợp'] as const

function FileRow({ fileId, label, onPreview }: Readonly<{ fileId: string; label: string; onPreview: (id: string, name: string, type?: string) => void }>) {
  const meta = useQuery({ queryKey: ['file-meta', fileId], queryFn: () => api.fileMetadata(fileId), enabled: Boolean(fileId) })
  const displayName = meta.data?.originalFileName || label
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-sky-100 bg-sky-50/50 px-3 py-2">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><FileText size={16} /></div>
      <span className="min-w-0 flex-1 truncate text-sm font-bold text-slate-700">{displayName}</span>
      <button type="button" className="inline-flex min-h-11 items-center gap-1 rounded-2xl bg-indigo-600 px-3 text-sm font-bold text-white transition hover:bg-indigo-700" onClick={() => api.downloadFile(fileId, displayName)}><Download size={16} />Tải</button>
      <button type="button" className="inline-flex min-h-11 items-center gap-1 rounded-2xl border border-sky-200 px-3 text-sm font-bold text-slate-700 transition hover:bg-sky-50" onClick={() => { if (meta.data) onPreview(meta.data.id, meta.data.originalFileName, meta.data.contentType) }}><Eye size={16} />Xem</button>
    </div>
  )
}

function AssignmentFormModal({ assignment, onClose }: Readonly<{ assignment?: AssignmentItem; onClose: () => void }>) {
  const qc = useQueryClient()
  const isEdit = Boolean(assignment)
  const classes = useQuery({ queryKey: ['classes', 'create-assignment'], queryFn: () => api.classesPage({ page: 0, size: 100 }) })
  const classesList = asPage(classes.data, 0, 100).items as ClassItem[]

  const [selectedClassIds, setSelectedClassIds] = useState<string[]>(() => assignment?.classId ? [assignment.classId] : [])
  const [title, setTitle] = useState(assignment?.title ?? '')
  const [description, setDescription] = useState(assignment?.description ?? '')
  const [instruction, setInstruction] = useState(assignment?.instruction ?? '')
  const [dueAt, setDueAt] = useState(() => assignment?.dueAt ? new Date(assignment.dueAt).toISOString().slice(0, 16) : '')
  const [maxScore, setMaxScore] = useState(String(assignment?.maxScore ?? 100))
  const [allowResubmit, setAllowResubmit] = useState(assignment?.allowResubmit ?? false)
  const [skill, setSkill] = useState(assignment?.skill ?? '')
  const [externalLink, setExternalLink] = useState(assignment?.externalLink ?? '')
  const [files, setFiles] = useState<FileItem[]>([])
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const toggleClass = (id: string) => setSelectedClassIds((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id])

  const create = useMutation({
    mutationFn: () => api.createAssignmentsMulti({
      classIds: selectedClassIds,
      title: title.trim(),
      description: description.trim() || undefined,
      instruction: instruction.trim() || undefined,
      dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
      maxScore: Number(maxScore) || 100,
      allowResubmit,
      skill: skill || undefined,
      fileId: files.length > 0 ? files[0].id : undefined,
      fileIds: files.length > 0 ? files.map((f) => f.id) : undefined,
      externalLink: externalLink.trim() || undefined,
    }),
    onSuccess: async (data) => {
      await qc.invalidateQueries({ queryKey: ['assignments-v2'] })
      setToast({ type: 'success', message: `Đã tạo ${data.length} bài tập.` })
      setTimeout(() => onClose(), 1200)
    },
    onError: () => setToast({ type: 'error', message: 'Không thể tạo bài tập. Kiểm tra dữ liệu và thử lại.' }),
  })

  const update = useMutation({
    mutationFn: () => api.updateAssignment(assignment!.id, {
      title: title.trim(),
      description: description.trim() || undefined,
      instruction: instruction.trim() || undefined,
      dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
      maxScore: Number(maxScore) || 100,
      allowResubmit,
      skill: skill || undefined,
      fileId: files.length > 0 ? files[0].id : assignment?.fileId ?? undefined,
      fileIds: files.length > 0 ? files.map((f) => f.id) : assignment?.fileIds ?? undefined,
      externalLink: externalLink.trim() || undefined,
    }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['assignments-v2'] })
      await qc.invalidateQueries({ queryKey: ['assignment', assignment!.id] })
      setToast({ type: 'success', message: 'Đã cập nhật bài tập.' })
      setTimeout(() => onClose(), 1200)
    },
    onError: () => setToast({ type: 'error', message: 'Không thể cập nhật bài tập. Kiểm tra dữ liệu và thử lại.' }),
  })

  const mutation = isEdit ? update : create

  const canSubmit = selectedClassIds.length > 0 && title.trim()

  return (
    <Modal open onClose={onClose} title={isEdit ? 'Chỉnh sửa bài tập' : 'Tạo bài tập mới'}>
      <div className="space-y-4">
          {/* Multi-class select */}
          <div>
            <FieldLabel>Chọn lớp (có thể chọn nhiều)</FieldLabel>
            <div className="mt-2 flex flex-wrap gap-2">
              {classesList.map((cls) => {
                const active = selectedClassIds.includes(cls.id)
                return (
                  <button key={cls.id} type="button" onClick={() => toggleClass(cls.id)}
                    className={`inline-flex items-center gap-1.5 rounded-2xl border px-3 py-2 text-sm font-bold transition ${active ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-sky-100 bg-white text-slate-600 hover:bg-sky-50'}`}>
                    {active && <Check size={14} />} {cls.name}
                  </button>
                )
              })}
              {classesList.length === 0 && <p className="text-sm text-slate-400">Đang tải danh sách lớp...</p>}
            </div>
          </div>

          {/* Title */}
          <div>
            <FieldLabel htmlFor="asn-title">Tiêu đề *</FieldLabel>
            <Input id="asn-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="VD: Đề thi TOPIK II - lần 1" />
          </div>

          {/* Skill */}
          <div>
            <FieldLabel htmlFor="asn-skill">Kỹ năng</FieldLabel>
            <div className="mt-1 flex flex-wrap gap-2">
              {SKILL_OPTIONS.map((s) => (
                <button key={s} type="button" onClick={() => setSkill(skill === s ? '' : s)}
                  className={`rounded-2xl border px-3 py-1.5 text-xs font-bold transition ${skill === s ? 'border-violet-300 bg-violet-50 text-violet-700' : 'border-sky-100 bg-white text-slate-500 hover:bg-sky-50'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <FieldLabel htmlFor="asn-desc">Mô tả</FieldLabel>
            <TextArea id="asn-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Mô tả ngắn về bài tập..." />
          </div>

          {/* Instruction */}
          <div>
            <FieldLabel htmlFor="asn-inst">Hướng dẫn</FieldLabel>
            <TextArea id="asn-inst" rows={3} value={instruction} onChange={(e) => setInstruction(e.target.value)} placeholder="Hướng dẫn chi tiết cho học viên..." />
          </div>

          {/* Due date + Max score row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel htmlFor="asn-due">Hạn nộp</FieldLabel>
              <Input id="asn-due" type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
            </div>
            <div>
              <FieldLabel htmlFor="asn-score">Điểm tối đa</FieldLabel>
              <Input id="asn-score" type="number" value={maxScore} onChange={(e) => setMaxScore(e.target.value)} min="1" />
            </div>
          </div>

          {/* File upload */}
          <div>
            <FieldLabel>Tệp đính kèm</FieldLabel>
            <div className="mt-1">
              <MultiFileUpload value={files} onChange={setFiles} disabled={mutation.isPending} />
            </div>
          </div>

          {/* External link */}
          <div>
            <FieldLabel htmlFor="asn-link">Liên kết ngoài</FieldLabel>
            <Input id="asn-link" value={externalLink} onChange={(e) => setExternalLink(e.target.value)} placeholder="https://..." />
          </div>

          {/* Allow resubmit */}
          <label className="flex min-h-11 items-center gap-3 rounded-2xl border border-sky-100 bg-sky-50/50 px-4 text-sm font-bold text-slate-700">
            <input type="checkbox" checked={allowResubmit} onChange={(e) => setAllowResubmit(e.target.checked)} className="h-4 w-4 rounded border-sky-200 text-indigo-600" />
            Cho phép nộp lại
          </label>

          {toast && <div className={`rounded-2xl px-4 py-3 text-sm font-bold ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{toast.message}</div>}

          <Button className="min-h-11 w-full" disabled={!canSubmit || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? (isEdit ? 'Đang cập nhật...' : 'Đang tạo...') : isEdit ? 'Cập nhật bài tập' : `Tạo bài tập${selectedClassIds.length > 1 ? ` (${selectedClassIds.length} lớp)` : ''}`}
          </Button>
        </div>
    </Modal>
  )
}

export function AssignmentsV2Page() {
  const qc = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [classId, setClassId] = useState('')
  const [selectedId, setSelectedId] = useState(() => searchParams.get('open') ?? '')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<AssignmentItem | null>(null)
  const [previewFile, setPreviewFile] = useState<{ id: string; name: string; type?: string } | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const assignmentsQueryKey = ['assignments-v2', page, search, status, classId] as const

  useEffect(() => {
    if (selectedId) {
      document.body.style.overflow = 'hidden'
      setSearchParams((prev) => { prev.set('open', selectedId); return prev }, { replace: true })
    } else {
      document.body.style.overflow = ''
      setSearchParams((prev) => { prev.delete('open'); return prev }, { replace: true })
    }
    return () => { document.body.style.overflow = '' }
  }, [selectedId, setSearchParams])

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
    qc.setQueryData(assignmentsQueryKey, (old: PageResponse<AssignmentItem> | AssignmentItem[] | undefined) => patchItemInPage(old, id, { status: newStatus as AssignmentItem['status'] }))
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
      qc.setQueryData(assignmentsQueryKey, (old: PageResponse<AssignmentItem> | AssignmentItem[] | undefined) => {
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
      <PageHeader eyebrow="Quản lý bài tập" title="Bài tập" description="Phân trang server-side, lọc theo trạng thái/lớp, xem progress và missing students." actions={<Button className="min-h-11" onClick={() => setShowCreate(true)}><Plus size={16} /> Tạo bài tập</Button>} />
      <FilterBar>
        <SearchInput value={search} onChange={(e) => { setPage(0); setSearch(e.target.value) }} placeholder="Tìm bài tập" />
        <FilterSelect value={status} onChange={(v) => { setPage(0); setStatus(v) }} options={[{ value: 'DRAFT', label: 'Nháp' }, { value: 'PUBLISHED', label: 'Đã đăng' }, { value: 'CLOSED', label: 'Đã đóng' }]} placeholder="Tất cả trạng thái" />
        <FilterSelect value={classId} onChange={(v) => { setPage(0); setClassId(v) }} options={classesPage.items.map((item) => ({ value: item.id, label: item.name }))} placeholder="Tất cả lớp" />
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
                  <th className="px-3 py-3">Kỹ năng</th>
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
                    <td className="px-3 py-3">{item.skill ? <span className="rounded-xl bg-violet-50 px-2 py-0.5 text-xs font-bold text-violet-700">{item.skill}</span> : <span className="text-slate-300">—</span>}</td>
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
      <Modal open title={selectedAssignment?.title ?? 'Đang tải...'} onClose={() => setSelectedId('')}>
          {selected.isLoading && <p className="text-sm text-slate-500">Đang tải chi tiết bài tập...</p>}
          {selected.isError && <EmptyState title="Lỗi tải bài tập" description="Không thể tải chi tiết. Vui lòng thử lại." />}
          {selectedAssignment && (
            <div className="space-y-4">
              <p className="text-sm text-slate-500">{selectedAssignment.description || 'Không có mô tả'}</p>
              {(selectedAssignment.skill || selectedAssignment.fileId || (selectedAssignment.fileIds && selectedAssignment.fileIds.length > 0) || selectedAssignment.externalLink) && (
                <div className="flex flex-wrap gap-2">
                  {selectedAssignment.skill && <span className="inline-flex items-center gap-1 rounded-2xl bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700"><FileText size={12} /> {selectedAssignment.skill}</span>}
                  {selectedAssignment.externalLink && <a href={selectedAssignment.externalLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-2xl bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100"><LinkIcon size={12} /> Liên kết ngoài</a>}
                </div>
              )}
              {(() => {
                const allFileIds = [...new Set([selectedAssignment.fileId, ...(selectedAssignment.fileIds ?? [])].filter((f): f is string => Boolean(f)))]
                if (allFileIds.length === 0) return null
                return (
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-slate-700">Tài liệu đính kèm ({allFileIds.length})</h3>
                    {allFileIds.map((fid, idx) => <FileRow key={fid} fileId={fid} label={`Tài liệu ${idx + 1}`} onPreview={(id, name, type) => setPreviewFile({ id, name, type })} />)}
                  </div>
                )
              })()}
              <div className="grid grid-cols-2 gap-3">
                <MetricCard label="Đã nộp" value={progress.data?.submittedCount ?? '-'} />
                <MetricCard label="Thiếu" value={progress.data?.missingCount ?? '-'} />
                <MetricCard label="Đã chấm" value={progress.data?.gradedCount ?? '-'} />
                <MetricCard label="Cần chấm" value={progress.data?.needGradingCount ?? '-'} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => { setEditingAssignment(selectedAssignment ?? null); setSelectedId(''); setShowEdit(true) }}><Edit3 size={14} /> Chỉnh sửa</Button>
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
      </Modal>
    )}

    {toast && (
      <div className={`fixed bottom-4 right-4 z-[60] rounded-2xl px-4 py-3 text-sm font-bold shadow-lg ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
        {toast.message}
      </div>
    )}

    <ConfirmDialog open={confirmDelete} title="Xoá bài tập này?" description="Bài tập sẽ bị xoá khỏi danh sách. Hãy kiểm tra bài nộp liên quan trước khi xác nhận." confirmLabel={remove.isPending ? 'Đang xoá...' : 'Xoá bài tập'} onCancel={() => setConfirmDelete(false)} onConfirm={() => remove.mutate()} />

    {showCreate && <AssignmentFormModal onClose={() => setShowCreate(false)} />}
    {showEdit && editingAssignment && <AssignmentFormModal assignment={editingAssignment} onClose={() => { setShowEdit(false); setEditingAssignment(null) }} />}
    {previewFile && <FilePreviewModal fileId={previewFile.id} fileName={previewFile.name} contentType={previewFile.type} onClose={() => setPreviewFile(null)} />}
  </>
}

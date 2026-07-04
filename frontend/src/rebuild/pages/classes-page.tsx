import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Grid2X2, List, Pencil, Plus, X } from 'lucide-react'
import { z } from 'zod'
import { useNewAuth } from '../auth/use-auth'
import { EmptyState, ErrorState, FilterBar, PageHeader, PaginationControls, SearchInput, SkeletonCard, StatusBadge } from '../components/foundation'
import { api } from '../core/api'
import { ApiClientError } from '../core/http'
import type { ClassItem, ClassStatus, UserItem } from '../core/types'
import { Button, Card, FieldLabel, Input, TextArea } from '../layout/ui'
import { asPage, fmtDate } from './phase2-utils'

const createClassSchema = z.object({
  name: z.string().min(1, 'Tên lớp là bắt buộc'),
  code: z.string().min(1, 'Mã lớp là bắt buộc'),
})

export function ClassesPage() {
  const { hasRole } = useNewAuth()
  const isTeacher = hasRole('TEACHER_OWNER')
  const isAdmin = hasRole('CLASS_ADMIN')
  const qc = useQueryClient()
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [view, setView] = useState<'card' | 'table'>('card')
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [classStatus, setClassStatus] = useState<ClassStatus>('DRAFT')
  const [adminId, setAdminId] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editItem, setEditItem] = useState<ClassItem | null>(null)
  const [editName, setEditName] = useState('')
  const [editCode, setEditCode] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editStatus, setEditStatus] = useState<ClassStatus>('ACTIVE')
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})
  const basePath = isAdmin ? '/admin/classes' : isTeacher ? '/teacher/classes' : '/student/classes'
  const query = useQuery({ queryKey: ['classes', page, search, status], queryFn: () => api.classesPage({ page, size: 12, search, status }) })
  const pageData = asPage(query.data, page, 12)
  const adminsQ = useQuery({ queryKey: ['users', 'CLASS_ADMIN'], queryFn: () => api.usersPage({ role: 'CLASS_ADMIN', size: 100 }), enabled: showCreate })
  const adminList: UserItem[] = Array.isArray(adminsQ.data) ? adminsQ.data : adminsQ.data?.items ?? []
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t) }, [toast])
  const resetEdit = () => { setEditOpen(false); setEditItem(null); setEditErrors({}) }
  const openEdit = (item: ClassItem) => { setEditItem(item); setEditName(item.name); setEditCode(item.code); setEditDesc(item.description ?? ''); setEditStatus(item.status as ClassStatus); setEditErrors({}); setEditOpen(true) }
  const editClass = useMutation({
    mutationFn: async () => {
      if (!editItem) return
      if (!editName.trim()) { setEditErrors({ name: 'Tên lớp là bắt buộc' }); throw new Error('validation') }
      if (!editCode.trim()) { setEditErrors({ code: 'Mã lớp là bắt buộc' }); throw new Error('validation') }
      setEditErrors({})
      await api.updateClass(editItem.id, { name: editName, code: editCode, description: editDesc || undefined, status: editStatus })
    },
    onSuccess: async () => { resetEdit(); setToast({ type: 'success', message: 'Đã cập nhật lớp học.' }); await qc.invalidateQueries({ queryKey: ['classes'] }) },
    onError: (err: unknown) => { if (err instanceof Error && err.message === 'validation') return; setToast({ type: 'error', message: err instanceof ApiClientError ? err.message : 'Không thể cập nhật. Vui lòng thử lại.' }) },
  })
  const resetCreate = () => { setShowCreate(false); setName(''); setCode(''); setDescription(''); setClassStatus('DRAFT'); setAdminId(''); setFieldErrors({}) }
  const create = useMutation({
    mutationFn: async () => {
      const parsed = createClassSchema.safeParse({ name, code })
      if (!parsed.success) { const fe: Record<string, string> = {}; parsed.error.issues.forEach((i) => { fe[String(i.path[0])] = i.message }); setFieldErrors(fe); throw new Error('validation') }
      setFieldErrors({})
      const cls = await api.createClass({ name, code, description: description || undefined, status: classStatus })
      if (adminId) await api.addClassAdmin(cls.id, { userId: adminId })
      return cls
    },
    onSuccess: async () => { resetCreate(); setToast({ type: 'success', message: 'Đã tạo lớp học thành công.' }); await qc.invalidateQueries({ queryKey: ['classes'] }) },
    onError: (err: unknown) => { if (err instanceof Error && err.message === 'validation') return; setToast({ type: 'error', message: err instanceof ApiClientError ? err.message : 'Không thể tạo lớp học. Vui lòng thử lại.' }) },
  })
  const canCreate = isTeacher

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="클래스 운영" title={isAdmin ? 'Lớp được giao' : 'Lớp học'} description={isAdmin ? 'CLASS_ADMIN chỉ thấy lớp được phân quyền và không có action global-only.' : 'Tìm kiếm, lọc và quản lý lớp học.'} actions={canCreate && <Button onClick={() => setShowCreate(true)}><Plus size={16} /> Tạo lớp</Button>} />
      <FilterBar><SearchInput value={search} onChange={(e) => { setPage(0); setSearch(e.target.value) }} placeholder="Tìm lớp, mã lớp" /><select className="rounded-2xl border border-sky-100 bg-white px-3 py-2.5 text-sm" value={status} onChange={(e) => { setPage(0); setStatus(e.target.value) }}><option value="">Tất cả trạng thái</option><option value="DRAFT">DRAFT</option><option value="ACTIVE">ACTIVE</option><option value="COMPLETED">COMPLETED</option><option value="ARCHIVED">ARCHIVED</option></select><div className="ml-auto flex gap-1"><Button variant={view === 'card' ? 'primary' : 'secondary'} onClick={() => setView('card')}><Grid2X2 size={16} /></Button><Button variant={view === 'table' ? 'primary' : 'secondary'} onClick={() => setView('table')}><List size={16} /></Button></div></FilterBar>
      {toast && <div className={`fixed bottom-6 right-6 z-[60] rounded-2xl px-5 py-3 text-sm font-bold shadow-lg ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'}`}>{toast.message}</div>}
      {editOpen && editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={resetEdit}>
          <div className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
          <Card className="shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-950">Sửa lớp — {editItem.code}</h2>
              <button type="button" onClick={resetEdit} className="rounded-xl p-1 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
            </div>
            <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); editClass.mutate() }}>
              <div>
                <FieldLabel htmlFor="edit-name">Tên lớp <span className="text-rose-500">*</span></FieldLabel>
                <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
                {editErrors.name && <p className="mt-1 text-xs text-rose-500">{editErrors.name}</p>}
              </div>
              <div>
                <FieldLabel htmlFor="edit-code">Mã lớp <span className="text-rose-500">*</span></FieldLabel>
                <Input id="edit-code" value={editCode} onChange={(e) => setEditCode(e.target.value)} />
                {editErrors.code && <p className="mt-1 text-xs text-rose-500">{editErrors.code}</p>}
              </div>
              <div>
                <FieldLabel htmlFor="edit-desc">Mô tả</FieldLabel>
                <TextArea id="edit-desc" rows={3} value={editDesc} onChange={(e) => setEditDesc((e.target as HTMLTextAreaElement).value)} />
              </div>
              <div>
                <FieldLabel htmlFor="edit-status">Trạng thái</FieldLabel>
                <select id="edit-status" className="min-h-11 w-full rounded-2xl border border-sky-100 bg-white px-4 text-sm font-bold text-slate-600 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100" value={editStatus} onChange={(e) => setEditStatus(e.target.value as ClassStatus)}>
                  <option value="DRAFT">Nháp</option>
                  <option value="ACTIVE">Đang học</option>
                  <option value="COMPLETED">Hoàn thành</option>
                  <option value="ARCHIVED">Lưu trữ</option>
                </select>
              </div>
              {editClass.isError && !(editClass.error instanceof Error && editClass.error.message === 'validation') && (
                <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {editClass.error instanceof ApiClientError ? editClass.error.message : 'Không thể cập nhật. Vui lòng thử lại.'}
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={resetEdit}>Huỷ</Button>
                <Button disabled={editClass.isPending}>{editClass.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}</Button>
              </div>
            </form>
          </Card>
          </div>
        </div>
      )}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={resetCreate}>
          <div className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
          <Card className="shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-950">Tạo lớp học</h2>
              <button type="button" onClick={resetCreate} className="rounded-xl p-1 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
            </div>
            <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); create.mutate() }}>
              <div>
                <FieldLabel htmlFor="cls-name">Tên lớp <span className="text-rose-500">*</span></FieldLabel>
                <Input id="cls-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: TOPIK 3,4 ĐÊM" />
                {fieldErrors.name && <p className="mt-1 text-xs text-rose-500">{fieldErrors.name}</p>}
              </div>
              <div>
                <FieldLabel htmlFor="cls-code">Mã lớp <span className="text-rose-500">*</span></FieldLabel>
                <Input id="cls-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="VD: TOPIK34DEM" />
                {fieldErrors.code && <p className="mt-1 text-xs text-rose-500">{fieldErrors.code}</p>}
              </div>
              <div>
                <FieldLabel htmlFor="cls-desc">Mô tả</FieldLabel>
                <TextArea id="cls-desc" rows={3} value={description} onChange={(e) => setDescription((e.target as HTMLTextAreaElement).value)} placeholder="Mô tả lớp học (tuỳ chọn)" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel htmlFor="cls-status">Trạng thái</FieldLabel>
                  <select id="cls-status" className="min-h-11 w-full rounded-2xl border border-sky-100 bg-white px-4 text-sm font-bold text-slate-600 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100" value={classStatus} onChange={(e) => setClassStatus(e.target.value as ClassStatus)}>
                    <option value="DRAFT">Nháp</option>
                    <option value="ACTIVE">Đang học</option>
                    <option value="COMPLETED">Hoàn thành</option>
                    <option value="ARCHIVED">Lưu trữ</option>
                  </select>
                </div>
                <div>
                  <FieldLabel htmlFor="cls-admin">Trợ giảng phụ trách</FieldLabel>
                  <select id="cls-admin" className="min-h-11 w-full rounded-2xl border border-sky-100 bg-white px-4 text-sm text-slate-600 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100" value={adminId} onChange={(e) => setAdminId(e.target.value)}>
                    <option value="">— Không gán —</option>
                    {adminList.map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                  </select>
                </div>
              </div>
              {create.isError && !(create.error instanceof Error && create.error.message === 'validation') && (
                <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {create.error instanceof ApiClientError ? create.error.message : 'Không thể tạo lớp học. Vui lòng thử lại.'}
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={resetCreate}>Huỷ</Button>
                <Button disabled={create.isPending}>{create.isPending ? 'Đang tạo...' : 'Tạo lớp'}</Button>
              </div>
            </form>
          </Card>
          </div>
        </div>
      )}
      {query.isLoading && <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>}
      {query.isError && <ErrorState onRetry={() => void query.refetch()} />}
      {!query.isLoading && !query.isError && pageData.items.length === 0 && <EmptyState title="Chưa có lớp học" description="Không có lớp phù hợp với bộ lọc hiện tại." />}
      {view === 'card' && <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{pageData.items.map((item) => <Card key={item.id} className="rounded-3xl"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-indigo-500">{item.code}</p><h2 className="mt-1 text-xl font-black text-slate-950">{item.name}</h2></div><StatusBadge value={item.status as ClassStatus} /></div><p className="mt-3 text-sm text-slate-500">{item.description || 'Lớp học TOPIK'}</p><div className="mt-4 grid grid-cols-2 gap-2 text-sm"><div className="rounded-2xl bg-sky-50 p-3"><b>{item.studentCount}</b><p className="text-xs text-slate-500">Học viên</p></div><div className="rounded-2xl bg-indigo-50 p-3"><b>{item.admins?.length ?? 0}</b><p className="text-xs text-slate-500">Admin lớp</p></div></div><div className="mt-4 flex items-center justify-between"><span className="text-xs text-slate-400">{fmtDate(item.createdAt)}</span><div className="flex gap-2">{canCreate && <button type="button" className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-indigo-600" onClick={() => openEdit(item)}><Pencil size={16} /></button>}<Link className="text-sm font-bold text-indigo-600" to={`${basePath}/${item.id}`}>Chi tiết</Link></div></div></Card>)}</div>}
      {view === 'table' && pageData.items.length > 0 && <Card><div className="overflow-auto"><table className="w-full min-w-[900px] text-sm"><thead><tr className="border-b border-sky-100 text-left text-slate-500"><th className="px-3 py-3">Lớp</th><th className="px-3 py-3">Giáo viên</th><th className="px-3 py-3">Học viên</th><th className="px-3 py-3">Trạng thái</th><th className="px-3 py-3">Ngày tạo</th><th className="px-3 py-3">Hành động</th></tr></thead><tbody>{pageData.items.map((item) => <tr key={item.id} className="border-b border-sky-50"><td className="px-3 py-3"><b>{item.name}</b><p className="text-xs text-slate-500">{item.code}</p></td><td className="px-3 py-3">{item.teacherName}</td><td className="px-3 py-3">{item.studentCount}</td><td className="px-3 py-3"><StatusBadge value={item.status} /></td><td className="px-3 py-3 text-slate-500">{fmtDate(item.createdAt)}</td><td className="px-3 py-3"><div className="flex gap-2">{canCreate && <button type="button" className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-indigo-600" onClick={() => openEdit(item)}><Pencil size={16} /></button>}<Link className="font-bold text-indigo-600" to={`${basePath}/${item.id}`}>Mở</Link></div></td></tr>)}</tbody></table></div></Card>}
      {pageData.items.length > 0 && <PaginationControls page={pageData.page} totalPages={pageData.totalPages} onPageChange={setPage} />}
    </div>
  )
}

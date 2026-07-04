import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Grid2X2, List, Plus } from 'lucide-react'
import { useNewAuth } from '../auth/use-auth'
import { EmptyState, ErrorState, FilterBar, PageHeader, PaginationControls, SearchInput, SkeletonCard, StatusBadge } from '../components/foundation'
import { api } from '../core/api'
import type { ClassStatus } from '../core/types'
import { Button, Card, Input, TextArea } from '../layout/ui'
import { asPage, fmtDate } from './phase2-utils'

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
  const basePath = isAdmin ? '/admin/classes' : isTeacher ? '/teacher/classes' : '/student/classes'
  const query = useQuery({ queryKey: ['classes', page, search, status], queryFn: () => api.classesPage({ page, size: 12, search, status }) })
  const pageData = asPage(query.data, page, 12)
  const create = useMutation({ mutationFn: () => api.createClass({ name, code, description: description || undefined }), onSuccess: async () => { setShowCreate(false); setName(''); setCode(''); setDescription(''); await qc.invalidateQueries({ queryKey: ['classes'] }) } })
  const canCreate = isTeacher

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="클래스 운영" title={isAdmin ? 'Lớp được giao' : 'Lớp học'} description={isAdmin ? 'CLASS_ADMIN chỉ thấy lớp được phân quyền và không có action global-only.' : 'Tìm kiếm, lọc và quản lý lớp học.'} actions={canCreate && <Button onClick={() => setShowCreate(true)}><Plus size={16} /> Tạo lớp</Button>} />
      <FilterBar><SearchInput value={search} onChange={(e) => { setPage(0); setSearch(e.target.value) }} placeholder="Tìm lớp, mã lớp" /><select className="rounded-2xl border border-sky-100 bg-white px-3 py-2.5 text-sm" value={status} onChange={(e) => { setPage(0); setStatus(e.target.value) }}><option value="">Tất cả trạng thái</option><option value="DRAFT">DRAFT</option><option value="ACTIVE">ACTIVE</option><option value="COMPLETED">COMPLETED</option><option value="ARCHIVED">ARCHIVED</option></select><div className="ml-auto flex gap-1"><Button variant={view === 'card' ? 'primary' : 'secondary'} onClick={() => setView('card')}><Grid2X2 size={16} /></Button><Button variant={view === 'table' ? 'primary' : 'secondary'} onClick={() => setView('table')}><List size={16} /></Button></div></FilterBar>
      {showCreate && <dialog open className="fixed inset-0 z-50 m-0 grid h-full w-full max-w-none place-items-center bg-slate-950/30 p-4 backdrop-blur-sm"><Card className="w-full max-w-2xl shadow-2xl"><h2 className="text-xl font-black">Tạo lớp học</h2><form className="mt-4 grid gap-3" onSubmit={(e) => { e.preventDefault(); if (name && code) create.mutate() }}><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên lớp" required /><Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Mã lớp" required /><TextArea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Mô tả" /><div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>Hủy</Button><Button disabled={create.isPending}>Tạo</Button></div></form></Card></dialog>}
      {query.isLoading && <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>}
      {query.isError && <ErrorState onRetry={() => void query.refetch()} />}
      {!query.isLoading && !query.isError && pageData.items.length === 0 && <EmptyState title="Chưa có lớp học" description="Không có lớp phù hợp với bộ lọc hiện tại." />}
      {view === 'card' && <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{pageData.items.map((item) => <Card key={item.id} className="rounded-3xl"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-indigo-500">{item.code}</p><h2 className="mt-1 text-xl font-black text-slate-950">{item.name}</h2></div><StatusBadge value={item.status as ClassStatus} /></div><p className="mt-3 text-sm text-slate-500">{item.description || 'Lớp học TOPIK'}</p><div className="mt-4 grid grid-cols-2 gap-2 text-sm"><div className="rounded-2xl bg-sky-50 p-3"><b>{item.studentCount}</b><p className="text-xs text-slate-500">Học viên</p></div><div className="rounded-2xl bg-indigo-50 p-3"><b>{item.admins?.length ?? 0}</b><p className="text-xs text-slate-500">Admin lớp</p></div></div><div className="mt-4 flex items-center justify-between"><span className="text-xs text-slate-400">{fmtDate(item.createdAt)}</span><Link className="text-sm font-bold text-indigo-600" to={`${basePath}/${item.id}`}>Chi tiết</Link></div></Card>)}</div>}
      {view === 'table' && pageData.items.length > 0 && <Card><div className="overflow-auto"><table className="w-full min-w-[900px] text-sm"><thead><tr className="border-b border-sky-100 text-left text-slate-500"><th className="px-3 py-3">Lớp</th><th className="px-3 py-3">Giáo viên</th><th className="px-3 py-3">Học viên</th><th className="px-3 py-3">Trạng thái</th><th className="px-3 py-3">Ngày tạo</th><th className="px-3 py-3">Hành động</th></tr></thead><tbody>{pageData.items.map((item) => <tr key={item.id} className="border-b border-sky-50"><td className="px-3 py-3"><b>{item.name}</b><p className="text-xs text-slate-500">{item.code}</p></td><td className="px-3 py-3">{item.teacherName}</td><td className="px-3 py-3">{item.studentCount}</td><td className="px-3 py-3"><StatusBadge value={item.status} /></td><td className="px-3 py-3 text-slate-500">{fmtDate(item.createdAt)}</td><td className="px-3 py-3"><Link className="font-bold text-indigo-600" to={`${basePath}/${item.id}`}>Mở</Link></td></tr>)}</tbody></table></div></Card>}
      {pageData.items.length > 0 && <PaginationControls page={pageData.page} totalPages={pageData.totalPages} onPageChange={setPage} />}
    </div>
  )
}

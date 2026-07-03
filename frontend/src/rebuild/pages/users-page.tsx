import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Copy, Plus } from 'lucide-react'
import { EmptyState, ErrorState, FilterBar, MetricCard, PageHeader, PaginationControls, RoleBadge, SearchInput, SkeletonCard, StatusBadge } from '../components/foundation'
import { api } from '../core/api'
import type { RoleName, UserStatus } from '../core/types'
import { Button, Card, FieldLabel, Input, TextArea } from '../layout/ui'
import { asPage, fmtDate } from './phase2-utils'

function CreateUserDialog({ onClose, onCreated }: Readonly<{ onClose: () => void; onCreated: (password?: string | null) => void }>) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<RoleName>('STUDENT')
  const [note, setNote] = useState('')
  const create = useMutation({ mutationFn: () => api.createUser({ fullName, email: email || undefined, phone: phone || undefined, role, note: note || undefined }), onSuccess: (user) => onCreated(user.temporaryPassword) })
  return (
    <dialog open className="fixed inset-0 z-50 m-0 grid h-full w-full max-w-none place-items-center bg-slate-950/30 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-2xl shadow-2xl">
        <h2 className="text-xl font-black text-slate-950">Tạo người dùng</h2>
        <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); if (fullName) create.mutate() }}>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Họ tên" required />
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Số điện thoại" />
          <div><FieldLabel htmlFor="role">Vai trò</FieldLabel><select id="role" className="w-full rounded-2xl border border-sky-100 bg-white px-3 py-2.5 text-sm" value={role} onChange={(e) => setRole(e.target.value as RoleName)}><option value="STUDENT">Học viên</option><option value="CLASS_ADMIN">Quản trị lớp</option><option value="TEACHER_OWNER">Chủ trung tâm</option></select></div>
          <div className="sm:col-span-2"><TextArea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ghi chú" /></div>
          <div className="sm:col-span-2 flex justify-end gap-2"><Button type="button" variant="secondary" onClick={onClose}>Hủy</Button><Button disabled={create.isPending}>Tạo</Button></div>
        </form>
      </Card>
    </dialog>
  )
}

export function UsersPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null)
  const query = useQuery({ queryKey: ['users', page, search, role, status], queryFn: () => api.usersPage({ page, size: 10, search, role, status }) })
  const usersPage = asPage(query.data, page, 10)
  const statusMutation = useMutation({ mutationFn: ({ id, next }: { id: string; next: UserStatus }) => api.updateUserStatus(id, next), onSuccess: async () => qc.invalidateQueries({ queryKey: ['users'] }) })

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="사용자 관리" title="Người dùng" description="Quản lý học viên, admin lớp và tài khoản giáo viên với phân trang server-side." actions={<Button onClick={() => setDialogOpen(true)}><Plus size={16} /> Tạo người dùng</Button>} />
      {temporaryPassword && <Card className="border-emerald-200 bg-emerald-50"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-bold text-emerald-950">Temporary password</p><code className="text-sm text-emerald-700">{temporaryPassword}</code></div><Button variant="secondary" onClick={() => navigator.clipboard.writeText(temporaryPassword)}><Copy size={16} /> Copy</Button></div></Card>}
      <FilterBar><SearchInput value={search} onChange={(e) => { setPage(0); setSearch(e.target.value) }} placeholder="Tìm tên, email, số điện thoại" /><select className="rounded-2xl border border-sky-100 bg-white px-3 py-2.5 text-sm" value={role} onChange={(e) => { setPage(0); setRole(e.target.value) }}><option value="">Tất cả vai trò</option><option value="TEACHER_OWNER">Teacher</option><option value="CLASS_ADMIN">Admin lớp</option><option value="STUDENT">Student</option></select><select className="rounded-2xl border border-sky-100 bg-white px-3 py-2.5 text-sm" value={status} onChange={(e) => { setPage(0); setStatus(e.target.value) }}><option value="">Tất cả trạng thái</option><option value="ACTIVE">ACTIVE</option><option value="INACTIVE">INACTIVE</option><option value="SUSPENDED">SUSPENDED</option></select></FilterBar>
      {query.isLoading && <div className="grid gap-3"><SkeletonCard /><SkeletonCard /></div>}
      {query.isError && <ErrorState onRetry={() => void query.refetch()} />}
      {!query.isLoading && !query.isError && usersPage.items.length === 0 && <EmptyState title="Chưa có người dùng" description="Thử đổi bộ lọc hoặc tạo người dùng mới." />}
      {usersPage.items.length > 0 && <Card><div className="overflow-auto"><table className="w-full min-w-[980px] text-sm"><thead><tr className="border-b border-sky-100 text-left text-slate-500"><th className="px-3 py-3">Họ tên</th><th className="px-3 py-3">Liên hệ</th><th className="px-3 py-3">Vai trò</th><th className="px-3 py-3">Trạng thái</th><th className="px-3 py-3">Ngày tạo</th><th className="px-3 py-3">Hành động</th></tr></thead><tbody>{usersPage.items.map((item) => <tr key={item.id} className="border-b border-sky-50"><td className="px-3 py-3 font-bold"><Link className="text-indigo-600" to={`/teacher/users/${item.id}`}>{item.fullName}</Link></td><td className="px-3 py-3 text-slate-600">{item.email || item.phone || '-'}</td><td className="px-3 py-3"><div className="flex flex-wrap gap-1">{item.roles.map((r) => <RoleBadge key={r} role={r} />)}</div></td><td className="px-3 py-3"><StatusBadge value={item.status} /></td><td className="px-3 py-3 text-slate-500">{fmtDate(item.createdAt)}</td><td className="px-3 py-3"><div className="flex gap-1"><Button variant="ghost" disabled={statusMutation.isPending} onClick={() => statusMutation.mutate({ id: item.id, next: 'ACTIVE' })}>Active</Button><Button variant="ghost" disabled={statusMutation.isPending} onClick={() => statusMutation.mutate({ id: item.id, next: 'SUSPENDED' })}>Khóa</Button></div></td></tr>)}</tbody></table></div><div className="mt-4"><PaginationControls page={usersPage.page} totalPages={usersPage.totalPages} onPageChange={setPage} /></div></Card>}
      {dialogOpen && <CreateUserDialog onClose={() => setDialogOpen(false)} onCreated={async (password) => { setDialogOpen(false); setTemporaryPassword(password ?? null); await qc.invalidateQueries({ queryKey: ['users'] }) }} />}
    </div>
  )
}

export function UserDetailPage() {
  const { id = '' } = useParams()
  const user = useQuery({ queryKey: ['users', id], queryFn: () => api.user(id), enabled: Boolean(id) })
  const progress = useQuery({ queryKey: ['users', id, 'progress'], queryFn: () => api.studentProgress(id), enabled: Boolean(id) })
  const activity = useQuery({ queryKey: ['users', id, 'activity'], queryFn: () => api.userActivityLogsPage(id, { page: 0, size: 20 }), enabled: Boolean(id) })
  const activityPage = asPage(activity.data, 0, 20)
  if (user.isLoading) return <SkeletonCard />
  if (user.isError || !user.data) return <ErrorState title="Không thể tải chi tiết người dùng" onRetry={() => void user.refetch()} />
  return <div className="space-y-5"><PageHeader eyebrow="USER DETAIL" title={user.data.fullName} description={user.data.email || user.data.phone || 'Không có thông tin liên hệ'} actions={<Link className="rounded-2xl border border-sky-200 bg-white px-4 py-2 text-sm font-bold text-slate-700" to="/teacher/users">Quay lại</Link>} /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Tổng bài tập" value={progress.data?.totalAssignments ?? '-'} /><MetricCard label="Đã nộp" value={progress.data?.submittedAssignments ?? '-'} /><MetricCard label="Đã chấm" value={progress.data?.gradedAssignments ?? '-'} /><MetricCard label="Điểm TB" value={progress.data?.averageScore?.toFixed?.(1) ?? '-'} /></div><Card><h2 className="font-black text-slate-950">Activity logs</h2><div className="mt-3 divide-y divide-sky-50">{activityPage.items.map((item) => <div key={item.id} className="py-3"><p className="font-bold text-slate-900">{item.message}</p><p className="text-xs text-slate-500">{item.actorName} · {fmtDate(item.createdAt)}</p></div>)}{activityPage.items.length === 0 && <EmptyState title="Chưa có hoạt động" />}</div></Card></div>
}

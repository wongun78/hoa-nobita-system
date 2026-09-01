import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Check, ChevronRight, Copy, Crown, GraduationCap, MoreHorizontal, Pencil, Plus, Search, Shield, X } from 'lucide-react'
import { EmptyState, ErrorState, PaginationControls, RoleBadge, SkeletonCard } from '../components/foundation'
import { api } from '../core/api'
import type { RoleName, UserItem } from '../core/types'
import { Button, Card, FieldLabel, Input, TextArea } from '../layout/ui'
import { asPage, getStudentAvatarUrl, studentAvatarSeed } from './phase2-utils'

/* ────────────────────────────────────────────────
   Role helpers
   ──────────────────────────────────────────────── */

function roleIcon(role: RoleName) {
  if (role === 'TEACHER_OWNER') return <Crown size={14} />
  if (role === 'CLASS_ADMIN') return <Shield size={14} />
  return <GraduationCap size={14} />
}

function roleLabel(role: RoleName) {
  if (role === 'TEACHER_OWNER') return 'Giảng viên'
  if (role === 'CLASS_ADMIN') return 'Trợ giảng'
  return 'Học viên'
}

/* ────────────────────────────────────────────────
   Summary stats
   ──────────────────────────────────────────────── */

function UserStats({ users }: Readonly<{ users: UserItem[] }>) {
  const total = users.length
  const teachers = users.filter((u) => u.roles.includes('TEACHER_OWNER')).length
  const admins = users.filter((u) => u.roles.includes('CLASS_ADMIN')).length
  const students = users.filter((u) => u.roles.includes('STUDENT')).length

  const stats = [
    { label: 'Tổng cộng', value: total, icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8m13 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>, color: 'bg-indigo-50 text-indigo-600' },
    { label: 'Giảng viên', value: teachers, icon: <Crown size={15} />, color: 'bg-violet-50 text-violet-600' },
    { label: 'Trợ giảng', value: admins, icon: <Shield size={15} />, color: 'bg-sky-50 text-sky-600' },
    { label: 'Học viên', value: students, icon: <GraduationCap size={15} />, color: 'bg-emerald-50 text-emerald-600' },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((s) => (
        <Card key={s.label} className="flex items-center gap-3 py-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${s.color}`}>{s.icon}</div>
          <div>
            <p className="text-lg font-black text-slate-900">{s.value}</p>
            <p className="text-[11px] font-medium text-slate-400">{s.label}</p>
          </div>
        </Card>
      ))}
    </div>
  )
}

/* ────────────────────────────────────────────────
   Create User Dialog
   ──────────────────────────────────────────────── */

function CreateUserDialog({ onClose, onCreated }: Readonly<{ onClose: () => void; onCreated: (password?: string | null) => void }>) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<RoleName>('STUDENT')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const create = useMutation({
    mutationFn: () => {
      setError(null)
      const trimmedEmail = email.trim()
      if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        return Promise.reject(new Error('Email không hợp lệ'))
      }
      return api.createUser({ fullName: fullName.trim(), email: trimmedEmail || undefined, phone: phone.trim() || undefined, role, note: note.trim() || undefined })
    },
    onSuccess: (user) => onCreated(user.temporaryPassword),
    onError: (err: unknown) => setError(err instanceof Error ? err.message : 'Tạo người dùng thất bại'),
  })

  const roleOptions: Array<{ value: RoleName; label: string; icon: React.ReactNode; desc: string }> = [
    { value: 'STUDENT', label: 'Học viên', icon: <GraduationCap size={16} />, desc: 'Tham gia lớp học, nộp bài' },
    { value: 'CLASS_ADMIN', label: 'Trợ giảng', icon: <Shield size={16} />, desc: 'Hỗ trợ chấm bài, quản lý lớp' },
    { value: 'TEACHER_OWNER', label: 'Giảng viên', icon: <Crown size={16} />, desc: 'Quản lý toàn bộ hệ thống' },
  ]

  return (
    <dialog open className="fixed inset-0 z-50 m-0 grid h-full w-full max-w-none place-items-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200/60 bg-white p-6 shadow-2xl shadow-slate-900/10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900">Tạo người dùng mới</h2>
            <p className="mt-0.5 text-sm text-slate-400">Điền thông tin bên dưới để tạo tài khoản</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"><X size={18} /></button>
        </div>
        {error && <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>}
        <form className="mt-5 space-y-4" onSubmit={(e) => { e.preventDefault(); if (fullName.trim()) create.mutate() }}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><FieldLabel htmlFor="create-name">Họ tên *</FieldLabel><Input id="create-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nguyễn Văn A" required /></div>
            <div><FieldLabel htmlFor="create-email">Email</FieldLabel><Input id="create-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" /></div>
            <div><FieldLabel htmlFor="create-phone">Số điện thoại</FieldLabel><Input id="create-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0912 345 678" /></div>
          </div>
          <div>
            <FieldLabel>Vai trò</FieldLabel>
            <div className="mt-1 grid gap-2 sm:grid-cols-3">
              {roleOptions.map((opt) => (
                <button key={opt.value} type="button" onClick={() => setRole(opt.value)} className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all ${role === opt.value ? 'border-indigo-300 bg-indigo-50 ring-2 ring-indigo-100' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}`}>
                  <span className={`mt-0.5 ${role === opt.value ? 'text-indigo-600' : 'text-slate-400'}`}>{opt.icon}</span>
                  <div>
                    <p className={`text-sm font-semibold ${role === opt.value ? 'text-indigo-700' : 'text-slate-700'}`}>{opt.label}</p>
                    <p className="mt-0.5 text-[11px] leading-4 text-slate-400">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div><FieldLabel htmlFor="create-note">Ghi chú</FieldLabel><TextArea id="create-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ghi chú nội bộ (tuỳ chọn)" /></div>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>Huỷ</Button>
            <Button disabled={create.isPending || !fullName.trim()}>{create.isPending ? 'Đang tạo...' : 'Tạo người dùng'}</Button>
          </div>
        </form>
      </div>
    </dialog>
  )
}

/* ────────────────────────────────────────────────
   Edit User Dialog
   ──────────────────────────────────────────────── */

function EditUserDialog({ user, onClose, onSaved }: Readonly<{ user: UserItem; onClose: () => void; onSaved: () => void }>) {
  const [fullName, setFullName] = useState(user.fullName)
  const [error, setError] = useState<string | null>(null)
  const update = useMutation({
    mutationFn: () => {
      setError(null)
      if (!fullName.trim()) return Promise.reject(new Error('Họ tên không được để trống'))
      return api.updateUser(user.id, { fullName: fullName.trim() })
    },
    onSuccess: onSaved,
    onError: (err: unknown) => setError(err instanceof Error ? err.message : 'Cập nhật thất bại'),
  })

  return (
    <dialog open className="fixed inset-0 z-50 m-0 grid h-full w-full max-w-none place-items-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/60 bg-white p-6 shadow-2xl shadow-slate-900/10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900">Sửa thông tin</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"><X size={18} /></button>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <img src={getStudentAvatarUrl(studentAvatarSeed(user))} alt={user.fullName} className="h-12 w-12 rounded-xl ring-2 ring-slate-100" />
          <div>
            <p className="font-bold text-slate-800">{user.fullName}</p>
            <p className="text-xs text-slate-400">{user.email || user.phone || '—'}</p>
          </div>
        </div>
        {error && <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>}
        <form className="mt-4 space-y-3" onSubmit={(e) => { e.preventDefault(); update.mutate() }}>
          <div><FieldLabel htmlFor="edit-name">Họ tên mới</FieldLabel><Input id="edit-name" value={fullName} onChange={(e) => setFullName(e.target.value)} required /></div>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>Huỷ</Button>
            <Button disabled={update.isPending || !fullName.trim()}>{update.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}</Button>
          </div>
        </form>
      </div>
    </dialog>
  )
}

/* ────────────────────────────────────────────────
   Password Banner
   ──────────────────────────────────────────────── */

function PasswordBanner({ password, onDismiss }: Readonly<{ password: string; onDismiss: () => void }>) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    await navigator.clipboard.writeText(password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-xl border border-emerald-200/60 bg-gradient-to-r from-emerald-50 to-emerald-50/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600"><Check size={16} /></div>
          <div>
            <p className="text-sm font-bold text-emerald-900">Tạo thành công!</p>
            <p className="mt-0.5 text-xs text-emerald-600">Mật khẩu tạm thời — gửi cho người dùng để đăng nhập lần đầu</p>
            <code className="mt-1 inline-block rounded-lg bg-emerald-100/60 px-2.5 py-1 text-sm font-bold tracking-wider text-emerald-800">{password}</code>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" className="text-xs" onClick={handleCopy}>{copied ? <><Check size={14} /> Đã sao chép</> : <><Copy size={14} /> Sao chép</>}</Button>
          <button type="button" onClick={onDismiss} className="rounded-lg p-1.5 text-emerald-400 transition hover:bg-emerald-100 hover:text-emerald-600"><X size={16} /></button>
        </div>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────
   User Row
   ──────────────────────────────────────────────── */

function UserRow({ user, onEdit }: Readonly<{ user: UserItem; onEdit: () => void }>) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="group flex items-center gap-4 border-b border-slate-100 px-4 py-3 transition-all last:border-b-0 hover:bg-slate-50/60">
      {/* Avatar */}
      <img src={getStudentAvatarUrl(studentAvatarSeed(user))} alt={user.fullName} className="h-10 w-10 shrink-0 rounded-xl ring-2 ring-slate-100 transition-all group-hover:ring-indigo-100" />

      {/* Name + email */}
      <div className="min-w-0 flex-1">
        <Link className="block truncate text-sm font-bold text-slate-800 transition-colors group-hover:text-indigo-700" to={`/teacher/users/${user.id}`}>{user.fullName}</Link>
        <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-slate-400">
          {user.email && <span>{user.email}</span>}
          {user.email && user.phone && <span className="text-slate-200">·</span>}
          {user.phone && <span>{user.phone}</span>}
          {!user.email && !user.phone && <span className="italic text-slate-300">Chưa có liên hệ</span>}
        </p>
      </div>

      {/* Roles */}
      <div className="hidden items-center gap-1.5 sm:flex">
        {user.roles.map((r) => (
          <span key={r} className="inline-flex items-center gap-1 rounded-lg border border-slate-100 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-500">
            {roleIcon(r)} {roleLabel(r)}
          </span>
        ))}
      </div>

      {/* Status dot */}
      <div className="hidden md:block">
        <span className={`inline-block h-2 w-2 rounded-full ${user.status === 'ACTIVE' ? 'bg-emerald-400' : user.status === 'SUSPENDED' ? 'bg-rose-400' : 'bg-slate-300'}`} />
      </div>

      {/* Actions */}
      <div className="relative">
        <button type="button" onClick={() => setMenuOpen(!menuOpen)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 opacity-0 transition-all hover:bg-slate-100 hover:text-slate-600 group-hover:opacity-100" aria-label={`Thao tác ${user.fullName}`}>
          <MoreHorizontal size={16} />
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-full z-40 mt-1 w-44 rounded-xl border border-slate-200/80 bg-white p-1 shadow-xl shadow-slate-900/10">
              <Link to={`/teacher/users/${user.id}`} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50" onClick={() => setMenuOpen(false)}>
                <ChevronRight size={14} /> Xem chi tiết
              </Link>
              <button type="button" onClick={() => { setMenuOpen(false); onEdit() }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
                <Pencil size={14} /> Sửa tên
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────
   UsersPage
   ──────────────────────────────────────────────── */

export function UsersPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editUser, setEditUser] = useState<UserItem | null>(null)
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null)
  const query = useQuery({ queryKey: ['users', page, search, role], queryFn: () => api.usersPage({ page, size: 10, search, role }) })
  const usersPage = asPage(query.data, page, 10)
  const statsQuery = useQuery({ queryKey: ['users', 'stats'], queryFn: () => api.usersPage({ page: 0, size: 1000 }) })
  const allUsers = asPage(statsQuery.data, 0, 1000)

  const roleFilters: Array<{ value: string; label: string; icon?: React.ReactNode }> = [
    { value: '', label: 'Tất cả' },
    { value: 'TEACHER_OWNER', label: 'Giảng viên', icon: <Crown size={12} /> },
    { value: 'CLASS_ADMIN', label: 'Trợ giảng', icon: <Shield size={12} /> },
    { value: 'STUDENT', label: 'Học viên', icon: <GraduationCap size={12} /> },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900">Người dùng</h1>
          <p className="mt-0.5 text-sm text-slate-400">Quản lý học viên, trợ giảng và giảng viên</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}><Plus size={16} /> Tạo người dùng</Button>
      </div>

      {/* Stats */}
      {allUsers.items.length > 0 && <UserStats users={allUsers.items} />}

      {/* Password banner */}
      {temporaryPassword && <PasswordBanner password={temporaryPassword} onDismiss={() => setTemporaryPassword(null)} />}

      {/* Search + Filter */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input type="text" value={search} onChange={(e) => { setPage(0); setSearch(e.target.value) }} placeholder="Tìm theo tên, email, số điện thoại..." className="w-full rounded-xl border border-slate-200/80 bg-white py-2.5 pl-9 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100" />
        </div>
        <div className="flex gap-1.5 rounded-xl border border-slate-200/60 bg-white p-1">
          {roleFilters.map((f) => (
            <button key={f.value} type="button" onClick={() => { setPage(0); setRole(f.value) }} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${role === f.value ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
              {f.icon} {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading skeleton */}
      {query.isLoading && (
        <div className="rounded-2xl border border-slate-200/60 bg-white/60">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={`skel-${i + 1}`} className="flex items-center gap-4 border-b border-slate-100 px-4 py-3 last:border-b-0">
              <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-100" />
              <div className="flex-1 space-y-2"><div className="h-3 w-1/3 animate-pulse rounded-full bg-slate-100" /><div className="h-2.5 w-1/4 animate-pulse rounded-full bg-slate-50" /></div>
              <div className="hidden h-6 w-16 animate-pulse rounded-lg bg-slate-50 sm:block" />
            </div>
          ))}
        </div>
      )}

      {query.isError && <ErrorState onRetry={() => void query.refetch()} />}

      {!query.isLoading && !query.isError && usersPage.items.length === 0 && (
        <EmptyState
          title="Không tìm thấy người dùng"
          description={search || role ? 'Thử đổi từ khoá hoặc bộ lọc.' : 'Chưa có người dùng nào trong hệ thống.'}
          action={!search && !role ? <Button onClick={() => setDialogOpen(true)}><Plus size={16} /> Tạo người dùng đầu tiên</Button> : undefined}
        />
      )}

      {/* User list */}
      {usersPage.items.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-4 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            <span className="w-10" />
            <span className="flex-1">Người dùng</span>
            <span className="hidden w-48 sm:block">Vai trò</span>
            <span className="hidden w-6 md:block">TT</span>
            <span className="w-8" />
          </div>
          <div className="rounded-2xl border border-slate-200/60 bg-white">
            {usersPage.items.map((item) => (
              <UserRow key={item.id} user={item} onEdit={() => setEditUser(item)} />
            ))}
          </div>
          <PaginationControls page={usersPage.page} totalPages={usersPage.totalPages} onPageChange={setPage} />
        </div>
      )}

      {/* Dialogs */}
      {dialogOpen && <CreateUserDialog onClose={() => setDialogOpen(false)} onCreated={async (password) => { setDialogOpen(false); setTemporaryPassword(password ?? null); await qc.invalidateQueries({ queryKey: ['users'] }) }} />}
      {editUser && <EditUserDialog user={editUser} onClose={() => setEditUser(null)} onSaved={async () => { setEditUser(null); await qc.invalidateQueries({ queryKey: ['users'] }) }} />}
    </div>
  )
}

/* ────────────────────────────────────────────────
   UserDetailPage
   ──────────────────────────────────────────────── */

export function UserDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const user = useQuery({ queryKey: ['users', id], queryFn: () => api.user(id), enabled: Boolean(id) })
  const progress = useQuery({ queryKey: ['users', id, 'progress'], queryFn: () => api.studentProgress(id), enabled: Boolean(id) })

  if (user.isLoading) return <SkeletonCard />
  if (user.isError || !user.data) return <ErrorState title="Không thể tải chi tiết người dùng" onRetry={() => void user.refetch()} />
  const u = user.data

  const progressStats = [
    { label: 'Tổng bài tập', value: progress.data?.totalAssignments ?? '—', color: 'bg-indigo-50 text-indigo-600', icon: <GraduationCap size={15} /> },
    { label: 'Đã nộp', value: progress.data?.submittedAssignments ?? '—', color: 'bg-sky-50 text-sky-600', icon: <ArrowLeft size={15} /> },
    { label: 'Đã chấm', value: progress.data?.gradedAssignments ?? '—', color: 'bg-emerald-50 text-emerald-600', icon: <Check size={15} /> },
    { label: 'Điểm trung bình', value: progress.data?.averageScore?.toFixed?.(1) ?? '—', color: 'bg-amber-50 text-amber-600', icon: <Crown size={15} /> },
  ]

  return (
    <div className="space-y-5">
      <button type="button" onClick={() => navigate('/teacher/users')} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition hover:text-indigo-600">
        <ArrowLeft size={14} /> Quay lại danh sách
      </button>

      {/* Hero card */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm shadow-slate-200/50">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <img src={getStudentAvatarUrl(studentAvatarSeed(u))} alt={u.fullName} className="h-20 w-20 shrink-0 rounded-2xl ring-4 ring-slate-100 shadow-lg" />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-slate-900">{u.fullName}</h1>
              {u.roles.map((r) => <RoleBadge key={r} role={r} />)}
            </div>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-500">
              {u.studentCode && <span><span className="font-semibold text-slate-700">MS:</span> {u.studentCode}</span>}
              {u.email && <span><span className="font-semibold text-slate-700">Email:</span> {u.email}</span>}
              {u.phone && <span><span className="font-semibold text-slate-700">SĐT:</span> {u.phone}</span>}
            </div>
            {u.note && <p className="mt-2 text-sm italic text-slate-400">"{u.note}"</p>}
          </div>
          <div className={`inline-flex items-center gap-1.5 self-start rounded-lg px-3 py-1.5 text-xs font-bold ${u.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : u.status === 'SUSPENDED' ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-200' : 'bg-slate-50 text-slate-500 ring-1 ring-slate-200'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${u.status === 'ACTIVE' ? 'bg-emerald-500' : u.status === 'SUSPENDED' ? 'bg-rose-500' : 'bg-slate-400'}`} />
            {u.status === 'ACTIVE' ? 'Đang hoạt động' : u.status === 'SUSPENDED' ? 'Đã khoá' : 'Ngưng hoạt động'}
          </div>
        </div>
      </div>

      {/* Progress metrics */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {progressStats.map((s) => (
          <Card key={s.label} className="flex items-center gap-3 py-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${s.color}`}>{s.icon}</div>
            <div>
              <p className="text-lg font-black text-slate-900">{s.value}</p>
              <p className="text-[11px] font-medium text-slate-400">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

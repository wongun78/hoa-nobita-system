import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, CalendarDays, CheckCheck, ChevronDown, LogOut, UserCircle } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { homePathForUser } from '../auth/role-redirect'
import { useNewAuth } from '../auth/use-auth'
import { api } from '../core/api'
import type { NotificationItem, RoleName } from '../core/types'
import { RoleBadge } from '../components/foundation'
import { getStudentAvatarUrl, studentAvatarSeed } from '../pages/phase2-utils'
import { Button } from './ui'

type MenuItem = {
  to: string
  label: string
  roles?: RoleName[]
}

const menuItems: MenuItem[] = [
  { to: '/teacher/dashboard', label: 'Bảng điều khiển', roles: ['TEACHER_OWNER'] },
  { to: '/teacher/users', label: 'Người dùng', roles: ['TEACHER_OWNER'] },
  { to: '/teacher/classes', label: 'Lớp học', roles: ['TEACHER_OWNER'] },
  { to: '/teacher/assignments', label: 'Bài tập', roles: ['TEACHER_OWNER'] },
  { to: '/teacher/grading', label: 'Chấm bài', roles: ['TEACHER_OWNER'] },
  { to: '/teacher/materials', label: 'Tài liệu', roles: ['TEACHER_OWNER'] },
  { to: '/teacher/notifications', label: 'Thông báo', roles: ['TEACHER_OWNER'] },
  { to: '/teacher/attendance', label: 'Điểm danh', roles: ['TEACHER_OWNER'] },
  { to: '/teacher/calendar', label: 'Lịch học', roles: ['TEACHER_OWNER'] },
  { to: '/teacher/reports', label: 'Báo cáo', roles: ['TEACHER_OWNER'] },
  { to: '/admin/dashboard', label: 'Bảng điều khiển', roles: ['CLASS_ADMIN'] },
  { to: '/admin/classes', label: 'Lớp học', roles: ['CLASS_ADMIN'] },
  { to: '/admin/assignments', label: 'Bài tập', roles: ['CLASS_ADMIN'] },
  { to: '/admin/grading', label: 'Chấm bài', roles: ['CLASS_ADMIN'] },
  { to: '/admin/materials', label: 'Tài liệu', roles: ['CLASS_ADMIN'] },
  { to: '/admin/notifications', label: 'Thông báo', roles: ['CLASS_ADMIN'] },
  { to: '/admin/attendance', label: 'Điểm danh', roles: ['CLASS_ADMIN'] },
  { to: '/admin/calendar', label: 'Lịch học', roles: ['CLASS_ADMIN'] },
  { to: '/admin/reports', label: 'Báo cáo', roles: ['CLASS_ADMIN'] },
  { to: '/student/home', label: 'Trang chủ', roles: ['STUDENT'] },
  { to: '/student/classes', label: 'Lớp học', roles: ['STUDENT'] },
  { to: '/student/assignments', label: 'Bài tập', roles: ['STUDENT'] },
  { to: '/student/grades', label: 'Điểm số', roles: ['STUDENT'] },
  { to: '/student/attendance', label: 'Điểm danh', roles: ['STUDENT'] },
  { to: '/student/materials', label: 'Tài liệu', roles: ['STUDENT'] },
  { to: '/student/calendar', label: 'Lịch học', roles: ['STUDENT'] },
  { to: '/student/notifications', label: 'Thông báo', roles: ['STUDENT'] },
  { to: '/student/profile', label: 'Hồ sơ', roles: ['STUDENT'] },
]

const mobileStudentRoutes = ['/student/home', '/student/classes', '/student/assignments', '/student/grades', '/student/attendance']
const mobileStudentItems = menuItems.filter((item) => mobileStudentRoutes.includes(item.to) && item.roles?.includes('STUDENT'))

type AppShellProps = Readonly<{ children: React.ReactNode }>

function NotificationBell() {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const countQuery = useQuery({ queryKey: ['notifications', 'unread-count'], queryFn: () => api.unreadNotificationCount(), refetchInterval: 30_000, staleTime: 15_000 })
  const notificationsQuery = useQuery({ queryKey: ['notifications', 'dropdown'], queryFn: () => api.notifications({ page: 0, size: 5 }), enabled: open, staleTime: 15_000 })
  const unreadCount = countQuery.data?.count ?? 0
  const notifications = notificationsQuery.data ?? []

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['notifications'] })
  }
  const readOne = useMutation({ mutationFn: (id: string) => api.markNotificationRead(id), onSuccess: invalidate })
  const readAll = useMutation({ mutationFn: () => api.markAllNotificationsRead(), onSuccess: invalidate })

  return (
    <div className="relative">
      <button type="button" aria-label="Mở thông báo" onClick={() => setOpen((value) => !value)} className="relative rounded-2xl border border-sky-100 bg-white p-2.5 text-slate-600 shadow-sm transition hover:bg-sky-50 focus:outline-none focus:ring-4 focus:ring-indigo-100">
        <Bell size={18} />
        {unreadCount > 0 && <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-black text-white">{unreadCount}</span>}
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-3 w-[min(360px,calc(100vw-32px))] rounded-3xl border border-sky-100 bg-white/95 p-3 shadow-2xl backdrop-blur">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-black text-slate-950">Thông báo</p>
              <p className="text-xs text-slate-500">Hộp thư vận hành lớp học</p>
            </div>
            <Button type="button" variant="ghost" className="px-2 py-1 text-xs" disabled={readAll.isPending} onClick={() => readAll.mutate()}><CheckCheck size={14} /> Đọc hết</Button>
          </div>
          <div className="max-h-80 space-y-2 overflow-auto">
            {notifications.length === 0 && <p className="rounded-2xl bg-slate-50 p-4 text-center text-sm text-slate-500">Hộp thư đang yên tĩnh.</p>}
            {notifications.map((item: NotificationItem) => (
              <button key={item.id} type="button" onClick={() => !item.isRead && readOne.mutate(item.id)} className="w-full rounded-2xl border border-slate-100 bg-white p-3 text-left transition hover:border-sky-200 hover:bg-sky-50/50">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-bold text-slate-900">{item.title}</p>
                  {!item.isRead && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />}
                </div>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{item.content}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function UserMenu() {
  const [open, setOpen] = useState(false)
  const { user, logout } = useNewAuth()
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex items-center gap-2 rounded-2xl border border-sky-100 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-sky-50 focus:outline-none focus:ring-4 focus:ring-indigo-100">
        {user?.roles.includes('STUDENT') ? <img src={getStudentAvatarUrl(studentAvatarSeed(user))} alt={user.fullName || 'Học viên'} className="h-8 w-8 rounded-full border border-white shadow-sm" /> : <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-sky-300 text-xs font-black text-white">{user?.fullName?.slice(0, 1) ?? 'U'}</span>}
        <span className="hidden max-w-32 truncate md:inline">{user?.fullName}</span>
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-3 w-64 rounded-3xl border border-sky-100 bg-white/95 p-3 shadow-2xl backdrop-blur">
          <div className="border-b border-sky-50 pb-3">
            {user?.roles.includes('STUDENT') && <img src={getStudentAvatarUrl(studentAvatarSeed(user))} alt={user.fullName || 'Học viên'} className="mb-2 h-12 w-12 rounded-xl border border-white shadow-sm" />}
            <p className="font-bold text-slate-950">{user?.fullName}</p>
            <div className="mt-2 flex flex-wrap gap-1">{user?.roles.map((role) => <RoleBadge key={role} role={role} />)}</div>
          </div>
          <Link to={user?.roles.includes('STUDENT') ? '/student/profile' : '/ho-so'} className="mt-2 flex items-center gap-2 rounded-2xl px-3 py-2 text-sm text-slate-600 hover:bg-sky-50"><UserCircle size={16} /> Hồ sơ</Link>
          <button type="button" onClick={logout} className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"><LogOut size={16} /> Đăng xuất</button>
        </div>
      )}
    </div>
  )
}

export function AppShell({ children }: AppShellProps) {
  const { pathname } = useLocation()
  const { user } = useNewAuth()
  const userRoles = user?.roles ?? []
  const navItems = menuItems.filter((item) => item.roles?.some((role) => userRoles.includes(role)))

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_0_0,#fbcfe8_0,transparent_28%),radial-gradient(circle_at_100%_0,#bae6fd_0,transparent_30%),linear-gradient(180deg,#fff7ed_0%,#f8fafc_42%,#f8fafc_100%)] pb-20 text-slate-800 lg:pb-0">
      <div className="mx-auto grid max-w-[1480px] grid-cols-1 gap-6 p-4 md:p-6 lg:grid-cols-[260px_1fr]">
        <aside className="hidden rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur lg:sticky lg:top-6 lg:block lg:h-[calc(100vh-48px)]">
          <Link to={homePathForUser(user)} className="mb-6 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-3xl bg-gradient-to-br from-indigo-500 via-sky-300 to-pink-300 text-lg font-black text-white shadow-lg">한</span>
            <span>
              <span className="block text-xs font-bold uppercase tracking-[0.08em] text-indigo-500">Hoa Nobita</span>
              <span className="block text-lg font-black tracking-tight text-slate-950">Korean LMS</span>
            </span>
          </Link>
          <nav className="space-y-1" aria-label="Điều hướng chính">
            {navItems.map((item) => {
              const active = pathname === item.to || pathname.startsWith(`${item.to}/`)
              return (
                <Link key={item.to} to={item.to} className={active ? 'block rounded-2xl bg-gradient-to-r from-indigo-50 to-sky-50 px-3 py-2.5 text-sm font-black text-indigo-700 shadow-sm' : 'block rounded-2xl px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-white hover:text-slate-950'}>
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </aside>

        <div className="min-w-0 overflow-x-hidden space-y-5">
          <header className="sticky top-3 z-30 flex items-center justify-between gap-3 rounded-3xl border border-white/70 bg-white/80 p-3 shadow-sm backdrop-blur">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-indigo-500">XIN CHÀO</p>
              <p className="text-sm font-semibold text-slate-600 truncate">Hôm nay học tập thật gọn gàng và hiệu quả.</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link aria-label="Mở lịch học" to={user?.roles.includes('STUDENT') ? '/student/calendar' : user?.roles.includes('CLASS_ADMIN') ? '/admin/calendar' : '/teacher/calendar'} className="rounded-2xl border border-sky-100 bg-white p-2.5 text-slate-600 shadow-sm hover:bg-sky-50"><CalendarDays size={18} /></Link>
              <NotificationBell />
              <UserMenu />
            </div>
          </header>

          {user?.firstLogin && (
            <div className="rounded-3xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900 shadow-sm">
              <strong>Gợi ý bảo mật:</strong> Đây có thể là lần đăng nhập đầu tiên. Bạn nên đổi mật khẩu trong mục hồ sơ để bảo vệ tài khoản.
            </div>
          )}

          <main className="space-y-5">{children}</main>
        </div>
      </div>

      {userRoles.includes('STUDENT') && (
        <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 gap-1 rounded-3xl border border-white/80 bg-white/90 p-2 shadow-2xl backdrop-blur lg:hidden" aria-label="Điều hướng học viên">
          {mobileStudentItems.map((item) => {
            const active = pathname === item.to || pathname.startsWith(`${item.to}/`)
            return <Link key={item.to} to={item.to} className={active ? 'rounded-2xl bg-indigo-50 px-2 py-2 text-center text-[11px] font-black text-indigo-700' : 'rounded-2xl px-2 py-2 text-center text-[11px] font-bold text-slate-500'}>{item.label}</Link>
          })}
        </nav>
      )}
    </div>
  )
}

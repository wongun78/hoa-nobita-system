import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Award, BarChart3, Bell, BookOpen, Calendar, CalendarCheck, CalendarDays, CheckCheck, ChevronDown, ClipboardList, FolderOpen, GraduationCap, Home, LayoutDashboard, LogOut, Send, Users } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { homePathForUser } from '../auth/role-redirect'
import { useNewAuth } from '../auth/use-auth'
import { api } from '../core/api'
import type { NotificationItem, RoleName } from '../core/types'
import { RoleBadge } from '../components/foundation'
import { getStudentAvatarUrl, studentAvatarSeed } from '../pages/phase2-utils'
import { Button } from './ui'

/* ──────────────────────────────────────────────────────────────
   Menu definitions
   ────────────────────────────────────────────────────────────── */

type MenuItem = {
  to: string
  label: string
  icon: React.ReactNode
  roles?: RoleName[]
}

const iconSize = 18

const menuItems: MenuItem[] = [
  /* Teacher */
  { to: '/teacher/dashboard', label: 'Bảng điều khiển', icon: <LayoutDashboard size={iconSize} />, roles: ['TEACHER_OWNER'] },
  { to: '/teacher/users', label: 'Người dùng', icon: <Users size={iconSize} />, roles: ['TEACHER_OWNER'] },
  { to: '/teacher/classes', label: 'Lớp học', icon: <BookOpen size={iconSize} />, roles: ['TEACHER_OWNER'] },
  { to: '/teacher/assignments', label: 'Bài tập', icon: <ClipboardList size={iconSize} />, roles: ['TEACHER_OWNER'] },
  { to: '/teacher/grading', label: 'Chấm bài', icon: <GraduationCap size={iconSize} />, roles: ['TEACHER_OWNER'] },
  { to: '/teacher/materials', label: 'Tài liệu', icon: <FolderOpen size={iconSize} />, roles: ['TEACHER_OWNER'] },
  { to: '/teacher/notifications', label: 'Thông báo', icon: <Bell size={iconSize} />, roles: ['TEACHER_OWNER'] },
  { to: '/teacher/attendance', label: 'Điểm danh', icon: <CalendarCheck size={iconSize} />, roles: ['TEACHER_OWNER'] },
  { to: '/teacher/calendar', label: 'Lịch học', icon: <Calendar size={iconSize} />, roles: ['TEACHER_OWNER'] },
  { to: '/teacher/reports', label: 'Báo cáo', icon: <BarChart3 size={iconSize} />, roles: ['TEACHER_OWNER'] },
  /* Admin */
  { to: '/admin/dashboard', label: 'Bảng điều khiển', icon: <LayoutDashboard size={iconSize} />, roles: ['CLASS_ADMIN'] },
  { to: '/admin/classes', label: 'Lớp học', icon: <BookOpen size={iconSize} />, roles: ['CLASS_ADMIN'] },
  { to: '/admin/assignments', label: 'Bài tập', icon: <ClipboardList size={iconSize} />, roles: ['CLASS_ADMIN'] },
  { to: '/admin/grading', label: 'Chấm bài', icon: <GraduationCap size={iconSize} />, roles: ['CLASS_ADMIN'] },
  { to: '/admin/materials', label: 'Tài liệu', icon: <FolderOpen size={iconSize} />, roles: ['CLASS_ADMIN'] },
  { to: '/admin/notifications', label: 'Thông báo', icon: <Bell size={iconSize} />, roles: ['CLASS_ADMIN'] },
  { to: '/admin/attendance', label: 'Điểm danh', icon: <CalendarCheck size={iconSize} />, roles: ['CLASS_ADMIN'] },
  { to: '/admin/calendar', label: 'Lịch học', icon: <Calendar size={iconSize} />, roles: ['CLASS_ADMIN'] },
  { to: '/admin/reports', label: 'Báo cáo', icon: <BarChart3 size={iconSize} />, roles: ['CLASS_ADMIN'] },
  /* Student */
  { to: '/student/home', label: 'Trang chủ', icon: <Home size={iconSize} />, roles: ['STUDENT'] },
  { to: '/student/classes', label: 'Lớp học', icon: <BookOpen size={iconSize} />, roles: ['STUDENT'] },
  { to: '/student/assignments', label: 'Bài tập', icon: <ClipboardList size={iconSize} />, roles: ['STUDENT'] },
  { to: '/student/submissions', label: 'Bài đã nộp', icon: <Send size={iconSize} />, roles: ['STUDENT'] },
  { to: '/student/grades', label: 'Điểm số', icon: <Award size={iconSize} />, roles: ['STUDENT'] },
  { to: '/student/attendance', label: 'Điểm danh', icon: <CalendarCheck size={iconSize} />, roles: ['STUDENT'] },
  { to: '/student/materials', label: 'Tài liệu', icon: <FolderOpen size={iconSize} />, roles: ['STUDENT'] },
  { to: '/student/calendar', label: 'Lịch học', icon: <Calendar size={iconSize} />, roles: ['STUDENT'] },
  { to: '/student/notifications', label: 'Thông báo', icon: <Bell size={iconSize} />, roles: ['STUDENT'] },
]

const mobileStudentRoutes = ['/student/home', '/student/classes', '/student/assignments', '/student/grades', '/student/attendance']
const mobileStudentItems = menuItems.filter((item) => mobileStudentRoutes.includes(item.to) && item.roles?.includes('STUDENT'))

type AppShellProps = Readonly<{ children: React.ReactNode }>

/* ──────────────────────────────────────────────────────────────
   NotificationBell
   ────────────────────────────────────────────────────────────── */

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
      <button type="button" aria-label="Mở thông báo" onClick={() => setOpen((value) => !value)} className="header-btn relative">
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="dropdown-panel w-[min(360px,calc(100vw-32px))]">
            <div className="mb-3 flex items-center justify-between gap-2 px-1">
              <div>
                <p className="text-[15px] font-bold text-slate-900">Thông báo</p>
                <p className="text-xs text-slate-400">Hoạt động gần đây</p>
              </div>
              <Button type="button" variant="ghost" className="px-2 py-1 text-xs font-medium" disabled={readAll.isPending} onClick={() => readAll.mutate()}>
                <CheckCheck size={14} /> Đọc hết
              </Button>
            </div>
            <div className="max-h-80 space-y-1 overflow-auto">
              {notifications.length === 0 && (
                <p className="rounded-xl bg-slate-50 p-5 text-center text-sm text-slate-400">Hộp thư đang yên tĩnh.</p>
              )}
              {notifications.map((item: NotificationItem) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (!item.isRead) readOne.mutate(item.id)
                  }}
                  className="dropdown-item"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                    {!item.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />}
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-slate-400">{item.content}</p>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────
   UserMenu
   ────────────────────────────────────────────────────────────── */

function UserMenu() {
  const [open, setOpen] = useState(false)
  const { user, logout } = useNewAuth()

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:shadow-md"
      >
        {user?.roles.includes('STUDENT') ? (
          <img src={getStudentAvatarUrl(studentAvatarSeed(user))} alt={user.fullName || 'Học viên'} className="h-7 w-7 rounded-lg ring-2 ring-slate-100" />
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white shadow-sm">
            {user?.fullName?.slice(0, 1) ?? 'U'}
          </span>
        )}
        <span className="hidden max-w-28 truncate md:inline">{user?.fullName}</span>
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="dropdown-panel w-64">
            <div className="border-b border-slate-100 pb-3 px-1">
              {user?.roles.includes('STUDENT') && (
                <img src={getStudentAvatarUrl(studentAvatarSeed(user))} alt={user.fullName || 'Học viên'} className="mb-2 h-12 w-12 rounded-xl ring-2 ring-slate-100" />
              )}
              <p className="font-bold text-slate-900">{user?.fullName}</p>
              <div className="mt-2 flex flex-wrap gap-1">{user?.roles.map((role) => <RoleBadge key={role} role={role} />)}</div>
            </div>
            <button
              type="button"
              onClick={() => { setOpen(false); logout() }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-rose-500 transition hover:bg-rose-50"
            >
              <LogOut size={16} /> Đăng xuất
            </button>
          </div>
        </>
      )}
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────
   AppShell
   ────────────────────────────────────────────────────────────── */

export function AppShell({ children }: AppShellProps) {
  const { pathname } = useLocation()
  const { user } = useNewAuth()
  const userRoles = user?.roles ?? []
  const navItems = menuItems.filter((item) => item.roles?.some((role) => userRoles.includes(role)))
  const isStudent = userRoles.includes('STUDENT')

  return (
    <div className="min-h-screen bg-slate-50/80 pb-20 text-slate-800 lg:pb-0">
      <div className="flex min-h-screen">

        {/* ── Sidebar (dark) ── */}
        <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-20 lg:flex lg:w-[256px] lg:flex-col">
          <div className="flex h-full flex-col bg-slate-900 shadow-2xl">

            {/* Logo */}
            <div className="px-5 pt-6 pb-5">
              <Link to={homePathForUser(user)} className="group flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-base font-black text-white shadow-lg shadow-indigo-500/25 transition-transform group-hover:scale-105">
                  한
                </span>
                <span>
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.15em] text-indigo-400/80">Hoa Nobita</span>
                  <span className="block text-[15px] font-bold tracking-tight text-white">Korean LMS</span>
                </span>
              </Link>
            </div>

            <div className="mx-5 border-t border-white/[0.08]" />

            {/* Nav */}
            <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4" aria-label="Điều hướng chính">
              {navItems.map((item) => {
                const active = pathname === item.to || pathname.startsWith(`${item.to}/`)
                return (
                  <Link key={item.to} to={item.to} className={`sidebar-item ${active ? 'active' : ''}`}>
                    <span className={active ? 'text-indigo-400' : ''}>{item.icon}</span>
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            {/* User card at bottom */}
            <div className="border-t border-white/[0.08] p-4">
              <div className="flex items-center gap-3">
                {isStudent ? (
                  <img src={getStudentAvatarUrl(studentAvatarSeed(user))} alt={user?.fullName || ''} className="h-9 w-9 rounded-lg ring-2 ring-white/10" />
                ) : (
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white shadow-sm">
                    {user?.fullName?.slice(0, 1) ?? 'U'}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white/90">{user?.fullName}</p>
                  <p className="truncate text-xs text-slate-400/70">{user?.email}</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Main area (offset for sidebar) ── */}
        <div className="flex min-w-0 flex-1 flex-col lg:pl-[256px]">

          {/* Header — glassmorphic */}
          <header className="sticky top-0 z-30 border-b border-slate-200/60 bg-white/70 px-5 py-3 backdrop-blur-xl">
            <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[15px] font-bold text-slate-900">
                  Xin chào, {user?.fullName?.split(' ').slice(-1).join('') ?? 'bạn'} <span className="inline-block animate-pulse">👋</span>
                </p>
                <p className="text-xs text-slate-400">Chúc bạn một ngày tốt lành</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  aria-label="Mở lịch học"
                  to={user?.roles.includes('STUDENT') ? '/student/calendar' : user?.roles.includes('CLASS_ADMIN') ? '/admin/calendar' : '/teacher/calendar'}
                  className="header-btn"
                >
                  <CalendarDays size={18} />
                </Link>
                <NotificationBell />
                <UserMenu />
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="flex-1 px-4 py-5 md:px-5 lg:px-6">
            <div className="mx-auto max-w-[1200px]">
              {user?.firstLogin && (
                <div className="mb-5 rounded-2xl border border-amber-200/60 bg-amber-50/80 px-5 py-4 text-sm text-amber-800 backdrop-blur-sm">
                  <strong className="font-semibold">Gợi ý bảo mật:</strong> Đây có thể là lần đăng nhập đầu tiên. Bạn nên đổi mật khẩu để bảo vệ tài khoản.
                </div>
              )}
              <main>{children}</main>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile bottom nav ── */}
      {isStudent && (
        <nav className="fixed inset-x-2 bottom-2 z-40 grid grid-cols-5 gap-0.5 rounded-2xl border border-slate-200/60 bg-white/80 p-1 shadow-lg backdrop-blur-xl lg:hidden" aria-label="Điều hướng học viên">
          {mobileStudentItems.map((item) => {
            const active = pathname === item.to || pathname.startsWith(`${item.to}/`)
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-0.5 rounded-xl px-1 py-2 transition-all ${active ? 'bg-indigo-50 text-indigo-700' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <span className={active ? 'text-indigo-600' : ''}>{item.icon}</span>
                <span className={`text-[10px] leading-tight ${active ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      )}
    </div>
  )
}

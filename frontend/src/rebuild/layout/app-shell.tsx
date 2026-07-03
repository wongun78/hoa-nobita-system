import { Link, useLocation } from 'react-router-dom'
import { useNewAuth } from '../auth/use-auth'
import { Button } from './ui'
import type { RoleName } from '../core/types'

type MenuItem = {
  to: string
  label: string
  roles?: RoleName[]
}

const menuItems: MenuItem[] = [
  { to: '/bang-dieu-khien', label: 'Bảng điều khiển' },
  { to: '/lop-hoc', label: 'Lớp học' },
  { to: '/bai-tap', label: 'Bài tập' },
  { to: '/student/submissions', label: 'Bài nộp của tôi', roles: ['STUDENT'] },
  { to: '/student/submit', label: 'Nộp bài', roles: ['STUDENT'] },
  { to: '/cham-bai', label: 'Chấm bài', roles: ['TEACHER_OWNER', 'CLASS_ADMIN'] },
  { to: '/tai-lieu', label: 'Tài liệu' },
  { to: '/diem-danh', label: 'Điểm danh' },
  { to: '/lich-hoc', label: 'Lịch học' },
  { to: '/nguoi-dung', label: 'Người dùng', roles: ['TEACHER_OWNER'] },
  { to: '/thong-bao', label: 'Thông báo' },
  { to: '/bao-cao', label: 'Báo cáo', roles: ['TEACHER_OWNER', 'CLASS_ADMIN'] },
  { to: '/ho-so', label: 'Hồ sơ' },
]

type AppShellProps = Readonly<{ children: React.ReactNode }>

export function AppShell({ children }: AppShellProps) {
  const { pathname } = useLocation()
  const { user, logout } = useNewAuth()
  const userRoles = user?.roles ?? []
  const navItems = menuItems.filter((item) => {
    if (!item.roles) return true
    return item.roles.some((role) => userRoles.includes(role))
  })

  return (
    <div className="min-h-screen bg-[#FAFCFF] text-slate-800">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-6 p-6 lg:grid-cols-[240px_1fr]">
        <aside className="rounded-2xl border border-sky-100 bg-white p-5 lg:sticky lg:top-6 lg:h-[calc(100vh-48px)]">
          <div className="mb-6">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-500">Hoa Nobita</div>
            <div className="mt-2 text-xl font-bold">Nền tảng học tập</div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = pathname.startsWith(item.to)
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={active
                    ? 'block rounded-xl bg-sky-100 px-3 py-2 text-sm font-semibold text-slate-800'
                    : 'block rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-sky-50'}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="mt-8 border-t border-sky-100 pt-4">
            <div className="text-xs text-slate-500">{user?.fullName}</div>
            <div className="text-xs font-medium text-slate-700">{user?.roles.join(' • ')}</div>
            <Button variant="ghost" className="mt-2 w-full text-left" onClick={logout}>Đăng xuất</Button>
          </div>
        </aside>

        <main className="space-y-5">{children}</main>
      </div>
    </div>
  )
}

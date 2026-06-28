import { Bell, BookOpen, FileText, GraduationCap, LayoutDashboard, LogOut, Users } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../features/auth/use-auth'
import { useI18n } from '../../i18n/use-i18n'
import { Button } from '../ui/button'

type AppShellProps = Readonly<{ children: React.ReactNode }>

export function AppShell({ children }: AppShellProps) {
  const { user, logout, hasRole } = useAuth()
  const { t, locale, toggle } = useI18n()
  const loc = useLocation()
  let classLabel = t.classes
  if (hasRole('CLASS_ADMIN')) classLabel = t.managedClasses
  if (hasRole('STUDENT')) classLabel = t.myClasses
  const nav = [
    { to: '/dashboard', label: t.dashboard, icon: LayoutDashboard, show: true },
    { to: '/classes', label: classLabel, icon: GraduationCap, show: true },
    { to: '/assignments', label: t.assignments, icon: BookOpen, show: true },
    { to: '/me/submissions', label: t.submissions, icon: FileText, show: hasRole('STUDENT') },
    { to: '/users', label: t.users, icon: Users, show: hasRole('TEACHER_OWNER') },
    { to: '/notifications', label: t.notifications, icon: Bell, show: true }
  ].filter(n => n.show)
  const active = (to: string) => loc.pathname === to || (to !== '/classes' && loc.pathname.startsWith(to + '/'))
  return <div className="min-h-screen bg-[#F5FAFF]"><aside className="fixed inset-y-0 left-0 w-72 border-r border-[#D8E7F7] bg-white p-5"><Link to="/dashboard" className="mb-8 flex items-center gap-3"><div className="rounded-2xl bg-[#DBEAFE] p-3 text-[#3B82F6]"><BookOpen /></div><div><b className="text-[#1E3A8A]">Hoà Nobita</b><p className="text-sm text-slate-500">Korean Platform</p></div></Link><nav className="space-y-2">{nav.map(n => <Link key={n.to} to={n.to} className={`flex items-center gap-3 rounded-xl px-3 py-2 ${active(n.to) ? 'bg-[#3B82F6] text-white' : 'text-slate-600 hover:bg-blue-50'}`}><n.icon size={18}/>{n.label}</Link>)}</nav></aside><main className="ml-72"><header className="flex items-center justify-between border-b border-[#D8E7F7] bg-white/80 px-8 py-4"><div><h1 className="text-xl font-bold text-[#1E3A8A]">{t.appTitle}</h1><p className="text-sm text-slate-500">{user?.fullName} · {user?.roles.join(', ')}</p></div><div className="flex gap-2"><Button type="button" className="border border-[#D8E7F7] bg-white text-slate-700 hover:bg-blue-50" onClick={toggle}>{locale === 'vi' ? 'VI' : '한국어'}</Button><Button type="button" onClick={logout}><LogOut size={16}/>{t.logout}</Button></div></header><section className="p-8">{children}</section></main></div>
}

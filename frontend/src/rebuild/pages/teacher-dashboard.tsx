import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { BookOpen, CalendarCheck2, ClipboardList, Clock3, FileText, GraduationCap, LayoutDashboard, Megaphone, Sparkles, Users } from 'lucide-react'
import { api, type TeacherDashboard } from '../core/api'
import { ErrorState, MetricCard, PageHeader, SkeletonCard, StatusBadge, StudentHeroBanner } from '../components/foundation'
import { Button, Card } from '../layout/ui'
import { fmtDate } from './phase2-utils'
import type { ActivityItem, AssignmentItem, NotificationItem } from '../core/types'

function QuickAction({ to, icon, label, description, color }: Readonly<{ to: string; icon: React.ReactNode; label: string; description: string; color: string }>) {
  return (
    <Link to={to} className="group block rounded-3xl focus:outline-none focus:ring-4 focus:ring-indigo-100">
      <Card className="flex items-center gap-4 rounded-3xl transition hover:-translate-y-0.5 hover:shadow-lg">
        <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${color}`}>{icon}</div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-slate-950">{label}</p>
          <p className="mt-0.5 text-xs text-slate-500">{description}</p>
        </div>
      </Card>
    </Link>
  )
}

export function TeacherDashboardPage() {
  const dash = useQuery({ queryKey: ['dashboard', 'teacher'], queryFn: () => api.dashboardTeacher() })
  const activity = useQuery({ queryKey: ['activity', 'teacher', 'recent'], queryFn: () => api.recentActivityPage({ page: 0, size: 6 }), staleTime: 30_000 })
  const assignments = useQuery({ queryKey: ['assignments', 'teacher', 'due-soon'], queryFn: () => api.assignmentsPage({ page: 0, size: 5, status: 'PUBLISHED' }), staleTime: 30_000 })

  const d = dash.data as TeacherDashboard | undefined
  const activityItems = useMemo(() => {
    const raw = activity.data
    if (!raw) return []
    return Array.isArray(raw) ? raw : raw.items ?? []
  }, [activity.data])
  const upcomingAssignments = useMemo(() => {
    const raw = assignments.data
    const items: AssignmentItem[] = Array.isArray(raw) ? raw : raw?.items ?? []
    return items.filter((item) => item.dueAt && new Date(item.dueAt).getTime() > Date.now()).slice(0, 5)
  }, [assignments.data])

  if (dash.isLoading) {
    return (
      <div className="space-y-5">
        <SkeletonCard lines={4} />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
      </div>
    )
  }

  if (dash.isError) {
    return <ErrorState title="Không tải được bảng điều khiển" description="Vui lòng thử lại sau ít phút." onRetry={() => dash.refetch()} />
  }

  return (
    <div className="space-y-5">
      {/* Hero Banner */}
      <StudentHeroBanner>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur"><Sparkles size={14} /> Giáo viên</span>
            <h1 className="mt-3 text-2xl font-black tracking-tight md:text-3xl">Bảng điều khiển</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">Tổng quan về hoạt động giảng dạy, bài tập cần chấm và tình hình học viên.</p>
          </div>
          <div className="hidden gap-2 md:flex">
            <Link to="/teacher/classes"><Button variant="secondary" className="bg-white/20 text-white border-white/30 hover:bg-white/30"><BookOpen size={16} />Lớp học</Button></Link>
            <Link to="/teacher/grading"><Button variant="secondary" className="bg-white/20 text-white border-white/30 hover:bg-white/30"><GraduationCap size={16} />Chấm bài</Button></Link>
          </div>
        </div>
      </StudentHeroBanner>

      {/* Metrics */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Lớp học active" value={d?.activeClassCount ?? 0} hint="Đang giảng dạy" icon={<BookOpen size={20} />} tone="indigo" />
        <MetricCard label="Học viên active" value={d?.activeStudentCount ?? 0} hint="Đang tham gia" icon={<Users size={20} />} tone="sky" />
        <MetricCard label="Bài tập sắp hết hạn" value={d?.dueSoonAssignmentCount ?? 0} hint="Trong 48 giờ tới" icon={<Clock3 size={20} />} tone="amber" />
        <MetricCard label="Bài cần chấm" value={(d?.needGradingByClass ?? []).reduce((sum, item) => sum + item.count, 0)} hint="Đang chờ đánh giá" icon={<GraduationCap size={20} />} tone="rose" />
      </div>

      {/* Quick Actions */}
      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.08em] text-indigo-500">Thao tác nhanh</p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <QuickAction to="/teacher/classes" icon={<BookOpen size={20} />} label="Quản lý lớp" description="Tạo, chỉnh sửa lớp học" color="bg-indigo-50 text-indigo-600" />
          <QuickAction to="/teacher/assignments" icon={<ClipboardList size={20} />} label="Tạo bài tập" description="Giao bài cho lớp" color="bg-sky-50 text-sky-600" />
          <QuickAction to="/teacher/grading" icon={<GraduationCap size={20} />} label="Chấm bài" description="Đánh giá bài nộp" color="bg-emerald-50 text-emerald-600" />
          <QuickAction to="/teacher/attendance" icon={<CalendarCheck2 size={20} />} label="Điểm danh" description="Theo dõi chuyên cần" color="bg-amber-50 text-amber-600" />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        {/* Grading Queue */}
        <Card className="overflow-hidden rounded-3xl border-amber-100 bg-amber-50/50">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-amber-600">Hàng đợi chấm bài</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">Bài cần đánh giá</h2>
            </div>
            <div className="rounded-2xl bg-white p-3 text-amber-600"><GraduationCap size={22} /></div>
          </div>
          {(d?.needGradingByClass ?? []).length > 0 ? (
            <div className="mt-4 space-y-2">
              {(d?.needGradingByClass ?? []).map((item) => (
                <Link key={item.classId} to="/teacher/grading" className="flex items-center justify-between rounded-2xl border border-amber-100 bg-white px-4 py-3 transition hover:border-amber-200 hover:bg-amber-50/50">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-900">{item.className}</p>
                  </div>
                  <span className="ml-3 inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">{item.count} bài</span>
                </Link>
              ))}
              <Link to="/teacher/grading" className="block rounded-2xl py-2 text-center text-xs font-bold text-amber-600 transition hover:text-amber-700">Xem tất cả →</Link>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl bg-slate-50 p-6 text-center">
              <p className="text-sm font-semibold text-slate-500">Không có bài nào cần chấm</p>
              <p className="mt-1 text-xs text-slate-400">Tuyệt vời! Bạn đã chấm hết bài rồi.</p>
            </div>
          )}
        </Card>

        {/* Activity Feed */}
        <Card className="overflow-hidden rounded-3xl border-indigo-100 bg-indigo-50/50">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-indigo-500">Hoạt động gần đây</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">Nhật ký hệ thống</h2>
            </div>
            <div className="rounded-2xl bg-white p-3 text-indigo-600"><LayoutDashboard size={22} /></div>
          </div>
          {activityItems.length > 0 ? (
            <div className="mt-4 space-y-2">
              {activityItems.slice(0, 5).map((item: ActivityItem) => (
                <div key={item.id} className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
                  <p className="text-sm font-semibold text-slate-800">{item.message}</p>
                  <p className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                    <span>{item.actorName}</span>
                    <span>·</span>
                    <span>{fmtDate(item.createdAt)}</span>
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl bg-slate-50 p-6 text-center">
              <p className="text-sm font-semibold text-slate-500">Chưa có hoạt động gần đây</p>
            </div>
          )}
        </Card>
      </div>

      {/* Upcoming Assignments */}
      {upcomingAssignments.length > 0 && (
        <Card className="overflow-hidden rounded-3xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-sky-500">Bài tập sắp tới</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">Deadline cần chú ý</h2>
            </div>
            <Link to="/teacher/assignments" className="text-xs font-bold text-indigo-600 hover:text-indigo-700">Xem tất cả →</Link>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-sky-100 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="pb-2 pr-4">Bài tập</th>
                  <th className="pb-2 pr-4">Lớp</th>
                  <th className="pb-2 pr-4">Hạn nộp</th>
                  <th className="pb-2">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-50">
                {upcomingAssignments.map((item) => (
                  <tr key={item.id} className="transition hover:bg-sky-50/40">
                    <td className="py-3 pr-4 font-bold text-slate-900">{item.title}</td>
                    <td className="py-3 pr-4 text-slate-600">{item.className ?? '—'}</td>
                    <td className="py-3 pr-4 text-slate-600">{fmtDate(item.dueAt)}</td>
                    <td className="py-3"><StatusBadge value={item.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}

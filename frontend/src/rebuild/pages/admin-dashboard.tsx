import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { AlertTriangle, BookOpen, CalendarCheck2, ClipboardList, Clock3, GraduationCap, LayoutDashboard, Sparkles } from 'lucide-react'
import { api, type AdminDashboard } from '../core/api'
import { ErrorState, MetricCard, SkeletonCard, StatusBadge, StudentHeroBanner } from '../components/foundation'
import { Card } from '../layout/ui'
import { fmtDate } from './phase2-utils'
import type { ActivityItem, AssignmentItem } from '../core/types'

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

export function AdminDashboardPage() {
  const dash = useQuery({ queryKey: ['dashboard', 'admin'], queryFn: () => api.dashboardAdmin() })
  const activity = useQuery({ queryKey: ['activity', 'admin', 'recent'], queryFn: () => api.recentActivityPage({ page: 0, size: 6 }), staleTime: 30_000 })

  const d = dash.data as AdminDashboard | undefined
  const activityItems = useMemo(() => {
    const raw = activity.data
    if (!raw) return []
    return Array.isArray(raw) ? raw : raw.items ?? []
  }, [activity.data])

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

  const dueSoonItems = d?.assignmentsDueSoon ?? []
  const hasUrgent = dueSoonItems.some((item) => {
    const hoursLeft = (new Date(item.deadline).getTime() - Date.now()) / (1000 * 60 * 60)
    return hoursLeft <= 24 && hoursLeft > 0
  })

  return (
    <div className="space-y-5">
      {/* Hero Banner */}
      <StudentHeroBanner>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur"><Sparkles size={14} /> Trợ giảng</span>
            <h1 className="mt-3 text-2xl font-black tracking-tight md:text-3xl">Bảng điều khiển</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">Quản lý lớp học, theo dõi tiến độ bài tập và hỗ trợ học viên kịp thời.</p>
          </div>
        </div>
      </StudentHeroBanner>

      {/* Metrics */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Bài tập sắp hết hạn" value={d?.dueSoonAssignmentCount ?? 0} hint="Trong 48 giờ tới" icon={<Clock3 size={20} />} tone="amber" />
        <MetricCard label="Thiếu bài nộp" value={d?.missingSubmissionCount ?? 0} hint="Cần theo dõi" icon={<AlertTriangle size={20} />} tone="rose" />
        <MetricCard label="Lớp đang quản lý" value={dueSoonItems.length > 0 ? new Set(dueSoonItems.map((item) => item.classId)).size : 0} hint="Có deadline sắp tới" icon={<BookOpen size={20} />} tone="indigo" />
        <MetricCard label="Khẩn cấp" value={hasUrgent ? 'Có' : 'Không'} hint="Deadline trong 24h" icon={<AlertTriangle size={20} />} tone={hasUrgent ? 'rose' : 'emerald'} />
      </div>

      {/* Quick Actions */}
      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.08em] text-indigo-500">Thao tác nhanh</p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <QuickAction to="/admin/classes" icon={<BookOpen size={20} />} label="Lớp học" description="Quản lý lớp" color="bg-indigo-50 text-indigo-600" />
          <QuickAction to="/admin/assignments" icon={<ClipboardList size={20} />} label="Bài tập" description="Theo dõi bài tập" color="bg-sky-50 text-sky-600" />
          <QuickAction to="/admin/grading" icon={<GraduationCap size={20} />} label="Chấm bài" description="Đánh giá bài nộp" color="bg-emerald-50 text-emerald-600" />
          <QuickAction to="/admin/attendance" icon={<CalendarCheck2 size={20} />} label="Điểm danh" description="Chuyên cần học viên" color="bg-amber-50 text-amber-600" />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        {/* Assignments Due Soon */}
        <Card className="overflow-hidden rounded-3xl border-rose-100 bg-rose-50/50">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-rose-500">Cần chú ý</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">Bài tập sắp hết hạn</h2>
            </div>
            <div className="rounded-2xl bg-white/80 p-3 text-rose-600"><Clock3 size={22} /></div>
          </div>
          {dueSoonItems.length > 0 ? (
            <div className="mt-4 space-y-2">
              {dueSoonItems.map((item) => {
                const hoursLeft = Math.max(0, Math.floor((new Date(item.deadline).getTime() - Date.now()) / (1000 * 60 * 60)))
                const urgent = hoursLeft <= 24
                return (
                  <Link key={item.assignmentId} to="/admin/assignments" className={`flex items-center justify-between rounded-2xl border px-4 py-3 transition ${urgent ? 'border-rose-200 bg-rose-50/60 hover:bg-rose-50' : 'border-amber-100 bg-white/80 hover:border-amber-200 hover:bg-amber-50/50'}`}>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900">{item.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{item.className}</p>
                    </div>
                    <div className="ml-3 shrink-0 text-right">
                      <p className={`text-xs font-black ${urgent ? 'text-rose-600' : 'text-amber-600'}`}>{fmtDate(item.deadline)}</p>
                      <p className="mt-0.5 text-[10px] font-semibold text-slate-400">{hoursLeft <= 0 ? 'Đã quá hạn' : hoursLeft < 24 ? `Còn ${hoursLeft}h` : `Còn ${Math.ceil(hoursLeft / 24)} ngày`}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl bg-slate-50 p-6 text-center">
              <p className="text-sm font-semibold text-slate-500">Không có bài tập nào sắp hết hạn</p>
              <p className="mt-1 text-xs text-slate-400">Tuyệt vời! Mọi thứ đang trong tầm kiểm soát.</p>
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
            <div className="rounded-2xl bg-white/80 p-3 text-indigo-600"><LayoutDashboard size={22} /></div>
          </div>
          {activityItems.length > 0 ? (
            <div className="mt-4 space-y-2">
              {activityItems.slice(0, 5).map((item: ActivityItem) => (
                <div key={item.id} className="rounded-2xl border border-sky-50 bg-white/70 px-4 py-3">
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
    </div>
  )
}

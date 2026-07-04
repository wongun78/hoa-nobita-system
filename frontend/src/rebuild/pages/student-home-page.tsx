import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Bell, BookOpen, CalendarDays, CheckCircle2, Clock3, GraduationCap, Sparkles, TrendingUp } from 'lucide-react'
import { api } from '../core/api'
import { EmptyState, ErrorState, MetricCard, SkeletonCard, StatusBadge } from '../components/foundation'
import { Card } from '../layout/ui'
import { fmtDate } from './phase2-utils'
import { useNewAuth } from '../auth/use-auth'
import type { AssignmentItem, NotificationItem, SubmissionItem } from '../core/types'

function isDueSoon(item: AssignmentItem) {
  if (!item.dueAt) return false
  const due = new Date(item.dueAt).getTime()
  const now = Date.now()
  return due >= now && due - now <= 1000 * 60 * 60 * 24 * 7
}

function isOverdue(item: AssignmentItem) {
  return item.dueAt ? new Date(item.dueAt).getTime() < Date.now() : false
}

function averageScore(items: SubmissionItem[]) {
  const graded = items.filter((item) => typeof item.score === 'number')
  if (!graded.length) return null
  return graded.reduce((sum, item) => sum + Number(item.score), 0) / graded.length
}

export function StudentHomePage() {
  const { user } = useNewAuth()
  const dashboard = useQuery({ queryKey: ['dashboard', 'student'], queryFn: api.dashboardStudent })
  const assignments = useQuery({ queryKey: ['student', 'home', 'assignments'], queryFn: () => api.assignmentsPage({ page: 0, size: 8 }) })
  const submissions = useQuery({ queryKey: ['student', 'home', 'submissions'], queryFn: () => api.mySubmissionsPage({ page: 0, size: 6 }) })
  const notifications = useQuery({ queryKey: ['student', 'home', 'notifications'], queryFn: () => api.notificationsPage({ page: 0, size: 5 }) })
  const attendance = useQuery({ queryKey: ['student', 'home', 'attendance', user?.id], queryFn: () => api.studentAttendance(user!.id), enabled: Boolean(user?.id) })

  const assignmentItems = useMemo(() => Array.isArray(assignments.data) ? assignments.data : assignments.data?.items ?? [], [assignments.data])
  const submissionItems = useMemo(() => Array.isArray(submissions.data) ? submissions.data : submissions.data?.items ?? [], [submissions.data])
  const notificationItems = useMemo(() => Array.isArray(notifications.data) ? notifications.data : notifications.data?.items ?? [], [notifications.data])
  const upcoming = useMemo(() => assignmentItems.filter(isDueSoon).slice(0, 4), [assignmentItems])
  const overdue = useMemo(() => assignmentItems.filter(isOverdue).slice(0, 4), [assignmentItems])
  const recentGrades = useMemo(() => submissionItems.filter((item) => item.status === 'GRADED' || item.score != null).slice(0, 4), [submissionItems])
  const attendanceRate = useMemo(() => {
    const rows = attendance.data ?? []
    if (!rows.length) return null
    const presentLike = rows.filter((item) => item.status === 'PRESENT' || item.status === 'LATE').length
    return Math.round((presentLike / rows.length) * 100)
  }, [attendance.data])
  const avg = averageScore(submissionItems)

  if (dashboard.isLoading) {
    return (
      <div className="space-y-4">
        <SkeletonCard lines={4} />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
      </div>
    )
  }

  if (dashboard.isError) {
    return <ErrorState title="Không tải được trang học viên" description="Vui lòng thử lại sau ít phút." onRetry={() => dashboard.refetch()} />
  }

  return (
    <div className="space-y-5 pb-20 md:pb-0">
      <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-gradient-to-br from-indigo-600 via-indigo-500 to-sky-400 p-6 text-white shadow-lg">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -left-6 bottom-0 h-28 w-28 rounded-full bg-white/10 blur-xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur"><Sparkles size={14} /> TOPIK Journey</span>
            <h1 className="mt-3 text-2xl font-black tracking-tight md:text-3xl">Hôm nay bạn học gì{user?.fullName ? `, ${user.fullName.split(' ').slice(-1).join('')}` : ''}?</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">Một góc học tập nhẹ nhàng để theo dõi lớp TOPIK, deadline, điểm số và thông báo mới.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Lớp đang học" value={dashboard.data?.joinedClassCount ?? 0} hint="Lớp bạn đã tham gia" icon={<BookOpen size={20} />} tone="indigo" />
        <MetricCard label="Bài đang mở" value={dashboard.data?.openAssignmentCount ?? 0} hint="Sẵn sàng luyện tập" icon={<Clock3 size={20} />} tone="sky" />
        <MetricCard label="Sắp đến hạn" value={dashboard.data?.dueSoonCount ?? upcoming.length} hint="Cần ưu tiên trong tuần" icon={<CalendarDays size={20} />} tone="amber" />
        <MetricCard label="Điểm trung bình" value={avg == null ? '-' : avg.toFixed(1)} hint="Từ bài đã chấm gần đây" icon={<TrendingUp size={20} />} tone="emerald" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-50 via-white to-pink-50">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-indigo-500">Deadline sắp tới</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">Giữ nhịp học thật êm</h2>
            </div>
            <div className="rounded-2xl bg-white/80 p-3 text-indigo-600"><CalendarDays size={22} /></div>
          </div>
          <div className="mt-4 space-y-3">
            {upcoming.map((item) => (
              <a key={item.id} href={`/student/assignments/${item.id}`} className="block min-h-16 rounded-2xl border border-white bg-white/80 p-3 transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-black text-slate-900">{item.title}</div>
                    <div className="mt-1 text-xs text-slate-500">{item.className || 'Lớp học'} · {fmtDate(item.dueAt)}</div>
                  </div>
                  <StatusBadge value={item.status} />
                </div>
              </a>
            ))}
            {!upcoming.length && <EmptyState title="Không có deadline gần" description="Hộp việc tuần này đang nhẹ nhàng — hãy ôn lại bài cũ nhé." />}
          </div>
          <a href="/student/assignments" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-indigo-600 transition hover:gap-2">Xem tất cả <span className="transition hover:translate-x-1">→</span></a>
        </Card>

        <Card className="rounded-3xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-rose-500">Cần chú ý</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">Bài quá hạn</h2>
            </div>
            <div className="rounded-2xl bg-rose-50 p-3 text-rose-500"><Clock3 size={22} /></div>
          </div>
          <div className="mt-4 space-y-3">
            {overdue.map((item) => (
              <a key={item.id} href={`/student/assignments/${item.id}`} className="block min-h-16 rounded-2xl border border-rose-100 bg-rose-50/50 p-3 transition hover:bg-rose-50">
                <div className="text-sm font-black text-slate-900">{item.title}</div>
                <div className="mt-1 text-xs text-rose-600">Đã quá hạn: {fmtDate(item.dueAt)}</div>
              </a>
            ))}
            {!overdue.length && <EmptyState title="Không có bài quá hạn" description="Rất tốt — bạn đang giữ tiến độ ổn định." />}
          </div>
          <a href="/student/assignments" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-rose-600 transition hover:gap-2">Xem tất cả <span className="transition hover:translate-x-1">→</span></a>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="rounded-3xl">
          <div className="flex items-center gap-3"><GraduationCap className="text-emerald-600" /><h2 className="text-lg font-black text-slate-950">Điểm gần đây</h2></div>
          <div className="mt-4 space-y-3">
            {recentGrades.map((item) => (
              <a key={item.id} href={`/student/submissions/${item.id}`} className="block rounded-2xl border border-sky-100 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0"><div className="truncate text-sm font-bold">{item.assignmentTitle}</div><div className="text-xs text-slate-500">{item.className}</div></div>
                  <div className="text-sm font-black text-emerald-600">{item.score ?? '-'}/{item.maxScore ?? '-'}</div>
                </div>
              </a>
            ))}
            {!recentGrades.length && <EmptyState title="Chưa có điểm mới" description="Điểm và phản hồi sẽ xuất hiện sau khi giáo viên chấm bài." />}
          </div>
          <a href="/student/grades" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-emerald-600 transition hover:gap-2">Xem tất cả <span className="transition hover:translate-x-1">→</span></a>
        </Card>

        <Card className="rounded-3xl">
          <div className="flex items-center gap-3"><Bell className="text-indigo-600" /><h2 className="text-lg font-black text-slate-950">Thông báo</h2></div>
          <div className="mt-4 space-y-3">
            {(notificationItems as NotificationItem[]).map((item) => (
              <a key={item.id} href="/student/notifications" className="block min-h-14 rounded-2xl border border-sky-100 p-3">
                <div className="text-sm font-bold text-slate-900">{item.title}</div>
                <div className="mt-1 line-clamp-2 text-xs text-slate-500">{item.content}</div>
              </a>
            ))}
            {!notificationItems.length && <EmptyState title="Hộp thư yên tĩnh" description="Không có thông báo mới trong lúc này." />}
          </div>
          <a href="/student/notifications" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-indigo-600 transition hover:gap-2">Xem tất cả <span className="transition hover:translate-x-1">→</span></a>
        </Card>

        <Card className="rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-sky-50">
          <div className="flex items-center gap-3"><CheckCircle2 className="text-emerald-600" /><h2 className="text-lg font-black text-slate-950">Chuyên cần</h2></div>
          <div className="mt-6 text-5xl font-black text-slate-950">{attendanceRate == null ? '-' : `${attendanceRate}%`}</div>
          <p className="mt-2 text-sm text-slate-500">Tỷ lệ có mặt/tính cả đi muộn từ dữ liệu điểm danh cá nhân.</p>
          <a href="/student/attendance" className="mt-5 inline-flex min-h-11 items-center rounded-2xl bg-white px-4 text-sm font-bold text-slate-700 shadow-sm">Xem lịch sử điểm danh</a>
        </Card>
      </div>
    </div>
  )
}

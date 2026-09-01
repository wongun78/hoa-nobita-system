import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, CalendarDays, CheckCircle2, Clock3, RotateCcw, TrendingUp } from 'lucide-react'
import { api } from '../core/api'
import { ErrorState, MetricCard, SkeletonCard, StudentHeroBanner } from '../components/foundation'
import { useNewAuth } from '../auth/use-auth'
import { getStudentAvatarUrl, studentAvatarSeed } from './phase2-utils'

export function StudentDashboardPage() {
  const { user } = useNewAuth()
  const query = useQuery({ queryKey: ['dash', 'student'], queryFn: api.dashboardStudent })

  if (query.isLoading) {
    return (
      <div className="space-y-4">
        <SkeletonCard lines={4} />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
      </div>
    )
  }

  if (query.isError || !query.data) {
    return <ErrorState title="Không tải được bảng điều khiển" description="Vui lòng thử lại sau ít phút." onRetry={() => query.refetch()} />
  }

  const data = query.data

  return (
    <div className="space-y-5">
      <StudentHeroBanner>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight md:text-3xl">Chào mừng trở lại{user?.fullName ? `, ${user.fullName.split(' ').slice(-1).join('')}` : ''}!</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">Hôm nay bạn muốn học gì? Dưới đây là tổng quan nhanh về tiến độ học tập của bạn.</p>
          </div>
          {user && <img src={getStudentAvatarUrl(studentAvatarSeed(user))} alt={user.fullName || 'Học viên'} className="hidden h-20 w-20 rounded-2xl border-2 border-white/30 shadow-lg md:block" />}
        </div>
      </StudentHeroBanner>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard label="Lớp đã tham gia" value={data.joinedClassCount} hint="Đang theo học" icon={<BookOpen size={20} />} tone="indigo" />
        <MetricCard label="Bài tập đang mở" value={data.openAssignmentCount} hint="Sẵn sàng luyện tập" icon={<Clock3 size={20} />} tone="sky" />
        <MetricCard label="Sắp đến hạn" value={data.dueSoonCount} hint="Cần ưu tiên" icon={<CalendarDays size={20} />} tone="amber" />
        <MetricCard label="Đã chấm" value={data.gradedCount} hint="Bài có điểm" icon={<CheckCircle2 size={20} />} tone="emerald" />
        <MetricCard label="Yêu cầu nộp lại" value={data.resubmitRequestedCount} hint="Cần chỉnh sửa" icon={<RotateCcw size={20} />} tone="rose" />
        <MetricCard label="Tiến độ" value={data.openAssignmentCount > 0 ? `${Math.round((data.gradedCount / (data.gradedCount + data.openAssignmentCount)) * 100)}%` : '—'} hint="Hoàn thành / tổng" icon={<TrendingUp size={20} />} tone="violet" />
      </div>
    </div>
  )
}

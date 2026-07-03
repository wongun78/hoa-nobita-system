import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CalendarCheck2, CheckCircle2, Clock3, XCircle } from 'lucide-react'
import { api } from '../core/api'
import { EmptyState, ErrorState, MetricCard, PageHeader, SkeletonCard, StatusBadge } from '../components/foundation'
import { Card } from '../layout/ui'
import { fmtDate } from './phase2-utils'
import type { AttendanceItem, AttendanceStatus } from '../core/types'

type AttendanceCounts = Record<AttendanceStatus, number>

const statusMeta: Record<AttendanceStatus, { label: string; description: string; icon: React.ReactNode; className: string }> = {
  PRESENT: { label: 'Có mặt', description: 'Bạn đã tham gia buổi học.', icon: <CheckCircle2 size={18} />, className: 'border-emerald-100 bg-emerald-50 text-emerald-700' },
  LATE: { label: 'Đi muộn', description: 'Bạn có mặt nhưng cần cải thiện giờ vào lớp.', icon: <Clock3 size={18} />, className: 'border-amber-100 bg-amber-50 text-amber-700' },
  ABSENT: { label: 'Vắng', description: 'Bạn không tham gia buổi học này.', icon: <XCircle size={18} />, className: 'border-rose-100 bg-rose-50 text-rose-700' },
}

function buildCounts(items: AttendanceItem[]): AttendanceCounts {
  return items.reduce<AttendanceCounts>((acc, item) => {
    acc[item.status] += 1
    return acc
  }, { PRESENT: 0, ABSENT: 0, LATE: 0 })
}

function attendanceRate(items: AttendanceItem[]) {
  if (!items.length) return null
  const counts = buildCounts(items)
  return Math.round(((counts.PRESENT + counts.LATE) / items.length) * 100)
}

function AttendanceTimelineItem({ item }: Readonly<{ item: AttendanceItem }>) {
  const meta = statusMeta[item.status]
  return (
    <Card className="rounded-3xl">
      <div className="flex gap-3">
        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl border ${meta.className}`}>{meta.icon}</div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="font-black text-slate-950">{meta.label}</h2>
              <p className="mt-1 text-sm text-slate-500">{fmtDate(item.createdAt)}</p>
            </div>
            <StatusBadge value={item.status} />
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">{item.note || meta.description}</p>
        </div>
      </div>
    </Card>
  )
}

export function StudentAttendancePage() {
  const meQuery = useQuery({ queryKey: ['auth', 'me', 'student-attendance'], queryFn: api.me, staleTime: 60_000 })
  const attendanceQuery = useQuery({
    queryKey: ['student', 'attendance', meQuery.data?.id],
    queryFn: () => api.studentAttendance(meQuery.data!.id),
    enabled: Boolean(meQuery.data?.id),
  })

  const rows = useMemo(() => (attendanceQuery.data ?? []).slice().sort((a, b) => new Date(b.createdAt ?? '').getTime() - new Date(a.createdAt ?? '').getTime()), [attendanceQuery.data])
  const counts = useMemo(() => buildCounts(rows), [rows])
  const rate = useMemo(() => attendanceRate(rows), [rows])

  if (meQuery.isLoading || attendanceQuery.isLoading) return <div className="space-y-4 pb-20 md:pb-0"><SkeletonCard lines={4} /><SkeletonCard /><SkeletonCard /></div>
  if (meQuery.isError) return <ErrorState title="Không xác định được học viên" description="Vui lòng đăng nhập lại để tải dữ liệu điểm danh cá nhân." onRetry={() => meQuery.refetch()} />
  if (attendanceQuery.isError) return <ErrorState title="Không tải được điểm danh" description="Vui lòng thử lại sau ít phút." onRetry={() => attendanceQuery.refetch()} />

  return (
    <div className="space-y-5 pb-20 md:pb-0">
      <PageHeader eyebrow="출석" title="Điểm danh của tôi" description="Theo dõi tỷ lệ tham gia lớp học và lịch sử điểm danh cá nhân từ tài khoản hiện tại." />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Tỷ lệ tham gia" value={rate == null ? '-' : `${rate}%`} hint="Có mặt + đi muộn / tổng buổi" icon={<CalendarCheck2 size={20} />} tone="emerald" />
        <MetricCard label="Có mặt" value={counts.PRESENT} hint="Buổi học đúng giờ" icon={<CheckCircle2 size={20} />} tone="emerald" />
        <MetricCard label="Đi muộn" value={counts.LATE} hint="Vẫn tính có tham gia" icon={<Clock3 size={20} />} tone="amber" />
        <MetricCard label="Vắng" value={counts.ABSENT} hint="Cần theo dõi lại bài học" icon={<XCircle size={20} />} tone="rose" />
      </div>

      {rows.length ? (
        <div className="space-y-3">
          {rows.map((item) => <AttendanceTimelineItem key={item.id} item={item} />)}
        </div>
      ) : (
        <EmptyState title="Chưa có dữ liệu điểm danh" description="Khi giáo viên điểm danh, lịch sử tham gia của bạn sẽ hiển thị tại đây." action={<CalendarCheck2 className="mx-auto text-indigo-400" />} />
      )}
    </div>
  )
}

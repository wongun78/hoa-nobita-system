import { useQuery } from '@tanstack/react-query'
import { api } from '../core/api'
import { Card } from '../layout/ui'

export function StudentDashboardPage() {
  const query = useQuery({ queryKey: ['dash', 'student'], queryFn: api.dashboardStudent })

  if (query.isLoading) return <div className="text-sm text-slate-500">Đang tải bảng điều khiển...</div>
  if (query.isError || !query.data) return <div className="text-sm text-rose-600">Không thể tải dữ liệu bảng điều khiển.</div>

  const data = query.data

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <Card><div className="text-xs uppercase tracking-wide text-slate-500">Lớp đã tham gia</div><div className="mt-1 text-3xl font-bold">{data.joinedClassCount}</div></Card>
      <Card><div className="text-xs uppercase tracking-wide text-slate-500">Bài tập đang mở</div><div className="mt-1 text-3xl font-bold">{data.openAssignmentCount}</div></Card>
      <Card><div className="text-xs uppercase tracking-wide text-slate-500">Sắp đến hạn</div><div className="mt-1 text-3xl font-bold">{data.dueSoonCount}</div></Card>
      <Card><div className="text-xs uppercase tracking-wide text-slate-500">Đã nộp</div><div className="mt-1 text-3xl font-bold">{data.submittedCount}</div></Card>
      <Card><div className="text-xs uppercase tracking-wide text-slate-500">Đã chấm</div><div className="mt-1 text-3xl font-bold">{data.gradedCount}</div></Card>
      <Card><div className="text-xs uppercase tracking-wide text-slate-500">Yêu cầu nộp lại</div><div className="mt-1 text-3xl font-bold">{data.resubmitRequestedCount}</div></Card>
    </div>
  )
}

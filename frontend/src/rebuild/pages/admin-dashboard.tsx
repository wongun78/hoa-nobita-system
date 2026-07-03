import { useQuery } from '@tanstack/react-query'
import { api } from '../core/api'
import { Card } from '../layout/ui'

export function AdminDashboardPage() {
  const query = useQuery({ queryKey: ['dash', 'admin'], queryFn: api.dashboardAdmin })

  if (query.isLoading) return <div className="text-sm text-slate-500">Đang tải bảng điều khiển...</div>
  if (query.isError || !query.data) return <div className="text-sm text-rose-600">Không thể tải dữ liệu bảng điều khiển.</div>

  const data = query.data

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card><div className="text-xs uppercase tracking-wide text-slate-500">Lớp được giao</div><div className="mt-1 text-3xl font-bold">{data.assignedClassCount}</div></Card>
      <Card><div className="text-xs uppercase tracking-wide text-slate-500">Cần chấm hôm nay</div><div className="mt-1 text-3xl font-bold">{data.todayNeedGradingCount}</div></Card>
      <Card><div className="text-xs uppercase tracking-wide text-slate-500">Sắp đến hạn</div><div className="mt-1 text-3xl font-bold">{data.dueSoonAssignmentCount}</div></Card>
      <Card><div className="text-xs uppercase tracking-wide text-slate-500">Thiếu bài nộp</div><div className="mt-1 text-3xl font-bold">{data.missingSubmissionCount}</div></Card>
    </div>
  )
}

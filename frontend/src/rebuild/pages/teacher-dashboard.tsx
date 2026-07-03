import { useQuery } from '@tanstack/react-query'
import { api } from '../core/api'
import { Card } from '../layout/ui'

function NumberTile({ label, value }: Readonly<{ label: string; value: number }>) {
  return (
    <Card>
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-3xl font-bold text-slate-800">{value}</div>
    </Card>
  )
}

export function TeacherDashboardPage() {
  const query = useQuery({ queryKey: ['dash', 'teacher'], queryFn: api.dashboardTeacher })

  if (query.isLoading) return <div className="text-sm text-slate-500">Đang tải bảng điều khiển...</div>
  if (query.isError || !query.data) return <div className="text-sm text-rose-600">Không thể tải dữ liệu bảng điều khiển.</div>

  const data = query.data
  const todayTasks = data.todayTasks ?? []

  return (
    <div className="space-y-5">
      <Card className="rounded-3xl bg-gradient-to-br from-indigo-50 via-sky-50 to-pink-50">
        <div className="text-sm text-slate-500">Chào Anh Hoà, hôm nay lớp học đang vận hành thế nào?</div>
        <h1 className="text-2xl font-bold">{data.greetingName ?? 'HOA NOBITA'}</h1>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <NumberTile label="Việc hôm nay" value={data.todayActionCount ?? 0} />
        <NumberTile label="Lớp đang hoạt động" value={data.activeClassCount ?? data.totalClasses ?? 0} />
        <NumberTile label="Học viên hoạt động" value={data.activeStudentCount ?? data.totalStudents ?? 0} />
        <NumberTile label="Cần chấm" value={data.needGradingCount ?? 0} />
      </div>

      <Card>
        <h2 className="text-lg font-semibold">Danh sách ưu tiên</h2>
        <div className="mt-3 divide-y divide-sky-50">
          {todayTasks.length === 0 && <div className="py-4 text-sm text-slate-500">Hôm nay không có công việc gấp.</div>}
          {todayTasks.map((task) => (
            <div key={task.id} className="py-3">
              <div className="text-sm font-semibold text-slate-800">{task.title}</div>
              <div className="mt-1 text-sm text-slate-500">{task.description}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

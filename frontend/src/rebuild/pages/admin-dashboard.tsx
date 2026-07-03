import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { BookOpen, FileWarning, GraduationCap, School, Users } from 'lucide-react'
import { EmptyState, ErrorState, MetricCard, PageHeader, SkeletonCard, StatusBadge } from '../components/foundation'
import { api } from '../core/api'
import { Card } from '../layout/ui'
import { ChartCard, ResponsiveChart, arrayValue, getId, numberValue, textValue, tooltip } from './phase2-utils'

type DashboardRecord = Record<string, unknown>

function scopedItems(data: DashboardRecord, key: string) {
  return arrayValue<DashboardRecord>(data[key])
}

export function AdminDashboardPage() {
  const query = useQuery({ queryKey: ['dash', 'admin'], queryFn: api.dashboardAdmin })

  if (query.isLoading) return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
  if (query.isError || !query.data) return <ErrorState title="Không thể tải bảng điều khiển admin" onRetry={() => void query.refetch()} />

  const data = query.data as DashboardRecord
  const needGrading = scopedItems(data, 'needGradingByClass').map((item, index) => ({ name: textValue(item.className ?? item.name, `Lớp ${index + 1}`), value: numberValue(item.needGrading ?? item.count ?? item.value) }))
  const dueSoon = scopedItems(data, 'assignmentsDueSoon')
  const tasks = scopedItems(data, 'todayTasks')

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="CLASS ADMIN · scoped dashboard"
        title="Bảng điều khiển quản trị lớp"
        description="Chỉ hiển thị dữ liệu và thao tác trong phạm vi lớp được phân quyền. Không có action global-only."
        actions={<><Link className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white" to="/admin/classes">Lớp được giao</Link><Link className="inline-flex items-center justify-center rounded-2xl border border-sky-200 bg-white px-4 py-2 text-sm font-bold text-slate-700" to="/admin/grading">Chấm bài</Link></>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Lớp được giao" value={numberValue(data.assignedClassCount)} icon={<School size={20} />} tone="indigo" />
        <MetricCard label="Học viên phụ trách" value={numberValue(data.studentCount)} icon={<Users size={20} />} tone="sky" />
        <MetricCard label="Cần chấm hôm nay" value={numberValue(data.todayNeedGradingCount)} icon={<GraduationCap size={20} />} tone="amber" />
        <MetricCard label="Sắp đến hạn" value={numberValue(data.dueSoonAssignmentCount)} icon={<BookOpen size={20} />} tone="violet" />
        <MetricCard label="Thiếu bài nộp" value={numberValue(data.missingSubmissionCount)} icon={<FileWarning size={20} />} tone="rose" />
        <MetricCard label="Tỷ lệ nộp" value={`${Math.round(numberValue(data.submissionRate))}%`} tone="emerald" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <ChartCard title="Queue cần chấm theo lớp" description="Scoped theo lớp admin được giao" empty={needGrading.length === 0}>
          <ResponsiveChart><BarChart data={needGrading}>{tooltip}<CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" /><YAxis /><Bar dataKey="value" name="Cần chấm" fill="#f59e0b" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveChart>
        </ChartCard>
        <Card className="rounded-3xl">
          <h2 className="font-black text-slate-950">Việc hôm nay</h2>
          <div className="mt-3 divide-y divide-sky-50">
            {tasks.map((item, index) => <div key={getId(item, `task-${index}`)} className="py-3"><p className="font-bold text-slate-900">{textValue(item.title, 'Tác vụ')}</p><p className="mt-1 text-sm text-slate-500">{textValue(item.description, 'Cần xử lý trong phạm vi lớp được giao.')}</p></div>)}
            {tasks.length === 0 && <EmptyState title="Không có việc gấp" description="Các lớp được giao đang ổn định." />}
          </div>
        </Card>
      </div>

      <Card className="rounded-3xl">
        <h2 className="font-black text-slate-950">Bài tập sắp đến hạn</h2>
        <div className="mt-3 divide-y divide-sky-50">
          {dueSoon.map((item, index) => <div key={getId(item, `due-${index}`)} className="flex items-start justify-between gap-3 py-3"><div><p className="font-bold text-slate-900">{textValue(item.title ?? item.assignmentTitle, 'Bài tập')}</p><p className="mt-1 text-sm text-slate-500">{textValue(item.className, 'Lớp được giao')}</p></div>{typeof item.status === 'string' && <StatusBadge value={item.status} />}</div>)}
          {dueSoon.length === 0 && <EmptyState title="Không có deadline gần" description="Không có bài tập sắp đến hạn trong phạm vi admin." />}
        </div>
      </Card>
    </div>
  )
}

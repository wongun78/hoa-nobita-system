import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, XAxis, YAxis } from 'recharts'
import { BookOpen, CheckCircle2, FileText, GraduationCap, MessageSquare, School, Sparkles, Users } from 'lucide-react'
import { EmptyState, ErrorState, MetricCard, PageHeader, RiskBadge, SkeletonCard, StatusBadge } from '../components/foundation'
import { api } from '../core/api'
import { Card } from '../layout/ui'
import { ChartCard, ResponsiveChart, arrayValue, getId, numberValue, textValue, tooltip } from './phase2-utils'

type DashboardRecord = Record<string, unknown>

function chartData(data: DashboardRecord, key: string) {
  return arrayValue<DashboardRecord>(data[key]).map((item, index) => ({
    name: textValue(item.name ?? item.label ?? item.className ?? item.status ?? item.bucket, `Mục ${index + 1}`),
    value: numberValue(item.value ?? item.count ?? item.total ?? item.rate ?? item.averageScore),
    submitted: numberValue(item.submitted ?? item.submittedCount),
    missing: numberValue(item.missing ?? item.missingCount),
    needGrading: numberValue(item.needGrading ?? item.needGradingCount),
    average: numberValue(item.average ?? item.averageScore ?? item.score),
  }))
}

function InsightList({ title, items, empty }: Readonly<{ title: string; items: DashboardRecord[]; empty: string }>) {
  return (
    <Card className="rounded-3xl">
      <h2 className="text-base font-black text-slate-950">{title}</h2>
      <div className="mt-3 divide-y divide-sky-50">
        {items.map((item, index) => (
          <div key={getId(item, `${title}-${index}`)} className="py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold text-slate-900">{textValue(item.title ?? item.className ?? item.studentName ?? item.message, 'Mục cần chú ý')}</p>
                <p className="mt-1 text-sm text-slate-500">{textValue(item.description ?? item.reason ?? item.detail ?? item.subtitle, 'Theo dõi thêm trong ngày hôm nay.')}</p>
              </div>
              {typeof item.riskLevel === 'string' && <RiskBadge risk={item.riskLevel as never} />}
              {typeof item.status === 'string' && <StatusBadge value={item.status} />}
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="py-6"><EmptyState title={empty} description="Không có cảnh báo quan trọng ở thời điểm hiện tại." /></div>}
      </div>
    </Card>
  )
}

export function TeacherDashboardPage() {
  const query = useQuery({ queryKey: ['dash', 'teacher'], queryFn: api.dashboardTeacher })

  if (query.isLoading) return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
  if (query.isError || !query.data) return <ErrorState title="Không thể tải bảng điều khiển giáo viên" onRetry={() => void query.refetch()} />

  const data = query.data as DashboardRecord
  const charts = data.charts as DashboardRecord ?? {}
  const kpi = data.kpi as DashboardRecord ?? {}
  const kpiAssignments = kpi.assignments as DashboardRecord ?? {}
  const kpiSubmissions = kpi.submissions as DashboardRecord ?? {}
  const kpiMaterials = kpi.materials as DashboardRecord ?? {}
  const kpiNotifications = kpi.notifications as DashboardRecord ?? {}
  const kpiGrading = kpi.grading as DashboardRecord ?? {}

  const classStatus = chartData(charts, 'classStatusChart')
  const submissionRate = chartData(charts, 'submissionRateByClass')
  const needGradingChart = chartData(charts, 'needGradingByClass')
  const averageScore = chartData(charts, 'averageScoreByClass')
  const gradeDistribution = chartData(charts, 'gradeDistribution')
  const workflow = chartData(charts, 'assignmentWorkflow')
  const todayTasks = arrayValue<DashboardRecord>(data.todayTasks)
  const classHealth = arrayValue<DashboardRecord>(data.classHealth)
  const riskStudents = arrayValue<DashboardRecord>(data.riskStudents)
  const dueSoon = arrayValue<DashboardRecord>(data.assignmentsDueSoon)
  const recentActivity = arrayValue<DashboardRecord>(data.recentActivity)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="HOA NOBITA · 선생님"
        title={`Chào ${textValue(data.greetingName, 'Anh Hoà')}, hôm nay lớp học đang vận hành thế nào?`}
        description="Bảng điều khiển tập trung cho giáo viên: lớp học, bài tập, chấm điểm, rủi ro học viên."
        actions={<><Link className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white" to="/teacher/classes">Quản lý lớp</Link><Link className="inline-flex items-center justify-center rounded-2xl border border-sky-200 bg-white px-4 py-2 text-sm font-bold text-slate-700" to="/teacher/grading">Mở Grading Center</Link></>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Lớp hoạt động" value={numberValue(data.activeClassCount)} icon={<School size={20} />} tone="indigo" />
        <MetricCard label="Học viên" value={numberValue(data.activeStudentCount)} icon={<Users size={20} />} tone="sky" />
        <MetricCard label="Bài tập" value={numberValue(kpiAssignments.total)} icon={<BookOpen size={20} />} tone="violet" />
        <MetricCard label="Bài nộp" value={numberValue(kpiSubmissions.submitted)} icon={<FileText size={20} />} tone="emerald" />
        <MetricCard label="Cần chấm" value={numberValue(data.needGradingCount)} icon={<GraduationCap size={20} />} tone="amber" />
        <MetricCard label="Tài liệu" value={numberValue(kpiMaterials.total)} icon={<Sparkles size={20} />} tone="rose" />
        <MetricCard label="Thông báo (7 ngày)" value={numberValue(kpiNotifications.sentLast7Days)} icon={<MessageSquare size={20} />} tone="sky" />
        <MetricCard label="Tỷ lệ chấm đạt" value={`${Math.round(numberValue(kpiGrading.passRate))}%`} icon={<CheckCircle2 size={20} />} tone="emerald" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Trạng thái lớp" description="Phân bổ lớp theo trạng thái" empty={classStatus.length === 0}>
          <ResponsiveChart><PieChart>{tooltip}<Pie data={classStatus} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}>{classStatus.map((_, i) => <Cell key={i} fill={['#6366f1', '#38bdf8', '#f9a8d4', '#34d399'][i % 4]} />)}</Pie></PieChart></ResponsiveChart>
        </ChartCard>
        <ChartCard title="Tỷ lệ nộp theo lớp" description="Đã nộp so với chưa nộp" empty={submissionRate.length === 0}>
          <ResponsiveChart><BarChart data={submissionRate}>{tooltip}<CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" /><YAxis /><Bar dataKey="submitted" fill="#38bdf8" name="Đã nộp" radius={[8, 8, 0, 0]} /><Bar dataKey="missing" fill="#fda4af" name="Thiếu" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveChart>
        </ChartCard>
        <ChartCard title="Cần chấm theo lớp" description="Ưu tiên cần chấm" empty={needGradingChart.length === 0}>
          <ResponsiveChart><BarChart data={needGradingChart}>{tooltip}<CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" /><YAxis /><Bar dataKey="value" fill="#f59e0b" name="Cần chấm" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveChart>
        </ChartCard>
        <ChartCard title="Điểm trung bình theo lớp" description="Theo dõi chất lượng học tập" empty={averageScore.length === 0}>
          <ResponsiveChart><LineChart data={averageScore}>{tooltip}<CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" /><YAxis /><Line dataKey="average" stroke="#6366f1" strokeWidth={3} name="Điểm TB" /></LineChart></ResponsiveChart>
        </ChartCard>
        <ChartCard title="Phân phối điểm" description="Phân phối điểm" empty={gradeDistribution.length === 0}>
          <ResponsiveChart><AreaChart data={gradeDistribution}>{tooltip}<CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" /><YAxis /><Area dataKey="value" fill="#c7d2fe" stroke="#6366f1" name="Số bài" /></AreaChart></ResponsiveChart>
        </ChartCard>
        <ChartCard title="Luồng bài tập" description="Nháp → Đã đăng → Đã đóng" empty={workflow.length === 0}>
          <ResponsiveChart><BarChart data={workflow}>{tooltip}<CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" /><YAxis /><Bar dataKey="value" fill="#ec4899" name="Số lượng" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveChart>
        </ChartCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <InsightList title="Việc hôm nay" items={todayTasks} empty="Hôm nay không có việc gấp" />
        <InsightList title="Sức khỏe lớp học" items={classHealth} empty="Các lớp đang ổn định" />
        <InsightList title="Học viên rủi ro" items={riskStudents} empty="Không có học viên rủi ro cao" />
        <InsightList title="Bài tập sắp đến hạn" items={dueSoon} empty="Không có deadline gần" />
        <div className="xl:col-span-2"><InsightList title="Hoạt động gần đây" items={recentActivity} empty="Chưa có hoạt động mới" /></div>
      </div>
    </div>
  )
}

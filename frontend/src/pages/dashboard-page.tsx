import { useAuth } from '../features/auth/use-auth'
import { useTeacherDashboard, useAdminDashboard, useStudentDashboard } from '../features/dashboard/hooks'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { AlertCircle, Clock, Users, BookOpen, TrendingUp, Award } from 'lucide-react'
import { RecentActivityTimeline } from '../features/activity/components/recent-activity-timeline'

const COLORS = ['#3B82F6', '#60A5FA', '#93C5FD', '#DBEAFE']

export function DashboardPage() {
  const { user, hasRole } = useAuth()

  const isTeacher = hasRole('TEACHER_OWNER')
  const isAdmin = hasRole('CLASS_ADMIN')
  const isStudent = hasRole('STUDENT')

  const teacherQ = useTeacherDashboard()
  const adminQ = useAdminDashboard()
  const studentQ = useStudentDashboard()

  if (isTeacher) {
    const d = teacherQ.data
    if (teacherQ.isLoading) return <div className="p-8 text-center text-slate-500">Đang tải dashboard...</div>
    if (!d) return <div className="p-8 text-center text-red-500">Không thể tải dashboard</div>

    return (
      <div className="space-y-8">
        {/* Hero */}
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] rounded-2xl p-8 text-white">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm opacity-80">{d.currentDate}</div>
              <h1 className="text-4xl font-bold mt-2">Chào {d.greetingName}, hôm nay có {d.todayActionCount} việc cần xử lý</h1>
              <div className="mt-4 flex gap-6 text-sm">
                <div><span className="opacity-70">Lớp đang hoạt động:</span> <span className="font-semibold">{d.activeClassCount}</span></div>
                <div><span className="opacity-70">Học viên đang học:</span> <span className="font-semibold">{d.activeStudentCount}</span></div>
                <div><span className="opacity-70">Cần chấm:</span> <span className="font-semibold">{d.needGradingCount}</span></div>
                <div><span className="opacity-70">Quá hạn/chưa nộp:</span> <span className="font-semibold">{d.overdueMissingSubmissionCount}</span></div>
              </div>
            </div>
            <div className="flex gap-2">
              <Link to="/classes"><Button className="bg-white text-[#1E3A8A] hover:bg-white/90">Tạo lớp</Button></Link>
              <Link to="/assignments"><Button className="bg-white text-[#1E3A8A] hover:bg-white/90">Tạo bài tập</Button></Link>
            </div>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <KpiCard icon={<BookOpen className="w-4 h-4" />} label="Lớp học" value={d.kpi.classes.total} sub={`${d.kpi.classes.active} đang hoạt động`} />
          <KpiCard icon={<Users className="w-4 h-4" />} label="Học viên" value={d.kpi.students.total} sub={`${d.kpi.students.newLast7Days} mới trong 7 ngày`} />
          <KpiCard icon={<Clock className="w-4 h-4" />} label="Bài tập" value={d.kpi.assignments.total} sub={`${d.kpi.assignments.dueSoon48h} sắp hạn`} />
          <KpiCard icon={<AlertCircle className="w-4 h-4" />} label="Cần chấm" value={d.kpi.submissions.needGrading} sub={`${d.kpi.submissions.late} nộp trễ`} />
          <KpiCard icon={<Award className="w-4 h-4" />} label="Điểm TB" value={d.kpi.grading.averageScore.toFixed(1)} sub={`${d.kpi.grading.passRate}% đạt yêu cầu`} />
          <KpiCard icon={<BookOpen className="w-4 h-4" />} label="Tài liệu" value={d.kpi.materials.total} sub={`${d.kpi.materials.hidden} ẩn`} />
          <KpiCard icon={<TrendingUp className="w-4 h-4" />} label="Thông báo" value={d.kpi.notifications.sentLast7Days} sub={`${d.kpi.notifications.globalCount} toàn hệ thống`} />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <div className="font-semibold mb-4">Trạng thái lớp học</div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={d.charts.classStatusChart} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} label>
                  {d.charts.classStatusChart.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6">
            <div className="font-semibold mb-4">Tỷ lệ nộp bài theo lớp</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={d.charts.submissionRateByClass}>
                <XAxis dataKey="className" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="submitted" fill="#3B82F6" name="Đã nộp" />
                <Bar dataKey="missing" fill="#F59E0B" name="Chưa nộp" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Today Tasks */}
        <Card className="p-6">
          <div className="font-semibold mb-4 flex items-center gap-2"><AlertCircle className="w-5 h-5 text-[#EF4444]" /> Việc cần xử lý hôm nay</div>
          {d.todayTasks.length === 0 && <div className="text-slate-500">Không có việc cần xử lý.</div>}
          <div className="space-y-3">
            {d.todayTasks.map(task => (
              <div key={task.id} className="flex items-center justify-between border rounded-lg p-4">
                <div>
                  <div className="font-medium">{task.title}</div>
                  <div className="text-sm text-slate-500">{task.description}</div>
                </div>
                <Link to={task.targetUrl}><Button className="text-sm px-3 py-1">{task.ctaLabel}</Button></Link>
              </div>
            ))}
          </div>
        </Card>

        {/* Class Health */}
        <Card className="p-6">
          <div className="font-semibold mb-4">Lớp cần chú ý</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-slate-500"><th className="py-2">Lớp</th><th>Học viên</th><th>Admin</th><th>Bài mở</th><th>Tỷ lệ nộp</th><th>Cần chấm</th><th>Điểm TB</th><th></th></tr></thead>
              <tbody>
                {d.classHealth.map(c => (
                  <tr key={c.classId} className="border-b hover:bg-slate-50">
                    <td className="py-3 font-medium"><Link to={c.actionUrl} className="text-[#3B82F6] hover:underline">{c.className}</Link></td>
                    <td>{c.studentCount}</td>
                    <td className="text-xs text-slate-500">{c.adminNames.join(', ')}</td>
                    <td>{c.openAssignmentCount}</td>
                    <td><Badge variant={c.submissionRate >= 80 ? 'default' : c.submissionRate >= 60 ? 'secondary' : 'destructive'}>{c.submissionRate}%</Badge></td>
                    <td>{c.needGradingCount}</td>
                    <td>{c.averageScore.toFixed(1)}</td>
                    <td><Link to={c.actionUrl}><Button size="sm" variant="outline">Xem</Button></Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Due Soon + Risk Students */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <div className="font-semibold mb-4">Bài tập sắp đến hạn</div>
            {d.assignmentsDueSoon.length === 0 && <div className="text-slate-500 text-sm">Không có bài tập sắp hạn.</div>}
            <div className="space-y-2">
              {d.assignmentsDueSoon.map(a => (
                <div key={a.assignmentId} className="flex justify-between items-center border rounded p-3 text-sm">
                  <div>
                    <div className="font-medium">{a.title}</div>
                    <div className="text-xs text-slate-500">{a.className} • Hạn: {new Date(a.deadline).toLocaleDateString('vi-VN')}</div>
                  </div>
                  <Link to={a.actionUrl}><Button className="text-sm px-3 py-1" variant="outline">Chấm</Button></Link>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <div className="font-semibold mb-4">Học viên cần hỗ trợ</div>
            {d.riskStudents.length === 0 && <div className="text-slate-500 text-sm">Không có học viên rủi ro.</div>}
            <div className="space-y-2">
              {d.riskStudents.map(r => (
                <div key={r.studentId} className="flex justify-between items-center border rounded p-3 text-sm">
                  <div>
                    <div className="font-medium">{r.fullName}</div>
                    <div className="text-xs text-slate-500">{r.className} • {r.issue} • Tỷ lệ: {r.submissionRate}%</div>
                  </div>
                  <Link to={r.actionUrl}><Button className="text-sm px-3 py-1" variant="outline">Xem</Button></Link>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="p-6">
          <div className="font-semibold mb-4">Hoạt động gần đây</div>
          <RecentActivityTimeline activities={d.recentActivity} />
        </Card>
      </div>
    )
  }

  if (isAdmin) {
    const d = adminQ.data
    if (adminQ.isLoading) return <div className="p-8 text-center text-slate-500">Đang tải...</div>
    if (!d) return <div className="p-8 text-center text-red-500">Lỗi tải dashboard</div>

    return (
      <div className="space-y-8">
        <div className="bg-[#1E3A8A] text-white rounded-2xl p-8">
          <h1 className="text-3xl font-bold">Bạn đang quản lý {d.assignedClassCount} lớp</h1>
          <div className="mt-2 text-sm opacity-80">Hôm nay: {d.todayNeedGradingCount} cần chấm • {d.dueSoonAssignmentCount} sắp hạn • {d.missingSubmissionCount} chưa nộp</div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Lớp phụ trách" value={d.kpi.classes.assignedTotal} sub={`${d.kpi.classes.active} đang hoạt động`} />
          <KpiCard label="Học viên" value={d.kpi.students.totalInAssignedClasses} sub={`${d.kpi.students.suspended} tạm dừng`} />
          <KpiCard label="Bài tập" value={d.kpi.assignments.published} sub={`${d.kpi.assignments.dueSoon48h} sắp hạn`} />
          <KpiCard label="Cần chấm" value={d.kpi.submissions.needGrading} sub={`${d.kpi.submissions.late} nộp trễ`} />
        </div>

          <Card className="p-6">
          <div className="font-semibold mb-4">Việc cần xử lý (lớp được phân công)</div>
          {d.todayTasks.length === 0 && <div className="text-slate-500">Không có việc cần xử lý.</div>}
          <div className="space-y-2">
            {d.todayTasks.map(t => (
              <div key={t.id} className="flex justify-between border rounded p-4">
                <div><div className="font-medium">{t.title}</div><div className="text-sm text-slate-500">{t.description}</div></div>
                <Link to={t.targetUrl}><Button className="text-sm px-3 py-1">{t.ctaLabel}</Button></Link>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-6">
          <div className="font-semibold mb-4">Hoạt động gần đây</div>
          <RecentActivityTimeline activities={d.recentActivity} />
        </Card>
      </div>
    )
  }

  if (isStudent) {
    const d = studentQ.data
    if (studentQ.isLoading) return <div className="p-8 text-center text-slate-500">Đang tải...</div>
    if (!d) return <div className="p-8 text-center text-red-500">Lỗi tải dashboard</div>

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-[#1E3A8A]">Dashboard học viên</h1>
          <p className="text-slate-600">Xin chào, {user?.fullName}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Lớp tham gia" value={d.joinedClassCount} />
          <KpiCard label="Bài tập mở" value={d.openAssignmentCount} sub={`${d.dueSoonCount} sắp hạn`} />
          <KpiCard label="Đã nộp" value={d.submittedCount} sub={`${d.gradedCount} đã chấm`} />
          <KpiCard label="Cần nộp lại" value={d.resubmitRequestedCount} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <div className="font-semibold mb-4">Bài tập sắp đến hạn</div>
            {d.upcomingAssignments.length === 0 && <div className="text-slate-500 text-sm">Không có bài tập sắp hạn.</div>}
            <div className="space-y-2">
              {d.upcomingAssignments.map(a => (
                <Link key={a.assignmentId} to={`/assignments/${a.assignmentId}`} className="block border rounded p-3 hover:bg-slate-50">
                  <div className="font-medium">{a.title}</div>
                  <div className="text-xs text-slate-500">{a.className} • Hạn: {new Date(a.deadline).toLocaleDateString('vi-VN')}</div>
                </Link>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <div className="font-semibold mb-4">Phản hồi gần nhất</div>
            {d.latestFeedback ? (
              <div className="border rounded p-4">
                <div className="font-medium">{d.latestFeedback.assignmentTitle}</div>
                <div className="text-sm mt-1">Điểm: <span className="font-semibold text-[#16A34A]">{d.latestFeedback.score}</span></div>
                <div className="text-sm text-slate-600 mt-2">{d.latestFeedback.feedback}</div>
              </div>
            ) : <div className="text-slate-500 text-sm">Chưa có phản hồi.</div>}
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="p-6">
          <div className="font-semibold mb-4">Hoạt động gần đây</div>
          <RecentActivityTimeline activities={d.recentActivity} />
        </Card>
      </div>
    )
  }

  return <div>Không xác định vai trò.</div>
}

function KpiCard({ icon, label, value, sub }: { icon?: React.ReactNode; label: string; value: number | string; sub?: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-slate-500 text-sm">{icon}{label}</div>
      <div className="mt-2 text-3xl font-semibold text-[#1E3A8A]">{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </Card>
  )
}

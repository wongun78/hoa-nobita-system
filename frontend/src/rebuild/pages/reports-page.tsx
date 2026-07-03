import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Activity, BarChart3, BookOpenCheck, Download, GraduationCap, Percent, Users } from 'lucide-react'
import { api } from '../core/api'
import { EmptyState, ErrorState, FilterBar, MetricCard, PageHeader, SkeletonCard } from '../components/foundation'
import { Button, Card, FieldLabel } from '../layout/ui'
import { useNewAuth } from '../auth/use-auth'
import { asPage, numberValue } from './phase2-utils'
import type { ClassItem, RoleName } from '../core/types'

type ClassPerformance = { classId: string; className: string; studentCount: number; assignmentCount: number; averageScore: number; submissionRate: number }
type StudentPerformance = { userId: string; fullName: string; email?: string | null; submissionCount: number; averageScore: number }
type AssignmentPerformance = { assignmentId: string; title: string; submissionCount: number; averageScore: number; passRate: number }
type SystemReport = { totalUsers: number; totalClasses: number; totalAssignments: number; totalSubmissions: number; averageScore: number; classPerformances: ClassPerformance[]; topStudents: StudentPerformance[] }
type ClassReport = { classId: string; className: string; totalStudents: number; totalAssignments: number; averageScore: number; submissionRate: number; studentPerformances: StudentPerformance[]; assignmentPerformances: AssignmentPerformance[] }
type ClassStats = { totalStudents: number; totalAssignments: number; totalSubmissions: number; missingSubmissions: number; lateSubmissions: number; gradedSubmissions: number; needGrading: number; submissionRate: number; averageScore: number }
type AttendanceSummary = { classId: string; totalLessons: number; attendanceRate: number; studentAttendance: unknown[] }

function primaryRole(roles?: RoleName[]) {
  if (roles?.includes('TEACHER_OWNER')) return 'TEACHER_OWNER'
  if (roles?.includes('CLASS_ADMIN')) return 'CLASS_ADMIN'
  return undefined
}

function pct(value: unknown) {
  return `${numberValue(value).toFixed(1)}%`
}

function score(value: unknown) {
  return numberValue(value).toFixed(1)
}

function chartData(report?: ClassReport) {
  return (report?.assignmentPerformances ?? []).slice(0, 12).map((item) => ({
    name: item.title.length > 16 ? `${item.title.slice(0, 16)}…` : item.title,
    submissions: item.submissionCount,
    averageScore: Number(item.averageScore.toFixed(1)),
    passRate: Number(item.passRate.toFixed(1)),
  }))
}

function studentRows(report?: ClassReport) {
  return [...(report?.studentPerformances ?? [])].sort((a, b) => b.averageScore - a.averageScore).slice(0, 8)
}

function ReportChart({ title, description, children, empty }: Readonly<{ title: string; description: string; children: React.ReactNode; empty: boolean }>) {
  return (
    <Card className="min-h-[320px] rounded-3xl">
      <div className="mb-4">
        <h2 className="text-base font-black text-slate-950">{title}</h2>
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      </div>
      {empty ? <EmptyState title="Chưa có dữ liệu biểu đồ" description="Biểu đồ sẽ hiển thị khi lớp có assignment/submission/grade." /> : <div className="h-64">{children}</div>}
    </Card>
  )
}

function AssignmentCards({ report }: Readonly<{ report?: ClassReport }>) {
  const assignments = report?.assignmentPerformances ?? []
  if (!assignments.length) return <EmptyState title="Chưa có tiến độ assignment" description="Lớp chưa có bài tập hoặc chưa có bài nộp để tổng hợp." />

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {assignments.map((item) => (
        <Card key={item.assignmentId} className="rounded-3xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h3 className="line-clamp-2 font-black text-slate-950">{item.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{item.submissionCount} bài nộp · điểm TB {score(item.averageScore)}</p>
            </div>
            <div className="flex min-h-11 items-center rounded-2xl bg-emerald-50 px-3 text-sm font-black text-emerald-700">{pct(item.passRate)} đạt</div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400" style={{ width: `${Math.min(Math.max(item.passRate, 0), 100)}%` }} />
          </div>
        </Card>
      ))}
    </div>
  )
}

export function ReportsPage() {
  const { user } = useNewAuth()
  const role = primaryRole(user?.roles)
  const isTeacherOwner = role === 'TEACHER_OWNER'
  const [classId, setClassId] = useState('')
  const [exporting, setExporting] = useState<'system' | 'class' | null>(null)
  const [exportError, setExportError] = useState('')

  const classesQuery = useQuery({ queryKey: ['classes', 'reports'], queryFn: () => api.classesPage({ page: 0, size: 100 }), staleTime: 60_000 })
  const classesPage = asPage(classesQuery.data, 0, 100)
  const systemQuery = useQuery({ queryKey: ['reports', 'system'], queryFn: () => api.reportSystem() as Promise<SystemReport>, enabled: isTeacherOwner })
  const classReportQuery = useQuery({ queryKey: ['reports', 'class', classId], queryFn: () => api.reportClass(classId) as Promise<ClassReport>, enabled: Boolean(classId) })
  const classStatsQuery = useQuery({ queryKey: ['classes', classId, 'stats', 'reports'], queryFn: () => api.classStats(classId) as Promise<ClassStats>, enabled: Boolean(classId) })
  const attendanceQuery = useQuery({ queryKey: ['attendance-summary', classId, 'reports'], queryFn: () => api.attendanceSummary(classId) as Promise<AttendanceSummary>, enabled: Boolean(classId) })

  useEffect(() => {
    if (!classId && classesPage.items.length) setClassId(classesPage.items[0].id)
  }, [classId, classesPage.items])

  const classReport = classReportQuery.data
  const classStats = classStatsQuery.data
  const attendance = attendanceQuery.data
  const assignmentChartData = useMemo(() => chartData(classReport), [classReport])
  const topStudents = useMemo(() => studentRows(classReport), [classReport])
  const selectedClass = classesPage.items.find((item: ClassItem) => item.id === classId)
  const classPerformanceRows = systemQuery.data?.classPerformances ?? []
  const loadingClassReport = classReportQuery.isLoading || classStatsQuery.isLoading || attendanceQuery.isLoading
  const classReportError = classReportQuery.isError || classStatsQuery.isError || attendanceQuery.isError

  const exportSystemCsv = async () => {
    setExportError('')
    setExporting('system')
    try {
      await api.downloadSystemReportCsv()
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Không thể xuất CSV hệ thống.')
    } finally {
      setExporting(null)
    }
  }

  const exportClassCsv = async () => {
    if (!classId) return
    setExportError('')
    setExporting('class')
    try {
      await api.downloadClassReportCsv(classId)
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Không thể xuất CSV lớp.')
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="space-y-5 pb-20 md:pb-0">
      <PageHeader
        eyebrow="리포트 센터"
        title="Báo cáo học tập"
        description="Tổng hợp báo cáo theo lớp từ backend Reports API, bổ sung class stats và attendance summary theo đúng quyền truy cập lớp."
        actions={(
          <>
            {isTeacherOwner && <Button type="button" variant="secondary" className="min-h-11" disabled={exporting === 'system'} onClick={() => void exportSystemCsv()}><Download size={16} />CSV hệ thống</Button>}
            <Button type="button" className="min-h-11" disabled={!classId || exporting === 'class'} onClick={() => void exportClassCsv()}><Download size={16} />CSV lớp</Button>
          </>
        )}
      />

      <FilterBar>
        <div className="min-w-0 flex-1">
          <FieldLabel htmlFor="report-class">Lớp báo cáo</FieldLabel>
          <select id="report-class" className="min-h-11 w-full rounded-2xl border border-sky-100 bg-white px-4 text-sm font-bold text-slate-600 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100" value={classId} onChange={(event) => setClassId(event.target.value)}>
            <option value="">Chọn lớp</option>
            {classesPage.items.map((item: ClassItem) => <option key={item.id} value={item.id}>{item.name} · {item.code}</option>)}
          </select>
        </div>
        <div className="flex items-end">
          <Button type="button" variant="secondary" className="min-h-11" onClick={() => {
            void classesQuery.refetch()
            if (isTeacherOwner) void systemQuery.refetch()
            if (classId) {
              void classReportQuery.refetch()
              void classStatsQuery.refetch()
              void attendanceQuery.refetch()
            }
          }}>Làm mới</Button>
        </div>
      </FilterBar>

      {exportError && <ErrorState title="Không xuất được CSV" description={exportError} />}
      {classesQuery.isLoading && <SkeletonCard lines={3} />}
      {classesQuery.isError && <ErrorState title="Không tải được danh sách lớp" description="Vui lòng kiểm tra quyền quản trị lớp và thử lại." onRetry={() => classesQuery.refetch()} />}
      {!classesQuery.isLoading && !classesQuery.isError && !classesPage.items.length && <EmptyState title="Chưa có lớp để báo cáo" description="CLASS_ADMIN chỉ thấy lớp được gán; Teacher Owner thấy toàn bộ lớp active." />}

      {isTeacherOwner && systemQuery.data && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard label="Người dùng" value={systemQuery.data.totalUsers} hint="Toàn hệ thống" icon={<Users size={20} />} tone="indigo" />
          <MetricCard label="Lớp học" value={systemQuery.data.totalClasses} hint="Active classes" icon={<GraduationCap size={20} />} tone="sky" />
          <MetricCard label="Bài tập" value={systemQuery.data.totalAssignments} hint="Assignments" icon={<BookOpenCheck size={20} />} tone="amber" />
          <MetricCard label="Bài nộp" value={systemQuery.data.totalSubmissions} hint="Submissions" icon={<Activity size={20} />} tone="emerald" />
          <MetricCard label="Điểm TB" value={score(systemQuery.data.averageScore)} hint="Global average" icon={<BarChart3 size={20} />} tone="violet" />
        </div>
      )}
      {isTeacherOwner && systemQuery.isLoading && <SkeletonCard lines={2} />}
      {isTeacherOwner && systemQuery.isError && <ErrorState title="Không tải được báo cáo hệ thống" description="Endpoint /reports/system chỉ dành cho Teacher Owner." onRetry={() => systemQuery.refetch()} />}

      {isTeacherOwner && classPerformanceRows.length > 0 && (
        <ReportChart title="Hiệu suất các lớp" description="So sánh sĩ số, điểm trung bình và tỷ lệ nộp bài theo lớp." empty={!classPerformanceRows.length}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={classPerformanceRows.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0f2fe" />
              <XAxis dataKey="className" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="studentCount" name="Sĩ số" fill="#38bdf8" radius={[8, 8, 0, 0]} />
              <Bar dataKey="assignmentCount" name="Bài tập" fill="#6366f1" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ReportChart>
      )}

      {classId && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard label="Lớp" value={selectedClass?.code ?? classReport?.className ?? '-'} hint={classReport?.className ?? selectedClass?.name ?? 'Đang chọn'} icon={<GraduationCap size={20} />} tone="indigo" />
            <MetricCard label="Sĩ số" value={classStats?.totalStudents ?? classReport?.totalStudents ?? 0} hint="Học viên active" icon={<Users size={20} />} tone="sky" />
            <MetricCard label="Tiến độ nộp" value={pct(classStats?.submissionRate ?? classReport?.submissionRate)} hint={`${classStats?.totalSubmissions ?? 0} nộp · ${classStats?.missingSubmissions ?? 0} thiếu`} icon={<BookOpenCheck size={20} />} tone="emerald" />
            <MetricCard label="Điểm TB" value={score(classStats?.averageScore ?? classReport?.averageScore)} hint="Theo grade đã có" icon={<BarChart3 size={20} />} tone="violet" />
            <MetricCard label="Chuyên cần" value={pct(attendance?.attendanceRate)} hint={`${attendance?.totalLessons ?? 0} buổi học`} icon={<Percent size={20} />} tone="amber" />
          </div>

          {loadingClassReport && <div className="space-y-3"><SkeletonCard lines={4} /><SkeletonCard lines={4} /></div>}
          {classReportError && <ErrorState title="Không tải được báo cáo lớp" description="Kiểm tra lớp được gán cho admin hoặc thử lại sau ít phút." onRetry={() => {
            void classReportQuery.refetch()
            void classStatsQuery.refetch()
            void attendanceQuery.refetch()
          }} />}

          {!loadingClassReport && !classReportError && classReport && (
            <div className="grid gap-5 xl:grid-cols-2">
              <ReportChart title="Tiến độ assignment" description="Số bài nộp và điểm trung bình theo từng assignment." empty={!assignmentChartData.length}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={assignmentChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0f2fe" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="submissions" name="Bài nộp" fill="#38bdf8" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="averageScore" name="Điểm TB" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ReportChart>

              <ReportChart title="Top học viên" description="Điểm trung bình và số bài nộp của học viên nổi bật." empty={!topStudents.length}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={topStudents.map((item) => ({ name: item.fullName, averageScore: Number(item.averageScore.toFixed(1)), submissions: item.submissionCount }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0f2fe" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="averageScore" name="Điểm TB" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="submissions" name="Bài nộp" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </ReportChart>
            </div>
          )}

          {!loadingClassReport && !classReportError && classReport && <AssignmentCards report={classReport} />}
        </>
      )}
    </div>
  )
}

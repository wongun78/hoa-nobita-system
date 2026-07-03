import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { Download, Save } from 'lucide-react'
import { useNewAuth } from '../auth/use-auth'
import { EmptyState, ErrorState, MetricCard, PageHeader, StatusBadge } from '../components/foundation'
import { api } from '../core/api'
import type { StudentMemberItem } from '../core/types'
import { Button, Card, Input } from '../layout/ui'
import { asPage, fmtDate } from './phase2-utils'

const tabs = ['Overview', 'Students', 'Lessons', 'Materials', 'Assignments', 'Submissions', 'Grading', 'Attendance', 'Activity', 'Notifications', 'Settings'] as const
type TabName = typeof tabs[number]

function StudentRow({ classId, student }: Readonly<{ classId: string; student: StudentMemberItem }>) {
  const qc = useQueryClient()
  const [code, setCode] = useState(student.studentCode ?? '')
  const save = useMutation({ mutationFn: () => api.updateClassStudentCode(classId, student.id, code), onSuccess: async () => qc.invalidateQueries({ queryKey: ['class', classId, 'students'] }) })
  return <tr className="border-b border-sky-50"><td className="px-3 py-3 font-bold">{student.fullName}<p className="text-xs font-normal text-slate-500">{student.email || '-'}</p></td><td className="px-3 py-3"><Input value={code} onChange={(e) => setCode(e.target.value)} /></td><td className="px-3 py-3"><StatusBadge value={student.status} /></td><td className="px-3 py-3 text-slate-500">{fmtDate(student.joinedAt)}</td><td className="px-3 py-3"><Button variant="secondary" disabled={save.isPending} onClick={() => save.mutate()}><Save size={14} /> Lưu code</Button></td></tr>
}

export function ClassDetailV2Page() {
  const { hasRole } = useNewAuth()
  const isTeacher = hasRole('TEACHER_OWNER')
  const isAdmin = hasRole('CLASS_ADMIN')
  const canOperate = isTeacher || isAdmin
  const { classId = '' } = useParams()
  const [tab, setTab] = useState<TabName>('Overview')
  const klass = useQuery({ queryKey: ['class', classId], queryFn: () => api.classById(classId), enabled: Boolean(classId) })
  const stats = useQuery({ queryKey: ['class', classId, 'stats'], queryFn: () => api.classStats(classId), enabled: Boolean(classId) })
  const students = useQuery({ queryKey: ['class', classId, 'students', 0], queryFn: () => api.listClassStudentsPage(classId, { page: 0, size: 100 }), enabled: Boolean(classId) })
  const lessons = useQuery({ queryKey: ['class', classId, 'lessons'], queryFn: () => api.lessonsByClassPage(classId, { page: 0, size: 20 }), enabled: Boolean(classId) })
  const materials = useQuery({ queryKey: ['class', classId, 'materials'], queryFn: () => api.materialsByClassPage(classId, { page: 0, size: 20 }), enabled: Boolean(classId) })
  const assignments = useQuery({ queryKey: ['class', classId, 'assignments'], queryFn: () => api.assignmentsPage({ classId, page: 0, size: 20 }), enabled: Boolean(classId) })
  const activity = useQuery({ queryKey: ['class', classId, 'activity'], queryFn: () => api.classActivityPage(classId, { page: 0, size: 20 }), enabled: Boolean(classId) })
  const studentsPage = asPage(students.data, 0, 100)
  const lessonsPage = asPage(lessons.data, 0, 20)
  const materialsPage = asPage(materials.data, 0, 20)
  const assignmentsPage = asPage(assignments.data, 0, 20)
  const activityPage = asPage(activity.data, 0, 20)
  const classHealth = useMemo(() => {
    const s = stats.data
    if (!s) return 'Đang cập nhật'
    if (s.needGrading > 10 || s.submissionRate < 60) return 'Cần chú ý'
    if (s.submissionRate >= 85) return 'Khỏe mạnh'
    return 'Ổn định'
  }, [stats.data])

  if (klass.isLoading) return <Card>Đang tải lớp học...</Card>
  if (klass.isError || !klass.data) return <ErrorState title="Không thể tải chi tiết lớp" onRetry={() => void klass.refetch()} />

  return <div className="space-y-5"><div className="sticky top-20 z-20 space-y-3"><PageHeader eyebrow={klass.data.code} title={klass.data.name} description={isAdmin ? 'Scoped view cho CLASS_ADMIN: ẩn action global-only như assign global admin/delete class/cross-class data.' : klass.data.description || 'Chi tiết vận hành lớp học'} actions={<><Button variant="secondary" onClick={() => api.downloadClassStudentsCsv(classId)}><Download size={16} /> Export students CSV</Button></>} /><div className="flex gap-2 overflow-x-auto rounded-3xl border border-sky-100 bg-white/90 p-2 shadow-sm">{tabs.map((item) => <button key={item} className={`whitespace-nowrap rounded-2xl px-3 py-2 text-sm font-bold ${tab === item ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-sky-50'}`} onClick={() => setTab(item)}>{item}</button>)}</div></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><MetricCard label="Học viên" value={stats.data?.totalStudents ?? klass.data.studentCount} /><MetricCard label="Bài tập" value={stats.data?.totalAssignments ?? '-'} /><MetricCard label="Tỷ lệ nộp" value={`${Math.round(stats.data?.submissionRate ?? 0)}%`} /><MetricCard label="Cần chấm" value={stats.data?.needGrading ?? '-'} /><MetricCard label="Health" value={classHealth} /></div>
    {tab === 'Overview' && <Card><h2 className="font-black text-slate-950">Overview</h2><p className="mt-2 text-sm text-slate-600">Giáo viên: {klass.data.teacherName}</p><p className="text-sm text-slate-600">Trạng thái: <StatusBadge value={klass.data.status} /></p></Card>}
    {tab === 'Students' && <Card><div className="mb-3 flex items-center justify-between"><h2 className="font-black">Students</h2><Button variant="secondary" onClick={() => api.downloadClassStudentsCsv(classId)}><Download size={16} /> CSV</Button></div><div className="overflow-auto"><table className="w-full min-w-[820px] text-sm"><thead><tr className="border-b border-sky-100 text-left text-slate-500"><th className="px-3 py-3">Học viên</th><th className="px-3 py-3">Student code</th><th className="px-3 py-3">Trạng thái</th><th className="px-3 py-3">Ngày vào</th><th className="px-3 py-3">Hành động</th></tr></thead><tbody>{studentsPage.items.map((student) => <StudentRow key={student.id} classId={classId} student={student} />)}</tbody></table></div>{studentsPage.items.length === 0 && <EmptyState title="Chưa có học viên" />}</Card>}
    {tab === 'Lessons' && <Card><h2 className="font-black">Lessons</h2><div className="mt-3 divide-y divide-sky-50">{lessonsPage.items.map((item) => <div key={item.id} className="py-3"><b>{item.title}</b><p className="text-xs text-slate-500">{item.status} · {fmtDate(item.lessonDate)}</p></div>)}{lessonsPage.items.length === 0 && <EmptyState title="Chưa có bài học" />}</div></Card>}
    {tab === 'Materials' && <Card><h2 className="font-black">Materials</h2><div className="mt-3 divide-y divide-sky-50">{materialsPage.items.map((item) => <div key={item.id} className="flex justify-between py-3"><div><b>{item.title}</b><p className="text-xs text-slate-500">{item.description || '-'}</p></div><StatusBadge value={item.visible ? 'PUBLISHED' : 'DRAFT'} /></div>)}{materialsPage.items.length === 0 && <EmptyState title="Chưa có tài liệu" />}</div></Card>}
    {tab === 'Assignments' && <Card><h2 className="font-black">Assignments</h2><div className="mt-3 divide-y divide-sky-50">{assignmentsPage.items.map((item) => <div key={item.id} className="flex justify-between py-3"><div><b>{item.title}</b><p className="text-xs text-slate-500">Hạn: {fmtDate(item.dueAt)}</p></div><StatusBadge value={item.status} /></div>)}{assignmentsPage.items.length === 0 && <EmptyState title="Chưa có bài tập" />}</div></Card>}
    {['Submissions', 'Grading', 'Attendance', 'Notifications', 'Settings'].includes(tab) && <Card><h2 className="font-black">{tab}</h2><p className="mt-2 text-sm text-slate-500">{canOperate ? 'Module đã có route chuyên biệt hoặc sẽ được mở rộng ở phase sau.' : 'Bạn chỉ có quyền xem nội dung phù hợp.'}</p></Card>}
    {tab === 'Activity' && <Card><h2 className="font-black">Activity</h2><div className="mt-3 divide-y divide-sky-50">{activityPage.items.map((item) => <div key={item.id} className="py-3"><b>{item.message}</b><p className="text-xs text-slate-500">{item.actorName} · {fmtDate(item.createdAt)}</p></div>)}{activityPage.items.length === 0 && <EmptyState title="Chưa có hoạt động" />}</div></Card>}
  </div>
}

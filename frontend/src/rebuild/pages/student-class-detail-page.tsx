import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { Bell, BookOpen, CalendarCheck2, ClipboardList, Download, ExternalLink, FileText, GraduationCap, LayoutDashboard, MessageSquareText } from 'lucide-react'
import { api } from '../core/api'
import { EmptyState, ErrorState, MetricCard, SkeletonCard, StatusBadge } from '../components/foundation'
import { Button, Card } from '../layout/ui'
import { fmtDate } from './phase2-utils'
import { useNewAuth } from '../auth/use-auth'
import type { AssignmentItem, AttendanceItem, LessonItem, MaterialItem, NotificationItem, SubmissionItem } from '../core/types'

type StudentClassTab = 'overview' | 'lessons' | 'materials' | 'assignments' | 'submissions' | 'attendance' | 'notifications'

const tabs: Array<{ id: StudentClassTab; label: string; icon: React.ReactNode }> = [
  { id: 'overview', label: 'Tổng quan', icon: <LayoutDashboard size={16} /> },
  { id: 'lessons', label: 'Bài học', icon: <BookOpen size={16} /> },
  { id: 'materials', label: 'Tài liệu', icon: <FileText size={16} /> },
  { id: 'assignments', label: 'Bài tập', icon: <ClipboardList size={16} /> },
  { id: 'submissions', label: 'Bài nộp', icon: <GraduationCap size={16} /> },
  { id: 'attendance', label: 'Điểm danh', icon: <CalendarCheck2 size={16} /> },
  { id: 'notifications', label: 'Thông báo', icon: <Bell size={16} /> },
]

function isDueSoon(item: AssignmentItem) {
  if (!item.dueAt) return false
  const due = new Date(item.dueAt).getTime()
  return due >= Date.now() && due - Date.now() <= 1000 * 60 * 60 * 24 * 7
}

function attendanceRate(rows: AttendanceItem[]) {
  if (!rows.length) return null
  const present = rows.filter((item) => item.status === 'PRESENT' || item.status === 'LATE').length
  return Math.round((present / rows.length) * 100)
}

function classSubmissionStats(assignments: AssignmentItem[], submissions: SubmissionItem[]) {
  const assignmentIds = new Set(assignments.map((item) => item.id))
  const related = submissions.filter((item) => assignmentIds.has(item.assignmentId))
  const graded = related.filter((item) => item.score != null)
  const average = graded.length ? graded.reduce((sum, item) => sum + Number(item.score), 0) / graded.length : null
  return { related, graded, average }
}

export function StudentClassDetailPage() {
  const params = useParams()
  const classId = params.classId ?? ''
  const { user } = useNewAuth()
  const [activeTab, setActiveTab] = useState<StudentClassTab>('overview')

  const classQuery = useQuery({ queryKey: ['student', 'class', classId], queryFn: () => api.classById(classId), enabled: Boolean(classId) })
  const lessons = useQuery({ queryKey: ['student', 'class', classId, 'lessons'], queryFn: () => api.lessonsByClass(classId), enabled: Boolean(classId) })
  const materials = useQuery({ queryKey: ['student', 'class', classId, 'materials'], queryFn: () => api.materialsByClass(classId), enabled: Boolean(classId) })
  const assignments = useQuery({ queryKey: ['student', 'class', classId, 'assignments'], queryFn: () => api.assignments(classId), enabled: Boolean(classId) })
  const submissions = useQuery({ queryKey: ['student', 'class', classId, 'my-submissions'], queryFn: () => api.mySubmissionsPage({ page: 0, size: 100, classId }), enabled: Boolean(classId) })
  const attendance = useQuery({ queryKey: ['student', 'class', classId, 'attendance', user?.id], queryFn: () => api.studentAttendance(user!.id), enabled: Boolean(user?.id) })
  const notifications = useQuery({ queryKey: ['student', 'class', classId, 'notifications'], queryFn: () => api.notificationsPage({ page: 0, size: 20 }), enabled: Boolean(classId) })

  const lessonItems = useMemo(() => (lessons.data ?? []).slice().sort((a, b) => a.orderIndex - b.orderIndex), [lessons.data])
  const visibleMaterials = useMemo(() => (materials.data ?? []).filter((item) => item.visible), [materials.data])
  const assignmentItems = useMemo(() => assignments.data ?? [], [assignments.data])
  const submissionItems = useMemo(() => Array.isArray(submissions.data) ? submissions.data : submissions.data?.items ?? [], [submissions.data])
  const notificationItems = useMemo(() => {
    const raw = Array.isArray(notifications.data) ? notifications.data : notifications.data?.items ?? []
    return raw.filter((item) => !item.targetId || item.targetId === classId || item.targetType === 'ALL')
  }, [classId, notifications.data])
  const classAttendance = useMemo(() => (attendance.data ?? []).filter((item) => !item.lessonId || lessonItems.some((lesson) => lesson.id === item.lessonId)), [attendance.data, lessonItems])
  const submissionStats = useMemo(() => classSubmissionStats(assignmentItems, submissionItems), [assignmentItems, submissionItems])
  const rate = attendanceRate(classAttendance)

  const isLoading = classQuery.isLoading || lessons.isLoading || materials.isLoading || assignments.isLoading || submissions.isLoading
  const isError = classQuery.isError || lessons.isError || materials.isError || assignments.isError || submissions.isError

  if (isLoading) {
    return (
      <div className="space-y-4 pb-20 md:pb-0">
        <SkeletonCard lines={5} />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
      </div>
    )
  }

  if (isError || !classQuery.data) {
    return <ErrorState title="Không tải được lớp học" description="Lớp có thể không tồn tại hoặc bạn không có quyền xem." onRetry={() => classQuery.refetch()} />
  }

  return (
    <div className="space-y-5 pb-20 md:pb-0">
      <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-gradient-to-br from-indigo-600 via-indigo-500 to-sky-400 p-6 text-white shadow-lg">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -left-6 bottom-0 h-28 w-28 rounded-full bg-white/10 blur-xl" />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur">{classQuery.data.code}</span>
            <StatusBadge value={classQuery.data.status} />
            {classQuery.data.levelFrom && <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur">TOPIK {classQuery.data.levelFrom}{classQuery.data.levelTo ? `–${classQuery.data.levelTo}` : '+'}</span>}
          </div>
          <h1 className="mt-3 text-2xl font-black tracking-tight md:text-3xl">{classQuery.data.name}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">Giáo viên {classQuery.data.teacherName} · {lessonItems.length} bài học · {assignmentItems.length} bài tập · {visibleMaterials.length} tài liệu</p>
        </div>
      </div>

      <div className="relative -mx-2 overflow-x-auto px-2 pb-1">
        <div className="absolute right-4 top-0 bottom-1 z-10 w-8 bg-gradient-to-l from-white/90 to-transparent pointer-events-none md:hidden" />
        <div className="flex min-w-max gap-2 rounded-3xl border border-sky-100 bg-white/85 p-2 shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex min-h-11 items-center gap-2 rounded-2xl px-4 text-sm font-bold transition ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-sky-50'}`}
            >
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Bài học" value={lessonItems.length} hint="Theo timeline lớp" icon={<BookOpen size={20} />} tone="indigo" />
            <MetricCard label="Tài liệu mở" value={visibleMaterials.length} hint="Chỉ tài liệu visible" icon={<FileText size={20} />} tone="sky" />
            <MetricCard label="Bài tập" value={assignmentItems.length} hint={`${assignmentItems.filter(isDueSoon).length} sắp hạn`} icon={<ClipboardList size={20} />} tone="amber" />
            <MetricCard label="Chuyên cần" value={rate == null ? '-' : `${rate}%`} hint="Từ lịch sử cá nhân" icon={<CalendarCheck2 size={20} />} tone="emerald" />
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <Card className="rounded-3xl bg-gradient-to-br from-indigo-50 via-white to-sky-50">
              <h2 className="text-lg font-black text-slate-950">Tiến độ học tập</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/80 p-4"><div className="text-xs text-slate-500">Đã nộp</div><div className="mt-1 text-2xl font-black">{submissionStats.related.length}</div></div>
                <div className="rounded-2xl bg-white/80 p-4"><div className="text-xs text-slate-500">Đã chấm</div><div className="mt-1 text-2xl font-black">{submissionStats.graded.length}</div></div>
                <div className="rounded-2xl bg-white/80 p-4"><div className="text-xs text-slate-500">Điểm TB</div><div className="mt-1 text-2xl font-black">{submissionStats.average == null ? '-' : submissionStats.average.toFixed(1)}</div></div>
              </div>
            </Card>
            <Card className="rounded-3xl">
              <h2 className="text-lg font-black text-slate-950">Deadline gần</h2>
              <div className="mt-4 space-y-3">
                {assignmentItems.filter(isDueSoon).slice(0, 3).map((item) => (
                  <a key={item.id} href={`/student/assignments/${item.id}`} className="block min-h-14 rounded-2xl border border-amber-100 bg-amber-50/50 p-3">
                    <div className="text-sm font-bold text-slate-900">{item.title}</div>
                    <div className="mt-1 text-xs text-amber-700">Hạn: {fmtDate(item.dueAt)}</div>
                  </a>
                ))}
                {!assignmentItems.filter(isDueSoon).length && <EmptyState title="Không có deadline gần" description="Bạn có thể ôn lại bài học hoặc xem tài liệu mới." />}
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'lessons' && <LessonsTab items={lessonItems} />}
      {activeTab === 'materials' && <MaterialsTab items={visibleMaterials} />}
      {activeTab === 'assignments' && <AssignmentsTab items={assignmentItems} submissions={submissionItems} />}
      {activeTab === 'submissions' && <SubmissionsTab items={submissionStats.related} />}
      {activeTab === 'attendance' && <AttendanceTab items={classAttendance} lessons={lessonItems} rate={rate} />}
      {activeTab === 'notifications' && <NotificationsTab items={notificationItems} />}
    </div>
  )
}

function LessonsTab({ items }: Readonly<{ items: LessonItem[] }>) {
  if (!items.length) return <EmptyState title="Chưa có bài học" description="Bài học sẽ xuất hiện khi giáo viên phát hành nội dung lớp." />
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <Card key={item.id} className="rounded-3xl">
          <div className="flex gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-sm font-black text-indigo-600">{String(index + 1).padStart(2, '0')}</div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2"><h2 className="font-black text-slate-950">{item.title}</h2><StatusBadge value={item.status} /></div>
              <p className="mt-1 text-sm leading-6 text-slate-500">{item.description || 'Buổi học TOPIK'}</p>
              <div className="mt-2 text-xs font-semibold text-indigo-600">{fmtDate(item.lessonDate)}</div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

function MaterialsTab({ items }: Readonly<{ items: MaterialItem[] }>) {
  if (!items.length) return <EmptyState title="Chưa có tài liệu hiển thị" description="Tài liệu từ giáo viên sẽ xuất hiện tại đây khi được phát hành." />
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <Card key={item.id} className="rounded-3xl">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 to-indigo-100 text-sky-600"><FileText size={22} /></div>
            <div className="min-w-0 flex-1"><h2 className="font-black text-slate-950">{item.title}</h2><p className="mt-1 line-clamp-3 text-sm leading-6 text-slate-500">{item.description || 'Tài liệu học tập'}</p></div>
          </div>
          <div className="mt-3 text-xs text-slate-400">Đăng ngày {fmtDate(item.createdAt)}</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {item.externalUrl && <a className="inline-flex min-h-11 items-center rounded-2xl border border-sky-200 px-4 text-sm font-bold text-slate-700" href={item.externalUrl} target="_blank" rel="noreferrer">Mở liên kết</a>}
            {item.fileId && <Button type="button" variant="secondary" className="min-h-11" onClick={() => api.downloadFile(item.fileId!, item.title)}><Download size={16} />Tải xuống</Button>}
          </div>
        </Card>
      ))}
    </div>
  )
}

function AssignmentsTab({ items, submissions }: Readonly<{ items: AssignmentItem[]; submissions: SubmissionItem[] }>) {
  if (!items.length) return <EmptyState title="Chưa có bài tập" description="Khi giáo viên phát hành bài tập, bạn sẽ thấy tại đây." />
  return (
    <div className="space-y-3">
      {items.map((item) => {
        const submission = submissions.find((row) => row.assignmentId === item.id)
        const late = item.dueAt ? new Date(item.dueAt).getTime() < Date.now() && !submission : false
        return (
          <a key={item.id} href={`/student/assignments/${item.id}`} className="block rounded-3xl focus:outline-none focus:ring-4 focus:ring-indigo-100">
            <Card className={`rounded-3xl transition hover:-translate-y-0.5 hover:shadow-lg ${late ? 'border-rose-100 bg-rose-50/50' : ''}`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-black text-slate-950">{item.title}</h2>
                    {item.skill && <span className="rounded-xl bg-violet-50 px-2 py-0.5 text-xs font-bold text-violet-700">{item.skill}</span>}
                  </div>
                  <p className="mt-1 text-sm text-slate-500">Hạn: {fmtDate(item.dueAt)} · Điểm tối đa {item.maxScore}</p>
                </div>
                <div className="flex flex-wrap gap-2"><StatusBadge value={item.status} /><StatusBadge value={submission?.status ?? (late ? 'LATE' : 'CHƯA NỘP')} /></div>
              </div>
            </Card>
          </a>
        )
      })}
    </div>
  )
}

function SubmissionsTab({ items }: Readonly<{ items: SubmissionItem[] }>) {
  if (!items.length) return <EmptyState title="Chưa có bài nộp" description="Bài nộp của riêng bạn trong lớp này sẽ xuất hiện tại đây." />
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <a key={item.id} href={`/student/submissions/${item.id}`} className="block rounded-3xl focus:outline-none focus:ring-4 focus:ring-indigo-100">
          <Card className="rounded-3xl">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div><h2 className="font-black text-slate-950">{item.assignmentTitle}</h2><p className="mt-1 text-sm text-slate-500">Nộp lúc {fmtDate(item.submittedAt)}</p></div>
              <StatusBadge value={item.status} />
            </div>
            {item.score != null && <div className="mt-3 text-sm font-black text-emerald-600">Điểm: {item.score}/{item.maxScore ?? '-'}</div>}
            {item.feedback && <div className="mt-2 rounded-2xl bg-slate-50 p-3 text-sm leading-6 text-slate-600">{item.feedback}</div>}
            {(item.feedbackFileId || item.feedbackLink) && (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-bold">
                {item.feedbackFileId && <span className="inline-flex min-h-7 items-center gap-1 rounded-full bg-indigo-50 px-2.5 text-indigo-600"><Download size={12} /> Tệp phản hồi</span>}
                {item.feedbackLink && <span className="inline-flex min-h-7 items-center gap-1 rounded-full bg-indigo-50 px-2.5 text-indigo-600"><ExternalLink size={12} /> Liên kết phản hồi</span>}
              </div>
            )}
          </Card>
        </a>
      ))}
    </div>
  )
}

function AttendanceTab({ items, lessons, rate }: Readonly<{ items: AttendanceItem[]; lessons: LessonItem[]; rate: number | null }>) {
  if (!items.length) return <EmptyState title="Chưa có dữ liệu điểm danh" description="Lịch sử chuyên cần của bạn trong lớp sẽ xuất hiện sau buổi học." />
  return (
    <div className="space-y-4">
      <MetricCard label="Tỷ lệ chuyên cần" value={rate == null ? '-' : `${rate}%`} hint="Có mặt + đi muộn" icon={<CalendarCheck2 size={20} />} tone="emerald" />
      <div className="space-y-3">
        {items.map((item) => {
          const lesson = item.lessonId ? lessons.find((l) => l.id === item.lessonId) : null
          return (
            <Card key={item.id} className="rounded-3xl">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-slate-950">{lesson ? lesson.title : 'Buổi học'}</div>
                  <div className="text-xs text-slate-500">{fmtDate(lesson?.lessonDate ?? item.createdAt)}</div>
                </div>
                <StatusBadge value={item.status} />
              </div>
              {item.note && <p className="mt-2 text-sm text-slate-500">{item.note}</p>}
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function NotificationsTab({ items }: Readonly<{ items: NotificationItem[] }>) {
  if (!items.length) return <EmptyState title="Không có thông báo lớp" description="Thông báo liên quan đến lớp sẽ xuất hiện tại đây." />
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item.id} className="rounded-3xl">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><MessageSquareText size={19} /></div>
            <div className="min-w-0 flex-1"><h2 className="font-black text-slate-950">{item.title}</h2><p className="mt-1 text-sm leading-6 text-slate-500">{item.content}</p><div className="mt-2 text-xs text-slate-400">{fmtDate(item.createdAt)}</div></div>
          </div>
        </Card>
      ))}
    </div>
  )
}

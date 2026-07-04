import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarCheck2, CheckCircle2, Clock3, Save, Users, XCircle } from 'lucide-react'
import { api } from '../core/api'
import { EmptyState, ErrorState, FilterBar, MetricCard, PageHeader, SkeletonCard, StatusBadge } from '../components/foundation'
import { Button, Card, FieldLabel, Input } from '../layout/ui'
import { asPage, fmtDate, numberValue } from './phase2-utils'
import type { AttendanceItem, AttendanceStatus, ClassItem, LessonItem, StudentMemberItem } from '../core/types'

type AttendanceDraft = Record<string, { status: AttendanceStatus; note: string }>
type StudentAttendanceSummary = { studentId: string; studentName: string; email?: string | null; presentCount: number; absentCount: number; lateCount: number; attendanceRate: number }
type AttendanceSummary = { classId: string; totalLessons: number; attendanceRate: number; studentAttendance: StudentAttendanceSummary[] }

const statusOptions: Array<{ value: AttendanceStatus; label: string; icon: React.ReactNode; active: string; idle: string }> = [
  { value: 'PRESENT', label: 'Có mặt', icon: <CheckCircle2 size={16} />, active: 'bg-emerald-600 text-white', idle: 'border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50' },
  { value: 'LATE', label: 'Muộn', icon: <Clock3 size={16} />, active: 'bg-amber-500 text-white', idle: 'border-amber-200 bg-white text-amber-700 hover:bg-amber-50' },
  { value: 'ABSENT', label: 'Vắng', icon: <XCircle size={16} />, active: 'bg-rose-600 text-white', idle: 'border-rose-200 bg-white text-rose-700 hover:bg-rose-50' },
]

function buildDraft(students: StudentMemberItem[], records: AttendanceItem[] | undefined): AttendanceDraft {
  const recordMap = new Map((records ?? []).map((item) => [item.studentId, item]))
  return students.reduce<AttendanceDraft>((acc, student) => {
    const record = recordMap.get(student.id)
    acc[student.id] = { status: record?.status ?? 'PRESENT', note: record?.note ?? '' }
    return acc
  }, {})
}

function countStatuses(draft: AttendanceDraft) {
  return Object.values(draft).reduce<Record<AttendanceStatus, number>>((acc, item) => {
    acc[item.status] += 1
    return acc
  }, { PRESENT: 0, ABSENT: 0, LATE: 0 })
}

function summaryRows(payload: unknown): StudentAttendanceSummary[] {
  const data = payload as AttendanceSummary | undefined
  return Array.isArray(data?.studentAttendance) ? data.studentAttendance : []
}

function StudentAttendanceCard({ student, value, onChange }: Readonly<{ student: StudentMemberItem; value: { status: AttendanceStatus; note: string }; onChange: (next: { status: AttendanceStatus; note: string }) => void }>) {
  return (
    <Card className="rounded-3xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="font-black text-slate-950">{student.fullName}</h2>
          <p className="mt-1 text-sm text-slate-500">{student.email ?? student.studentCode ?? student.id}</p>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
          {statusOptions.map((status) => (
            <button key={status.value} type="button" onClick={() => onChange({ ...value, status: status.value })} className={`inline-flex min-h-11 items-center justify-center gap-1 rounded-2xl border px-3 text-xs font-black transition ${value.status === status.value ? status.active : status.idle}`}>
              {status.icon}{status.label}
            </button>
          ))}
        </div>
      </div>
      <Input className="mt-4" value={value.note} onChange={(event) => onChange({ ...value, note: event.target.value })} placeholder="Ghi chú điểm danh (tuỳ chọn)" />
    </Card>
  )
}

function ClassAttendanceOverview({ summary }: Readonly<{ summary: unknown }>) {
  const rows = summaryRows(summary)
  if (!rows.length) return <EmptyState title="Chưa có tổng quan chuyên cần" description="Sau khi chấm điểm danh, heatmap theo học viên sẽ xuất hiện tại đây." />

  return (
    <Card className="rounded-3xl">
      <div className="mb-4">
        <h2 className="text-lg font-black text-slate-950">Heatmap chuyên cần theo lớp</h2>
        <p className="mt-1 text-sm text-slate-500">Tổng quan số buổi có mặt, vắng, muộn và tỷ lệ tham gia.</p>
      </div>
      <div className="space-y-3">
        {rows.map((item) => {
          const rate = numberValue(item.attendanceRate)
          return (
            <div key={item.studentId} className="rounded-2xl border border-sky-100 bg-white p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-bold text-slate-950">{item.studentName}</p>
                  <p className="text-xs text-slate-500">{item.email ?? item.studentId}</p>
                </div>
                <div className="text-sm font-black text-indigo-600">{rate.toFixed(1)}%</div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs font-bold">
                <div className="rounded-xl bg-emerald-50 px-2 py-2 text-emerald-700">P {item.presentCount}</div>
                <div className="rounded-xl bg-amber-50 px-2 py-2 text-amber-700">L {item.lateCount}</div>
                <div className="rounded-xl bg-rose-50 px-2 py-2 text-rose-700">A {item.absentCount}</div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-indigo-500" style={{ width: `${Math.min(Math.max(rate, 0), 100)}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

export function AttendanceMarkingPage() {
  const qc = useQueryClient()
  const [classId, setClassId] = useState('')
  const [lessonId, setLessonId] = useState('')
  const [draft, setDraft] = useState<AttendanceDraft>({})

  const classes = useQuery({ queryKey: ['classes', 'attendance-marking'], queryFn: () => api.classes({ page: 0, size: 100 }), staleTime: 60_000 })
  const lessons = useQuery({ queryKey: ['class', classId, 'lessons', 'attendance-marking'], queryFn: () => api.lessonsByClassPage(classId, { page: 0, size: 100 }), enabled: Boolean(classId) })
  const students = useQuery({ queryKey: ['class', classId, 'students', 'attendance-marking'], queryFn: () => api.listClassStudentsPage(classId, { page: 0, size: 200 }), enabled: Boolean(classId) })
  const lessonAttendance = useQuery({ queryKey: ['lesson', lessonId, 'attendance'], queryFn: () => api.lessonAttendance(lessonId), enabled: Boolean(lessonId) })
  const summary = useQuery({ queryKey: ['attendance-summary', classId], queryFn: () => api.attendanceSummary(classId), enabled: Boolean(classId) })

  const lessonPage = asPage(lessons.data, 0, 100)
  const studentPage = asPage(students.data, 0, 200)
  const selectedLesson = lessonPage.items.find((item: LessonItem) => item.id === lessonId)
  const counts = useMemo(() => countStatuses(draft), [draft])
  const total = studentPage.items.length
  const attendanceRate = total ? Math.round(((counts.PRESENT + counts.LATE) / total) * 100) : 0

  useEffect(() => {
    if (!lessonId || !studentPage.items.length) {
      setDraft({})
      return
    }
    setDraft(buildDraft(studentPage.items, lessonAttendance.data))
  }, [lessonId, lessonAttendance.data, studentPage.items])

  const setAll = (status: AttendanceStatus) => {
    setDraft((current) => Object.fromEntries(studentPage.items.map((student) => [student.id, { status, note: current[student.id]?.note ?? '' }])))
  }

  const save = useMutation({
    mutationFn: () => api.markLessonAttendance(lessonId, studentPage.items.map((student) => ({ studentId: student.id, status: draft[student.id]?.status ?? 'PRESENT', note: draft[student.id]?.note || undefined }))),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['lesson', lessonId, 'attendance'] })
      const previous = qc.getQueryData<AttendanceItem[]>(['lesson', lessonId, 'attendance'])
      const optimistic = studentPage.items.map((student) => ({ id: previous?.find((item) => item.studentId === student.id)?.id ?? `${lessonId}-${student.id}`, lessonId, studentId: student.id, studentName: student.fullName, status: draft[student.id]?.status ?? 'PRESENT', note: draft[student.id]?.note || null, createdAt: new Date().toISOString() })) satisfies AttendanceItem[]
      qc.setQueryData(['lesson', lessonId, 'attendance'], optimistic)
      return { previous }
    },
    onError: (_error, _variables, context) => qc.setQueryData(['lesson', lessonId, 'attendance'], context?.previous),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['lesson', lessonId, 'attendance'] }),
        qc.invalidateQueries({ queryKey: ['attendance-summary', classId] }),
        qc.invalidateQueries({ queryKey: ['student', 'attendance'] }),
      ])
    },
  })

  return (
    <div className="space-y-5 pb-20 md:pb-0">
      <PageHeader eyebrow="출석 관리" title="Chấm điểm danh" description="Chọn lớp và buổi học để chấm điểm danh hàng loạt cho học viên bằng trạng thái PRESENT / ABSENT / LATE." />

      <FilterBar>
        <div className="min-w-0 flex-1">
          <FieldLabel htmlFor="attendance-class">Lớp học</FieldLabel>
          <select id="attendance-class" className="min-h-11 w-full rounded-2xl border border-sky-100 bg-white px-4 text-sm font-bold text-slate-600 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100" value={classId} onChange={(event) => { setClassId(event.target.value); setLessonId('') }}>
            <option value="">Chọn lớp</option>
            {(classes.data ?? []).map((item: ClassItem) => <option key={item.id} value={item.id}>{item.name} · {item.code}</option>)}
          </select>
        </div>
        <div className="min-w-0 flex-1">
          <FieldLabel htmlFor="attendance-lesson">Buổi học</FieldLabel>
          <select id="attendance-lesson" className="min-h-11 w-full rounded-2xl border border-sky-100 bg-white px-4 text-sm font-bold text-slate-600 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100" value={lessonId} onChange={(event) => setLessonId(event.target.value)} disabled={!classId}>
            <option value="">Chọn buổi học</option>
            {lessonPage.items.map((item: LessonItem) => <option key={item.id} value={item.id}>{item.lessonDate ? new Date(item.lessonDate + 'T00:00:00').toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'} · {item.title}</option>)}
          </select>
        </div>
      </FilterBar>

      {classes.isError && <ErrorState title="Không tải được danh sách lớp" description="Vui lòng thử lại sau ít phút." onRetry={() => classes.refetch()} />}
      {classId && lessons.isLoading && <SkeletonCard lines={3} />}
      {classId && lessons.isError && <ErrorState title="Không tải được buổi học" description="Vui lòng thử lại hoặc kiểm tra lớp đã có lesson chưa." onRetry={() => lessons.refetch()} />}
      {classId && !lessons.isLoading && !lessonPage.items.length && <EmptyState title="Lớp chưa có buổi học" description="Điểm danh được chấm theo lesson. Hãy tạo buổi học trước khi điểm danh." action={<CalendarCheck2 className="mx-auto text-indigo-400" />} />}

      {lessonId && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard label="Buổi học" value={selectedLesson?.title ?? 'Đã chọn'} hint={fmtDate(selectedLesson?.lessonDate)} icon={<CalendarCheck2 size={20} />} tone="indigo" />
            <MetricCard label="Học viên" value={total} hint="Active trong lớp" icon={<Users size={20} />} tone="sky" />
            <MetricCard label="Có mặt" value={counts.PRESENT} hint="PRESENT" icon={<CheckCircle2 size={20} />} tone="emerald" />
            <MetricCard label="Muộn / Vắng" value={`${counts.LATE}/${counts.ABSENT}`} hint="LATE / ABSENT" icon={<Clock3 size={20} />} tone="amber" />
            <MetricCard label="Tỷ lệ buổi" value={`${attendanceRate}%`} hint="Present + Late" icon={<StatusBadge value="PRESENT" />} tone="emerald" />
          </div>

          <Card className="rounded-3xl bg-gradient-to-r from-white to-sky-50">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="font-black text-slate-950">Chấm nhanh hàng loạt</h2>
                <p className="mt-1 text-sm text-slate-500">Set-all sau đó chỉnh từng học viên nếu cần.</p>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
                {statusOptions.map((status) => <Button key={status.value} type="button" variant="secondary" className="min-h-11" onClick={() => setAll(status.value)}>{status.icon}{status.label}</Button>)}
                <Button type="button" className="col-span-3 min-h-11 sm:col-span-1" disabled={!total || save.isPending} onClick={() => save.mutate()}><Save size={16} />Lưu điểm danh</Button>
              </div>
            </div>
          </Card>

          {(students.isLoading || lessonAttendance.isLoading) && <div className="space-y-3"><SkeletonCard lines={4} /><SkeletonCard lines={4} /></div>}
          {students.isError && <ErrorState title="Không tải được học viên" description="Vui lòng thử lại sau ít phút." onRetry={() => students.refetch()} />}
          {lessonAttendance.isError && <ErrorState title="Không tải được điểm danh buổi" description="Vui lòng thử lại sau ít phút." onRetry={() => lessonAttendance.refetch()} />}
          {save.isError && <ErrorState title="Không lưu được điểm danh" description="Kiểm tra quyền quản lý lớp và thử lại." />}
          {!students.isLoading && !lessonAttendance.isLoading && !studentPage.items.length && <EmptyState title="Lớp chưa có học viên active" description="Chỉ học viên ACTIVE trong lớp mới có thể được chấm điểm danh." action={<Users className="mx-auto text-indigo-400" />} />}
          {!students.isLoading && !lessonAttendance.isLoading && studentPage.items.length > 0 && (
            <div className="space-y-3">
              {studentPage.items.map((student) => (
                <StudentAttendanceCard key={student.id} student={student} value={draft[student.id] ?? { status: 'PRESENT', note: '' }} onChange={(next) => setDraft((current) => ({ ...current, [student.id]: next }))} />
              ))}
            </div>
          )}
        </>
      )}

      {classId && summary.isLoading && <SkeletonCard lines={4} />}
      {classId && summary.isError && <ErrorState title="Không tải được tổng quan chuyên cần" description="Vui lòng thử lại sau khi lưu điểm danh." onRetry={() => summary.refetch()} />}
      {classId && !summary.isLoading && !summary.isError && <ClassAttendanceOverview summary={summary.data} />}
      {!classId && <EmptyState title="Chọn lớp để bắt đầu điểm danh" description="Admin chỉ thấy lớp được gán; Teacher Owner có thể quản lý toàn bộ lớp." action={<CalendarCheck2 className="mx-auto text-indigo-400" />} />}
    </div>
  )
}

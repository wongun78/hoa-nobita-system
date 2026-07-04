import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { ArrowRight, Download, Pencil, Plus, Save, Trash2, UserMinus, X } from 'lucide-react'
import { useNewAuth } from '../auth/use-auth'
import { ConfirmDialog, EmptyState, ErrorState, MetricCard, PageHeader, StatusBadge } from '../components/foundation'
import { api } from '../core/api'
import type { LessonItem, LessonStatus, StudentMemberItem } from '../core/types'
import { Button, Card, FieldLabel, Input, TextArea } from '../layout/ui'
import { asPage, fmtDate, numberValue } from './phase2-utils'

const tabs = ['Tổng quan', 'Học viên', 'Buổi học', 'Tài liệu', 'Bài tập', 'Bài nộp', 'Điểm danh', 'Hoạt động', 'Thông báo'] as const
type TabName = typeof tabs[number]

function formatLessonLabel(item: LessonItem, className?: string): string {
  const datePart = item.lessonDate ? `Buổi học ${new Date(item.lessonDate + 'T00:00:00').toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}` : ''
  const titlePart = item.title || ''
  const classPart = className ?? ''
  if (datePart && titlePart && titlePart !== datePart) return `${datePart} - ${titlePart}`
  if (datePart) return datePart
  if (titlePart) return titlePart
  return 'Buổi học'
}

const lessonStatusOptions: LessonStatus[] = ['DRAFT', 'PUBLISHED']

type LessonFormState = { title: string; description: string; lessonDate: string; orderIndex: number; status: LessonStatus }

const emptyForm: LessonFormState = { title: '', description: '', lessonDate: '', orderIndex: 0, status: 'PUBLISHED' }

function LessonFormDialog({ open, title, form, onChange, saving, onSave, onClose }: Readonly<{ open: boolean; title: string; form: LessonFormState; onChange: (f: LessonFormState) => void; saving: boolean; onSave: () => void; onClose: () => void }>) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-3xl border border-sky-100 bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-black text-slate-950">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-xl p-1 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <FieldLabel htmlFor="lesson-title">Tên buổi học (tuỳ chọn)</FieldLabel>
            <Input id="lesson-title" value={form.title} onChange={(e) => onChange({ ...form, title: e.target.value })} placeholder="Để trống sẽ tự sinh theo ngày" />
          </div>
          <div>
            <FieldLabel htmlFor="lesson-date">Ngày học</FieldLabel>
            <input id="lesson-date" type="date" className="min-h-11 w-full rounded-2xl border border-sky-100 bg-white px-4 text-sm text-slate-700 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100" value={form.lessonDate} onChange={(e) => onChange({ ...form, lessonDate: e.target.value })} />
          </div>
          <div>
            <FieldLabel htmlFor="lesson-desc">Mô tả</FieldLabel>
            <TextArea id="lesson-desc" value={form.description} onChange={(e) => onChange({ ...form, description: (e.target as HTMLTextAreaElement).value })} placeholder="Mô tả nội dung buổi học (tuỳ chọn)" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel htmlFor="lesson-order">Thứ tự</FieldLabel>
              <Input id="lesson-order" type="number" value={form.orderIndex} onChange={(e) => onChange({ ...form, orderIndex: Number(e.target.value) || 0 })} />
            </div>
            <div>
              <FieldLabel htmlFor="lesson-status">Trạng thái</FieldLabel>
              <select id="lesson-status" className="min-h-11 w-full rounded-2xl border border-sky-100 bg-white px-4 text-sm font-bold text-slate-600 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100" value={form.status} onChange={(e) => onChange({ ...form, status: e.target.value as LessonStatus })}>
                {lessonStatusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Huỷ</Button>
          <Button disabled={saving} onClick={onSave}>{saving ? 'Đang lưu...' : 'Lưu'}</Button>
        </div>
      </div>
    </div>
  )
}

function StudentRow({ classId, student, canRemove }: Readonly<{ classId: string; student: StudentMemberItem; canRemove: boolean }>) {
  const qc = useQueryClient()
  const [code, setCode] = useState(student.studentCode ?? '')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const save = useMutation({ mutationFn: () => api.updateClassStudentCode(classId, student.id, code), onSuccess: async () => qc.invalidateQueries({ queryKey: ['class', classId, 'students'] }) })
  const remove = useMutation({
    mutationFn: () => api.removeClassStudent(classId, student.id),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['class', classId, 'students'] })
      const previous = qc.getQueryData(['class', classId, 'students', 0])
      qc.setQueryData(['class', classId, 'students', 0], (old: unknown) => {
        if (!old || Array.isArray(old)) return old
        const page = old as { items?: StudentMemberItem[] }
        return { ...page, items: (page.items ?? []).filter((item) => item.id !== student.id), totalItems: Math.max(((page as { totalItems?: number }).totalItems ?? 1) - 1, 0) }
      })
      return { previous }
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) qc.setQueryData(['class', classId, 'students', 0], context.previous)
    },
    onSuccess: async () => {
      setConfirmOpen(false)
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['class', classId, 'students'] }),
        qc.invalidateQueries({ queryKey: ['class', classId, 'stats'] }),
        qc.invalidateQueries({ queryKey: ['class', classId] }),
      ])
    },
  })
  return <><tr className="border-b border-sky-50"><td className="px-3 py-3 font-bold">{student.fullName}<p className="text-xs font-normal text-slate-500">{student.email || '-'}</p></td><td className="px-3 py-3"><Input value={code} onChange={(e) => setCode(e.target.value)} /></td><td className="px-3 py-3"><StatusBadge value={student.status} /></td><td className="px-3 py-3 text-slate-500">{fmtDate(student.joinedAt)}</td><td className="px-3 py-3"><div className="flex flex-wrap gap-2"><Button variant="secondary" disabled={save.isPending} onClick={() => save.mutate()}><Save size={14} /> Lưu code</Button>{canRemove && <Button variant="ghost" disabled={remove.isPending} onClick={() => setConfirmOpen(true)}><UserMinus size={14} /> Gỡ học viên</Button>}</div></td></tr><ConfirmDialog open={confirmOpen} title={`Gỡ ${student.fullName} khỏi lớp?`} description="Hành động này KHÔNG HOÀN TÁC. Membership của học viên trong lớp sẽ bị xoá cứng và mất liên kết lớp; bài nộp/điểm đã có vẫn được giữ lại để tra cứu." confirmLabel={remove.isPending ? 'Đang gỡ...' : 'Gỡ vĩnh viễn'} onCancel={() => setConfirmOpen(false)} onConfirm={() => remove.mutate()} /></>
}

export function ClassDetailV2Page() {
  const qc = useQueryClient()
  const { hasRole } = useNewAuth()
  const isTeacher = hasRole('TEACHER_OWNER')
  const isAdmin = hasRole('CLASS_ADMIN')
  const canOperate = isTeacher || isAdmin
  const { classId = '' } = useParams()
  const [tab, setTab] = useState<TabName>('Tổng quan')
  const klass = useQuery({ queryKey: ['class', classId], queryFn: () => api.classById(classId), enabled: Boolean(classId) })
  const stats = useQuery({ queryKey: ['class', classId, 'stats'], queryFn: () => api.classStats(classId), enabled: Boolean(classId) })
  const students = useQuery({ queryKey: ['class', classId, 'students', 0], queryFn: () => api.listClassStudentsPage(classId, { page: 0, size: 100 }), enabled: Boolean(classId) })
  const lessons = useQuery({ queryKey: ['class', classId, 'lessons'], queryFn: () => api.lessonsByClassPage(classId, { page: 0, size: 20 }), enabled: Boolean(classId) })
  const materials = useQuery({ queryKey: ['class', classId, 'materials'], queryFn: () => api.materialsByClassPage(classId, { page: 0, size: 20 }), enabled: Boolean(classId) })
  const assignments = useQuery({ queryKey: ['class', classId, 'assignments'], queryFn: () => api.assignmentsPage({ classId, page: 0, size: 20 }), enabled: Boolean(classId) })
  const submissions = useQuery({ queryKey: ['class', classId, 'submissions-summary'], queryFn: () => api.classGradingSubmissionsPage(classId, { page: 0, size: 20 }), enabled: Boolean(classId) })
  const attendance = useQuery({ queryKey: ['class', classId, 'attendance-summary'], queryFn: () => api.attendanceSummary(classId), enabled: Boolean(classId) })
  const activity = useQuery({ queryKey: ['class', classId, 'activity'], queryFn: () => api.classActivityPage(classId, { page: 0, size: 20 }), enabled: Boolean(classId) })
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false)
  const [editingLesson, setEditingLesson] = useState<LessonItem | null>(null)
  const [lessonForm, setLessonForm] = useState<LessonFormState>(emptyForm)
  const [lessonDeleteTarget, setLessonDeleteTarget] = useState<LessonItem | null>(null)

  const openCreateLesson = () => { setEditingLesson(null); setLessonForm(emptyForm); setLessonDialogOpen(true) }
  const openEditLesson = (item: LessonItem) => { setEditingLesson(item); setLessonForm({ title: item.title, description: item.description ?? '', lessonDate: item.lessonDate ?? '', orderIndex: item.orderIndex, status: item.status }); setLessonDialogOpen(true) }

  const invalidateLessons = async () => {
    await qc.invalidateQueries({ queryKey: ['class', classId, 'lessons'] })
    await qc.invalidateQueries({ queryKey: ['class', classId, 'stats'] })
  }

  const createLessonMutation = useMutation({
    mutationFn: () => api.createLesson(classId, { title: lessonForm.title || undefined, description: lessonForm.description || undefined, lessonDate: lessonForm.lessonDate || undefined, orderIndex: lessonForm.orderIndex, status: lessonForm.status }),
    onSuccess: async () => { await invalidateLessons(); setLessonDialogOpen(false) },
  })

  const updateLessonMutation = useMutation({
    mutationFn: () => api.updateLesson(editingLesson!.id, { title: lessonForm.title || undefined, description: lessonForm.description || undefined, lessonDate: lessonForm.lessonDate || undefined, orderIndex: lessonForm.orderIndex, status: lessonForm.status }),
    onSuccess: async () => { await invalidateLessons(); setLessonDialogOpen(false) },
  })

  const deleteLessonMutation = useMutation({
    mutationFn: (id: string) => api.deleteLesson(id),
    onSuccess: async () => { await invalidateLessons(); setLessonDeleteTarget(null) },
  })

  const saveLesson = () => { if (editingLesson) { updateLessonMutation.mutate() } else { createLessonMutation.mutate() } }
  const lessonSaving = createLessonMutation.isPending || updateLessonMutation.isPending

  const studentsPage = asPage(students.data, 0, 100)
  const lessonsPage = asPage(lessons.data, 0, 20)
  const materialsPage = asPage(materials.data, 0, 20)
  const assignmentsPage = asPage(assignments.data, 0, 20)
  const submissionsPage = asPage(submissions.data, 0, 20)
  const activityPage = asPage(activity.data, 0, 20)
  const classHealth = useMemo(() => {
    const s = stats.data
    if (!s) return 'Đang cập nhật'
    if (s.needGrading > 10 || s.submissionRate < 60) return 'Cần chú ý'
    if (s.submissionRate >= 85) return 'Khỏe mạnh'
    return 'Ổn định'
  }, [stats.data])

  const rolePrefix = isTeacher ? '/teacher' : isAdmin ? '/admin' : '/student'
  const openAssignments = assignmentsPage.items.filter((item) => item.status === 'PUBLISHED').length
  const needGrading = stats.data?.needGrading ?? submissionsPage.items.filter((item) => item.status !== 'GRADED').length
  const attendanceRate = numberValue(attendance.data?.attendanceRate)

  if (klass.isLoading) return <Card>Đang tải lớp học...</Card>
  if (klass.isError || !klass.data) return <ErrorState title="Không thể tải chi tiết lớp" onRetry={() => void klass.refetch()} />

  return <div className="space-y-5"><div className="sticky top-20 z-20 space-y-3"><PageHeader eyebrow={klass.data.code} title={klass.data.name} description={isAdmin ? 'Góc nhìn quản trị lớp: chỉ hiển thị dữ liệu và thao tác trong phạm vi lớp được giao.' : klass.data.description || 'Chi tiết vận hành lớp học'} actions={<><Button variant="secondary" onClick={() => api.downloadClassStudentsCsv(classId)}><Download size={16} /> Xuất CSV học viên</Button></>} /><div className="flex gap-2 overflow-x-auto rounded-3xl border border-sky-100 bg-white/90 p-2 shadow-sm">{tabs.map((item) => <button key={item} className={`whitespace-nowrap rounded-2xl px-3 py-2 text-sm font-bold ${tab === item ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-sky-50'}`} onClick={() => setTab(item)}>{item}</button>)}</div></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><MetricCard label="Học viên" value={stats.data?.totalStudents ?? klass.data.studentCount} /><MetricCard label="Bài tập" value={stats.data?.totalAssignments ?? '-'} /><MetricCard label="Tỷ lệ nộp" value={`${Math.round(stats.data?.submissionRate ?? 0)}%`} /><MetricCard label="Cần chấm" value={stats.data?.needGrading ?? '-'} /><MetricCard label="Sức khỏe" value={classHealth} /></div>
    {tab === 'Tổng quan' && <Card><h2 className="font-black text-slate-950">Tổng quan lớp học</h2><p className="mt-2 text-sm text-slate-600">Giáo viên: {klass.data.teacherName}</p><p className="text-sm text-slate-600">Trạng thái: <StatusBadge value={klass.data.status} /></p></Card>}
    {tab === 'Học viên' && <Card><div className="mb-3 flex items-center justify-between"><h2 className="font-black">Học viên</h2><Button variant="secondary" onClick={() => api.downloadClassStudentsCsv(classId)}><Download size={16} /> CSV</Button></div><div className="overflow-auto"><table className="w-full min-w-[820px] text-sm"><thead><tr className="border-b border-sky-100 text-left text-slate-500"><th className="px-3 py-3">Học viên</th><th className="px-3 py-3">Mã học viên</th><th className="px-3 py-3">Trạng thái</th><th className="px-3 py-3">Ngày vào</th><th className="px-3 py-3">Hành động</th></tr></thead><tbody>{studentsPage.items.map((student) => <StudentRow key={student.id} classId={classId} student={student} canRemove={canOperate} />)}</tbody></table></div>{studentsPage.items.length === 0 && <EmptyState title="Chưa có học viên" description="Khi học viên được thêm vào lớp, danh sách sẽ hiển thị tại đây." />}</Card>}
    {tab === 'Buổi học' && <Card><div className="mb-3 flex items-center justify-between"><h2 className="font-black">Buổi học</h2>{canOperate && <Button onClick={openCreateLesson}><Plus size={14} /> Tạo buổi học</Button>}</div><div className="mt-3 divide-y divide-sky-50">{lessonsPage.items.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><b>{formatLessonLabel(item, klass.data?.name)}</b><p className="text-xs text-slate-500"><StatusBadge value={item.status} /> · {fmtDate(item.lessonDate) || 'Chưa có ngày'}</p></div>{canOperate && <div className="flex shrink-0 gap-1"><Button variant="ghost" onClick={() => openEditLesson(item)}><Pencil size={14} /></Button><Button variant="ghost" onClick={() => setLessonDeleteTarget(item)}><Trash2 size={14} className="text-rose-500" /></Button></div>}</div>)}{lessonsPage.items.length === 0 && <EmptyState title="Chưa có buổi học" description="Lớp này chưa có lịch buổi học trong dữ liệu hiện tại." />}</div></Card>}
    {tab === 'Tài liệu' && <Card><div className="mb-3 flex items-center justify-between gap-3"><h2 className="font-black">Tài liệu</h2>{canOperate && <Link className="inline-flex min-h-10 items-center gap-2 rounded-2xl border border-sky-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-sky-50" to={`${rolePrefix}/materials`}><ArrowRight size={16} />Mở thư viện</Link>}</div><div className="mt-3 divide-y divide-sky-50">{materialsPage.items.map((item) => <div key={item.id} className="flex justify-between py-3"><div><b>{item.title}</b><p className="text-xs text-slate-500">{item.description || 'Chưa có mô tả'}</p></div><StatusBadge value={item.visible ? 'VISIBLE' : 'HIDDEN'} /></div>)}{materialsPage.items.length === 0 && <EmptyState title="Chưa có tài liệu" description="Tài liệu của lớp sẽ xuất hiện sau khi được tạo trong thư viện tài liệu." />}</div></Card>}
    {tab === 'Bài tập' && <Card><div className="mb-3 flex items-center justify-between gap-3"><h2 className="font-black">Bài tập</h2>{canOperate && <Link className="inline-flex min-h-10 items-center gap-2 rounded-2xl border border-sky-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-sky-50" to={`${rolePrefix}/assignments`}><ArrowRight size={16} />Mở quản lý bài tập</Link>}</div><div className="grid gap-3 sm:grid-cols-2"><MetricCard label="Tổng bài tập" value={assignmentsPage.totalItems} /><MetricCard label="Đang mở" value={openAssignments} /></div><div className="mt-3 divide-y divide-sky-50">{assignmentsPage.items.map((item) => <div key={item.id} className="flex justify-between py-3"><div><b>{item.title}</b><p className="text-xs text-slate-500">Hạn: {fmtDate(item.dueAt)}</p></div><StatusBadge value={item.status} /></div>)}{assignmentsPage.items.length === 0 && <EmptyState title="Chưa có bài tập" description="Bài tập của lớp sẽ hiển thị tại đây sau khi giáo viên tạo." />}</div></Card>}
    {tab === 'Bài nộp' && <Card><div className="mb-3 flex items-center justify-between gap-3"><h2 className="font-black">Bài nộp</h2>{canOperate && <Link className="inline-flex min-h-10 items-center gap-2 rounded-2xl border border-sky-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-sky-50" to={`${rolePrefix}/grading`}><ArrowRight size={16} />Mở hàng chấm</Link>}</div><div className="grid gap-3 sm:grid-cols-3"><MetricCard label="Bài nộp gần đây" value={submissionsPage.totalItems} /><MetricCard label="Cần xử lý" value={needGrading} /><MetricCard label="Đã chấm" value={submissionsPage.items.filter((item) => item.status === 'GRADED').length} /></div>{submissionsPage.items.length === 0 && <EmptyState title="Chưa có bài nộp" description="Khi học viên nộp bài, danh sách tóm tắt sẽ xuất hiện tại đây." />}</Card>}
    {tab === 'Chấm bài' && <Card><div className="mb-3 flex items-center justify-between gap-3"><h2 className="font-black">Chấm bài</h2>{canOperate && <Link className="inline-flex min-h-10 items-center gap-2 rounded-2xl border border-sky-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-sky-50" to={`${rolePrefix}/grading`}><ArrowRight size={16} />Mở trung tâm chấm bài</Link>}</div><div className="grid gap-3 sm:grid-cols-2"><MetricCard label="Cần chấm" value={needGrading} /><MetricCard label="Điểm trung bình" value={stats.data?.averageScore?.toFixed?.(1) ?? '-'} /></div></Card>}
    {tab === 'Điểm danh' && <Card><div className="mb-3 flex items-center justify-between gap-3"><h2 className="font-black">Điểm danh</h2>{canOperate && <Link className="inline-flex min-h-10 items-center gap-2 rounded-2xl border border-sky-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-sky-50" to={`${rolePrefix}/attendance`}><ArrowRight size={16} />Mở điểm danh</Link>}</div><div className="grid gap-3 sm:grid-cols-2"><MetricCard label="Tỷ lệ chuyên cần" value={`${attendanceRate.toFixed(1)}%`} /><MetricCard label="Số buổi học" value={attendance.data?.totalLessons ?? lessonsPage.totalItems} /></div>{!attendance.isLoading && !attendance.data && <EmptyState title="Chưa có dữ liệu điểm danh" description="Dữ liệu chuyên cần sẽ hiển thị sau khi lớp có buổi học và bản ghi điểm danh." />}</Card>}
    {tab === 'Thông báo' && <Card><div className="mb-3 flex items-center justify-between gap-3"><h2 className="font-black">Thông báo</h2>{canOperate && <Link className="inline-flex min-h-10 items-center gap-2 rounded-2xl border border-sky-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-sky-50" to={`${rolePrefix}/notifications`}><ArrowRight size={16} />Mở hộp thông báo</Link>}</div><EmptyState title="Chưa có tóm tắt thông báo theo lớp" description="Màn thông báo chuyên biệt đang xử lý tạo, đọc và đánh dấu thông báo theo quyền truy cập." /></Card>}
    {tab === 'Cài đặt' && <Card><h2 className="font-black">Cài đặt lớp</h2><EmptyState title="Chưa có cấu hình bổ sung" description="Các thiết lập nâng cao của lớp chưa có API dữ liệu riêng trong giai đoạn này." /></Card>}
    {tab === 'Hoạt động' && <Card><h2 className="font-black">Hoạt động</h2><div className="mt-3 divide-y divide-sky-50">{activityPage.items.map((item) => <div key={item.id} className="py-3"><b>{item.message}</b><p className="text-xs text-slate-500">{item.actorName} · {fmtDate(item.createdAt)}</p></div>)}{activityPage.items.length === 0 && <EmptyState title="Chưa có hoạt động" description="Nhật ký thao tác của lớp sẽ hiển thị tại đây." />}</div></Card>}
    <LessonFormDialog open={lessonDialogOpen} title={editingLesson ? 'Sửa buổi học' : 'Tạo buổi học'} form={lessonForm} onChange={setLessonForm} saving={lessonSaving} onSave={saveLesson} onClose={() => setLessonDialogOpen(false)} />
    <ConfirmDialog open={Boolean(lessonDeleteTarget)} title={`Xoá "${lessonDeleteTarget?.title}"?`} description="Buổi học sẽ bị xoá mềm. Dữ liệu điểm danh liên quan vẫn được giữ." confirmLabel={deleteLessonMutation.isPending ? 'Đang xoá...' : 'Xoá buổi học'} onCancel={() => setLessonDeleteTarget(null)} onConfirm={() => { if (lessonDeleteTarget) deleteLessonMutation.mutate(lessonDeleteTarget.id) }} />
  </div>
}

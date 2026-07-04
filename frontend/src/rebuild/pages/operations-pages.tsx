import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Download, ExternalLink } from 'lucide-react'
import { api } from '../core/api'
import { Button, Card, Input, TextArea } from '../layout/ui'
import { fmtDate } from './phase2-utils'
import type { AssignmentItem, CalendarEvent, ClassItem, SubmissionItem } from '../core/types'

function SectionHeader({ title, eyebrow, description }: Readonly<{ title: string; eyebrow?: string; description?: string }>) {
  return (
    <div className="rounded-3xl border border-white/70 bg-gradient-to-br from-indigo-50 via-sky-50 to-pink-50 p-6 shadow-sm">
      {eyebrow && <div className="text-xs font-bold uppercase tracking-[0.24em] text-indigo-500">{eyebrow}</div>}
      <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">{title}</h1>
      {description && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>}
    </div>
  )
}

function StatusPill({ children }: Readonly<{ children: React.ReactNode }>) {
  return <span className="rounded-full border border-sky-100 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-slate-700">{children}</span>
}

export function MaterialsPage() {
  const [classId, setClassId] = useState('')
  const classes = useQuery({ queryKey: ['classes', 'materials-filter'], queryFn: () => api.classes() })
  const materials = useQuery({ queryKey: ['materials', classId], queryFn: () => api.materialsByClass(classId), enabled: Boolean(classId) })
  const classList = classes.data ?? []
  useEffect(() => { if (!classId && classes.data && classes.data.length > 0) setClassId(classes.data[0].id) }, [classId, classes.data])

  return (
    <div className="space-y-5">
      <SectionHeader title="Thư viện tài liệu" eyebrow="Thư viện tài liệu" description="Xem và tải tài liệu học tập, tệp đính kèm và liên kết ngoài theo từng lớp." />
      {classList.length > 1 && (
        <Card className="max-w-md">
          <select className="w-full rounded-xl border border-sky-100 bg-white px-3 py-2 text-sm" value={classId} onChange={(e) => setClassId(e.target.value)}>
            {classList.map((item: ClassItem) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </Card>
      )}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(materials.data ?? []).map((item) => (
          <Card key={item.id} className="rounded-3xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-bold text-slate-950">{item.title}</h2>
                <p className="mt-1 text-sm text-slate-500">{item.description || 'Tài liệu học tập'}</p>
              </div>
              <StatusPill>{item.visible ? 'Hiển thị' : 'Ẩn'}</StatusPill>
            </div>
            {item.externalUrl && <a className="mt-4 block text-sm font-semibold text-indigo-600" href={item.externalUrl} target="_blank" rel="noreferrer">Mở liên kết</a>}
            {item.fileId && <a className="mt-4 block text-sm font-semibold text-indigo-600" href={api.downloadFileUrl(item.fileId)}>Tải xuống</a>}
          </Card>
        ))}
        {classId && !materials.isLoading && (materials.data ?? []).length === 0 && <Card>Chưa có tài liệu cho lớp này.</Card>}
      </div>
    </div>
  )
}

export function GradingPage() {
  const [classId, setClassId] = useState('')
  const [selected, setSelected] = useState<SubmissionItem | null>(null)
  const [score, setScore] = useState('')
  const [feedback, setFeedback] = useState('')
  const qc = useQueryClient()
  const classes = useQuery({ queryKey: ['classes', 'grading-filter'], queryFn: () => api.classes() })
  const submissions = useQuery({ queryKey: ['grading', classId], queryFn: () => api.classGradingSubmissions(classId), enabled: Boolean(classId) })
  const grade = useMutation({
    mutationFn: () => api.gradeSubmission(selected!.id, { score: Number(score), feedback }),
    onSuccess: async () => {
      setScore('')
      setFeedback('')
      await qc.invalidateQueries({ queryKey: ['grading', classId] })
    },
  })

  return (
    <div className="space-y-5">
      <SectionHeader title="Grading Center" eyebrow="채점 센터" description="Không gian chấm bài dạng split view, tối ưu cho giáo viên/admin." />
      <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <Card className="space-y-3">
          <select className="w-full rounded-xl border border-sky-100 bg-white px-3 py-2 text-sm" value={classId} onChange={(e) => setClassId(e.target.value)}>
            <option value="">Chọn lớp</option>
            {(classes.data ?? []).map((item: ClassItem) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <div className="max-h-[560px] space-y-2 overflow-auto pr-1">
            {(submissions.data ?? []).map((item) => (
              <button key={item.id} className="w-full rounded-2xl border border-sky-100 bg-white p-3 text-left hover:bg-sky-50" onClick={() => setSelected(item)}>
                <div className="text-sm font-bold text-slate-900">{item.studentName}</div>
                <div className="mt-1 text-xs text-slate-500">{item.assignmentTitle}</div>
                <StatusPill>{item.status}</StatusPill>
              </button>
            ))}
          </div>
        </Card>
        <Card className="min-h-[520px] rounded-3xl">
          {!selected ? <div className="text-sm text-slate-500">Chọn một bài nộp để bắt đầu chấm.</div> : (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-black">{selected.assignmentTitle}</h2>
                <p className="text-sm text-slate-500">{selected.studentName} · {selected.className}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">{selected.contentText || 'Không có nội dung văn bản.'}</div>
              {selected.contentUrl && <a className="text-sm font-semibold text-indigo-600" href={selected.contentUrl} target="_blank" rel="noreferrer">Mở URL bài làm</a>}
              {selected.fileId && <a className="block text-sm font-semibold text-indigo-600" href={api.downloadFileUrl(selected.fileId)}>Tải file bài làm</a>}
              <Input placeholder="Điểm" value={score} onChange={(e) => setScore(e.target.value)} />
              <TextArea rows={5} placeholder="Phản hồi" value={feedback} onChange={(e) => setFeedback(e.target.value)} />
              <Button disabled={!score || grade.isPending} onClick={() => grade.mutate()}>Lưu điểm</Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

export function AttendancePage() {
  const [classId, setClassId] = useState('')
  const classes = useQuery({ queryKey: ['classes', 'attendance-filter'], queryFn: () => api.classes() })
  const summary = useQuery({ queryKey: ['attendance-summary', classId], queryFn: () => api.attendanceSummary(classId), enabled: Boolean(classId) })

  return (
    <div className="space-y-5">
      <SectionHeader title="Điểm danh" eyebrow="출석 관리" description="Theo dõi tỷ lệ chuyên cần, vắng, muộn và lịch sử điểm danh theo lớp." />
      <Card>
        <select className="w-full rounded-xl border border-sky-100 bg-white px-3 py-2 text-sm" value={classId} onChange={(e) => setClassId(e.target.value)}>
          <option value="">Chọn lớp học</option>
          {(classes.data ?? []).map((item: ClassItem) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </Card>
      <div className="grid gap-4 md:grid-cols-3">
        <Card><div className="text-xs text-slate-500">Tổng buổi</div><div className="mt-1 text-3xl font-black">{summary.data?.totalLessons ?? 0}</div></Card>
        <Card><div className="text-xs text-slate-500">Tỷ lệ chuyên cần</div><div className="mt-1 text-3xl font-black">{Math.round(summary.data?.attendanceRate ?? 0)}%</div></Card>
        <Card><div className="text-xs text-slate-500">Học viên</div><div className="mt-1 text-3xl font-black">{summary.data?.studentAttendance?.length ?? 0}</div></Card>
      </div>
    </div>
  )
}

export function CalendarPage() {
  const today = new Date()
  const from = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10)
  const to = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10)
  const calendar = useQuery({ queryKey: ['calendar', from, to], queryFn: () => api.calendar({ from, to }) })
  const events = useMemo(() => calendar.data?.events ?? [], [calendar.data])

  return (
    <div className="space-y-5">
      <SectionHeader title="Lịch học" eyebrow="학습 캘린더" description="Tổng hợp lịch buổi học và hạn nộp bài trong tháng." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {events.map((event: CalendarEvent) => (
          <Card key={`${event.type}-${event.id}`} className="rounded-3xl">
            <StatusPill>{event.type === 'LESSON' ? 'Buổi học' : 'Hạn bài tập'}</StatusPill>
            <h2 className="mt-3 font-bold text-slate-950">{event.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{event.className}</p>
            <p className="mt-3 text-sm font-semibold text-indigo-600">{event.date || event.dueAt}</p>
          </Card>
        ))}
        {!calendar.isLoading && events.length === 0 && <Card>Không có sự kiện trong tháng này.</Card>}
      </div>
    </div>
  )
}

export function StudentSubmissionsPage() {
  const query = useQuery({ queryKey: ['me', 'submissions'], queryFn: () => api.mySubmissions() })
  return (
    <div className="space-y-5">
      <SectionHeader title="Bài nộp của tôi" eyebrow="내 제출" description="Theo dõi bài đã nộp, điểm số và phản hồi từ giáo viên." />
      <div className="space-y-3">
        {(query.data ?? []).map((item: SubmissionItem) => (
          <Card key={item.id} className="rounded-3xl">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><h2 className="font-bold">{item.assignmentTitle}</h2><p className="text-sm text-slate-500">{item.className}</p></div>
              <StatusPill>{item.status}</StatusPill>
            </div>
            {item.score != null && <div className="mt-3 text-sm font-bold text-emerald-600">Điểm: {item.score}/{item.maxScore}</div>}
            {item.feedback && <p className="mt-2 text-sm text-slate-600">{item.feedback}</p>}
          </Card>
        ))}
      </div>
    </div>
  )
}

export function ProfilePage() {
  const me = useQuery({ queryKey: ['me'], queryFn: api.me })
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const qc = useQueryClient()
  const update = useMutation({ mutationFn: () => api.updateMe({ fullName: fullName || me.data?.fullName, phone }), onSuccess: async () => qc.invalidateQueries({ queryKey: ['me'] }) })

  return (
    <div className="space-y-5">
      <SectionHeader title="Hồ sơ cá nhân" eyebrow="Hồ sơ" description="Cập nhật thông tin cá nhân và bảo mật tài khoản." />
      <Card className="max-w-2xl space-y-3 rounded-3xl">
        <Input placeholder={me.data?.fullName || 'Họ tên'} value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <Input placeholder={me.data?.phone || 'Số điện thoại'} value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Button onClick={() => update.mutate()} disabled={update.isPending}>Lưu hồ sơ</Button>
      </Card>
    </div>
  )
}

export function StudentAssignmentSubmitPage() {
  const [assignmentId, setAssignmentId] = useState('')
  const [contentText, setContentText] = useState('')
  const [contentUrl, setContentUrl] = useState('')
  const assignments = useQuery({ queryKey: ['assignments', 'student-submit'], queryFn: () => api.assignments() })
  const selected = useMemo(() => (assignments.data ?? []).find((item: AssignmentItem) => item.id === assignmentId), [assignmentId, assignments.data])
  const submit = useMutation({ mutationFn: () => api.submitAssignment(assignmentId, { contentText: contentText || undefined, contentUrl: contentUrl || undefined }) })

  return (
    <div className="space-y-5">
      <SectionHeader title="Nộp bài" eyebrow="Nộp bài" description="Chọn bài tập đang mở và gửi nội dung bài làm." />
      <Card className="max-w-3xl space-y-3 rounded-3xl">
        <select className="w-full rounded-xl border border-sky-100 bg-white px-3 py-2 text-sm" value={assignmentId} onChange={(e) => setAssignmentId(e.target.value)}>
          <option value="">Chọn bài tập</option>
          {(assignments.data ?? []).map((item: AssignmentItem) => <option key={item.id} value={item.id}>{item.title}</option>)}
        </select>
        {selected && (
          <div className="rounded-2xl bg-sky-50 p-4 space-y-2">
            <h2 className="font-black text-slate-950">{selected.title}</h2>
            <p className="text-sm leading-6 text-slate-600">{selected.description || selected.instruction || 'Chưa có hướng dẫn chi tiết.'}</p>
            <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-600">
              {selected.dueAt && <span className="rounded-full bg-white px-3 py-1">Hạn: {fmtDate(selected.dueAt)}</span>}
              <span className="rounded-full bg-white px-3 py-1">Điểm tối đa: {selected.maxScore}</span>
              {selected.skill && <span className="rounded-xl bg-violet-50 px-2 py-0.5 text-violet-700">{selected.skill}</span>}
            </div>
            {selected.externalLink && <a className="inline-flex items-center gap-1 text-sm font-bold text-indigo-600" href={selected.externalLink} target="_blank" rel="noreferrer"><ExternalLink size={14} />Tài liệu tham khảo</a>}
            {selected.fileId && <a className="inline-flex items-center gap-1 text-sm font-bold text-indigo-600" href={api.downloadFileUrl(selected.fileId)}><Download size={14} />Tải tệp đính kèm</a>}
          </div>
        )}
        <TextArea rows={6} placeholder="Nội dung bài làm" value={contentText} onChange={(e) => setContentText(e.target.value)} />
        <Input placeholder="URL bài làm ngoài (nếu có)" value={contentUrl} onChange={(e) => setContentUrl(e.target.value)} />
        <Button disabled={!assignmentId || (!contentText.trim() && !contentUrl.trim()) || submit.isPending} onClick={() => submit.mutate()}>Gửi bài</Button>
      </Card>
    </div>
  )
}

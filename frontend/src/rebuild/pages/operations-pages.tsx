import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Download, ExternalLink, Eye, FileText, Link2, Upload } from 'lucide-react'
import { api } from '../core/api'
import { FilePreviewModal } from '../components/file-preview-modal'
import { Button, Card, Input, TextArea } from '../layout/ui'
import { EmptyState } from '../components/foundation'
import { fmtDate, getStudentAvatarUrl, studentAvatarSeed } from './phase2-utils'
import type { AssignmentItem, ClassItem } from '../core/types'

function SectionHeader({ title, eyebrow, description }: Readonly<{ title: string; eyebrow?: string; description?: string }>) {
  return (
    <div className="rounded-3xl border border-white/70 bg-gradient-to-br from-indigo-50 via-sky-50 to-pink-50 p-6 shadow-sm">
      {eyebrow && <div className="text-xs font-bold uppercase tracking-[0.08em] text-indigo-500">{eyebrow}</div>}
      <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{title}</h1>
      {description && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>}
    </div>
  )
}

export function MaterialsPage() {
  const [classId, setClassId] = useState('')
  const [previewFile, setPreviewFile] = useState<{ id: string; name: string; type?: string } | null>(null)
  const classes = useQuery({ queryKey: ['classes', 'materials-filter'], queryFn: () => api.classes() })
  const materials = useQuery({ queryKey: ['materials', classId], queryFn: () => api.materialsByClass(classId), enabled: Boolean(classId) })
  const classList = classes.data ?? []
  useEffect(() => { if (!classId && classes.data && classes.data.length > 0) setClassId(classes.data[0].id) }, [classId, classes.data])

  return (
    <div className="space-y-5 pb-20 md:pb-0">
      <SectionHeader title="Thư viện tài liệu" eyebrow="Thư viện tài liệu" description="Xem và tải tài liệu học tập, tệp đính kèm và liên kết ngoài theo từng lớp." />
      {classList.length > 1 && (
        <Card className="max-w-md">
          <select className="w-full rounded-xl border border-sky-100 bg-white px-3 py-2 text-sm" value={classId} onChange={(e) => setClassId(e.target.value)}>
            {classList.map((item: ClassItem) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </Card>
      )}
      <div className="overflow-hidden rounded-2xl border border-sky-100">
        <table className="w-full text-left text-sm">
          <thead className="bg-sky-50/60 text-xs font-bold uppercase tracking-wider text-slate-500">
            <tr><th className="px-4 py-3">Tài liệu</th><th className="hidden px-4 py-3 md:table-cell">Mô tả</th><th className="hidden px-4 py-3 sm:table-cell">Ngày đăng</th><th className="px-4 py-3 text-right">Thao tác</th></tr>
          </thead>
          <tbody className="divide-y divide-sky-50">
            {(materials.data ?? []).map((item) => (
              <tr key={item.id} className="transition hover:bg-sky-50/40">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600">{item.externalUrl ? <Link2 size={16} /> : <FileText size={16} />}</div>
                    <span className="min-w-0 truncate font-bold text-slate-900">{item.title}</span>
                  </div>
                </td>
                <td className="hidden max-w-xs truncate px-4 py-3 text-slate-500 md:table-cell">{item.description || '—'}</td>
                <td className="hidden whitespace-nowrap px-4 py-3 text-slate-400 sm:table-cell">{fmtDate(item.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    {item.externalUrl && <a className="inline-flex min-h-11 items-center gap-1 rounded-2xl border border-sky-200 px-3 text-sm font-bold text-slate-700 transition hover:bg-sky-50" href={item.externalUrl} target="_blank" rel="noreferrer"><ExternalLink size={16} />Liên kết</a>}
                    {item.fileId && <><a className="inline-flex min-h-11 items-center gap-1 rounded-2xl bg-indigo-600 px-3 text-sm font-bold text-white transition hover:bg-indigo-700" href={api.downloadFileUrl(item.fileId)}><Download size={16} />Tải</a><button type="button" className="inline-flex min-h-11 items-center gap-1 rounded-2xl border border-sky-200 px-3 text-sm font-bold text-slate-700 transition hover:bg-sky-50" onClick={async () => { const meta = await api.fileMetadata(item.fileId!); setPreviewFile({ id: meta.id, name: meta.originalFileName, type: meta.contentType }) }}><Eye size={16} />Xem trước</button></>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {classId && !materials.isLoading && (materials.data ?? []).length === 0 && <EmptyState title="Chưa có tài liệu" description="Tài liệu học tập sẽ xuất hiện tại đây khi giáo viên tải lên." />}
      </div>
      {previewFile && <FilePreviewModal fileId={previewFile.id} fileName={previewFile.name} contentType={previewFile.type} onClose={() => setPreviewFile(null)} />}
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

export function StudentAssignmentSubmitPage() {
  const [assignmentId, setAssignmentId] = useState('')
  const [contentText, setContentText] = useState('')
  const [contentUrl, setContentUrl] = useState('')
  const assignments = useQuery({ queryKey: ['assignments', 'student-submit'], queryFn: () => api.assignments() })
  const selected = useMemo(() => (assignments.data ?? []).find((item: AssignmentItem) => item.id === assignmentId), [assignmentId, assignments.data])
  const submit = useMutation({ mutationFn: () => api.submitAssignment(assignmentId, { contentText: contentText || undefined, contentUrl: contentUrl || undefined }) })

  return (
    <div className="space-y-5 pb-20 md:pb-0">
      <SectionHeader title="Nộp bài" eyebrow="Nộp bài" description="Chọn bài tập đang mở và gửi nội dung bài làm." />
      <Card className="max-w-3xl rounded-3xl">
        <select className="w-full rounded-xl border border-sky-100 bg-white px-3 py-2 text-sm" value={assignmentId} onChange={(e) => setAssignmentId(e.target.value)}>
          <option value="">Chọn bài tập</option>
          {(assignments.data ?? []).map((item: AssignmentItem) => <option key={item.id} value={item.id}>{item.title}</option>)}
        </select>
        {selected && (
          <div className="mt-3 rounded-2xl border border-sky-100 bg-sky-50/50 p-4 space-y-2">
            <h2 className="font-black text-slate-950">{selected.title}</h2>
            <p className="text-sm leading-6 text-slate-600">{selected.description || selected.instruction || 'Chưa có hướng dẫn chi tiết.'}</p>
            <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-600">
              {selected.dueAt && <span className="rounded-full bg-white px-3 py-1">Hạn: {fmtDate(selected.dueAt)}</span>}
              <span className="rounded-full bg-white px-3 py-1">Điểm tối đa: {selected.maxScore}</span>
              {selected.skill && <span className="rounded-xl bg-violet-50 px-2 py-0.5 text-violet-700">{selected.skill}</span>}
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {selected.externalLink && <a className="inline-flex min-h-10 items-center gap-1 rounded-2xl border border-sky-200 px-4 text-sm font-bold text-slate-700 transition hover:bg-sky-50" href={selected.externalLink} target="_blank" rel="noreferrer"><ExternalLink size={14} />Tài liệu tham khảo</a>}
              {selected.fileId && <a className="inline-flex min-h-10 items-center gap-1 rounded-2xl border border-sky-200 px-4 text-sm font-bold text-slate-700 transition hover:bg-sky-50" href={api.downloadFileUrl(selected.fileId)}><Download size={14} />Tải tệp đính kèm</a>}
            </div>
          </div>
        )}
        <div className="mt-4 space-y-3">
          <TextArea rows={6} placeholder="Nội dung bài làm" value={contentText} onChange={(e) => setContentText(e.target.value)} />
          <Input placeholder="URL bài làm ngoài (nếu có)" value={contentUrl} onChange={(e) => setContentUrl(e.target.value)} />
          <Button className="min-h-11 w-full" disabled={!assignmentId || (!contentText.trim() && !contentUrl.trim()) || submit.isPending} onClick={() => submit.mutate()}><Upload size={16} />{submit.isPending ? 'Đang gửi...' : 'Gửi bài'}</Button>
        </div>
      </Card>
    </div>
  )
}

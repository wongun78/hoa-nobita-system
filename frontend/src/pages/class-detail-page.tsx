import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useClass, useUpdateClass, useDeleteClass, useClassStudents, useAddClassStudent, useRemoveClassStudent, useUpdateClassStudentStatus, useAddClassAdmin, useRemoveClassAdmin } from '../features/classes/hooks'
import { useLessons, useCreateLesson, useDeleteLesson, useUpdateLesson } from '../features/lessons/hooks'
import { useMaterials, useCreateMaterial, useDeleteMaterial, useUpdateMaterial, useUpdateVisibility } from '../features/materials/hooks'
import { useAssignments, useCreateAssignment, useDeleteAssignment, useCopyAssignment, usePublishAssignment, useCloseAssignment, useUpdateAssignment } from '../features/assignments/hooks'
import { useUsers } from '../features/users/hooks'
import { useAuth } from '../features/auth/use-auth'
import { Tabs } from '../components/ui/tabs'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Dialog } from '../components/ui/dialog'
import { FormField } from '../components/ui/form'
import { ConfirmDialog } from '../components/ui/confirm-dialog'
import { Select } from '../components/ui/select'
import { AssignmentStatusBadge, DeadlinePill } from '../features/assignments/components/assignment-badges'
import { AssignmentFormDialog } from '../features/assignments/components/assignment-form-dialog'
import { FileUploadField } from '../features/files/components/file-upload-field'
import { useDownloadFile } from '../features/files/hooks'

const lessonSchema = z.object({ title: z.string().min(2), description: z.string().optional(), lessonDate: z.string().optional(), orderIndex: z.number().min(0).default(1), status: z.enum(['DRAFT','PUBLISHED','ARCHIVED']).default('PUBLISHED') })
const materialSchema = z.object({ title: z.string().min(2), description: z.string().optional(), externalUrl: z.string().url("URL không hợp lệ").optional().or(z.literal('')), fileId: z.string().optional(), visible: z.boolean().default(true) }).refine(data => data.externalUrl || data.fileId, { message: "Vui lòng cung cấp URL hoặc tải tệp lên", path: ["externalUrl"] })
const classSchema = z.object({ name: z.string().min(2), code: z.string().min(2), description: z.string().optional(), levelFrom: z.number().min(1).max(6), levelTo: z.number().min(1).max(6), status: z.enum(['ACTIVE','ARCHIVED']).default('ACTIVE'), startDate: z.string().optional(), endDate: z.string().optional() }).refine(data => data.levelFrom <= data.levelTo, { message: "Level from must be <= level to", path: ["levelFrom"] })
const addMemberSchema = z.object({ userId: z.string().min(1, "Vui lòng chọn người dùng") })

export function ClassDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { hasRole } = useAuth()
  const { data: cls } = useClass(id)
  const lessons = useLessons(id)
  const materials = useMaterials(id)
  const assignments = useAssignments(id)
  const students = useClassStudents(id)
  const users = useUsers()

  const createLesson = useCreateLesson(id)
  const updateLesson = useUpdateLesson(id)
  const delLesson = useDeleteLesson(id)
  const createMaterial = useCreateMaterial(id)
  const updateMaterial = useUpdateMaterial(id)
  const delMaterial = useDeleteMaterial(id)
  const toggleVisibility = useUpdateVisibility(id)
  const downloadFile = useDownloadFile()
  const createAssignment = useCreateAssignment(id)
  const updateAssignment = useUpdateAssignment()
  const deleteAssignment = useDeleteAssignment()
  const copyAssignment = useCopyAssignment()
  const publishAssignment = usePublishAssignment()
  const closeAssignment = useCloseAssignment()
  const updateClass = useUpdateClass()
  const deleteClass = useDeleteClass()
  const addStudent = useAddClassStudent(id)
  const removeStudent = useRemoveClassStudent(id)
  const updateStudentStatus = useUpdateClassStudentStatus(id)
  const addAdmin = useAddClassAdmin(id)
  const removeAdmin = useRemoveClassAdmin(id)

  const [tab, setTab] = useState('lessons')
  const [lessonOpen, setLessonOpen] = useState(false)
  const [editLessonOpen, setEditLessonOpen] = useState<any | null>(null)
  const [matOpen, setMatOpen] = useState(false)
  const [matMode, setMatMode] = useState<'url' | 'file'>('url')
  const [editMatOpen, setEditMatOpen] = useState<any | null>(null)
  const [editMatMode, setEditMatMode] = useState<'url' | 'file'>('url')
  const [assignOpen, setAssignOpen] = useState(false)
  const [editAssignOpen, setEditAssignOpen] = useState<any | null>(null)
  const [studentOpen, setStudentOpen] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)
  const [confirmLesson, setConfirmLesson] = useState<string|null>(null)
  const [confirmMat, setConfirmMat] = useState<string|null>(null)
  const [confirmAssign, setConfirmAssign] = useState<string|null>(null)
  const [confirmStudent, setConfirmStudent] = useState<string|null>(null)
  const [confirmAdmin, setConfirmAdmin] = useState<string|null>(null)
  const [confirmClass, setConfirmClass] = useState(false)

  const lessonForm = useForm({ resolver: zodResolver(lessonSchema), defaultValues: { title: '', description: '', lessonDate: '', orderIndex: 1, status: 'PUBLISHED' as const } })
  const editLessonForm = useForm({ resolver: zodResolver(lessonSchema), defaultValues: { title: '', description: '', lessonDate: '', orderIndex: 1, status: 'PUBLISHED' as const } })
  const matForm = useForm({ resolver: zodResolver(materialSchema), defaultValues: { title: '', description: '', externalUrl: '', fileId: '', visible: true } })
  const editMatForm = useForm({ resolver: zodResolver(materialSchema), defaultValues: { title: '', description: '', externalUrl: '', fileId: '', visible: true } })
  const classForm = useForm({ resolver: zodResolver(classSchema), values: cls ? { name: cls.name, code: cls.code, description: cls.description || '', levelFrom: cls.levelFrom, levelTo: cls.levelTo, status: cls.status, startDate: cls.startDate || '', endDate: cls.endDate || '' } : undefined })
  const studentForm = useForm({ resolver: zodResolver(addMemberSchema), defaultValues: { userId: '' } })
  const adminForm = useForm({ resolver: zodResolver(addMemberSchema), defaultValues: { userId: '' } })

  const isTeacher = hasRole('TEACHER_OWNER')
  const isAdmin = hasRole('CLASS_ADMIN')
  const canManage = isTeacher || isAdmin

  const tabs = [
    { id: 'lessons', label: 'Buổi học' },
    { id: 'materials', label: 'Tài liệu' },
    { id: 'assignments', label: 'Bài tập' },
    { id: 'grading', label: 'Chấm bài' },
    ...(canManage ? [{ id: 'students', label: 'Học viên' }, { id: 'settings', label: 'Cài đặt' }] : []),
  ]

  const availableStudents = users.data?.filter(u => u.roles.includes('STUDENT') && !students.data?.some(s => s.id === u.id)) || []
  const availableAdmins = users.data?.filter(u => u.roles.includes('CLASS_ADMIN') && !cls?.admins?.some(a => a.id === u.id)) || []

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1E3A8A]">{cls?.name}</h1>
          <p className="text-slate-500 mt-1">{cls?.code} • Level {cls?.levelFrom}-{cls?.levelTo} • {cls?.status}</p>
        </div>
        <div className="flex gap-2">
          {canManage && <Button variant="outline" onClick={() => setTab('settings')}>Sửa lớp</Button>}
          {isTeacher && <Button variant="outline" onClick={() => setAdminOpen(true)}>Gán admin</Button>}
          {canManage && <Button variant="outline" onClick={() => setStudentOpen(true)}>Thêm học viên</Button>}
          <Button variant="outline" onClick={() => { setTab('assignments'); navigate(`/classes/${id}/assignments`); }}>Bài tập lớp</Button>
          <Button variant="outline" onClick={() => { setTab('materials'); navigate(`/classes/${id}/materials`); }}>Tài liệu</Button>
        </div>
      </div>

      <Tabs tabs={tabs} active={tab} onChange={setTab}>
        {tab === 'lessons' && (
          <div className="space-y-4">
            <div className="flex justify-between"><div className="text-sm text-slate-500">Danh sách buổi học</div>{canManage && <Button onClick={() => setLessonOpen(true)}>+ Tạo buổi học</Button>}</div>
            {lessons.data?.length === 0 && <div className="text-slate-500 text-sm">Lớp này chưa có buổi học nào.</div>}
            <div className="grid gap-4">
              {lessons.data?.sort((a, b) => a.orderIndex - b.orderIndex).map(l => (
                <Card key={l.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-lg">Buổi {String(l.orderIndex).padStart(2, '0')}: {l.title}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${l.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' : l.status === 'DRAFT' ? 'bg-slate-100 text-slate-800' : 'bg-gray-100 text-gray-800'}`}>{l.status}</span>
                    </div>
                    {l.description && <div className="text-sm text-slate-600 mt-1">{l.description}</div>}
                    {l.lessonDate && <div className="text-xs text-slate-500 mt-1">Ngày học: {new Date(l.lessonDate).toLocaleDateString('vi-VN')}</div>}
                  </div>
                  {canManage && (
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => {
                        editLessonForm.reset({ title: l.title, description: l.description || '', lessonDate: l.lessonDate || '', orderIndex: l.orderIndex, status: l.status })
                        setEditLessonOpen(l)
                      }}>Sửa</Button>
                      <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setConfirmLesson(l.id)}>Xóa</Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}
        {tab === 'materials' && (
          <div className="space-y-4">
            <div className="flex justify-between"><div className="text-sm text-slate-500">Tài liệu lớp</div>{canManage && <Button onClick={() => { setMatMode('url'); setMatOpen(true); }}>+ Thêm tài liệu</Button>}</div>
            {materials.data?.length === 0 && <div className="text-slate-500 text-sm">Lớp này chưa có tài liệu nào.</div>}
            <div className="grid gap-4">
              {materials.data?.map(m => (
                <Card key={m.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-lg">{m.title}</span>
                      <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">{m.fileId ? 'Tệp' : 'Liên kết'}</span>
                      {!m.visible && <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-800">Đang ẩn</span>}
                    </div>
                    {m.description && <div className="text-sm text-slate-600 mt-1">{m.description}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    {m.externalUrl && <a href={m.externalUrl} target="_blank" rel="noopener noreferrer"><Button variant="outline" size="sm">Mở liên kết</Button></a>}
                    {m.fileId && <Button variant="outline" size="sm" onClick={() => downloadFile.mutate({ fileId: m.fileId!, fileName: m.fileName || m.title })} disabled={downloadFile.isPending}>Tải xuống</Button>}
                    {canManage && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => toggleVisibility.mutate({ id: m.id, visible: !m.visible })}>
                          {m.visible ? 'Ẩn' : 'Hiện'}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => {
                          setEditMatMode(m.fileId ? 'file' : 'url')
                          editMatForm.reset({ title: m.title, description: m.description || '', externalUrl: m.externalUrl || '', fileId: m.fileId || '', visible: m.visible })
                          setEditMatOpen(m)
                        }}>Sửa</Button>
                        <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setConfirmMat(m.id)}>Xóa</Button>
                      </>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
        {tab === 'assignments' && (
          <div className="space-y-4">
            <div className="flex justify-between"><div className="text-sm text-slate-500">Bài tập của lớp</div>{canManage && <Button onClick={() => setAssignOpen(true)}>+ Tạo bài tập</Button>}</div>
            {assignments.data?.length === 0 && <div className="text-slate-500 text-sm">Chưa có bài tập.</div>}
            <div className="grid gap-4">
              {assignments.data?.map(a => (
                <Card key={a.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Link to={`/assignments/${a.id}`} className="font-medium text-[#3B82F6] hover:underline text-lg">{a.title}</Link>
                      <AssignmentStatusBadge status={a.status} />
                    </div>
                    <div className="text-sm text-slate-500 flex items-center gap-3">
                      <span>Điểm: {a.maxScore}</span>
                      <DeadlinePill dueAt={a.dueAt} status={a.status} />
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <Link to={`/assignments/${a.id}`}><Button variant="outline" size="sm">Xem</Button></Link>
                    
                    {canManage && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => setEditAssignOpen(a)}>Sửa</Button>
                        {a.status === 'DRAFT' && <Button variant="outline" size="sm" onClick={() => publishAssignment.mutateAsync(a.id)}>Xuất bản</Button>}
                        {a.status === 'PUBLISHED' && <Button variant="outline" size="sm" onClick={() => closeAssignment.mutateAsync(a.id)}>Đóng</Button>}
                        <Button variant="outline" size="sm" onClick={() => copyAssignment.mutateAsync(a.id).then(res => navigate(`/assignments/${res.id}`))}>Sao chép</Button>
                        <Link to={`/assignments/${a.id}/submissions`}><Button variant="outline" size="sm">Xem bài nộp</Button></Link>
                        <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setConfirmAssign(a.id)}>Xóa</Button>
                      </>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
        {tab === 'grading' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-slate-500">Danh sách bài nộp chờ chấm của lớp</div>
              <Link to="/grading"><Button>Đến trung tâm chấm bài</Button></Link>
            </div>
            <div className="text-sm text-slate-600 p-4 bg-blue-50 rounded border border-blue-100">
              Tính năng chấm bài đã được chuyển sang giao diện Split-view chuyên dụng. Vui lòng truy cập Trung tâm chấm bài để có trải nghiệm tốt nhất.
            </div>
          </div>
        )}
        {tab === 'students' && canManage && (
          <div className="space-y-4">
            <div className="flex justify-between"><div className="text-sm text-slate-500">Danh sách học viên</div><Button onClick={() => setStudentOpen(true)}>+ Thêm học viên</Button></div>
            {students.data?.length === 0 && <div className="text-slate-500 text-sm">Lớp này chưa có học viên nào.</div>}
            <div className="grid gap-3">
              {students.data?.map(s => (
                <Card key={s.id} className="p-4 flex justify-between items-center">
                  <div>
                    <div className="font-medium">{s.fullName}</div>
                    <div className="text-xs text-slate-500">{s.email} • Tham gia: {new Date(s.joinedAt).toLocaleDateString('vi-VN')}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Select value={s.status} onChange={e => updateStudentStatus.mutate({ studentId: s.id, status: e.target.value as any })} className="w-32">
                      <option value="ACTIVE">Đang học</option>
                      <option value="PAUSED">Bảo lưu</option>
                      <option value="REMOVED">Đã xóa</option>
                    </Select>
                    <button onClick={() => setConfirmStudent(s.id)} className="text-red-600 text-sm">Xóa</button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
        {tab === 'settings' && canManage && (
          <div className="space-y-8">
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Thông tin lớp học</h3>
              <FormProvider {...classForm}>
                <form onSubmit={classForm.handleSubmit(v => updateClass.mutate({ id, req: v as any }))} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField name="name" label="Tên lớp" />
                    <FormField name="code" label="Mã lớp" />
                  </div>
                  <FormField name="description" label="Mô tả" />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField name="levelFrom" label="Level từ">
                      <Select {...classForm.register('levelFrom', { valueAsNumber: true })}>
                        {[1,2,3,4,5,6].map(l => <option key={l} value={l}>Level {l}</option>)}
                      </Select>
                    </FormField>
                    <FormField name="levelTo" label="Level đến">
                      <Select {...classForm.register('levelTo', { valueAsNumber: true })}>
                        {[1,2,3,4,5,6].map(l => <option key={l} value={l}>Level {l}</option>)}
                      </Select>
                    </FormField>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField name="startDate" label="Ngày bắt đầu">
                      <input type="date" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" {...classForm.register('startDate')} />
                    </FormField>
                    <FormField name="endDate" label="Ngày kết thúc">
                      <input type="date" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" {...classForm.register('endDate')} />
                    </FormField>
                  </div>
                  <FormField name="status" label="Trạng thái">
                    <Select {...classForm.register('status')}>
                      <option value="ACTIVE">Đang hoạt động</option>
                      <option value="ARCHIVED">Đã lưu trữ</option>
                    </Select>
                  </FormField>
                  <div className="flex justify-end"><Button type="submit" disabled={updateClass.isPending}>Lưu thay đổi</Button></div>
                </form>
              </FormProvider>
            </Card>

            {isTeacher && (
              <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Quản lý Admin</h3>
                  <Button variant="outline" onClick={() => setAdminOpen(true)}>+ Gán Admin</Button>
                </div>
                {cls?.admins?.length === 0 && <div className="text-slate-500 text-sm">Chưa có admin nào được gán.</div>}
                <div className="grid gap-3">
                  {cls?.admins?.map(a => (
                    <div key={a.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div className="font-medium">{a.fullName}</div>
                      <button onClick={() => setConfirmAdmin(a.id)} className="text-red-600 text-sm">Xóa</button>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {isTeacher && (
              <Card className="p-6 border-red-200 bg-red-50">
                <h3 className="text-lg font-medium text-red-700 mb-2">Vùng nguy hiểm</h3>
                <p className="text-sm text-red-600 mb-4">Xóa lớp học sẽ không thể khôi phục. Tất cả dữ liệu liên quan sẽ bị xóa.</p>
                <Button variant="destructive" onClick={() => setConfirmClass(true)}>Xóa lớp học</Button>
              </Card>
            )}
          </div>
        )}
      </Tabs>

      <Dialog open={lessonOpen} onClose={() => setLessonOpen(false)} title="Thêm buổi học">
        <FormProvider {...lessonForm}>
          <form onSubmit={lessonForm.handleSubmit(v => { createLesson.mutateAsync(v as any).then(() => { setLessonOpen(false); lessonForm.reset() }) })} className="space-y-4">
            <FormField name="title" label="Tiêu đề" />
            <FormField name="description" label="Mô tả" />
            <div className="grid grid-cols-2 gap-4">
              <FormField name="orderIndex" label="Thứ tự (Buổi số)">
                <input type="number" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" {...lessonForm.register('orderIndex', { valueAsNumber: true })} />
              </FormField>
              <FormField name="lessonDate" label="Ngày học">
                <input type="date" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" {...lessonForm.register('lessonDate')} />
              </FormField>
            </div>
            <FormField name="status" label="Trạng thái">
              <Select {...lessonForm.register('status')}>
                <option value="PUBLISHED">Đã xuất bản</option>
                <option value="DRAFT">Bản nháp</option>
                <option value="ARCHIVED">Đã lưu trữ</option>
              </Select>
            </FormField>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setLessonOpen(false)}>Hủy</Button><Button type="submit" disabled={createLesson.isPending}>Thêm</Button></div>
          </form>
        </FormProvider>
      </Dialog>

      <Dialog open={!!editLessonOpen} onClose={() => setEditLessonOpen(null)} title="Sửa buổi học">
        <FormProvider {...editLessonForm}>
          <form onSubmit={editLessonForm.handleSubmit(v => { updateLesson.mutateAsync({ id: editLessonOpen.id, req: v as any }).then(() => setEditLessonOpen(null)) })} className="space-y-4">
            <FormField name="title" label="Tiêu đề" />
            <FormField name="description" label="Mô tả" />
            <div className="grid grid-cols-2 gap-4">
              <FormField name="orderIndex" label="Thứ tự (Buổi số)">
                <input type="number" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" {...editLessonForm.register('orderIndex', { valueAsNumber: true })} />
              </FormField>
              <FormField name="lessonDate" label="Ngày học">
                <input type="date" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" {...editLessonForm.register('lessonDate')} />
              </FormField>
            </div>
            <FormField name="status" label="Trạng thái">
              <Select {...editLessonForm.register('status')}>
                <option value="PUBLISHED">Đã xuất bản</option>
                <option value="DRAFT">Bản nháp</option>
                <option value="ARCHIVED">Đã lưu trữ</option>
              </Select>
            </FormField>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setEditLessonOpen(null)}>Hủy</Button><Button type="submit" disabled={updateLesson.isPending}>Lưu thay đổi</Button></div>
          </form>
        </FormProvider>
      </Dialog>

      <Dialog open={matOpen} onClose={() => setMatOpen(false)} title="Thêm tài liệu">
        <div className="flex gap-4 mb-4 border-b pb-2">
          <button className={`pb-2 px-2 ${matMode === 'url' ? 'border-b-2 border-blue-600 font-medium text-blue-600' : 'text-slate-500'}`} onClick={() => { setMatMode('url'); matForm.setValue('fileId', ''); }}>Liên kết ngoài</button>
          <button className={`pb-2 px-2 ${matMode === 'file' ? 'border-b-2 border-blue-600 font-medium text-blue-600' : 'text-slate-500'}`} onClick={() => { setMatMode('file'); matForm.setValue('externalUrl', ''); }}>Tệp tải lên</button>
        </div>
        <FormProvider {...matForm}>
          <form onSubmit={matForm.handleSubmit(v => { createMaterial.mutateAsync(v as any).then(() => { setMatOpen(false); matForm.reset() }) })} className="space-y-4">
            <FormField name="title" label="Tiêu đề" />
            <FormField name="description" label="Mô tả" />
            
            {matMode === 'url' ? (
              <FormField name="externalUrl" label="URL" />
            ) : (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Tệp đính kèm</label>
                <FileUploadField onUploadSuccess={(id) => matForm.setValue('fileId', id, { shouldValidate: true })} />
                {matForm.formState.errors.externalUrl && <p className="text-sm text-red-600">{matForm.formState.errors.externalUrl.message as string}</p>}
              </div>
            )}

            <FormField name="visible" label="Hiển thị với học viên">
              <Select {...matForm.register('visible', { setValueAs: v => v === 'true' })}>
                <option value="true">Có</option>
                <option value="false">Không</option>
              </Select>
            </FormField>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setMatOpen(false)}>Hủy</Button><Button type="submit" disabled={createMaterial.isPending || (matMode === 'file' && !matForm.watch('fileId'))}>Thêm</Button></div>
          </form>
        </FormProvider>
      </Dialog>

      <Dialog open={!!editMatOpen} onClose={() => setEditMatOpen(null)} title="Sửa tài liệu">
        <div className="flex gap-4 mb-4 border-b pb-2">
          <button className={`pb-2 px-2 ${editMatMode === 'url' ? 'border-b-2 border-blue-600 font-medium text-blue-600' : 'text-slate-500'}`} onClick={() => { setEditMatMode('url'); editMatForm.setValue('fileId', ''); }}>Liên kết ngoài</button>
          <button className={`pb-2 px-2 ${editMatMode === 'file' ? 'border-b-2 border-blue-600 font-medium text-blue-600' : 'text-slate-500'}`} onClick={() => { setEditMatMode('file'); editMatForm.setValue('externalUrl', ''); }}>Tệp tải lên</button>
        </div>
        <FormProvider {...editMatForm}>
          <form onSubmit={editMatForm.handleSubmit(v => { updateMaterial.mutateAsync({ id: editMatOpen.id, req: v as any }).then(() => setEditMatOpen(null)) })} className="space-y-4">
            <FormField name="title" label="Tiêu đề" />
            <FormField name="description" label="Mô tả" />
            
            {editMatMode === 'url' ? (
              <FormField name="externalUrl" label="URL" />
            ) : (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Tệp đính kèm</label>
                {editMatForm.watch('fileId') ? (
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-slate-50">
                    <span className="text-sm text-slate-600">Đã có tệp đính kèm</span>
                    <Button type="button" variant="outline" size="sm" onClick={() => editMatForm.setValue('fileId', '', { shouldValidate: true })}>Thay đổi</Button>
                  </div>
                ) : (
                  <FileUploadField onUploadSuccess={(id) => editMatForm.setValue('fileId', id, { shouldValidate: true })} />
                )}
                {editMatForm.formState.errors.externalUrl && <p className="text-sm text-red-600">{editMatForm.formState.errors.externalUrl.message as string}</p>}
              </div>
            )}

            <FormField name="visible" label="Hiển thị với học viên">
              <Select {...editMatForm.register('visible', { setValueAs: v => v === 'true' })}>
                <option value="true">Có</option>
                <option value="false">Không</option>
              </Select>
            </FormField>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setEditMatOpen(null)}>Hủy</Button><Button type="submit" disabled={updateMaterial.isPending || (editMatMode === 'file' && !editMatForm.watch('fileId'))}>Lưu thay đổi</Button></div>
          </form>
        </FormProvider>
      </Dialog>

      <AssignmentFormDialog
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        title="Tạo bài tập"
        submitLabel="Tạo"
        onSubmit={(data) => createAssignment.mutateAsync(data)}
      />

      {editAssignOpen && (
        <AssignmentFormDialog
          open={!!editAssignOpen}
          onClose={() => setEditAssignOpen(null)}
          title="Sửa bài tập"
          submitLabel="Lưu thay đổi"
          defaultValues={editAssignOpen}
          onSubmit={(data) => updateAssignment.mutateAsync({ id: editAssignOpen.id, req: data })}
        />
      )}

      <Dialog open={studentOpen} onClose={() => setStudentOpen(false)} title="Thêm học viên">
        <FormProvider {...studentForm}>
          <form onSubmit={studentForm.handleSubmit(v => { addStudent.mutateAsync(v); setStudentOpen(false); studentForm.reset() })} className="space-y-4">
            <FormField name="userId" label="Chọn học viên">
              <Select {...studentForm.register('userId')}>
                <option value="">-- Chọn học viên --</option>
                {availableStudents.map(u => <option key={u.id} value={u.id}>{u.fullName} ({u.email})</option>)}
              </Select>
            </FormField>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setStudentOpen(false)}>Hủy</Button><Button type="submit">Thêm</Button></div>
          </form>
        </FormProvider>
      </Dialog>

      <Dialog open={adminOpen} onClose={() => setAdminOpen(false)} title="Gán Admin">
        <FormProvider {...adminForm}>
          <form onSubmit={adminForm.handleSubmit(v => { addAdmin.mutateAsync(v); setAdminOpen(false); adminForm.reset() })} className="space-y-4">
            <FormField name="userId" label="Chọn Admin">
              <Select {...adminForm.register('userId')}>
                <option value="">-- Chọn Admin --</option>
                {availableAdmins.map(u => <option key={u.id} value={u.id}>{u.fullName} ({u.email})</option>)}
              </Select>
            </FormField>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setAdminOpen(false)}>Hủy</Button><Button type="submit">Gán</Button></div>
          </form>
        </FormProvider>
      </Dialog>

      <ConfirmDialog open={!!confirmLesson} onClose={() => setConfirmLesson(null)} title="Xóa buổi học" message="Xác nhận xóa buổi học?" onConfirm={() => delLesson.mutateAsync(confirmLesson!)} destructive />
      <ConfirmDialog open={!!confirmMat} onClose={() => setConfirmMat(null)} title="Xóa tài liệu" message="Xác nhận xóa tài liệu?" onConfirm={() => delMaterial.mutateAsync(confirmMat!)} destructive />
      <ConfirmDialog open={!!confirmAssign} onClose={() => setConfirmAssign(null)} title="Xóa bài tập" message="Xác nhận xóa bài tập?" onConfirm={() => deleteAssignment.mutateAsync(confirmAssign!)} destructive />
      <ConfirmDialog open={!!confirmStudent} onClose={() => setConfirmStudent(null)} title="Xóa học viên" message="Xác nhận xóa học viên khỏi lớp?" onConfirm={() => removeStudent.mutateAsync(confirmStudent!)} destructive />
      <ConfirmDialog open={!!confirmAdmin} onClose={() => setConfirmAdmin(null)} title="Xóa Admin" message="Xác nhận xóa Admin khỏi lớp?" onConfirm={() => removeAdmin.mutateAsync(confirmAdmin!)} destructive />
      <ConfirmDialog open={confirmClass} onClose={() => setConfirmClass(false)} title="Xóa lớp học" message="Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa lớp học này?" onConfirm={() => deleteClass.mutateAsync(id).then(() => navigate('/classes'))} destructive />
    </div>
  )
}

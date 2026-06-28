import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useClass, useUpdateClass, useDeleteClass, useClassStudents, useAddClassStudent, useRemoveClassStudent, useUpdateClassStudentStatus, useAddClassAdmin, useRemoveClassAdmin } from '../features/classes/hooks'
import { useLessons, useCreateLesson, useDeleteLesson } from '../features/lessons/hooks'
import { useMaterials, useCreateMaterial, useDeleteMaterial } from '../features/materials/hooks'
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

const lessonSchema = z.object({ title: z.string().min(2), description: z.string().optional(), orderIndex: z.number().default(1), status: z.enum(['DRAFT','PUBLISHED','ARCHIVED']).default('PUBLISHED') })
const materialSchema = z.object({ title: z.string().min(2), externalUrl: z.string().url().optional(), visible: z.boolean().default(true) })
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
  const delLesson = useDeleteLesson(id)
  const createMaterial = useCreateMaterial(id)
  const delMaterial = useDeleteMaterial(id)
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
  const [matOpen, setMatOpen] = useState(false)
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

  const lessonForm = useForm({ resolver: zodResolver(lessonSchema), defaultValues: { title: '', description: '', orderIndex: 1, status: 'PUBLISHED' as const } })
  const matForm = useForm({ resolver: zodResolver(materialSchema), defaultValues: { title: '', externalUrl: '', visible: true } })
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
          <Link to={`/classes/${id}/assignments`}><Button variant="outline">Bài tập lớp</Button></Link>
          <Link to={`/classes/${id}/materials`}><Button variant="outline">Tài liệu</Button></Link>
        </div>
      </div>

      <Tabs tabs={tabs} active={tab} onChange={setTab}>
        {tab === 'lessons' && (
          <div className="space-y-4">
            <div className="flex justify-between"><div className="text-sm text-slate-500">Danh sách buổi học</div>{canManage && <Button onClick={() => setLessonOpen(true)}>+ Tạo buổi học</Button>}</div>
            {lessons.data?.length === 0 && <div className="text-slate-500 text-sm">Lớp này chưa có buổi học nào.</div>}
            {lessons.data?.map(l => (
              <Card key={l.id} className="flex justify-between items-center p-4">
                <div><div className="font-medium">{l.title}</div><div className="text-xs text-slate-500">#{l.orderIndex} • {l.status}</div></div>
                {canManage && <button onClick={() => setConfirmLesson(l.id)} className="text-red-600 text-sm">Xóa</button>}
              </Card>
            ))}
          </div>
        )}
        {tab === 'materials' && (
          <div className="space-y-4">
            <div className="flex justify-between"><div className="text-sm text-slate-500">Tài liệu lớp</div>{canManage && <Button onClick={() => setMatOpen(true)}>+ Thêm tài liệu</Button>}</div>
            {materials.data?.length === 0 && <div className="text-slate-500 text-sm">Chưa có tài liệu.</div>}
            {materials.data?.map(m => (
              <Card key={m.id} className="flex justify-between p-4">
                <div><div className="font-medium">{m.title}</div><div className="text-xs text-slate-500">{m.externalUrl || '—'} {m.visible ? '' : '(ẩn)'}</div></div>
                {canManage && <button onClick={() => setConfirmMat(m.id)} className="text-red-600 text-sm">Xóa</button>}
              </Card>
            ))}
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
          <form onSubmit={lessonForm.handleSubmit(v => { createLesson.mutateAsync(v as any); setLessonOpen(false); lessonForm.reset() })} className="space-y-4">
            <FormField name="title" label="Tiêu đề" />
            <FormField name="description" label="Mô tả" />
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setLessonOpen(false)}>Hủy</Button><Button type="submit">Thêm</Button></div>
          </form>
        </FormProvider>
      </Dialog>

      <Dialog open={matOpen} onClose={() => setMatOpen(false)} title="Thêm tài liệu">
        <FormProvider {...matForm}>
          <form onSubmit={matForm.handleSubmit(v => { createMaterial.mutateAsync(v as any); setMatOpen(false); matForm.reset() })} className="space-y-4">
            <FormField name="title" label="Tiêu đề" />
            <FormField name="externalUrl" label="URL (nếu có)" />
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setMatOpen(false)}>Hủy</Button><Button type="submit">Thêm</Button></div>
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

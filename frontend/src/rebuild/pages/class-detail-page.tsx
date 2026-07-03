import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { useNewAuth } from '../auth/use-auth'
import { api } from '../core/api'
import { Button, Card, FieldLabel, Input, TextArea } from '../layout/ui'

export function ClassDetailPage() {
  const { hasRole } = useNewAuth()
  const canManage = hasRole('TEACHER_OWNER', 'CLASS_ADMIN')
  const qc = useQueryClient()
  const params = useParams()
  const classId = params.classId ?? ''
  const [studentId, setStudentId] = useState('')
  const [adminId, setAdminId] = useState('')
  const [lessonTitle, setLessonTitle] = useState('')
  const [lessonDescription, setLessonDescription] = useState('')
  const [materialTitle, setMaterialTitle] = useState('')
  const [materialDescription, setMaterialDescription] = useState('')
  const [materialUrl, setMaterialUrl] = useState('')
  const [materialFile, setMaterialFile] = useState<File | null>(null)
  const [assignmentTitle, setAssignmentTitle] = useState('')
  const [assignmentDescription, setAssignmentDescription] = useState('')
  const [assignmentDueAt, setAssignmentDueAt] = useState('')
  const [assignmentMaxScore, setAssignmentMaxScore] = useState('100')
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  const classQuery = useQuery({ queryKey: ['class', classId], queryFn: () => api.classById(classId), enabled: classId.length > 0 })
  const statsQuery = useQuery({ queryKey: ['class', classId, 'stats'], queryFn: () => api.classStats(classId), enabled: classId.length > 0 })
  const assignmentsQuery = useQuery({ queryKey: ['class', classId, 'assignments'], queryFn: () => api.assignments(classId), enabled: classId.length > 0 })
  const studentsQuery = useQuery({ queryKey: ['class', classId, 'students'], queryFn: () => api.listClassStudents(classId), enabled: classId.length > 0 })
  const lessonsQuery = useQuery({ queryKey: ['class', classId, 'lessons'], queryFn: () => api.lessonsByClass(classId), enabled: classId.length > 0 })
  const materialsQuery = useQuery({ queryKey: ['class', classId, 'materials'], queryFn: () => api.materialsByClass(classId), enabled: classId.length > 0 })
  const activityQuery = useQuery({ queryKey: ['class', classId, 'activity'], queryFn: () => api.classActivity(classId), enabled: classId.length > 0 })
  const sortedLessons = useMemo(() => (lessonsQuery.data ?? []).slice().sort((a, b) => a.orderIndex - b.orderIndex), [lessonsQuery.data])

  const addStudentMutation = useMutation({
    mutationFn: () => api.addClassStudent(classId, { userId: studentId }),
    onSuccess: async () => {
      setStudentId('')
      setActionMessage('Đã thêm học viên vào lớp.')
      await qc.invalidateQueries({ queryKey: ['class', classId, 'students'] })
    },
  })

  const removeStudentMutation = useMutation({
    mutationFn: (id: string) => api.removeClassStudent(classId, id),
    onSuccess: async () => {
      setActionMessage('Đã gỡ học viên khỏi lớp.')
      await qc.invalidateQueries({ queryKey: ['class', classId, 'students'] })
    },
  })

  const addAdminMutation = useMutation({
    mutationFn: () => api.addClassAdmin(classId, { userId: adminId }),
    onSuccess: async () => {
      setAdminId('')
      setActionMessage('Đã thêm quản trị lớp.')
      await qc.invalidateQueries({ queryKey: ['class', classId] })
    },
  })

  const removeAdminMutation = useMutation({
    mutationFn: (id: string) => api.removeClassAdmin(classId, id),
    onSuccess: async () => {
      setActionMessage('Đã gỡ quản trị lớp.')
      await qc.invalidateQueries({ queryKey: ['class', classId] })
    },
  })

  const createLessonMutation = useMutation({
    mutationFn: () => api.createLesson(classId, { title: lessonTitle, description: lessonDescription || undefined, status: 'PUBLISHED' }),
    onSuccess: async () => {
      setLessonTitle('')
      setLessonDescription('')
      setActionMessage('Đã tạo bài học mới.')
      await qc.invalidateQueries({ queryKey: ['class', classId, 'lessons'] })
    },
  })

  const deleteLessonMutation = useMutation({
    mutationFn: (id: string) => api.deleteLesson(id),
    onSuccess: async () => {
      setActionMessage('Đã xóa bài học.')
      await qc.invalidateQueries({ queryKey: ['class', classId, 'lessons'] })
    },
  })

  const createMaterialMutation = useMutation({
    mutationFn: async () => {
      let fileId: string | undefined
      if (materialFile) {
        const uploaded = await api.uploadFile(materialFile)
        fileId = uploaded.id
      }
      return api.createMaterial(classId, {
        title: materialTitle,
        description: materialDescription || undefined,
        externalUrl: materialUrl || undefined,
        fileId,
        visible: true,
      })
    },
    onSuccess: async () => {
      setMaterialTitle('')
      setMaterialDescription('')
      setMaterialUrl('')
      setMaterialFile(null)
      setActionMessage('Đã thêm tài liệu học tập.')
      await qc.invalidateQueries({ queryKey: ['class', classId, 'materials'] })
    },
  })

  const toggleMaterialMutation = useMutation({
    mutationFn: (item: { id: string; visible: boolean }) => api.updateMaterialVisibility(item.id, !item.visible),
    onSuccess: async () => {
      setActionMessage('Đã cập nhật trạng thái hiển thị tài liệu.')
      await qc.invalidateQueries({ queryKey: ['class', classId, 'materials'] })
    },
  })

  const deleteMaterialMutation = useMutation({
    mutationFn: (id: string) => api.deleteMaterial(id),
    onSuccess: async () => {
      setActionMessage('Đã xóa tài liệu.')
      await qc.invalidateQueries({ queryKey: ['class', classId, 'materials'] })
    },
  })

  const createAssignmentMutation = useMutation({
    mutationFn: () => api.createAssignment(classId, {
      title: assignmentTitle,
      description: assignmentDescription || undefined,
      dueAt: assignmentDueAt ? new Date(assignmentDueAt).toISOString() : undefined,
      maxScore: Number(assignmentMaxScore || '100'),
      status: 'PUBLISHED',
      allowResubmit: true,
    }),
    onSuccess: async () => {
      setAssignmentTitle('')
      setAssignmentDescription('')
      setAssignmentDueAt('')
      setAssignmentMaxScore('100')
      setActionMessage('Đã tạo bài tập mới.')
      await qc.invalidateQueries({ queryKey: ['class', classId, 'assignments'] })
      await qc.invalidateQueries({ queryKey: ['class', classId, 'stats'] })
    },
  })

  const publishAssignmentMutation = useMutation({
    mutationFn: (assignmentId: string) => api.publishAssignment(assignmentId),
    onSuccess: async () => {
      setActionMessage('Đã phát hành bài tập.')
      await qc.invalidateQueries({ queryKey: ['class', classId, 'assignments'] })
    },
  })

  const closeAssignmentMutation = useMutation({
    mutationFn: (assignmentId: string) => api.closeAssignment(assignmentId),
    onSuccess: async () => {
      setActionMessage('Đã đóng bài tập.')
      await qc.invalidateQueries({ queryKey: ['class', classId, 'assignments'] })
    },
  })

  const deleteAssignmentMutation = useMutation({
    mutationFn: (assignmentId: string) => api.deleteAssignment(assignmentId),
    onSuccess: async () => {
      setActionMessage('Đã xóa bài tập.')
      await qc.invalidateQueries({ queryKey: ['class', classId, 'assignments'] })
      await qc.invalidateQueries({ queryKey: ['class', classId, 'stats'] })
    },
  })

  const sendBulkReminderMutation = useMutation({
    mutationFn: () => api.sendClassAssignmentReminders(classId),
    onSuccess: (payload) => {
      setActionMessage(`Đã gửi nhắc hạn cho ${payload.totalRecipients} học viên.`)
    },
  })

  const isLoading = classQuery.isLoading || statsQuery.isLoading || assignmentsQuery.isLoading || studentsQuery.isLoading || lessonsQuery.isLoading || materialsQuery.isLoading

  if (isLoading) {
    return <div className="text-sm text-slate-500">Đang tải dữ liệu lớp học...</div>
  }

  if (
    classQuery.isError ||
    !classQuery.data ||
    statsQuery.isError ||
    !statsQuery.data ||
    assignmentsQuery.isError ||
    !assignmentsQuery.data ||
    studentsQuery.isError ||
    !studentsQuery.data ||
    lessonsQuery.isError ||
    !lessonsQuery.data ||
    materialsQuery.isError ||
    !materialsQuery.data
  ) {
    return <div className="text-sm text-rose-600">Không thể tải dữ liệu lớp học.</div>
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="text-xs uppercase tracking-wide text-slate-500">{classQuery.data.code}</div>
        <h1 className="mt-1 text-2xl font-bold">{classQuery.data.name}</h1>
        <div className="mt-2 text-sm text-slate-500">Giảng viên: {classQuery.data.teacherName}</div>

        {canManage && (
          <div className="mt-4 rounded-xl border border-sky-100 bg-sky-50 p-3">
            <div className="text-sm font-semibold">Quản trị lớp</div>
            <form
              className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]"
              onSubmit={(event) => {
                event.preventDefault()
                if (!adminId) return
                addAdminMutation.mutate()
              }}
            >
              <Input value={adminId} onChange={(e) => setAdminId(e.target.value)} placeholder="Nhập userId quản trị lớp" />
              <Button disabled={addAdminMutation.isPending}>Thêm quản trị</Button>
            </form>
            <div className="mt-3 flex flex-wrap gap-2">
              {classQuery.data.admins.map((admin) => (
                <div key={admin.id} className="flex items-center gap-2 rounded-xl border border-sky-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                  <span>{admin.fullName}</span>
                  <button
                    className="rounded border border-slate-200 px-2 py-0.5 text-[10px]"
                    onClick={() => {
                      if (!globalThis.confirm('Bạn chắc chắn muốn gỡ quản trị lớp này?')) return
                      removeAdminMutation.mutate(admin.id)
                    }}
                    disabled={removeAdminMutation.isPending}
                  >
                    Gỡ
                  </button>
                </div>
              ))}
              {classQuery.data.admins.length === 0 && <div className="text-xs text-slate-500">Chưa có quản trị lớp phụ trách.</div>}
            </div>
          </div>
        )}
      </Card>

      {actionMessage && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{actionMessage}</div>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card><div className="text-xs text-slate-500">Học viên</div><div className="text-3xl font-bold">{statsQuery.data.totalStudents}</div></Card>
        <Card><div className="text-xs text-slate-500">Bài tập</div><div className="text-3xl font-bold">{statsQuery.data.totalAssignments}</div></Card>
        <Card><div className="text-xs text-slate-500">Tỷ lệ nộp</div><div className="text-3xl font-bold">{Math.round(statsQuery.data.submissionRate)}%</div></Card>
        <Card><div className="text-xs text-slate-500">Điểm trung bình</div><div className="text-3xl font-bold">{Number(statsQuery.data.averageScore || 0).toFixed(1)}</div></Card>
      </div>

      <Card>
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold">Học viên trong lớp</h2>
        </div>

        {canManage && (
          <form
            className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]"
            onSubmit={(event) => {
              event.preventDefault()
              if (!studentId) return
              addStudentMutation.mutate()
            }}
          >
            <Input value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="Nhập userId học viên" />
            <Button disabled={addStudentMutation.isPending}>Thêm học viên</Button>
          </form>
        )}

        <div className="mt-3 divide-y divide-sky-50">
          {studentsQuery.data.map((student) => (
            <div key={student.id} className="flex items-center justify-between gap-3 py-2">
              <div>
                <div className="font-semibold">{student.fullName}</div>
                <div className="text-xs text-slate-500">{student.email || 'Không có email'} • {student.status}</div>
              </div>
              {canManage && (
                <Button variant="secondary" onClick={() => removeStudentMutation.mutate(student.id)} disabled={removeStudentMutation.isPending}>
                  Gỡ
                </Button>
              )}
            </div>
          ))}
          {studentsQuery.data.length === 0 && <div className="py-3 text-sm text-slate-500">Chưa có học viên trong lớp.</div>}
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold">Bài học</h2>
          {canManage && (
            <form
              className="mt-3 space-y-2"
              onSubmit={(event) => {
                event.preventDefault()
                if (!lessonTitle) return
                createLessonMutation.mutate()
              }}
            >
              <Input value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)} placeholder="Tên bài học" required />
              <TextArea rows={3} value={lessonDescription} onChange={(e) => setLessonDescription(e.target.value)} placeholder="Mô tả" />
              <Button disabled={createLessonMutation.isPending}>Tạo bài học</Button>
            </form>
          )}

          <div className="mt-3 divide-y divide-sky-50">
            {sortedLessons.map((lesson) => (
              <div key={lesson.id} className="flex items-start justify-between gap-3 py-2">
                <div>
                  <div className="font-semibold">{lesson.title}</div>
                  <div className="text-xs text-slate-500">Thứ tự: {lesson.orderIndex} • {lesson.status}</div>
                </div>
                {canManage && (
                  <Button variant="ghost" onClick={() => deleteLessonMutation.mutate(lesson.id)} disabled={deleteLessonMutation.isPending}>
                    Xóa
                  </Button>
                )}
              </div>
            ))}
            {sortedLessons.length === 0 && <div className="py-3 text-sm text-slate-500">Chưa có bài học.</div>}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold">Tài liệu</h2>
          {canManage && (
            <form
              className="mt-3 space-y-2"
              onSubmit={(event) => {
                event.preventDefault()
                if (!materialTitle) return
                createMaterialMutation.mutate()
              }}
            >
              <Input value={materialTitle} onChange={(e) => setMaterialTitle(e.target.value)} placeholder="Tên tài liệu" required />
              <TextArea rows={2} value={materialDescription} onChange={(e) => setMaterialDescription(e.target.value)} placeholder="Mô tả" />
              <Input value={materialUrl} onChange={(e) => setMaterialUrl(e.target.value)} placeholder="Đường dẫn ngoài (nếu có)" />
              <div>
                <FieldLabel htmlFor="materialFile">Tệp đính kèm</FieldLabel>
                <Input id="materialFile" type="file" onChange={(e) => setMaterialFile(e.target.files?.[0] ?? null)} />
              </div>
              <Button disabled={createMaterialMutation.isPending}>Thêm tài liệu</Button>
            </form>
          )}

          <div className="mt-3 divide-y divide-sky-50">
            {materialsQuery.data.map((material) => (
              <div key={material.id} className="flex items-start justify-between gap-3 py-2">
                <div>
                  <div className="font-semibold">{material.title}</div>
                  <div className="text-xs text-slate-500">{material.visible ? 'Đang hiển thị' : 'Đang ẩn'}</div>
                </div>
                {canManage && (
                  <div className="flex gap-1">
                    <Button variant="ghost" onClick={() => toggleMaterialMutation.mutate({ id: material.id, visible: material.visible })} disabled={toggleMaterialMutation.isPending}>
                      {material.visible ? 'Ẩn' : 'Hiện'}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        if (!globalThis.confirm('Bạn chắc chắn muốn xóa tài liệu này?')) return
                        deleteMaterialMutation.mutate(material.id)
                      }}
                      disabled={deleteMaterialMutation.isPending}
                    >
                      Xóa
                    </Button>
                  </div>
                )}
              </div>
            ))}
            {materialsQuery.data.length === 0 && <div className="py-3 text-sm text-slate-500">Chưa có tài liệu.</div>}
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold">Bài tập</h2>
          {canManage && (
            <Button variant="secondary" onClick={() => sendBulkReminderMutation.mutate()} disabled={sendBulkReminderMutation.isPending}>
              Gửi nhắc hạn toàn lớp
            </Button>
          )}
        </div>

        {canManage && (
          <form
            className="mt-3 grid gap-2 sm:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault()
              if (!assignmentTitle) return
              createAssignmentMutation.mutate()
            }}
          >
            <div className="sm:col-span-2">
              <Input value={assignmentTitle} onChange={(e) => setAssignmentTitle(e.target.value)} placeholder="Tên bài tập" required />
            </div>
            <div className="sm:col-span-2">
              <TextArea rows={3} value={assignmentDescription} onChange={(e) => setAssignmentDescription(e.target.value)} placeholder="Mô tả" />
            </div>
            <Input type="datetime-local" value={assignmentDueAt} onChange={(e) => setAssignmentDueAt(e.target.value)} />
            <Input type="number" value={assignmentMaxScore} onChange={(e) => setAssignmentMaxScore(e.target.value)} min={1} max={1000} />
            <div className="sm:col-span-2">
              <Button disabled={createAssignmentMutation.isPending}>Tạo bài tập</Button>
            </div>
          </form>
        )}

        <div className="mt-3 divide-y divide-sky-50">
          {assignmentsQuery.data.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-3 py-3">
              <div>
                <div className="font-semibold">{item.title}</div>
                <div className="text-sm text-slate-500">Trạng thái: {item.status} • Hạn nộp: {item.dueAt ? new Date(item.dueAt).toLocaleString('vi-VN') : 'Chưa đặt'}</div>
              </div>
              {canManage && (
                <div className="flex gap-1">
                  {item.status === 'DRAFT' && <Button variant="ghost" onClick={() => publishAssignmentMutation.mutate(item.id)} disabled={publishAssignmentMutation.isPending}>Phát hành</Button>}
                  {item.status !== 'CLOSED' && <Button variant="ghost" onClick={() => closeAssignmentMutation.mutate(item.id)} disabled={closeAssignmentMutation.isPending}>Đóng</Button>}
                  <Button
                    variant="ghost"
                    onClick={() => {
                      if (!globalThis.confirm('Bạn chắc chắn muốn xóa bài tập này?')) return
                      deleteAssignmentMutation.mutate(item.id)
                    }}
                    disabled={deleteAssignmentMutation.isPending}
                  >
                    Xóa
                  </Button>
                </div>
              )}
            </div>
          ))}
          {assignmentsQuery.data.length === 0 && <div className="py-3 text-sm text-slate-500">Chưa có bài tập nào.</div>}
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">Hoạt động gần đây</h2>
        <div className="mt-3 divide-y divide-sky-50">
          {activityQuery.data?.slice(0, 20).map((item) => (
            <div key={item.id} className="py-2">
              <div className="text-sm font-semibold">{item.actorName}</div>
              <div className="text-sm text-slate-600">{item.message}</div>
              <div className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleString('vi-VN')}</div>
            </div>
          ))}
          {!activityQuery.data?.length && <div className="py-3 text-sm text-slate-500">Chưa có hoạt động.</div>}
        </div>
      </Card>
    </div>
  )
}

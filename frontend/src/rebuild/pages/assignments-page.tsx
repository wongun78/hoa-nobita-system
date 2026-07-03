import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNewAuth } from '../auth/use-auth'
import { api } from '../core/api'
import { Button, Card, FieldLabel, Input, TextArea } from '../layout/ui'

export function AssignmentsPage() {
  const { user, hasRole } = useNewAuth()
  const canGrade = hasRole('TEACHER_OWNER', 'CLASS_ADMIN')
  const isStudent = hasRole('STUDENT')
  const qc = useQueryClient()
  const [classId, setClassId] = useState('')
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('')
  const [submitText, setSubmitText] = useState('')
  const [submitUrl, setSubmitUrl] = useState('')
  const [submitFile, setSubmitFile] = useState<File | null>(null)
  const [gradeScore, setGradeScore] = useState('')
  const [gradeFeedback, setGradeFeedback] = useState('')
  const [selectedSubmissionId, setSelectedSubmissionId] = useState('')
  const [editingSubmissionId, setEditingSubmissionId] = useState('')
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  const classesQuery = useQuery({ queryKey: ['classes'], queryFn: () => api.classes() })
  const assignmentsQuery = useQuery({ queryKey: ['assignments', classId], queryFn: () => api.assignments(classId || undefined) })
  const selectedAssignmentQuery = useQuery({
    queryKey: ['assignment', selectedAssignmentId],
    queryFn: () => api.assignmentById(selectedAssignmentId),
    enabled: selectedAssignmentId.length > 0,
  })
  const submissionsQuery = useQuery({
    queryKey: ['assignment', selectedAssignmentId, 'submissions'],
    queryFn: () => api.submissionsByAssignment(selectedAssignmentId),
    enabled: selectedAssignmentId.length > 0,
  })
  const reminderPreviewQuery = useQuery({
    queryKey: ['assignment', selectedAssignmentId, 'missing'],
    queryFn: () => api.assignmentMissingStudents(selectedAssignmentId),
    enabled: selectedAssignmentId.length > 0 && canGrade,
  })

  const submitMutation = useMutation({
    mutationFn: async () => {
      let fileId: string | undefined
      if (submitFile) {
        const uploaded = await api.uploadFile(submitFile)
        fileId = uploaded.id
      }
      return api.submitAssignment(selectedAssignmentId, {
        contentText: submitText || undefined,
        contentUrl: submitUrl || undefined,
        fileId,
      })
    },
    onSuccess: async () => {
      setSubmitText('')
      setSubmitUrl('')
      setSubmitFile(null)
      setActionMessage('Nộp bài thành công.')
      await qc.invalidateQueries({ queryKey: ['assignment', selectedAssignmentId, 'submissions'] })
    },
  })

  const updateSubmissionMutation = useMutation({
    mutationFn: async () => {
      let fileId: string | undefined
      if (submitFile) {
        const uploaded = await api.uploadFile(submitFile)
        fileId = uploaded.id
      }
      return api.updateSubmission(editingSubmissionId, {
        contentText: submitText || undefined,
        contentUrl: submitUrl || undefined,
        fileId,
      })
    },
    onSuccess: async () => {
      setEditingSubmissionId('')
      setSubmitText('')
      setSubmitUrl('')
      setSubmitFile(null)
      setActionMessage('Đã cập nhật bài nộp.')
      await qc.invalidateQueries({ queryKey: ['assignment', selectedAssignmentId, 'submissions'] })
    },
  })

  const deleteSubmissionMutation = useMutation({
    mutationFn: (submissionId: string) => api.deleteSubmission(submissionId),
    onSuccess: async () => {
      setActionMessage('Đã xóa bài nộp.')
      await qc.invalidateQueries({ queryKey: ['assignment', selectedAssignmentId, 'submissions'] })
    },
  })

  const gradeMutation = useMutation({
    mutationFn: () => {
      const submission = (submissionsQuery.data ?? []).find((item) => item.id === selectedSubmissionId)
      if (submission?.gradeId) {
        return api.updateGrade(submission.gradeId, { score: Number(gradeScore), feedback: gradeFeedback || undefined })
      }
      return api.gradeSubmission(selectedSubmissionId, { score: Number(gradeScore), feedback: gradeFeedback || undefined })
    },
    onSuccess: async () => {
      setGradeScore('')
      setGradeFeedback('')
      setActionMessage('Đã chấm bài.')
      await qc.invalidateQueries({ queryKey: ['assignment', selectedAssignmentId, 'submissions'] })
    },
  })

  const requestResubmitMutation = useMutation({
    mutationFn: (submissionId: string) => api.requestResubmit(submissionId),
    onSuccess: async () => {
      setActionMessage('Đã gửi yêu cầu nộp lại.')
      await qc.invalidateQueries({ queryKey: ['assignment', selectedAssignmentId, 'submissions'] })
    },
  })

  const sendReminderMutation = useMutation({
    mutationFn: () => api.sendAssignmentReminder(selectedAssignmentId),
    onSuccess: (payload) => {
      setActionMessage(`Đã gửi nhắc hạn cho ${payload.recipientCount} học viên.`)
    },
  })

  const copyMutation = useMutation({
    mutationFn: () => api.copyAssignment(selectedAssignmentId),
    onSuccess: async () => {
      setActionMessage('Đã sao chép bài tập.')
      await qc.invalidateQueries({ queryKey: ['assignments', classId] })
    },
  })

  const closeMutation = useMutation({
    mutationFn: () => api.closeAssignment(selectedAssignmentId),
    onSuccess: async () => {
      setActionMessage('Đã đóng bài tập.')
      await qc.invalidateQueries({ queryKey: ['assignments', classId] })
      await qc.invalidateQueries({ queryKey: ['assignment', selectedAssignmentId] })
    },
  })

  const mySubmission = useMemo(() => {
    if (!submissionsQuery.data || !user) return null
    return submissionsQuery.data.find((item) => item.studentId === user.id) ?? null
  }, [submissionsQuery.data, user])

  const selectedSubmission = useMemo(() => {
    if (!selectedSubmissionId) return null
    return (submissionsQuery.data ?? []).find((item) => item.id === selectedSubmissionId) ?? null
  }, [selectedSubmissionId, submissionsQuery.data])

  if (assignmentsQuery.isLoading) return <div className="text-sm text-slate-500">Đang tải bài tập...</div>
  if (assignmentsQuery.isError || !assignmentsQuery.data) return <div className="text-sm text-rose-600">Không thể tải danh sách bài tập.</div>

  return (
    <div className="space-y-4">
      <Card>
        <h1 className="text-xl font-bold">Bài tập</h1>
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
          <Input value={classId} onChange={(e) => setClassId(e.target.value)} placeholder="Lọc theo classId (để trống = tất cả)" />
          <Button variant="secondary" onClick={() => setClassId('')}>Xóa lọc</Button>
        </div>

        <div className="mt-4 overflow-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-sky-100 text-left text-slate-500">
                <th className="px-2 py-2 font-medium">Tên bài</th>
                <th className="px-2 py-2 font-medium">Lớp</th>
                <th className="px-2 py-2 font-medium">Hạn nộp</th>
                <th className="px-2 py-2 font-medium">Trạng thái</th>
                <th className="px-2 py-2 font-medium">Điểm tối đa</th>
                <th className="px-2 py-2 font-medium">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {assignmentsQuery.data.map((item) => (
                <tr key={item.id} className="border-b border-sky-50">
                  <td className="px-2 py-2 font-semibold">{item.title}</td>
                  <td className="px-2 py-2">{item.className || '-'}</td>
                  <td className="px-2 py-2">{item.dueAt ? new Date(item.dueAt).toLocaleString('vi-VN') : '-'}</td>
                  <td className="px-2 py-2">{item.status}</td>
                  <td className="px-2 py-2">{item.maxScore}</td>
                  <td className="px-2 py-2">
                    <Button variant="ghost" onClick={() => setSelectedAssignmentId(item.id)}>Chi tiết</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {selectedAssignmentId && (
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold">{selectedAssignmentQuery.data?.title || 'Chi tiết bài tập'}</h2>
              <div className="text-sm text-slate-500">{selectedAssignmentQuery.data?.description || 'Không có mô tả'}</div>
            </div>
            <div className="flex gap-1">
              {canGrade && (
                <>
                  <Button variant="secondary" onClick={() => copyMutation.mutate()} disabled={copyMutation.isPending}>Sao chép</Button>
                  <Button variant="secondary" onClick={() => closeMutation.mutate()} disabled={closeMutation.isPending}>Đóng bài</Button>
                  <Button variant="secondary" onClick={() => sendReminderMutation.mutate()} disabled={sendReminderMutation.isPending}>Nhắc hạn</Button>
                </>
              )}
            </div>
          </div>

          {actionMessage && <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{actionMessage}</div>}

          {canGrade && reminderPreviewQuery.data && (
            <div className="mt-3 rounded-xl border border-sky-100 bg-sky-50 p-3 text-sm">
              Thiếu nộp: {reminderPreviewQuery.data.missingCount}/{reminderPreviewQuery.data.totalStudents}
            </div>
          )}

          {isStudent && (
            <form
              className="mt-4 space-y-2 rounded-xl border border-sky-100 p-3"
              onSubmit={(event) => {
                event.preventDefault()
                if (editingSubmissionId) {
                  updateSubmissionMutation.mutate()
                  return
                }
                submitMutation.mutate()
              }}
            >
              <h3 className="font-semibold">Nộp bài</h3>
              {mySubmission && <div className="text-xs text-slate-500">Bài đã nộp hiện tại: {mySubmission.status}</div>}
              <TextArea rows={4} value={submitText} onChange={(e) => setSubmitText(e.target.value)} placeholder="Nội dung bài làm" />
              <Input value={submitUrl} onChange={(e) => setSubmitUrl(e.target.value)} placeholder="Đường dẫn bài làm (nếu có)" />
              <div>
                <FieldLabel htmlFor="submitFile">Tệp bài làm</FieldLabel>
                <Input id="submitFile" type="file" onChange={(e) => setSubmitFile(e.target.files?.[0] ?? null)} />
              </div>
              <div className="flex gap-2">
                <Button disabled={submitMutation.isPending || updateSubmissionMutation.isPending}>
                  {editingSubmissionId ? 'Lưu cập nhật' : 'Gửi bài'}
                </Button>
                {mySubmission && !editingSubmissionId && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setEditingSubmissionId(mySubmission.id)
                      setSubmitText(mySubmission.contentText || '')
                      setSubmitUrl(mySubmission.contentUrl || '')
                    }}
                  >
                    Sửa bài nộp
                  </Button>
                )}
                {editingSubmissionId && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setEditingSubmissionId('')
                      setSubmitText('')
                      setSubmitUrl('')
                      setSubmitFile(null)
                    }}
                  >
                    Hủy sửa
                  </Button>
                )}
                {mySubmission && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      if (!globalThis.confirm('Bạn chắc chắn muốn xóa bài nộp của mình?')) return
                      deleteSubmissionMutation.mutate(mySubmission.id)
                    }}
                    disabled={deleteSubmissionMutation.isPending}
                  >
                    Xóa bài nộp
                  </Button>
                )}
              </div>
            </form>
          )}

          <div className="mt-4 overflow-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-sky-100 text-left text-slate-500">
                  <th className="px-2 py-2 font-medium">Học viên</th>
                  <th className="px-2 py-2 font-medium">Trạng thái</th>
                  <th className="px-2 py-2 font-medium">Thời gian nộp</th>
                  <th className="px-2 py-2 font-medium">Điểm</th>
                  <th className="px-2 py-2 font-medium">Phản hồi</th>
                  <th className="px-2 py-2 font-medium">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {(submissionsQuery.data ?? []).map((submission) => (
                  <tr key={submission.id} className="border-b border-sky-50">
                    <td className="px-2 py-2 font-semibold">{submission.studentName}</td>
                    <td className="px-2 py-2">{submission.status}</td>
                    <td className="px-2 py-2">{new Date(submission.submittedAt).toLocaleString('vi-VN')}</td>
                    <td className="px-2 py-2">{submission.score ?? '-'}</td>
                    <td className="px-2 py-2">{submission.feedback || '-'}</td>
                    <td className="px-2 py-2">
                      <div className="flex gap-1">
                        {submission.fileId && (
                          <a className="rounded-lg border border-sky-200 px-2 py-1 text-xs font-semibold text-slate-700" href={api.downloadFileUrl(submission.fileId)} target="_blank" rel="noreferrer">
                            Tải tệp
                          </a>
                        )}
                        {canGrade && (
                          <>
                            <Button variant="ghost" onClick={() => setSelectedSubmissionId(submission.id)}>Chấm</Button>
                            <Button variant="ghost" onClick={() => requestResubmitMutation.mutate(submission.id)} disabled={requestResubmitMutation.isPending}>Yêu cầu nộp lại</Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {canGrade && selectedSubmissionId && (
            <form
              className="mt-4 grid gap-2 rounded-xl border border-sky-100 p-3 sm:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault()
                if (!gradeScore) return
                gradeMutation.mutate()
              }}
            >
              <div>
                <FieldLabel htmlFor="gradeScore">Điểm</FieldLabel>
                <Input id="gradeScore" type="number" value={gradeScore} onChange={(e) => setGradeScore(e.target.value)} />
              </div>
              <div className="flex items-end text-xs text-slate-500">
                {selectedSubmission?.gradeId ? 'Bài đã chấm trước đó, thao tác này sẽ cập nhật điểm.' : 'Bài chưa chấm, thao tác này sẽ tạo điểm mới.'}
              </div>
              <div className="sm:col-span-2">
                <FieldLabel htmlFor="gradeFeedback">Nhận xét</FieldLabel>
                <TextArea id="gradeFeedback" rows={3} value={gradeFeedback} onChange={(e) => setGradeFeedback(e.target.value)} />
              </div>
              <div className="sm:col-span-2 flex gap-2">
                <Button disabled={gradeMutation.isPending}>Lưu điểm</Button>
                <Button type="button" variant="ghost" onClick={() => setSelectedSubmissionId('')}>Hủy</Button>
              </div>
            </form>
          )}
        </Card>
      )}

      {classesQuery.data && classesQuery.data.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold">Gợi ý classId</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {classesQuery.data.slice(0, 12).map((item) => (
              <button
                key={item.id}
                className="rounded-xl border border-sky-200 px-3 py-1 text-xs font-semibold text-slate-700"
                onClick={() => setClassId(item.id)}
              >
                {item.code}
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

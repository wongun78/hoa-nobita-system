import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAssignment, usePublishAssignment, useCloseAssignment, useDeleteAssignment, useCopyAssignment, useUpdateAssignment, useAssignmentMissingStudents, useSendAssignmentReminder } from '../features/assignments/hooks'
import { useSubmissions } from '../features/submissions/hooks'
import { useAuth } from '../features/auth/use-auth'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { useState } from 'react'
import { AssignmentStatusBadge, DeadlinePill } from '../features/assignments/components/assignment-badges'
import { ConfirmDialog } from '../components/ui/confirm-dialog'
import { AssignmentFormDialog } from '../features/assignments/components/assignment-form-dialog'
import { SubmissionFormDialog } from '../features/submissions/components/submission-form-dialog'
import { Toast } from '../components/ui/toast'

export function AssignmentDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { data: a, isLoading } = useAssignment(id)
  const subs = useSubmissions(id)
  const publish = usePublishAssignment()
  const close = useCloseAssignment()
  const deleteAssignment = useDeleteAssignment()
  const copyAssignment = useCopyAssignment()
  const updateAssignment = useUpdateAssignment()
  const missingStudentsQ = useAssignmentMissingStudents(id)
  const sendReminder = useSendAssignmentReminder(id)
  const { hasRole, user } = useAuth()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const isTeacher = hasRole('TEACHER_OWNER')
  const isAdmin = hasRole('CLASS_ADMIN')
  const canManage = isTeacher || isAdmin

  if (isLoading) return <div className="text-slate-500">Đang tải...</div>
  if (!a) return <div className="text-slate-500">Không tìm thấy bài tập.</div>

  const mySubmission = subs.data?.find(s => s.studentId === user?.id)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-[#1E3A8A]">{a.title}</h1>
            <AssignmentStatusBadge status={a.status} />
          </div>
          <div className="text-sm text-slate-500 flex items-center gap-3">
            {a.className && <span>Lớp: {a.className}</span>}
            <span>Điểm tối đa: {a.maxScore}</span>
            <DeadlinePill dueAt={a.dueAt} status={a.status} />
            <span>Cho phép nộp lại: {a.allowResubmit ? 'Có' : 'Không'}</span>
          </div>
        </div>
        
        {canManage && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setEditOpen(true)}>Sửa</Button>
            {a.status === 'DRAFT' && <Button variant="outline" onClick={() => publish.mutateAsync(id)}>Xuất bản</Button>}
            {a.status === 'PUBLISHED' && <Button variant="outline" onClick={() => close.mutateAsync(id)}>Đóng</Button>}
            <Button variant="outline" onClick={() => copyAssignment.mutateAsync(id).then(res => navigate(`/assignments/${res.id}`))}>Sao chép</Button>
            <Link to={`/assignments/${id}/submissions`}><Button variant="outline">Xem bài nộp</Button></Link>
            <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setConfirmDelete(true)}>Xóa</Button>
          </div>
        )}
      </div>

      <Card className="p-6">
        <h3 className="font-medium mb-2">Mô tả</h3>
        <p className="text-slate-700 whitespace-pre-wrap">{a.description || 'Không có mô tả.'}</p>
        
        <h3 className="font-medium mt-6 mb-2">Hướng dẫn làm bài</h3>
        <p className="text-slate-700 whitespace-pre-wrap">{a.instruction || 'Không có hướng dẫn.'}</p>
      </Card>

      {canManage && (
        <Card className="p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-medium">Nhắc nhở học viên chưa nộp</h3>
              <p className="text-sm text-slate-500 mt-1">
                {missingStudentsQ.data
                  ? `${missingStudentsQ.data.missingCount}/${missingStudentsQ.data.totalStudents} học viên chưa nộp bài`
                  : 'Đang tải danh sách học viên chưa nộp...'}
              </p>
            </div>
            <Button
              disabled={sendReminder.isPending || missingStudentsQ.isLoading || (missingStudentsQ.data?.missingCount ?? 0) === 0}
              onClick={() => {
                sendReminder.mutate(
                  undefined,
                  {
                    onSuccess: (result) => {
                      setToast({ message: `Đã gửi nhắc nhở cho ${result.recipientCount} học viên`, type: 'success' })
                    },
                    onError: () => {
                      setToast({ message: 'Không thể gửi nhắc nhở. Vui lòng thử lại.', type: 'error' })
                    },
                  }
                )
              }}
            >
              {sendReminder.isPending ? 'Đang gửi...' : 'Gửi nhắc nhở'}
            </Button>
          </div>

          {missingStudentsQ.isError && (
            <div className="mt-3 text-sm text-red-600">Không thể tải danh sách học viên chưa nộp.</div>
          )}

          {missingStudentsQ.data && missingStudentsQ.data.missingStudents.length > 0 && (
            <div className="mt-4 max-h-52 overflow-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-left text-slate-500">
                    <th className="px-3 py-2">Học viên</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">SĐT</th>
                  </tr>
                </thead>
                <tbody>
                  {missingStudentsQ.data.missingStudents.map(student => (
                    <tr key={student.studentId} className="border-b last:border-0">
                      <td className="px-3 py-2">{student.fullName}</td>
                      <td className="px-3 py-2 text-slate-600">{student.email || '-'}</td>
                      <td className="px-3 py-2 text-slate-600">{student.phone || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {missingStudentsQ.data && missingStudentsQ.data.missingStudents.length === 0 && (
            <div className="mt-3 text-sm text-emerald-700">Tất cả học viên đã nộp bài.</div>
          )}
        </Card>
      )}

      {!canManage && a.status === 'PUBLISHED' && (
        <Card className="p-6">
          <h3 className="font-medium mb-4">Nộp bài</h3>
          {mySubmission && !a.allowResubmit ? (
            <div className="text-slate-600">Bạn đã nộp bài và bài tập này không cho phép nộp lại.</div>
          ) : (
            <div className="space-y-4">
              <Button onClick={() => setEditOpen(true)}>
                {mySubmission ? 'Nộp lại bài' : 'Nộp bài'}
              </Button>
            </div>
          )}
        </Card>
      )}

      {!canManage && mySubmission && (
        <Card className="p-6 bg-slate-50">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-medium">Bài nộp của bạn</h3>
            <Link to={`/submissions/${mySubmission.id}`}>
              <Button variant="outline" size="sm">Xem chi tiết</Button>
            </Link>
          </div>
          <div className="space-y-2">
            <div className="text-sm text-slate-500">Trạng thái: <span className="font-medium text-slate-700">{mySubmission.status}</span></div>
            <div className="text-sm text-slate-500">Thời gian nộp: {new Date(mySubmission.submittedAt).toLocaleString('vi-VN')}</div>
            <div className="p-3 bg-white border rounded-md mt-2">{mySubmission.contentText}</div>
            
            {mySubmission.score != null && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                <div className="font-medium text-green-800">Điểm: {mySubmission.score} / {a.maxScore}</div>
                {mySubmission.feedback && <div className="text-sm text-green-700 mt-1">Nhận xét: {mySubmission.feedback}</div>}
              </div>
            )}
          </div>
        </Card>
      )}

      <ConfirmDialog 
        open={confirmDelete} 
        onClose={() => setConfirmDelete(false)} 
        title="Xóa bài tập" 
        message="Bạn có chắc chắn muốn xóa bài tập này? Hành động này không thể hoàn tác." 
        onConfirm={() => deleteAssignment.mutateAsync(id).then(() => navigate('/assignments'))} 
        destructive 
      />

      {editOpen && (
        canManage ? (
          <AssignmentFormDialog
            open={editOpen}
            onClose={() => setEditOpen(false)}
            title="Sửa bài tập"
            submitLabel="Lưu thay đổi"
            defaultValues={a}
            onSubmit={(data) => updateAssignment.mutateAsync({ id, req: data })}
          />
        ) : (
          <SubmissionFormDialog
            open={editOpen}
            onClose={() => setEditOpen(false)}
            submission={mySubmission}
            assignmentId={id}
          />
        )
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

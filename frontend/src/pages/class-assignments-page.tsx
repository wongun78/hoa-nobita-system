import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAssignments, useSendBatchAssignmentReminders } from '../features/assignments/hooks'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { AssignmentStatusBadge, DeadlinePill } from '../features/assignments/components/assignment-badges'
import { AssignmentReminderAction } from '../features/assignments/components/assignment-reminder-action'
import { useAuth } from '../features/auth/use-auth'
import { Dialog } from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Toast } from '../components/ui/toast'

export function ClassAssignmentsPage() {
  const { classId = '' } = useParams()
  const { data, isLoading, isError } = useAssignments(classId)
  const sendBatchReminder = useSendBatchAssignmentReminders(classId)
  const { hasRole } = useAuth()
  const canManage = hasRole('TEACHER_OWNER') || hasRole('CLASS_ADMIN')
  const [batchOpen, setBatchOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const publishedAssignments = useMemo(
    () => (data ?? []).filter(assignment => assignment.status === 'PUBLISHED'),
    [data]
  )

  const defaultTitle = 'Nhắc nhở nộp bài tập'
  const defaultContent = 'Bạn đang có bài tập chưa nộp trong lớp. Vui lòng kiểm tra danh sách bài tập và hoàn thành sớm nhất có thể.'

  if (isLoading) {
    return <div className="text-slate-500">Đang tải danh sách bài tập...</div>
  }

  if (isError) {
    return <div className="text-red-600">Không thể tải danh sách bài tập của lớp.</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-slate-500">Tổng số bài tập: {data?.length ?? 0}</div>
        {canManage && (
          <Button
            variant="outline"
            disabled={publishedAssignments.length === 0 || sendBatchReminder.isPending}
            onClick={() => {
              setTitle(defaultTitle)
              setContent(defaultContent)
              setBatchOpen(true)
            }}
          >
            {sendBatchReminder.isPending ? 'Đang gửi...' : `Nhắc nhở hàng loạt (${publishedAssignments.length})`}
          </Button>
        )}
      </div>

      {data?.length === 0 && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
          Lớp này chưa có bài tập nào.
        </div>
      )}

      <div className="grid gap-4">
        {data?.map(assignment => (
          <Card key={assignment.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Link to={`/assignments/${assignment.id}`} className="font-medium text-[#3B82F6] hover:underline text-lg">
                  {assignment.title}
                </Link>
                <AssignmentStatusBadge status={assignment.status} />
              </div>
              <div className="text-sm text-slate-500 flex items-center gap-3 mt-1">
                <span>Điểm: {assignment.maxScore}</span>
                <DeadlinePill dueAt={assignment.dueAt} status={assignment.status} />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link to={`/assignments/${assignment.id}`}>
                <Button variant="outline" size="sm">Xem</Button>
              </Link>
              {canManage && assignment.status === 'PUBLISHED' && (
                <AssignmentReminderAction assignmentId={assignment.id} compact />
              )}
              {canManage && (
                <Link to={`/assignments/${assignment.id}/submissions`}>
                  <Button variant="outline" size="sm">Bài nộp</Button>
                </Link>
              )}
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={batchOpen} onClose={() => setBatchOpen(false)} title="Gửi nhắc nhở hàng loạt">
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
            Sẽ gửi nhắc nhở cho các học viên chưa nộp trong {publishedAssignments.length} bài tập đang xuất bản.
          </div>

          <div>
            <label htmlFor="batch-title" className="mb-1 block text-sm font-medium text-slate-700">Tiêu đề</label>
            <Input id="batch-title" value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          <div>
            <label htmlFor="batch-content" className="mb-1 block text-sm font-medium text-slate-700">Nội dung</label>
            <Textarea id="batch-content" value={content} onChange={e => setContent(e.target.value)} />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setBatchOpen(false)}>Hủy</Button>
            <Button
              disabled={publishedAssignments.length === 0 || sendBatchReminder.isPending}
              onClick={() => {
                sendBatchReminder.mutate(
                  {
                    assignmentIds: publishedAssignments.map(assignment => assignment.id),
                    title,
                    content,
                  },
                  {
                    onSuccess: (result) => {
                      setBatchOpen(false)
                      setToast({
                        message: `Đã gửi ${result.assignmentCount} thông báo nhắc nhở, tổng ${result.totalRecipients} người nhận`,
                        type: 'success',
                      })
                    },
                    onError: () => {
                      setToast({ message: 'Không thể gửi nhắc nhở hàng loạt. Vui lòng thử lại.', type: 'error' })
                    },
                  }
                )
              }}
            >
              {sendBatchReminder.isPending ? 'Đang gửi...' : 'Xác nhận gửi'}
            </Button>
          </div>
        </div>
      </Dialog>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

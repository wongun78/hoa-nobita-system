import { useMemo, useState } from 'react'
import { useAssignmentMissingStudents, useSendAssignmentReminder } from '../hooks'
import { Button } from '../../../components/ui/button'
import { Dialog } from '../../../components/ui/dialog'
import { Input } from '../../../components/ui/input'
import { Textarea } from '../../../components/ui/textarea'
import { Toast } from '../../../components/ui/toast'

type AssignmentReminderActionProps = Readonly<{
  assignmentId: string
  compact?: boolean
}>

export function AssignmentReminderAction({ assignmentId, compact = false }: AssignmentReminderActionProps) {
  const previewQ = useAssignmentMissingStudents(assignmentId)
  const sendReminder = useSendAssignmentReminder(assignmentId)
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const missingCount = previewQ.data?.missingCount ?? 0
  const isLoading = previewQ.isLoading || sendReminder.isPending
  const disabled = isLoading || missingCount === 0
  let buttonText = 'Nhắc nhở'
  if (sendReminder.isPending) {
    buttonText = 'Đang gửi...'
  } else if (missingCount > 0) {
    buttonText = `Nhắc nhở (${missingCount})`
  }

  const defaultTitle = useMemo(() => {
    if (!previewQ.data) return 'Nhắc nhở nộp bài'
    return `Nhắc nhở nộp bài: ${previewQ.data.assignmentTitle}`
  }, [previewQ.data])

  const defaultContent = useMemo(() => {
    if (!previewQ.data) return 'Bạn chưa nộp bài. Vui lòng hoàn thành và nộp sớm nhất có thể.'
    const deadline = previewQ.data.deadline
      ? new Date(previewQ.data.deadline).toLocaleString('vi-VN')
      : 'chưa đặt'
    return `Bài tập [${previewQ.data.assignmentTitle}] sắp đến hạn (Deadline: ${deadline}). Bạn chưa nộp bài. Vui lòng nộp ngay!`
  }, [previewQ.data])

  const openDialog = () => {
    setTitle(defaultTitle)
    setContent(defaultContent)
    setOpen(true)
  }

  return (
    <div className={compact ? 'flex items-center gap-2' : 'space-y-1'}>
      <Button
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={openDialog}
        title={missingCount === 0 ? 'Không còn học viên chưa nộp' : `Gửi nhắc nhở cho ${missingCount} học viên`}
      >
        {buttonText}
      </Button>

      {!compact && (
        <div className="text-xs text-slate-500">
          {previewQ.isLoading
            ? 'Đang tải danh sách chưa nộp...'
            : `${missingCount} học viên chưa nộp`}
        </div>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} title="Gửi nhắc nhở nộp bài">
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
            {previewQ.data
              ? `Sẽ gửi đến ${previewQ.data.missingCount}/${previewQ.data.totalStudents} học viên chưa nộp.`
              : 'Đang tải danh sách người nhận...'}
          </div>

          {previewQ.data && previewQ.data.missingStudents.length > 0 && (
            <div className="max-h-40 overflow-auto rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-left text-slate-500">
                    <th className="px-3 py-2">Học viên</th>
                    <th className="px-3 py-2">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {previewQ.data.missingStudents.map(student => (
                    <tr key={student.studentId} className="border-b last:border-0">
                      <td className="px-3 py-2">{student.fullName}</td>
                      <td className="px-3 py-2 text-slate-600">{student.email || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div>
            <label htmlFor="reminder-title" className="mb-1 block text-sm font-medium text-slate-700">Tiêu đề</label>
            <Input id="reminder-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Nhập tiêu đề thông báo" />
          </div>

          <div>
            <label htmlFor="reminder-content" className="mb-1 block text-sm font-medium text-slate-700">Nội dung</label>
            <Textarea id="reminder-content" value={content} onChange={e => setContent(e.target.value)} placeholder="Nhập nội dung nhắc nhở" />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
            <Button
              disabled={sendReminder.isPending || !previewQ.data || previewQ.data.missingCount === 0}
              onClick={() => {
                sendReminder.mutate(
                  { title, content },
                  {
                    onSuccess: (result) => {
                      setOpen(false)
                      setToast({ message: `Đã gửi nhắc nhở cho ${result.recipientCount} học viên`, type: 'success' })
                    },
                    onError: () => {
                      setToast({ message: 'Không thể gửi nhắc nhở. Vui lòng thử lại.', type: 'error' })
                    }
                  }
                )
              }}
            >
              {sendReminder.isPending ? 'Đang gửi...' : 'Xác nhận gửi'}
            </Button>
          </div>
        </div>
      </Dialog>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
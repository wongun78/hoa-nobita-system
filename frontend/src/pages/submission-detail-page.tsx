import { useParams, useNavigate, Link } from 'react-router-dom'
import { useSubmission, useDeleteSubmission } from '../features/submissions/hooks'
import { useAssignment } from '../features/assignments/hooks'
import { useAuth } from '../features/auth/use-auth'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { ConfirmDialog } from '../components/ui/confirm-dialog'
import { ErrorState, LoadingState } from '../components/system/states'
import { useState } from 'react'
import { useI18n } from '../i18n/use-i18n'
import { SubmissionFormDialog } from '../features/submissions/components/submission-form-dialog'

export function SubmissionDetailPage() {
  const { t } = useI18n()
  const { submissionId = '' } = useParams()
  const navigate = useNavigate()
  const { hasRole } = useAuth()
  
  const { data: s, isLoading: sLoading, isError: sError } = useSubmission(submissionId)
  const { data: a, isLoading: aLoading } = useAssignment(s?.assignmentId || '')
  
  const delMut = useDeleteSubmission(s?.assignmentId || '')
  
  const [delOpen, setDelOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  const isTeacher = hasRole('TEACHER_OWNER')
  const isAdmin = hasRole('CLASS_ADMIN')
  const isStudent = hasRole('STUDENT')
  const canManage = isTeacher || isAdmin

  if (sLoading || aLoading) return <LoadingState text={t.loading} />
  if (sError || !s) return <ErrorState text={t.error} />

  const canEdit = isStudent && (s.status !== 'GRADED') && a?.status !== 'CLOSED'
  const canDelete = isStudent && s.status !== 'GRADED'

  const onDelete = async () => {
    await delMut.mutateAsync(submissionId)
    navigate('/me/submissions')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E3A8A]">Chi tiết bài nộp</h1>
          <div className="text-sm text-slate-500 mt-1">
            {a ? <Link to={`/assignments/${a.id}`} className="hover:underline">{a.title}</Link> : 'Đang tải...'}
          </div>
        </div>
        
        <div className="flex gap-2">
          {canManage && (
            <Link to={`/grading?submissionId=${submissionId}`}>
              <Button>Chấm bài</Button>
            </Link>
          )}
          {canEdit && (
            <Button variant="outline" onClick={() => setEditOpen(true)}>Sửa bài nộp</Button>
          )}
          {canDelete && (
            <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setDelOpen(true)}>Xóa</Button>
          )}
          <Button variant="outline" onClick={() => navigate(-1)}>Quay lại</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-medium text-slate-700">Nội dung bài nộp</h3>
              <Badge variant={s.status === 'GRADED' ? 'default' : s.status === 'LATE' ? 'destructive' : 'outline'}>
                {s.status}
              </Badge>
            </div>
            
            {s.contentText && (
              <div className="p-4 bg-slate-50 rounded-lg whitespace-pre-wrap border text-slate-700">
                {s.contentText}
              </div>
            )}
            
            {s.contentUrl && (
              <div className="mt-4">
                <a href={s.contentUrl} target="_blank" rel="noreferrer" className="text-[#3B82F6] hover:underline flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                  Liên kết đính kèm
                </a>
              </div>
            )}
            
            {s.fileId && (
              <div className="mt-4">
                <a href={`/api/v1/files/${s.fileId}/download`} target="_blank" rel="noreferrer">
                  <Button variant="outline" size="sm">
                    Tải file đính kèm
                  </Button>
                </a>
              </div>
            )}
            
            {!s.contentText && !s.contentUrl && !s.fileId && (
              <div className="text-slate-500 italic">Không có nội dung.</div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-medium text-slate-700 mb-4">Thông tin</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Thời gian nộp</span>
                <span className="font-medium">{new Date(s.submittedAt).toLocaleString('vi-VN')}</span>
              </div>
              {canManage && (
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-500">Học viên</span>
                  <span className="font-medium">{s.studentId}</span>
                </div>
              )}
            </div>
          </Card>

          {(s.status === 'GRADED' || s.score != null) && (
            <Card className="p-6 bg-green-50 border-green-200">
              <h3 className="font-medium text-green-800 mb-4">Kết quả chấm</h3>
              <div className="text-center mb-4">
                <span className="text-4xl font-bold text-green-600">{s.score}</span>
                {a && <span className="text-green-600/70"> / {a.maxScore}</span>}
              </div>
              {s.feedback && (
                <div className="mt-4 p-3 bg-white rounded border border-green-100 text-sm text-slate-700 whitespace-pre-wrap">
                  <div className="font-medium text-green-800 mb-1">Nhận xét:</div>
                  {s.feedback}
                </div>
              )}
            </Card>
          )}
          
          {s.status === 'RESUBMIT_REQUESTED' && (
            <Card className="p-6 bg-amber-50 border-amber-200">
              <h3 className="font-medium text-amber-800 mb-2">Yêu cầu nộp lại</h3>
              <p className="text-sm text-amber-700">Giáo viên đã yêu cầu bạn nộp lại bài này. Vui lòng chỉnh sửa và nộp lại.</p>
              {canEdit && (
                <Button className="w-full mt-4 bg-amber-600 hover:bg-amber-700" onClick={() => setEditOpen(true)}>
                  Sửa bài nộp
                </Button>
              )}
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog 
        open={delOpen} 
        onClose={() => setDelOpen(false)} 
        title="Xóa bài nộp" 
        message="Bạn có chắc chắn muốn xóa bài nộp này? Hành động này không thể hoàn tác." 
        onConfirm={onDelete} 
        destructive 
      />

      {editOpen && (
        <SubmissionFormDialog
          open={editOpen}
          onClose={() => setEditOpen(false)}
          submission={s}
          assignmentId={s.assignmentId}
        />
      )}
    </div>
  )
}
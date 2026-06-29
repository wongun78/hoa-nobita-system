import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSearchParams } from 'react-router-dom'
import { useGradingQueue, useGradeSubmission, useRequestResubmit } from '../features/grading/hooks'
import { useClasses } from '../features/classes/hooks'
import { useDownloadFile } from '../features/files/hooks'
import { useSubmission } from '../features/submissions/hooks'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import type { Submission } from '../features/submissions/types'

const gradeSchema = z.object({
  score: z.coerce.number().min(0, 'Điểm phải lớn hơn hoặc bằng 0'),
  feedback: z.string().max(1000, 'Nhận xét quá dài').optional(),
})

const statusLabels: Record<Submission['status'], string> = {
  SUBMITTED: 'Đã nộp',
  LATE: 'Nộp trễ',
  GRADED: 'Đã chấm',
  RESUBMIT_REQUESTED: 'Cần nộp lại',
}

function formatDateTime(value?: string) {
  if (!value) return 'Chưa rõ'
  return new Date(value).toLocaleString('vi-VN')
}

export function GradingPage() {
  const { data: classes } = useClasses()
  const [searchParams] = useSearchParams()
  const deepLinkedSubmissionId = searchParams.get('submissionId') || ''
  const { data: deepLinkedSubmission } = useSubmission(deepLinkedSubmissionId)
  const [classId, setClassId] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null)

  const { data: queue, isLoading } = useGradingQueue(classId)
  const gradeMut = useGradeSubmission(classId)
  const resubmitMut = useRequestResubmit(classId)
  const downloadFile = useDownloadFile()

  const form = useForm({
    resolver: zodResolver(gradeSchema),
    defaultValues: { score: 0, feedback: '' },
  })

  useEffect(() => {
    if (deepLinkedSubmission?.className && classes?.length && !classId) {
      const matchingClass = classes.find(c => c.name === deepLinkedSubmission.className)
      if (matchingClass) setClassId(matchingClass.id)
    }
  }, [classes, classId, deepLinkedSubmission])

  useEffect(() => {
    if (!deepLinkedSubmissionId || !queue?.length) return
    const found = queue.find(s => s.id === deepLinkedSubmissionId)
    if (found) {
      setSelectedSub(found)
      form.reset({ score: found.score || 0, feedback: found.feedback || '' })
    }
  }, [deepLinkedSubmissionId, form, queue])

  const filteredQueue = useMemo(() => {
    return queue?.filter(s => statusFilter === 'ALL' || s.status === statusFilter) || []
  }, [queue, statusFilter])

  const kpi = {
    needGrading: queue?.filter(s => s.status === 'SUBMITTED' || s.status === 'LATE').length || 0,
    graded: queue?.filter(s => s.status === 'GRADED').length || 0,
    resubmit: queue?.filter(s => s.status === 'RESUBMIT_REQUESTED').length || 0,
    avgScore: (queue?.filter(s => s.status === 'GRADED' && s.score != null).reduce((acc, s) => acc + (s.score || 0), 0) || 0) / (queue?.filter(s => s.status === 'GRADED').length || 1),
  }

  const handleSelect = (sub: Submission) => {
    setSelectedSub(sub)
    form.reset({ score: sub.score || 0, feedback: sub.feedback || '' })
  }

  const badgeVariantForStatus = (status: Submission['status']) => {
    if (status === 'GRADED') return 'default'
    if (status === 'RESUBMIT_REQUESTED' || status === 'LATE') return 'destructive'
    return 'outline'
  }

  const onGrade = async (v: any) => {
    if (!selectedSub) return
    if (selectedSub.maxScore != null && v.score > selectedSub.maxScore) {
      form.setError('score', { message: `Điểm không được vượt quá ${selectedSub.maxScore}` })
      return
    }
    const grade = await gradeMut.mutateAsync({ submissionId: selectedSub.id, req: v })
    setSelectedSub(prev => prev ? { ...prev, status: 'GRADED', gradeId: grade.id, score: v.score, feedback: v.feedback } : null)
  }

  const onRequestResubmit = async () => {
    if (!selectedSub) return
    await resubmitMut.mutateAsync(selectedSub.id)
    setSelectedSub(prev => prev ? { ...prev, status: 'RESUBMIT_REQUESTED' } : null)
  }

  const selectedTitle = selectedSub?.assignmentTitle || selectedSub?.assignmentId
  const selectedStudent = selectedSub?.studentName || selectedSub?.studentId

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-[#1E3A8A]">Chấm bài</h1>
          {deepLinkedSubmissionId && !selectedSub && <div className="text-sm text-slate-500 mt-1">Đang mở bài nộp từ liên kết trực tiếp...</div>}
        </div>
        <div className="flex gap-3">
          <select className="border rounded px-3 py-2" value={classId} onChange={e => { setClassId(e.target.value); setSelectedSub(null) }}>
            <option value="">-- Chọn lớp --</option>
            {classes?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="border rounded px-3 py-2" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="ALL">Tất cả trạng thái</option>
            <option value="SUBMITTED">Đã nộp</option>
            <option value="LATE">Nộp trễ</option>
            <option value="GRADED">Đã chấm</option>
            <option value="RESUBMIT_REQUESTED">Cần nộp lại</option>
          </select>
        </div>
      </div>

      {classId && (
        <div className="grid grid-cols-4 gap-4 shrink-0">
          <Card className="p-4 text-center"><div className="text-2xl font-bold text-[#F59E0B]">{kpi.needGrading}</div><div className="text-sm text-slate-500">Cần chấm</div></Card>
          <Card className="p-4 text-center"><div className="text-2xl font-bold text-[#16A34A]">{kpi.graded}</div><div className="text-sm text-slate-500">Đã chấm</div></Card>
          <Card className="p-4 text-center"><div className="text-2xl font-bold text-[#EF4444]">{kpi.resubmit}</div><div className="text-sm text-slate-500">Cần nộp lại</div></Card>
          <Card className="p-4 text-center"><div className="text-2xl font-bold text-[#3B82F6]">{kpi.avgScore.toFixed(1)}</div><div className="text-sm text-slate-500">Điểm TB</div></Card>
        </div>
      )}

      {!classId && <div className="text-slate-500 text-center py-12">Vui lòng chọn lớp để bắt đầu chấm bài.</div>}

      {classId && (
        <div className="flex gap-6 flex-1 min-h-0">
          <div className="w-1/3 flex flex-col border rounded-lg bg-white overflow-hidden">
            <div className="p-3 border-b bg-slate-50 font-medium text-sm">Danh sách bài nộp ({filteredQueue.length})</div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {isLoading && <div className="p-4 text-slate-500 text-center">Đang tải...</div>}
              {!isLoading && filteredQueue.length === 0 && <div className="p-4 text-slate-500 text-center">Không có bài nộp nào.</div>}
              {filteredQueue.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSelect(s)}
                  className={`w-full text-left p-3 border rounded cursor-pointer hover:border-[#3B82F6] transition-colors ${selectedSub?.id === s.id ? 'border-[#3B82F6] bg-blue-50' : ''}`}
                >
                  <div className="font-medium text-sm truncate">{s.studentName || s.studentId}</div>
                  <div className="text-xs text-slate-500 mt-1 truncate">Bài tập: {s.assignmentTitle || s.assignmentId}</div>
                  <div className="flex justify-between items-center mt-2">
                    <Badge variant={badgeVariantForStatus(s.status)}>{statusLabels[s.status]}</Badge>
                    {s.score != null && <span className="text-sm font-semibold text-[#16A34A]">{s.score}/{s.maxScore ?? '-'}</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="w-2/3 flex flex-col border rounded-lg bg-white overflow-hidden">
            {selectedSub ? (
              <div className="flex flex-col h-full">
                <div className="p-4 border-b bg-slate-50">
                  <div className="font-bold text-lg">{selectedStudent}</div>
                  <div className="text-sm text-slate-500">Bài tập: {selectedTitle} • Lớp: {selectedSub.className || 'Chưa rõ'} • Nộp lúc: {formatDateTime(selectedSub.submittedAt)}</div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  <div className="mb-6">
                    <div className="font-semibold mb-2">Nội dung bài nộp:</div>
                    <div className="p-4 bg-slate-50 rounded border whitespace-pre-wrap min-h-[100px]">
                      {selectedSub.contentText || <span className="text-slate-400 italic">Không có nội dung văn bản</span>}
                    </div>
                    {selectedSub.contentUrl && <a className="mt-2 inline-block text-sm text-[#3B82F6] hover:underline" href={selectedSub.contentUrl} target="_blank" rel="noreferrer">Mở liên kết bài nộp</a>}
                    {selectedSub.fileId && (
                      <div className="mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadFile.mutate({ fileId: selectedSub.fileId!, fileName: `${selectedStudent}-${selectedTitle}` })}
                          disabled={downloadFile.isPending}
                        >
                          {downloadFile.isPending ? 'Đang tải...' : 'Tải file đính kèm'}
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-6">
                    <div className="font-semibold mb-4">Chấm điểm & nhận xét</div>
                    <form onSubmit={form.handleSubmit(onGrade)} className="space-y-4">
                      <div>
                        <label htmlFor="grading-score" className="block text-sm font-medium mb-1">Điểm số {selectedSub.maxScore != null && <span className="text-slate-500">/ {selectedSub.maxScore}</span>}</label>
                        <Input id="grading-score" type="number" step="0.1" max={selectedSub.maxScore} {...form.register('score')} className="w-32" />
                        {form.formState.errors.score && <div className="text-red-500 text-xs mt-1">{form.formState.errors.score.message as string}</div>}
                      </div>
                      <div>
                        <label htmlFor="grading-feedback" className="block text-sm font-medium mb-1">Nhận xét</label>
                        <Textarea id="grading-feedback" rows={4} {...form.register('feedback')} placeholder="Nhập nhận xét rõ ràng để học viên biết cần cải thiện điều gì..." />
                        {form.formState.errors.feedback && <div className="text-red-500 text-xs mt-1">{form.formState.errors.feedback.message as string}</div>}
                      </div>

                      {gradeMut.isError && <div className="text-red-500 text-sm">Lỗi: {(gradeMut.error as any)?.response?.data?.message || 'Không thể lưu điểm'}</div>}
                      {resubmitMut.isError && <div className="text-red-500 text-sm">Lỗi: {(resubmitMut.error as any)?.response?.data?.message || 'Không thể yêu cầu nộp lại'}</div>}

                      <div className="flex gap-3 pt-2">
                        <Button type="submit" disabled={gradeMut.isPending}>
                          {gradeMut.isPending ? 'Đang lưu...' : 'Lưu điểm'}
                        </Button>
                        <Button type="button" variant="destructive" onClick={onRequestResubmit} disabled={resubmitMut.isPending || selectedSub.status === 'RESUBMIT_REQUESTED'}>
                          {resubmitMut.isPending ? 'Đang xử lý...' : 'Yêu cầu nộp lại'}
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500">Chọn một bài nộp để chấm</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

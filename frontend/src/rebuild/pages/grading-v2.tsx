import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Download, Send } from 'lucide-react'
import { EmptyState, ErrorState, PageHeader, PaginationControls, SearchInput, SkeletonCard, StatusBadge } from '../components/foundation'
import { api } from '../core/api'
import type { SubmissionItem } from '../core/types'
import { Button, Card, Input, TextArea } from '../layout/ui'
import { asPage, fmtDate } from './phase2-utils'

export function GradingV2Page() {
  const qc = useQueryClient()
  const [classId, setClassId] = useState('')
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [score, setScore] = useState('')
  const [feedback, setFeedback] = useState('')
  const classes = useQuery({ queryKey: ['classes', 'grading-v2'], queryFn: () => api.classesPage({ page: 0, size: 100 }) })
  const submissions = useQuery({ queryKey: ['grading-v2', classId, page, search], queryFn: () => api.classGradingSubmissionsPage(classId, { page, size: 12, search }), enabled: Boolean(classId) })
  const classPage = asPage(classes.data, 0, 100)
  const queue = asPage(submissions.data, page, 12)
  const selected = useMemo<SubmissionItem | null>(() => queue.items.find((item) => item.id === selectedId) ?? queue.items[0] ?? null, [queue.items, selectedId])
  const draftKey = selected ? `grading-draft:${selected.id}` : ''
  useEffect(() => { if (!selected) return; setSelectedId(selected.id); setScore(String(selected.score ?? '')); setFeedback(localStorage.getItem(`grading-draft:${selected.id}`) ?? selected.feedback ?? '') }, [selected])
  useEffect(() => { if (draftKey) localStorage.setItem(draftKey, feedback) }, [draftKey, feedback])
  const save = useMutation({ mutationFn: () => selected?.gradeId ? api.updateGrade(selected.gradeId, { score: Number(score), feedback }) : api.gradeSubmission(selected!.id, { score: Number(score), feedback }), onSuccess: async () => { if (draftKey) localStorage.removeItem(draftKey); await qc.invalidateQueries({ queryKey: ['grading-v2', classId] }) } })
  const resubmit = useMutation({ mutationFn: () => api.requestResubmit(selected!.id), onSuccess: async () => qc.invalidateQueries({ queryKey: ['grading-v2', classId] }) })
  const bulk = useMutation({ mutationFn: () => api.bulkGrade(selected!.assignmentId, queue.items.filter((s) => s.status !== 'GRADED').map((s) => ({ submissionId: s.id, score: Number(score || s.score || 0), feedback: feedback || undefined }))), onSuccess: async () => qc.invalidateQueries({ queryKey: ['grading-v2', classId] }) })

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && selected && score) { event.preventDefault(); save.mutate() }
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        const index = queue.items.findIndex((item) => item.id === selectedId)
        const next = event.key === 'ArrowDown' ? Math.min(queue.items.length - 1, index + 1) : Math.max(0, index - 1)
        if (queue.items[next]) setSelectedId(queue.items[next].id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [queue.items, save, score, selected, selectedId])

  return <div className="space-y-5"><PageHeader eyebrow="채점 센터" title="Grading Center" description="Split view queue + grading panel. Cmd/Ctrl+Enter để lưu, Arrow Up/Down đổi bài. Feedback draft autosave local." />
    <Card className="flex flex-col gap-3 md:flex-row"><select className="rounded-2xl border border-sky-100 bg-white px-3 py-2.5 text-sm" value={classId} onChange={(e) => { setClassId(e.target.value); setPage(0); setSelectedId('') }}><option value="">Chọn lớp</option>{classPage.items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><SearchInput value={search} onChange={(e) => { setPage(0); setSearch(e.target.value) }} placeholder="Tìm học viên/bài tập" /></Card>
    <div className="grid gap-5 xl:grid-cols-[390px_1fr]">
      <Card className="rounded-3xl">{!classId && <EmptyState title="Chọn lớp để bắt đầu" />}{submissions.isLoading && <SkeletonCard />}{submissions.isError && <ErrorState onRetry={() => void submissions.refetch()} />}{classId && !submissions.isLoading && queue.items.length === 0 && <EmptyState title="Không có bài cần chấm" />}{queue.items.length > 0 && <><div className="max-h-[650px] space-y-2 overflow-auto pr-1">{queue.items.map((item) => <button key={item.id} className={`w-full rounded-2xl border p-3 text-left transition ${selectedId === item.id ? 'border-indigo-300 bg-indigo-50' : 'border-sky-100 bg-white hover:bg-sky-50'}`} onClick={() => setSelectedId(item.id)}><div className="flex items-start justify-between gap-2"><div><p className="font-bold text-slate-950">{item.studentName}</p><p className="text-xs text-slate-500">{item.assignmentTitle}</p></div><StatusBadge value={item.status} /></div><p className="mt-2 text-xs text-slate-400">{fmtDate(item.submittedAt)}</p></button>)}</div><div className="mt-4"><PaginationControls page={queue.page} totalPages={queue.totalPages} onPageChange={setPage} /></div></>}</Card>
      <Card className="min-h-[640px] rounded-3xl">{!selected ? <EmptyState title="Chọn bài nộp" description="Nội dung và panel chấm điểm sẽ hiển thị tại đây." /> : <div className="space-y-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-2xl font-black text-slate-950">{selected.assignmentTitle}</h2><p className="text-sm text-slate-500">{selected.studentName} · {selected.className}</p></div><StatusBadge value={selected.status} /></div><div className="rounded-3xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">{selected.contentText || 'Không có nội dung văn bản.'}</div>{selected.contentUrl && <a className="text-sm font-bold text-indigo-600" href={selected.contentUrl} target="_blank" rel="noreferrer">Mở URL bài làm</a>}{selected.fileId && <Button variant="secondary" onClick={() => api.downloadFile(selected.fileId!, `submission-${selected.id}`)}><Download size={16} /> Tải file bài làm</Button>}<div className="grid gap-3 md:grid-cols-[180px_1fr]"><Input type="number" min="0" max={selected.maxScore ?? 100} value={score} onChange={(e) => setScore(e.target.value)} placeholder="Điểm" /><TextArea rows={8} value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Feedback cho học viên" /></div><div className="flex flex-wrap gap-2"><Button disabled={!score || save.isPending} onClick={() => save.mutate()}><Send size={16} /> Lưu điểm</Button><Button variant="secondary" disabled={resubmit.isPending} onClick={() => resubmit.mutate()}>Request resubmit</Button><Button variant="secondary" disabled={!score || bulk.isPending} onClick={() => bulk.mutate()}>Bulk grade queue</Button></div><p className="text-xs text-slate-400">Phím tắt: Cmd/Ctrl+Enter lưu · Arrow Up/Down đổi bài.</p></div>}</Card>
    </div>
  </div>
}

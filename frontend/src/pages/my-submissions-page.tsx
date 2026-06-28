import { Link } from 'react-router-dom'
import { useMySubmissions } from '../features/submissions/hooks'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'

export function MySubmissionsPage() {
  const { data, isLoading } = useMySubmissions()
  
  const total = data?.length || 0
  const graded = data?.filter(s => s.status === 'GRADED').length || 0
  const resubmit = data?.filter(s => s.status === 'RESUBMIT_REQUESTED').length || 0
  const late = data?.filter(s => s.status === 'LATE').length || 0

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#1E3A8A]">Bài nộp của tôi</h1>
      
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <div className="rounded-xl bg-slate-50 p-4 text-center border">
          <div className="text-2xl font-bold text-[#3B82F6]">{total}</div>
          <div className="text-sm text-slate-500 mt-1">Tổng bài đã nộp</div>
        </div>
        <div className="rounded-xl bg-slate-50 p-4 text-center border">
          <div className="text-2xl font-bold text-[#10B981]">{graded}</div>
          <div className="text-sm text-slate-500 mt-1">Đã chấm</div>
        </div>
        <div className="rounded-xl bg-slate-50 p-4 text-center border">
          <div className="text-2xl font-bold text-[#F59E0B]">{resubmit}</div>
          <div className="text-sm text-slate-500 mt-1">Cần nộp lại</div>
        </div>
        <div className="rounded-xl bg-slate-50 p-4 text-center border">
          <div className="text-2xl font-bold text-[#EF4444]">{late}</div>
          <div className="text-sm text-slate-500 mt-1">Nộp trễ</div>
        </div>
      </div>

      {isLoading && <div className="text-slate-500">Đang tải...</div>}
      {!isLoading && (!data || data.length === 0) && <div className="text-slate-500">Bạn chưa nộp bài nào.</div>}
      <div className="space-y-3">
        {data?.map(s => (
          <Card key={s.id} className="p-4 flex justify-between items-center">
            <div>
              <div className="font-medium">Bài tập: {s.assignmentId}</div>
              <div className="text-xs text-slate-500 mt-1">{new Date(s.submittedAt).toLocaleString('vi-VN')}</div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={s.status === 'GRADED' ? 'default' : 'outline'}>{s.status}</Badge>
              {s.score != null && <span className="font-semibold text-[#16A34A]">{s.score}</span>}
              <Link to={`/submissions/${s.id}`} className="text-sm text-[#3B82F6]">Chi tiết</Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

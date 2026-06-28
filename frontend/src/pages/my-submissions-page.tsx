import { Link } from 'react-router-dom'
import { useMySubmissions } from '../features/submissions/hooks'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'

export function MySubmissionsPage() {
  const { data, isLoading } = useMySubmissions()
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#1E3A8A]">Bài nộp của tôi</h1>
      {isLoading && <div className="text-slate-500">Đang tải...</div>}
      {!isLoading && (!data || data.length === 0) && <div className="text-slate-500">Bạn chưa nộp bài nào.</div>}
      <div className="space-y-3">
        {data?.map(s => (
          <Card key={s.id} className="p-4 flex justify-between items-center">
            <div>
              <div className="font-medium">{s.assignmentId}</div>
              <div className="text-xs text-slate-500">{s.submittedAt}</div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={s.status === 'GRADED' ? 'default' : 'outline'}>{s.status}</Badge>
              {s.score != null && <span className="font-semibold text-[#16A34A]">{s.score}</span>}
              <Link to={`/assignments/${s.assignmentId}`} className="text-sm text-[#3B82F6]">Chi tiết</Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

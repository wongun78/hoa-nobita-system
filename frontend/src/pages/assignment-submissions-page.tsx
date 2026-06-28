import { useParams, Link } from 'react-router-dom'
import { useSubmissions } from '../features/submissions/hooks'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'

export function AssignmentSubmissionsPage() {
  const { assignmentId = '' } = useParams()
  const { data, isLoading } = useSubmissions(assignmentId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E3A8A]">Bài nộp</h1>
          <p className="text-sm text-slate-500">Assignment {assignmentId}</p>
        </div>
        <Link to={`/assignments/${assignmentId}`}><Button variant="outline">← Quay lại bài tập</Button></Link>
      </div>

      {isLoading && <div className="text-slate-500">Đang tải...</div>}
      {!isLoading && (!data || data.length === 0) && <div className="text-slate-500">Chưa có bài nộp.</div>}

      <div className="space-y-3">
        {data?.map(s => (
          <Card key={s.id} className="p-4 flex justify-between items-center">
            <div>
              <div className="font-medium">{s.contentText?.slice(0,80) || '(không có nội dung)'}</div>
              <div className="text-xs text-slate-500 mt-1">{s.studentId} • {s.submittedAt}</div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline">{s.status}</Badge>
              {s.score != null && <span className="text-sm font-semibold text-[#16A34A]">{s.score}</span>}
              <Link to={`/grading`}><Button size="sm" variant="outline">Chấm bài</Button></Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

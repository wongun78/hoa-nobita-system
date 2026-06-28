import { Badge } from '../../../components/ui/badge'
import type { AssignmentStatus } from '../types'

export function AssignmentStatusBadge({ status }: { status: AssignmentStatus }) {
  switch (status) {
    case 'DRAFT':
      return <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200">Bản nháp</Badge>
    case 'PUBLISHED':
      return <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">Đã xuất bản</Badge>
    case 'CLOSED':
      return <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">Đã đóng</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export function DeadlinePill({ dueAt, status }: { dueAt?: string; status: AssignmentStatus }) {
  if (!dueAt) return <span className="text-xs text-slate-500">Không có hạn</span>
  
  const due = new Date(dueAt)
  const now = new Date()
  const isOverdue = due < now
  const isDueSoon = !isOverdue && (due.getTime() - now.getTime()) < 24 * 60 * 60 * 1000 // 24 hours
  
  const formatted = due.toLocaleString('vi-VN', { 
    hour: '2-digit', minute: '2-digit', 
    day: '2-digit', month: '2-digit', year: 'numeric' 
  })

  if (status === 'CLOSED') {
    return <span className="text-xs text-slate-500 line-through">{formatted}</span>
  }

  if (isOverdue) {
    return <span className="text-xs font-medium text-red-600">Quá hạn ({formatted})</span>
  }

  if (isDueSoon) {
    return <span className="text-xs font-medium text-orange-600">Sắp hết hạn ({formatted})</span>
  }

  return <span className="text-xs text-slate-600">{formatted}</span>
}

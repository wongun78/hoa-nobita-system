import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAssignments, useDeleteAssignment, useCopyAssignment, usePublishAssignment, useCloseAssignment, useUpdateAssignment } from '../features/assignments/hooks'
import { useAuth } from '../features/auth/use-auth'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Select } from '../components/ui/select'
import { ConfirmDialog } from '../components/ui/confirm-dialog'
import { AssignmentStatusBadge, DeadlinePill } from '../features/assignments/components/assignment-badges'
import { AssignmentFormDialog } from '../features/assignments/components/assignment-form-dialog'

export function AssignmentsPage() {
  const { data, isLoading } = useAssignments()
  const { hasRole } = useAuth()
  const deleteAssignment = useDeleteAssignment()
  const copyAssignment = useCopyAssignment()
  const publishAssignment = usePublishAssignment()
  const closeAssignment = useCloseAssignment()
  const updateAssignment = useUpdateAssignment()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [editAssignment, setEditAssignment] = useState<any | null>(null)

  const isTeacher = hasRole('TEACHER_OWNER')
  const isAdmin = hasRole('CLASS_ADMIN')
  const canManage = isTeacher || isAdmin

  const filteredData = data?.filter(a => {
    if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false
    if (statusFilter !== 'ALL' && a.status !== statusFilter) return false
    return true
  })?.sort((a, b) => {
    if (!a.dueAt) return 1
    if (!b.dueAt) return -1
    return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
  })

  const stats = {
    draft: data?.filter(a => a.status === 'DRAFT').length || 0,
    published: data?.filter(a => a.status === 'PUBLISHED').length || 0,
    closed: data?.filter(a => a.status === 'CLOSED').length || 0,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1E3A8A]">Tất cả bài tập</h1>
      </div>

      {canManage && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 bg-slate-50 border-slate-200">
            <div className="text-sm text-slate-500">Bản nháp</div>
            <div className="text-2xl font-bold text-slate-700">{stats.draft}</div>
          </Card>
          <Card className="p-4 bg-green-50 border-green-200">
            <div className="text-sm text-green-600">Đã xuất bản</div>
            <div className="text-2xl font-bold text-green-700">{stats.published}</div>
          </Card>
          <Card className="p-4 bg-gray-50 border-gray-200">
            <div className="text-sm text-gray-500">Đã đóng</div>
            <div className="text-2xl font-bold text-gray-700">{stats.closed}</div>
          </Card>
        </div>
      )}

      <div className="flex gap-4">
        <div className="flex-1">
          <Input placeholder="Tìm kiếm bài tập..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="w-48">
          <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="ALL">Tất cả trạng thái</option>
            <option value="DRAFT">Bản nháp</option>
            <option value="PUBLISHED">Đã xuất bản</option>
            <option value="CLOSED">Đã đóng</option>
          </Select>
        </div>
      </div>

      {isLoading && <div className="text-slate-500">Đang tải...</div>}
      {!isLoading && filteredData?.length === 0 && (
        <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-slate-500">{canManage ? 'Chưa có bài tập nào.' : 'Hiện chưa có bài tập nào được giao.'}</p>
        </div>
      )}

      <div className="grid gap-4">
        {filteredData?.map(a => (
          <Card key={a.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Link to={`/assignments/${a.id}`} className="font-medium text-[#3B82F6] hover:underline text-lg">{a.title}</Link>
                <AssignmentStatusBadge status={a.status} />
              </div>
              <div className="text-sm text-slate-500 flex items-center gap-3">
                {a.className && <span>Lớp: {a.className}</span>}
                <span>Điểm: {a.maxScore}</span>
                <DeadlinePill dueAt={a.dueAt} status={a.status} />
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <Link to={`/assignments/${a.id}`}><Button variant="outline" size="sm">Xem</Button></Link>
              
              {canManage && (
                <>
                  <Button variant="outline" size="sm" onClick={() => setEditAssignment(a)}>Sửa</Button>
                  {a.status === 'DRAFT' && <Button variant="outline" size="sm" onClick={() => publishAssignment.mutate(a.id)}>Xuất bản</Button>}
                  {a.status === 'PUBLISHED' && <Button variant="outline" size="sm" onClick={() => closeAssignment.mutate(a.id)}>Đóng</Button>}
                  <Button variant="outline" size="sm" onClick={() => copyAssignment.mutate(a.id)}>Sao chép</Button>
                  <Link to={`/assignments/${a.id}/submissions`}><Button variant="outline" size="sm">Xem bài nộp</Button></Link>
                  <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setConfirmDelete(a.id)}>Xóa</Button>
                </>
              )}
            </div>
          </Card>
        ))}
      </div>

      <ConfirmDialog 
        open={!!confirmDelete} 
        onClose={() => setConfirmDelete(null)} 
        title="Xóa bài tập" 
        message="Bạn có chắc chắn muốn xóa bài tập này? Hành động này không thể hoàn tác." 
        onConfirm={() => deleteAssignment.mutateAsync(confirmDelete!)} 
        destructive 
      />

      {editAssignment && (
        <AssignmentFormDialog
          open={!!editAssignment}
          onClose={() => setEditAssignment(null)}
          title="Sửa bài tập"
          submitLabel="Lưu thay đổi"
          defaultValues={editAssignment}
          onSubmit={(data) => updateAssignment.mutateAsync({ id: editAssignment.id, req: data })}
        />
      )}
    </div>
  )
}

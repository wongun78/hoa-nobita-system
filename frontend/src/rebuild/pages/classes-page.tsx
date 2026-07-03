import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useNewAuth } from '../auth/use-auth'
import { api } from '../core/api'
import { Button, Card, Input, TextArea } from '../layout/ui'

export function ClassesPage() {
  const { hasRole } = useNewAuth()
  const canManage = hasRole('TEACHER_OWNER', 'CLASS_ADMIN')
  const qc = useQueryClient()
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  const query = useQuery({ queryKey: ['classes'], queryFn: () => api.classes() })
  const createMutation = useMutation({
    mutationFn: () => api.createClass({ name, code, description: description || undefined }),
    onSuccess: async () => {
      setName('')
      setCode('')
      setDescription('')
      setActionMessage('Đã tạo lớp học mới.')
      await qc.invalidateQueries({ queryKey: ['classes'] })
    },
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteClass(id),
    onSuccess: async () => {
      setActionMessage('Đã xóa lớp học.')
      await qc.invalidateQueries({ queryKey: ['classes'] })
    },
  })

  if (query.isLoading) return <div className="text-sm text-slate-500">Đang tải lớp học...</div>
  if (query.isError || !query.data) return <div className="text-sm text-rose-600">Không thể tải danh sách lớp.</div>

  return (
    <div className="space-y-4">
      {canManage && (
        <Card>
          <h1 className="text-xl font-bold">Lớp học</h1>
          {actionMessage && <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{actionMessage}</div>}
          <form
            className="mt-3 grid gap-2 sm:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault()
              if (!name || !code) return
              createMutation.mutate()
            }}
          >
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên lớp" required />
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Mã lớp" required />
            <div className="sm:col-span-2">
              <TextArea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Mô tả" />
            </div>
            <div className="sm:col-span-2">
              <Button disabled={createMutation.isPending}>Tạo lớp</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {query.data.map((item) => (
          <Card key={item.id}>
            <div className="text-xs uppercase tracking-wide text-slate-500">{item.code}</div>
            <h2 className="mt-1 text-lg font-bold">{item.name}</h2>
            <div className="mt-2 text-sm text-slate-500">{item.teacherName}</div>
            <div className="mt-1 text-sm text-slate-500">Học viên: {item.studentCount}</div>
            <div className="mt-3 flex items-center gap-2">
              <Link className="text-sm font-semibold text-sky-600" to={`/lop-hoc/${item.id}`}>Xem chi tiết</Link>
              {canManage && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    if (!globalThis.confirm('Bạn chắc chắn muốn xóa lớp học này?')) return
                    deleteMutation.mutate(item.id)
                  }}
                  disabled={deleteMutation.isPending}
                >
                  Xóa
                </Button>
              )}
            </div>
          </Card>
        ))}
        {query.data.length === 0 && <div className="text-sm text-slate-500">Chưa có lớp học.</div>}
      </div>
    </div>
  )
}

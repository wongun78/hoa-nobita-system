import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNewAuth } from '../auth/use-auth'
import { api } from '../core/api'
import { Button, Card, FieldLabel, Input, TextArea } from '../layout/ui'

export function NotificationsPage() {
  const { hasRole } = useNewAuth()
  const canManage = hasRole('TEACHER_OWNER', 'CLASS_ADMIN')
  const qc = useQueryClient()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [targetType, setTargetType] = useState<'ALL' | 'CLASS' | 'USER'>('ALL')
  const [targetId, setTargetId] = useState('')
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const query = useQuery({ queryKey: ['notifications'], queryFn: () => api.notifications() })
  const markRead = useMutation({
    mutationFn: (id: string) => api.markNotificationRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
  const createNotification = useMutation({
    mutationFn: () => api.createNotification({ title, content, targetType, targetId: targetId || undefined }),
    onSuccess: async () => {
      setTitle('')
      setContent('')
      setTargetType('ALL')
      setTargetId('')
      setActionMessage('Đã tạo thông báo mới.')
      await qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
  const deleteNotification = useMutation({
    mutationFn: (id: string) => api.deleteNotification(id),
    onSuccess: async () => {
      setActionMessage('Đã xóa thông báo.')
      await qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  if (query.isLoading) return <div className="text-sm text-slate-500">Đang tải thông báo...</div>
  if (query.isError || !query.data) return <div className="text-sm text-rose-600">Không thể tải thông báo.</div>

  return (
    <div className="space-y-3">
      {canManage && (
        <Card>
          <h1 className="text-lg font-semibold">Tạo thông báo mới</h1>
          {actionMessage && <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{actionMessage}</div>}
          <form
            className="mt-3 space-y-2"
            onSubmit={(event) => {
              event.preventDefault()
              if (!title || !content) return
              createNotification.mutate()
            }}
          >
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tiêu đề" required />
            <TextArea rows={3} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Nội dung" required />
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor="targetType">Phạm vi</FieldLabel>
                <select
                  id="targetType"
                  className="w-full rounded-xl border border-sky-100 bg-white px-3 py-2 text-sm"
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value as 'ALL' | 'CLASS' | 'USER')}
                >
                  <option value="ALL">Toàn hệ thống</option>
                  <option value="CLASS">Theo lớp</option>
                  <option value="USER">Theo người dùng</option>
                </select>
              </div>
              {targetType !== 'ALL' && (
                <div>
                  <FieldLabel htmlFor="targetId">Target ID</FieldLabel>
                  <Input id="targetId" value={targetId} onChange={(e) => setTargetId(e.target.value)} placeholder="Nhập classId hoặc userId" />
                </div>
              )}
            </div>
            <Button disabled={createNotification.isPending}>Gửi thông báo</Button>
          </form>
        </Card>
      )}

      {query.data.map((item) => (
        <Card key={item.id} className={item.isRead ? '' : 'border-sky-300 bg-sky-50'}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-500">{item.targetType}</div>
              <h2 className="mt-1 text-lg font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{item.content}</p>
              <p className="mt-2 text-xs text-slate-400">{new Date(item.createdAt).toLocaleString('vi-VN')}</p>
            </div>
            {!item.isRead && (
              <button
                className="rounded-lg border border-sky-200 px-3 py-1 text-xs font-semibold text-slate-700"
                onClick={() => markRead.mutate(item.id)}
                disabled={markRead.isPending}
              >
                Đánh dấu đã đọc
              </button>
            )}
            {canManage && (
              <button
                className="rounded-lg border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-700"
                onClick={() => deleteNotification.mutate(item.id)}
                disabled={deleteNotification.isPending}
              >
                Xóa
              </button>
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}

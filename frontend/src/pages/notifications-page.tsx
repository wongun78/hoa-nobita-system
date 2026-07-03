import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNotifications, useCreateNotification, useDeleteNotification, useMarkNotificationRead } from '../features/notifications/hooks'
import type { Notification } from '../features/notifications/types'
import { useClasses } from '../features/classes/hooks'
import { useAuth } from '../features/auth/use-auth'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Dialog } from '../components/ui/dialog'
import { ConfirmDialog } from '../components/ui/confirm-dialog'
import { FormField } from '../components/ui/form'
import { ErrorState, LoadingState } from '../components/system/states'
import { Page } from './shared'

const notifSchema = z.object({ 
  title: z.string().min(2, 'Tiêu đề quá ngắn'), 
  content: z.string().min(5, 'Nội dung quá ngắn'), 
  targetType: z.enum(['ALL','CLASS','USER']).default('ALL'), 
  targetId: z.string().optional() 
}).refine(data => {
  if (data.targetType === 'CLASS' && !data.targetId) return false;
  if (data.targetType === 'USER' && !data.targetId) return false;
  return true;
}, {
  message: "Vui lòng chọn đối tượng cụ thể",
  path: ["targetId"]
})

export function NotificationsPage() {
  const { data, isLoading, isError } = useNotifications()
  const { data: classes } = useClasses()
  const create = useCreateNotification()
  const delMut = useDeleteNotification()
  const markRead = useMarkNotificationRead()
  const { hasRole, user } = useAuth()
  
  const [open, setOpen] = useState(false)
  const [delId, setDelId] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('ALL_TYPES')
  
  const isTeacher = hasRole('TEACHER_OWNER')
  const isAdmin = hasRole('CLASS_ADMIN')
  const isStudent = hasRole('STUDENT')
  const canCreate = isTeacher || isAdmin

  const form = useForm({ 
    resolver: zodResolver(notifSchema), 
    defaultValues: { 
      title: '', 
      content: '', 
      targetType: isTeacher ? 'ALL' : 'CLASS' as const,
      targetId: ''
    } 
  })

  const targetType = form.watch('targetType')

  const onCreate = async (v: any) => { 
    // Clean up targetId if ALL
    const payload = { ...v }
    if (payload.targetType === 'ALL') {
      delete payload.targetId
    }
    await create.mutateAsync(payload)
    setOpen(false)
    form.reset() 
  }

  const onDelete = async () => {
    if (delId) {
      await delMut.mutateAsync(delId)
      setDelId(null)
    }
  }

  if (isLoading) return <Page title="Thông báo"><LoadingState text="Đang tải thông báo..."/></Page>
  if (isError) return <Page title="Thông báo"><ErrorState text="Không thể tải thông báo"/></Page>

  const filteredData = filter === 'ALL_TYPES' ? data : data?.filter((n: Notification) => n.targetType === filter)
  const unreadCount = data?.filter((n: Notification) => !n.isRead).length ?? 0

  const getTargetDisplay = (n: Notification) => {
    if (n.targetType === 'ALL') return 'Toàn hệ thống'
    if (n.targetType === 'CLASS') {
      const c = classes?.find(c => c.id === n.targetId)
      return `Lớp: ${c ? c.name : n.targetId}`
    }
    if (n.targetType === 'USER') return `Người dùng: ${n.targetId}`
    return n.targetType
  }

  const targetBadgeClass = (targetType: Notification['targetType']) => {
    if (targetType === 'ALL') return 'bg-blue-100 text-blue-800'
    if (targetType === 'CLASS') return 'bg-emerald-100 text-emerald-800'
    return 'bg-amber-100 text-amber-800'
  }

  return (
    <Page title="Thông báo">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <p className="text-slate-500">Cập nhật thông tin mới nhất từ hệ thống và lớp học. Chưa đọc: {unreadCount}</p>
        {canCreate && (
          <Button onClick={() => {
            form.reset({ title: '', content: '', targetType: isTeacher ? 'ALL' : 'CLASS', targetId: '' })
            setOpen(true)
          }}>+ Tạo thông báo</Button>
        )}
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <Button variant={filter === 'ALL_TYPES' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('ALL_TYPES')}>Tất cả</Button>
        <Button variant={filter === 'ALL' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('ALL')}>Hệ thống</Button>
        <Button variant={filter === 'CLASS' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('CLASS')}>Lớp học</Button>
        {isTeacher && <Button variant={filter === 'USER' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('USER')}>Cá nhân</Button>}
      </div>

      {(!filteredData || filteredData.length === 0) && (
        <div className="text-center p-12 border rounded-xl bg-slate-50 text-slate-500">
          {isStudent ? "Bạn chưa có thông báo nào." : "Chưa có thông báo nào."}
        </div>
      )}
      
      <div className="space-y-4">
        {filteredData?.map((n: Notification) => {
          const canDelete = isTeacher || (isAdmin && n.createdBy === user?.id)
          
          return (
            <Card
              key={n.id}
              className={`p-5 transition ${n.isRead ? 'bg-white' : 'bg-amber-50/50 border-amber-200'}`}
              onClick={() => {
                if (!n.isRead && !markRead.isPending) {
                  markRead.mutate(n.id)
                }
              }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${targetBadgeClass(n.targetType)}`}>
                      {getTargetDisplay(n)}
                    </span>
                    <span className="text-xs text-slate-400">{new Date(n.createdAt).toLocaleString('vi-VN')}</span>
                    {!n.isRead && <span className="text-[10px] uppercase tracking-wide text-amber-700 bg-amber-100 px-2 py-0.5 rounded">Mới</span>}
                  </div>
                  <h3 className="font-bold text-lg text-slate-800">{n.title}</h3>
                </div>
                {canDelete && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation()
                      setDelId(n.id)
                    }}
                  >
                    Xóa
                  </Button>
                )}
              </div>
              <div className="text-slate-600 mt-3 whitespace-pre-wrap">{n.content}</div>
            </Card>
          )
        })}
      </div>

      <Dialog open={open} onClose={() => setOpen(false)} title="Tạo thông báo">
        <form onSubmit={form.handleSubmit(onCreate)} className="space-y-4">
          <FormField name="title" label="Tiêu đề" />
          <FormField name="content" label="Nội dung" />
          
          <div>
            <label htmlFor="targetType" className="text-sm font-medium text-slate-700">Đối tượng nhận</label>
            <select id="targetType" {...form.register('targetType')} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm">
              {isTeacher && <option value="ALL">Toàn hệ thống</option>}
              <option value="CLASS">Lớp học</option>
              {isTeacher && <option value="USER">Người dùng</option>}
            </select>
          </div>
          
          {targetType === 'CLASS' && (
            <div>
              <label htmlFor="targetId" className="text-sm font-medium text-slate-700">Chọn lớp học</label>
              <select id="targetId" {...form.register('targetId')} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm">
                <option value="">-- Chọn lớp --</option>
                {classes?.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {form.formState.errors.targetId && (
                <p className="text-xs text-red-500 mt-1">{form.formState.errors.targetId.message as string}</p>
              )}
            </div>
          )}
          
          {targetType === 'USER' && (
            <FormField name="targetId" label="ID Người dùng" />
          )}
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
            <Button type="submit" disabled={create.isPending}>Gửi thông báo</Button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        open={!!delId}
        onClose={() => setDelId(null)}
        title="Xóa thông báo"
        message="Bạn có chắc chắn muốn xóa thông báo này? Hành động này không thể hoàn tác."
        onConfirm={onDelete}
        destructive
      />
    </Page>
  )
}

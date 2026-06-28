import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNotifications, useCreateNotification } from '../features/notifications/hooks'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Dialog } from '../components/ui/dialog'
import { FormField } from '../components/ui/form'

const notifSchema = z.object({ title: z.string().min(2), content: z.string().min(5), targetType: z.enum(['ALL','CLASS','USER']).default('ALL'), targetId: z.string().optional() })

export function NotificationsPage() {
  const { data, isLoading } = useNotifications()
  const create = useCreateNotification()
  const [open, setOpen] = useState(false)
  const form = useForm({ resolver: zodResolver(notifSchema), defaultValues: { title: '', content: '', targetType: 'ALL' as const } })

  const onCreate = async (v: any) => { await create.mutateAsync(v); setOpen(false); form.reset() }

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold text-[#1E3A8A]">Thông báo</h1>
        <Button onClick={() => setOpen(true)}>+ Tạo thông báo</Button>
      </div>

      {isLoading && <div className="text-slate-500">Đang tải...</div>}
      {!isLoading && (!data || data.length === 0) && <div className="text-slate-500">Chưa có thông báo.</div>}
      <div className="space-y-3">
        {data?.map((n: any) => (
          <Card key={n.id} className="p-4">
            <div className="font-semibold">{n.title}</div>
            <div className="text-sm text-slate-600 mt-1">{n.content}</div>
            <div className="text-xs text-slate-400 mt-2">{n.targetType} {n.targetId ? `• ${n.targetId}` : ''}</div>
          </Card>
        ))}
      </div>

      <Dialog open={open} onClose={() => setOpen(false)} title="Tạo thông báo">
        <form onSubmit={form.handleSubmit(onCreate)} className="space-y-4">
          <FormField name="title" label="Tiêu đề" />
          <FormField name="content" label="Nội dung" />
          <div>
            <label className="text-sm font-medium">Đối tượng</label>
            <select {...form.register('targetType')} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm">
              <option value="ALL">Tất cả</option>
              <option value="CLASS">Lớp</option>
              <option value="USER">Người dùng</option>
            </select>
          </div>
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Hủy</Button><Button type="submit">Gửi</Button></div>
        </form>
      </Dialog>
    </div>
  )
}

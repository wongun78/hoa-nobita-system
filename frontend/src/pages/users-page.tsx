import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { useUsers, useCreateUser, useDeleteUser, useUpdateUserStatus } from '../features/users/hooks'
import { createUserSchema, type CreateUserForm } from '../features/users/schema'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Dialog } from '../components/ui/dialog'
import { ConfirmDialog } from '../components/ui/confirm-dialog'
import { Badge } from '../components/ui/badge'
import { FormField } from '../components/ui/form'

export function UsersPage() {
  const { data, isLoading, isError } = useUsers()
  const create = useCreateUser()
  const del = useDeleteUser()
  const statusMut = useUpdateUserStatus()

  const [open, setOpen] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [tempPwd, setTempPwd] = useState<string | null>(null)

  const form = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { fullName: '', email: '', role: 'STUDENT' },
  })

  const onCreate = async (values: CreateUserForm) => {
    const res = await create.mutateAsync(values)
    setOpen(false)
    form.reset()
    if ((res as any).temporaryPassword) setTempPwd((res as any).temporaryPassword)
  }

  const toggleStatus = (u: any) => {
    const next = u.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED'
    statusMut.mutate({ id: u.id, req: { status: next } })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1E3A8A]">Quản lý người dùng</h1>
        <Button onClick={() => setOpen(true)}>+ Thêm người dùng</Button>
      </div>

      <Card className="overflow-x-auto">
        {isLoading && <div className="p-8 text-center text-slate-500">Đang tải...</div>}
        {isError && <div className="p-8 text-center text-red-600">Lỗi tải danh sách người dùng.</div>}
        {!isLoading && !isError && (!data || data.length === 0) && <div className="p-8 text-center text-slate-500">Chưa có người dùng nào.</div>}
        {data && data.length > 0 && (
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-slate-500"><th className="py-3 px-4">Họ tên</th><th>Email</th><th>Vai trò</th><th>Trạng thái</th><th className="text-right pr-4"></th></tr></thead>
            <tbody>
              {data.map(u => (
                <tr key={u.id} className="border-b hover:bg-slate-50">
                  <td className="py-3 px-4 font-medium">
                    <Link to={`/users/${u.id}`} className="text-[#1E3A8A] hover:underline">
                      {u.fullName}
                    </Link>
                  </td>
                  <td className="text-slate-600">{u.email}</td>
                  <td><Badge variant="outline">{u.roles?.[0]}</Badge></td>
                  <td>
                    <button onClick={() => toggleStatus(u)} className="text-[#3B82F6] hover:underline">
                      {u.status ?? 'ACTIVE'}
                    </button>
                  </td>
                  <td className="text-right pr-4 space-x-3">
                    <Link to={`/users/${u.id}`} className="text-[#3B82F6] hover:underline">Chi tiết</Link>
                    <button onClick={() => setConfirmId(u.id)} className="text-red-600 hover:underline">Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} title="Thêm người dùng">
        <form onSubmit={form.handleSubmit(onCreate)} className="space-y-4">
          <FormField name="fullName" label="Họ tên" />
          <FormField name="email" label="Email" />
          <div>
            <label className="text-sm font-medium text-slate-700">Vai trò</label>
            <select {...form.register('role')} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm">
              <option value="STUDENT">STUDENT</option>
              <option value="CLASS_ADMIN">CLASS_ADMIN</option>
              <option value="TEACHER_OWNER">TEACHER_OWNER</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
            <Button type="submit" disabled={create.isPending}>Tạo người dùng</Button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog open={!!confirmId} onClose={() => setConfirmId(null)} title="Xóa người dùng" message="Bạn chắc chắn muốn xóa người dùng này?" onConfirm={() => del.mutateAsync(confirmId!)} destructive />

      <Dialog open={!!tempPwd} onClose={() => setTempPwd(null)} title="Mật khẩu tạm thời">
        <div className="space-y-3 text-sm">
          <p>Người dùng cần đổi mật khẩu sau lần đăng nhập đầu tiên.</p>
          <div className="rounded-lg bg-slate-100 p-3 font-mono text-lg tracking-widest">{tempPwd}</div>
          <Button onClick={() => setTempPwd(null)} className="w-full">Đã lưu</Button>
        </div>
      </Dialog>
    </div>
  )
}

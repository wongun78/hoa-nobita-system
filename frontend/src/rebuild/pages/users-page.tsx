import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../core/api'
import { Button, Card, FieldLabel, Input, TextArea } from '../layout/ui'

export function UsersPage() {
  const qc = useQueryClient()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<'TEACHER_OWNER' | 'CLASS_ADMIN' | 'STUDENT'>('STUDENT')
  const [note, setNote] = useState('')
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  const query = useQuery({ queryKey: ['users'], queryFn: () => api.users() })
  const createMutation = useMutation({
    mutationFn: () => api.createUser({ fullName, email: email || undefined, phone: phone || undefined, role, note: note || undefined }),
    onSuccess: async () => {
      setFullName('')
      setEmail('')
      setPhone('')
      setRole('STUDENT')
      setNote('')
      setActionMessage('Đã tạo người dùng mới.')
      await qc.invalidateQueries({ queryKey: ['users'] })
    },
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' }) => api.updateUserStatus(id, status),
    onSuccess: async () => {
      setActionMessage('Đã cập nhật trạng thái người dùng.')
      await qc.invalidateQueries({ queryKey: ['users'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteUser(id),
    onSuccess: async () => {
      setActionMessage('Đã xóa người dùng.')
      await qc.invalidateQueries({ queryKey: ['users'] })
    },
  })

  if (query.isLoading) return <div className="text-sm text-slate-500">Đang tải danh sách người dùng...</div>
  if (query.isError || !query.data) return <div className="text-sm text-rose-600">Không thể tải người dùng.</div>

  return (
    <div className="space-y-4">
      <Card>
        <h1 className="text-xl font-bold">Người dùng</h1>
        {actionMessage && <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{actionMessage}</div>}

        <form
          className="mt-3 grid gap-2 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault()
            if (!fullName) return
            createMutation.mutate()
          }}
        >
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Họ tên" required />
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Số điện thoại" />
          <div>
            <FieldLabel htmlFor="role">Vai trò</FieldLabel>
            <select
              id="role"
              className="w-full rounded-xl border border-sky-100 bg-white px-3 py-2 text-sm"
              value={role}
              onChange={(e) => setRole(e.target.value as 'TEACHER_OWNER' | 'CLASS_ADMIN' | 'STUDENT')}
            >
              <option value="STUDENT">Học viên</option>
              <option value="CLASS_ADMIN">Quản trị lớp</option>
              <option value="TEACHER_OWNER">Chủ trung tâm</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <TextArea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ghi chú" />
          </div>
          <div className="sm:col-span-2">
            <Button disabled={createMutation.isPending}>Tạo người dùng</Button>
          </div>
        </form>
      </Card>

      <Card>
        <div className="overflow-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-sky-100 text-left text-slate-500">
                <th className="px-2 py-2 font-medium">Họ tên</th>
                <th className="px-2 py-2 font-medium">Email</th>
                <th className="px-2 py-2 font-medium">Số điện thoại</th>
                <th className="px-2 py-2 font-medium">Vai trò</th>
                <th className="px-2 py-2 font-medium">Trạng thái</th>
                <th className="px-2 py-2 font-medium">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {query.data.map((item) => (
                <tr key={item.id} className="border-b border-sky-50">
                  <td className="px-2 py-2 font-semibold">{item.fullName}</td>
                  <td className="px-2 py-2">{item.email || '-'}</td>
                  <td className="px-2 py-2">{item.phone || '-'}</td>
                  <td className="px-2 py-2">{item.roles.join(', ')}</td>
                  <td className="px-2 py-2">{item.status}</td>
                  <td className="px-2 py-2">
                    <div className="flex gap-1">
                      {item.status !== 'ACTIVE' && (
                        <Button variant="ghost" onClick={() => statusMutation.mutate({ id: item.id, status: 'ACTIVE' })} disabled={statusMutation.isPending}>
                          Kích hoạt
                        </Button>
                      )}
                      {item.status !== 'SUSPENDED' && (
                        <Button variant="ghost" onClick={() => statusMutation.mutate({ id: item.id, status: 'SUSPENDED' })} disabled={statusMutation.isPending}>
                          Tạm khóa
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        onClick={() => {
                          if (!globalThis.confirm('Bạn chắc chắn muốn xóa người dùng này?')) return
                          deleteMutation.mutate(item.id)
                        }}
                        disabled={deleteMutation.isPending}
                      >
                        Xóa
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

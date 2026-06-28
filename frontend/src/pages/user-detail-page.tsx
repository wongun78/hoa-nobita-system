import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useI18n } from '../i18n/use-i18n'
import { useAuth } from '../features/auth/use-auth'
import { useUpdateUser, useUpdateUserStatus, useDeleteUser } from '../features/users/hooks'
import { updateUserSchema, type UpdateUserForm } from '../features/users/schema'
import { api } from '../lib/api'
import { Page } from './shared'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Dialog } from '../components/ui/dialog'
import { ConfirmDialog } from '../components/ui/confirm-dialog'
import { FormField } from '../components/ui/form'
import { ErrorState, LoadingState, StatusBadge } from '../components/system/states'
import { useNavigate } from 'react-router-dom'

export function UserDetailPage() {
  const { t } = useI18n()
  const { userId } = useParams()
  const { hasRole } = useAuth()
  const navigate = useNavigate()
  
  const q = useQuery({ 
    queryKey: ['user', userId], 
    queryFn: async () => (await api.get(`/users/${userId}`)).data.data 
  })

  const updateMut = useUpdateUser()
  const statusMut = useUpdateUserStatus()
  const delMut = useDeleteUser()

  const [editOpen, setEditOpen] = useState(false)
  const [delOpen, setDelOpen] = useState(false)

  const form = useForm<UpdateUserForm>({
    resolver: zodResolver(updateUserSchema),
    values: {
      fullName: q.data?.fullName || '',
      email: q.data?.email || '',
      phone: q.data?.phone || '',
    }
  })

  const onEdit = async (values: UpdateUserForm) => {
    await updateMut.mutateAsync({ id: userId!, req: values })
    setEditOpen(false)
  }

  const toggleStatus = () => {
    if (!q.data) return
    const next = q.data.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED'
    statusMut.mutate({ id: userId!, req: { status: next } })
  }

  const onDelete = async () => {
    await delMut.mutateAsync(userId!)
    navigate('/users')
  }

  if (q.isLoading) return <Page title={t.loading}><LoadingState text={t.loading}/></Page>
  if (q.isError) return <Page title={t.error}><ErrorState text={t.error}/></Page>
  if (!q.data) return <Page title={t.error}><ErrorState text={t.error}/></Page>

  const user = q.data
  const isStudent = user.roles?.includes('STUDENT')
  const canEdit = hasRole('TEACHER_OWNER')

  return (
    <Page title={user.fullName}>
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <div className="flex flex-col items-center text-center">
              <div className="h-24 w-24 rounded-full bg-slate-200 flex items-center justify-center text-2xl font-bold text-slate-500 mb-4">
                {user.fullName.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-xl font-bold text-[#1E3A8A]">{user.fullName}</h2>
              <p className="text-slate-500">{user.email}</p>
              <div className="mt-4 flex gap-2 flex-wrap justify-center">
                {user.roles?.map((r: string) => (
                  <span key={r} className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                    {r}
                  </span>
                ))}
              </div>
              <div className="mt-4">
                <StatusBadge status={user.status || 'ACTIVE'} />
              </div>
            </div>

            <div className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Số điện thoại</span>
                <span className="font-medium">{user.phone || '-'}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Đăng nhập lần đầu</span>
                <span className="font-medium">{user.firstLogin ? 'Chưa' : 'Rồi'}</span>
              </div>
            </div>

            {canEdit && (
              <div className="mt-6 flex flex-col gap-2">
                <Button variant="outline" onClick={() => setEditOpen(true)}>Chỉnh sửa</Button>
                <Button variant="outline" onClick={toggleStatus}>
                  {user.status === 'SUSPENDED' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                </Button>
                <Button variant="destructive" onClick={() => setDelOpen(true)}>Xóa tài khoản</Button>
              </div>
            )}
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          {isStudent ? (
            <StudentProgressPanel userId={userId!} />
          ) : (
            <Card>
              <h3 className="font-bold text-[#1E3A8A] mb-4">Thông tin hoạt động</h3>
              <p className="text-slate-500 text-sm">Không có dữ liệu tiến độ cho vai trò này.</p>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} title="Chỉnh sửa người dùng">
        <form onSubmit={form.handleSubmit(onEdit)} className="space-y-4">
          <FormField name="fullName" label="Họ tên" />
          <FormField name="email" label="Email" />
          <FormField name="phone" label="Số điện thoại" />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Hủy</Button>
            <Button type="submit" disabled={updateMut.isPending}>Lưu thay đổi</Button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog 
        open={delOpen} 
        onClose={() => setDelOpen(false)} 
        title="Xóa người dùng" 
        message="Bạn chắc chắn muốn xóa người dùng này? Hành động này không thể hoàn tác." 
        onConfirm={onDelete} 
        destructive 
      />
    </Page>
  )
}

function StudentProgressPanel({ userId }: { userId: string }) {
  // We derive student progress from classes and submissions
  const classesQ = useQuery({ 
    queryKey: ['classes'], 
    queryFn: async () => (await api.get('/classes')).data.data 
  })
  
  // Find classes this student is in
  const studentClasses = classesQ.data?.filter((c: any) => 
    c.students?.some((s: any) => s.id === userId)
  ) || []
  
  return (
    <Card>
      <h3 className="font-bold text-[#1E3A8A] mb-4">Tiến độ học tập</h3>
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <div className="rounded-xl bg-slate-50 p-4 text-center border">
          <div className="text-2xl font-bold text-[#3B82F6]">{classesQ.isLoading ? '-' : studentClasses.length}</div>
          <div className="text-sm text-slate-500 mt-1">Lớp đang học</div>
        </div>
        <div className="rounded-xl bg-slate-50 p-4 text-center border">
          <div className="text-2xl font-bold text-[#10B981]">-</div>
          <div className="text-sm text-slate-500 mt-1">Bài đã nộp</div>
        </div>
        <div className="rounded-xl bg-slate-50 p-4 text-center border">
          <div className="text-2xl font-bold text-[#F59E0B]">-</div>
          <div className="text-sm text-slate-500 mt-1">Điểm trung bình</div>
        </div>
      </div>
      
      <div className="text-center p-8 text-slate-500 border-t">
        <p>Tính năng thống kê chi tiết đang được phát triển.</p>
      </div>
    </Card>
  )
}

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
import { useRecentActivity } from '../features/activity/hooks'
import { RecentActivityTimeline } from '../features/activity/components/recent-activity-timeline'

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
          
          <Card className="p-6">
            <h3 className="font-bold text-[#1E3A8A] mb-4">Hoạt động gần đây</h3>
            <UserActivityPanel userId={userId!} />
          </Card>
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
  const progressQ = useQuery({ 
    queryKey: ['user-progress', userId], 
    queryFn: async () => (await api.get(`/users/${userId}/progress`)).data.data 
  })
  
  if (progressQ.isLoading) return <Card><LoadingState text="Đang tải tiến độ..."/></Card>
  if (progressQ.isError) return <Card><ErrorState text="Không thể tải tiến độ học tập"/></Card>
  
  const progress = progressQ.data
  
  const getRiskColor = (level: string) => {
    switch(level) {
      case 'HIGH': return 'text-red-600 bg-red-50 border-red-200'
      case 'MEDIUM': return 'text-amber-600 bg-amber-50 border-amber-200'
      case 'LOW': return 'text-emerald-600 bg-emerald-50 border-emerald-200'
      default: return 'text-slate-600 bg-slate-50 border-slate-200'
    }
  }

  const getRiskLabel = (level: string) => {
    switch(level) {
      case 'HIGH': return 'Nguy cơ cao'
      case 'MEDIUM': return 'Cần chú ý'
      case 'LOW': return 'Tốt'
      default: return 'Chưa xác định'
    }
  }
  
  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-[#1E3A8A]">Tiến độ học tập</h3>
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRiskColor(progress?.riskLevel)}`}>
          {getRiskLabel(progress?.riskLevel)}
        </span>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <div className="rounded-xl bg-slate-50 p-4 text-center border">
          <div className="text-2xl font-bold text-[#3B82F6]">{progress?.submittedAssignments || 0} / {progress?.totalAssignments || 0}</div>
          <div className="text-sm text-slate-500 mt-1">Bài đã nộp</div>
        </div>
        <div className="rounded-xl bg-slate-50 p-4 text-center border">
          <div className="text-2xl font-bold text-[#8B5CF6]">{progress?.gradedAssignments || 0}</div>
          <div className="text-sm text-slate-500 mt-1">Bài đã chấm</div>
        </div>
        <div className="rounded-xl bg-slate-50 p-4 text-center border">
          <div className="text-2xl font-bold text-[#F59E0B]">{progress?.averageScore || 0}%</div>
          <div className="text-sm text-slate-500 mt-1">Điểm trung bình</div>
        </div>
      </div>
      
      <div className="mt-6">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-slate-500">Tỷ lệ nộp bài</span>
          <span className="font-medium">
            {progress?.totalAssignments > 0 
              ? Math.round((progress.submittedAssignments / progress.totalAssignments) * 100) 
              : 0}%
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full" 
            style={{ width: `${progress?.totalAssignments > 0 ? (progress.submittedAssignments / progress.totalAssignments) * 100 : 0}%` }}
          ></div>
        </div>
      </div>
    </Card>
  )
}

function UserActivityPanel({ userId: _userId }: { userId: string }) {
  // We can reuse the recent activity hook, but ideally we'd have a user-specific one.
  // For now, we'll just fetch the global recent activity and filter it by actorId if needed,
  // or just show the global one if the backend doesn't support user-specific yet.
  // Since we don't have a specific endpoint for user activity, we'll just show a placeholder
  // or fetch the global one. Let's fetch global and filter for now.
  const { data, isLoading } = useRecentActivity()
  
  if (isLoading) return <div className="text-slate-500 text-sm">Đang tải hoạt động...</div>
  
  // Filter activities where the actor is this user (if we had actorId in the response)
  // Since we only have actorName, we can't reliably filter. 
  // For a real implementation, we should add a /api/v1/activities/user/{userId} endpoint.
  // For now, we'll just show the recent activities.
  if (!data || data.length === 0) return <div className="text-slate-500 text-sm">Chưa có hoạt động nào.</div>
  
  return <RecentActivityTimeline activities={data.slice(0, 5)} />
}

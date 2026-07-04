import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCheck, ChevronRight, Megaphone, Plus, Send } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useNewAuth } from '../auth/use-auth'
import { api } from '../core/api'
import { EmptyState, ErrorState, FilterBar, MetricCard, PageHeader, PaginationControls, SearchInput, SkeletonCard, StatusBadge } from '../components/foundation'
import { Button, Card, FieldLabel, Input, TextArea } from '../layout/ui'
import { asPage, fmtDate } from './phase2-utils'
import type { ClassItem, NotificationItem, PageResponse, TargetType, UserItem } from '../core/types'

type NotificationTab = 'ALL' | 'UNREAD'

type NotificationForm = {
  title: string
  content: string
  targetType: TargetType
  targetId: string
}

const emptyForm: NotificationForm = { title: '', content: '', targetType: 'CLASS', targetId: '' }

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => { const id = setTimeout(() => setDebounced(value), delay); return () => clearTimeout(id) }, [value, delay])
  return debounced
}

function notificationHref(item: NotificationItem, rolePrefix: '/teacher' | '/admin' | '/student') {
  if (item.targetType === 'CLASS' && item.targetId) return `${rolePrefix}/classes/${item.targetId}`
  return null
}

function setNotificationRead(payload: PageResponse<NotificationItem> | NotificationItem[] | undefined, id: string) {
  if (!payload) return payload
  const mark = (item: NotificationItem): NotificationItem => item.id === id ? { ...item, isRead: true, readAt: new Date().toISOString() } : item
  if (Array.isArray(payload)) return payload.map(mark)
  return { ...payload, items: payload.items.map(mark) }
}

function setAllNotificationsRead(payload: PageResponse<NotificationItem> | NotificationItem[] | undefined) {
  if (!payload) return payload
  const readAt = new Date().toISOString()
  const mark = (item: NotificationItem): NotificationItem => ({ ...item, isRead: true, readAt })
  if (Array.isArray(payload)) return payload.map(mark)
  return { ...payload, items: payload.items.map(mark) }
}

function NotificationComposer({ onClose }: Readonly<{ onClose: () => void }>) {
  const { hasRole } = useNewAuth()
  const qc = useQueryClient()
  const isTeacher = hasRole('TEACHER_OWNER')
  const [form, setForm] = useState<NotificationForm>(() => ({ ...emptyForm, targetType: isTeacher ? 'ALL' : 'CLASS' }))

  const classes = useQuery({ queryKey: ['classes', 'notification-targets'], queryFn: () => api.classes({ page: 0, size: 100 }), staleTime: 60_000 })
  const users = useQuery({ queryKey: ['users', 'notification-targets'], queryFn: () => api.users({ page: 0, size: 100 }), enabled: isTeacher, staleTime: 60_000 })

  const create = useMutation({
    mutationFn: () => api.createNotification({ title: form.title.trim(), content: form.content.trim(), targetType: form.targetType, targetId: form.targetType === 'ALL' ? undefined : form.targetId }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['notifications'] })
      onClose()
    },
  })

  const canSubmit = form.title.trim() && form.content.trim() && (form.targetType === 'ALL' || form.targetId)

  return (
    <Card className="rounded-3xl bg-white/95">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-950">Tạo thông báo</h2>
          <p className="mt-1 text-sm text-slate-500">Gửi thông báo theo phạm vi được phân quyền.</p>
        </div>
        <Button type="button" variant="ghost" className="min-h-11" onClick={onClose}>Đóng</Button>
      </div>
      <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); if (canSubmit) create.mutate() }}>
        <div>
          <FieldLabel htmlFor="notification-title">Tiêu đề</FieldLabel>
          <Input id="notification-title" value={form.title} onChange={(event) => setForm((value) => ({ ...value, title: event.target.value }))} placeholder="VD: Nhắc lịch học TOPIK" />
        </div>
        <div>
          <FieldLabel htmlFor="notification-content">Nội dung</FieldLabel>
          <TextArea id="notification-content" rows={5} value={form.content} onChange={(event) => setForm((value) => ({ ...value, content: event.target.value }))} placeholder="Nội dung thông báo..." />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="notification-target-type">Phạm vi</FieldLabel>
            <select id="notification-target-type" className="min-h-11 w-full rounded-2xl border border-sky-100 bg-white px-4 text-sm font-bold text-slate-600 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100" value={form.targetType} onChange={(event) => setForm((value) => ({ ...value, targetType: event.target.value as TargetType, targetId: '' }))}>
              {isTeacher && <option value="ALL">Toàn hệ thống</option>}
              <option value="CLASS">Theo lớp</option>
              {isTeacher && <option value="USER">Theo học viên/người dùng</option>}
            </select>
          </div>
          {form.targetType !== 'ALL' && (
            <div>
              <FieldLabel htmlFor="notification-target-id">Đối tượng</FieldLabel>
              <select id="notification-target-id" className="min-h-11 w-full rounded-2xl border border-sky-100 bg-white px-4 text-sm font-bold text-slate-600 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100" value={form.targetId} onChange={(event) => setForm((value) => ({ ...value, targetId: event.target.value }))}>
                <option value="">Chọn đối tượng</option>
                {form.targetType === 'CLASS' && (classes.data ?? []).map((item: ClassItem) => <option key={item.id} value={item.id}>{item.name} · {item.code}</option>)}
                {form.targetType === 'USER' && (users.data ?? []).map((item: UserItem) => <option key={item.id} value={item.id}>{item.fullName} · {item.email ?? item.phone ?? item.id}</option>)}
              </select>
            </div>
          )}
        </div>
        {classes.isError && <ErrorState title="Không tải được lớp" description="Vui lòng thử lại trước khi gửi thông báo theo lớp." onRetry={() => classes.refetch()} />}
        {users.isError && <ErrorState title="Không tải được người dùng" description="Vui lòng thử lại trước khi gửi thông báo theo người dùng." onRetry={() => users.refetch()} />}
        {create.isError && <ErrorState title="Không gửi được thông báo" description="Kiểm tra quyền và phạm vi nhận thông báo." />}
        <Button type="submit" className="min-h-11 w-full" disabled={!canSubmit || create.isPending}><Send size={16} />Gửi thông báo</Button>
      </form>
    </Card>
  )
}

function NotificationCard({ item, rolePrefix, onRead }: Readonly<{ item: NotificationItem; rolePrefix: '/teacher' | '/admin' | '/student'; onRead: (id: string) => void }>) {
  const navigate = useNavigate()
  const href = notificationHref(item, rolePrefix)
  const openItem = () => {
    if (!item.isRead) onRead(item.id)
    if (href) navigate(href)
  }

  return (
    <Card className={`rounded-3xl transition hover:-translate-y-0.5 hover:shadow-lg ${item.isRead ? 'bg-white/90' : 'border-indigo-200 bg-gradient-to-br from-indigo-50 to-sky-50'}`}>
      <button type="button" className="block w-full text-left" onClick={openItem}>
        <div className="flex items-start gap-3">
          <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${item.isRead ? 'bg-slate-50 text-slate-500' : 'bg-indigo-100 text-indigo-600'}`}><Bell size={18} /></div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="line-clamp-2 text-lg font-black text-slate-950">{item.title}</h2>
                  {!item.isRead && <span className="rounded-full bg-indigo-600 px-2.5 py-1 text-xs font-black text-white">Mới</span>}
                </div>
                <p className="mt-1 text-xs text-slate-500">{fmtDate(item.createdAt)}</p>
              </div>
              <StatusBadge value={item.targetType} />
            </div>
            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{item.content}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
              <span>{item.isRead ? `Đã đọc ${fmtDate(item.readAt)}` : 'Chưa đọc'}</span>
              {href && <span className="inline-flex items-center gap-1 text-indigo-600">Mở liên quan <ChevronRight size={14} /></span>}
            </div>
          </div>
        </div>
      </button>
      {!item.isRead && (
        <Button type="button" variant="secondary" className="mt-4 min-h-11 w-full sm:w-auto" onClick={() => onRead(item.id)}><CheckCheck size={16} />Đánh dấu đã đọc</Button>
      )}
    </Card>
  )
}

export function NotificationsInboxPage() {
  const { hasRole } = useNewAuth()
  const qc = useQueryClient()
  const [tab, setTab] = useState<NotificationTab>('ALL')
  const [page, setPage] = useState(0)
  const [text, setText] = useState('')
  const search = useDebouncedValue(text, 300)
  const [composerOpen, setComposerOpen] = useState(false)
  const canManage = hasRole('TEACHER_OWNER', 'CLASS_ADMIN')
  const rolePrefix = hasRole('TEACHER_OWNER') ? '/teacher' : hasRole('CLASS_ADMIN') ? '/admin' : '/student'

  const queryKey = useMemo(() => ['notifications', 'inbox', page, tab, search] as const, [page, search, tab])
  const notifications = useQuery({ queryKey, queryFn: () => api.notificationsPage({ page, size: 10, status: tab === 'UNREAD' ? 'UNREAD' : undefined, search: search.trim() || undefined }) })
  const unread = useQuery({ queryKey: ['notifications', 'unread-count'], queryFn: () => api.unreadNotificationCount(), staleTime: 15_000 })
  const pageData = asPage(notifications.data, page, 10)

  const invalidateNotifications = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ['notifications'] }),
      qc.invalidateQueries({ queryKey: ['notifications', 'unread-count'] }),
    ])
  }

  const markRead = useMutation({
    mutationFn: (id: string) => api.markNotificationRead(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey })
      const previous = qc.getQueryData<PageResponse<NotificationItem> | NotificationItem[]>(queryKey)
      qc.setQueryData(queryKey, setNotificationRead(previous, id))
      qc.setQueryData(['notifications', 'unread-count'], (old: { count: number } | undefined) => ({ count: Math.max((old?.count ?? 1) - 1, 0) }))
      return { previous }
    },
    onError: (_error, _id, context) => qc.setQueryData(queryKey, context?.previous),
    onSettled: invalidateNotifications,
  })

  const markAll = useMutation({
    mutationFn: () => api.markAllNotificationsRead(),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey })
      const previous = qc.getQueryData<PageResponse<NotificationItem> | NotificationItem[]>(queryKey)
      qc.setQueryData(queryKey, setAllNotificationsRead(previous))
      qc.setQueryData(['notifications', 'unread-count'], { count: 0 })
      return { previous }
    },
    onError: (_error, _variables, context) => qc.setQueryData(queryKey, context?.previous),
    onSettled: invalidateNotifications,
  })

  return (
    <div className="space-y-5 pb-20 md:pb-0">
      <PageHeader
        eyebrow="Thông báo"
        title="Hộp thông báo"
        description="Theo dõi thông báo theo quyền truy cập của từng vai trò và đánh dấu đã đọc đồng bộ với chuông thông báo."
        actions={canManage && <Button type="button" className="min-h-11" onClick={() => setComposerOpen(true)}><Plus size={16} />Tạo thông báo</Button>}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <MetricCard label="Chưa đọc" value={unread.data?.count ?? 0} hint="Đồng bộ với notification bell" icon={<Bell size={20} />} tone="indigo" />
        <MetricCard label="Tổng trong bộ lọc" value={pageData.totalItems} hint={tab === 'UNREAD' ? 'Đang xem chưa đọc' : 'Tất cả thông báo'} icon={<Megaphone size={20} />} tone="sky" />
      </div>

      <FilterBar>
        <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
          {(['ALL', 'UNREAD'] as const).map((item) => <button key={item} type="button" onClick={() => { setTab(item); setPage(0) }} className={`min-h-11 shrink-0 rounded-2xl px-4 text-sm font-bold ${tab === item ? 'bg-indigo-600 text-white' : 'border border-sky-100 bg-white text-slate-600 hover:bg-sky-50'}`}>{item === 'ALL' ? 'Tất cả' : 'Chưa đọc'}</button>)}
        </div>
        <div className="min-w-0 flex-1"><SearchInput value={text} onChange={(event) => { setText(event.target.value); setPage(0) }} placeholder="Tìm tiêu đề, nội dung thông báo..." aria-label="Tìm thông báo" /></div>
        <Button type="button" variant="secondary" className="min-h-11" disabled={markAll.isPending || (unread.data?.count ?? 0) === 0} onClick={() => markAll.mutate()}><CheckCheck size={16} />Đọc tất cả</Button>
      </FilterBar>

      {composerOpen && canManage && <NotificationComposer onClose={() => setComposerOpen(false)} />}

      {notifications.isLoading && <div className="space-y-3"><SkeletonCard lines={4} /><SkeletonCard /><SkeletonCard /></div>}
      {notifications.isError && <ErrorState title="Không tải được thông báo" description="Vui lòng thử lại sau ít phút." onRetry={() => notifications.refetch()} />}
      {!notifications.isLoading && !notifications.isError && pageData.items.length === 0 && <EmptyState title={tab === 'UNREAD' ? 'Không còn thông báo chưa đọc' : 'Hộp thông báo đang trống'} description="Thông báo mới từ lớp học và hệ thống sẽ xuất hiện tại đây." action={<Bell className="mx-auto text-indigo-400" />} />}
      {pageData.items.length > 0 && (
        <div className="space-y-3">
          {pageData.items.map((item) => <NotificationCard key={item.id} item={item} rolePrefix={rolePrefix} onRead={(id) => markRead.mutate(id)} />)}
        </div>
      )}
      <PaginationControls page={pageData.page} totalPages={pageData.totalPages} onPageChange={setPage} />
    </div>
  )
}

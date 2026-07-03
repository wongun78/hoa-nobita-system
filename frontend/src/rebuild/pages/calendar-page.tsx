import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { BookOpenCheck, CalendarDays, Clock3, GraduationCap, ListChecks } from 'lucide-react'
import { api } from '../core/api'
import { EmptyState, ErrorState, FilterBar, MetricCard, PageHeader, SkeletonCard, StatusBadge } from '../components/foundation'
import { Button, FieldLabel } from '../layout/ui'
import { useNewAuth } from '../auth/use-auth'
import type { CalendarEvent, ClassItem, RoleName } from '../core/types'

type AgendaEvent = CalendarEvent & {
  startsAt: Date
  dateKey: string
  kindLabel: string
}

const dayFormatter = new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })
const timeFormatter = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' })
const compactDateFormatter = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' })

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function rolePrefix(role?: RoleName) {
  if (role === 'STUDENT') return '/student'
  if (role === 'CLASS_ADMIN') return '/admin'
  return '/teacher'
}

function primaryRole(roles?: RoleName[]) {
  if (roles?.includes('STUDENT')) return 'STUDENT'
  if (roles?.includes('CLASS_ADMIN')) return 'CLASS_ADMIN'
  return 'TEACHER_OWNER'
}

function eventDate(event: CalendarEvent) {
  const raw = event.type === 'ASSIGNMENT_DEADLINE' ? event.dueAt : event.date
  if (!raw) return null
  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function toAgendaEvent(event: CalendarEvent): AgendaEvent | null {
  const startsAt = eventDate(event)
  if (!startsAt) return null
  return {
    ...event,
    startsAt,
    dateKey: isoDate(startsAt),
    kindLabel: event.type === 'LESSON' ? 'Buổi học' : 'Hạn nộp bài',
  }
}

function groupByDay(events: AgendaEvent[]) {
  return events.reduce<Array<{ dateKey: string; label: string; events: AgendaEvent[] }>>((acc, event) => {
    const existing = acc.find((group) => group.dateKey === event.dateKey)
    if (existing) existing.events.push(event)
    else acc.push({ dateKey: event.dateKey, label: dayFormatter.format(event.startsAt), events: [event] })
    return acc
  }, [])
}

function eventHref(event: CalendarEvent, role: RoleName) {
  const prefix = rolePrefix(role)
  if (event.type === 'ASSIGNMENT_DEADLINE') return `${prefix}/assignments/${event.id}`
  return `${prefix}/classes/${event.classId}`
}

function isToday(date: Date) {
  return isoDate(date) === isoDate(new Date())
}

function AgendaEventCard({ event, role }: Readonly<{ event: AgendaEvent; role: RoleName }>) {
  const isAssignment = event.type === 'ASSIGNMENT_DEADLINE'
  return (
    <Link to={eventHref(event, role)} className="group block rounded-3xl border border-sky-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-indigo-100">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${isAssignment ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
            {isAssignment ? <BookOpenCheck size={20} /> : <GraduationCap size={20} />}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge value={event.kindLabel} />
              {isToday(event.startsAt) && <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">Hôm nay</span>}
            </div>
            <h2 className="mt-2 line-clamp-2 font-black text-slate-950 group-hover:text-indigo-700">{event.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{event.className || 'Lớp học'}</p>
          </div>
        </div>
        <div className="flex min-h-11 shrink-0 items-center gap-2 rounded-2xl bg-slate-50 px-3 text-sm font-bold text-slate-700">
          <Clock3 size={16} />
          {isAssignment ? timeFormatter.format(event.startsAt) : compactDateFormatter.format(event.startsAt)}
        </div>
      </div>
    </Link>
  )
}

export function CalendarPage() {
  const { user } = useNewAuth()
  const role = primaryRole(user?.roles)
  const [classId, setClassId] = useState('')
  const today = useMemo(() => new Date(), [])
  const from = isoDate(today)
  const to = isoDate(addDays(today, 90))

  const classes = useQuery({ queryKey: ['classes', 'calendar-filter'], queryFn: () => api.classes({ page: 0, size: 100 }), staleTime: 60_000 })
  const calendar = useQuery({ queryKey: ['calendar', 'agenda', from, to, classId], queryFn: () => api.calendar({ from, to, classId: classId || undefined }) })

  const events = useMemo(() => (calendar.data?.events ?? [])
    .map(toAgendaEvent)
    .filter((item): item is AgendaEvent => Boolean(item))
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime()), [calendar.data])
  const groups = useMemo(() => groupByDay(events), [events])
  const lessonCount = events.filter((event) => event.type === 'LESSON').length
  const assignmentCount = events.filter((event) => event.type === 'ASSIGNMENT_DEADLINE').length
  const nextEvent = events[0]

  return (
    <div className="space-y-5 pb-20 md:pb-0">
      <PageHeader
        eyebrow="학습 캘린더"
        title="Lịch học"
        description="Agenda 90 ngày tới, lấy từ backend Calendar API: buổi học + hạn nộp bài theo quyền truy cập lớp của từng role."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Tổng sự kiện" value={events.length} hint={`${from} → ${to}`} icon={<CalendarDays size={20} />} tone="indigo" />
        <MetricCard label="Buổi học" value={lessonCount} hint="LESSON" icon={<GraduationCap size={20} />} tone="sky" />
        <MetricCard label="Hạn bài tập" value={assignmentCount} hint="ASSIGNMENT_DEADLINE" icon={<BookOpenCheck size={20} />} tone="amber" />
        <MetricCard label="Sắp tới" value={nextEvent ? compactDateFormatter.format(nextEvent.startsAt) : '-'} hint={nextEvent?.title ?? 'Không có lịch'} icon={<ListChecks size={20} />} tone="emerald" />
      </div>

      <FilterBar>
        <div className="min-w-0 flex-1">
          <FieldLabel htmlFor="calendar-class">Lọc theo lớp</FieldLabel>
          <select id="calendar-class" className="min-h-11 w-full rounded-2xl border border-sky-100 bg-white px-4 text-sm font-bold text-slate-600 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100" value={classId} onChange={(event) => setClassId(event.target.value)}>
            <option value="">Tất cả lớp được phép</option>
            {(classes.data ?? []).map((item: ClassItem) => <option key={item.id} value={item.id}>{item.name} · {item.code}</option>)}
          </select>
        </div>
        <div className="flex items-end">
          <Button type="button" variant="secondary" className="min-h-11" onClick={() => void calendar.refetch()}>Làm mới</Button>
        </div>
      </FilterBar>

      {classes.isError && <ErrorState title="Không tải được danh sách lớp" description="Agenda vẫn có thể hiển thị tất cả lớp được phép; thử lại nếu cần lọc lớp." onRetry={() => classes.refetch()} />}
      {calendar.isLoading && <div className="space-y-3"><SkeletonCard lines={3} /><SkeletonCard lines={3} /><SkeletonCard lines={3} /></div>}
      {calendar.isError && <ErrorState title="Không tải được lịch" description="Vui lòng kiểm tra quyền truy cập lớp hoặc thử lại sau ít phút." onRetry={() => calendar.refetch()} />}

      {!calendar.isLoading && !calendar.isError && !events.length && (
        <EmptyState title="Chưa có sự kiện sắp tới" description="Không có buổi học hoặc hạn nộp bài trong 90 ngày tới cho phạm vi lớp hiện tại." action={<CalendarDays className="mx-auto text-indigo-400" />} />
      )}

      {!calendar.isLoading && !calendar.isError && groups.length > 0 && (
        <div className="space-y-5">
          {groups.map((group) => (
            <section key={group.dateKey} className="space-y-3" aria-labelledby={`day-${group.dateKey}`}>
              <div className="sticky top-0 z-10 rounded-2xl border border-sky-100 bg-white/90 px-4 py-3 shadow-sm backdrop-blur md:static">
                <h2 id={`day-${group.dateKey}`} className="text-sm font-black capitalize text-slate-950">{group.label}</h2>
                <p className="text-xs text-slate-500">{group.events.length} sự kiện</p>
              </div>
              <div className="space-y-3">
                {group.events.map((event) => <AgendaEventCard key={`${event.type}-${event.id}`} event={event} role={role} />)}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

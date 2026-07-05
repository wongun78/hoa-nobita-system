import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { BookOpenCheck, CalendarDays, Clock3, GraduationCap, Grid3X3, ListChecks, Rows3 } from 'lucide-react'
import { api } from '../core/api'
import { EmptyState, ErrorState, FilterBar, MetricCard, SkeletonCard, StatusBadge } from '../components/foundation'
import { Button, Card } from '../layout/ui'
import { useNewAuth } from '../auth/use-auth'
import type { CalendarEvent, ClassItem, RoleName } from '../core/types'

type CalendarView = 'AGENDA' | 'MONTH' | 'WEEK'

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

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function startOfWeek(date: Date) {
  const day = date.getDay() || 7
  return addDays(date, 1 - day)
}

function sameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

function rangeDays(start: Date, count: number) {
  return Array.from({ length: count }, (_, index) => addDays(start, index))
}

function monthGridDays(date: Date) {
  const firstGridDay = startOfWeek(startOfMonth(date))
  return rangeDays(firstGridDay, 42)
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

function ViewButton({ active, icon, label, onClick }: Readonly<{ active: boolean; icon: React.ReactNode; label: string; onClick: () => void }>) {
  return <Button type="button" variant={active ? 'primary' : 'secondary'} className="min-h-11 flex-1 md:flex-none" onClick={onClick}>{icon}{label}</Button>
}

function CalendarChip({ event, role }: Readonly<{ event: AgendaEvent; role: RoleName }>) {
  const isAssignment = event.type === 'ASSIGNMENT_DEADLINE'
  return (
    <Link to={eventHref(event, role)} className={`block truncate rounded-xl px-2 py-1 text-xs font-bold transition hover:opacity-80 ${isAssignment ? 'bg-amber-50 text-amber-700' : 'bg-indigo-50 text-indigo-700'}`} title={event.title}>
      {isAssignment ? 'Bài: ' : 'Học: '}{event.title}
    </Link>
  )
}

function MonthGrid({ days, eventsByDay, role, anchorDate }: Readonly<{ days: Date[]; eventsByDay: Map<string, AgendaEvent[]>; role: RoleName; anchorDate: Date }>) {
  return (
    <Card className="hidden rounded-3xl md:block">
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-2xl border border-sky-100 bg-sky-100">
        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day) => <div key={day} className="bg-sky-50 p-3 text-center text-xs font-black text-slate-500">{day}</div>)}
        {days.map((day) => {
          const key = isoDate(day)
          const dayEvents = eventsByDay.get(key) ?? []
          return (
            <div key={key} className={`min-h-32 bg-white p-2 ${sameMonth(day, anchorDate) ? '' : 'opacity-45'}`}>
              <div className="mb-2 flex items-center justify-between">
                <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${isToday(day) ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}>{day.getDate()}</span>
                {dayEvents.length > 2 && <span className="text-[10px] font-bold text-slate-400">+{dayEvents.length - 2}</span>}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 2).map((event) => <CalendarChip key={`${event.type}-${event.id}`} event={event} role={role} />)}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function WeekGrid({ days, eventsByDay, role }: Readonly<{ days: Date[]; eventsByDay: Map<string, AgendaEvent[]>; role: RoleName }>) {
  return (
    <Card className="hidden rounded-3xl md:block">
      <div className="grid grid-cols-7 gap-3">
        {days.map((day) => {
          const key = isoDate(day)
          const dayEvents = eventsByDay.get(key) ?? []
          return (
            <section key={key} className={`min-h-96 rounded-3xl border p-3 ${isToday(day) ? 'border-indigo-200 bg-indigo-50/50' : 'border-sky-100 bg-white'}`}>
              <div className="mb-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{dayFormatter.format(day).split(',')[0]}</p>
                <h2 className="text-lg font-black text-slate-950">{compactDateFormatter.format(day)}</h2>
              </div>
              <div className="space-y-2">
                {dayEvents.map((event) => <CalendarChip key={`${event.type}-${event.id}`} event={event} role={role} />)}
                {!dayEvents.length && <p className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-400">Không có lịch</p>}
              </div>
            </section>
          )
        })}
      </div>
    </Card>
  )
}

export function CalendarPage() {
  const { user } = useNewAuth()
  const role = primaryRole(user?.roles)
  const [classId, setClassId] = useState('')
  const [view, setView] = useState<CalendarView>('AGENDA')
  const today = useMemo(() => new Date(), [])
  const todayStart = useMemo(() => new Date(today.getFullYear(), today.getMonth(), today.getDate()), [today])
  const monthDays = useMemo(() => monthGridDays(today), [today])
  const weekDays = useMemo(() => rangeDays(startOfWeek(today), 7), [today])
  const from = isoDate(startOfMonth(today))
  const to = isoDate(addDays(today, 90))

  const classes = useQuery({ queryKey: ['classes', 'calendar-filter'], queryFn: () => api.classes({ page: 0, size: 100 }), staleTime: 60_000 })
  const calendar = useQuery({ queryKey: ['calendar', 'agenda', from, to, classId], queryFn: () => api.calendar({ from, to, classId: classId || undefined }) })

  const events = useMemo(() => (calendar.data?.events ?? [])
    .map(toAgendaEvent)
    .filter((item): item is AgendaEvent => Boolean(item))
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime()), [calendar.data])
  const agendaEvents = useMemo(() => events.filter((event) => event.startsAt >= todayStart), [events, todayStart])
  const groups = useMemo(() => groupByDay(agendaEvents), [agendaEvents])
  const eventsByDay = useMemo(() => events.reduce<Map<string, AgendaEvent[]>>((acc, event) => {
    const items = acc.get(event.dateKey) ?? []
    items.push(event)
    acc.set(event.dateKey, items)
    return acc
  }, new Map()), [events])
  const lessonCount = agendaEvents.filter((event) => event.type === 'LESSON').length
  const assignmentCount = agendaEvents.filter((event) => event.type === 'ASSIGNMENT_DEADLINE').length
  const nextEvent = agendaEvents[0]

  return (
    <div className="space-y-5 pb-20 md:pb-0">
      <div className="student-animate-in relative overflow-hidden rounded-3xl border border-white/70 bg-gradient-to-br from-indigo-600 via-indigo-500 to-sky-400 p-6 text-white shadow-lg">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -left-6 bottom-0 h-28 w-28 rounded-full bg-white/10 blur-xl" />
        <div className="relative">
          <h1 className="text-2xl font-black tracking-tight md:text-3xl">Lịch học</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">Lịch 90 ngày tới, hiển thị buổi học và hạn nộp bài theo các lớp bạn đang tham gia.</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Tổng sự kiện" value={events.length} hint={`${from} → ${to}`} icon={<CalendarDays size={20} />} tone="indigo" />
        <MetricCard label="Buổi học" value={lessonCount} hint="Lịch học trên lớp" icon={<GraduationCap size={20} />} tone="sky" />
        <MetricCard label="Hạn bài tập" value={assignmentCount} hint="Bài tập đến hạn" icon={<BookOpenCheck size={20} />} tone="amber" />
        <MetricCard label="Sắp tới" value={nextEvent ? compactDateFormatter.format(nextEvent.startsAt) : '-'} hint={nextEvent?.title ?? 'Không có lịch'} icon={<ListChecks size={20} />} tone="emerald" />
      </div>

      {role !== 'STUDENT' && (
      <FilterBar>
        <div className="min-w-0 flex-1">
          {/* <FieldLabel htmlFor="calendar-class">Lọc theo lớp</FieldLabel> */}
          <select id="calendar-class" className="min-h-11 w-full rounded-2xl border border-sky-100 bg-white px-4 text-sm font-bold text-slate-600 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100" value={classId} onChange={(event) => setClassId(event.target.value)}>
            <option value="">Tất cả lớp được phép</option>
            {(classes.data ?? []).map((item: ClassItem) => <option key={item.id} value={item.id}>{item.name} · {item.code}</option>)}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <ViewButton active={view === 'AGENDA'} icon={<ListChecks size={16} />} label="Agenda" onClick={() => setView('AGENDA')} />
          <ViewButton active={view === 'MONTH'} icon={<Grid3X3 size={16} />} label="Tháng" onClick={() => setView('MONTH')} />
          <ViewButton active={view === 'WEEK'} icon={<Rows3 size={16} />} label="Tuần" onClick={() => setView('WEEK')} />
        </div>
        <div className="flex items-end">
          <Button type="button" variant="secondary" className="min-h-11" onClick={() => void calendar.refetch()}>Làm mới</Button>
        </div>
      </FilterBar>
      )}

      {classes.isError && <ErrorState title="Không tải được danh sách lớp" description="Agenda vẫn có thể hiển thị tất cả lớp được phép; thử lại nếu cần lọc lớp." onRetry={() => classes.refetch()} />}
      {calendar.isLoading && <div className="space-y-3"><SkeletonCard lines={3} /><SkeletonCard lines={3} /><SkeletonCard lines={3} /></div>}
      {calendar.isError && <ErrorState title="Không tải được lịch" description="Vui lòng kiểm tra quyền truy cập lớp hoặc thử lại sau ít phút." onRetry={() => calendar.refetch()} />}

      {!calendar.isLoading && !calendar.isError && !agendaEvents.length && (
        <EmptyState title="Chưa có sự kiện sắp tới" description="Không có buổi học hoặc hạn nộp bài trong 90 ngày tới cho phạm vi lớp hiện tại." action={<CalendarDays className="mx-auto text-indigo-400" />} />
      )}

      {!calendar.isLoading && !calendar.isError && view === 'MONTH' && <MonthGrid days={monthDays} eventsByDay={eventsByDay} role={role} anchorDate={today} />}
      {!calendar.isLoading && !calendar.isError && view === 'WEEK' && <WeekGrid days={weekDays} eventsByDay={eventsByDay} role={role} />}

      {!calendar.isLoading && !calendar.isError && groups.length > 0 && (
        <div className={`space-y-5 ${view === 'AGENDA' ? '' : 'md:hidden'}`}>
          {view !== 'AGENDA' && <div className="rounded-2xl border border-sky-100 bg-white/90 px-4 py-3 text-sm font-bold text-slate-600 shadow-sm md:hidden">Mobile hiển thị Agenda mặc định để dễ thao tác cảm ứng.</div>}
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

/* eslint-disable react/only-export-components */
import { ResponsiveContainer, Tooltip } from 'recharts'
import { EmptyState } from '../components/foundation'
import { Card } from '../layout/ui'
import type { AssignmentItem, AttendanceItem, PageResponse } from '../core/types'

export function getStudentAvatarUrl(seed: string): string {
  return `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(seed)}`
}

export function studentAvatarSeed(user: { email?: string | null; id?: string; fullName?: string; studentCode?: string | null }): string {
  return user.studentCode || user.email || user.id || user.fullName || 'student'
}

export function asPage<T>(payload: PageResponse<T> | T[] | undefined, page = 0, size = 10): PageResponse<T> {
  if (!payload) return { items: [], page, size, totalItems: 0, totalPages: 0 }
  if (Array.isArray(payload)) return { items: payload, page, size, totalItems: payload.length, totalPages: payload.length ? 1 : 0 }
  return payload
}

export function fmtDate(value?: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleString('vi-VN')
}

export function numberValue(value: unknown, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

export function textValue(value: unknown, fallback = '-') {
  return typeof value === 'string' && value.trim() ? value : fallback
}

export function arrayValue<T = Record<string, unknown>>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

export function getId(item: Record<string, unknown>, fallback: string) {
  return String(item.id ?? item.classId ?? item.assignmentId ?? item.studentId ?? fallback)
}

export function ChartCard({ title, description, children, empty }: Readonly<{ title: string; description?: string; children: React.ReactNode; empty?: boolean }>) {
  return (
    <Card className="min-h-[320px] rounded-3xl">
      <div className="mb-4">
        <h2 className="text-base font-black text-slate-950">{title}</h2>
        {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
      </div>
      {empty ? <EmptyState title="Chưa có dữ liệu" description="Biểu đồ sẽ hiển thị khi backend trả về số liệu." /> : <div className="h-64">{children}</div>}
    </Card>
  )
}

export function ResponsiveChart({ children }: Readonly<{ children: React.ReactElement }>) {
  return <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
}

export function CustomTooltip({ active, payload, label }: Readonly<{ active?: boolean; payload?: Array<{ name?: string; value?: number | string; color?: string }>; label?: string }>) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-2xl border border-sky-100 bg-white/95 p-3 text-xs shadow-xl backdrop-blur">
      <div className="mb-2 font-bold text-slate-900">{label}</div>
      <div className="space-y-1">
        {payload.map((item, index) => (
          <div key={`${item.name ?? 'value'}-${index}`} className="flex items-center gap-2 text-slate-600">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color ?? '#6366f1' }} />
            <span>{item.name}: <b>{item.value}</b></span>
          </div>
        ))}
      </div>
    </div>
  )
}

export const tooltip = <Tooltip content={<CustomTooltip />} />

/* ── Assignment helpers ─────────────────────────────── */

export function isDueSoon(item: AssignmentItem): boolean {
  if (!item.dueAt) return false
  const due = new Date(item.dueAt).getTime()
  return due >= Date.now() && due - Date.now() <= 1000 * 60 * 60 * 24 * 7
}

export function isOverdue(item: AssignmentItem): boolean {
  return item.dueAt ? new Date(item.dueAt).getTime() < Date.now() : false
}

/* ── Attendance helpers ─────────────────────────────── */

export function attendanceRate(items: AttendanceItem[]): number | null {
  if (!items.length) return null
  const present = items.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length
  return Math.round((present / items.length) * 100)
}

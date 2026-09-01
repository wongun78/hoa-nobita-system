import { clsx } from 'clsx'
import { AlertTriangle, Search, X } from 'lucide-react'
import type { RoleName } from '../core/types'
import { Button, Card } from '../layout/ui'

type Tone = 'slate' | 'indigo' | 'sky' | 'emerald' | 'amber' | 'rose' | 'violet'

const toneClasses: Record<Tone, string> = {
  slate: 'border-slate-200 bg-slate-50 text-slate-700',
  indigo: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  sky: 'border-sky-200 bg-sky-50 text-sky-700',
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  amber: 'border-amber-200 bg-amber-50 text-amber-700',
  rose: 'border-rose-200 bg-rose-50 text-rose-700',
  violet: 'border-violet-200 bg-violet-50 text-violet-700',
}

export function PageHeader({ eyebrow, title, description, actions }: Readonly<{ eyebrow?: string; title: string; description?: string; actions?: React.ReactNode }>) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm shadow-slate-200/50">
      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          {eyebrow && <p className="text-xs font-bold uppercase tracking-[0.08em] text-indigo-500">{eyebrow}</p>}
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">{title}</h1>
          {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}

/** Indigo hero for student-facing pages. */
export function StudentHeroBanner({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="student-animate-in relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 p-6 text-white shadow-lg shadow-indigo-500/20">
      <div className="relative">{children}</div>
    </div>
  )
}

export function MetricCard({ label, value, hint, icon, tone = 'sky' }: Readonly<{ label: string; value: React.ReactNode; hint?: string; icon?: React.ReactNode; tone?: Tone }>) {
  return (
    <Card className="group overflow-hidden bg-white transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/60">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <div className="mt-2 text-2xl font-black text-slate-950">{value}</div>
          {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
        </div>
        {icon && <div className={clsx('rounded-2xl border p-3', toneClasses[tone])}>{icon}</div>}
      </div>
    </Card>
  )
}

function statusTone(value: string): Tone {
  if (['ACTIVE', 'PUBLISHED', 'PRESENT', 'GRADED'].includes(value)) return 'emerald'
  if (['INACTIVE', 'PAUSED', 'LATE'].includes(value)) return 'amber'
  if (['SUSPENDED', 'ABSENT', 'RESUBMIT_REQUESTED'].includes(value)) return 'rose'
  if (value === 'COMPLETED') return 'indigo'
  if (value === 'CLOSED') return 'violet'
  return 'slate'
}

export function StatusBadge({ value }: Readonly<{ value?: string | null }>) {
  const normalized = value ?? 'UNKNOWN'
  const labelMap: Record<string, string> = { ACTIVE: 'Đang học', COMPLETED: 'Hoàn thành', DRAFT: 'Nháp', UPCOMING: 'Sắp khai giảng', ARCHIVED: 'Lưu trữ', PUBLISHED: 'Đã xuất bản', CLOSED: 'Đã đóng', SUBMITTED: 'Đã nộp', GRADED: 'Đã chấm', LATE: 'Nộp trễ', OVERDUE: 'Quá hạn', INACTIVE: 'Ngưng', SUSPENDED: 'Đã khoá', RESUBMIT_REQUESTED: 'Yêu cầu nộp lại', PRESENT: 'Có mặt', ABSENT: 'Vắng mặt', VISIBLE: 'Hiện', HIDDEN: 'Ẩn' }
  return <span className={clsx('inline-flex rounded-full border px-2.5 py-1 text-xs font-bold transition-colors', toneClasses[statusTone(normalized)])}>{labelMap[normalized] ?? normalized}</span>
}

const attendanceStatusTone: Record<string, Tone> = { PRESENT: 'emerald', LATE: 'amber', ABSENT: 'rose' }
const attendanceLabelMap: Record<string, string> = { PRESENT: 'Có mặt', LATE: 'Đi muộn', ABSENT: 'Vắng mặt' }

export function AttendanceStatusBadge({ value }: Readonly<{ value?: string | null }>) {
  const normalized = value ?? 'UNKNOWN'
  return <span className={clsx('inline-flex rounded-full border px-2.5 py-1 text-xs font-bold transition-colors', toneClasses[attendanceStatusTone[normalized] ?? 'slate'])}>{attendanceLabelMap[normalized] ?? normalized}</span>
}

export function RoleBadge({ role }: Readonly<{ role: RoleName }>) {
  const toneByRole: Record<RoleName, Tone> = { TEACHER_OWNER: 'violet', CLASS_ADMIN: 'sky', STUDENT: 'emerald' }
  const labelByRole: Record<RoleName, string> = { TEACHER_OWNER: 'Giảng viên chính', CLASS_ADMIN: 'Trợ giảng', STUDENT: 'Học viên' }
  return <span className={clsx('inline-flex rounded-full border px-2.5 py-1 text-xs font-bold transition-colors', toneClasses[toneByRole[role]])}>{labelByRole[role]}</span>
}

export function EmptyState({ title, description, action }: Readonly<{ title: string; description?: string; action?: React.ReactNode }>) {
  return (
    <Card className="text-center">
      {/* <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 to-pink-100 text-lg">한</div> */}
      <h2 className="text-lg font-black text-slate-900">{title}</h2>
      {description && <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </Card>
  )
}

export function SkeletonCard({ lines = 3 }: Readonly<{ lines?: number }>) {
  return (
    <Card className="animate-pulse space-y-3">
      <div className="h-4 w-1/3 rounded-full bg-slate-100" />
      {Array.from({ length: lines }).map((_, index) => <div key={`skeleton-line-${index + 1}`} className="h-3 rounded-full bg-slate-100" />)}
    </Card>
  )
}

export function ErrorState({ title = 'Không tải được dữ liệu', description = 'Vui lòng thử lại sau ít phút.', onRetry }: Readonly<{ title?: string; description?: string; onRetry?: () => void }>) {
  return (
    <Card className="border-rose-100 bg-rose-50/60">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-white p-2 text-rose-500"><AlertTriangle size={20} /></div>
        <div className="flex-1">
          <h2 className="font-bold text-rose-950">{title}</h2>
          <p className="mt-1 text-sm text-rose-700">{description}</p>
          {onRetry && <Button type="button" variant="secondary" className="mt-3" onClick={onRetry}>Thử lại</Button>}
        </div>
      </div>
    </Card>
  )
}

export function SearchInput(props: Readonly<React.InputHTMLAttributes<HTMLInputElement>>) {
  return (
    <label className="relative block">
      <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
      <input {...props} className={clsx('w-full rounded-xl border border-slate-200/80 bg-white px-9 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100', props.className)} />
    </label>
  )
}

export function FilterBar({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="flex flex-col gap-2 rounded-2xl border border-slate-200/60 bg-white p-3 shadow-sm shadow-slate-200/40 md:flex-row md:items-center md:gap-3">{children}</div>
}

export function FilterSelect({ value, onChange, options, placeholder = 'Tất cả', disabled = false }: Readonly<{ value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }>; placeholder?: string; disabled?: boolean }>) {
  return (
    <select
      className="rounded-xl border border-indigo-100 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none transition hover:border-indigo-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 disabled:opacity-50"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
  )
}

export function PaginationControls({ page, totalPages, onPageChange }: Readonly<{ page: number; totalPages: number; onPageChange: (page: number) => void }>) {
  const safeTotalPages = Math.max(totalPages, 1)
  const safePage = Math.min(Math.max(page, 0), safeTotalPages - 1)
  return (
    <div className="flex items-center justify-end gap-2 text-sm text-slate-600">
      <Button type="button" variant="secondary" disabled={safePage <= 0} onClick={() => onPageChange(safePage - 1)}>Trước</Button>
      <span>Trang {safePage + 1} / {safeTotalPages}</span>
      <Button type="button" variant="secondary" disabled={safePage + 1 >= safeTotalPages} onClick={() => onPageChange(safePage + 1)}>Sau</Button>
    </div>
  )
}

export function ConfirmDialog({ open, title, description, confirmLabel = 'Xác nhận', onConfirm, onCancel }: Readonly<{ open: boolean; title: string; description?: string; confirmLabel?: string; onConfirm: () => void; onCancel: () => void }>) {
  if (!open) return null
  return (
    <dialog open className="fixed inset-0 z-50 m-0 grid h-full w-full max-w-none place-items-center bg-black/40 p-4 backdrop-blur-sm" aria-labelledby="confirm-title">
      <Card className="w-full max-w-md shadow-2xl shadow-slate-900/10">
        <h2 id="confirm-title" className="text-lg font-black text-slate-950">{title}</h2>
        {description && <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onCancel}>Hủy</Button>
          <Button type="button" onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </Card>
    </dialog>
  )
}

/** Generic overlay modal. Clicking the backdrop calls `onClose`. */
export function Modal({ open, title, onClose, maxWidth = 'max-w-lg', children }: Readonly<{ open: boolean; title: string; onClose: () => void; maxWidth?: string; children: React.ReactNode }>) {
  if (!open) return null
  return (
    <dialog open className="fixed inset-0 z-50 m-0 grid h-full w-full max-w-none place-items-center bg-black/40 p-4 backdrop-blur-sm" aria-labelledby="modal-title">
      <div className={`w-full ${maxWidth} rounded-2xl border border-slate-200/60 bg-white p-5 shadow-2xl shadow-slate-900/10`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 id="modal-title" className="font-black text-slate-950">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"><X size={18} /></button>
        </div>
        {children}
      </div>
    </dialog>
  )
}

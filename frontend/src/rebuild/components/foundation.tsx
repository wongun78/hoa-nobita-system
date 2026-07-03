import { clsx } from 'clsx'
import { AlertTriangle, Search } from 'lucide-react'
import type { RiskLevel, RoleName } from '../core/types'
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
    <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/85 p-6 shadow-[0_20px_60px_rgba(79,70,229,0.08)] backdrop-blur">
      <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-pink-200/40 blur-2xl" />
      <div className="absolute -left-8 bottom-0 h-32 w-32 rounded-full bg-sky-200/50 blur-2xl" />
      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          {eyebrow && <p className="text-xs font-bold uppercase tracking-[0.24em] text-indigo-500">{eyebrow}</p>}
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">{title}</h1>
          {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}

export function MetricCard({ label, value, hint, icon, tone = 'sky' }: Readonly<{ label: string; value: React.ReactNode; hint?: string; icon?: React.ReactNode; tone?: Tone }>) {
  return (
    <Card className="group overflow-hidden bg-white/90 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
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
  return <span className={clsx('inline-flex rounded-full border px-2.5 py-1 text-xs font-bold', toneClasses[statusTone(normalized)])}>{normalized}</span>
}

export function RoleBadge({ role }: Readonly<{ role: RoleName }>) {
  const toneByRole: Record<RoleName, Tone> = { TEACHER_OWNER: 'violet', CLASS_ADMIN: 'sky', STUDENT: 'emerald' }
  const labelByRole: Record<RoleName, string> = { TEACHER_OWNER: 'Teacher Owner', CLASS_ADMIN: 'Class Admin', STUDENT: 'Student' }
  return <span className={clsx('inline-flex rounded-full border px-2.5 py-1 text-xs font-bold', toneClasses[toneByRole[role]])}>{labelByRole[role]}</span>
}

export function RiskBadge({ risk }: Readonly<{ risk?: RiskLevel | null }>) {
  const value = risk ?? 'LOW'
  const toneByRisk: Record<RiskLevel, Tone> = { LOW: 'emerald', MEDIUM: 'amber', HIGH: 'rose' }
  return <span className={clsx('inline-flex rounded-full border px-2.5 py-1 text-xs font-bold', toneClasses[toneByRisk[value]])}>{value}</span>
}

export function EmptyState({ title, description, action }: Readonly<{ title: string; description?: string; action?: React.ReactNode }>) {
  return (
    <Card className="text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 to-pink-100 text-lg">한</div>
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
      <input {...props} className={clsx('w-full rounded-2xl border border-sky-100 bg-white px-9 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100', props.className)} />
    </label>
  )
}

export function FilterBar({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="flex flex-col gap-3 rounded-3xl border border-sky-100 bg-white/80 p-3 shadow-sm md:flex-row md:items-center">{children}</div>
}

export function PaginationControls({ page, totalPages, onPageChange }: Readonly<{ page: number; totalPages: number; onPageChange: (page: number) => void }>) {
  return (
    <div className="flex items-center justify-end gap-2 text-sm text-slate-600">
      <Button type="button" variant="secondary" disabled={page <= 0} onClick={() => onPageChange(page - 1)}>Trước</Button>
      <span>Trang {page + 1} / {Math.max(totalPages, 1)}</span>
      <Button type="button" variant="secondary" disabled={page + 1 >= totalPages} onClick={() => onPageChange(page + 1)}>Sau</Button>
    </div>
  )
}

export function ConfirmDialog({ open, title, description, confirmLabel = 'Xác nhận', onConfirm, onCancel }: Readonly<{ open: boolean; title: string; description?: string; confirmLabel?: string; onConfirm: () => void; onCancel: () => void }>) {
  if (!open) return null
  return (
    <dialog open className="fixed inset-0 z-50 m-0 grid h-full w-full max-w-none place-items-center bg-slate-950/30 p-4 backdrop-blur-sm" aria-labelledby="confirm-title">
      <Card className="w-full max-w-md shadow-2xl">
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

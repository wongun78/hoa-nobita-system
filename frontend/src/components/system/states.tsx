import { Card } from '../ui/card'

type TextStateProps = Readonly<{ text?: string }>
type BadgeProps = Readonly<{ status?: string }>
type RoleBadgeProps = Readonly<{ role: string }>
type PageHeaderProps = Readonly<{ title: string; description?: string }>
type StatCardProps = Readonly<{ label: string; value: string | number }>

export function LoadingState({ text = 'Đang tải...' }: TextStateProps) { return <Card><p className="text-slate-500">{text}</p></Card> }
export function EmptyState({ text = 'Chưa có dữ liệu' }: TextStateProps) { return <Card><p className="text-slate-500">{text}</p></Card> }
export function ErrorState({ text = 'Không thể tải dữ liệu.' }: TextStateProps) { return <Card><p className="text-red-600">{text}</p></Card> }
export function StatusBadge({ status }: BadgeProps) { return <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">{status ?? 'N/A'}</span> }
export function RoleBadge({ role }: RoleBadgeProps) { return <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{role}</span> }
export function PageHeader({ title, description }: PageHeaderProps) { return <div className="mb-6"><h2 className="text-2xl font-bold text-blue-950">{title}</h2>{description && <p className="mt-1 text-sm text-slate-500">{description}</p>}</div> }
export function StatCard({ label, value }: StatCardProps) { return <Card><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold text-blue-700">{value}</p></Card> }

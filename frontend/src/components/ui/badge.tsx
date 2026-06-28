import { cn } from '../../lib/utils'

export function Badge({ className, variant = 'default', children }: { className?: string; variant?: 'default' | 'secondary' | 'destructive' | 'outline'; children: React.ReactNode }) {
  const variants: Record<string, string> = {
    default: 'bg-[#3B82F6] text-white',
    secondary: 'bg-[#F59E0B] text-white',
    destructive: 'bg-[#EF4444] text-white',
    outline: 'border border-slate-300 text-slate-700',
  }
  const v = variant || 'default'
  return <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', variants[v] || variants.default, className)}>{children}</span>
}

import { useFormContext } from 'react-hook-form'
import { Input } from './input'
import { cn } from '../../lib/utils'

export function FormField({ name, label, children, className }: { name: string; label?: string; children?: React.ReactNode; className?: string }) {
  const { register, formState: { errors } } = useFormContext()
  const error = errors[name]?.message as string | undefined
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
      {children || <Input {...register(name)} />}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

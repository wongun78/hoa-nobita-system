import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

type ButtonProps = Readonly<ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline' | 'destructive'
  size?: 'default' | 'sm'
}>

export function Button({ className, variant = 'default', size = 'default', ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-xl font-medium shadow-sm transition disabled:opacity-50'
  const sizes = {
    default: 'px-4 py-2',
    sm: 'px-3 py-1 text-sm',
  }
  const styles = {
    default: 'bg-[#3B82F6] text-white hover:bg-[#2563EB]',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
    destructive: 'bg-red-600 text-white hover:bg-red-700',
  }
  return <button className={cn(base, sizes[size], styles[variant], className)} {...props} />
}

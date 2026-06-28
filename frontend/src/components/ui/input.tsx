import type { InputHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

type InputProps = Readonly<InputHTMLAttributes<HTMLInputElement>>

export function Input({ className, ...props }: InputProps) {
  return <input className={cn('w-full rounded-xl border border-[#D8E7F7] bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200', className)} {...props} />
}

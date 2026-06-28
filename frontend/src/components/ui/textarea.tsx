import type { TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

type TextareaProps = Readonly<TextareaHTMLAttributes<HTMLTextAreaElement>>

export function Textarea({ className, ...props }: TextareaProps) {
  return <textarea className={cn('min-h-32 w-full rounded-xl border border-[#D8E7F7] bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200', className)} {...props} />
}

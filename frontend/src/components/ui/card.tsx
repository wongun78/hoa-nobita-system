import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

type CardProps = Readonly<HTMLAttributes<HTMLDivElement>>

export function Card({ className, ...props }: CardProps) {
  return <div className={cn('rounded-2xl border border-[#D8E7F7] bg-white p-5 shadow-sm', className)} {...props} />
}

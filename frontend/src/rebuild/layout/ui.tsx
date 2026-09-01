import { clsx } from 'clsx'

type ButtonProps = Readonly<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' }>

type InputProps = Readonly<React.InputHTMLAttributes<HTMLInputElement>>

type TextAreaProps = Readonly<React.TextareaHTMLAttributes<HTMLTextAreaElement>>

type CardProps = Readonly<{ children: React.ReactNode; className?: string }>

export function Button({ variant = 'primary', className, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-[0.97] focus:outline-none focus:ring-4 focus:ring-indigo-100',
        variant === 'primary' && 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/25',
        variant === 'secondary' && 'border border-slate-200/80 bg-white text-slate-700 shadow-sm hover:bg-slate-50 hover:shadow-md',
        variant === 'ghost' && 'bg-transparent text-slate-500 hover:bg-slate-100/60 hover:text-slate-700',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
}

export function Input({ className, ...props }: InputProps) {
  return <input {...props} className={clsx('w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100', className)} />
}

export function TextArea({ className, ...props }: TextAreaProps) {
  return <textarea {...props} className={clsx('w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100', className)} />
}

export function Card({ children, className }: CardProps) {
  return <section className={clsx('rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm shadow-slate-200/50', className)}>{children}</section>
}

export function FieldLabel({ children, htmlFor }: Readonly<{ children: React.ReactNode; htmlFor?: string }>) {
  return <label htmlFor={htmlFor} className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">{children}</label>
}

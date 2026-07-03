import { clsx } from 'clsx'

type ButtonProps = Readonly<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' }>

type InputProps = Readonly<React.InputHTMLAttributes<HTMLInputElement>>

type TextAreaProps = Readonly<React.TextareaHTMLAttributes<HTMLTextAreaElement>>

type CardProps = Readonly<{ children: React.ReactNode; className?: string }>

export function Button({ variant = 'primary', className, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-indigo-100',
        variant === 'primary' && 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700',
        variant === 'secondary' && 'border border-sky-200 bg-white text-slate-700 hover:bg-sky-50',
        variant === 'ghost' && 'bg-transparent text-slate-600 hover:bg-sky-50',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
}

export function Input(props: InputProps) {
  return <input className="w-full rounded-2xl border border-sky-100 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100" {...props} />
}

export function TextArea(props: TextAreaProps) {
  return <textarea className="w-full rounded-2xl border border-sky-100 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100" {...props} />
}

export function Card({ children, className }: CardProps) {
  return <section className={clsx('rounded-3xl border border-sky-100 bg-white/90 p-5 shadow-sm', className)}>{children}</section>
}

export function FieldLabel({ children, htmlFor }: Readonly<{ children: string; htmlFor: string }>) {
  return <label htmlFor={htmlFor} className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">{children}</label>
}

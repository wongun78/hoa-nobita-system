import { clsx } from 'clsx'

type ButtonProps = Readonly<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' }>

type InputProps = Readonly<React.InputHTMLAttributes<HTMLInputElement>>

type TextAreaProps = Readonly<React.TextareaHTMLAttributes<HTMLTextAreaElement>>

type CardProps = Readonly<{ children: React.ReactNode; className?: string }>

export function Button({ variant = 'primary', className, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        'rounded-xl px-4 py-2 text-sm font-semibold transition',
        variant === 'primary' && 'bg-sky-200 text-slate-800 hover:bg-sky-300',
        variant === 'secondary' && 'bg-white border border-sky-200 text-slate-700 hover:bg-sky-50',
        variant === 'ghost' && 'bg-transparent text-slate-600 hover:bg-sky-50',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
}

export function Input(props: InputProps) {
  return <input className="w-full rounded-xl border border-sky-100 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-300" {...props} />
}

export function TextArea(props: TextAreaProps) {
  return <textarea className="w-full rounded-xl border border-sky-100 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-300" {...props} />
}

export function Card({ children, className }: CardProps) {
  return <section className={clsx('rounded-2xl border border-sky-100 bg-white p-5', className)}>{children}</section>
}

export function FieldLabel({ children, htmlFor }: Readonly<{ children: string; htmlFor: string }>) {
  return <label htmlFor={htmlFor} className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">{children}</label>
}

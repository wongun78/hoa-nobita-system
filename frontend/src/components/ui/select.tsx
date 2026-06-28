import { type SelectHTMLAttributes } from 'react'

type SelectProps = Readonly<SelectHTMLAttributes<HTMLSelectElement>> & {
  label?: string
}

export function Select({ label, className = '', ...props }: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <select
        className={`w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${className}`}
        {...props}
      />
    </div>
  )
}

import { type ReactNode } from 'react'

type DialogProps = Readonly<{
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}>

export function Dialog({ open, onClose, title, children }: DialogProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-2xl leading-none text-gray-400 hover:text-gray-600">×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

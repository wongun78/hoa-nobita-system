import { useEffect } from 'react'

type ToastProps = Readonly<{
  message: string
  type?: 'success' | 'error'
  onClose: () => void
}>

export function Toast({ message, type = 'success', onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000)
    return () => clearTimeout(t)
  }, [onClose])

  const bg = type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
  return (
    <div className={`fixed bottom-6 right-6 z-[100] rounded-lg ${bg} px-4 py-3 text-sm text-white shadow-lg`}>
      {message}
    </div>
  )
}

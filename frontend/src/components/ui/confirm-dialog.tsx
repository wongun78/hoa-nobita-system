import { Dialog } from './dialog'
import { Button } from './button'

type ConfirmDialogProps = Readonly<{
  open: boolean
  onClose: () => void
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void | Promise<void>
  destructive?: boolean
}>

export function ConfirmDialog({ open, onClose, title, message, confirmLabel = 'Confirm', onConfirm, destructive }: ConfirmDialogProps) {
  const handleConfirm = async () => {
    await onConfirm()
    onClose()
  }
  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <p className="mb-6 text-sm text-gray-600">{message}</p>
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button variant={destructive ? 'destructive' : 'default'} onClick={handleConfirm}>{confirmLabel}</Button>
      </div>
    </Dialog>
  )
}

import { useState } from 'react'
import { api } from '../core/api'
import { Button, Card, FieldLabel, Input } from '../layout/ui'

export function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(event: { preventDefault: () => void }) {
    event.preventDefault()
    setLoading(true)
    setMessage(null)
    setError(null)

    try {
      const res = await api.changePassword(currentPassword, newPassword)
      setMessage(res)
      setCurrentPassword('')
      setNewPassword('')
    } catch {
      setError('Không thể đổi mật khẩu.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-xl">
      <h1 className="text-xl font-bold">Đổi mật khẩu</h1>
      <form className="mt-4 space-y-4" onSubmit={onSubmit}>
        <div>
          <FieldLabel htmlFor="currentPassword">Mật khẩu hiện tại</FieldLabel>
          <Input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
        </div>

        <div>
          <FieldLabel htmlFor="newPassword">Mật khẩu mới</FieldLabel>
          <Input id="newPassword" type="password" minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
        </div>

        {message && <div className="text-sm text-emerald-700">{message}</div>}
        {error && <div className="text-sm text-rose-600">{error}</div>}

        <Button type="submit" disabled={loading}>{loading ? 'Đang cập nhật...' : 'Lưu thay đổi'}</Button>
      </form>
    </Card>
  )
}

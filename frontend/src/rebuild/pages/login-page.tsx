import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useNewAuth } from '../auth/use-auth'
import { Button, Card, FieldLabel, Input } from '../layout/ui'

export function LoginPage() {
  const { user, login } = useNewAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (user) {
    return <Navigate to="/bang-dieu-khien" replace />
  }

  async function onSubmit(e: { preventDefault: () => void }) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(identifier, password)
      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname
      navigate(from || '/bang-dieu-khien', { replace: true })
    } catch {
      setError('Thông tin đăng nhập chưa đúng.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFCFF] p-6">
      <Card className="w-full max-w-md">
        <div className="mb-5 text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-500">Hoa Nobita</div>
          <h1 className="mt-2 text-2xl font-bold">Đăng nhập</h1>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <FieldLabel htmlFor="identifier">Email hoặc số điện thoại</FieldLabel>
            <Input id="identifier" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
          </div>

          <div>
            <FieldLabel htmlFor="password">Mật khẩu</FieldLabel>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Đang xử lý...' : 'Vào hệ thống'}</Button>
        </form>
      </Card>
    </div>
  )
}

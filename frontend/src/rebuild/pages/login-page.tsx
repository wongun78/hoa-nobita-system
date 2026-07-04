import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { homePathForUser } from '../auth/role-redirect'
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
    return <Navigate to={homePathForUser(user)} replace />
  }

  async function onSubmit(e: { preventDefault: () => void }) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const loggedInUser = await login(identifier, password)
      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname
      navigate(from || homePathForUser(loggedInUser), { replace: true })
    } catch {
      setError('Thông tin đăng nhập chưa đúng hoặc tài khoản chưa được kích hoạt.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_20%_15%,#fbcfe8_0,transparent_30%),radial-gradient(circle_at_82%_10%,#bae6fd_0,transparent_34%),linear-gradient(180deg,#fff7ed_0%,#f8fafc_70%)] p-6">
      <div className="absolute left-10 top-10 text-8xl font-black text-white/40">한</div>
      <div className="absolute bottom-10 right-10 text-7xl font-black text-white/50">봄</div>
      <Card className="relative w-full max-w-md border-white/80 bg-white/85 shadow-[0_30px_90px_rgba(79,70,229,0.16)] backdrop-blur-xl">
        <div className="mb-6 text-center">
          {/* <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 via-sky-300 to-pink-300 text-xl font-black text-white shadow-lg">한</div> */}
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-500">Study with Hoa Nobita</div>
          {/* <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Đăng nhập</h1> */}
          <p className="mt-2 text-sm text-slate-500">안녕하세요! Tiếp tục hành trình TOPIK hôm nay.</p>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <FieldLabel htmlFor="identifier">Tên tài khoản</FieldLabel>
            <Input id="identifier" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required autoComplete="username" />
          </div>

          <div>
            <FieldLabel htmlFor="password">Mật khẩu</FieldLabel>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
          </div>

          {error && <p className="rounded-2xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Đang xử lý...' : 'Vào hệ thống'}</Button>
        </form>
      </Card>
    </div>
  )
}

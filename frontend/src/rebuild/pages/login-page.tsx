import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { homePathForUser } from '../auth/role-redirect'
import { useNewAuth } from '../auth/use-auth'
import { Button, Input } from '../layout/ui'

/* ──────────────────────────────────────────────────────────────
 *  LÔ LOGIN-DESIGN-1 — Split hero + glassmorphism login card
 *  Auth logic untouched: same login(), same redirect, same payload.
 * ────────────────────────────────────────────────────────────── */

/** Floating Hangul/Korean decorative elements for the hero side. */
const hangulChars = ['한', '국', '어', '가', '나', '다', '라', '마', '봄', '꿈']
const skillChips = [
  { label: 'TOPIK', color: 'bg-indigo-500/20 text-indigo-100 border-indigo-300/30' },
  { label: '읽기 Reading', color: 'bg-sky-500/20 text-sky-100 border-sky-300/30' },
  { label: '듣기 Listening', color: 'bg-emerald-500/20 text-emerald-100 border-emerald-300/30' },
  { label: '쓰기 Writing', color: 'bg-amber-500/20 text-amber-100 border-amber-300/30' },
  { label: '말하기 Speaking', color: 'bg-rose-500/20 text-rose-100 border-rose-300/30' },
]

export function LoginPage() {
  const { user, login } = useNewAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /* ── Auth guard: redirect if already logged in (unchanged) ── */
  if (user) {
    return <Navigate to={homePathForUser(user)} replace />
  }

  /* ── Submit handler: identical to original ── */
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
    <div className="relative flex min-h-screen overflow-hidden bg-slate-950">
      {/* ── Animated background blobs ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="login-blob absolute -left-32 -top-32 h-[520px] w-[520px] rounded-full bg-indigo-600/30 blur-[120px]" />
        <div className="login-blob-alt absolute -bottom-24 left-1/3 h-[420px] w-[420px] rounded-full bg-sky-500/25 blur-[100px]" />
        <div className="login-blob absolute -right-20 top-1/4 h-[380px] w-[380px] rounded-full bg-rose-500/20 blur-[100px]" />
        <div className="login-blob-alt absolute bottom-1/4 right-1/3 h-[300px] w-[300px] rounded-full bg-amber-400/15 blur-[90px]" />
      </div>

      {/* ── Hero brand panel (desktop left) ── */}
      <div className="relative hidden w-[55%] flex-col justify-between overflow-hidden p-10 lg:flex xl:p-14">
        {/* Decorative Hangul characters */}
        {hangulChars.slice(0, 6).map((char, i) => (
          <span
            key={char}
            aria-hidden
            className={`pointer-events-none absolute select-none text-[${120 + i * 30}px] font-black leading-none text-white/[0.04] ${i % 3 === 0 ? 'login-float' : i % 3 === 1 ? 'login-float-alt' : 'login-float-slow'}`}
            style={{
              top: `${10 + (i * 17) % 70}%`,
              left: `${5 + (i * 23) % 80}%`,
              fontSize: `${100 + i * 28}px`,
            }}
          >
            {char}
          </span>
        ))}

        {/* Hero image */}
        <div className="relative z-10 flex flex-1 items-center justify-center">
          <div className="relative h-72 w-72 overflow-hidden rounded-[2.5rem] border border-white/10 shadow-2xl xl:h-80 xl:w-80">
            <img src="/hoa-nobita-hero.jpg" alt="Nguyễn Tuấn Hoà" className="h-full w-full object-cover" />
            <div className="absolute inset-0 rounded-[2.5rem] ring-1 ring-inset ring-white/10" />
          </div>
        </div>

        {/* Brand text */}
        <div className="relative z-10 mt-8">
          <h1 className="text-4xl font-black tracking-tight text-white xl:text-5xl">
            Nguyễn Tuấn <span className="bg-gradient-to-r from-sky-300 via-indigo-300 to-pink-300 bg-clip-text text-transparent">Hoà</span>
          </h1>
          <p className="mt-3 max-w-md text-lg leading-7 text-white/60">
            Nền tảng học TOPIK thông minh — học tiếng Hàn có lộ trình, có phản hồi, có tiến bộ mỗi ngày.
          </p>
          {/* Floating skill chips */}
          <div className="mt-6 flex flex-wrap gap-2">
            {skillChips.map((chip, i) => (
              <span
                key={chip.label}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold backdrop-blur-sm ${chip.color} ${i % 2 === 0 ? 'login-float' : 'login-float-alt'}`}
              >
                {chip.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Login form panel (right side / mobile full) ── */}
      <div className="relative z-10 flex flex-1 items-center justify-center p-6 lg:w-[45%] lg:p-10">
        <div className="login-card-in w-full max-w-md">
          {/* Mobile-only brand header */}
          <div className="mb-8 text-center lg:hidden">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-400 via-sky-300 to-pink-300 text-3xl font-black text-white shadow-xl">
              한
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Nguyễn Tuấn <span className="bg-gradient-to-r from-sky-300 to-pink-300 bg-clip-text text-transparent">Hoà</span>
            </h1>
            <p className="mt-1 text-sm text-white/50">Nền tảng học TOPIK thông minh</p>
          </div>

          {/* Glassmorphism login card */}
          <div className="rounded-3xl border border-white/[0.08] bg-white/[0.06] p-7 shadow-2xl backdrop-blur-2xl xl:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-black text-white">Đăng nhập</h2>
              <p className="mt-1 text-sm text-white/50">안녕하세요! Tiếp tục hành trình TOPIK hôm nay.</p>
            </div>

            <form className="space-y-4" onSubmit={onSubmit}>
              <div>
                <label htmlFor="identifier" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/60">Tên tài khoản</label>
                <Input
                  id="identifier"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  autoComplete="username"
                  className="border-white/10 bg-white/[0.06] text-white placeholder:text-white/30 focus:border-indigo-400 focus:ring-indigo-500/20"
                  placeholder="Nhập tên tài khoản"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/60">Mật khẩu</label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="border-white/10 bg-white/[0.06] text-white placeholder:text-white/30 focus:border-indigo-400 focus:ring-indigo-500/20"
                  placeholder="Nhập mật khẩu"
                />
              </div>

              {error && (
                <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-300 backdrop-blur-sm">
                  <span className="mr-1.5">⚠</span>{error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-sky-500 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:shadow-xl hover:shadow-indigo-500/30 active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Đang xác thực...
                  </span>
                ) : 'Vào hệ thống'}
              </Button>
            </form>
          </div>

          {/* Footer hint */}
          <p className="mt-6 text-center text-xs text-white/30">
            Học tiếng Hàn có lộ trình · Có phản hồi · Có tiến bộ mỗi ngày
          </p>
        </div>
      </div>
    </div>
  )
}

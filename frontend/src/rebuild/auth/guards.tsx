import { Navigate, useLocation } from 'react-router-dom'
import type { RoleName } from '../core/types'
import { useNewAuth } from './use-auth'

type RequireAuthProps = Readonly<{ children: React.ReactNode }>

type RequireRoleProps = Readonly<{ children: React.ReactNode; roles: RoleName[] }>

export function RequireAuth({ children }: RequireAuthProps) {
  const { user, loading } = useNewAuth()
  const location = useLocation()

  if (loading) {
    return <div className="min-h-screen bg-slate-50 p-8 text-sm text-slate-600">Đang tải phiên đăng nhập...</div>
  }

  if (!user) {
    return <Navigate to="/dang-nhap" replace state={{ from: location }} />
  }

  return <>{children}</>
}

export function RequireRole({ children, roles }: RequireRoleProps) {
  const { hasRole, loading } = useNewAuth()

  if (loading) {
    return <div className="min-h-screen bg-slate-50 p-8 text-sm text-slate-600">Đang xác thực quyền...</div>
  }

  if (!hasRole(...roles)) {
    return <Navigate to="/khong-co-quyen" replace />
  }

  return <>{children}</>
}

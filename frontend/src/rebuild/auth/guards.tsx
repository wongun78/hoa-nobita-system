import { Navigate, useLocation } from 'react-router-dom'
import { ErrorState, SkeletonCard } from '../components/foundation'
import type { RoleName } from '../core/types'
import { useNewAuth } from './use-auth'

type RequireAuthProps = Readonly<{ children: React.ReactNode }>

type RequireRoleProps = Readonly<{ children: React.ReactNode; roles: RoleName[] }>

function AuthLoadingState({ label }: Readonly<{ label: string }>) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fbcfe8_0,transparent_32%),radial-gradient(circle_at_top_right,#bae6fd_0,transparent_30%),#f8fafc] p-6">
      <div className="mx-auto max-w-2xl pt-16">
        <SkeletonCard lines={4} />
        <p className="mt-4 text-center text-sm font-medium text-slate-500">{label}</p>
      </div>
    </div>
  )
}

export function ForbiddenState() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fbcfe8_0,transparent_32%),radial-gradient(circle_at_top_right,#bae6fd_0,transparent_30%),#f8fafc] p-6">
      <div className="mx-auto max-w-xl pt-16">
        <ErrorState title="Không có quyền truy cập" description="Tài khoản hiện tại chưa được cấp quyền để mở khu vực này. Vui lòng quay lại trang phù hợp hoặc liên hệ Teacher Owner." />
      </div>
    </div>
  )
}

export function RequireAuth({ children }: RequireAuthProps) {
  const { user, loading } = useNewAuth()
  const location = useLocation()

  if (loading) {
    return <AuthLoadingState label="Đang tải phiên đăng nhập..." />
  }

  if (!user) {
    return <Navigate to="/dang-nhap" replace state={{ from: location }} />
  }

  return <>{children}</>
}

export function RequireRole({ children, roles }: RequireRoleProps) {
  const { user, hasRole, loading } = useNewAuth()
  const location = useLocation()

  if (loading) {
    return <AuthLoadingState label="Đang xác thực quyền..." />
  }

  if (!user) {
    return <Navigate to="/dang-nhap" replace state={{ from: location }} />
  }

  if (!hasRole(...roles)) {
    return <Navigate to="/khong-co-quyen" replace />
  }

  return <>{children}</>
}

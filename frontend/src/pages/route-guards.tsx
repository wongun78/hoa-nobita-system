import { Navigate } from 'react-router-dom'
import { useAuth } from '../features/auth/use-auth'
import type { Role } from '../lib/api'

type ProtectedRouteProps = Readonly<{ children: React.ReactNode; roles?: Role[] }>

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user, hasRole } = useAuth()
  if (!localStorage.getItem('token')) return <Navigate to="/login" />
  if (roles && user && !roles.some(role => hasRole(role))) return <Navigate to="/forbidden" />
  return <>{children}</>
}

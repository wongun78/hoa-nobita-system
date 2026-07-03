import { createContext } from 'react'
import type { AuthUser, RoleName } from '../core/types'

export type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  login: (identifier: string, password: string) => Promise<AuthUser>
  logout: () => void
  hasRole: (...roles: RoleName[]) => boolean
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: async () => ({ id: '', fullName: '', roles: ['STUDENT'], firstLogin: false }),
  logout: () => {},
  hasRole: () => false,
})

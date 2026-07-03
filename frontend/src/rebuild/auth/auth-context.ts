import { createContext } from 'react'
import type { AuthUser, RoleName } from '../core/types'

export type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  login: (identifier: string, password: string) => Promise<void>
  logout: () => void
  hasRole: (...roles: RoleName[]) => boolean
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: async () => {},
  logout: () => {},
  hasRole: () => false,
})

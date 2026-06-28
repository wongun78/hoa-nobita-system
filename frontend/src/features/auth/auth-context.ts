import { createContext } from 'react'
import type { Role, User } from '../../lib/api'

export type AuthValue = {
  user: User | null
  setUser: (user: User | null) => void
  logout: () => void
  hasRole: (...roles: Role[]) => boolean
}

export const AuthContext = createContext<AuthValue>({ user: null, setUser: () => {}, logout: () => {}, hasRole: () => false })

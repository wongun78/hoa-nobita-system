import { useCallback, useEffect, useMemo, useState } from 'react'
import { AuthContext } from './auth-context'
import { api } from '../core/api'
import { clearToken, getToken, setToken } from '../core/token'
import type { AuthUser, RoleName } from '../core/types'

type AuthProviderProps = Readonly<{ children: React.ReactNode }>

export function NewAuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    if (!token) {
      setLoading(false)
      return
    }
    api.me()
      .then((me) => setUser(me))
      .catch(() => {
        clearToken()
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (identifier: string, password: string) => {
    const payload = await api.login(identifier, password)
    setToken(payload.accessToken)
    setUser(payload.user)
    return payload.user
  }, [])

  const logout = useCallback(() => {
    clearToken()
    setUser(null)
    if (globalThis.window !== undefined) {
      globalThis.window.location.href = '/dang-nhap'
    }
  }, [])

  const hasRole = useCallback((...roles: RoleName[]) => {
    if (!user) return false
    return roles.some((role) => user.roles.includes(role))
  }, [user])

  const value = useMemo(() => ({ user, loading, login, logout, hasRole }), [user, loading, login, logout, hasRole])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

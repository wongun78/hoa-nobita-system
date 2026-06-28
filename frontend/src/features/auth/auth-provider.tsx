import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api, type User } from '../../lib/api'
import { AuthContext, type AuthValue } from './auth-context'

type AuthProviderProps = Readonly<{ children: React.ReactNode }>

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const me = useQuery({ queryKey: ['me'], queryFn: async () => (await api.get('/auth/me')).data.data as User, enabled: !!localStorage.getItem('token'), retry: false })
  useEffect(() => { if (me.data) setUser(me.data) }, [me.data])
  const value = useMemo<AuthValue>(() => ({
    user,
    setUser,
    logout: () => { localStorage.removeItem('token'); setUser(null); globalThis.location.href = '/login' },
    hasRole: (...roles) => !!user && roles.some(role => user.roles.includes(role))
  }), [user])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

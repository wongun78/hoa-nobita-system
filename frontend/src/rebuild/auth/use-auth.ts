import { useContext } from 'react'
import { AuthContext } from './auth-context'

export function useNewAuth() {
  return useContext(AuthContext)
}

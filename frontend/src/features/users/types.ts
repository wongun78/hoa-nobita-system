import type { Role } from '../../lib/api'

export interface User {
  id: string
  fullName: string
  email?: string
  phone?: string
  roles: Role[]
  firstLogin: boolean
  status?: 'ACTIVE' | 'SUSPENDED'
}

export interface CreateUserRequest {
  fullName: string
  email: string
  phone?: string
  role: Role
}

export interface UpdateUserRequest {
  fullName?: string
  email?: string
  phone?: string
}

export interface StatusRequest {
  status: 'ACTIVE' | 'SUSPENDED'
}

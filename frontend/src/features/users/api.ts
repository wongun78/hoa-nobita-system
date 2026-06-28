import { api } from '../../lib/api'
import type { CreateUserRequest, UpdateUserRequest, StatusRequest, User } from './types'

export async function listUsers(): Promise<User[]> {
  const res = await api.get('/users')
  return res.data.data
}

export async function createUser(req: CreateUserRequest): Promise<{ id: string; temporaryPassword?: string }> {
  const res = await api.post('/users', req)
  return res.data.data
}

export async function getUser(id: string): Promise<User> {
  const res = await api.get(`/users/${id}`)
  return res.data.data
}

export async function updateUser(id: string, req: UpdateUserRequest): Promise<User> {
  const res = await api.patch(`/users/${id}`, req)
  return res.data.data
}

export async function updateUserStatus(id: string, req: StatusRequest): Promise<User> {
  const res = await api.patch(`/users/${id}/status`, req)
  return res.data.data
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/users/${id}`)
}

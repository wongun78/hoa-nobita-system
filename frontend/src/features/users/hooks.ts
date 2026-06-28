import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../../lib/query-keys'
import * as api from './api'
import type { CreateUserRequest, UpdateUserRequest, StatusRequest } from './types'

export function useUsers() {
  return useQuery({ queryKey: qk.users, queryFn: api.listUsers })
}

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (req: CreateUserRequest) => api.createUser(req),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.users }),
  })
}

export function useUpdateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, req }: { id: string; req: UpdateUserRequest }) => api.updateUser(id, req),
    onSuccess: (_, { id }) => qc.invalidateQueries({ queryKey: qk.user(id) }),
  })
}

export function useUpdateUserStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, req }: { id: string; req: StatusRequest }) => api.updateUserStatus(id, req),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.users }),
  })
}

export function useDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.users }),
  })
}

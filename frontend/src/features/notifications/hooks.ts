import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../../lib/query-keys'
import * as api from './api'
import type { NotificationRequest } from './types'

export function useNotifications() {
  return useQuery({ queryKey: qk.notifications, queryFn: api.listNotifications })
}

export function useCreateNotification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (req: NotificationRequest) => api.createNotification(req),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.notifications }),
  })
}

export function useDeleteNotification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteNotification(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.notifications }),
  })
}

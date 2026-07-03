import axios from 'axios'
import { clearToken, getToken } from './token'
import type { ApiEnvelope } from './types'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/v1',
})

http.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearToken()
      if (globalThis.window !== undefined && globalThis.window.location.pathname !== '/dang-nhap') {
        globalThis.window.location.href = '/dang-nhap'
      }
    }
    return Promise.reject(error)
  }
)

async function unwrap<T>(promise: Promise<{ data: ApiEnvelope<T> }>): Promise<T> {
  const res = await promise
  if (!res.data.success) {
    throw new Error(res.data.message || 'API Error')
  }
  return res.data.data
}

export function getApi<T>(url: string, params?: Record<string, unknown>) {
  return unwrap<T>(http.get(url, { params }))
}

export function postApi<T>(url: string, body?: unknown) {
  return unwrap<T>(http.post(url, body))
}

export function patchApi<T>(url: string, body?: unknown) {
  return unwrap<T>(http.patch(url, body))
}

export function deleteApi<T>(url: string) {
  return unwrap<T>(http.delete(url))
}

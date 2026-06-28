import axios from 'axios'

export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/v1' })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export type Role = 'TEACHER_OWNER' | 'CLASS_ADMIN' | 'STUDENT'
export type User = { id: string; fullName: string; email?: string; phone?: string; roles: Role[]; firstLogin: boolean }

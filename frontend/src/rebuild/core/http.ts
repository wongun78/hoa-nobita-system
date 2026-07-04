import axios, { AxiosError } from 'axios'
import { clearToken, getToken } from './token'
import type { ApiEnvelope, ApiError as BackendApiError } from './types'

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/v1'

export class ApiClientError extends Error {
  status?: number
  errors: BackendApiError[]

  constructor(message: string, status?: number, errors: BackendApiError[] = []) {
    super(message)
    this.name = 'ApiClientError'
    this.status = status
    this.errors = errors
  }

  get fieldErrors() {
    return this.errors.filter((error) => error.field)
  }
}

export const http = axios.create({
  baseURL: API_BASE_URL,
})

http.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

function redirectToLogin() {
  if (globalThis.window === undefined) return
  const current = globalThis.window.location.pathname
  if (current !== '/dang-nhap' && current !== '/login') {
    globalThis.window.location.href = `/dang-nhap?from=${encodeURIComponent(current)}`
  }
}

function redirectToForbidden() {
  if (globalThis.window === undefined) return
  if (globalThis.window.location.pathname !== '/khong-co-quyen') {
    globalThis.window.history.pushState(null, '', '/khong-co-quyen')
    globalThis.window.dispatchEvent(new PopStateEvent('popstate'))
  }
}

function toApiClientError(error: unknown): ApiClientError {
  if (error instanceof ApiClientError) return error

  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiEnvelope<unknown>>
    const status = axiosError.response?.status
    const envelope = axiosError.response?.data
    const message = envelope?.message || axiosError.message || 'Không thể kết nối máy chủ.'
    return new ApiClientError(message, status, envelope?.errors ?? [])
  }

  if (error instanceof Error) return new ApiClientError(error.message)
  return new ApiClientError('Đã có lỗi không xác định.')
}

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const clientError = toApiClientError(error)

    if (clientError.status === 401) {
      clearToken()
      redirectToLogin()
    }

    if (clientError.status === 403) {
      redirectToForbidden()
    }

    return Promise.reject(clientError)
  }
)

function toBackendParams(params?: Record<string, unknown>) {
  if (!params || typeof params.page !== 'number') return params
  return { ...params, page: params.page + 1 }
}

function normalizeBackendPage<T>(data: T): T {
  if (data && typeof data === 'object' && !Array.isArray(data) && 'items' in data && 'page' in data) {
    const pageData = data as T & { page: unknown }
    if (typeof pageData.page === 'number') return { ...pageData, page: Math.max(pageData.page - 1, 0) }
  }
  return data
}

async function unwrap<T>(promise: Promise<{ data: ApiEnvelope<T> }>): Promise<T> {
  try {
    const res = await promise
    if (!res.data.success) {
      throw new ApiClientError(res.data.message || 'API Error', undefined, res.data.errors ?? [])
    }
    return normalizeBackendPage(res.data.data)
  } catch (error) {
    throw toApiClientError(error)
  }
}

export function getApi<T>(url: string, params?: Record<string, unknown>) {
  return unwrap<T>(http.get(url, { params: toBackendParams(params) }))
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

export async function downloadBlobApi(url: string, params?: Record<string, unknown>) {
  try {
    const response = await http.get<Blob>(url, { params, responseType: 'blob' })
    const disposition = response.headers['content-disposition']
    const match = typeof disposition === 'string' ? /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition) : null
    return {
      blob: response.data,
      filename: match?.[1] ? decodeURIComponent(match[1]) : undefined,
      contentType: response.headers['content-type'],
    }
  } catch (error) {
    throw toApiClientError(error)
  }
}

export async function downloadBlobToFile(url: string, fallbackFilename: string, params?: Record<string, unknown>) {
  const { blob, filename } = await downloadBlobApi(url, params)
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = filename ?? fallbackFilename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(objectUrl)
}

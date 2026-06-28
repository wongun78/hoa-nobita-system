import { AxiosError } from 'axios'

export interface ApiError {
  status: number
  message: string
  fieldErrors?: Record<string, string>
}

export function toApiError(err: unknown): ApiError {
  if (err instanceof AxiosError) {
    const data = err.response?.data as any
    return {
      status: err.response?.status ?? 500,
      message: data?.message ?? data?.error ?? err.message ?? 'Unknown error',
      fieldErrors: data?.fieldErrors,
    }
  }
  return { status: 500, message: String(err) }
}

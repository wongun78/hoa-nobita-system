import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { NewAuthProvider } from '../rebuild/auth/auth-provider'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 45_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        const status = typeof error === 'object' && error !== null && 'status' in error ? Number(error.status) : undefined
        if (status === 401 || status === 403 || status === 404) return false
        return failureCount < 1
      },
    },
    mutations: {
      retry: false,
    },
  },
})

type ProvidersProps = Readonly<{ children: React.ReactNode }>

export function Providers({ children }: ProvidersProps) {
  return <QueryClientProvider client={queryClient}><NewAuthProvider><BrowserRouter>{children}</BrowserRouter></NewAuthProvider></QueryClientProvider>
}

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { NewAuthProvider } from '../rebuild/auth/auth-provider'

const queryClient = new QueryClient()

type ProvidersProps = Readonly<{ children: React.ReactNode }>

export function Providers({ children }: ProvidersProps) {
  return <QueryClientProvider client={queryClient}><NewAuthProvider><BrowserRouter>{children}</BrowserRouter></NewAuthProvider></QueryClientProvider>
}

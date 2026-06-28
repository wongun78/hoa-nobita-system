import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../features/auth/auth-provider'
import { I18nProvider } from '../i18n/i18n-provider'

const queryClient = new QueryClient()

type ProvidersProps = Readonly<{ children: React.ReactNode }>

export function Providers({ children }: ProvidersProps) {
  return <QueryClientProvider client={queryClient}><I18nProvider><AuthProvider><BrowserRouter>{children}</BrowserRouter></AuthProvider></I18nProvider></QueryClientProvider>
}

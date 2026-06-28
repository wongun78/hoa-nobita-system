import { AppShell } from '../components/layout/app-shell'
import { PageHeader } from '../components/system/states'

type PageProps = Readonly<{ title: string; children: React.ReactNode }>

export function Page({ title, children }: PageProps) {
  return <AppShell><PageHeader title={title}/>{children}</AppShell>
}

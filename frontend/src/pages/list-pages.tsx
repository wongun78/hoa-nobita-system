import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { EmptyState, ErrorState, LoadingState, StatCard, StatusBadge } from '../components/system/states'
import { Card } from '../components/ui/card'
import { useI18n } from '../i18n/use-i18n'
import { api } from '../lib/api'
import { Page } from './shared'

type DataListPageProps = Readonly<{ title: string; endpoint: string; detailBase?: string }>

export function DashboardPage() {
  const { t } = useI18n()
  return <Page title={t.dashboard}><div className="grid gap-4 md:grid-cols-4"><StatCard label={t.myClasses} value={4}/><StatCard label={t.openAssignments} value={8}/><StatCard label={t.gradingQueue} value={3}/><StatCard label={t.newNotifications} value={5}/></div></Page>
}

export function DataListPage({ title, endpoint, detailBase }: DataListPageProps) {
  const { t } = useI18n()
  const q = useQuery({ queryKey: [endpoint], queryFn: async () => (await api.get(endpoint)).data.data })
  return <Page title={title}>{q.isLoading && <LoadingState text={t.loading}/>} {q.isError && <ErrorState text={t.error}/>} {Array.isArray(q.data) && q.data.length === 0 && <EmptyState text={t.empty}/>}<div className="grid gap-4 md:grid-cols-2">{q.data?.map((x: any) => <Card key={x.id}><div className="flex items-start justify-between gap-4"><div><h3 className="font-bold text-[#1E3A8A]">{x.name || x.title || x.fullName}</h3><p className="mt-2 text-sm text-slate-500">{x.description || x.email || x.content || x.status}</p></div><StatusBadge status={x.status}/></div>{detailBase && <Link className="mt-4 inline-block rounded-xl bg-[#3B82F6] px-4 py-2 text-white" to={`${detailBase}/${x.id}`}>{t.detail}</Link>}</Card>)}</div></Page>
}

export function ClassesPage() { const { t } = useI18n(); return <DataListPage title={t.classes} endpoint="/classes" detailBase="/classes"/> }
export function UsersPage() { const { t } = useI18n(); return <DataListPage title={t.users} endpoint="/users"/> }
export function NotificationsPage() { const { t } = useI18n(); return <DataListPage title={t.notifications} endpoint="/notifications"/> }
export function MySubmissionsPage() { const { t } = useI18n(); return <DataListPage title={t.submissions} endpoint="/me/submissions"/> }
export function AssignmentsPage() { const { t } = useI18n(); return <DataListPage title={t.assignments} endpoint="/assignments" detailBase="/assignments"/> }
export function MaterialsPage() { const { t } = useI18n(); const { classId } = useParams(); return <DataListPage title={t.materials} endpoint={`/classes/${classId}/materials`}/> }
export function ClassAssignmentsPage() { const { t } = useI18n(); const { classId } = useParams(); return <DataListPage title={t.assignments} endpoint={`/classes/${classId}/assignments`} detailBase="/assignments"/> }
export function AssignmentSubmissionsPage() { const { assignmentId } = useParams(); const { t } = useI18n(); return <DataListPage title={t.viewSubmissions} endpoint={`/assignments/${assignmentId}/submissions`}/> }

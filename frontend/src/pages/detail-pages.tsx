import { useMutation, useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ErrorState, LoadingState } from '../components/system/states'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Textarea } from '../components/ui/textarea'
import { useAuth } from '../features/auth/use-auth'
import { useI18n } from '../i18n/use-i18n'
import { api } from '../lib/api'
import { Page } from './shared'

export { UserDetailPage } from './user-detail-page'
export { SubmissionDetailPage } from './submission-detail-page'

export function ClassDetailPage() {
  const { t } = useI18n()
  const { classId } = useParams()
  return <Page title={t.classDetail}><div className="grid gap-4 md:grid-cols-3"><Link className="rounded-2xl border border-[#D8E7F7] bg-white p-5 text-[#1E3A8A]" to={`/classes/${classId}/materials`}>{t.materials}</Link><Link className="rounded-2xl border border-[#D8E7F7] bg-white p-5 text-[#1E3A8A]" to={`/classes/${classId}/assignments`}>{t.assignments}</Link><Link className="rounded-2xl border border-[#D8E7F7] bg-white p-5 text-[#1E3A8A]" to="/notifications">{t.notifications}</Link></div></Page>
}

export function AssignmentDetailPage() {
  const { t } = useI18n()
  const { assignmentId } = useParams()
  const { hasRole } = useAuth()
  const q = useQuery({ queryKey: ['assignment', assignmentId], queryFn: async () => (await api.get(`/assignments/${assignmentId}`)).data.data })
  const form = useForm({ defaultValues: { contentText: '' } })
  const submit = useMutation({ mutationFn: async (v: any) => (await api.post(`/assignments/${assignmentId}/submissions`, v)).data.data })
  return <Page title={q.data?.title || t.assignments}>{q.isLoading && <LoadingState text={t.loading}/>} {q.isError && <ErrorState text={t.error}/>} {q.data && <Card><p className="text-slate-700">{q.data.instruction}</p><p className="mt-2 text-sm text-slate-500">{t.status}: {q.data.status}</p>{hasRole('STUDENT') ? <form className="mt-4 space-y-3" onSubmit={form.handleSubmit(v => submit.mutate(v))}><Textarea placeholder={t.submissionContent} {...form.register('contentText')} /><Button disabled={submit.isPending}>{t.submit}</Button></form> : <Link className="mt-4 inline-block rounded-xl bg-[#3B82F6] px-4 py-2 text-white" to={`/assignments/${assignmentId}/submissions`}>{t.viewSubmissions}</Link>}</Card>}</Page>
}

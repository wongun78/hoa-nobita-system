import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { useAuth } from '../features/auth/use-auth'
import { useI18n } from '../i18n/use-i18n'
import { api } from '../lib/api'

const DEMO_LOGIN = { identifier: 'teacher@hoanobita.com', password: import.meta.env.VITE_DEMO_PASSWORD ?? '' }
const schema = z.object({ identifier: z.string().min(1), password: z.string().min(1) })

export function LoginPage() {
  const { t, toggle, locale } = useI18n()
  const { setUser } = useAuth()
  const nav = useNavigate()
  const form = useForm({ resolver: zodResolver(schema), defaultValues: DEMO_LOGIN })
  const login = useMutation({ mutationFn: async (v: z.infer<typeof schema>) => (await api.post('/auth/login', v)).data.data, onSuccess: d => { localStorage.setItem('token', d.accessToken); setUser(d.user); nav('/dashboard') } })
  return (
    <div className="grid min-h-screen place-items-center bg-[#F5FAFF]">
      <Card className="w-[28rem]">
        <form className="space-y-4" onSubmit={form.handleSubmit(v => login.mutate(v))}>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#1E3A8A]">{t.login}</h1>
              <p className="text-sm text-slate-500">{t.cleanSystem}</p>
            </div>
            <button type="button" className="text-sm text-blue-700" onClick={toggle}>{locale === 'vi' ? 'VI' : '한국어'}</button>
          </div>
          <Input placeholder={t.emailOrPhone} {...form.register('identifier')} />
          <Input type="password" placeholder={t.password} {...form.register('password')} />
          {login.isError && <p className="text-sm text-red-600">{t.loginFailed}</p>}
          <Button className="w-full" disabled={login.isPending}>{t.login}</Button>
        </form>
      </Card>
    </div>
  )
}

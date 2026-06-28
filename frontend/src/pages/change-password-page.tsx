import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'

export function ChangePasswordPage() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [msg, setMsg] = useState('')

  const mut = useMutation({
    mutationFn: () => api.post('/auth/change-password', { currentPassword: current, newPassword: next }),
    onSuccess: () => setMsg('Đổi mật khẩu thành công'),
    onError: () => setMsg('Đổi mật khẩu thất bại'),
  })

  return (
    <Card className="max-w-md">
      <h1 className="text-xl font-bold mb-4">Đổi mật khẩu</h1>
      <div className="space-y-3">
        <Input type="password" placeholder="Mật khẩu hiện tại" value={current} onChange={e => setCurrent(e.target.value)} />
        <Input type="password" placeholder="Mật khẩu mới" value={next} onChange={e => setNext(e.target.value)} />
        <Button onClick={() => mut.mutate()} disabled={mut.isPending}>Đổi mật khẩu</Button>
        {msg && <p className="text-sm text-emerald-600">{msg}</p>}
      </div>
    </Card>
  )
}

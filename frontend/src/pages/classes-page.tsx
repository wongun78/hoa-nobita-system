import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useClasses, useCreateClass } from '../features/classes/hooks'
import { createClassSchema, type CreateClassForm } from '../features/classes/schema'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Dialog } from '../components/ui/dialog'
import { FormField } from '../components/ui/form'

export function ClassesPage() {
  const { data, isLoading, isError } = useClasses()
  const create = useCreateClass()
  const [open, setOpen] = useState(false)

  const form = useForm<CreateClassForm>({
    resolver: zodResolver(createClassSchema),
    defaultValues: { name: '', code: '', levelFrom: 1, levelTo: 2 },
  })

  const onCreate = async (values: CreateClassForm) => {
    await create.mutateAsync(values)
    setOpen(false)
    form.reset()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#1E3A8A]">Lớp học</h1>
        <Button onClick={() => setOpen(true)}>+ Tạo lớp</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading && <div className="col-span-full p-8 text-center text-slate-500">Đang tải...</div>}
        {isError && <div className="col-span-full p-8 text-center text-red-600">Lỗi tải danh sách lớp.</div>}
        {!isLoading && !isError && data?.map(c => (
          <Card key={c.id} className="p-5">
            <div className="font-semibold text-lg text-[#1E3A8A]">{c.name}</div>
            <div className="text-sm text-slate-500 mt-1">{c.code} • Level {c.levelFrom}-{c.levelTo}</div>
            <Link to={`/classes/${c.id}`} className="mt-3 inline-block text-sm text-[#3B82F6] hover:underline">Xem chi tiết →</Link>
          </Card>
        ))}
      </div>

      <Dialog open={open} onClose={() => setOpen(false)} title="Tạo lớp mới">
        <form onSubmit={form.handleSubmit(onCreate)} className="space-y-4">
          <FormField name="name" label="Tên lớp" />
          <FormField name="code" label="Mã lớp" />
          <div className="grid grid-cols-2 gap-3">
            <FormField name="levelFrom" label="Level từ" />
            <FormField name="levelTo" label="Level đến" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
            <Button type="submit" disabled={create.isPending}>Tạo lớp</Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}

import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog } from '../../../components/ui/dialog'
import { FormField } from '../../../components/ui/form'
import { Button } from '../../../components/ui/button'
import { Select } from '../../../components/ui/select'
import type { AssignmentRequest } from '../types'

const assignmentSchema = z.object({
  title: z.string().min(2, 'Tiêu đề phải có ít nhất 2 ký tự'),
  description: z.string().optional(),
  instruction: z.string().optional(),
  maxScore: z.number().min(1, 'Điểm tối đa phải lớn hơn 0'),
  status: z.enum(['DRAFT', 'PUBLISHED', 'CLOSED']).default('DRAFT'),
  allowResubmit: z.boolean().default(true),
  dueAt: z.string().optional(),
})

interface AssignmentFormDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: AssignmentRequest) => Promise<any>
  defaultValues?: Partial<AssignmentRequest>
  title: string
  submitLabel: string
}

export function AssignmentFormDialog({ open, onClose, onSubmit, defaultValues, title, submitLabel }: AssignmentFormDialogProps) {
  const form = useForm({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      title: defaultValues?.title || '',
      description: defaultValues?.description || '',
      instruction: defaultValues?.instruction || '',
      maxScore: defaultValues?.maxScore || 10,
      status: defaultValues?.status || 'DRAFT',
      allowResubmit: defaultValues?.allowResubmit ?? true,
      dueAt: defaultValues?.dueAt || '',
    },
  })

  const handleSubmit = async (data: any) => {
    await onSubmit(data)
    form.reset()
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField name="title" label="Tiêu đề" />
          <FormField name="description" label="Mô tả" />
          <FormField name="instruction" label="Hướng dẫn làm bài" />
          <div className="grid grid-cols-2 gap-4">
            <FormField name="maxScore" label="Điểm tối đa">
              <input type="number" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" {...form.register('maxScore', { valueAsNumber: true })} />
            </FormField>
            <FormField name="dueAt" label="Hạn nộp">
              <input type="datetime-local" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" {...form.register('dueAt')} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField name="status" label="Trạng thái">
              <Select {...form.register('status')}>
                <option value="DRAFT">Bản nháp</option>
                <option value="PUBLISHED">Đã xuất bản</option>
                <option value="CLOSED">Đã đóng</option>
              </Select>
            </FormField>
            <FormField name="allowResubmit" label="Cho phép nộp lại">
              <Select {...form.register('allowResubmit', { setValueAs: v => v === 'true' })}>
                <option value="true">Có</option>
                <option value="false">Không</option>
              </Select>
            </FormField>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Hủy</Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>{submitLabel}</Button>
          </div>
        </form>
      </FormProvider>
    </Dialog>
  )
}

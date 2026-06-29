import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog } from '../../../components/ui/dialog'
import { Button } from '../../../components/ui/button'
import { Textarea } from '../../../components/ui/textarea'
import { useSubmit, useUpdateSubmission } from '../hooks'
import type { Submission } from '../types'
import { FileUploadField } from '../../files/components/file-upload-field'

const schema = z.object({
  contentText: z.string().optional(),
  contentUrl: z.string().url('URL không hợp lệ').optional().or(z.literal('')),
  fileId: z.string().optional(),
}).refine(data => data.contentText || data.contentUrl || data.fileId, {
  message: 'Vui lòng nhập nội dung, link hoặc đính kèm file',
  path: ['contentText']
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  submission?: Submission
  assignmentId: string
}

export function SubmissionFormDialog({ open, onClose, submission, assignmentId }: Props) {
  const isEdit = !!submission
  const submitMut = useSubmit(assignmentId)
  const updateMut = useUpdateSubmission(assignmentId)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      contentText: submission?.contentText || '',
      contentUrl: submission?.contentUrl || '',
      fileId: submission?.fileId || '',
    }
  })

  const onSubmit = async (values: FormValues) => {
    if (isEdit) {
      await updateMut.mutateAsync({ id: submission.id, req: values })
    } else {
      await submitMut.mutateAsync(values)
    }
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} title={isEdit ? 'Sửa bài nộp' : 'Nộp bài'}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nội dung</label>
          <Textarea 
            {...form.register('contentText')} 
            placeholder="Nhập nội dung bài nộp..." 
            className="min-h-[150px]"
          />
          {form.formState.errors.contentText && (
            <p className="mt-1 text-sm text-red-600">{form.formState.errors.contentText.message}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Link đính kèm (tùy chọn)</label>
          <input 
            type="url"
            {...form.register('contentUrl')} 
            placeholder="https://..." 
            className="w-full rounded-xl border px-3 py-2 text-sm"
          />
          {form.formState.errors.contentUrl && (
            <p className="mt-1 text-sm text-red-600">{form.formState.errors.contentUrl.message}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">File đính kèm (tùy chọn)</label>
          <FileUploadField 
            onUploadSuccess={id => form.setValue('fileId', id)} 
          />
          {form.watch('fileId') && <div className="mt-1 text-sm text-green-600">Đã đính kèm file.</div>}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>Hủy</Button>
          <Button type="submit" disabled={submitMut.isPending || updateMut.isPending}>
            {isEdit ? 'Lưu thay đổi' : 'Nộp bài'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
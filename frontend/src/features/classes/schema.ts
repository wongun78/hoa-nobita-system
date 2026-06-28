import { z } from 'zod'

export const createClassSchema = z.object({
  name: z.string().min(2, 'Tên lớp phải có ít nhất 2 ký tự'),
  code: z.string().min(2, 'Mã lớp phải có ít nhất 2 ký tự'),
  levelFrom: z.number().min(1).max(6),
  levelTo: z.number().min(1).max(6),
})

export type CreateClassForm = z.infer<typeof createClassSchema>

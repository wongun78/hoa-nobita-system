import { z } from 'zod'

export const createUserSchema = z.object({
  fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().optional(),
  role: z.enum(['TEACHER_OWNER', 'CLASS_ADMIN', 'STUDENT']),
})

export type CreateUserForm = z.infer<typeof createUserSchema>

export const updateUserSchema = z.object({
  fullName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
})

export type UpdateUserForm = z.infer<typeof updateUserSchema>

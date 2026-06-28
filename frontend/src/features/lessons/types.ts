export interface Lesson {
  id: string
  classId: string
  title: string
  description?: string
  orderIndex: number
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
}

export interface LessonRequest {
  title: string
  description?: string
  orderIndex: number
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
}

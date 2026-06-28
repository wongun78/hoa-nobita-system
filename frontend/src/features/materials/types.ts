export interface Material {
  id: string
  classId: string
  title: string
  description?: string
  externalUrl?: string
  fileId?: string
  visible: boolean
}

export interface MaterialRequest {
  title: string
  description?: string
  externalUrl?: string
  fileId?: string
  visible?: boolean
}

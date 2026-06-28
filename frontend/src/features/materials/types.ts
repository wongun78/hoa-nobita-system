export interface Material {
  id: string
  classId: string
  title: string
  description?: string
  externalUrl?: string
  fileId?: string
  fileName?: string // Added for UI convenience if backend returns it, or we can fetch it
  visible: boolean
}

export interface MaterialRequest {
  title: string
  description?: string
  externalUrl?: string
  fileId?: string
  visible?: boolean
}

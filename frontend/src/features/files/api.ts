import { api } from '../../lib/api'
import type { FileMetadata } from './types'

export async function uploadFile(file: File): Promise<FileMetadata> {
  const formData = new FormData()
  formData.append('file', file)
  
  const res = await api.post('/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return res.data.data
}

export async function downloadFile(fileId: string, fileName: string): Promise<void> {
  const res = await api.get(`/files/${fileId}/download`, {
    responseType: 'blob'
  })
  
  const url = window.URL.createObjectURL(new Blob([res.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', fileName)
  document.body.appendChild(link)
  link.click()
  link.parentNode?.removeChild(link)
  window.URL.revokeObjectURL(url)
}

import { useMutation } from '@tanstack/react-query'
import * as api from './api'

export function useUploadFile() {
  return useMutation({
    mutationFn: (file: File) => api.uploadFile(file)
  })
}

export function useDownloadFile() {
  return useMutation({
    mutationFn: ({ fileId, fileName }: { fileId: string, fileName: string }) => api.downloadFile(fileId, fileName)
  })
}

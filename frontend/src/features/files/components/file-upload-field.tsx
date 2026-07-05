import { useState, useRef } from 'react'
import { useUploadFile } from '../hooks'
import { Button } from '../../../components/ui/button'

interface FileUploadFieldProps {
  onUploadSuccess: (fileId: string, fileName: string) => void
  maxSizeMB?: number
  accept?: string
}

export function FileUploadField({ onUploadSuccess, maxSizeMB = 1024, accept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,.7z,.png,.jpg,.jpeg,.gif,.webp,.svg,.bmp,.mp3,.wav,.ogg,.mp4,.webm,.mov,.avi' }: FileUploadFieldProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const upload = useUploadFile()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    setSuccess(false)
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Dung lượng tệp quá lớn. Tối đa ${maxSizeMB}MB.`)
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setSelectedFile(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) return
    setError(null)
    try {
      const res = await upload.mutateAsync(selectedFile)
      setSuccess(true)
      onUploadSuccess(res.id, res.originalFileName)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải tệp lên')
    }
  }

  return (
    <div className="space-y-2 border rounded-lg p-4 bg-slate-50">
      <div className="flex items-center gap-4">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={accept}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload">
          <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
            Chọn tệp
          </Button>
        </label>
        <div className="text-sm text-slate-600 flex-1 truncate">
          {selectedFile ? selectedFile.name : 'Chưa chọn tệp nào'}
        </div>
      </div>
      
      {selectedFile && !success && (
        <div className="flex justify-end">
          <Button 
            type="button" 
            onClick={handleUpload} 
            disabled={upload.isPending}
          >
            {upload.isPending ? 'Đang tải lên...' : 'Tải tệp lên'}
          </Button>
        </div>
      )}

      {error && <div className="text-sm text-red-600">{error}</div>}
      {success && <div className="text-sm text-green-600">Tải lên thành công!</div>}
    </div>
  )
}

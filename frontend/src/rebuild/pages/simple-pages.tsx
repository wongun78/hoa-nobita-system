import { Card } from '../layout/ui'

export function ForbiddenPage() {
  return (
    <div className="min-h-screen bg-[#FAFCFF] p-6">
      <Card className="mx-auto max-w-lg text-center">
        <h1 className="text-2xl font-bold">Không có quyền truy cập</h1>
      </Card>
    </div>
  )
}

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#FAFCFF] p-6">
      <Card className="mx-auto max-w-lg text-center">
        <h1 className="text-2xl font-bold">Không tìm thấy trang</h1>
      </Card>
    </div>
  )
}

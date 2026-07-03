import { ForbiddenState } from '../auth/guards'
import { EmptyState } from '../components/foundation'

export function ForbiddenPage() {
  return <ForbiddenState />
}

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fbcfe8_0,transparent_32%),radial-gradient(circle_at_top_right,#bae6fd_0,transparent_30%),#f8fafc] p-6">
      <div className="mx-auto max-w-lg pt-16">
        <EmptyState title="Không tìm thấy trang" description="Đường dẫn này không tồn tại hoặc đã được di chuyển." />
      </div>
    </div>
  )
}

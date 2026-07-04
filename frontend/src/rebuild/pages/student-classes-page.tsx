import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, Search, Users } from 'lucide-react'
import { api } from '../core/api'
import { EmptyState, ErrorState, PageHeader, SearchInput, SkeletonCard, StatusBadge } from '../components/foundation'
import { Card } from '../layout/ui'
import type { ClassItem } from '../core/types'

function classLevel(item: ClassItem) {
  if (item.levelFrom && item.levelTo) return `TOPIK ${item.levelFrom}–${item.levelTo}`
  if (item.levelFrom) return `TOPIK ${item.levelFrom}+`
  return 'Lớp tiếng Hàn'
}

export function StudentClassesPage() {
  const [search, setSearch] = useState('')
  const classes = useQuery({ queryKey: ['student', 'classes'], queryFn: () => api.classesPage({ page: 0, size: 50 }) })

  const items = useMemo(() => {
    const raw = Array.isArray(classes.data) ? classes.data : classes.data?.items ?? []
    const keyword = search.trim().toLowerCase()
    if (!keyword) return raw
    return raw.filter((item) => [item.name, item.code, item.teacherName].some((value) => value?.toLowerCase().includes(keyword)))
  }, [classes.data, search])

  if (classes.isLoading) {
    return (
      <div className="space-y-4 pb-20 md:pb-0">
        <SkeletonCard lines={4} />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
      </div>
    )
  }

  if (classes.isError) {
    return <ErrorState title="Không tải được lớp học" description="Vui lòng thử lại sau ít phút." onRetry={() => classes.refetch()} />
  }

  return (
    <div className="space-y-5 pb-20 md:pb-0">
      <PageHeader
        eyebrow="Lớp học của tôi"
        title="Lớp học của tôi"
        description="Danh sách lớp bạn đang tham gia. Chọn một lớp để xem bài học, tài liệu và bài tập."
      />

      <div className="rounded-3xl border border-sky-100 bg-white/85 p-3 shadow-sm">
        <SearchInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo tên lớp, mã lớp, giáo viên..." aria-label="Tìm lớp học" />
      </div>

      {items.length === 0 ? (
        <EmptyState
          title={search ? 'Không tìm thấy lớp phù hợp' : 'Bạn chưa tham gia lớp nào'}
          description={search ? 'Thử từ khóa khác hoặc xóa bộ lọc tìm kiếm.' : 'Khi được thêm vào lớp, lớp học sẽ xuất hiện tại đây.'}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <a key={item.id} href={`/student/classes/${item.id}`} className="group block min-h-44 rounded-3xl focus:outline-none focus:ring-4 focus:ring-indigo-100">
              <Card className="relative h-full overflow-hidden rounded-3xl transition group-hover:-translate-y-1 group-hover:shadow-xl">
                <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-indigo-500 via-sky-300 to-pink-300" />
                <div className="flex items-start justify-between gap-3 pt-2">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-pink-100 text-indigo-600">
                    <BookOpen size={22} />
                  </div>
                  <StatusBadge value={item.status} />
                </div>
                <h2 className="mt-4 line-clamp-2 text-lg font-black tracking-tight text-slate-950">{item.name}</h2>
                <div className="mt-1 text-sm font-semibold text-indigo-600">{item.code} · {classLevel(item)}</div>
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">{item.description || `Giáo viên: ${item.teacherName}`}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-600">
                  <span className="inline-flex min-h-8 items-center gap-1 rounded-full bg-sky-50 px-3"><Users size={14} /> {item.studentCount ?? 0} học viên</span>
                  <span className="inline-flex min-h-8 items-center rounded-full bg-slate-50 px-3">{item.teacherName}</span>
                </div>
              </Card>
            </a>
          ))}
        </div>
      )}

      <div className="rounded-3xl border border-white/70 bg-gradient-to-r from-sky-50 to-pink-50 p-4 text-sm text-slate-600">
        <Search className="mr-2 inline text-indigo-500" size={16} />
        Mẹo học tập: vào từng lớp để xem tài liệu hiển thị, deadline và lịch sử bài nộp của bạn.
      </div>
    </div>
  )
}

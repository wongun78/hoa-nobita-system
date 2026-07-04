import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, Users } from 'lucide-react'
import { api } from '../core/api'
import { EmptyState, ErrorState, PageHeader, SearchInput, SkeletonCard, StatusBadge } from '../components/foundation'
import { Card } from '../layout/ui'
import type { ClassItem } from '../core/types'

const classGradients = [
  { bar: 'from-indigo-500 via-sky-400 to-cyan-300', icon: 'from-indigo-100 to-sky-100 text-indigo-600', accent: 'bg-indigo-50 text-indigo-600' },
  { bar: 'from-violet-500 via-purple-400 to-fuchsia-300', icon: 'from-violet-100 to-fuchsia-100 text-violet-600', accent: 'bg-violet-50 text-violet-600' },
  { bar: 'from-rose-500 via-pink-400 to-orange-300', icon: 'from-rose-100 to-orange-100 text-rose-600', accent: 'bg-rose-50 text-rose-600' },
  { bar: 'from-emerald-500 via-teal-400 to-cyan-300', icon: 'from-emerald-100 to-teal-100 text-emerald-600', accent: 'bg-emerald-50 text-emerald-600' },
  { bar: 'from-amber-500 via-orange-400 to-yellow-300', icon: 'from-amber-100 to-yellow-100 text-amber-600', accent: 'bg-amber-50 text-amber-600' },
]

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
        description="Các lớp TOPIK bạn đang tham gia. Nhấn vào lớp để xem bài học, tài liệu và tiến độ."
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
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item, index) => {
            const palette = classGradients[index % classGradients.length]
            return (
              <a key={item.id} href={`/student/classes/${item.id}`} className="group block rounded-3xl focus:outline-none focus:ring-4 focus:ring-indigo-100">
                <Card className="relative flex h-full flex-col overflow-hidden rounded-3xl transition group-hover:-translate-y-1 group-hover:shadow-xl">
                  <div className={`absolute inset-x-0 top-0 h-2 bg-gradient-to-r ${palette.bar}`} />
                  <div className="flex items-start justify-between gap-3 pt-3">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${palette.icon}`}>
                      <BookOpen size={22} />
                    </div>
                    <StatusBadge value={item.status} />
                  </div>
                  <h2 className="mt-4 line-clamp-2 text-lg font-black tracking-tight text-slate-950">{item.name}</h2>
                  <div className="mt-1 text-sm font-semibold text-indigo-600">{item.code} · {classLevel(item)}</div>
                  <p className="mt-3 line-clamp-2 flex-1 text-sm leading-6 text-slate-500">{item.description || `Giáo viên: ${item.teacherName}`}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-600">
                    <span className={`inline-flex min-h-8 items-center gap-1 rounded-full ${palette.accent} px-3`}><Users size={14} /> {item.studentCount ?? 0} học viên</span>
                    <span className="inline-flex min-h-8 items-center rounded-full bg-slate-50 px-3">{item.teacherName}</span>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-sm font-bold text-indigo-600 transition group-hover:gap-2">
                    Vào lớp <span className="transition group-hover:translate-x-1">→</span>
                  </div>
                </Card>
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}

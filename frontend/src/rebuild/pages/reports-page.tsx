import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../core/api'
import { Button, Card, FieldLabel, Input } from '../layout/ui'

export function ReportsPage() {
  const [classId, setClassId] = useState('')

  const classesQuery = useQuery({ queryKey: ['classes'], queryFn: () => api.classes() })
  const activityQuery = useQuery({ queryKey: ['activity', 'recent'], queryFn: () => api.recentActivity() })
  const systemQuery = useQuery({ queryKey: ['reports', 'system'], queryFn: () => api.reportSystem() })
  const classQuery = useQuery({
    queryKey: ['reports', 'class', classId],
    queryFn: () => api.reportClass(classId),
    enabled: classId.length > 0,
  })

  const systemJson = useMemo(() => JSON.stringify(systemQuery.data ?? {}, null, 2), [systemQuery.data])
  const classJson = useMemo(() => JSON.stringify(classQuery.data ?? {}, null, 2), [classQuery.data])

  return (
    <div className="space-y-4">
      <Card>
        <h1 className="text-xl font-bold">Báo cáo nhanh</h1>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-sky-100 bg-sky-50 p-3">
            <div className="text-xs uppercase tracking-wide text-slate-500">Tổng lớp học</div>
            <div className="mt-1 text-2xl font-bold text-slate-800">{classesQuery.data?.length ?? '-'}</div>
          </div>
          <div className="rounded-xl border border-sky-100 bg-sky-50 p-3">
            <div className="text-xs uppercase tracking-wide text-slate-500">Hoạt động gần đây</div>
            <div className="mt-1 text-2xl font-bold text-slate-800">{activityQuery.data?.length ?? '-'}</div>
          </div>
          <div className="rounded-xl border border-sky-100 bg-sky-50 p-3">
            <div className="text-xs uppercase tracking-wide text-slate-500">Class ID đang xem</div>
            <div className="mt-1 break-all text-sm font-semibold text-slate-700">{classId || 'Chưa chọn'}</div>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-bold">Báo cáo hệ thống</h2>
        {systemQuery.isLoading && <div className="mt-2 text-sm text-slate-500">Đang tải...</div>}
        {systemQuery.isError && <div className="mt-2 text-sm text-rose-600">Không thể tải báo cáo hệ thống.</div>}
        {!systemQuery.isLoading && !systemQuery.isError && (
          <pre className="mt-3 overflow-auto rounded-xl bg-slate-900 p-4 text-xs text-slate-100">{systemJson}</pre>
        )}
      </Card>

      {classesQuery.data && classesQuery.data.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold">Chọn lớp nhanh</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {classesQuery.data.slice(0, 16).map((item) => (
              <button
                key={item.id}
                className="rounded-xl border border-sky-200 px-3 py-1 text-xs font-semibold text-slate-700"
                onClick={() => setClassId(item.id)}
              >
                {item.code}
              </button>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <h2 className="text-lg font-semibold">Báo cáo lớp học</h2>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <div className="flex-1">
            <FieldLabel htmlFor="classId">Class ID</FieldLabel>
            <Input id="classId" value={classId} onChange={(e) => setClassId(e.target.value)} placeholder="Nhập classId" />
          </div>
          <Button className="self-end">Tải báo cáo</Button>
        </div>

        {classQuery.isFetching && <div className="mt-2 text-sm text-slate-500">Đang tải...</div>}
        {classQuery.isError && <div className="mt-2 text-sm text-rose-600">Không thể tải báo cáo lớp.</div>}
        {!classQuery.isFetching && !classQuery.isError && classId && (
          <pre className="mt-3 overflow-auto rounded-xl bg-slate-900 p-4 text-xs text-slate-100">{classJson}</pre>
        )}
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">Hoạt động gần đây</h2>
        <div className="mt-3 divide-y divide-sky-50">
          {activityQuery.isLoading && <div className="py-2 text-sm text-slate-500">Đang tải...</div>}
          {activityQuery.isError && <div className="py-2 text-sm text-rose-600">Không thể tải hoạt động gần đây.</div>}
          {activityQuery.data?.slice(0, 20).map((item) => (
            <div key={item.id} className="py-2">
              <div className="text-sm font-semibold">{item.actorName}</div>
              <div className="text-sm text-slate-600">{item.message}</div>
              <div className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleString('vi-VN')}</div>
            </div>
          ))}
          {activityQuery.data && activityQuery.data.length === 0 && <div className="py-2 text-sm text-slate-500">Chưa có hoạt động.</div>}
        </div>
      </Card>
    </div>
  )
}

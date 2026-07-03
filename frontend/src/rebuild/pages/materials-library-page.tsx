import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Download, Eye, EyeOff, FileText, LinkIcon, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { api } from '../core/api'
import { EmptyState, ErrorState, FilterBar, PageHeader, PaginationControls, SearchInput, SkeletonCard, StatusBadge } from '../components/foundation'
import { StudentFileUpload } from '../components/student-file-upload'
import { Button, Card, FieldLabel, Input, TextArea } from '../layout/ui'
import { asPage, fmtDate } from './phase2-utils'
import type { ClassItem, FileItem, MaterialItem } from '../core/types'

type MaterialForm = {
  title: string
  description: string
  externalUrl: string
  visible: boolean
}

const emptyForm: MaterialForm = { title: '', description: '', externalUrl: '', visible: true }

function toForm(item: MaterialItem): MaterialForm {
  return {
    title: item.title,
    description: item.description ?? '',
    externalUrl: item.externalUrl ?? '',
    visible: item.visible,
  }
}

function MaterialEditor({
  classId,
  editing,
  onClose,
}: Readonly<{
  classId: string
  editing: MaterialItem | null
  onClose: () => void
}>) {
  const qc = useQueryClient()
  const [form, setForm] = useState<MaterialForm>(() => editing ? toForm(editing) : emptyForm)
  const [file, setFile] = useState<FileItem | null>(null)
  const isEditing = Boolean(editing)

  const create = useMutation({
    mutationFn: () => api.createMaterial(classId, { title: form.title.trim(), description: form.description.trim() || undefined, externalUrl: form.externalUrl.trim() || undefined, fileId: file?.id, visible: form.visible }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['materials-library', classId] })
      setForm(emptyForm)
      setFile(null)
      onClose()
    },
  })

  const update = useMutation({
    mutationFn: () => api.updateMaterial(editing!.id, { title: form.title.trim(), description: form.description.trim(), externalUrl: form.externalUrl.trim(), fileId: file?.id ?? editing?.fileId ?? undefined, visible: form.visible }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['materials-library', classId] })
      onClose()
    },
  })

  const pending = create.isPending || update.isPending
  const canSubmit = classId && form.title.trim() && (form.description.trim() || form.externalUrl.trim() || file?.id || editing?.fileId)

  return (
    <Card className="rounded-3xl bg-white/95">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-950">{isEditing ? 'Sửa tài liệu' : 'Thêm tài liệu'}</h2>
          <p className="mt-1 text-sm text-slate-500">Tạo tài liệu bằng tệp tải lên, liên kết ngoài hoặc mô tả văn bản.</p>
        </div>
        {isEditing && <Button type="button" variant="ghost" className="min-h-11" onClick={onClose}>Đóng</Button>}
      </div>

      <div className="space-y-4">
        <div>
          <FieldLabel htmlFor="material-title">Tiêu đề</FieldLabel>
          <Input id="material-title" value={form.title} onChange={(event) => setForm((value) => ({ ...value, title: event.target.value }))} placeholder="VD: Bài nghe TOPIK tuần 1" />
        </div>
        <div>
          <FieldLabel htmlFor="material-description">Mô tả</FieldLabel>
          <TextArea id="material-description" rows={4} value={form.description} onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))} placeholder="Ghi chú cách học, phạm vi sử dụng..." />
        </div>
        <div>
          <FieldLabel htmlFor="material-url">Liên kết ngoài</FieldLabel>
          <Input id="material-url" value={form.externalUrl} onChange={(event) => setForm((value) => ({ ...value, externalUrl: event.target.value }))} placeholder="https://..." />
        </div>
        <div>
          <FieldLabel htmlFor="material-file">Tệp đính kèm</FieldLabel>
          <StudentFileUpload value={file} onUploaded={setFile} disabled={pending} />
          {editing?.fileId && !file && <p className="mt-2 text-xs font-semibold text-slate-500">Đang giữ tệp hiện có. Tải tệp mới nếu muốn thay thế.</p>}
        </div>
        <label className="flex min-h-11 items-center gap-3 rounded-2xl border border-sky-100 bg-sky-50/50 px-4 text-sm font-bold text-slate-700">
          <input type="checkbox" checked={form.visible} onChange={(event) => setForm((value) => ({ ...value, visible: event.target.checked }))} className="h-4 w-4 rounded border-sky-200 text-indigo-600" />
          Hiển thị cho học viên
        </label>
        {(create.isError || update.isError) && <ErrorState title="Không lưu được tài liệu" description="Kiểm tra dữ liệu và thử lại." />}
        <Button type="button" className="min-h-11 w-full" disabled={!canSubmit || pending} onClick={() => isEditing ? update.mutate() : create.mutate()}>
          {isEditing ? 'Lưu thay đổi' : 'Tạo tài liệu'}
        </Button>
      </div>
    </Card>
  )
}

function MaterialCard({ item, classId, onEdit }: Readonly<{ item: MaterialItem; classId: string; onEdit: (item: MaterialItem) => void }>) {
  const qc = useQueryClient()
  const invalidate = async () => qc.invalidateQueries({ queryKey: ['materials-library', classId] })
  const remove = useMutation({ mutationFn: () => api.deleteMaterial(item.id), onSuccess: invalidate })
  const toggle = useMutation({ mutationFn: () => api.updateMaterialVisibility(item.id, !item.visible), onSuccess: invalidate })

  return (
    <Card className="rounded-3xl transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="line-clamp-2 text-lg font-black text-slate-950">{item.title}</h2>
            <StatusBadge value={item.visible ? 'VISIBLE' : 'HIDDEN'} />
          </div>
          <p className="mt-1 text-xs text-slate-500">Cập nhật {fmtDate(item.createdAt)}</p>
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{item.description || 'Chưa có mô tả cho tài liệu này.'}</p>
        </div>
        <div className="flex shrink-0 flex-row gap-2 sm:flex-col">
          <Button type="button" variant="secondary" className="min-h-11 px-3" onClick={() => onEdit(item)} aria-label="Sửa tài liệu"><Pencil size={16} /></Button>
          <Button type="button" variant="secondary" className="min-h-11 px-3" disabled={toggle.isPending} onClick={() => toggle.mutate()} aria-label="Đổi trạng thái hiển thị">{item.visible ? <EyeOff size={16} /> : <Eye size={16} />}</Button>
          <Button type="button" variant="ghost" className="min-h-11 px-3 text-rose-600 hover:bg-rose-50" disabled={remove.isPending} onClick={() => globalThis.confirm('Xoá tài liệu này?') && remove.mutate()} aria-label="Xoá tài liệu"><Trash2 size={16} /></Button>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {item.externalUrl && <a className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-sky-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-sky-50" href={item.externalUrl} target="_blank" rel="noreferrer"><LinkIcon size={16} />Mở liên kết</a>}
        {item.fileId && <Button type="button" variant="secondary" className="min-h-11" onClick={() => api.downloadFile(item.fileId!, item.title)}><Download size={16} />Tải xuống</Button>}
      </div>
    </Card>
  )
}

export function MaterialsLibraryPage() {
  const [classId, setClassId] = useState('')
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [showEditor, setShowEditor] = useState(false)
  const [editing, setEditing] = useState<MaterialItem | null>(null)

  const classes = useQuery({ queryKey: ['classes', 'materials-library'], queryFn: () => api.classes({ page: 0, size: 100 }), staleTime: 60_000 })
  const materials = useQuery({ queryKey: ['materials-library', classId, page, search], queryFn: () => api.materialsByClassPage(classId, { page, size: 12, search: search.trim() || undefined }), enabled: Boolean(classId) })
  const pageData = asPage(materials.data, page, 12)

  const classOptions = useMemo(() => classes.data ?? [], [classes.data])
  const selectedClass = classOptions.find((item: ClassItem) => item.id === classId)

  const openCreate = () => {
    setEditing(null)
    setShowEditor(true)
  }
  const openEdit = (item: MaterialItem) => {
    setEditing(item)
    setShowEditor(true)
  }

  return (
    <div className="space-y-5 pb-20 md:pb-0">
      <PageHeader
        eyebrow="자료실"
        title="Thư viện tài liệu"
        description="Quản lý tài liệu theo từng lớp, bao gồm tệp đính kèm, liên kết ngoài và trạng thái hiển thị cho học viên."
        actions={<Button type="button" className="min-h-11" disabled={!classId} onClick={openCreate}><Plus size={16} />Thêm tài liệu</Button>}
      />

      <FilterBar>
        <select className="min-h-11 rounded-2xl border border-sky-100 bg-white px-4 text-sm font-bold text-slate-600 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100" value={classId} onChange={(event) => { setClassId(event.target.value); setPage(0); setShowEditor(false); setEditing(null) }}>
          <option value="">Chọn lớp học</option>
          {classes.isLoading && <option>Đang tải lớp...</option>}
          {classOptions.map((item: ClassItem) => <option key={item.id} value={item.id}>{item.name} · {item.code}</option>)}
        </select>
        <div className="min-w-0 flex-1"><SearchInput value={search} onChange={(event) => { setSearch(event.target.value); setPage(0) }} placeholder="Tìm tiêu đề, mô tả tài liệu..." aria-label="Tìm tài liệu" /></div>
      </FilterBar>

      {classes.isError && <ErrorState title="Không tải được danh sách lớp" description="Admin chỉ nhìn thấy lớp được gán; vui lòng thử lại nếu danh sách trống bất thường." onRetry={() => classes.refetch()} />}
      {!classId && !classes.isLoading && <EmptyState title="Chọn lớp để quản lý tài liệu" description="Thư viện được phân quyền theo lớp. Teacher Owner và Class Admin chỉ thao tác trong phạm vi lớp của mình." action={<FileText className="mx-auto text-indigo-400" />} />}

      {classId && (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="space-y-4">
            <Card className="rounded-3xl bg-gradient-to-r from-indigo-50 to-sky-50">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-500">Lớp đang chọn</p>
                  <h2 className="mt-1 text-lg font-black text-slate-950">{selectedClass?.name ?? 'Lớp học'}</h2>
                </div>
                <div className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm font-black text-slate-700"><Search size={16} />{pageData.totalItems} tài liệu</div>
              </div>
            </Card>

            {materials.isLoading && <div className="space-y-3"><SkeletonCard lines={4} /><SkeletonCard lines={4} /></div>}
            {materials.isError && <ErrorState title="Không tải được tài liệu" description="Vui lòng thử lại sau ít phút." onRetry={() => materials.refetch()} />}
            {!materials.isLoading && !materials.isError && (pageData.items.length ? (
              <div className="space-y-3">
                {pageData.items.map((item) => <MaterialCard key={item.id} item={item} classId={classId} onEdit={openEdit} />)}
              </div>
            ) : (
              <EmptyState title="Chưa có tài liệu phù hợp" description="Tạo tài liệu đầu tiên hoặc thay đổi từ khoá tìm kiếm." action={<FileText className="mx-auto text-indigo-400" />} />
            ))}
            <PaginationControls page={pageData.page} totalPages={pageData.totalPages} onPageChange={setPage} />
          </div>

          <div className="xl:sticky xl:top-24 xl:self-start">
            {showEditor ? <MaterialEditor key={editing?.id ?? 'new'} classId={classId} editing={editing} onClose={() => { setShowEditor(false); setEditing(null) }} /> : (
              <Card className="rounded-3xl border-dashed bg-white/70 text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600"><Plus size={22} /></div>
                <h2 className="mt-3 text-lg font-black text-slate-950">Tạo hoặc sửa tài liệu</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">Bấm “Thêm tài liệu” hoặc biểu tượng sửa trên từng thẻ để mở form quản lý.</p>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

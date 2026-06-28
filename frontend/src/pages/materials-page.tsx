import { useParams } from 'react-router-dom'
import { useMaterials } from '../features/materials/hooks'

export function MaterialsPage() {
  const { classId = '' } = useParams()
  const { data } = useMaterials(classId)
  return <div>Tài liệu lớp {classId}: {data?.length ?? 0} tài liệu</div>
}

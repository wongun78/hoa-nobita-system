import { useParams } from 'react-router-dom'
import { useAssignments } from '../features/assignments/hooks'

export function ClassAssignmentsPage() {
  const { classId = '' } = useParams()
  const { data } = useAssignments(classId)
  return <div>Bài tập của lớp {classId}: {data?.length ?? 0} bài</div>
}

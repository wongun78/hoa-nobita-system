import { useSystemReport } from '../features/reports/hooks';
import { Card } from '../components/ui/card';
import { Users, BookOpen, FileText, CheckCircle, TrendingUp } from 'lucide-react';

export function ReportsPage() {
  const { data: report, isLoading, error } = useSystemReport();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Báo cáo hệ thống</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {['users', 'classes', 'assignments', 'submissions', 'average-score'].map((key) => (
            <div key={key} className="h-32 w-full animate-pulse rounded-xl bg-slate-200" />
          ))}
        </div>
        <div className="h-96 w-full animate-pulse rounded-xl bg-slate-200" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-destructive">Đã xảy ra lỗi khi tải báo cáo.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Báo cáo hệ thống</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Tổng số người dùng</h3>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <div className="text-2xl font-bold">{report.totalUsers}</div>
          </div>
        </Card>
        <Card>
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Tổng số lớp học</h3>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <div className="text-2xl font-bold">{report.totalClasses}</div>
          </div>
        </Card>
        <Card>
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Tổng số bài tập</h3>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <div className="text-2xl font-bold">{report.totalAssignments}</div>
          </div>
        </Card>
        <Card>
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Tổng số bài nộp</h3>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <div className="text-2xl font-bold">{report.totalSubmissions}</div>
          </div>
        </Card>
        <Card>
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Điểm trung bình</h3>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <div className="text-2xl font-bold">{report.averageScore.toFixed(2)}</div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="mb-4">
            <h2 className="font-semibold">Hiệu suất các lớp học</h2>
          </div>
          <div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 font-medium">Lớp học</th>
                  <th className="py-2 text-right font-medium">Học viên</th>
                  <th className="py-2 text-right font-medium">Tỷ lệ nộp bài</th>
                  <th className="py-2 text-right font-medium">Điểm TB</th>
                </tr>
              </thead>
              <tbody>
                {report.classPerformances.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-muted-foreground">
                      Chưa có dữ liệu
                    </td>
                  </tr>
                ) : (
                  report.classPerformances.map((cp) => (
                    <tr key={cp.classId} className="border-b last:border-0">
                      <td className="py-3 font-medium">{cp.className}</td>
                      <td className="py-3 text-right">{cp.studentCount}</td>
                      <td className="py-3 text-right">{cp.submissionRate.toFixed(1)}%</td>
                      <td className="py-3 text-right">{cp.averageScore.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <div className="mb-4">
            <h2 className="font-semibold">Top học viên xuất sắc</h2>
          </div>
          <div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 font-medium">Học viên</th>
                  <th className="py-2 text-right font-medium">Bài nộp</th>
                  <th className="py-2 text-right font-medium">Điểm TB</th>
                </tr>
              </thead>
              <tbody>
                {report.topStudents.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-muted-foreground">
                      Chưa có dữ liệu
                    </td>
                  </tr>
                ) : (
                  report.topStudents.map((student) => (
                    <tr key={student.userId} className="border-b last:border-0">
                      <td className="py-3">
                        <div className="font-medium">{student.fullName}</div>
                        <div className="text-xs text-muted-foreground">{student.email}</div>
                      </td>
                      <td className="py-3 text-right">{student.submissionCount}</td>
                      <td className="py-3 text-right font-bold text-primary">
                        {student.averageScore.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

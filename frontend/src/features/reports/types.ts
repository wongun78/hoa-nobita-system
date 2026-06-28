export interface ClassPerformanceDto {
  classId: string;
  className: string;
  studentCount: number;
  assignmentCount: number;
  averageScore: number;
  submissionRate: number;
}

export interface StudentPerformanceDto {
  userId: string;
  fullName: string;
  email: string;
  submissionCount: number;
  averageScore: number;
}

export interface AssignmentPerformanceDto {
  assignmentId: string;
  title: string;
  submissionCount: number;
  averageScore: number;
  passRate: number;
}

export interface SystemReportResponse {
  totalUsers: number;
  totalClasses: number;
  totalAssignments: number;
  totalSubmissions: number;
  averageScore: number;
  classPerformances: ClassPerformanceDto[];
  topStudents: StudentPerformanceDto[];
}

export interface ClassReportResponse {
  classId: string;
  className: string;
  totalStudents: number;
  totalAssignments: number;
  averageScore: number;
  submissionRate: number;
  studentPerformances: StudentPerformanceDto[];
  assignmentPerformances: AssignmentPerformanceDto[];
}

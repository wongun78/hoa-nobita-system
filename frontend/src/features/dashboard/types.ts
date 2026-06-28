export interface TeacherDashboardResponse {
  currentDate: string;
  greetingName: string;
  todayActionCount: number;
  activeClassCount: number;
  activeStudentCount: number;
  needGradingCount: number;
  overdueMissingSubmissionCount: number;
  kpi: {
    classes: { total: number; active: number; completed: number; draft: number; archived: number; upcoming: number };
    students: { total: number; active: number; suspended: number; inactive: number; newLast7Days: number; newLast30Days: number; unassigned: number };
    assignments: { total: number; draft: number; published: number; closed: number; dueSoon48h: number; overdue: number };
    submissions: { submitted: number; missing: number; late: number; needGrading: number; graded: number; resubmitRequested: number };
    grading: { waiting: number; averageScore: number; passRate: number; improvementRate: number };
    materials: { total: number; visible: number; hidden: number; newRecently: number };
    notifications: { sentLast7Days: number; globalCount: number; classCount: number };
  };
  charts: {
    classStatusChart: Array<{ status: string; count: number }>;
    submissionRateByClass: Array<{ classId: string; className: string; submitted: number; missing: number; late: number }>;
    needGradingByClass: Array<{ classId: string; className: string; count: number }>;
    averageScoreByClass: Array<{ classId: string; className: string; averageScore: number; maxScoreAverage: number }>;
    gradeDistribution: Array<{ range: string; count: number }>;
    assignmentWorkflow: Array<{ status: string; count: number }>;
  };
  todayTasks: Array<{ id: string; type: string; title: string; description: string; priority: string; targetUrl: string; ctaLabel: string }>;
  classHealth: Array<{ classId: string; className: string; studentCount: number; adminNames: string[]; openAssignmentCount: number; submissionRate: number; needGradingCount: number; averageScore: number; status: string; issues: string[]; actionUrl: string }>;
  assignmentsDueSoon: Array<{ assignmentId: string; title: string; classId: string; className: string; deadline: string; status: string; submittedCount: number; totalStudents: number; lateCount: number; needGradingCount: number; actionUrl: string }>;
  riskStudents: Array<{ studentId: string; fullName: string; email: string; phone: string; classId: string; className: string; submissionRate: number; averageScore: number; issue: string; riskLevel: string; actionUrl: string }>;
  recentActivity: Array<{ id: string; type: string; message: string; actorName: string; targetName: string; createdAt: string; targetUrl: string }>;
}

export interface AdminDashboardResponse {
  assignedClassCount: number;
  todayNeedGradingCount: number;
  dueSoonAssignmentCount: number;
  missingSubmissionCount: number;
  kpi: {
    classes: { assignedTotal: number; active: number };
    students: { totalInAssignedClasses: number; active: number; suspended: number };
    assignments: { published: number; closed: number; dueSoon48h: number; overdue: number };
    submissions: { submitted: number; missing: number; needGrading: number; late: number };
    scores: { averageScore: number; belowThresholdStudentCount: number };
  };
  charts: {
    submissionRateByAssignedClass: Array<{ classId: string; className: string; submitted: number; missing: number; late: number }>;
    needGradingByAssignedClass: Array<{ classId: string; className: string; count: number }>;
    averageScoreByAssignedClass: Array<{ classId: string; className: string; averageScore: number }>;
    activeSuspendedStudentRatio: Array<{ status: string; count: number }>;
    assignmentStatusInAssignedClasses: Array<{ status: string; count: number }>;
  };
  todayTasks: Array<{ id: string; type: string; title: string; description: string; priority: string; targetUrl: string; ctaLabel: string }>;
}

export interface StudentDashboardResponse {
  joinedClassCount: number;
  openAssignmentCount: number;
  dueSoonCount: number;
  submittedCount: number;
  gradedCount: number;
  resubmitRequestedCount: number;
  latestFeedback: { submissionId: string; assignmentId: string; assignmentTitle: string; score: number; feedback: string; gradedAt: string } | null;
  upcomingAssignments: Array<{ assignmentId: string; title: string; classId: string; className: string; deadline: string; status: string }>;
  recentMaterials: Array<{ materialId: string; title: string; classId: string; className: string; createdAt: string }>;
  notifications: Array<{ id: string; title: string; targetType: string; createdAt: string }>;
  ownSubmissionStats: { total: number; onTime: number; late: number; averageScore: number };
}

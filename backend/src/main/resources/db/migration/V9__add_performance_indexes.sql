-- V9__add_performance_indexes.sql
-- Add missing indexes for query performance

-- class_members.student_id: used by findClassIdsByStudentId() queries
-- The unique constraint uq_class_member_active(class_id, student_id) covers (class_id, student_id)
-- but not student_id alone — needed for "find all classes for a student" queries
CREATE INDEX IF NOT EXISTS idx_class_members_student_id ON class_members(student_id);

-- users.status: used for filtering active/inactive/suspended users
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status) WHERE deleted_at IS NULL;

-- classes.status: used for filtering active/completed/draft/archived classes
CREATE INDEX IF NOT EXISTS idx_classes_status ON classes(status) WHERE deleted_at IS NULL;

-- assignments.status: used for filtering published/draft/closed assignments
CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status) WHERE deleted_at IS NULL;

-- submissions.status: used for filtering submitted/graded/late submissions
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);

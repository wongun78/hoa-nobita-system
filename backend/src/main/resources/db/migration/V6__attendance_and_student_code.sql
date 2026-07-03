ALTER TABLE class_members
    ADD COLUMN IF NOT EXISTS student_code VARCHAR(50);

CREATE UNIQUE INDEX IF NOT EXISTS ux_class_members_class_student_code
    ON class_members(class_id, student_code)
    WHERE student_code IS NOT NULL;

CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID NOT NULL REFERENCES lessons(id),
    student_id UUID NOT NULL REFERENCES users(id),
    status VARCHAR(20) NOT NULL CHECK (status IN ('PRESENT', 'ABSENT', 'LATE')),
    note TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES users(id),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT ux_attendance_lesson_student UNIQUE (lesson_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_attendance_lesson_id ON attendance(lesson_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);

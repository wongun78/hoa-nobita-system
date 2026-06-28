-- V1__init_schema.sql
-- Core database schema for Hoà Nobita TOPIK Platform

-- Roles
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL
);

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    first_login BOOLEAN NOT NULL DEFAULT TRUE,
    avatar_url TEXT,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT chk_user_contact CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

-- User Roles
CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES users(id),
    role_id UUID NOT NULL REFERENCES roles(id),
    PRIMARY KEY (user_id, role_id)
);

-- Classes
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    level_from INT,
    level_to INT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    teacher_id UUID NOT NULL REFERENCES users(id),
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT chk_class_level CHECK (level_from IS NULL OR level_to IS NULL OR level_from <= level_to)
);

-- Class Admins
CREATE TABLE class_admins (
    class_id UUID NOT NULL REFERENCES classes(id),
    admin_id UUID NOT NULL REFERENCES users(id),
    PRIMARY KEY (class_id, admin_id)
);

-- Class Members
CREATE TABLE class_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES classes(id),
    student_id UUID NOT NULL REFERENCES users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    removed_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uq_class_member_active UNIQUE (class_id, student_id)
);

-- Lessons
CREATE TABLE lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES classes(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    lesson_date DATE,
    order_index INT DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Files
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_file_name VARCHAR(500) NOT NULL,
    stored_file_name VARCHAR(500) NOT NULL,
    file_key TEXT NOT NULL,
    file_url TEXT,
    file_size BIGINT,
    content_type VARCHAR(255),
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Materials
CREATE TABLE materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES classes(id),
    lesson_id UUID REFERENCES lessons(id),
    file_id UUID REFERENCES files(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    external_url TEXT,
    visible BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Assignments
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES classes(id),
    lesson_id UUID REFERENCES lessons(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instruction TEXT,
    due_at TIMESTAMP WITH TIME ZONE,
    max_score NUMERIC(5,2) NOT NULL DEFAULT 10,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    allow_resubmit BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT chk_max_score_positive CHECK (max_score > 0)
);

-- Submissions
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id),
    student_id UUID NOT NULL REFERENCES users(id),
    content_text TEXT,
    content_url TEXT,
    file_id UUID REFERENCES files(id),
    status VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED',
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Grades
CREATE TABLE grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES submissions(id),
    score NUMERIC(5,2) NOT NULL,
    feedback TEXT,
    graded_by UUID NOT NULL REFERENCES users(id),
    graded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_score_non_negative CHECK (score >= 0)
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    target_type VARCHAR(20) NOT NULL,
    target_id UUID,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_phone ON users(phone) WHERE deleted_at IS NULL;
CREATE INDEX idx_classes_code ON classes(code) WHERE deleted_at IS NULL;
CREATE INDEX idx_classes_teacher ON classes(teacher_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_lessons_class ON lessons(class_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_materials_class ON materials(class_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_assignments_class ON assignments(class_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_submissions_assignment ON submissions(assignment_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_submissions_student ON submissions(student_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_grades_submission ON grades(submission_id);
CREATE INDEX idx_notifications_target ON notifications(target_type, target_id);

-- Assignment enhancements: skill, file attachment, external link
ALTER TABLE assignments
    ADD COLUMN IF NOT EXISTS skill TEXT,
    ADD COLUMN IF NOT EXISTS file_id UUID REFERENCES files(id),
    ADD COLUMN IF NOT EXISTS external_link TEXT;

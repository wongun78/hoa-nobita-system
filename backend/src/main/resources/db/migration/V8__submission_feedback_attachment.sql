-- Feedback attachments on submissions
ALTER TABLE submissions
    ADD COLUMN IF NOT EXISTS feedback_file_id UUID REFERENCES files(id),
    ADD COLUMN IF NOT EXISTS feedback_link TEXT;

-- Add file_ids column to support multiple file attachments per assignment
ALTER TABLE assignments ADD COLUMN file_ids TEXT;

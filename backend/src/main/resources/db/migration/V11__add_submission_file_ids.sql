-- Add file_ids column to support multiple file attachments per submission
ALTER TABLE submissions ADD COLUMN file_ids TEXT;

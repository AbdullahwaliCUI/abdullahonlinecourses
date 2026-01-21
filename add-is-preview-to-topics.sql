-- Add is_preview column to topics table
ALTER TABLE topics 
ADD COLUMN is_preview BOOLEAN DEFAULT FALSE;

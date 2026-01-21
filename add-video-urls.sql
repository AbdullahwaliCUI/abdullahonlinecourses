-- Add admin_video_url and document_url to videos table
ALTER TABLE videos ADD COLUMN IF NOT EXISTS admin_video_url text;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS document_url text;

-- Make youtube_url nullable since we might have admin_video_url instead
ALTER TABLE videos ALTER COLUMN youtube_url DROP NOT NULL;

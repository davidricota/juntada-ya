-- Modify playlist_items table to use user_id
ALTER TABLE playlist_items
  DROP COLUMN IF EXISTS added_by_participant_id,
  ADD COLUMN IF NOT EXISTS added_by_user_id UUID REFERENCES users(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_playlist_items_added_by_user_id ON playlist_items(added_by_user_id); 
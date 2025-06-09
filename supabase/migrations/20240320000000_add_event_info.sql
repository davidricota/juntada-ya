-- Add new columns to events table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS date DATE,
ADD COLUMN IF NOT EXISTS time TIME,
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Create custom configuration parameter
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_settings WHERE name = 'app.current_user_id'
  ) THEN
    ALTER DATABASE postgres SET app.current_user_id TO '';
  END IF;
END $$;

-- Add policy for updating events
CREATE POLICY "Hosts can update their own events"
ON events
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = events.host_user_id
    AND users.id = current_setting('app.current_user_id')::uuid
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = events.host_user_id
    AND users.id = current_setting('app.current_user_id')::uuid
  )
); 
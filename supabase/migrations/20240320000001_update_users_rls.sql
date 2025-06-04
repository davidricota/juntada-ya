-- Drop existing policies
DROP POLICY IF EXISTS "Users can read their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Users can insert their own data" ON users;

-- Remove whatsapp_number column and add whatsapp_hash
ALTER TABLE users
    DROP COLUMN IF EXISTS whatsapp_number,
    ADD COLUMN IF NOT EXISTS whatsapp_hash TEXT UNIQUE;

-- Modify events table to use host_user_id
ALTER TABLE events 
    DROP COLUMN IF EXISTS host_id,
    ADD COLUMN IF NOT EXISTS host_user_id UUID REFERENCES users(id);

-- Modify event_participants table to use user_id
ALTER TABLE event_participants 
    DROP COLUMN IF EXISTS whatsapp_number,
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);

-- Create new policies
-- Allow anyone to read user data (needed for authentication)
CREATE POLICY "Anyone can read user data" ON users
    FOR SELECT
    USING (true);

-- Allow users to update their own data
CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE
    USING (whatsapp_hash = current_user);

-- Allow anyone to insert new users (needed for registration)
CREATE POLICY "Anyone can insert new users" ON users
    FOR INSERT
    WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_whatsapp_hash ON users(whatsapp_hash);
CREATE INDEX IF NOT EXISTS idx_events_host_user ON events(host_user_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_user ON event_participants(user_id); 
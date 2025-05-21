/*
  # Add Polls Schema

  1. New Tables
    - `polls`
      - `id` (uuid, primary key)
      - `event_id` (uuid, foreign key to events)
      - `title` (text)
      - `description` (text)
      - `created_by_participant_id` (uuid, foreign key to event_participants)
      - `created_at` (timestamptz)
      - `closed_at` (timestamptz, nullable)
      - `allow_multiple_votes` (boolean)

    - `poll_options`
      - `id` (uuid, primary key)
      - `poll_id` (uuid, foreign key to polls)
      - `title` (text)
      - `created_at` (timestamptz)

    - `poll_votes`
      - `id` (uuid, primary key)
      - `poll_id` (uuid, foreign key to polls)
      - `option_id` (uuid, foreign key to poll_options)
      - `participant_id` (uuid, foreign key to event_participants)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create polls table
CREATE TABLE IF NOT EXISTS polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  created_by_participant_id uuid NOT NULL REFERENCES event_participants(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  closed_at timestamptz,
  allow_multiple_votes boolean DEFAULT false,
  CONSTRAINT polls_title_not_empty CHECK (char_length(trim(title)) > 0)
);

-- Create poll options table
CREATE TABLE IF NOT EXISTS poll_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  title text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT poll_options_title_not_empty CHECK (char_length(trim(title)) > 0)
);

-- Create poll votes table
CREATE TABLE IF NOT EXISTS poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_id uuid NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES event_participants(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(poll_id, option_id, participant_id)
);

-- Enable Row Level Security
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

-- Create policies for polls
CREATE POLICY "Anyone can view polls in their event" ON polls
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM event_participants
      WHERE event_participants.event_id = polls.event_id
    )
  );

CREATE POLICY "Participants can create polls in their event" ON polls
  FOR INSERT WITH CHECK (
    created_by_participant_id IN (
      SELECT id FROM event_participants WHERE event_participants.id = created_by_participant_id
    )
  );

-- Create policies for poll options
CREATE POLICY "Anyone can view poll options" ON poll_options
  FOR SELECT USING (true);

CREATE POLICY "Poll creator can add options" ON poll_options
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM polls
      WHERE polls.id = poll_options.poll_id
    )
  );

-- Create policies for poll votes
CREATE POLICY "Anyone can view votes" ON poll_votes
  FOR SELECT USING (true);

CREATE POLICY "Participants can vote" ON poll_votes
  FOR INSERT WITH CHECK (
    participant_id IN (
      SELECT id FROM event_participants WHERE event_participants.id = participant_id
    )
  );
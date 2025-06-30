-- Enable RLS on poll_votes table if not already enabled
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

-- Policy to allow participants to insert votes
CREATE POLICY "Participants can insert their own votes"
ON poll_votes
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM event_participants ep
    WHERE ep.id = poll_votes.participant_id
    AND ep.event_id = (
      SELECT event_id FROM polls WHERE id = poll_votes.poll_id
    )
  )
);

-- Policy to allow participants to update their own votes
CREATE POLICY "Participants can update their own votes"
ON poll_votes
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM event_participants ep
    WHERE ep.id = poll_votes.participant_id
    AND ep.event_id = (
      SELECT event_id FROM polls WHERE id = poll_votes.poll_id
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM event_participants ep
    WHERE ep.id = poll_votes.participant_id
    AND ep.event_id = (
      SELECT event_id FROM polls WHERE id = poll_votes.poll_id
    )
  )
);

-- Policy to allow participants to delete their own votes
CREATE POLICY "Participants can delete their own votes"
ON poll_votes
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM event_participants ep
    WHERE ep.id = poll_votes.participant_id
    AND ep.event_id = (
      SELECT event_id FROM polls WHERE id = poll_votes.poll_id
    )
  )
);

-- Policy to allow participants to view votes for polls they're part of
CREATE POLICY "Participants can view votes for their polls"
ON poll_votes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM event_participants ep
    WHERE ep.event_id = (
      SELECT event_id FROM polls WHERE id = poll_votes.poll_id
    )
  )
); 
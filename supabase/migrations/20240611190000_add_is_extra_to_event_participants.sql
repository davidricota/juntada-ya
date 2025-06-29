-- Permitir nulos en user_id y whatsapp
ALTER TABLE event_participants
  ALTER COLUMN user_id DROP NOT NULL,
  ALTER COLUMN whatsapp DROP NOT NULL;

-- Agregar campo para marcar si es extra
ALTER TABLE event_participants
  ADD COLUMN IF NOT EXISTS is_extra BOOLEAN DEFAULT FALSE; 
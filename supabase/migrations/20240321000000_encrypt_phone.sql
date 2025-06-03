-- Modificar la columna whatsapp_number para que acepte tokens JWT
ALTER TABLE event_participants ALTER COLUMN whatsapp_number TYPE text; 
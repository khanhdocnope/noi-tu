-- Add rest fields to pets
ALTER TABLE pets ADD COLUMN rest_start TIMESTAMPTZ;
ALTER TABLE pets ADD COLUMN rest_duration INTEGER DEFAULT 0;

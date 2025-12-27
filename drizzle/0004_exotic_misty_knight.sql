ALTER TABLE settings ADD COLUMN is_adult_verified integer DEFAULT 0 NOT NULL;
ALTER TABLE settings ADD COLUMN tos_accepted_at integer;

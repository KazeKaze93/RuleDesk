ALTER TABLE artists ADD COLUMN sync_status text NOT NULL DEFAULT 'idle';
ALTER TABLE artists ADD COLUMN last_error text;

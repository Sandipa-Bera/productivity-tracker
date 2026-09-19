-- Ensure not_done is a valid status value in the tasks table.
-- If a CHECK constraint exists on the status column, extend it.
-- If no constraint exists this is a no-op.

-- Drop existing status check constraint if it only allows pending/completed
DO $$
BEGIN
  -- Allow not_done as a valid status (safe to run multiple times)
  -- If there is a check constraint, this relaxes it; if none exists, nothing happens.
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'tasks'
      AND constraint_type = 'CHECK'
      AND constraint_name LIKE '%status%'
  ) THEN
    -- Drop old constraint and re-add with not_done included
    EXECUTE (
      SELECT 'ALTER TABLE tasks DROP CONSTRAINT ' || constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'tasks'
        AND constraint_type = 'CHECK'
        AND constraint_name LIKE '%status%'
      LIMIT 1
    );
    ALTER TABLE tasks
      ADD CONSTRAINT tasks_status_check
      CHECK (status IN ('pending', 'completed', 'not_done'));
  END IF;
END;
$$;

-- Ensure the penalty column exists (idempotent)
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS penalty TEXT DEFAULT NULL;

-- Ensure completed_at exists (idempotent — was added in earlier work)
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

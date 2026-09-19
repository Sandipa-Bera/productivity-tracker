-- Add penalty column to tasks table
-- This allows users to set a consequence/punishment for failing to complete a task

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS penalty TEXT DEFAULT NULL;

COMMENT ON COLUMN tasks.penalty IS
  'Optional user-defined penalty or consequence if the task is not completed (e.g. "No gaming tonight", "20 push-ups").';

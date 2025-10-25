-- Add candidate engagement tracking fields to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS candidates_completed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_candidates INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS completion_percentage INTEGER GENERATED ALWAYS AS (
  CASE 
    WHEN total_candidates > 0 THEN (candidates_completed * 100 / total_candidates)
    ELSE 0
  END
) STORED;

-- Enable realtime for projects table
ALTER PUBLICATION supabase_realtime ADD TABLE projects;
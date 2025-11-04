-- Fix the valid_dimension constraint to match actual dimension names
ALTER TABLE public.archetypes DROP CONSTRAINT IF EXISTS valid_dimension;

ALTER TABLE public.archetypes ADD CONSTRAINT valid_dimension 
CHECK (dimension IN (
  'Cognitive',
  'Execution', 
  'Communication & Collaboration',
  'Adaptability & Learning Agility',
  'Emotional Intelligence',
  'Judgment & Ethics'
));
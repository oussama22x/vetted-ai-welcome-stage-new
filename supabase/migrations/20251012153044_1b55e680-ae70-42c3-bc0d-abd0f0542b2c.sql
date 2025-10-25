-- Create admin whitelist table
CREATE TABLE admin_whitelist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  added_by uuid REFERENCES auth.users(id),
  added_at timestamp with time zone DEFAULT now(),
  notes text
);

-- Enable RLS
ALTER TABLE admin_whitelist ENABLE ROW LEVEL SECURITY;

-- Only existing admins can view/manage the whitelist
CREATE POLICY "Admins can manage whitelist"
ON admin_whitelist
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Insert initial whitelist
INSERT INTO admin_whitelist (email, notes) VALUES
  ('tobi@venturefor.africa', 'Founder - Initial setup'),
  ('lemuel@africaproductpeers.org', 'Team member - Initial setup');
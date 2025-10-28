-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create notification_log table to track notification attempts
CREATE TABLE public.notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  notification_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  request_id bigint,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_notification_log_project ON notification_log(project_id);
CREATE INDEX idx_notification_log_status ON notification_log(status);

-- Enable RLS on notification_log
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notification_log
CREATE POLICY "Admins can view notification logs"
  ON notification_log FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Recruiters can view own notification logs"
  ON notification_log FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN recruiters r ON p.recruiter_id = r.id
      WHERE r.user_id = auth.uid()
    )
  );

-- Create the trigger function
CREATE OR REPLACE FUNCTION notify_sourcing_request_trigger()
RETURNS TRIGGER AS $$
DECLARE
  request_id bigint;
  log_id uuid;
  function_url text;
BEGIN
  -- Only proceed if status changed to 'awaiting_network_match'
  IF OLD.status IS DISTINCT FROM NEW.status 
     AND NEW.status = 'awaiting_network_match' THEN
    
    -- Build the function URL
    function_url := 'https://jnazyoirpxxybqparypd.supabase.co/functions/v1/fn_notify_sourcing_request';
    
    -- Log the notification attempt
    INSERT INTO public.notification_log (
      project_id,
      notification_type,
      status
    )
    VALUES (
      NEW.id,
      'sourcing_request',
      'pending'
    )
    RETURNING id INTO log_id;
    
    -- Make async HTTP request to edge function (no auth needed - function is public)
    SELECT INTO request_id
      net.http_post(
        url := function_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json'
        ),
        body := jsonb_build_object(
          'type', 'UPDATE',
          'table', 'projects',
          'record', row_to_json(NEW)::jsonb,
          'old_record', row_to_json(OLD)::jsonb
        )
      );
    
    -- Update log with request_id
    UPDATE public.notification_log
    SET request_id = request_id
    WHERE id = log_id;
    
    RAISE LOG 'Triggered fn_notify_sourcing_request for project %, log_id: %, request_id: %', 
              NEW.id, log_id, request_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create the trigger
DROP TRIGGER IF EXISTS on_project_awaiting_network_match ON projects;
CREATE TRIGGER on_project_awaiting_network_match
  AFTER UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION notify_sourcing_request_trigger();
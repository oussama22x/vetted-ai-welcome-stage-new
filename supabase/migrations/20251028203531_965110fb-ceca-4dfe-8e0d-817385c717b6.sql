-- Fix null URL error by hardcoding the Supabase project URL
DROP TRIGGER IF EXISTS on_project_awaiting_network_match ON projects;
DROP FUNCTION IF EXISTS notify_sourcing_request_trigger();

CREATE OR REPLACE FUNCTION public.notify_sourcing_request_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_request_id bigint;
  log_id uuid;
  function_url text;
BEGIN
  -- Only proceed if status changed to 'awaiting_network_match'
  IF OLD.status IS DISTINCT FROM NEW.status 
     AND NEW.status = 'awaiting_network_match' THEN
    
    -- Build the function URL (hardcoded for reliability)
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
    SELECT INTO v_request_id
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
    SET request_id = v_request_id
    WHERE id = log_id;
    
    RAISE LOG 'Triggered fn_notify_sourcing_request for project %, log_id: %, request_id: %', 
              NEW.id, log_id, v_request_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Recreate the trigger
CREATE TRIGGER on_project_awaiting_network_match
  AFTER UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION notify_sourcing_request_trigger();
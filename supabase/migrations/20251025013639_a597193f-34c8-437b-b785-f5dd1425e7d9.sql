-- Fix RLS policies for admin_whitelist
CREATE POLICY "Only admins can view whitelist"
ON public.admin_whitelist FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can insert to whitelist"
ON public.admin_whitelist FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete from whitelist"
ON public.admin_whitelist FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Fix search_path for update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
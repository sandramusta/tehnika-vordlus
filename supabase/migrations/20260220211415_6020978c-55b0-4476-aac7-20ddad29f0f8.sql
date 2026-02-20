
-- Create user_activity_logs table
CREATE TABLE public.user_activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for fast queries
CREATE INDEX idx_activity_logs_user_id ON public.user_activity_logs (user_id);
CREATE INDEX idx_activity_logs_action_type ON public.user_activity_logs (action_type);
CREATE INDEX idx_activity_logs_created_at ON public.user_activity_logs (created_at DESC);

-- Enable RLS
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Users can insert their own activity logs
CREATE POLICY "Users can insert own activity logs"
  ON public.user_activity_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Only product_managers and admins can read all logs (for stats)
CREATE POLICY "Managers and admins can read all activity logs"
  ON public.user_activity_logs FOR SELECT
  USING (public.has_any_role(auth.uid(), ARRAY['product_manager', 'admin']::app_role[]));

-- Admins can delete logs (cleanup)
CREATE POLICY "Admins can delete activity logs"
  ON public.user_activity_logs FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

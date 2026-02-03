-- Create staff_users table for company employees
CREATE TABLE public.staff_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.staff_users ENABLE ROW LEVEL SECURITY;

-- Allow all operations (no auth yet)
CREATE POLICY "Allow all operations on staff_users"
  ON public.staff_users
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public read for staff_users"
  ON public.staff_users
  FOR SELECT
  USING (true);
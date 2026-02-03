-- Create role enum
CREATE TYPE public.app_role AS ENUM ('user', 'product_manager', 'admin');

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user has any of the specified roles
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid, _roles app_role[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = ANY(_roles)
  )
$$;

-- user_roles policies - only admins can manage roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Update staff_users RLS to require product_manager or admin role
DROP POLICY IF EXISTS "Allow all operations on staff_users" ON public.staff_users;
DROP POLICY IF EXISTS "Allow public read for staff_users" ON public.staff_users;

CREATE POLICY "Anyone can read staff_users"
  ON public.staff_users FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage staff_users"
  ON public.staff_users FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Update equipment RLS to allow product_managers and admins to edit
DROP POLICY IF EXISTS "Allow all for equipment" ON public.equipment;
DROP POLICY IF EXISTS "Allow public read for equipment" ON public.equipment;

CREATE POLICY "Anyone can read equipment"
  ON public.equipment FOR SELECT
  USING (true);

CREATE POLICY "Product managers and admins can manage equipment"
  ON public.equipment FOR ALL
  USING (public.has_any_role(auth.uid(), ARRAY['product_manager', 'admin']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['product_manager', 'admin']::app_role[]));

-- Update competitive_arguments RLS
DROP POLICY IF EXISTS "Allow all for competitive_arguments" ON public.competitive_arguments;
DROP POLICY IF EXISTS "Allow public read for competitive_arguments" ON public.competitive_arguments;

CREATE POLICY "Anyone can read competitive_arguments"
  ON public.competitive_arguments FOR SELECT
  USING (true);

CREATE POLICY "Product managers and admins can manage competitive_arguments"
  ON public.competitive_arguments FOR ALL
  USING (public.has_any_role(auth.uid(), ARRAY['product_manager', 'admin']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['product_manager', 'admin']::app_role[]));

-- Update myths RLS
DROP POLICY IF EXISTS "Allow all for myths" ON public.myths;
DROP POLICY IF EXISTS "Allow public read for myths" ON public.myths;

CREATE POLICY "Anyone can read myths"
  ON public.myths FOR SELECT
  USING (true);

CREATE POLICY "Product managers and admins can manage myths"
  ON public.myths FOR ALL
  USING (public.has_any_role(auth.uid(), ARRAY['product_manager', 'admin']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['product_manager', 'admin']::app_role[]));

-- Update brands RLS
DROP POLICY IF EXISTS "Allow all for brands" ON public.brands;
DROP POLICY IF EXISTS "Allow public read for brands" ON public.brands;

CREATE POLICY "Anyone can read brands"
  ON public.brands FOR SELECT
  USING (true);

CREATE POLICY "Product managers and admins can manage brands"
  ON public.brands FOR ALL
  USING (public.has_any_role(auth.uid(), ARRAY['product_manager', 'admin']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['product_manager', 'admin']::app_role[]));

-- Update equipment_types RLS
DROP POLICY IF EXISTS "Allow all for equipment_types" ON public.equipment_types;
DROP POLICY IF EXISTS "Allow public read for equipment_types" ON public.equipment_types;

CREATE POLICY "Anyone can read equipment_types"
  ON public.equipment_types FOR SELECT
  USING (true);

CREATE POLICY "Product managers and admins can manage equipment_types"
  ON public.equipment_types FOR ALL
  USING (public.has_any_role(auth.uid(), ARRAY['product_manager', 'admin']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['product_manager', 'admin']::app_role[]));

-- Update power_classes RLS
DROP POLICY IF EXISTS "Allow all for power_classes" ON public.power_classes;
DROP POLICY IF EXISTS "Allow public read for power_classes" ON public.power_classes;

CREATE POLICY "Anyone can read power_classes"
  ON public.power_classes FOR SELECT
  USING (true);

CREATE POLICY "Product managers and admins can manage power_classes"
  ON public.power_classes FOR ALL
  USING (public.has_any_role(auth.uid(), ARRAY['product_manager', 'admin']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['product_manager', 'admin']::app_role[]));

-- Update equipment_brochures RLS
DROP POLICY IF EXISTS "Allow all for equipment_brochures" ON public.equipment_brochures;
DROP POLICY IF EXISTS "Allow public read for equipment_brochures" ON public.equipment_brochures;

CREATE POLICY "Anyone can read equipment_brochures"
  ON public.equipment_brochures FOR SELECT
  USING (true);

CREATE POLICY "Product managers and admins can manage equipment_brochures"
  ON public.equipment_brochures FOR ALL
  USING (public.has_any_role(auth.uid(), ARRAY['product_manager', 'admin']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['product_manager', 'admin']::app_role[]));

-- Update spec_labels RLS
DROP POLICY IF EXISTS "Allow all for spec_labels" ON public.spec_labels;
DROP POLICY IF EXISTS "Allow public read for spec_labels" ON public.spec_labels;

CREATE POLICY "Anyone can read spec_labels"
  ON public.spec_labels FOR SELECT
  USING (true);

CREATE POLICY "Product managers and admins can manage spec_labels"
  ON public.spec_labels FOR ALL
  USING (public.has_any_role(auth.uid(), ARRAY['product_manager', 'admin']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['product_manager', 'admin']::app_role[]));

-- Update work_documentation RLS
DROP POLICY IF EXISTS "Allow all for work_documentation" ON public.work_documentation;
DROP POLICY IF EXISTS "Allow public read for work_documentation" ON public.work_documentation;

CREATE POLICY "Anyone can read work_documentation"
  ON public.work_documentation FOR SELECT
  USING (true);

CREATE POLICY "Product managers and admins can manage work_documentation"
  ON public.work_documentation FOR ALL
  USING (public.has_any_role(auth.uid(), ARRAY['product_manager', 'admin']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['product_manager', 'admin']::app_role[]));

-- Create trigger for updating profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
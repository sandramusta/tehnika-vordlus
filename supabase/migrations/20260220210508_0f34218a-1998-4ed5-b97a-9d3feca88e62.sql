
-- Fix 1: Restrict storage bucket write operations to product_manager/admin roles
DROP POLICY IF EXISTS "Anyone can upload equipment images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update equipment images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete equipment images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload brochures" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update brochures" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete brochures" ON storage.objects;

CREATE POLICY "Product managers can upload equipment images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'equipment-images' AND 
  public.has_any_role(auth.uid(), ARRAY['product_manager', 'admin']::app_role[])
);

CREATE POLICY "Product managers can update equipment images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'equipment-images' AND 
  public.has_any_role(auth.uid(), ARRAY['product_manager', 'admin']::app_role[])
);

CREATE POLICY "Product managers can delete equipment images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'equipment-images' AND 
  public.has_any_role(auth.uid(), ARRAY['product_manager', 'admin']::app_role[])
);

CREATE POLICY "Product managers can upload brochures"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'equipment-brochures' AND 
  public.has_any_role(auth.uid(), ARRAY['product_manager', 'admin']::app_role[])
);

CREATE POLICY "Product managers can update brochures"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'equipment-brochures' AND 
  public.has_any_role(auth.uid(), ARRAY['product_manager', 'admin']::app_role[])
);

CREATE POLICY "Product managers can delete brochures"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'equipment-brochures' AND 
  public.has_any_role(auth.uid(), ARRAY['product_manager', 'admin']::app_role[])
);

-- Fix 2: Restrict staff_users read to authenticated users only
DROP POLICY IF EXISTS "Anyone can read staff_users" ON public.staff_users;
CREATE POLICY "Authenticated users can read staff_users"
  ON public.staff_users FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Fix 3: Restrict work_documentation read to product_managers and admins
DROP POLICY IF EXISTS "Anyone can read work_documentation" ON public.work_documentation;
CREATE POLICY "Product managers can read work_documentation"
  ON public.work_documentation FOR SELECT
  USING (public.has_any_role(auth.uid(), ARRAY['product_manager', 'admin']::app_role[]));

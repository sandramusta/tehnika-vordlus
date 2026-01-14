-- Create storage bucket for equipment images
INSERT INTO storage.buckets (id, name, public)
VALUES ('equipment-images', 'equipment-images', true);

-- Allow anyone to view equipment images (public bucket)
CREATE POLICY "Equipment images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'equipment-images');

-- Allow anyone to upload equipment images (for admin use - can be restricted later)
CREATE POLICY "Anyone can upload equipment images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'equipment-images');

-- Allow anyone to update equipment images
CREATE POLICY "Anyone can update equipment images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'equipment-images');

-- Allow anyone to delete equipment images
CREATE POLICY "Anyone can delete equipment images"
ON storage.objects FOR DELETE
USING (bucket_id = 'equipment-images');
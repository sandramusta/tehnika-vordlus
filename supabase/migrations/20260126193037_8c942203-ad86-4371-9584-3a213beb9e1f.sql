-- Create storage bucket for brochures
INSERT INTO storage.buckets (id, name, public) 
VALUES ('equipment-brochures', 'equipment-brochures', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to brochures
CREATE POLICY "Brochures are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'equipment-brochures');

-- Allow anyone to upload brochures (in production, this should be restricted to authenticated admins)
CREATE POLICY "Anyone can upload brochures" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'equipment-brochures');

CREATE POLICY "Anyone can update brochures" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'equipment-brochures');

CREATE POLICY "Anyone can delete brochures" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'equipment-brochures');

-- Create table to track brochure uploads and extracted data
CREATE TABLE public.equipment_brochures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  brochure_url TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  extracted_data JSONB DEFAULT NULL,
  extraction_status TEXT NOT NULL DEFAULT 'pending' CHECK (extraction_status IN ('pending', 'processing', 'completed', 'failed')),
  extraction_error TEXT DEFAULT NULL,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.equipment_brochures ENABLE ROW LEVEL SECURITY;

-- RLS policies for brochures table
CREATE POLICY "Allow public read for equipment_brochures" 
ON public.equipment_brochures 
FOR SELECT 
USING (true);

CREATE POLICY "Allow all for equipment_brochures" 
ON public.equipment_brochures 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_equipment_brochures_updated_at
BEFORE UPDATE ON public.equipment_brochures
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_equipment_brochures_equipment_id ON public.equipment_brochures(equipment_id);
CREATE INDEX idx_equipment_brochures_status ON public.equipment_brochures(extraction_status);
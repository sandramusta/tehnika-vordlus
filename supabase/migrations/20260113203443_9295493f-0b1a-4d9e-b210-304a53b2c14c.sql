-- Create equipment types table (for future extensibility: combines, tractors, etc.)
CREATE TABLE public.equipment_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  name_et TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create brands table
CREATE TABLE public.brands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create power classes table
CREATE TABLE public.power_classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  min_hp INTEGER NOT NULL,
  max_hp INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create combines/equipment table
CREATE TABLE public.equipment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_type_id UUID NOT NULL REFERENCES public.equipment_types(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  power_class_id UUID REFERENCES public.power_classes(id),
  model_name TEXT NOT NULL,
  engine_power_hp INTEGER,
  grain_tank_liters INTEGER,
  header_width_m NUMERIC(4,2),
  weight_kg INTEGER,
  fuel_consumption_lh NUMERIC(4,1),
  price_eur INTEGER,
  annual_maintenance_eur INTEGER,
  expected_lifespan_years INTEGER DEFAULT 10,
  features JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create competitive arguments table
CREATE TABLE public.competitive_arguments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competitor_brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  equipment_type_id UUID NOT NULL REFERENCES public.equipment_types(id) ON DELETE CASCADE,
  argument_title TEXT NOT NULL,
  argument_description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create work documentation table
CREATE TABLE public.work_documentation (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  work_date DATE NOT NULL DEFAULT CURRENT_DATE,
  work_type TEXT NOT NULL,
  hours_worked NUMERIC(6,2),
  area_hectares NUMERIC(8,2),
  fuel_used_liters NUMERIC(8,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables (but allow public read for this internal app)
ALTER TABLE public.equipment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.power_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitive_arguments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_documentation ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (internal app)
CREATE POLICY "Allow public read for equipment_types" ON public.equipment_types FOR SELECT USING (true);
CREATE POLICY "Allow public read for brands" ON public.brands FOR SELECT USING (true);
CREATE POLICY "Allow public read for power_classes" ON public.power_classes FOR SELECT USING (true);
CREATE POLICY "Allow public read for equipment" ON public.equipment FOR SELECT USING (true);
CREATE POLICY "Allow public read for competitive_arguments" ON public.competitive_arguments FOR SELECT USING (true);
CREATE POLICY "Allow public read for work_documentation" ON public.work_documentation FOR SELECT USING (true);

-- Allow all operations for internal app (no auth required for internal tool)
CREATE POLICY "Allow all for equipment_types" ON public.equipment_types FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for brands" ON public.brands FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for power_classes" ON public.power_classes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for equipment" ON public.equipment FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for competitive_arguments" ON public.competitive_arguments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for work_documentation" ON public.work_documentation FOR ALL USING (true) WITH CHECK (true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_equipment_updated_at
  BEFORE UPDATE ON public.equipment
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial data
INSERT INTO public.equipment_types (name, name_et) VALUES 
  ('combine', 'Kombain'),
  ('tractor', 'Traktor'),
  ('sprayer', 'Pritsija'),
  ('seeder', 'Külvik');

INSERT INTO public.brands (name, is_primary) VALUES 
  ('John Deere', true),
  ('Claas', false),
  ('Case IH', false),
  ('New Holland', false);

INSERT INTO public.power_classes (name, min_hp, max_hp) VALUES 
  ('Väike (kuni 250 hj)', 0, 250),
  ('Keskmine (250-400 hj)', 250, 400),
  ('Suur (400-550 hj)', 400, 550),
  ('Ülisuur (550+ hj)', 550, 1000);
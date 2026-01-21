-- Create a table for custom specification labels
CREATE TABLE public.spec_labels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  spec_key TEXT NOT NULL UNIQUE,
  custom_label TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.spec_labels ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read for spec_labels" 
ON public.spec_labels 
FOR SELECT 
USING (true);

-- Create policy for all operations (for admin use)
CREATE POLICY "Allow all for spec_labels" 
ON public.spec_labels 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_spec_labels_updated_at
BEFORE UPDATE ON public.spec_labels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default labels
INSERT INTO public.spec_labels (spec_key, custom_label) VALUES
  ('engine_power_hp', 'Võimsus (hj)'),
  ('grain_tank_liters', 'Viljabunker (l)'),
  ('header_width_m', 'Heedri laius (m)'),
  ('weight_kg', 'Kaal (kg)'),
  ('fuel_consumption_lh', 'Kütusekulu (l/h)'),
  ('cleaning_area_m2', 'Puhastusala (m²)'),
  ('rotor_diameter_mm', 'Rootori läbimõõt (mm)'),
  ('throughput_tons_h', 'Läbilaskevõime (t/h)'),
  ('price_eur', 'Hind (€)'),
  ('annual_maintenance_eur', 'Hoolduskulu (€/a)'),
  ('expected_lifespan_years', 'Eluiga (a)'),
  ('total_cost', 'Kogukulu (TCO)');
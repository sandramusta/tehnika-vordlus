-- Add new columns for telehandler-specific specs
ALTER TABLE public.equipment 
ADD COLUMN IF NOT EXISTS lift_height_m numeric,
ADD COLUMN IF NOT EXISTS lift_reach_m numeric,
ADD COLUMN IF NOT EXISTS max_lift_capacity_kg integer,
ADD COLUMN IF NOT EXISTS hydraulic_pump_lpm integer;

-- Insert new brands for telehandlers (not primary brands)
INSERT INTO public.brands (name, is_primary) VALUES
('Kramer', false),
('Manitou', false),
('JCB', false),
('Merlo', false),
('Weidemann', false),
('Claas Scorpion', false)
ON CONFLICT DO NOTHING;
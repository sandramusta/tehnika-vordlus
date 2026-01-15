-- Add new columns to equipment table for extended technical specifications
ALTER TABLE public.equipment 
ADD COLUMN IF NOT EXISTS fuel_tank_liters INTEGER,
ADD COLUMN IF NOT EXISTS cleaning_area_m2 DECIMAL(4,2),
ADD COLUMN IF NOT EXISTS rotor_diameter_mm INTEGER,
ADD COLUMN IF NOT EXISTS throughput_tons_h DECIMAL(5,1),
ADD COLUMN IF NOT EXISTS engine_displacement_liters DECIMAL(4,1);

-- Add comment for documentation
COMMENT ON COLUMN public.equipment.fuel_tank_liters IS 'Kütusepaagi maht liitrites';
COMMENT ON COLUMN public.equipment.cleaning_area_m2 IS 'Puhasti pindala ruutmeetrites';
COMMENT ON COLUMN public.equipment.rotor_diameter_mm IS 'Rootori läbimõõt millimeetrites';
COMMENT ON COLUMN public.equipment.throughput_tons_h IS 'Läbilaskevõime tonnides tunnis';
COMMENT ON COLUMN public.equipment.engine_displacement_liters IS 'Mootori töömaht liitrites';
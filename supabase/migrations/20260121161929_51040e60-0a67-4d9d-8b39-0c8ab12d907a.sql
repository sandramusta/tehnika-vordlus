-- Add data_source_url field to equipment table for tracking where competitor data comes from
ALTER TABLE public.equipment ADD COLUMN data_source_url text;
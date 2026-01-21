-- Add new columns for Problem-Solution-Benefit structure
ALTER TABLE public.competitive_arguments 
ADD COLUMN problem_text text,
ADD COLUMN solution_text text,
ADD COLUMN benefit_text text,
ADD COLUMN icon_name text DEFAULT 'Lightbulb';

-- Migrate existing data: put argument_description into solution_text
UPDATE public.competitive_arguments 
SET solution_text = argument_description
WHERE solution_text IS NULL;
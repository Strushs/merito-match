-- Add nickname column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN nickname text;

-- Optional: Backfill existing nicknames with Study Field or generic name to prevent nulls in UI
UPDATE public.profiles 
SET nickname = study_field 
WHERE nickname IS NULL;

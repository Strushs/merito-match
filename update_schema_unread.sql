-- Add last_read columns to matches table
ALTER TABLE public.matches 
ADD COLUMN user_a_last_read timestamptz DEFAULT now(),
ADD COLUMN user_b_last_read timestamptz DEFAULT now();

-- Note: We default to 'now()' so existing matches start as 'read' until a new message comes.

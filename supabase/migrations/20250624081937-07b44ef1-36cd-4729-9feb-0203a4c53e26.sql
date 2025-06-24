
-- Create ats_test table for debugging ATS scans
CREATE TABLE public.ats_test (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  parsed_data TEXT, -- What we extracted from client side (PDF/Word file)
  sent_data TEXT, -- What we sent to DeepSeek
  received_data JSONB, -- What we got back from DeepSeek
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ats_test ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users (for debugging)
CREATE POLICY "Allow all operations for authenticated users" 
  ON public.ats_test 
  FOR ALL 
  USING (auth.uid() IS NOT NULL);

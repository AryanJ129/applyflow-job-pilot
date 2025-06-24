
-- Create error_logs table for better debugging and analysis
CREATE TABLE public.error_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  error TEXT NOT NULL,
  time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (optional - you can make it accessible for admins)
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access (you can modify this based on your needs)
CREATE POLICY "Allow all operations on error_logs" 
  ON public.error_logs 
  FOR ALL 
  USING (true);

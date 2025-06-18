
-- Create a table for storing resumes
CREATE TABLE public.resumes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT DEFAULT 'My Resume',
  basic_info JSONB DEFAULT '{}',
  work_experience JSONB DEFAULT '[]',
  education JSONB DEFAULT '[]',
  skills JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS) to ensure users can only see their own resumes
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

-- Create policy that allows users to SELECT their own resumes
CREATE POLICY "Users can view their own resumes" 
  ON public.resumes 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy that allows users to INSERT their own resumes
CREATE POLICY "Users can create their own resumes" 
  ON public.resumes 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy that allows users to UPDATE their own resumes
CREATE POLICY "Users can update their own resumes" 
  ON public.resumes 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create policy that allows users to DELETE their own resumes
CREATE POLICY "Users can delete their own resumes" 
  ON public.resumes 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create an index on user_id for better performance
CREATE INDEX idx_resumes_user_id ON public.resumes(user_id);

-- Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_resumes_updated_at 
    BEFORE UPDATE ON public.resumes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

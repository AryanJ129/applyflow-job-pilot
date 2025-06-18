
-- Create users table to store user information
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  name TEXT,
  email TEXT NOT NULL,
  login_method TEXT NOT NULL CHECK (login_method IN ('email', 'google')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Kolkata'),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Kolkata')
);

-- Add Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policy that allows users to view their own data
CREATE POLICY "Users can view their own data" 
  ON public.users 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy that allows users to insert their own data
CREATE POLICY "Users can create their own data" 
  ON public.users 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy that allows users to update their own data
CREATE POLICY "Users can update their own data" 
  ON public.users 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_name TEXT;
  user_email TEXT;
  method TEXT;
BEGIN
  -- Extract user info from auth metadata
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    SPLIT_PART(NEW.email, '@', 1)
  );
  
  user_email := NEW.email;
  
  -- Determine login method based on provider
  IF NEW.app_metadata->>'provider' = 'google' THEN
    method := 'google';
  ELSE
    method := 'email';
  END IF;

  -- Insert into users table
  INSERT INTO public.users (user_id, name, email, login_method)
  VALUES (NEW.id, user_name, user_email, method);
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create user profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

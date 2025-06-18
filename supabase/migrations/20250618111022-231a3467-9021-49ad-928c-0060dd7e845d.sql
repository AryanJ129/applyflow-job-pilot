
-- Fix the handle_new_user function to use correct field names
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
  -- Use raw_app_meta_data instead of app_metadata
  IF NEW.raw_app_meta_data->>'provider' = 'google' THEN
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

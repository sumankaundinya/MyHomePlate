-- Drop existing policies if any
DROP POLICY IF EXISTS "Chefs can insert their own profile" ON public.chefs;
DROP POLICY IF EXISTS "Chefs can view their own profile" ON public.chefs;
DROP POLICY IF EXISTS "Chefs can update their own profile" ON public.chefs;
DROP POLICY IF EXISTS "Anyone can view chef profiles" ON public.chefs;

-- Enable RLS on chefs table
ALTER TABLE public.chefs ENABLE ROW LEVEL SECURITY;

-- Allow chefs to insert their own profile
CREATE POLICY "Chefs can insert their own profile"
ON public.chefs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow chefs to view their own profile
CREATE POLICY "Chefs can view their own profile"
ON public.chefs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow chefs to update their own profile
CREATE POLICY "Chefs can update their own profile"
ON public.chefs
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow anyone (including non-authenticated users) to view all chef profiles for browsing
CREATE POLICY "Anyone can view chef profiles"
ON public.chefs
FOR SELECT
TO public
USING (true);
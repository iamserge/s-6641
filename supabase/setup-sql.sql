
-- Create tables for user favorites, approvals, and discussions

-- User Favorites Table
CREATE TABLE IF NOT EXISTS public.user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dupe_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  original_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, dupe_product_id, original_product_id)
);

-- User Approvals Table
CREATE TABLE IF NOT EXISTS public.user_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dupe_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  original_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, dupe_product_id, original_product_id)
);

-- Dupe Discussions Table
CREATE TABLE IF NOT EXISTS public.dupe_discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dupe_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  original_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create profile tables
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create a trigger to create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'), 
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create RPC functions to interact with the tables

-- User Favorites functions
CREATE OR REPLACE FUNCTION public.get_user_favorite(
  user_id_param UUID,
  dupe_id_param UUID,
  original_id_param UUID
) RETURNS SETOF public.user_favorites AS $$
  SELECT * FROM public.user_favorites 
  WHERE user_id = user_id_param 
  AND dupe_product_id = dupe_id_param 
  AND original_product_id = original_id_param;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.add_user_favorite(
  user_id_param UUID,
  dupe_id_param UUID,
  original_id_param UUID
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.user_favorites (user_id, dupe_product_id, original_product_id)
  VALUES (user_id_param, dupe_id_param, original_id_param);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.remove_user_favorite(
  user_id_param UUID,
  dupe_id_param UUID,
  original_id_param UUID
) RETURNS VOID AS $$
BEGIN
  DELETE FROM public.user_favorites 
  WHERE user_id = user_id_param 
  AND dupe_product_id = dupe_id_param 
  AND original_product_id = original_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- User Approvals functions
CREATE OR REPLACE FUNCTION public.get_user_approval(
  user_id_param UUID,
  dupe_id_param UUID,
  original_id_param UUID
) RETURNS SETOF public.user_approvals AS $$
  SELECT * FROM public.user_approvals 
  WHERE user_id = user_id_param 
  AND dupe_product_id = dupe_id_param 
  AND original_product_id = original_id_param;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.count_dupe_approvals(
  dupe_id_param UUID,
  original_id_param UUID
) RETURNS INTEGER AS $$
  SELECT COUNT(*) FROM public.user_approvals 
  WHERE dupe_product_id = dupe_id_param 
  AND original_product_id = original_id_param;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.add_user_approval(
  user_id_param UUID,
  dupe_id_param UUID,
  original_id_param UUID
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.user_approvals (user_id, dupe_product_id, original_product_id)
  VALUES (user_id_param, dupe_id_param, original_id_param);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.remove_user_approval(
  user_id_param UUID,
  dupe_id_param UUID,
  original_id_param UUID
) RETURNS VOID AS $$
BEGIN
  DELETE FROM public.user_approvals 
  WHERE user_id = user_id_param 
  AND dupe_product_id = dupe_id_param 
  AND original_product_id = original_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dupe Discussions functions
CREATE OR REPLACE FUNCTION public.get_dupe_discussions(
  dupe_id_param UUID,
  original_id_param UUID
) RETURNS TABLE (
  id UUID,
  user_id UUID,
  dupe_product_id UUID,
  original_product_id UUID,
  message TEXT,
  created_at TIMESTAMPTZ,
  profiles JSON
) AS $$
  SELECT 
    d.id,
    d.user_id,
    d.dupe_product_id,
    d.original_product_id,
    d.message,
    d.created_at,
    json_build_object(
      'full_name', p.full_name,
      'avatar_url', p.avatar_url
    ) as profiles
  FROM public.dupe_discussions d
  LEFT JOIN public.profiles p ON d.user_id = p.id
  WHERE d.dupe_product_id = dupe_id_param 
  AND d.original_product_id = original_id_param
  ORDER BY d.created_at DESC;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.add_dupe_discussion(
  user_id_param UUID,
  dupe_id_param UUID,
  original_id_param UUID,
  message_param TEXT
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.dupe_discussions (user_id, dupe_product_id, original_product_id, message)
  VALUES (user_id_param, dupe_id_param, original_id_param, message_param);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policies for the tables
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dupe_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User Favorites policies
CREATE POLICY "Users can view only their own favorites"
  ON public.user_favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites"
  ON public.user_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete only their own favorites"
  ON public.user_favorites FOR DELETE
  USING (auth.uid() = user_id);

-- User Approvals policies
CREATE POLICY "Users can view only their own approvals"
  ON public.user_approvals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own approvals"
  ON public.user_approvals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete only their own approvals"
  ON public.user_approvals FOR DELETE
  USING (auth.uid() = user_id);

-- Dupe Discussions policies
CREATE POLICY "Anyone can view discussions"
  ON public.dupe_discussions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own discussions"
  ON public.dupe_discussions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update only their own discussions"
  ON public.dupe_discussions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete only their own discussions"
  ON public.dupe_discussions FOR DELETE
  USING (auth.uid() = user_id);

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Update App.tsx to add the DupeProductsPage route

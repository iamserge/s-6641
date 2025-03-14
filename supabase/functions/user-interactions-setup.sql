
-- Create tables for user interactions
CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  dupe_product_id UUID NOT NULL,
  original_product_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, dupe_product_id, original_product_id)
);

CREATE TABLE IF NOT EXISTS user_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  dupe_product_id UUID NOT NULL,
  original_product_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, dupe_product_id, original_product_id)
);

CREATE TABLE IF NOT EXISTS dupe_discussions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  dupe_product_id UUID NOT NULL,
  original_product_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create functions for user favorites
CREATE OR REPLACE FUNCTION get_user_favorite(
  user_id_param UUID,
  dupe_id_param UUID,
  original_id_param UUID
) RETURNS SETOF user_favorites AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM user_favorites
  WHERE 
    user_id = user_id_param AND
    dupe_product_id = dupe_id_param AND
    original_product_id = original_id_param;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION add_user_favorite(
  user_id_param UUID,
  dupe_id_param UUID,
  original_id_param UUID
) RETURNS void AS $$
BEGIN
  INSERT INTO user_favorites (user_id, dupe_product_id, original_product_id)
  VALUES (user_id_param, dupe_id_param, original_id_param)
  ON CONFLICT (user_id, dupe_product_id, original_product_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION remove_user_favorite(
  user_id_param UUID,
  dupe_id_param UUID,
  original_id_param UUID
) RETURNS void AS $$
BEGIN
  DELETE FROM user_favorites
  WHERE 
    user_id = user_id_param AND
    dupe_product_id = dupe_id_param AND
    original_product_id = original_id_param;
END;
$$ LANGUAGE plpgsql;

-- Create functions for user approvals
CREATE OR REPLACE FUNCTION get_user_approval(
  user_id_param UUID,
  dupe_id_param UUID,
  original_id_param UUID
) RETURNS SETOF user_approvals AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM user_approvals
  WHERE 
    user_id = user_id_param AND
    dupe_product_id = dupe_id_param AND
    original_product_id = original_id_param;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION count_dupe_approvals(
  dupe_id_param UUID,
  original_id_param UUID
) RETURNS integer AS $$
DECLARE
  approval_count integer;
BEGIN
  SELECT COUNT(*)
  INTO approval_count
  FROM user_approvals
  WHERE
    dupe_product_id = dupe_id_param AND
    original_product_id = original_id_param;
  
  RETURN approval_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION add_user_approval(
  user_id_param UUID,
  dupe_id_param UUID,
  original_id_param UUID
) RETURNS void AS $$
BEGIN
  INSERT INTO user_approvals (user_id, dupe_product_id, original_product_id)
  VALUES (user_id_param, dupe_id_param, original_id_param)
  ON CONFLICT (user_id, dupe_product_id, original_product_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION remove_user_approval(
  user_id_param UUID,
  dupe_id_param UUID,
  original_id_param UUID
) RETURNS void AS $$
BEGIN
  DELETE FROM user_approvals
  WHERE 
    user_id = user_id_param AND
    dupe_product_id = dupe_id_param AND
    original_product_id = original_id_param;
END;
$$ LANGUAGE plpgsql;

-- Create functions for dupe discussions
CREATE OR REPLACE FUNCTION get_dupe_discussions(
  dupe_id_param UUID,
  original_id_param UUID
) RETURNS TABLE (
  id UUID,
  user_id UUID,
  dupe_product_id UUID,
  original_product_id UUID,
  message TEXT,
  created_at TIMESTAMPTZ,
  profiles JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.user_id,
    d.dupe_product_id,
    d.original_product_id,
    d.message,
    d.created_at,
    jsonb_build_object(
      'full_name', p.full_name,
      'avatar_url', p.avatar_url
    ) as profiles
  FROM dupe_discussions d
  LEFT JOIN auth.users u ON d.user_id = u.id
  LEFT JOIN public.profiles p ON d.user_id = p.id
  WHERE 
    d.dupe_product_id = dupe_id_param AND
    d.original_product_id = original_id_param
  ORDER BY d.created_at DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION add_dupe_discussion(
  user_id_param UUID,
  dupe_id_param UUID,
  original_id_param UUID,
  message_param TEXT
) RETURNS void AS $$
BEGIN
  INSERT INTO dupe_discussions (user_id, dupe_product_id, original_product_id, message)
  VALUES (user_id_param, dupe_id_param, original_id_param, message_param);
END;
$$ LANGUAGE plpgsql;

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger to create profile automatically when user registers
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'create_profile_on_signup'
  ) THEN
    CREATE TRIGGER create_profile_on_signup
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_profile_for_user();
  END IF;
END
$$;

-- Add RLS policies to secure the tables
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE dupe_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies for user_favorites
CREATE POLICY "Users can view their own favorites"
  ON user_favorites
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites"
  ON user_favorites
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
  ON user_favorites
  FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for user_approvals
CREATE POLICY "Users can view their own approvals"
  ON user_approvals
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view approval counts"
  ON user_approvals
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own approvals"
  ON user_approvals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own approvals"
  ON user_approvals
  FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for dupe_discussions
CREATE POLICY "Anyone can view discussions"
  ON dupe_discussions
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own messages"
  ON dupe_discussions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policies for profiles
CREATE POLICY "Anyone can view profiles"
  ON profiles
  FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

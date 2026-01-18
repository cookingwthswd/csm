-- ==========================================
-- Custom Access Token Hook
-- Injects role and store_id into JWT claims
-- ==========================================

-- Grant supabase_auth_admin access to read users table
GRANT SELECT ON public.users TO supabase_auth_admin;

-- Function to add custom claims to JWT
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
  user_store_id INTEGER;
BEGIN
  -- Get user's role and store_id from users table
  SELECT role, store_id INTO user_role, user_store_id
  FROM public.users
  WHERE id = (event->>'user_id')::uuid;

  -- If user not found in users table, use defaults
  IF user_role IS NULL THEN
    user_role := 'store_staff';
    user_store_id := NULL;
  END IF;

  -- Add to app_metadata in claims
  event := jsonb_set(
    event,
    '{claims,app_metadata}',
    COALESCE(event->'claims'->'app_metadata', '{}'::jsonb) ||
    jsonb_build_object('role', user_role, 'store_id', user_store_id)
  );

  RETURN event;
END;
$$;

-- Grant execute permission to supabase_auth_admin
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;

-- Revoke from public for security
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM anon;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated;

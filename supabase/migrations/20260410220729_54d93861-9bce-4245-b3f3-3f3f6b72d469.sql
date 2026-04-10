
-- Drop any trigger that calls handle_new_user_credits on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created_credits ON auth.users;

-- Drop the broken function
DROP FUNCTION IF EXISTS public.handle_new_user_credits();

-- Ensure handle_new_user trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

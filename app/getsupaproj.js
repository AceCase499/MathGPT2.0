import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_JERRODS_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_JERRODS_SUPABASE_ANONKEY

const supabaseProj = createClient(
  supabaseUrl,
  supabaseAnonKey
);

export default supabaseProj
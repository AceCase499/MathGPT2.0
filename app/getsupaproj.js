import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.JERRODS_SUPABASE_URL
const supabaseAnonKey = process.env.JERRODS_SUPABASE_ANONKEY

const supabaseProj = createClient(
  supabaseUrl,
  supabaseAnonKey
)

export default supabaseProj;
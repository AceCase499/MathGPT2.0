import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://mpgvjrzxvizjnyxdyntp.supabase.co"
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wZ3Zqcnp4dml6am55eGR5bnRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MTQxNzgsImV4cCI6MjA2NjI5MDE3OH0.CT8NQas6sb8gXAE4YM-3xKP1tvo2d5fg8pVl39-xjME'

const supabaseProj = createClient(
  supabaseUrl,
  supabaseAnonKey
);

export default supabaseProj
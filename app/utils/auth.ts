// app/utils/auth.ts or src/utils/auth.ts
import { SupabaseClient } from '@supabase/auth-helpers-nextjs';

export const handleLogin = async (
  supabase: SupabaseClient,
  router: any, // or use: ReturnType<typeof import('next/navigation').useRouter>
  email: string,
  password: string
) => {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (!error) {
    router.push('/');
    router.refresh(); 
  } else {
    alert(error.message);
  }
};

export const handleLogout = async (
  supabase: SupabaseClient,
  router: any
) => {
  await supabase.auth.signOut();
  router.push('/');
  router.refresh();
};

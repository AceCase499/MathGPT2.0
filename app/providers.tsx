'use client'

import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { supabaseClient } from './lib/supabaseClient'
import { useState } from 'react'
import type { Session } from '@supabase/auth-helpers-react'

type ProvidersProps = {
  children: React.ReactNode
  initialSession?: Session | null
}

export function Providers({ children, initialSession }: ProvidersProps) {
  const [supabase] = useState(() => supabaseClient)

  return (
    <SessionContextProvider supabaseClient={supabase} initialSession={initialSession}>
      {children}
    </SessionContextProvider>
  )
}

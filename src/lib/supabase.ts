import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

console.log(`[SUPABASE] Configuration status: ${isConfigured ? 'Configured' : 'NOT Configured'}`);
if (isConfigured) {
  console.log(`[SUPABASE] URL: ${supabaseUrl}`);
}

if (!isConfigured) {
  console.warn('[SUPABASE] Missing environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.');
}

export const supabase = isConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : new Proxy({} as any, {
      get(_, prop) {
        if (prop === 'auth') {
          return {
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
            signOut: async () => {},
            signInWithPassword: async () => ({ error: new Error('Supabase not configured') }),
            signUp: async () => ({ error: new Error('Supabase not configured') }),
            updateUser: async () => ({ error: new Error('Supabase not configured') }),
            resetPasswordForEmail: async () => ({ error: new Error('Supabase not configured') }),
          };
        }
        
        const mockChain = () => {
          const result: any = new Proxy(() => {}, {
            get: (_, p) => {
              if (p === 'then') {
                return (resolve: any) => resolve({ data: null, error: new Error('Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables.') });
              }
              return result;
            },
            apply: () => result
          });
          return result;
        };
        
        return mockChain();
      }
    });

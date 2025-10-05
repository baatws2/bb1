import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

// Support runtime env (injected via window.__ENV__) for static hosting like GitHub Pages
const runtimeEnv = (typeof window !== 'undefined' ? (window as any).__ENV__ : undefined) || {};
const envUrl = (runtimeEnv.EXPO_PUBLIC_SUPABASE_URL as string) || process.env.EXPO_PUBLIC_SUPABASE_URL;
const envKey = (runtimeEnv.EXPO_PUBLIC_SUPABASE_ANON_KEY as string) || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

function createSupabaseFallback() {
  console.warn('[Supabase] Not configured. Running in demo mode (no backend).');
  // Minimal API surface used in the app
  const noop = async () => ({ data: null as any, error: new Error('Supabase not configured') });
  const okEmpty = async () => ({ data: [] as any, error: null as any });
  const okNull = async () => ({ data: null as any, error: null as any });
  return {
    from(_table: string) {
      return {
        select(_cols?: string) {
          return {
            order(_col?: string, _opts?: any) {
              return okEmpty();
            },
            eq(_col: string, _val: any) {
              return {
                maybeSingle: okNull,
              } as any;
            },
          } as any;
        },
        insert: (_rows: any[]) => noop(),
        update: (_values: any) => ({ eq: (_c: string, _v: any) => noop() }),
        delete: () => ({ eq: (_c: string, _v: any) => noop() }),
      } as any;
    },
    auth: {
      async getSession() {
        return { data: { session: null }, error: null } as any;
      },
      onAuthStateChange(_cb: any) {
        const subscription = { unsubscribe() {/* no-op */} };
        return { data: { subscription } } as any;
      },
      async signInWithPassword(_creds: any) {
        return { data: null, error: new Error('Supabase not configured') } as any;
      },
      async signUp(_creds: any) {
        return { data: null, error: new Error('Supabase not configured') } as any;
      },
      async signOut() {
        return { error: null } as any;
      },
    },
    storage: {
      from(_bucket: string) {
        return {
          upload: async (_path: string, _body: any) => ({ data: null, error: new Error('Supabase not configured') }),
          getPublicUrl: (_path: string) => ({ data: { publicUrl: '' } }),
          remove: async (_paths: string[]) => ({ data: null, error: new Error('Supabase not configured') }),
        } as any;
      },
    },
    channel(_name: string) {
      return {
        on: (_event: any, _filter: any, _cb: Function) => ({ subscribe: () => ({ id: 'demo' }) }),
        subscribe: () => ({ id: 'demo' }),
      } as any;
    },
    removeChannel(_ch: any) {
      // no-op
    },
  } as const;
}

let supabase: ReturnType<typeof createSupabaseFallback> | ReturnType<typeof createClient>;
let SUPABASE_CONFIGURED = false;

try {
  if (!envUrl || !envKey) {
    supabase = createSupabaseFallback();
  } else {
    // createClient can throw if the URL is not a valid Supabase URL. Catch and fallback.
    supabase = createClient(envUrl, envKey);
    SUPABASE_CONFIGURED = true;
  }
} catch (err) {
  console.error('[Supabase] Failed to initialize client. Falling back to demo mode.', err);
  supabase = createSupabaseFallback();
}

export { supabase };
export const isSupabaseConfigured = SUPABASE_CONFIGURED;

export type Product = {
  id: string;
  name: string;
  description: string;
  current_quantity: number | null;
  minimum_quantity: number;
  unit: string;
  category: string;
  barcode: string;
  image_url: string | null;
  expiry_date: string;
  location: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

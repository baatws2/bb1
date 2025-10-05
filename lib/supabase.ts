import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

// Support runtime env (injected via window.__ENV__) for static hosting like GitHub Pages
const runtimeEnv = (typeof window !== 'undefined' ? (window as any).__ENV__ : undefined) || {};
let supabaseUrl = (runtimeEnv.EXPO_PUBLIC_SUPABASE_URL as string) || process.env.EXPO_PUBLIC_SUPABASE_URL;
let supabaseAnonKey = (runtimeEnv.EXPO_PUBLIC_SUPABASE_ANON_KEY as string) || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Avoid hard crash on static hosting if envs are missing; app will show empty data but UI still works
  console.warn('[Supabase] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. Running in read-only demo mode.');
  // Use a safe placeholder to satisfy client creation; requests will fail gracefully
  supabaseUrl = 'https://example.com';
  supabaseAnonKey = 'public-anon-key';
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

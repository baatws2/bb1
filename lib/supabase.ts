import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

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

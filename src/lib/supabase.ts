import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Ini adalah "jembatan" agar Next.js bisa mengobrol dengan database Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
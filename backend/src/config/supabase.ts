import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Cliente público (respeta RLS - Row Level Security)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente admin (bypass RLS - solo para operaciones del servidor)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

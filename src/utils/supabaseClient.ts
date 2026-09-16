import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dsmeitqmdfdavgayznsu.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_S8UpiAdtq809CYl3jbLLFw_ks6YomOk';
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

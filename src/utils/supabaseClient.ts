import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dsmeitqmdfdavgayznsu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzbWVpdHFtZGZkYXZnYXl6bnN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1MTc5NTUsImV4cCI6MjEwNTA5Mzk1NX0.2BTWa5cpTRQXC9IGG5RYBg1JavV0U2qVtTry80lQERc';
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

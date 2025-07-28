import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rrhtsqiscmofhuxasrpw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJyaHRzcWlzY21vZmh1eGFzcnB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0NDkwOTgsImV4cCI6MjA2NDAyNTA5OH0.tp67EEzC9tbXSTGK3BZj6CLnRqj4N8Bsk68c4Fj2ziw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://wlcypxeinpffyexiwbra.supabase.co';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsY3lweGVpbnBmZnlleGl3YnJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2ODU0MzMsImV4cCI6MjA4NjI2MTQzM30.Nv9cIU4nboIdklhFNzvy9QBEigtNMJSz4mW2NmW9CMo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

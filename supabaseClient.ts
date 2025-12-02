
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qhyyfnekgiwbnabaacpe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoeXlmbmVrZ2l3Ym5hYmFhY3BlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2NTM0MjEsImV4cCI6MjA4MDIyOTQyMX0.R0rfl9uWnfLvEVWwzuIFGJfzXZ_lFsS9XAX1DLlqZ24';

export const supabase = createClient(supabaseUrl, supabaseKey);

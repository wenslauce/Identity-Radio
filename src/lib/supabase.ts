import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const SUPABASE_URL = "https://kckpdzaandfnaxjmsrje.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtja3BkemFhbmRmbmF4am1zcmplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU1NzUzNjQsImV4cCI6MjA1MTE1MTM2NH0.etHuMiTHEi7J5radq4djulZMeZkLXNSPkIpKlYq5Plc";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
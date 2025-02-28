
// db-client.ts
// Adding a comment to trigger redeployment (timestamp: 2025-02-28 16:00)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';
import type { Database } from '../shared/types';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkCache() {
  const { data, error } = await supabase
    .from('cached_business_details')
    .select('*')
    .ilike('company_name', '%SEDCO%');

  if (error) {
    console.error('Error fetching cache:', error);
    return;
  }

  console.log('Cached results found:', JSON.stringify(data, null, 2));
}

checkCache();


import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
    const { data: linkedinData } = await supabase
        .from('cached_linkedin_urls')
        .select('*');
    
    if (linkedinData) {
        const total = linkedinData.length;
        const found = linkedinData.filter(d => d.linkedin_url && d.linkedin_url !== 'NOT_FOUND').length;
        const notFound = linkedinData.filter(d => d.linkedin_url === 'NOT_FOUND').length;
        console.log(`LINKEDIN_TOTAL: ${total}`);
        console.log(`LINKEDIN_FOUND: ${found}`);
        console.log(`LINKEDIN_NOT_FOUND: ${notFound}`);
    } else {
        console.log("NO_DATA");
    }
}
check();

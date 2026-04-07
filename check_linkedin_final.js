
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
    console.log("Checking LinkedIn Cache Status...");
    const { data: linkedinData, error } = await supabase
        .from('cached_linkedin_urls')
        .select('linkedin_url');
    
    if (error) {
        console.error("Error:", error);
        return;
    }

    if (linkedinData) {
        const total = linkedinData.length;
        const found = linkedinData.filter(d => d.linkedin_url && d.linkedin_url !== 'NOT_FOUND').length;
        const notFound = linkedinData.filter(d => d.linkedin_url === 'NOT_FOUND').length;
        console.log(`\n--- RESULTS ---`);
        console.log(`Total searches performed: ${total}`);
        console.log(`Profiles found: ${found}`);
        console.log(`Profiles NOT found (Publicly undisclosed or missing): ${notFound}`);
    } else {
        console.log("No searches found in cache.");
    }
}
check();

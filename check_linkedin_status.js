
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function analyzeLinkedin() {
    console.log("Analyzing LinkedIn Cache...");
    const { data, error } = await supabase
        .from('cached_linkedin_urls')
        .select('linkedin_url');
    
    if (error) {
        console.error("Error fetching LinkedIn cache:", error);
        return;
    }

    const total = data.length;
    const found = data.filter(item => item.linkedin_url && item.linkedin_url !== 'NOT_FOUND').length;
    const notFound = data.filter(item => item.linkedin_url === 'NOT_FOUND').length;

    console.log(`\nSummary:`);
    console.log(`Total checked: ${total}`);
    console.log(`Found: ${found}`);
    console.log(`Not Found (Explicitly NOT_FOUND): ${notFound}`);
    console.log(`Success rate: ${((found / total) * 100).toFixed(2)}%`);
}

analyzeLinkedin();

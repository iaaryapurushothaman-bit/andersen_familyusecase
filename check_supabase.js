
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkCache() {
    console.log("Checking cached_emails table...");
    const { data: emails, error: emailError } = await supabase
        .from('cached_emails')
        .select('*')
        .limit(10);
    
    if (emailError) console.error("Error fetching emails:", emailError);
    else console.log("Recent emails:", emails);

    console.log("\nChecking cached_business_details table...");
    const { data: details, error: detailsError } = await supabase
        .from('cached_business_details')
        .select('*')
        .limit(10);
    
    if (detailsError) console.error("Error fetching details:", detailsError);
    else console.log("Recent details:", details);
}

checkCache();

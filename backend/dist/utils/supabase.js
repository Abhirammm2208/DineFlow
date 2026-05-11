import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET;
if (!supabaseUrl || !supabaseKey) {
    console.error('ERROR: Missing Supabase credentials');
    console.error('SUPABASE_URL:', supabaseUrl ? 'SET' : 'NOT SET');
    console.error('SUPABASE_SECRET:', supabaseKey ? 'SET' : 'NOT SET');
    console.error('Current env keys:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
    throw new Error('Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_SECRET in .env');
}
export const supabase = createClient(supabaseUrl, supabaseKey);
//# sourceMappingURL=supabase.js.map
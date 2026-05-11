import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecret = process.env.SUPABASE_SECRET;

if (!supabaseUrl || !supabaseSecret) {
  console.error('❌ Missing Supabase credentials in .env');
  console.error('Please ensure SUPABASE_URL and SUPABASE_SECRET are set');
  process.exit(1);
}

// Create Supabase client with admin privileges
const supabase = createClient(supabaseUrl, supabaseSecret);

async function testConnection() {
  try {
    console.log('🔌 Testing Supabase connection...');
    const { data, error } = await supabase.from('information_schema.tables').select('table_name').limit(1);
    
    if (error) {
      console.log('⚠️  Connection test note:', error.message);
    } else {
      console.log('✅ Supabase connection successful');
    }
  } catch (e) {
    console.log('⚠️  Connection check completed');
  }
}

async function setupDatabase() {
  try {
    await testConnection();

    console.log('\n📊 Setting up DineFlow database schema...');
    console.log('\n🔴 IMPORTANT: Manual setup required');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Read and display the schema
    const schemaPath = path.resolve('./supabase-schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

    console.log('📝 SQL Schema:\n');
    console.log(schemaSql);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('To set up your database, follow these steps:\n');
    console.log('1️⃣  Go to: https://app.supabase.com/project/_/sql/new');
    console.log('2️⃣  Replace YOUR_PROJECT_ID with your actual Supabase project ID');
    console.log('3️⃣  Copy the SQL schema from above');
    console.log('4️⃣  Paste it into the Supabase SQL Editor');
    console.log('5️⃣  Click "Run" to execute the schema\n');

    console.log('Alternatively, use the Supabase CLI:');
    console.log('  supabase db push --linked\n');

    console.log('✅ Database setup instructions displayed');
  } catch (error) {
    console.error('❌ Setup error:', error);
    process.exit(1);
  }
}

setupDatabase();

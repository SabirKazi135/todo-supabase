// src/testSupabaseNode.js
import 'dotenv/config'; // loads .env into process.env
import { createClient } from '@supabase/supabase-js';

// Load values directly from process.env
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  const { error } = await supabase.auth.getSession();
  if (error) {
    console.error('❌ Supabase connection failed:', error.message);
  } else {
    console.log('✅ Supabase connected successfully!');
  }
}

testConnection();

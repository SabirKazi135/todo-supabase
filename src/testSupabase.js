import { supabase } from './lib/supabaseClient.js';

async function testConnection() {
  const { error } = await supabase.auth.getSession();
  if (error) {
    console.error('❌ Supabase connection failed:', error.message);
  } else {
    console.log('✅ Supabase connected successfully!');
  }
}

testConnection();

// Import Supabase from CDN
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.0/+esm'

// ⚠️ PASTE YOUR ACTUAL VALUES HERE from Step 2
const SUPABASE_URL = 'https://fveuxzijvutieavzdfvg.supabase.co' 
const SUPABASE_ANON_KEY = 'eyJhbGci...paste_your_full_anon_key_here'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Test connection
console.log('Supabase connected:', SUPABASE_URL)

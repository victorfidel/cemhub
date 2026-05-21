// Import Supabase from CDN
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.0/+esm'

// ⚠️ PASTE YOUR ACTUAL VALUES HERE from Step 2
const SUPABASE_URL = 'https://srzhahwfvitirabhsjsw.supabase.co' 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyemhhaHdmdml0aXJhYmhzanN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNzMzOTEsImV4cCI6MjA5NDk0OTM5MX0.0BwJcguv0KSzSFVswN3JnfOOvtnALF1cVP8xW3cWnvs'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Test connection
console.log('Supabase connected:', SUPABASE_URL)

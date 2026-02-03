// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

// Your Supabase credentials (from your .env file)
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
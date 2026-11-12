// ==========================================
// SynapseMed - Supabase Configuration
// ==========================================

// Project Configuration
const SUPABASE_URL = "https://kzqzbogrjhbxievvdmvr.supabase.co";

const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_6OtlCrrlJojCl29ais7ktg_nlEJtIZm";

// Initialize Supabase Client
const { createClient } = window.supabase;

const synapseDB = createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        }
    }
);

// Make client available throughout the application
window.synapseDB = synapseDB;

// Connection status
console.log("SynapseMed: Supabase initialized successfully");

// Test connection
synapseDB.auth.getSession()
    .then(({ data, error }) => {
        if (error) {
            console.error("Supabase authentication error:", error.message);
        } else {
            console.log("Supabase connection is ready.");
        }
    });

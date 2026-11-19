"use strict";

const SUPABASE_URL =
    "https://kzqzbogrjhbxievvdmvr.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_6OtlCrrlJojCl29ais7ktg_nlEJtIZm";

const { createClient } = window.supabase;

const synapseDB = createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
            storage: window.localStorage,
            storageKey: "synapsemed-auth-v1",
            flowType: "implicit"
        }
    }
);

window.synapseDB = synapseDB;

/*
 * لا نستدعي getSession هنا.
 * مكتبة Supabase تتولى استعادة الجلسة تلقائياً.
 * هذا يمنع تكرار استعادة الجلسة عند بدء التطبيق.
 */

synapseDB.auth.onAuthStateChange((event, session) => {
    console.log(
        "SynapseMed Auth Event:",
        event,
        session ? "Session available" : "No session"
    );
});

console.log(
    "SynapseMed: Supabase initialized successfully."
);

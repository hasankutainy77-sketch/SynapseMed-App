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

            // تثبيت مكان تخزين جلسة المستخدم
            storage: window.localStorage,

            // مفتاح ثابت لحفظ الجلسة
            storageKey: "synapsemed-auth-v1",

            // استخدام آلية تجديد الجلسة الافتراضية
            flowType: "implicit"
        }
    }
);

window.synapseDB = synapseDB;

// التحقق من استعادة الجلسة
synapseDB.auth.getSession()
    .then(({ data, error }) => {

        if (error) {
            console.error(
                "SynapseMed session error:",
                error.message
            );
            return;
        }

        if (data.session) {
            console.log(
                "SynapseMed: Existing session restored."
            );
        } else {
            console.log(
                "SynapseMed: No saved session found."
            );
        }
    });

// مراقبة تغيرات المصادقة
synapseDB.auth.onAuthStateChange(
    (event, session) => {
        console.log(
            "SynapseMed Auth Event:",
            event
        );
    }
);

console.log(
    "SynapseMed: Supabase initialized successfully."
);

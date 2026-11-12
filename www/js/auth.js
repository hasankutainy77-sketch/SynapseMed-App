(function () {
"use strict";

const db = window.synapseDB;

if (!db) {
    console.error("SynapseMed: Supabase client not found.");
    return;
}

const messages = {
    loginSuccess: "تم تسجيل الدخول بنجاح.",
    signupSuccess: "تم إرسال طلب الانضمام بنجاح.",
    pending: "طلبك قيد مراجعة الإدارة.",
    rejected: "عذراً، لم تتم الموافقة على طلب انضمامك.",
    invalidCredentials: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    missingFields: "يرجى تعبئة جميع الحقول.",
    weakPassword: "كلمة المرور يجب أن تكون 8 أحرف على الأقل.",
    passwordMismatch: "كلمتا المرور غير متطابقتين.",
    generalError: "حدث خطأ، يرجى المحاولة مجدداً."
};

async function getProfile() {
    const { data: userData, error: userError } =
        await db.auth.getUser();

    if (userError || !userData.user) {
        return {
            success: false,
            message: "يرجى تسجيل الدخول أولاً."
        };
    }

    const { data: profile, error } = await db
        .from("profiles")
        .select("id, display_name, role, status")
        .eq("id", userData.user.id)
        .single();

    if (error || !profile) {
        return {
            success: false,
            message: "تعذر تحميل بيانات الحساب."
        };
    }

    return {
        success: true,
        user: userData.user,
        profile
    };
}

async function login(email, password) {
    email = (email || "").trim().toLowerCase();

    if (!email || !password) {
        return {
            success: false,
            message: messages.missingFields
        };
    }

    const { error } = await db.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        return {
            success: false,
            message: messages.invalidCredentials
        };
    }

    const result = await getProfile();

    if (!result.success) {
        await db.auth.signOut();
        return result;
    }

    const profile = result.profile;

    if (profile.role === "admin") {
        return {
            success: true,
            role: "admin",
            profile,
            message: messages.loginSuccess
        };
    }

    if (profile.status === "pending") {
        await db.auth.signOut();

        return {
            success: false,
            status: "pending",
            message: messages.pending
        };
    }

    if (profile.status === "rejected") {
        await db.auth.signOut();

        return {
            success: false,
            status: "rejected",
            message: messages.rejected
        };
    }

    if (profile.status !== "approved") {
        await db.auth.signOut();

        return {
            success: false,
            message: messages.generalError
        };
    }

    return {
        success: true,
        role: "student",
        profile,
        message: messages.loginSuccess
    };
}

async function register(email, password, confirmPassword) {
    email = (email || "").trim().toLowerCase();

    if (!email || !password || !confirmPassword) {
        return {
            success: false,
            message: messages.missingFields
        };
    }

    if (password.length < 8) {
        return {
            success: false,
            message: messages.weakPassword
        };
    }

    if (password !== confirmPassword) {
        return {
            success: false,
            message: messages.passwordMismatch
        };
    }

    const { data, error } = await db.auth.signUp({
        email,
        password
    });

    if (error) {
        return {
            success: false,
            message: error.message
        };
    }

    if (!data.user) {
        return {
            success: false,
            message: messages.generalError
        };
    }

    // تسجيل خروج فوري بعد إنشاء الحساب.
    // يبقى الحساب بانتظار موافقة الإدارة.
    if (data.session) {
        await db.auth.signOut();
    }

    return {
        success: true,
        status: "pending",
        message: messages.signupSuccess + " " + messages.pending
    };
}

async function logout() {
    const { error } = await db.auth.signOut();

    if (error) {
        return {
            success: false,
            message: error.message
        };
    }

    return {
        success: true,
        message: "تم تسجيل الخروج بنجاح."
    };
}

async function checkSession() {
    const { data } = await db.auth.getSession();

    if (!data.session) {
        return {
            authenticated: false
        };
    }

    const result = await getProfile();

    if (!result.success) {
        return {
            authenticated: false
        };
    }

    const profile = result.profile;

    return {
        authenticated: true,
        approved:
            profile.role === "admin" ||
            profile.status === "approved",
        role: profile.role,
        status: profile.status,
        profile
    };
}

window.SynapseAuth = {
    login,
    register,
    logout,
    getProfile,
    checkSession
};

console.log("SynapseMed Authentication module loaded.");

})();

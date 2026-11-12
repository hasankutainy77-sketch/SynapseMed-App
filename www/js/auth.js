// ==========================================
// SynapseMed - Authentication System
// ==========================================

(function () {
    "use strict";

    const db = window.synapseDB;

    if (!db) {
        console.error("SynapseMed: Supabase client not found.");
        return;
    }

    // Arabic messages
    const messages = {
        loginSuccess: "تم تسجيل الدخول بنجاح.",
        signupSuccess: "تم إنشاء الحساب بنجاح.",
        pending: "حسابك بانتظار موافقة الإدارة.",
        rejected: "عذراً، لم تتم الموافقة على حسابك.",
        invalidCredentials: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
        missingFields: "يرجى تعبئة جميع الحقول.",
        weakPassword: "كلمة المرور يجب أن تكون 8 أحرف على الأقل.",
        passwordMismatch: "كلمتا المرور غير متطابقتين.",
        emailConfirmation: "تم إنشاء الحساب. يرجى تأكيد بريدك الإلكتروني.",
        generalError: "حدث خطأ، يرجى المحاولة مجدداً."
    };

    // ------------------------------------------
    // Get current user profile
    // ------------------------------------------

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
            profile: profile
        };
    }

    // ------------------------------------------
    // Login
    // ------------------------------------------

    async function login(email, password) {
        email = (email || "").trim().toLowerCase();

        if (!email || !password) {
            return {
                success: false,
                message: messages.missingFields
            };
        }

        const { data, error } = await db.auth.signInWithPassword({
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
            return {
                success: false,
                status: "pending",
                message: messages.pending
            };
        }

        if (profile.status === "rejected") {
            return {
                success: false,
                status: "rejected",
                message: messages.rejected
            };
        }

        if (profile.status !== "approved") {
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

    // ------------------------------------------
    // Register new student
    // ------------------------------------------

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

        if (!data.session) {
            return {
                success: true,
                status: "email_confirmation",
                message: messages.emailConfirmation
            };
        }

        return {
            success: true,
            status: "pending",
            message: messages.pending
        };
    }

    // ------------------------------------------
    // Logout
    // ------------------------------------------

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

    // ------------------------------------------
    // Check current session
    // ------------------------------------------

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
            profile: profile
        };
    }

    // ------------------------------------------
    // Public API
    // ------------------------------------------

    window.SynapseAuth = {
        login,
        register,
        logout,
        getProfile,
        checkSession
    };

    console.log("SynapseMed Authentication module loaded.");

})();

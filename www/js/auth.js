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

/* =====================================
   جلب بيانات المستخدم
===================================== */

async function getProfile() {
    try {
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
            console.error("PROFILE ERROR:", error);

            return {
                success: false,
                message: error
                    ? "تعذر تحميل بيانات الحساب: " + error.message
                    : "تعذر تحميل بيانات الحساب."
            };
        }

        return {
            success: true,
            user: userData.user,
            profile
        };

    } catch (error) {
        console.error("GET PROFILE ERROR:", error);

        return {
            success: false,
            message: "حدث خطأ أثناء تحميل بيانات الحساب: " +
                (error.message || "خطأ غير معروف")
        };
    }
}

/* =====================================
   تسجيل الدخول
===================================== */

async function login(email, password) {
    email = (email || "").trim().toLowerCase();

    if (!email || !password) {
        return {
            success: false,
            message: messages.missingFields
        };
    }

    try {
        const { data, error } = await db.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            console.error("LOGIN AUTH ERROR:", error);

            return {
                success: false,
                message: "خطأ المصادقة: " +
                    (error.message || messages.invalidCredentials)
            };
        }

        if (!data.user) {
            return {
                success: false,
                message: "لم يرجع خادم المصادقة بيانات المستخدم."
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

    } catch (error) {
        console.error("LOGIN NETWORK/UNEXPECTED ERROR:", error);

        return {
            success: false,
            message: "تعذر إكمال تسجيل الدخول: " +
                (error.message || "خطأ غير معروف")
        };
    }
}

/* =====================================
   إنشاء حساب جديد
===================================== */

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

    try {
        const { data, error } = await db.auth.signUp({
            email,
            password
        });

        if (error) {
            console.error("REGISTER ERROR:", error);

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

        if (data.session) {
            await db.auth.signOut();
        }

        return {
            success: true,
            status: "pending",
            message: messages.signupSuccess + " " + messages.pending
        };

    } catch (error) {
        console.error("REGISTER UNEXPECTED ERROR:", error);

        return {
            success: false,
            message: "تعذر إنشاء الحساب: " +
                (error.message || "خطأ غير معروف")
        };
    }
}

/* =====================================
   تسجيل الخروج
===================================== */

async function logout() {
    try {
        const { error } = await db.auth.signOut();

        if (error) {
            console.error("LOGOUT ERROR:", error);

            return {
                success: false,
                message: error.message
            };
        }

        return {
            success: true,
            message: "تم تسجيل الخروج بنجاح."
        };

    } catch (error) {
        console.error("LOGOUT UNEXPECTED ERROR:", error);

        return {
            success: false,
            message: error.message || messages.generalError
        };
    }
}

/* =====================================
   التحقق من الجلسة
===================================== */

async function checkSession() {
    try {
        const { data, error } = await db.auth.getSession();

        if (error) {
            console.error("SESSION ERROR:", error);

            return {
                authenticated: false,
                error: error.message
            };
        }

        if (!data.session) {
            return {
                authenticated: false
            };
        }

        const result = await getProfile();

        if (!result.success) {
            return {
                authenticated: false,
                error: result.message
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

    } catch (error) {
        console.error("CHECK SESSION ERROR:", error);

        return {
            authenticated: false,
            error: error.message || messages.generalError
        };
    }
}

/* =====================================
   إتاحة وظائف المصادقة للتطبيق
===================================== */

window.SynapseAuth = {
    login,
    register,
    logout,
    getProfile,
    checkSession
};

console.log("SynapseMed Authentication module loaded.");

})();

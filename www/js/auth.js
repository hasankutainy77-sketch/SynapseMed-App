(function () {
"use strict";

const db = window.synapseDB;
const CACHE_KEY = "synapsemed_verified_profile_v1";

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

/* حفظ آخر بيانات حساب تم التحقق منه */
function saveVerifiedProfile(user, profile) {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
            userId: user.id,
            email: user.email || "",
            profile: profile,
            savedAt: Date.now()
        }));
    } catch (error) {
        console.warn("Could not cache verified profile:", error);
    }
}

/* استعادة البيانات المحفوظة */
function getCachedProfile(userId) {
    try {
        const cached = JSON.parse(
            localStorage.getItem(CACHE_KEY) || "null"
        );

        if (!cached || !cached.profile || cached.userId !== userId) {
            return null;
        }

        return cached;
    } catch (error) {
        return null;
    }
}

/* حذف البيانات المحفوظة */
function clearCachedProfile() {
    try {
        localStorage.removeItem(CACHE_KEY);
    } catch (error) {
        console.warn("Could not clear cached profile.");
    }
}

/* =====================================
   جلب بيانات المستخدم من الخادم
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

        saveVerifiedProfile(userData.user, profile);

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
            clearCachedProfile();
            await db.auth.signOut();

            return {
                success: false,
                status: "pending",
                message: messages.pending
            };
        }

        if (profile.status === "rejected") {
            clearCachedProfile();
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

        clearCachedProfile();

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

        if (!data.session || !data.session.user) {
            clearCachedProfile();

            return {
                authenticated: false
            };
        }

        const user = data.session.user;

        /*
         * عند انقطاع الإنترنت:
         * نستخدم آخر بيانات حساب تم التحقق منه بنجاح.
         */
        if (!navigator.onLine) {
            const cached = getCachedProfile(user.id);

            if (!cached) {
                return {
                    authenticated: false,
                    offline: true,
                    error: "لا توجد بيانات حساب محفوظة لهذا المستخدم."
                };
            }

            const profile = cached.profile;

            if (
                profile.role !== "admin" &&
                profile.status !== "approved"
            ) {
                clearCachedProfile();

                return {
                    authenticated: false
                };
            }

            return {
                authenticated: true,
                offline: true,
                approved: true,
                role: profile.role,
                status: profile.status,
                profile
            };
        }

        /*
         * عند وجود الإنترنت:
         * نتحقق من الحساب وحالته من Supabase.
         */
        const result = await getProfile();

        if (!result.success) {
            /*
             * إذا انقطع الاتصال أثناء التحقق،
             * نحاول استخدام البيانات المحفوظة.
             */
            if (!navigator.onLine) {
                const cached = getCachedProfile(user.id);

                if (cached) {
                    return {
                        authenticated: true,
                        offline: true,
                        approved: true,
                        role: cached.profile.role,
                        status: cached.profile.status,
                        profile: cached.profile
                    };
                }
            }

            return {
                authenticated: false,
                error: result.message
            };
        }

        const profile = result.profile;

        if (
            profile.role !== "admin" &&
            profile.status !== "approved"
        ) {
            clearCachedProfile();

            return {
                authenticated: true,
                approved: false,
                role: profile.role,
                status: profile.status,
                profile
            };
        }

        return {
            authenticated: true,
            approved: true,
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

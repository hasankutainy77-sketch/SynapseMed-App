(function () {
"use strict";

const db = window.synapseDB;

if (!db) {
    console.error("SynapseMed: Supabase not found.");
    return;
}

const style = document.createElement("style");

style.textContent = `
    #adminStudentsButton {
        position: fixed;
        bottom: 22px;
        left: 18px;
        z-index: 9998;
        border: 0;
        border-radius: 14px;
        padding: 13px 18px;
        background: #0d9488;
        color: white;
        font-weight: bold;
        cursor: pointer;
        box-shadow: 0 5px 20px #0005;
        display: none;
    }

    #adminStudentsPanel {
        position: fixed;
        inset: 0;
        z-index: 9999;
        background: #07111f;
        color: #f1f5f9;
        padding: 22px;
        overflow-y: auto;
        display: none;
        direction: rtl;
        font-family: Arial, sans-serif;
    }

    .admin-panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        margin-bottom: 24px;
    }

    .admin-panel-header h2 {
        color: #5eead4;
        margin: 0;
    }

    .admin-close,
    .admin-refresh {
        border: 0;
        border-radius: 9px;
        padding: 10px 14px;
        cursor: pointer;
        font-weight: bold;
    }

    .admin-close {
        background: #334155;
        color: white;
    }

    .admin-refresh {
        background: #0f766e;
        color: white;
        margin-bottom: 18px;
    }

    .admin-student-card {
        background: #142337;
        border: 1px solid #263b52;
        border-radius: 14px;
        padding: 17px;
        margin-bottom: 14px;
    }

    .admin-student-card h3 {
        margin: 0 0 10px;
        color: #ccfbf1;
    }

    .admin-student-card p {
        color: #cbd5e1;
        font-size: 14px;
        overflow-wrap: anywhere;
    }

    .admin-actions {
        display: flex;
        gap: 10px;
        margin-top: 15px;
    }

    .admin-approve,
    .admin-reject {
        flex: 1;
        border: 0;
        border-radius: 9px;
        padding: 12px;
        color: white;
        font-weight: bold;
        cursor: pointer;
    }

    .admin-approve {
        background: #15803d;
    }

    .admin-reject {
        background: #b91c1c;
    }

    .admin-message {
        color: #cbd5e1;
        padding: 20px 5px;
        text-align: center;
    }
`;

document.head.appendChild(style);

const button = document.createElement("button");
button.id = "adminStudentsButton";
button.textContent = "👥 طلبات الطلاب";

const panel = document.createElement("section");
panel.id = "adminStudentsPanel";

panel.innerHTML = `
    <div class="admin-panel-header">
        <h2>إدارة طلبات الطلاب</h2>
        <button class="admin-close" id="adminClosePanel">
            إغلاق ✕
        </button>
    </div>

    <button class="admin-refresh" id="adminRefresh">
        تحديث الطلبات ↻
    </button>

    <div id="adminStudentsList">
        <p class="admin-message">جارٍ تحميل الطلبات...</p>
    </div>
`;

document.body.append(button, panel);

const list = panel.querySelector("#adminStudentsList");

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (char) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        }[char];
    });
}

async function loadStudents() {
    list.innerHTML = `
        <p class="admin-message">جارٍ تحميل الطلبات...</p>
    `;

    const { data, error } = await db.rpc(
        "admin_get_pending_students"
    );

    if (error) {
        console.error("Admin students error:", error);

        list.innerHTML = `
            <p class="admin-message">
                تعذر تحميل الطلبات. تحقق من الاتصال والصلاحيات.
            </p>
        `;
        return;
    }

    if (!data || data.length === 0) {
        list.innerHTML = `
            <p class="admin-message">
                لا توجد طلبات انضمام معلّقة حالياً.
            </p>
        `;
        return;
    }

    list.innerHTML = data.map(student => `
        <article class="admin-student-card">
            <h3>${escapeHTML(student.display_name || "طالب جديد")}</h3>

            <p>📧 البريد: ${escapeHTML(student.email)}</p>

            <p>🕒 تاريخ التسجيل:
                ${escapeHTML(
                    student.created_at
                        ? new Date(student.created_at).toLocaleString("ar")
                        : "غير متوفر"
                )}
            </p>

            <div class="admin-actions">
                <button
                    class="admin-approve"
                    data-id="${escapeHTML(student.user_id)}"
                    data-status="approved">
                    ✓ موافقة
                </button>

                <button
                    class="admin-reject"
                    data-id="${escapeHTML(student.user_id)}"
                    data-status="rejected">
                    ✕ رفض
                </button>
            </div>
        </article>
    `).join("");
}

async function reviewStudent(userId, status) {
    const action = status === "approved" ? "الموافقة على" : "رفض";

    if (!confirm(`هل تريد ${action} طلب هذا الطالب؟`)) {
        return;
    }

    const buttons = panel.querySelectorAll(
        `[data-id="${userId}"]`
    );

    buttons.forEach(btn => btn.disabled = true);

    const { error } = await db.rpc(
        "admin_review_student",
        {
            p_user_id: userId,
            p_status: status
        }
    );

    if (error) {
        console.error("Review student error:", error);
        alert("تعذر تنفيذ العملية. يرجى المحاولة مجدداً.");
        buttons.forEach(btn => btn.disabled = false);
        return;
    }

    alert(
        status === "approved"
            ? "تمت الموافقة على الطالب بنجاح."
            : "تم رفض طلب الطالب."
    );

    await loadStudents();
}

list.addEventListener("click", function (event) {
    const btn = event.target.closest("[data-id]");

    if (!btn) return;

    reviewStudent(
        btn.dataset.id,
        btn.dataset.status
    );
});

button.addEventListener("click", async function () {
    panel.style.display = "block";
    await loadStudents();
});

panel.querySelector("#adminClosePanel").addEventListener(
    "click",
    function () {
        panel.style.display = "none";
    }
);

panel.querySelector("#adminRefresh").addEventListener(
    "click",
    loadStudents
);

// هذه الدالة يمكن استدعاؤها بعد تسجيل الدخول أو الخروج.
async function refreshAdminVisibility() {
    try {
        if (!window.SynapseAuth) {
            button.style.display = "none";
            return;
        }

        const result = await window.SynapseAuth.checkSession();

        const isAdmin =
            result.authenticated &&
            result.approved &&
            result.role === "admin";

        button.style.display = isAdmin ? "block" : "none";

        if (!isAdmin) {
            panel.style.display = "none";
        }

    } catch (error) {
        console.error("Admin visibility check failed:", error);
        button.style.display = "none";
        panel.style.display = "none";
    }
}

// نجعل الدالة متاحة لملف index.html.
window.SynapseAdmin = {
    refresh: refreshAdminVisibility
};

// الفحص الأول عند تحميل التطبيق.
refreshAdminVisibility();

console.log("SynapseMed Admin Panel loaded.");

})();

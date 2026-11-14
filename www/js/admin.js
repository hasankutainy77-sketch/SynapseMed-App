(function () {
"use strict";

const db = window.synapseDB;

if (!db) {
    console.error("SynapseMed: Supabase not found.");
    return;
}

/* CLEAN OLD FLOATING BUTTONS */

document.getElementById("adminStudentsButton")?.remove();
document.getElementById("synapse-admin-button")?.remove();

/* STYLES */

const style = document.createElement("style");

style.textContent = `
#adminToolbar {
    display:none;
    margin:18px 0 22px;
    padding:15px;
    background:linear-gradient(135deg,#142c3d,#101b2c);
    border:1px solid rgba(36,214,193,.25);
    border-radius:17px;
    gap:10px;
    flex-wrap:wrap;
}

#adminToolbar.visible {
    display:flex;
}

.admin-toolbar-title {
    width:100%;
    color:#24d6c1;
    font-size:13px;
    font-weight:800;
    margin-bottom:3px;
}

.admin-toolbar-btn {
    flex:1;
    min-width:130px;
    border:1px solid rgba(36,214,193,.2);
    border-radius:11px;
    padding:12px 10px;
    background:rgba(36,214,193,.09);
    color:#24d6c1;
    font-weight:800;
    font-size:12px;
    cursor:pointer;
}

.admin-toolbar-btn:active {
    transform:scale(.98);
}

#adminStudentsPanel {
    position:fixed;
    inset:0;
    z-index:9999;
    background:#07111f;
    color:#f1f5f9;
    padding:22px;
    overflow-y:auto;
    display:none;
    direction:rtl;
    font-family:Arial,sans-serif;
}

.admin-panel-header {
    display:flex;
    justify-content:space-between;
    align-items:center;
    gap:12px;
    margin-bottom:24px;
}

.admin-panel-header h2 {
    color:#5eead4;
    margin:0;
    font-size:19px;
}

.admin-close,
.admin-refresh {
    border:0;
    border-radius:9px;
    padding:10px 14px;
    cursor:pointer;
    font-weight:bold;
}

.admin-close {
    background:#334155;
    color:white;
}

.admin-refresh {
    background:#0f766e;
    color:white;
    margin-bottom:18px;
}

.admin-student-card {
    background:#142337;
    border:1px solid #263b52;
    border-radius:14px;
    padding:17px;
    margin-bottom:14px;
}

.admin-student-card h3 {
    margin:0 0 10px;
    color:#ccfbf1;
}

.admin-student-card p {
    color:#cbd5e1;
    font-size:14px;
    overflow-wrap:anywhere;
    line-height:1.8;
}

.admin-actions {
    display:flex;
    gap:10px;
    margin-top:15px;
}

.admin-approve,
.admin-reject {
    flex:1;
    border:0;
    border-radius:9px;
    padding:12px;
    color:white;
    font-weight:bold;
    cursor:pointer;
}

.admin-approve {
    background:#15803d;
}

.admin-reject {
    background:#b91c1c;
}

.admin-message {
    color:#cbd5e1;
    padding:20px 5px;
    text-align:center;
    line-height:1.8;
}

.admin-approve:disabled,
.admin-reject:disabled {
    opacity:.5;
    cursor:wait;
}
`;

document.head.appendChild(style);

/* REMOVE OLD ELEMENTS AGAIN */

document.getElementById("adminStudentsButton")?.remove();

/* ADMIN TOOLBAR */

const toolbar = document.createElement("section");

toolbar.id = "adminToolbar";

toolbar.innerHTML = `
    <div class="admin-toolbar-title">
        ⚙️ لوحة إدارة SynapseMed
    </div>

    <button
        type="button"
        class="admin-toolbar-btn"
        id="adminOpenStudents">
        👥 طلبات الطلاب
    </button>

    <button
        type="button"
        class="admin-toolbar-btn"
        id="adminOpenSimulators">
        🧠 إدارة المحاكيات
    </button>
`;

/* INSERT TOOLBAR INSIDE MAIN */

const main = document.querySelector("main.container");

if (main) {
    main.prepend(toolbar);
} else {
    console.error("SynapseMed: Main container not found.");
}

/* STUDENTS PANEL */

const panel = document.createElement("section");

panel.id = "adminStudentsPanel";

panel.innerHTML = `
    <div class="admin-panel-header">
        <h2>إدارة طلبات الطلاب</h2>

        <button
            class="admin-close"
            id="adminClosePanel"
            type="button">
            إغلاق ✕
        </button>
    </div>

    <button
        class="admin-refresh"
        id="adminRefresh"
        type="button">
        تحديث الطلبات ↻
    </button>

    <div id="adminStudentsList">
        <p class="admin-message">
            جارٍ تحميل الطلبات...
        </p>
    </div>
`;

document.body.appendChild(panel);

const list = panel.querySelector("#adminStudentsList");

/* HTML ESCAPING */

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

/* LOAD STUDENTS */

async function loadStudents() {

    list.innerHTML = `
        <p class="admin-message">
            جارٍ تحميل الطلبات...
        </p>
    `;

    try {

        const { data, error } = await db.rpc(
            "admin_get_pending_students"
        );

        if (error) {
            throw error;
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

                <h3>
                    ${escapeHTML(student.display_name || "طالب جديد")}
                </h3>

                <p>
                    📧 البريد:
                    ${escapeHTML(student.email)}
                </p>

                <p>
                    🕒 تاريخ التسجيل:
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
                        data-status="approved"
                        type="button">
                        ✓ موافقة
                    </button>

                    <button
                        class="admin-reject"
                        data-id="${escapeHTML(student.user_id)}"
                        data-status="rejected"
                        type="button">
                        ✕ رفض
                    </button>

                </div>

            </article>

        `).join("");

    } catch (error) {

        console.error("Admin students error:", error);

        list.innerHTML = `
            <p class="admin-message">
                تعذر تحميل الطلبات.
                تحقق من الاتصال والصلاحيات.
            </p>
        `;

    }

}

/* REVIEW STUDENT */

async function reviewStudent(userId, status) {

    const action = status === "approved"
        ? "الموافقة على"
        : "رفض";

    if (!confirm(`هل تريد ${action} طلب هذا الطالب؟`)) {
        return;
    }

    const buttons = panel.querySelectorAll(
        `[data-id="${userId}"]`
    );

    buttons.forEach(button => {
        button.disabled = true;
    });

    try {

        const { error } = await db.rpc(
            "admin_review_student",
            {
                p_user_id: userId,
                p_status: status
            }
        );

        if (error) {
            throw error;
        }

        alert(
            status === "approved"
                ? "تمت الموافقة على الطالب بنجاح."
                : "تم رفض طلب الطالب."
        );

        await loadStudents();

    } catch (error) {

        console.error("Review student error:", error);

        alert("تعذر تنفيذ العملية. يرجى المحاولة مجدداً.");

        buttons.forEach(button => {
            button.disabled = false;
        });

    }

}

/* STUDENT ACTIONS */

list.addEventListener("click", function (event) {

    const button = event.target.closest("[data-id]");

    if (!button) return;

    reviewStudent(
        button.dataset.id,
        button.dataset.status
    );

});

/* OPEN STUDENTS */

toolbar.querySelector("#adminOpenStudents")
    .addEventListener("click", async function () {

        panel.style.display = "block";

        await loadStudents();

    });

/* CLOSE PANEL */

panel.querySelector("#adminClosePanel")
    .addEventListener("click", function () {

        panel.style.display = "none";

    });

/* REFRESH STUDENTS */

panel.querySelector("#adminRefresh")
    .addEventListener("click", loadStudents);

/* SIMULATOR MANAGEMENT */

toolbar.querySelector("#adminOpenSimulators")
    .addEventListener("click", function () {

        alert("إدارة المحاكيات قيد التجهيز.");

    });

/* ADMIN VISIBILITY */

async function refreshAdminVisibility() {

    try {

        if (!window.SynapseAuth) {

            toolbar.classList.remove("visible");

            return;
        }

        const result = await window.SynapseAuth.checkSession();

        const isAdmin =
            result.authenticated &&
            result.approved &&
            result.role === "admin";

        toolbar.classList.toggle("visible", isAdmin);

        if (!isAdmin) {
            panel.style.display = "none";
        }

    } catch (error) {

        console.error("Admin visibility check failed:", error);

        toolbar.classList.remove("visible");

        panel.style.display = "none";

    }

}

/* PUBLIC API */

window.SynapseAdmin = {
    refresh: refreshAdminVisibility,
    open: function () {
        panel.style.display = "block";
        loadStudents();
    }
};

/* INITIAL CHECK */

refreshAdminVisibility();

console.log("SynapseMed Admin Panel loaded.");

})();

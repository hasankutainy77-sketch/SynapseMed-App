(function () {
"use strict";

const db = window.synapseDB;

if (!db) {
    console.error("SynapseMed: Supabase not found.");
    return;
}

/* CLEAN OLD BUTTONS */

document.getElementById("adminStudentsButton")?.remove();
document.getElementById("synapse-admin-button")?.remove();
document.getElementById("adminToolbar")?.remove();
document.getElementById("adminStudentsPanel")?.remove();
document.getElementById("adminSimulatorsPanel")?.remove();

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

.admin-full-panel {
    position:fixed;
    inset:0;
    z-index:9999;
    background:#07111f;
    color:#f1f5f9;
    padding:18px;
    overflow-y:auto;
    display:none;
    direction:rtl;
    font-family:Arial,sans-serif;
}

.admin-panel-header {
    display:flex;
    justify-content:space-between;
    align-items:center;
    gap:10px;
    margin-bottom:20px;
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
    color:white;
}

.admin-close {
    background:#334155;
}

.admin-refresh {
    background:#0f766e;
    margin-bottom:15px;
}

.admin-message {
    color:#cbd5e1;
    padding:20px 5px;
    text-align:center;
    line-height:1.8;
}

.admin-student-card,
.admin-sim-card,
.admin-form-box,
.admin-category-box {
    background:#142337;
    border:1px solid #263b52;
    border-radius:14px;
    padding:15px;
    margin-bottom:14px;
}

.admin-student-card h3,
.admin-sim-card h3 {
    margin:0 0 10px;
    color:#ccfbf1;
    font-size:16px;
}

.admin-student-card p,
.admin-sim-card p {
    color:#cbd5e1;
    font-size:13px;
    line-height:1.8;
    overflow-wrap:anywhere;
}

.admin-actions {
    display:flex;
    flex-wrap:wrap;
    gap:8px;
    margin-top:13px;
}

.admin-actions button {
    flex:1;
    min-width:85px;
    border:0;
    border-radius:9px;
    padding:11px 8px;
    color:white;
    font-weight:bold;
    cursor:pointer;
}

.admin-approve { background:#15803d; }
.admin-reject { background:#b91c1c; }
.admin-edit { background:#2563eb; }
.admin-delete { background:#991b1b; }
.admin-publish { background:#0f766e; }
.admin-hide { background:#475569; }

.admin-field {
    margin-bottom:13px;
}

.admin-field label {
    display:block;
    color:#cbd5e1;
    font-size:13px;
    margin-bottom:7px;
    font-weight:bold;
}

.admin-field input,
.admin-field textarea,
.admin-field select {
    width:100%;
    box-sizing:border-box;
    border:1px solid #334155;
    border-radius:10px;
    background:#0b1728;
    color:white;
    padding:12px;
    font-size:14px;
    outline:none;
}

.admin-field textarea {
    min-height:85px;
    resize:vertical;
}

.admin-primary-btn {
    width:100%;
    border:0;
    border-radius:10px;
    background:#0f766e;
    color:white;
    padding:14px;
    font-weight:bold;
    cursor:pointer;
    margin-top:5px;
}

.admin-secondary-btn {
    width:100%;
    border:1px solid #475569;
    border-radius:10px;
    background:#26374b;
    color:white;
    padding:12px;
    font-weight:bold;
    cursor:pointer;
    margin-top:8px;
}

.admin-section-title {
    color:#5eead4;
    font-size:16px;
    margin:22px 0 13px;
}

.admin-status {
    display:inline-block;
    padding:5px 9px;
    border-radius:7px;
    font-size:11px;
    font-weight:bold;
}

.admin-status.published {
    background:#14532d;
    color:#bbf7d0;
}

.admin-status.hidden {
    background:#713f12;
    color:#fde68a;
}

.admin-count {
    color:#94a3b8;
    font-size:12px;
    margin-bottom:12px;
}

.admin-actions button:disabled,
.admin-primary-btn:disabled {
    opacity:.5;
    cursor:wait;
}
`;

document.head.appendChild(style);

/* ADMIN TOOLBAR */

const toolbar = document.createElement("section");

toolbar.id = "adminToolbar";

toolbar.innerHTML = `
    <div class="admin-toolbar-title">
        ⚙️ لوحة إدارة SynapseMed
    </div>

    <button type="button"
        class="admin-toolbar-btn"
        id="adminOpenStudents">
        👥 طلبات الطلاب
    </button>

    <button type="button"
        class="admin-toolbar-btn"
        id="adminOpenSimulators">
        🧠 إدارة المحاكيات
    </button>
`;

const main = document.querySelector("main.container");

if (main) {
    main.prepend(toolbar);
} else {
    console.error("SynapseMed: Main container not found.");
}

/* STUDENTS PANEL */

const studentsPanel = document.createElement("section");

studentsPanel.id = "adminStudentsPanel";
studentsPanel.className = "admin-full-panel";

studentsPanel.innerHTML = `
    <div class="admin-panel-header">
        <h2>إدارة طلبات الطلاب</h2>
        <button class="admin-close" id="adminCloseStudents">
            إغلاق ✕
        </button>
    </div>

    <button class="admin-refresh" id="adminRefreshStudents">
        تحديث الطلبات ↻
    </button>

    <div id="adminStudentsList">
        <p class="admin-message">جارٍ تحميل الطلبات...</p>
    </div>
`;

document.body.appendChild(studentsPanel);

const studentsList =
    studentsPanel.querySelector("#adminStudentsList");

/* SIMULATORS PANEL */

const simulatorsPanel = document.createElement("section");

simulatorsPanel.id = "adminSimulatorsPanel";
simulatorsPanel.className = "admin-full-panel";

simulatorsPanel.innerHTML = `
    <div class="admin-panel-header">
        <h2>🧠 إدارة المحاكيات</h2>
        <button class="admin-close" id="adminCloseSimulators">
            إغلاق ✕
        </button>
    </div>

    <button class="admin-refresh" id="adminRefreshSimulators">
        تحديث القائمة ↻
    </button>

    <button class="admin-primary-btn" id="adminAddSimulator">
        ＋ إضافة محاكاة جديدة
    </button>

    <div id="adminSimulatorForm" style="display:none;margin-top:18px;">
        <div class="admin-form-box">

            <h3 id="adminFormTitle" style="color:#5eead4;">
                إضافة محاكاة
            </h3>

            <form id="adminSimulatorFormElement">

                <div class="admin-field">
                    <label>اسم المحاكاة *</label>
                    <input id="simTitle" required maxlength="150"
                        placeholder="مثال: Acute Appendicitis">
                </div>

                <div class="admin-field">
                    <label>الوصف</label>
                    <textarea id="simDescription"
                        placeholder="وصف مختصر للمحاكاة"></textarea>
                </div>

                <div class="admin-field">
                    <label>التصنيف</label>
                    <select id="simCategory">
                        <option value="">بدون تصنيف</option>
                    </select>
                </div>

                <div class="admin-field">
                    <label>مسار ملف HTML *</label>
                    <input id="simPath" required
                        placeholder="simulators/clinical-sim.html">
                </div>

                <div class="admin-field">
                    <label>مسار الصورة المصغرة (اختياري)</label>
                    <input id="simThumbnail"
                        placeholder="images/appendix.jpg">
                </div>

                <div class="admin-field">
                    <label>
                        <input type="checkbox" id="simPublished" checked>
                        نشر المحاكاة للطلاب
                    </label>
                </div>

                <button class="admin-primary-btn" type="submit"
                    id="adminSaveSimulator">
                    حفظ المحاكاة
                </button>

                <button class="admin-secondary-btn" type="button"
                    id="adminCancelSimulator">
                    إلغاء
                </button>

            </form>
        </div>
    </div>

    <h3 class="admin-section-title">📚 قائمة المحاكيات</h3>

    <div id="adminSimulatorsList">
        <p class="admin-message">جارٍ تحميل المحاكيات...</p>
    </div>

    <h3 class="admin-section-title">📂 إدارة التصنيفات</h3>

    <div class="admin-category-box">

        <div class="admin-field">
            <label>اسم التصنيف الجديد</label>
            <input id="newCategoryName"
                placeholder="مثال: Cardiology">
        </div>

        <div class="admin-field">
            <label>الأيقونة (اختياري)</label>
            <input id="newCategoryIcon"
                placeholder="❤️">
        </div>

        <button class="admin-primary-btn" id="adminAddCategory">
            إضافة تصنيف
        </button>

        <div id="adminCategoriesList" style="margin-top:15px;">
        </div>

    </div>
`;

document.body.appendChild(simulatorsPanel);

const simulatorList =
    simulatorsPanel.querySelector("#adminSimulatorsList");

const categorySelect =
    simulatorsPanel.querySelector("#simCategory");

const simulatorForm =
    simulatorsPanel.querySelector("#adminSimulatorForm");

const simulatorFormElement =
    simulatorsPanel.querySelector("#adminSimulatorFormElement");

let categories = [];
let simulators = [];
let editingSimulatorId = null;

/* HELPERS */

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

function showMessage(element, message) {
    element.innerHTML = `
        <p class="admin-message">${escapeHTML(message)}</p>
    `;
}

/* STUDENT REQUESTS */

async function loadStudents() {

    showMessage(studentsList, "جارٍ تحميل الطلبات...");

    try {
        const { data, error } = await db.rpc(
            "admin_get_pending_students"
        );

        if (error) throw error;

        if (!data || !data.length) {
            showMessage(
                studentsList,
                "لا توجد طلبات انضمام معلّقة حالياً."
            );
            return;
        }

        studentsList.innerHTML = data.map(student => `
            <article class="admin-student-card">

                <h3>${escapeHTML(
                    student.display_name || "طالب جديد"
                )}</h3>

                <p>📧 البريد: ${escapeHTML(student.email)}</p>

                <p>🕒 تاريخ التسجيل:
                    ${escapeHTML(
                        student.created_at
                            ? new Date(student.created_at).toLocaleString("ar")
                            : "غير متوفر"
                    )}
                </p>

                <div class="admin-actions">

                    <button class="admin-approve"
                        data-student-id="${escapeHTML(student.user_id)}"
                        data-status="approved">
                        ✓ موافقة
                    </button>

                    <button class="admin-reject"
                        data-student-id="${escapeHTML(student.user_id)}"
                        data-status="rejected">
                        ✕ رفض
                    </button>

                </div>

            </article>
        `).join("");

    } catch (error) {
        console.error(error);
        showMessage(
            studentsList,
            "تعذر تحميل الطلبات. تحقق من الاتصال والصلاحيات."
        );
    }
}

async function reviewStudent(userId, status) {

    const action = status === "approved" ? "الموافقة على" : "رفض";

    if (!confirm(`هل تريد ${action} طلب هذا الطالب؟`)) return;

    try {
        const { error } = await db.rpc(
            "admin_review_student",
            {
                p_user_id: userId,
                p_status: status
            }
        );

        if (error) throw error;

        alert(
            status === "approved"
                ? "تمت الموافقة على الطالب."
                : "تم رفض الطلب."
        );

        await loadStudents();

    } catch (error) {
        console.error(error);
        alert("تعذر تنفيذ العملية.");
    }
}

/* LOAD CATEGORIES */

async function loadCategories() {

    const { data, error } = await db
        .from("categories")
        .select("id,name,icon,sort_order")
        .order("sort_order", { ascending: true });

    if (error) throw error;

    categories = data || [];

    categorySelect.innerHTML =
        `<option value="">بدون تصنيف</option>` +
        categories.map(category => `
            <option value="${escapeHTML(category.id)}">
                ${escapeHTML(category.icon || "📁")}
                ${escapeHTML(category.name)}
            </option>
        `).join("");

    renderCategories();
}

/* RENDER CATEGORIES */

function renderCategories() {

    const box = simulatorsPanel.querySelector(
        "#adminCategoriesList"
    );

    if (!categories.length) {
        showMessage(box, "لا توجد تصنيفات.");
        return;
    }

    box.innerHTML = categories.map(category => `
        <div style="
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:8px;
            padding:10px;
            border-bottom:1px solid #334155;
        ">

            <span>
                ${escapeHTML(category.icon || "📁")}
                ${escapeHTML(category.name)}
            </span>

            <div style="display:flex;gap:6px;">

                <button class="admin-edit"
                    data-category-edit="${escapeHTML(category.id)}"
                    style="border:0;border-radius:7px;padding:8px;color:white;">
                    تعديل
                </button>

                <button class="admin-delete"
                    data-category-delete="${escapeHTML(category.id)}"
                    style="border:0;border-radius:7px;padding:8px;color:white;">
                    حذف
                </button>

            </div>

        </div>
    `).join("");
}

/* ADD CATEGORY */

async function addCategory() {

    const nameInput = simulatorsPanel.querySelector("#newCategoryName");
    const iconInput = simulatorsPanel.querySelector("#newCategoryIcon");

    const name = nameInput.value.trim();
    const icon = iconInput.value.trim();

    if (!name) {
        alert("يرجى إدخال اسم التصنيف.");
        return;
    }

    try {
        const nextOrder = categories.length
            ? Math.max(...categories.map(c => c.sort_order || 0)) + 1
            : 1;

        const { error } = await db
            .from("categories")
            .insert({
                name,
                icon: icon || null,
                sort_order: nextOrder
            });

        if (error) throw error;

        nameInput.value = "";
        iconInput.value = "";

        await loadCategories();

        alert("تمت إضافة التصنيف.");

    } catch (error) {
        console.error(error);
        alert("تعذرت إضافة التصنيف: " + error.message);
    }
}

/* EDIT CATEGORY */

async function editCategory(id) {

    const category = categories.find(item => item.id === id);

    if (!category) return;

    const name = prompt("اسم التصنيف:", category.name);

    if (name === null) return;

    if (!name.trim()) {
        alert("اسم التصنيف لا يمكن أن يكون فارغاً.");
        return;
    }

    const icon = prompt(
        "أيقونة التصنيف:",
        category.icon || ""
    );

    if (icon === null) return;

    try {
        const { error } = await db
            .from("categories")
            .update({
                name: name.trim(),
                icon: icon.trim() || null
            })
            .eq("id", id);

        if (error) throw error;

        await loadCategories();

        alert("تم تعديل التصنيف.");

    } catch (error) {
        console.error(error);
        alert("تعذر تعديل التصنيف: " + error.message);
    }
}

/* DELETE CATEGORY */

async function deleteCategory(id) {

    const category = categories.find(item => item.id === id);

    if (!category) return;

    if (!confirm(
        `هل تريد حذف التصنيف "${category.name}"؟`
    )) return;

    try {
        const { error } = await db
            .from("categories")
            .delete()
            .eq("id", id);

        if (error) throw error;

        await loadCategories();

        alert("تم حذف التصنيف.");

    } catch (error) {
        console.error(error);
        alert(
            "تعذر حذف التصنيف. قد يكون مرتبطاً بمحاكيات موجودة.\n" +
            error.message
        );
    }
}

/* LOAD SIMULATORS */

async function loadSimulators() {

    showMessage(simulatorList, "جارٍ تحميل المحاكيات...");

    try {
        const { data, error } = await db
            .from("simulators")
            .select(`
                id,
                title,
                description,
                category_id,
                file_path,
                thumbnail_path,
                is_published,
                created_at,
                updated_at
            `)
            .order("created_at", { ascending: false });

        if (error) throw error;

        simulators = data || [];

        renderSimulators();

    } catch (error) {
        console.error(error);

        showMessage(
            simulatorList,
            "تعذر تحميل المحاكيات. تحقق من صلاحيات المدير."
        );
    }
}

/* RENDER SIMULATORS */

function renderSimulators() {

    if (!simulators.length) {
        showMessage(
            simulatorList,
            "لا توجد محاكيات في قاعدة البيانات حالياً."
        );
        return;
    }

    simulatorList.innerHTML = `
        <div class="admin-count">
            إجمالي المحاكيات: ${simulators.length}
        </div>
    ` + simulators.map(simulator => {

        const category = categories.find(
            item => item.id === simulator.category_id
        );

        return `
            <article class="admin-sim-card">

                <h3>${escapeHTML(simulator.title)}</h3>

                <p>
                    📂 التصنيف:
                    ${escapeHTML(category?.name || "بدون تصنيف")}
                </p>

                <p>
                    📁 الملف:
                    ${escapeHTML(simulator.file_path)}
                </p>

                <p>
                    ${escapeHTML(
                        simulator.description || "لا يوجد وصف."
                    )}
                </p>

                <span class="admin-status ${
                    simulator.is_published ? "published" : "hidden"
                }">
                    ${
                        simulator.is_published
                            ? "منشورة للطلاب"
                            : "مخفية"
                    }
                </span>

                <div class="admin-actions">

                    <button class="admin-edit"
                        data-simulator-edit="${escapeHTML(simulator.id)}">
                        ✏️ تعديل
                    </button>

                    <button class="${
                        simulator.is_published
                            ? "admin-hide"
                            : "admin-publish"
                    }"
                        data-simulator-toggle="${escapeHTML(simulator.id)}">
                        ${
                            simulator.is_published
                                ? "إخفاء"
                                : "نشر"
                        }
                    </button>

                    <button class="admin-delete"
                        data-simulator-delete="${escapeHTML(simulator.id)}">
                        🗑️ حذف
                    </button>

                </div>

            </article>
        `;

    }).join("");
}

/* RESET FORM */

function resetSimulatorForm() {

    editingSimulatorId = null;

    simulatorFormElement.reset();

    simulatorsPanel.querySelector("#adminFormTitle").textContent =
        "إضافة محاكاة";

    simulatorsPanel.querySelector("#adminSaveSimulator").textContent =
        "حفظ المحاكاة";

    simulatorForm.style.display = "none";
}

/* OPEN ADD FORM */

function openAddSimulatorForm() {

    resetSimulatorForm();

    simulatorForm.style.display = "block";

    simulatorsPanel.querySelector("#simPublished").checked = true;

    simulatorForm.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

/* OPEN EDIT FORM */

function openEditSimulator(id) {

    const simulator = simulators.find(item => item.id === id);

    if (!simulator) return;

    editingSimulatorId = id;

    simulatorsPanel.querySelector("#simTitle").value =
        simulator.title || "";

    simulatorsPanel.querySelector("#simDescription").value =
        simulator.description || "";

    simulatorsPanel.querySelector("#simCategory").value =
        simulator.category_id || "";

    simulatorsPanel.querySelector("#simPath").value =
        simulator.file_path || "";

    simulatorsPanel.querySelector("#simThumbnail").value =
        simulator.thumbnail_path || "";

    simulatorsPanel.querySelector("#simPublished").checked =
        simulator.is_published;

    simulatorsPanel.querySelector("#adminFormTitle").textContent =
        "تعديل المحاكاة";

    simulatorsPanel.querySelector("#adminSaveSimulator").textContent =
        "حفظ التعديلات";

    simulatorForm.style.display = "block";

    simulatorForm.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

/* SAVE SIMULATOR */

async function saveSimulator(event) {

    event.preventDefault();

    const button =
        simulatorsPanel.querySelector("#adminSaveSimulator");

    const title =
        simulatorsPanel.querySelector("#simTitle").value.trim();

    const description =
        simulatorsPanel.querySelector("#simDescription").value.trim();

    const categoryId =
        simulatorsPanel.querySelector("#simCategory").value;

    const filePath =
        simulatorsPanel.querySelector("#simPath").value.trim();

    const thumbnailPath =
        simulatorsPanel.querySelector("#simThumbnail").value.trim();

    const isPublished =
        simulatorsPanel.querySelector("#simPublished").checked;

    if (!title || !filePath) {
        alert("الاسم ومسار الملف مطلوبان.");
        return;
    }

    const payload = {
        title,
        description: description || null,
        category_id: categoryId || null,
        file_path: filePath,
        thumbnail_path: thumbnailPath || null,
        is_published: isPublished,
        updated_at: new Date().toISOString()
    };

    button.disabled = true;
    button.textContent = "جارٍ الحفظ...";

    try {

        let result;

        if (editingSimulatorId) {

            result = await db
                .from("simulators")
                .update(payload)
                .eq("id", editingSimulatorId);

        } else {

            result = await db
                .from("simulators")
                .insert(payload);

        }

        if (result.error) throw result.error;

        alert(
            editingSimulatorId
                ? "تم تعديل المحاكاة بنجاح."
                : "تمت إضافة المحاكاة بنجاح."
        );

        resetSimulatorForm();

        await loadSimulators();

    } catch (error) {

        console.error(error);

        alert("تعذر حفظ المحاكاة:\n" + error.message);

    } finally {

        button.disabled = false;

        button.textContent = editingSimulatorId
            ? "حفظ التعديلات"
            : "حفظ المحاكاة";
    }
}

/* TOGGLE PUBLISH STATUS */

async function toggleSimulator(id) {

    const simulator = simulators.find(item => item.id === id);

    if (!simulator) return;

    const nextStatus = !simulator.is_published;

    if (!confirm(
        nextStatus
            ? "هل تريد نشر هذه المحاكاة للطلاب؟"
            : "هل تريد إخفاء هذه المحاكاة عن الطلاب؟"
    )) return;

    try {

        const { error } = await db
            .from("simulators")
            .update({
                is_published: nextStatus,
                updated_at: new Date().toISOString()
            })
            .eq("id", id);

        if (error) throw error;

        await loadSimulators();

        alert(
            nextStatus
                ? "تم نشر المحاكاة."
                : "تم إخفاء المحاكاة."
        );

    } catch (error) {

        console.error(error);

        alert("تعذر تغيير حالة النشر:\n" + error.message);

    }
}

/* DELETE SIMULATOR */

async function deleteSimulator(id) {

    const simulator = simulators.find(item => item.id === id);

    if (!simulator) return;

    if (!confirm(
        `هل أنت متأكد من حذف المحاكاة "${simulator.title}"؟\n` +
        "سيتم حذف سجلها من قاعدة البيانات."
    )) return;

    try {

        const { error } = await db
            .from("simulators")
            .delete()
            .eq("id", id);

        if (error) throw error;

        await loadSimulators();

        alert("تم حذف المحاكاة.");

    } catch (error) {

        console.error(error);

        alert("تعذر حذف المحاكاة:\n" + error.message);

    }
}

/* OPEN SIMULATOR MANAGER */

async function openSimulatorManager() {

    studentsPanel.style.display = "none";
    simulatorsPanel.style.display = "block";

    await loadCategories();
    await loadSimulators();

}

/* EVENT LISTENERS */

/* Toolbar */

toolbar.querySelector("#adminOpenStudents")
    .addEventListener("click", async function () {

        studentsPanel.style.display = "block";
        simulatorsPanel.style.display = "none";

        await loadStudents();

    });

toolbar.querySelector("#adminOpenSimulators")
    .addEventListener("click", openSimulatorManager);

/* Close */

studentsPanel.querySelector("#adminCloseStudents")
    .addEventListener("click", function () {
        studentsPanel.style.display = "none";
    });

simulatorsPanel.querySelector("#adminCloseSimulators")
    .addEventListener("click", function () {
        simulatorsPanel.style.display = "none";
    });

/* Refresh */

studentsPanel.querySelector("#adminRefreshStudents")
    .addEventListener("click", loadStudents);

simulatorsPanel.querySelector("#adminRefreshSimulators")
    .addEventListener("click", async function () {
        await loadCategories();
        await loadSimulators();
    });

/* Add simulator */

simulatorsPanel.querySelector("#adminAddSimulator")
    .addEventListener("click", openAddSimulatorForm);

simulatorsPanel.querySelector("#adminCancelSimulator")
    .addEventListener("click", resetSimulatorForm);

simulatorFormElement.addEventListener(
    "submit",
    saveSimulator
);

/* Add category */

simulatorsPanel.querySelector("#adminAddCategory")
    .addEventListener("click", addCategory);

/* Simulator actions */

simulatorList.addEventListener("click", function (event) {

    const editButton =
        event.target.closest("[data-simulator-edit]");

    const toggleButton =
        event.target.closest("[data-simulator-toggle]");

    const deleteButton =
        event.target.closest("[data-simulator-delete]");

    if (editButton) {
        openEditSimulator(editButton.dataset.simulatorEdit);
        return;
    }

    if (toggleButton) {
        toggleSimulator(toggleButton.dataset.simulatorToggle);
        return;
    }

    if (deleteButton) {
        deleteSimulator(deleteButton.dataset.simulatorDelete);
    }

});

/* Category actions */

simulatorsPanel.querySelector("#adminCategoriesList")
    .addEventListener("click", function (event) {

        const editButton =
            event.target.closest("[data-category-edit]");

        const deleteButton =
            event.target.closest("[data-category-delete]");

        if (editButton) {
            editCategory(editButton.dataset.categoryEdit);
            return;
        }

        if (deleteButton) {
            deleteCategory(deleteButton.dataset.categoryDelete);
        }

    });

/* Student actions */

studentsList.addEventListener("click", function (event) {

    const button = event.target.closest("[data-student-id]");

    if (!button) return;

    reviewStudent(
        button.dataset.studentId,
        button.dataset.status
    );

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
            studentsPanel.style.display = "none";
            simulatorsPanel.style.display = "none";
        }

    } catch (error) {

        console.error("Admin visibility check failed:", error);

        toolbar.classList.remove("visible");

        studentsPanel.style.display = "none";
        simulatorsPanel.style.display = "none";

    }

}

/* PUBLIC API */

window.SynapseAdmin = {
    refresh: refreshAdminVisibility,

    open: function () {
        studentsPanel.style.display = "block";
        loadStudents();
    },

    openSimulators: openSimulatorManager
};

/* INITIAL CHECK */

refreshAdminVisibility();

console.log("SynapseMed Admin Panel loaded.");

})();

/* AI to Doc — Pro wizard (subir -> mapear estilos -> conversión de prueba),
   contra los endpoints de pro_templates.py (ver CLAUDE.md §5.2). Un usuario
   'free' tiene derecho a 1 descarga real de prueba antes de que el backend
   empiece a devolver 402 — se refleja tal cual, sin difuminar ni fingir
   que el documento "está listo" cuando no lo está. Depende de shared.js
   (t, getAuthHeader, CONFIG, state, showLoadingIn/hideLoadingIn/withMinDuration)
   y de showLanding, ya cargados en index.html. */

const PRO_API = `${CONFIG.API_BASE_URL}/api/pro/templates`;
const MAPPING_SLOTS = ["heading_1", "heading_2", "heading_3", "table"];
const WIZARD_STEPS = ["step1", "step2", "step3"];

const wizard = {
  templates: [],
  view: "list", // list | step1 | step2 | step3
  currentId: null,
  currentName: "",
  availableStyles: [],
  mapping: {},
};

function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

async function fetchMyTemplates() {
  const headers = await getAuthHeader();
  const resp = await fetch(PRO_API, { headers });
  if (!resp.ok) return [];
  return resp.json();
}

// ---------------------------------------------------------------------
// Editar una plantilla ya subida: reabre el paso 2 (nombre + mapeo de
// estilos) sin tener que volver a subir el fichero (ver GET
// /api/pro/templates/{id} en pro_templates.py).
// ---------------------------------------------------------------------
async function openTemplateEditor(templateId) {
  const headers = await getAuthHeader();
  const resp = await fetch(`${PRO_API}/${templateId}`, { headers });
  if (!resp.ok) return;
  const data = await resp.json();
  wizard.currentId = data.id;
  wizard.currentName = data.name;
  wizard.availableStyles = data.available_styles;
  wizard.mapping = { ...data.style_mapping };
  wizard.view = "step2";
  paintWizard();
}

window.renderWizard = async function renderWizard() {
  wizard.templates = await fetchMyTemplates();
  wizard.view = "list";
  paintWizard();
};

// Deep-link desde el panel "Tu espacio Pro" de la home: abre el studio
// directamente en el paso de conversión de una plantilla concreta, sin
// pasar por la lista (a diferencia de showApp(), que resetea a "list").
window.openTemplateInStudio = function openTemplateInStudio(id, name) {
  wizard.currentId = id;
  wizard.currentName = name;
  wizard.view = "step3";
  document.getElementById("landing-view").classList.add("hidden");
  document.getElementById("app-view").classList.remove("hidden");
  paintWizard();
};

// ---------------------------------------------------------------------
// Shell "studio": barra oscura con título + stepper, cuerpo con la
// vista activa. Visualmente distinto de la landing de marketing, para
// que el área logueada se sienta como una herramienta de verdad.
// ---------------------------------------------------------------------
function paintWizard() {
  const root = document.getElementById("app-view");
  root.innerHTML = "";

  const shell = el("div", "bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden");

  const topbar = el("div", "flex items-center justify-between gap-4 px-6 py-5 bg-slate-900");
  const titleWrap = el("div");
  titleWrap.appendChild(el("p", "text-[11px] font-semibold uppercase tracking-wide text-emerald-400 mb-0.5", t("wizard.studioLabel")));
  titleWrap.appendChild(el("h1", "text-lg font-bold text-white", t("wizard.title")));
  const backBtn = el("button", "text-xs text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 rounded-full px-3 py-1.5 shrink-0", t("wizard.backToLanding"));
  backBtn.addEventListener("click", showLanding);
  topbar.append(titleWrap, backBtn);
  shell.appendChild(topbar);

  if (wizard.view !== "list") shell.appendChild(buildStepper());

  const body = el("div", "p-6 md:p-8");
  shell.appendChild(body);
  root.appendChild(shell);

  if (wizard.view === "list") paintList(body);
  else if (wizard.view === "step1") paintStep1(body);
  else if (wizard.view === "step2") paintStep2(body);
  else if (wizard.view === "step3") paintStep3(body);
}

function buildStepper() {
  const labels = [t("wizard.stepUpload"), t("wizard.stepMap"), t("wizard.stepConvert")];
  const currentIdx = WIZARD_STEPS.indexOf(wizard.view);

  const bar = el("div", "flex items-center px-6 py-4 bg-slate-50 border-b border-slate-200");
  labels.forEach((label, i) => {
    const done = i < currentIdx;
    const active = i === currentIdx;
    const item = el("div", "flex items-center gap-2 shrink-0");
    const circle = el(
      "span",
      "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold " +
        (active ? "bg-emerald-600 text-white" : done ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"),
      done ? "✓" : String(i + 1)
    );
    const labelEl = el("span", "text-xs font-semibold " + (active ? "text-slate-900" : "text-slate-400"), label);
    item.append(circle, labelEl);
    bar.appendChild(item);
    if (i < labels.length - 1) bar.appendChild(el("span", "flex-1 h-px bg-slate-200 mx-3"));
  });
  return bar;
}

function isPaidTier() {
  return state.tier === "pro" || state.tier === "enterprise";
}

// ---------------------------------------------------------------------
// Guía visual: los campos de Word (p.ej. un índice) de la plantilla del
// usuario no se recalculan al generar el .docx — es una limitación de Word
// en sí, no del conversor (build_docx no toca campos OOXML). Se avisa antes
// de convertir, con una animación en bucle (clic derecho -> Actualizar
// campos), en vez de dejar que el usuario lo descubra solo.
// ---------------------------------------------------------------------
function buildTocGuide() {
  const wrap = el("div", "flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5");

  const page = el("div", "ai2w-toc-page");
  page.appendChild(el("div", "ai2w-toc-line ai2w-toc-line-title"));
  const targetLine = el("div", "ai2w-toc-line ai2w-toc-line-target");
  const menu = el("div", "ai2w-toc-menu", t("wizard.tocGuideMenuItem"));
  targetLine.appendChild(menu);
  page.appendChild(targetLine);
  page.appendChild(el("div", "ai2w-toc-line", ""));
  const cursor = document.createElement("div");
  cursor.className = "ai2w-toc-cursor";
  cursor.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4 2l14 7-6 1.5L10 17z"/></svg>';
  page.appendChild(cursor);

  const textWrap = el("div");
  textWrap.appendChild(el("p", "text-sm font-semibold text-slate-800 mb-1", t("wizard.tocGuideTitle")));
  textWrap.appendChild(el("p", "text-xs text-slate-500", t("wizard.tocGuideDesc")));

  wrap.append(page, textWrap);
  return wrap;
}

function paintList(root) {
  root.appendChild(el("h2", "font-semibold text-slate-900 mb-4", t("wizard.myTemplatesTitle")));

  if (wizard.templates.length === 0) {
    root.appendChild(el("p", "text-sm text-slate-500 mb-6", t("wizard.noTemplates")));
  } else {
    const grid = el("div", "grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6");
    wizard.templates.forEach((tpl) => {
      const card = el("div", "border border-slate-200 rounded-xl p-4 hover:border-emerald-300 hover:shadow-sm transition flex flex-col gap-4");
      const head = el("div", "flex items-center gap-2 min-w-0");
      const icon = el("span", "w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm font-bold shrink-0", "W");
      const name = el("span", "text-sm font-semibold text-slate-800 truncate", tpl.name);
      head.append(icon, name);

      const actions = el("div", "flex gap-2");
      const useBtn = el("button", "flex-1 text-xs bg-slate-900 text-white font-semibold rounded-lg px-3 py-1.5", t("wizard.useBtn"));
      useBtn.addEventListener("click", () => {
        wizard.currentId = tpl.id;
        wizard.currentName = tpl.name;
        wizard.view = "step3";
        paintWizard();
      });

      const editBtn = el("button", "text-xs border border-slate-300 rounded-lg px-3 py-1.5 text-slate-600 hover:border-slate-400", t("wizard.editBtn"));
      editBtn.addEventListener("click", () => openTemplateEditor(tpl.id));

      const delBtn = el("button", "text-xs border border-slate-300 rounded-lg px-3 py-1.5 text-slate-500 hover:text-red-600 hover:border-red-300", t("wizard.deleteBtn"));
      delBtn.addEventListener("click", async () => {
        const headers = await getAuthHeader();
        await fetch(`${PRO_API}/${tpl.id}`, { method: "DELETE", headers });
        renderWizard();
      });

      actions.append(useBtn, editBtn, delBtn);
      card.append(head, actions);
      grid.appendChild(card);
    });
    root.appendChild(grid);
  }

  const newBtn = el("button", "bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg px-4 py-2 text-sm", t("wizard.newTemplateBtn"));
  newBtn.addEventListener("click", () => { wizard.view = "step1"; paintWizard(); });
  root.appendChild(newBtn);
}

function paintStep1(root) {
  root.appendChild(el("h2", "font-semibold text-slate-900 mb-1", t("wizard.step1Title")));
  root.appendChild(el("p", "text-sm text-slate-500 mb-4", t("wizard.step1Desc")));

  const nameLabel = el("label", "text-xs text-slate-500 block mb-1", t("wizard.nameLabel"));
  const nameInput = el("input", "w-full border border-slate-300 rounded-lg px-3 py-2 mb-4 text-sm");
  nameInput.type = "text";

  const fileInput = el("input", "block w-full text-sm mb-4");
  fileInput.type = "file";
  fileInput.accept = ".docx,.dotx";

  const errorEl = el("p", "text-red-600 text-xs mb-2 min-h-[1rem]");

  const uploadBtn = el("button", "bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg px-4 py-2 text-sm", t("wizard.uploadBtn"));
  uploadBtn.addEventListener("click", async () => {
    errorEl.textContent = "";
    const file = fileInput.files[0];
    if (!file) { errorEl.textContent = t("wizard.chooseFile"); return; }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", nameInput.value || file.name);
    const headers = await getAuthHeader();
    const resp = await fetch(PRO_API, { method: "POST", headers, body: formData });
    if (!resp.ok) {
      const payload = await resp.json().catch(() => ({}));
      errorEl.textContent = payload.detail || `Error ${resp.status}`;
      return;
    }
    const data = await resp.json();
    wizard.currentId = data.id;
    wizard.currentName = data.name;
    wizard.availableStyles = data.available_styles;
    wizard.mapping = { ...data.detected_mapping };
    wizard.view = "step2";
    paintWizard();
  });

  root.append(nameLabel, nameInput, fileInput, errorEl, uploadBtn);
}

function paintStep2(root) {
  root.appendChild(el("h2", "font-semibold text-slate-900 mb-1", t("wizard.step2Title")));
  root.appendChild(el("p", "text-sm text-slate-500 mb-4", t("wizard.step2Desc")));

  const nameWrap = el("div", "mb-4");
  nameWrap.appendChild(el("label", "text-xs text-slate-500 block mb-1", t("wizard.nameLabel")));
  const nameInput = el("input", "w-full border border-slate-300 rounded-lg px-3 py-2 text-sm");
  nameInput.type = "text";
  nameInput.value = wizard.currentName || "";
  nameWrap.appendChild(nameInput);
  root.appendChild(nameWrap);

  const labels = {
    heading_1: t("wizard.mappingHeading1"),
    heading_2: t("wizard.mappingHeading2"),
    heading_3: t("wizard.mappingHeading3"),
    table: t("wizard.mappingTable"),
  };

  const selects = {};
  MAPPING_SLOTS.forEach((slot) => {
    const wrap = el("div", "mb-3");
    wrap.appendChild(el("label", "text-xs text-slate-500 block mb-1", labels[slot]));

    const select = document.createElement("select");
    select.className = "w-full border border-slate-300 rounded-lg px-3 py-2 text-sm";

    const emptyOpt = document.createElement("option");
    emptyOpt.value = "";
    emptyOpt.textContent = t("wizard.notDetected");
    select.appendChild(emptyOpt);

    wizard.availableStyles.forEach((styleName) => {
      const opt = document.createElement("option");
      opt.value = styleName;
      opt.textContent = styleName;
      if (wizard.mapping[slot] === styleName) opt.selected = true;
      select.appendChild(opt);
    });

    selects[slot] = select;
    wrap.appendChild(select);
    root.appendChild(wrap);
  });

  const errorEl = el("p", "text-red-600 text-xs mb-2 min-h-[1rem]");
  const saveBtn = el("button", "bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg px-4 py-2 text-sm", t("wizard.saveMappingBtn"));
  saveBtn.addEventListener("click", async () => {
    errorEl.textContent = "";
    const mapping = {};
    MAPPING_SLOTS.forEach((slot) => { mapping[slot] = selects[slot].value || null; });
    const newName = nameInput.value.trim();

    const headers = await getAuthHeader();

    if (newName && newName !== wizard.currentName) {
      const renameResp = await fetch(`${PRO_API}/${wizard.currentId}`, {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      if (!renameResp.ok) {
        const payload = await renameResp.json().catch(() => ({}));
        errorEl.textContent = payload.detail || `Error ${renameResp.status}`;
        return;
      }
      wizard.currentName = newName;
    }

    const resp = await fetch(`${PRO_API}/${wizard.currentId}/mapping`, {
      method: "PUT",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(mapping),
    });
    if (!resp.ok) {
      const payload = await resp.json().catch(() => ({}));
      errorEl.textContent = payload.detail || `Error ${resp.status}`;
      return;
    }
    wizard.mapping = mapping;
    wizard.view = "step3";
    paintWizard();
  });

  root.append(errorEl, saveBtn);
}

function paintStep3(root) {
  root.appendChild(el("h2", "font-semibold text-slate-900 mb-1", `${t("wizard.step3Title")} — ${wizard.currentName}`));
  root.appendChild(el("p", "text-sm text-slate-500 mb-1", t("wizard.step3Desc")));
  if (!isPaidTier()) {
    root.appendChild(el("p", "text-xs text-slate-400 mb-4", t("wizard.trialNote")));
  } else {
    root.appendChild(el("div", "mb-4"));
  }

  root.appendChild(buildTocGuide());

  const textarea = document.createElement("textarea");
  textarea.className = "w-full border border-slate-300 rounded-lg p-3 font-mono text-sm mb-4";
  textarea.rows = 8;
  textarea.value = "# Sample document\n\nThis is a paragraph.\n\n| Test | Result |\n|---|---|\n| A | PASS |\n";

  const resultEl = el("div", "text-sm mb-3 min-h-[1.5rem]");
  const loadingSlot = el("div");

  const convertBtn2 = el("button", "bg-slate-900 hover:bg-slate-700 text-white font-bold rounded-lg px-4 py-2 text-sm", t("wizard.convertBtn"));
  convertBtn2.addEventListener("click", async () => {
    convertBtn2.disabled = true;
    resultEl.className = "text-sm mb-3 min-h-[1.5rem]";
    resultEl.textContent = "";
    showLoadingIn(loadingSlot);
    try {
      await withMinDuration(runTemplateConversion(), 3000);
    } finally {
      hideLoadingIn(loadingSlot);
      convertBtn2.disabled = false;
    }
  });

  async function runTemplateConversion() {
    const formData = new FormData();
    formData.append("markdown", textarea.value || "");
    formData.append("filename", wizard.currentName || "documento");
    const headers = await getAuthHeader();
    const resp = await fetch(`${PRO_API}/${wizard.currentId}/convert`, { method: "POST", headers, body: formData });

    if (resp.status === 402) {
      const payload = await resp.json().catch(() => ({}));
      resultEl.innerHTML = "";
      resultEl.appendChild(el("p", "text-amber-600 font-semibold mb-1", t("wizard.trialUsedTitle")));
      resultEl.appendChild(el("p", "text-slate-500 text-xs mb-2", payload.detail || t("wizard.upgradeMessage")));
      const cta = el("a", "inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded px-4 py-2 text-xs", t("wizard.upgradeCta"));
      cta.href = "/pricing";
      resultEl.appendChild(cta);
      return;
    }
    if (!resp.ok) {
      const payload = await resp.json().catch(() => ({}));
      resultEl.className = "text-sm mb-3 min-h-[1.5rem] text-red-600";
      resultEl.textContent = payload.detail || payload.error || `Error ${resp.status}`;
      return;
    }

    const trialUsed = resp.headers.get("X-Formalize-Trial-Used") === "true";
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${wizard.currentName || "documento"}.docx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    resultEl.className = "text-sm mb-3 min-h-[1.5rem] text-emerald-600";
    resultEl.textContent = trialUsed ? t("wizard.convertedOk") : t("wizard.convertedOkPro");
  }

  root.append(textarea, resultEl, loadingSlot, convertBtn2);
}

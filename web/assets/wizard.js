/* Pro wizard (subir -> mapear estilos -> conversión de prueba), contra los
   endpoints de pro_templates.py (ver CLAUDE.md §5.2). Un usuario 'free'
   tiene derecho a 1 descarga real de prueba antes de que el backend
   empiece a devolver 402 — se refleja tal cual, sin difuminar ni fingir
   que el documento "está listo" cuando no lo está. Depende de shared.js
   (t, getAuthHeader, CONFIG) y de showLanding, ya cargados en index.html. */

const PRO_API = `${CONFIG.API_BASE_URL}/api/pro/templates`;
const MAPPING_SLOTS = ["heading_1", "heading_2", "heading_3", "table"];

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

window.renderWizard = async function renderWizard() {
  wizard.templates = await fetchMyTemplates();
  wizard.view = "list";
  paintWizard();
};

function paintWizard() {
  const root = document.getElementById("app-view");
  root.innerHTML = "";

  const back = el("button", "text-sm text-slate-500 hover:text-slate-900 mb-4", t("wizard.backToLanding"));
  back.addEventListener("click", showLanding);
  root.appendChild(back);

  root.appendChild(el("h1", "text-xl font-bold text-slate-900 mb-6", t("wizard.title")));

  if (wizard.view === "list") paintList(root);
  else if (wizard.view === "step1") paintStep1(root);
  else if (wizard.view === "step2") paintStep2(root);
  else if (wizard.view === "step3") paintStep3(root);
}

function paintList(root) {
  root.appendChild(el("h2", "font-semibold text-slate-900 mb-3", t("wizard.myTemplatesTitle")));

  if (wizard.templates.length === 0) {
    root.appendChild(el("p", "text-sm text-slate-500 mb-4", t("wizard.noTemplates")));
  } else {
    const list = el("div", "flex flex-col gap-2 mb-4");
    wizard.templates.forEach((tpl) => {
      const row = el("div", "flex items-center justify-between border border-slate-200 rounded-xl px-4 py-3");
      row.appendChild(el("span", "text-sm text-slate-800", tpl.name));
      const actions = el("div", "flex gap-2");

      const useBtn = el("button", "text-xs bg-slate-900 text-white font-semibold rounded-full px-3 py-1.5", t("wizard.useBtn"));
      useBtn.addEventListener("click", () => {
        wizard.currentId = tpl.id;
        wizard.currentName = tpl.name;
        wizard.view = "step3";
        paintWizard();
      });

      const delBtn = el("button", "text-xs border border-slate-300 rounded-full px-3 py-1.5 text-slate-600", t("wizard.deleteBtn"));
      delBtn.addEventListener("click", async () => {
        const headers = await getAuthHeader();
        await fetch(`${PRO_API}/${tpl.id}`, { method: "DELETE", headers });
        renderWizard();
      });

      actions.append(useBtn, delBtn);
      row.appendChild(actions);
      list.appendChild(row);
    });
    root.appendChild(list);
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

    const headers = await getAuthHeader();
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
  root.appendChild(el("p", "text-xs text-slate-400 mb-4", t("wizard.trialNote")));

  const textarea = document.createElement("textarea");
  textarea.className = "w-full border border-slate-300 rounded-lg p-3 font-mono text-sm mb-4";
  textarea.rows = 8;
  textarea.value = "# Sample document\n\nThis is a paragraph.\n\n| Test | Result |\n|---|---|\n| A | PASS |\n";

  const resultEl = el("div", "text-sm mb-3 min-h-[1.5rem]");

  const convertBtn2 = el("button", "bg-slate-900 hover:bg-slate-700 text-white font-bold rounded-lg px-4 py-2 text-sm", t("wizard.convertBtn"));
  convertBtn2.addEventListener("click", async () => {
    resultEl.className = "text-sm mb-3 min-h-[1.5rem] text-slate-500";
    resultEl.textContent = t("hero.converting");

    const formData = new FormData();
    formData.append("markdown", textarea.value || "");
    formData.append("filename", wizard.currentName || "documento");
    const headers = await getAuthHeader();
    const resp = await fetch(`${PRO_API}/${wizard.currentId}/convert`, { method: "POST", headers, body: formData });

    if (resp.status === 402) {
      const payload = await resp.json().catch(() => ({}));
      resultEl.className = "text-sm mb-3 min-h-[1.5rem]";
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
  });

  root.append(textarea, resultEl, convertBtn2);
}

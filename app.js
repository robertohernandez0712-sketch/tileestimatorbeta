function formatMoney(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function displayValue(value) {
  if (value === undefined || value === null || Number.isNaN(Number(value))) {
    return "";
  }

  return Number(value) === 0 ? "" : value;
}

 function printSection(mode) {
  document.body.classList.remove("print-quote", "print-materials", "print-invoice", "print-evidence");
  document.body.classList.add(mode);

  setTimeout(() => {
    window.print();
  }, 50);

  window.onafterprint = () => {
    document.body.classList.remove("print-quote", "print-materials", "print-invoice", "print-evidence");
    window.onafterprint = null;
  };
}

const QUOTE_PRINT_SCALE_KEY = "tile_estimator_quote_print_scale_v1";

function getQuotePrintScale() {
  const savedScale = Number(localStorage.getItem(QUOTE_PRINT_SCALE_KEY));
  return savedScale >= 75 && savedScale <= 100 ? savedScale : 100;
}

function applyQuotePrintScale(scalePercent) {
  const scale = Math.max(75, Math.min(100, Number(scalePercent) || 100));
  const compactRatio = scale / 100;

  document.documentElement.style.setProperty("--quote-print-font-size", `${11 * compactRatio}pt`);
  document.documentElement.style.setProperty("--quote-print-line-height", String(1.35 * compactRatio));
  document.documentElement.style.setProperty("--quote-print-line-padding", `${4 * compactRatio}px`);
  document.documentElement.style.setProperty("--quote-print-section-margin-top", `${12 * compactRatio}px`);
  document.documentElement.style.setProperty("--quote-print-section-margin-bottom", `${6 * compactRatio}px`);
  document.documentElement.style.setProperty("--quote-print-total-margin-top", `${12 * compactRatio}px`);
  document.documentElement.style.setProperty("--quote-print-total-padding-top", `${8 * compactRatio}px`);

  const input = document.getElementById("quotePrintScale");
  const label = document.getElementById("quotePrintScaleLabel");

  if (input) input.value = String(scale);
  if (label) label.textContent = `${scale}%`;

  localStorage.setItem(QUOTE_PRINT_SCALE_KEY, String(scale));
}

function calculateAreaLaborTotal(area) {
  const price = Number(area.pricing.laborPricePerSqFt) || 0;

  if (area.type === "shower") {
    const measuredWallArea =
      (Number(area.measurements.backWall.width) * Number(area.measurements.backWall.height)) +
      (Number(area.measurements.leftWall.width) * Number(area.measurements.leftWall.height)) +
      (Number(area.measurements.rightWall.width) * Number(area.measurements.rightWall.height));
    const wallArea = area.options?.showerMeasurementMode === "manual"
      ? Number(area.measurements.manualWetWallArea) || 0
      : measuredWallArea;

    const floorArea =
      Number(area.measurements.floor.length) * Number(area.measurements.floor.width);

    const dryTileArea = calculateDryTileExtensionsArea(area);
    const wetInstallArea = wallArea + floorArea;
    const totalArea = wetInstallArea + dryTileArea;
    const wetLaborTotal = wetInstallArea * price;
    const dryTileLaborTotal = calculateDryTileExtensionsLabor(area);
    const laborTotal = wetLaborTotal + dryTileLaborTotal;

    return {
      wallArea,
      floorArea,
      dryTileArea,
      wetInstallArea,
      wetLaborTotal,
      dryTileLaborTotal,
      measuredArea: totalArea,
      laborTotal
    };
  }

  if (area.type === "floor") {
    const totalArea =
      Number(area.measurements.length) * Number(area.measurements.width);

    const laborTotal = totalArea * price;

    return {
      measuredArea: totalArea,
      laborTotal
    };
  }

  if (area.type === "backsplash") {
    const totalArea = Number(area.measurements.area) || 0;
    const laborTotal = totalArea * price;

    return {
      measuredArea: totalArea,
      laborTotal
    };
  }

  if (area.type === "fireplace") {
    const tileArea = Number(area.measurements?.tileArea) || 0;
    const laborTotal = tileArea * price;

    return {
      measuredArea: tileArea,
      laborTotal
    };
  }

  if (area.type === "stairs") {
  const steps = Number(area.measurements?.steps) || 0;
  const landings = Number(area.measurements?.landings) || 0;

  const pricePerStep = Number(area.pricing?.pricePerStep) || 0;
  const pricePerLanding = Number(area.pricing?.pricePerLanding) || 0;

  const stepsTotal = steps * pricePerStep;
  const landingsTotal = landings * pricePerLanding;
  const laborTotal = stepsTotal + landingsTotal;

  return {
    measuredArea: 0,
    steps,
    landings,
    stepsTotal,
    landingsTotal,
    laborTotal
  };
}

  return {
    measuredArea: 0,
    laborTotal: 0
  };
}

function addFireplaceTask(areaId) {
  const area = state.currentProject?.areas?.find(item => item.areaId === areaId);
  if (!area) return;

  area.fireplaceTasks = Array.isArray(area.fireplaceTasks) ? area.fireplaceTasks : [];
  area.fireplaceTasks.push({
    id: crypto.randomUUID(),
    description: "",
    price: 0
  });

  saveState();
  renderApp();
}

function updateFireplaceTask(areaId, taskId, field, value) {
  const area = state.currentProject?.areas?.find(item => item.areaId === areaId);
  if (!area || !Array.isArray(area.fireplaceTasks)) return;

  const task = area.fireplaceTasks.find(item => item.id === taskId);
  if (!task) return;

  if (field === "description") task.description = value;
  if (field === "price") task.price = Number(value) || 0;

  saveState();
  renderApp();
}

function removeFireplaceTask(areaId, taskId) {
  const area = state.currentProject?.areas?.find(item => item.areaId === areaId);
  if (!area || !Array.isArray(area.fireplaceTasks)) return;

  area.fireplaceTasks = area.fireplaceTasks.filter(item => item.id !== taskId);

  saveState();
  renderApp();
}

function calculateCustomTasksTotal(area) {
  if (!area || !Array.isArray(area.customTasks)) {
    return 0;
  }

  return area.customTasks.reduce((total, task) => {
    return total + (Number(task.price) || 0);
  }, 0);
}

function createBacksplashTask() {
  return {
    id: `backsplash-task-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    description: "",
    price: 0
  };
}

function calculateBacksplashTasksTotal(area) {
  if (!area || !Array.isArray(area.backsplashTasks)) {
    return 0;
  }

  return area.backsplashTasks.reduce((total, task) => {
    return total + (Number(task.price) || 0);
  }, 0);
}

function getBacksplashTasksHTML(area) {
  if (area.type !== "backsplash") return "";

  const tasks = Array.isArray(area.backsplashTasks) ? area.backsplashTasks : [];

  return `
    <div class="info-panel">
      <div class="info-panel-title">Additional Backsplash Charges</div>

      ${tasks.length === 0 ? `<div>No additional backsplash charges added.</div>` : ""}

      <div class="stacked-blocks">
        ${tasks.map(task => `
          <div>
            <div class="grid task-row">
              <input
                data-area-id="${area.areaId}"
                data-backsplash-task-id="${task.id}"
                data-backsplash-task-field="description"
                type="text"
                placeholder="Charge Description"
                value="${task.description || ""}"
              >
              <input
                data-area-id="${area.areaId}"
                data-backsplash-task-id="${task.id}"
                data-backsplash-task-field="price"
                type="number"
                step="0.01"
                placeholder="Charge Price"
                value="${displayValue(task.price)}"
              >
            </div>
            <div class="area-actions">
              <button type="button" data-action="remove-backsplash-task" data-area-id="${area.areaId}" data-backsplash-task-id="${task.id}">Remove Charge</button>
            </div>
          </div>
        `).join("")}
      </div>

      <div class="area-actions">
        <button type="button" data-action="add-backsplash-task" data-area-id="${area.areaId}">Add Backsplash Charge</button>
      </div>
    </div>
  `;
}

function addBacksplashTaskToArea(areaId) {
  const area = state.currentProject?.areas.find(item => item.areaId === areaId);
  if (!area || area.type !== "backsplash") return;

  if (!Array.isArray(area.backsplashTasks)) {
    area.backsplashTasks = [];
  }

  area.backsplashTasks.push(createBacksplashTask());
  touchCurrentProject();
}

function removeBacksplashTaskFromArea(areaId, taskId) {
  const area = state.currentProject?.areas.find(item => item.areaId === areaId);
  if (!area || !Array.isArray(area.backsplashTasks)) return;

  area.backsplashTasks = area.backsplashTasks.filter(task => task.id !== taskId);
  touchCurrentProject();
}

function updateBacksplashTaskField(areaId, taskId, field, value) {
  const area = state.currentProject?.areas.find(item => item.areaId === areaId);
  if (!area || !Array.isArray(area.backsplashTasks)) return;

  const task = area.backsplashTasks.find(item => item.id === taskId);
  if (!task) return;

  if (field === "description") {
    task.description = value;
  }

  if (field === "price") {
    task.price = Number(value) || 0;
  }

  touchCurrentProject();
}

function createCustomTask() {
  return {
    id: `task-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    description: "",
    price: 0
  };
}

function calculateFloorTasksTotal(area) {
  if (!area || !Array.isArray(area.floorTasks)) {
    return 0;
  }

  return area.floorTasks.reduce((total, task) => {
    return total + (Number(task.price) || 0);
  }, 0);
}

function createFloorTask() {
  return {
    id: `floor-task-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    description: "",
    price: 0
  };
}

function createDryTileExtension() {
  return {
    id: `dry-tile-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    description: "",
    area: 0,
    pricePerSqFt: 0
  };
}

function calculateDryTileExtensionsArea(area) {
  if (!area || !Array.isArray(area.dryTileExtensions)) {
    return 0;
  }

  return area.dryTileExtensions.reduce((total, item) => {
    return total + (Number(item.area) || 0);
  }, 0);
}

function calculateDryTileExtensionsLabor(area) {
  if (!area || !Array.isArray(area.dryTileExtensions)) {
    return 0;
  }

  return area.dryTileExtensions.reduce((total, item) => {
    const itemArea = Number(item.area) || 0;
    const itemPrice = Number(item.pricePerSqFt) || 0;
    return total + (itemArea * itemPrice);
  }, 0);
}

function getCustomTasksHTML(area) {
  if (area.type !== "shower") return "";

  const tasks = Array.isArray(area.customTasks) ? area.customTasks : [];

  return `
    <div class="info-panel">
      <div class="info-panel-title">Additional Shower Charges</div>

      ${tasks.length === 0 ? `<div>No additional shower charges added.</div>` : ""}

      <div class="stacked-blocks">
        ${tasks.map(task => `
          <div>
            <div class="grid task-row">
              <input
                data-area-id="${area.areaId}"
                data-task-id="${task.id}"
                data-task-field="description"
                type="text"
                placeholder="Charge Description"
                value="${task.description || ""}"
              >
              <input
                data-area-id="${area.areaId}"
                data-task-id="${task.id}"
                data-task-field="price"
                type="number"
                step="0.01"
                placeholder="Charge Price"
                value="${displayValue(task.price)}"
              >
            </div>
            <div class="area-actions">
              <button type="button" data-action="remove-task" data-area-id="${area.areaId}" data-task-id="${task.id}">Remove Charge</button>
            </div>
          </div>
        `).join("")}
      </div>

      <div class="area-actions">
        <button type="button" data-action="add-task" data-area-id="${area.areaId}">Add Shower Charge</button>
      </div>
    </div>
  `;
}



function getFloorTasksHTML(area) {
  if (area.type !== "floor") return "";

  const tasks = Array.isArray(area.floorTasks) ? area.floorTasks : [];

  return `
    <div class="info-panel">
      <div class="info-panel-title">Additional Floor Charges</div>

      ${tasks.length === 0 ? `<div>No additional floor charges added.</div>` : ""}

      <div class="stacked-blocks">
        ${tasks.map(task => `
          <div>
            <div class="grid task-row">
              <input
                data-area-id="${area.areaId}"
                data-floor-task-id="${task.id}"
                data-floor-task-field="description"
                type="text"
                placeholder="Charge Description"
                value="${task.description || ""}"
              >
              <input
                data-area-id="${area.areaId}"
                data-floor-task-id="${task.id}"
                data-floor-task-field="price"
                type="number"
                step="0.01"
                placeholder="Charge Price"
                value="${displayValue(task.price)}"
              >
            </div>
            <div class="area-actions">
              <button type="button" data-action="remove-floor-task" data-area-id="${area.areaId}" data-floor-task-id="${task.id}">Remove Charge</button>
            </div>
          </div>
        `).join("")}
      </div>

      <div class="area-actions">
        <button type="button" data-action="add-floor-task" data-area-id="${area.areaId}">Add Floor Charge</button>
      </div>
    </div>
  `;
}

function calculateAreaExtrasTotal(area) {
  if (!area) {
    return 0;
  }

  let total = 0;

  if (area.type === "shower") {
    if (area.options?.niche) {
      total += Number(area.options?.nichePrice) || 0;
    }

    if (area.options?.bench) {
      total += Number(area.options?.benchPrice) || 0;
    }

    if (area.options?.curb) {
      total += Number(area.options?.curbPrice) || 0;
    }

    total += calculateCustomTasksTotal(area);
  }

  if (area.type === "floor") {
    total += calculateFloorTasksTotal(area);
  }

  if (area.type === "backsplash") {
    total += calculateBacksplashTasksTotal(area);
  }

  if (area.type === "fireplace") {
    total += calculateFireplaceTasksTotal(area);
  }

  return total;
}

function getProjectChargesTotal(project) {
  if (!project) return 0;

  let total = 0;

  if (project.charges.demolition.included) {
    total += Number(project.charges.demolition.price) || 0;
  }

  if (project.charges.plumbing.included) {
    total += Number(project.charges.plumbing.price) || 0;
  }

  return total;
}

function getAreaLabel(area) {
  if (area.type === "shower") return "Shower";

  if (area.type === "floor") {
    const floorType = area.options?.floorType || "tile";

    if (floorType === "laminate") return "Laminate Floor";
    if (floorType === "wood") return "Wood Floor";
    return "Tile Floor";
  }

  if (area.type === "backsplash") return "Backsplash";
  if (area.type === "fireplace") return "Fireplace";
  if (area.type === "stairs") return "Stairs";

  return area.type;
}

function buildQuotePreviewHTML(project) {
  if (!project) {
    return "No quote generated yet.";
  }

  const business = state.businessProfile || {
    name: "",
    phone: "",
    email: "",
    logoDataUrl: ""
  };

  let totalLabor = 0;
  let totalExtras = 0;

  const areaLines = project.areas.map(area => {
    const result = calculateAreaLaborTotal(area);
    const extrasTotal = calculateAreaExtrasTotal(area);

    totalLabor += result.laborTotal;
    totalExtras += extrasTotal;

    const customTasks = Array.isArray(area.customTasks) ? area.customTasks : [];
    const customTasksHTML = customTasks
      .filter(task => (Number(task.price) || 0) > 0 || (task.description || "").trim())
      .map(task => `
        <div class="quote-line">
          <span>${task.description || "Additional Shower Charge"}</span>
          <span>${formatMoney(task.price)}</span>
        </div>
      `).join("");

    const floorTasks = Array.isArray(area.floorTasks) ? area.floorTasks : [];
    const floorTasksHTML = floorTasks
      .filter(task => (Number(task.price) || 0) > 0 || (task.description || "").trim())
      .map(task => `
        <div class="quote-line">
          <span>${task.description || "Additional Floor Charge"}</span>
          <span>${formatMoney(task.price)}</span>
        </div>
      `).join("");

    const backsplashTasks = Array.isArray(area.backsplashTasks) ? area.backsplashTasks : [];
    const backsplashTasksHTML = backsplashTasks
      .filter(task => (Number(task.price) || 0) > 0 || (task.description || "").trim())
      .map(task => `
        <div class="quote-line">
          <span>${task.description || "Additional Backsplash Charge"}</span>
          <span>${formatMoney(task.price)}</span>
        </div>
      `).join("");

    const fireplaceTasks = Array.isArray(area.fireplaceTasks) ? area.fireplaceTasks : [];
    const fireplaceTasksHTML = fireplaceTasks
      .filter(task => (Number(task.price) || 0) > 0 || (task.description || "").trim())
      .map(task => `
        <div class="quote-line">
          <span>${task.description || "Additional Fireplace Charge"}</span>
          <span>${formatMoney(task.price)}</span>
        </div>
      `).join("");

    const dryTileExtensions = Array.isArray(area.dryTileExtensions) ? area.dryTileExtensions : [];
    const dryTileExtensionsHTML = dryTileExtensions
      .filter(item => (Number(item.area) || 0) > 0 || (item.description || "").trim())
      .map(item => {
        const dryTileArea = Number(item.area) || 0;
        const dryTilePrice = Number(item.pricePerSqFt) || 0;
        const dryTileTotal = dryTileArea * dryTilePrice;

        return `
        <div class="quote-line">
          <span>
            ${item.description || "Dry Shower Charge"}<br>
            ${dryTileArea.toFixed(2)} sq ft @ ${formatMoney(dryTilePrice)} / sq ft
          </span>
          <span>${formatMoney(dryTileTotal)}</span>
        </div>
      `;
      }).join("");

    const builtInExtrasHTML = [];

    if (area.type === "shower" && area.options?.niche && (Number(area.options?.nichePrice) || 0) > 0) {
      builtInExtrasHTML.push(`
        <div class="quote-line">
          <span>Niche</span>
          <span>${formatMoney(area.options.nichePrice)}</span>
        </div>
      `);
    }

    if (area.type === "shower" && area.options?.bench && (Number(area.options?.benchPrice) || 0) > 0) {
      builtInExtrasHTML.push(`
        <div class="quote-line">
          <span>Bench</span>
          <span>${formatMoney(area.options.benchPrice)}</span>
        </div>
      `);
    }

    if (area.type === "shower" && area.options?.curb && (Number(area.options?.curbPrice) || 0) > 0) {
      builtInExtrasHTML.push(`
        <div class="quote-line">
          <span>Curb</span>
          <span>${formatMoney(area.options.curbPrice)}</span>
        </div>
      `);
    }

    const floorType = area.options?.floorType || "tile";

    const floorDetails =
      area.type === "floor" && floorType === "laminate"
        ? `Laminate installation<br>${result.measuredArea.toFixed(2)} sq ft @ ${formatMoney(area.pricing.laborPricePerSqFt)} / sq ft`
        : area.type === "floor" && floorType === "wood"
        ? `Wood installation<br>${result.measuredArea.toFixed(2)} sq ft @ ${formatMoney(area.pricing.laborPricePerSqFt)} / sq ft`
        : `${result.measuredArea.toFixed(2)} sq ft @ ${formatMoney(area.pricing.laborPricePerSqFt)} / sq ft`;

    const stairsDetails =
      area.type === "stairs"
        ? `
          ${result.steps > 0 ? `${result.steps} steps @ ${formatMoney(area.pricing?.pricePerStep)} / step<br>` : ""}
          ${result.landings > 0 ? `${result.landings} landings @ ${formatMoney(area.pricing?.pricePerLanding)} / landing` : ""}
        `
        : "";

    const areaDetails =
      area.type === "floor"
        ? floorDetails
        : area.type === "stairs"
        ? stairsDetails
        : area.type === "shower"
        ? `${(result.wetInstallArea || 0).toFixed(2)} sq ft wet area @ ${formatMoney(area.pricing.laborPricePerSqFt)} / sq ft`
        : `${result.measuredArea.toFixed(2)} sq ft @ ${formatMoney(area.pricing.laborPricePerSqFt)} / sq ft`;
    const areaLineTotal = area.type === "shower"
      ? result.wetLaborTotal || 0
      : result.laborTotal;

    return `
      <div class="quote-line">
        <span>
          <strong>${getAreaLabel(area)} - ${area.name}</strong><br>
          ${areaDetails}
        </span>
        <span>${formatMoney(areaLineTotal)}</span>
      </div>
      ${builtInExtrasHTML.join("")}
      ${customTasksHTML}
      ${dryTileExtensionsHTML}
      ${floorTasksHTML}
      ${backsplashTasksHTML}
      ${fireplaceTasksHTML}
    `;
  }).join("");

  const demolitionIncluded = project.charges.demolition.included;
  const demolitionPrice = Number(project.charges.demolition.price) || 0;

  const plumbingIncluded = project.charges.plumbing.included;
  const plumbingPrice = Number(project.charges.plumbing.price) || 0;

  const chargesTotal = getProjectChargesTotal(project);
  const grandTotal = totalLabor + totalExtras + chargesTotal;

  const today = new Date().toLocaleDateString();

  return `
    <div class="quote-block">
      <div class="quote-header-grid">
        <div>
          <div class="quote-section-title">Business</div>
          ${business.logoDataUrl ? `<img class="business-logo" src="${business.logoDataUrl}" alt="Business logo">` : ""}
          <div><strong>Business:</strong> ${business.name || "-"}</div>
          <div><strong>Phone:</strong> ${business.phone || "-"}</div>
          <div><strong>Email:</strong> ${business.email || "-"}</div>
        </div>

        <div>
          <div class="quote-section-title">Client</div>
          <div><strong>Date:</strong> ${today}</div>
          <div><strong>Project:</strong> ${project.projectName || "Untitled Project"}</div>
          <div><strong>Client:</strong> ${project.client.name || "-"}</div>
          <div><strong>Phone:</strong> ${project.client.phone || "-"}</div>
          <div><strong>Address:</strong> ${project.jobSite.address || "-"}</div>
        </div>
      </div>

      ${project.scopeOfWork ? `
        <div class="quote-section-title">Scope of Work</div>
        <div>${project.scopeOfWork.replace(/\n/g, "<br>")}</div>
      ` : ""}

      ${project.notes ? `
        <div class="quote-section-title">Notes</div>
        <div>${project.notes.replace(/\n/g, "<br>")}</div>
      ` : ""}

      <div class="quote-section-title">Labor</div>
      ${areaLines || `<div>No areas added yet.</div>`}

      <div class="quote-section-title">Project Charges</div>
      ${demolitionIncluded ? `
        <div class="quote-line">
          <span>Demolition</span>
          <span>${formatMoney(demolitionPrice)}</span>
        </div>
      ` : ""}
      ${plumbingIncluded ? `
        <div class="quote-line">
          <span>Plumbing</span>
          <span>${formatMoney(plumbingPrice)}</span>
        </div>
      ` : ""}
      ${!demolitionIncluded && !plumbingIncluded ? `<div>No additional project charges.</div>` : ""}

      <div class="quote-total">
        <span>Total</span>
        <span>${formatMoney(grandTotal)}</span>
      </div>
    </div>
  `;
}

function renderBusinessProfile() {
  const business = state.businessProfile || {};

  document.getElementById("businessName").value = business.name || "";
  document.getElementById("businessPhone").value = business.phone || "";
  document.getElementById("businessEmail").value = business.email || "";

  const logoPreview = document.getElementById("businessLogoPreview");
  if (logoPreview) {
    logoPreview.innerHTML = business.logoDataUrl
      ? `<img src="${business.logoDataUrl}" alt="Business logo preview">`
      : "No logo loaded.";
  }
}

function renderSavedProjectsList() {
  const select = document.getElementById("savedProjectsSelect");
  const projects = getSavedProjectsList();

  select.innerHTML = `<option value="">Select saved project</option>`;

  projects.forEach(project => {
    const option = document.createElement("option");
    option.value = project.projectId;
    option.textContent = `${project.projectName || "Untitled Project"} - ${project.client?.name || "No Client"}`;
    select.appendChild(option);
  });

  if (state.currentProject?.projectId && projects.some(p => p.projectId === state.currentProject.projectId)) {
    select.value = state.currentProject.projectId;
  }
}

function formatBackupDate(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
}

function formatBackupAction(action) {
  const labels = {
    "before-save": "Before Save",
    "before-delete": "Before Delete",
    "before-restore": "Before Restore",
    manual: "Manual Backup"
  };

  return labels[action] || "Backup";
}

function renderProjectBackupsList() {
  const select = document.getElementById("projectBackupsSelect");
  if (!select) return;

  const backups = getProjectBackups().slice(0, 10);
  select.innerHTML = `<option value="">Select backup</option>`;

  backups.forEach(backup => {
    const option = document.createElement("option");
    option.value = backup.backupId;
    option.textContent = `${backup.projectName || "Untitled Project"} - ${formatBackupAction(backup.action)} - ${formatBackupDate(backup.createdAt)}`;
    select.appendChild(option);
  });
}

function renderProjectInfo() {
  const project = state.currentProject;
  if (!project) return;

  document.getElementById("projectName").value = project.projectName;
  document.getElementById("clientName").value = project.client.name;
  document.getElementById("clientPhone").value = project.client.phone;
  document.getElementById("jobAddress").value = project.jobSite.address;
  document.getElementById("scopeOfWork").value = project.scopeOfWork || "";
  document.getElementById("projectNotes").value = project.notes || "";

  document.getElementById("includeDemolition").checked = project.charges.demolition.included;
  document.getElementById("demolitionPrice").value = displayValue(project.charges.demolition.price);

  document.getElementById("includePlumbing").checked = project.charges.plumbing.included;
  document.getElementById("plumbingPrice").value = displayValue(project.charges.plumbing.price);
}

function getAreaMeasurementsHTML(area) {
  if (area.type === "shower") {
    const showMudDepth = area.options?.panType === "mud";
    const showerMeasurementMode = area.options?.showerMeasurementMode || "manual";
    const useManualWetArea = showerMeasurementMode === "manual";

    const showNiche = !!area.options?.niche;
    const showBench = !!area.options?.bench;
    const showCurb = !!area.options?.curb;

    const showNichePrepArea = showNiche && area.options?.nicheType === "inplace";
    const showBenchPrepArea = showBench && area.options?.benchType === "inplace";
    const showCurbPrepArea = showCurb && area.options?.curbType === "inplace";

    return `
      <div class="area-subsection">
        <div class="area-subsection-title">Wet Area and Floor</div>
        <div class="grid">
          <select data-area-id="${area.areaId}" data-field="showerMeasurementMode">
            <option value="walls" ${showerMeasurementMode === "walls" ? "selected" : ""}>Measure Walls</option>
            <option value="manual" ${showerMeasurementMode === "manual" ? "selected" : ""}>Manual Wet Wall Area</option>
          </select>

          <input
            class="${useManualWetArea ? "" : "conditional-hidden"}"
            data-area-id="${area.areaId}"
            data-field="manualWetWallArea"
            type="number"
            step="0.01"
            placeholder="Manual Wet Wall Area (sq ft)"
            value="${displayValue(area.measurements.manualWetWallArea)}"
          >

          <div class="field-pair ${useManualWetArea ? "conditional-hidden" : ""}">
            <input data-area-id="${area.areaId}" data-field="backWallWidth" type="number" step="0.01" placeholder="Back Wall Width" value="${displayValue(area.measurements.backWall.width)}">
            <input data-area-id="${area.areaId}" data-field="backWallHeight" type="number" step="0.01" placeholder="Back Wall Height" value="${displayValue(area.measurements.backWall.height)}">
          </div>

          <div class="field-pair ${useManualWetArea ? "conditional-hidden" : ""}">
            <input data-area-id="${area.areaId}" data-field="leftWallWidth" type="number" step="0.01" placeholder="Left Wall Width" value="${displayValue(area.measurements.leftWall.width)}">
            <input data-area-id="${area.areaId}" data-field="leftWallHeight" type="number" step="0.01" placeholder="Left Wall Height" value="${displayValue(area.measurements.leftWall.height)}">
          </div>

          <div class="field-pair ${useManualWetArea ? "conditional-hidden" : ""}">
            <input data-area-id="${area.areaId}" data-field="rightWallWidth" type="number" step="0.01" placeholder="Right Wall Width" value="${displayValue(area.measurements.rightWall.width)}">
            <input data-area-id="${area.areaId}" data-field="rightWallHeight" type="number" step="0.01" placeholder="Right Wall Height" value="${displayValue(area.measurements.rightWall.height)}">
          </div>

          <input data-area-id="${area.areaId}" data-field="floorLength" type="number" step="0.01" placeholder="Shower Floor Length" value="${displayValue(area.measurements.floor.length)}">
          <input data-area-id="${area.areaId}" data-field="floorWidth" type="number" step="0.01" placeholder="Shower Floor Width" value="${displayValue(area.measurements.floor.width)}">
        </div>
      </div>

      <div class="area-subsection">
        <div class="area-subsection-title">Pan and Waste</div>
        <div class="grid">
          <select data-area-id="${area.areaId}" data-field="panType">
            <option value="mud" ${area.options?.panType === "mud" ? "selected" : ""}>Shower Pan Mud Bed</option>
            <option value="foam" ${area.options?.panType === "foam" ? "selected" : ""}>Shower Pan Foam</option>
            <option value="prefab" ${area.options?.panType === "prefab" ? "selected" : ""}>Shower Pan Prefab</option>
          </select>

          <input
            class="${showMudDepth ? "" : "conditional-hidden"}"
            data-area-id="${area.areaId}"
            data-field="mudBedDepthIn"
            type="number"
            step="0.01"
            placeholder="Mud Bed Depth (in)"
            value="${displayValue(area.options?.mudBedDepthIn)}"
          >

          <input data-area-id="${area.areaId}" data-field="wallWaste" type="number" step="0.01" placeholder="Wall Waste %" value="${displayValue(area.options?.wallWaste)}">
          <input data-area-id="${area.areaId}" data-field="floorWaste" type="number" step="0.01" placeholder="Floor Waste %" value="${displayValue(area.options?.floorWaste)}">
        </div>
      </div>

      <div class="area-subsection">
        <div class="area-subsection-title">Installation Settings</div>
        <div class="grid">
          <select data-area-id="${area.areaId}" data-field="wallTrowel">
            <option value="1/4x1/4" ${area.options?.wallTrowel === "1/4x1/4" ? "selected" : ""}>Wall Trowel 1/4 x 1/4</option>
            <option value="1/4x3/8" ${area.options?.wallTrowel === "1/4x3/8" ? "selected" : ""}>Wall Trowel 1/4 x 3/8</option>
            <option value="1/2x1/2" ${area.options?.wallTrowel === "1/2x1/2" ? "selected" : ""}>Wall Trowel 1/2 x 1/2</option>
          </select>

          <select data-area-id="${area.areaId}" data-field="floorTrowel">
            <option value="1/4x1/4" ${area.options?.floorTrowel === "1/4x1/4" ? "selected" : ""}>Floor Trowel 1/4 x 1/4</option>
            <option value="1/4x3/8" ${area.options?.floorTrowel === "1/4x3/8" ? "selected" : ""}>Floor Trowel 1/4 x 3/8</option>
            <option value="1/2x1/2" ${area.options?.floorTrowel === "1/2x1/2" ? "selected" : ""}>Floor Trowel 1/2 x 1/2</option>
          </select>

          <select data-area-id="${area.areaId}" data-field="boardType">
            <option value="goboard" ${area.options?.boardType === "goboard" ? "selected" : ""}>GoBoard</option>
            <option value="kerdi" ${area.options?.boardType === "kerdi" ? "selected" : ""}>Kerdi Board</option>
            <option value="durock" ${area.options?.boardType === "durock" ? "selected" : ""}>Durock</option>
            <option value="hardie" ${area.options?.boardType === "hardie" ? "selected" : ""}>HardieBacker</option>
          </select>

          <select data-area-id="${area.areaId}" data-field="boardSize">
            <option value="15" ${Number(area.options?.boardSize) === 15 ? "selected" : ""}>Board Size 3x5</option>
            <option value="32" ${Number(area.options?.boardSize) === 32 ? "selected" : ""}>Board Size 4x8</option>
          </select>

          <select data-area-id="${area.areaId}" data-field="waterproofType">
            <option value="foam" ${area.options?.waterproofType === "foam" ? "selected" : ""}>Foam System</option>
            <option value="sheet" ${area.options?.waterproofType === "sheet" ? "selected" : ""}>Sheet Membrane</option>
            <option value="liquid" ${area.options?.waterproofType === "liquid" ? "selected" : ""}>Liquid Membrane</option>
          </select>
        </div>
      </div>

      <div class="area-subsection">
        <div class="area-subsection-title">Shower Extras</div>

        <div class="inline-checks">
          <label><input data-area-id="${area.areaId}" data-field="niche" type="checkbox" ${showNiche ? "checked" : ""}> Niche</label>
          <label><input data-area-id="${area.areaId}" data-field="bench" type="checkbox" ${showBench ? "checked" : ""}> Bench</label>
          <label><input data-area-id="${area.areaId}" data-field="curb" type="checkbox" ${showCurb ? "checked" : ""}> Curb</label>
        </div>

        <div class="grid">
          <div class="${showNiche ? "" : "conditional-hidden"}">
            <select data-area-id="${area.areaId}" data-field="nicheType">
              <option value="inplace" ${area.options?.nicheType === "inplace" ? "selected" : ""}>Niche In-Place</option>
              <option value="prefab" ${area.options?.nicheType === "prefab" ? "selected" : ""}>Niche Prefab</option>
            </select>
          </div>

          <div class="${showBench ? "" : "conditional-hidden"}">
            <select data-area-id="${area.areaId}" data-field="benchType">
              <option value="inplace" ${area.options?.benchType === "inplace" ? "selected" : ""}>Bench In-Place</option>
              <option value="prefab" ${area.options?.benchType === "prefab" ? "selected" : ""}>Bench Prefab</option>
            </select>
          </div>

          <div class="${showCurb ? "" : "conditional-hidden"}">
            <select data-area-id="${area.areaId}" data-field="curbType">
              <option value="inplace" ${area.options?.curbType === "inplace" ? "selected" : ""}>Curb In-Place</option>
              <option value="prefab" ${area.options?.curbType === "prefab" ? "selected" : ""}>Curb Prefab</option>
            </select>
          </div>

          <input
            class="${showNichePrepArea ? "" : "conditional-hidden"}"
            data-area-id="${area.areaId}"
            data-field="nichePrepArea"
            type="number"
            step="0.01"
            placeholder="Niche Prep Area"
            value="${displayValue(area.options?.nichePrepArea)}"
          >

          <input
            class="${showBenchPrepArea ? "" : "conditional-hidden"}"
            data-area-id="${area.areaId}"
            data-field="benchPrepArea"
            type="number"
            step="0.01"
            placeholder="Bench Prep Area"
            value="${displayValue(area.options?.benchPrepArea)}"
          >

          <input
            class="${showCurbPrepArea ? "" : "conditional-hidden"}"
            data-area-id="${area.areaId}"
            data-field="curbPrepArea"
            type="number"
            step="0.01"
            placeholder="Curb Prep Area"
            value="${displayValue(area.options?.curbPrepArea)}"
          >

          <input
            class="${showNiche ? "" : "conditional-hidden"}"
            data-area-id="${area.areaId}"
            data-field="nichePrice"
            type="number"
            step="0.01"
            placeholder="Niche Price"
            value="${displayValue(area.options?.nichePrice)}"
          >

          <input
            class="${showBench ? "" : "conditional-hidden"}"
            data-area-id="${area.areaId}"
            data-field="benchPrice"
            type="number"
            step="0.01"
            placeholder="Bench Price"
            value="${displayValue(area.options?.benchPrice)}"
          >

          <input
            class="${showCurb ? "" : "conditional-hidden"}"
            data-area-id="${area.areaId}"
            data-field="curbPrice"
            type="number"
            step="0.01"
            placeholder="Curb Price"
            value="${displayValue(area.options?.curbPrice)}"
          >
        </div>
      </div>

      <div class="area-subsection">
        <div class="area-subsection-title">Edge Finishes</div>
        <div class="grid">
          <input
            data-area-id="${area.areaId}"
            data-field="metalTrimFt"
            type="number"
            step="0.01"
            placeholder="Metal Trim (ft)"
            value="${displayValue(area.edgeFinishes?.metalTrimFt)}"
          >

          <input
            data-area-id="${area.areaId}"
            data-field="bullnoseFt"
            type="number"
            step="0.01"
            placeholder="Bullnose (ft)"
            value="${displayValue(area.edgeFinishes?.bullnoseFt)}"
          >

          <input
            data-area-id="${area.areaId}"
            data-field="quartzStoneCapFt"
            type="number"
            step="0.01"
            placeholder="Quartz / Stone Cap (ft)"
            value="${displayValue(area.edgeFinishes?.quartzStoneCapFt)}"
          >
        </div>
      </div>
    `;
  }

  if (area.type === "floor") {
  const floorType = area.options?.floorType || "tile";
  const prepSystem = area.options?.prepSystem || "none";
  const showTileFields = floorType === "tile";
  const showLaminateFields = floorType === "laminate";
  const showWoodFields = floorType === "wood";
  const showLeveler = !!area.options?.useLeveler;
  const showWoodNailFields = showWoodFields && area.options?.woodInstallMethod === "nail";
  const showWoodGlueFields = showWoodFields && area.options?.woodInstallMethod === "glue";

  return `
    <div class="area-subsection">
      <div class="area-subsection-title">Floor Measurements</div>
      <div class="grid">
        <input
          data-area-id="${area.areaId}"
          data-field="length"
          type="number"
          step="0.01"
          placeholder="Floor Length"
          value="${displayValue(area.measurements.length)}"
        >
        <input
          data-area-id="${area.areaId}"
          data-field="width"
          type="number"
          step="0.01"
          placeholder="Floor Width"
          value="${displayValue(area.measurements.width)}"
        >
      </div>
    </div>

    <div class="area-subsection">
      <div class="area-subsection-title">Floor Type</div>
      <div class="grid">
        <select data-area-id="${area.areaId}" data-field="floorType">
          <option value="tile" ${floorType === "tile" ? "selected" : ""}>Tile Floor</option>
          <option value="laminate" ${floorType === "laminate" ? "selected" : ""}>Laminate Floor</option>
          <option value="wood" ${floorType === "wood" ? "selected" : ""}>Wood Floor</option>
        </select>

        <input
          data-area-id="${area.areaId}"
          data-field="floorWaste"
          type="number"
          step="0.01"
          placeholder="Floor Waste %"
          value="${displayValue(area.options?.floorWaste)}"
        >
      </div>
    </div>

    <div class="area-subsection ${showTileFields ? "" : "conditional-hidden"}">
      <div class="area-subsection-title">Tile Base Prep</div>
      <div class="grid">
        <select data-area-id="${area.areaId}" data-field="floorTrowel">
          <option value="1/4x1/4" ${area.options?.floorTrowel === "1/4x1/4" ? "selected" : ""}>Floor Trowel 1/4 x 1/4</option>
          <option value="1/4x3/8" ${area.options?.floorTrowel === "1/4x3/8" ? "selected" : ""}>Floor Trowel 1/4 x 3/8</option>
          <option value="1/2x1/2" ${area.options?.floorTrowel === "1/2x1/2" ? "selected" : ""}>Floor Trowel 1/2 x 1/2</option>
        </select>

        <select data-area-id="${area.areaId}" data-field="prepSystem">
          <option value="none" ${prepSystem === "none" ? "selected" : ""}>Prep None</option>
          <option value="ditra" ${prepSystem === "ditra" ? "selected" : ""}>Prep Ditra</option>
          <option value="durock" ${prepSystem === "durock" ? "selected" : ""}>Prep Durock</option>
        </select>
      </div>
    </div>

    <div class="area-subsection ${showLaminateFields ? "" : "conditional-hidden"}">
      <div class="area-subsection-title">Laminate Prep</div>
      <div class="inline-checks">
        <label>
          <input
            data-area-id="${area.areaId}"
            data-field="laminateUnderlayment"
            type="checkbox"
            ${area.options?.laminateUnderlayment ? "checked" : ""}
          >
          Underlayment
        </label>

        <label>
          <input
            data-area-id="${area.areaId}"
            data-field="laminateVaporBarrier"
            type="checkbox"
            ${area.options?.laminateVaporBarrier ? "checked" : ""}
          >
          Vapor Barrier
        </label>
      </div>
    </div>

    <div class="area-subsection ${showWoodFields ? "" : "conditional-hidden"}">
      <div class="area-subsection-title">Wood Installation</div>
      <div class="grid">
        <select data-area-id="${area.areaId}" data-field="woodInstallMethod">
          <option value="nail" ${area.options?.woodInstallMethod === "nail" ? "selected" : ""}>Nail Down</option>
          <option value="glue" ${area.options?.woodInstallMethod === "glue" ? "selected" : ""}>Glue Down</option>
        </select>

        <select class="${showWoodGlueFields ? "" : "conditional-hidden"}" data-area-id="${area.areaId}" data-field="woodGlueTrowel">
  <option value="3/16-v-notch" ${area.options?.woodGlueTrowel === "3/16-v-notch" ? "selected" : ""}>Wood Glue Trowel 3/16 V-Notch</option>
  <option value="1/4-v-notch" ${area.options?.woodGlueTrowel === "1/4-v-notch" ? "selected" : ""}>Wood Glue Trowel 1/4 V-Notch</option>
</select>
      </div>

      <div class="inline-checks ${showWoodNailFields ? "" : "conditional-hidden"}">
        <label>
          <input
            data-area-id="${area.areaId}"
            data-field="woodUnderlayment"
            type="checkbox"
            ${area.options?.woodUnderlayment ? "checked" : ""}
          >
          Underlayment
        </label>

        <label>
          <input
            data-area-id="${area.areaId}"
            data-field="woodMoistureBarrier"
            type="checkbox"
            ${area.options?.woodMoistureBarrier ? "checked" : ""}
          >
          Moisture Barrier
        </label>

        <label>
          <input
            data-area-id="${area.areaId}"
            data-field="woodSoundBarrier"
            type="checkbox"
            ${area.options?.woodSoundBarrier ? "checked" : ""}
          >
          Sound Barrier
        </label>
      </div>
    </div>

    <div class="area-subsection">
      <div class="area-subsection-title">Additional Prep Options</div>
      <div class="inline-checks">
        <label>
          <input
            data-area-id="${area.areaId}"
            data-field="useLeveler"
            type="checkbox"
            ${showLeveler ? "checked" : ""}
          >
          Use Leveler
        </label>
      </div>

      <div class="grid">
        <input
          class="${showLeveler ? "" : "conditional-hidden"}"
          data-area-id="${area.areaId}"
          data-field="levelerDepth"
          type="number"
          step="0.01"
          placeholder="Leveler Depth (in)"
          value="${displayValue(area.options?.levelerDepth)}"
        >
      </div>
    </div>

    <div class="area-subsection">
      <div class="area-subsection-title">Edge Finishes</div>
      <div class="grid">
        <input
          data-area-id="${area.areaId}"
          data-field="metalTrimFt"
          type="number"
          step="0.01"
          placeholder="Metal Trim (ft)"
          value="${displayValue(area.edgeFinishes?.metalTrimFt)}"
        >

        <input
          data-area-id="${area.areaId}"
          data-field="transitionsFt"
          type="number"
          step="0.01"
          placeholder="Transitions (ft)"
          value="${displayValue(area.edgeFinishes?.transitionsFt)}"
        >
      </div>
    </div>
  `;
}

  if (area.type === "backsplash") {
    return `
      <div class="area-subsection">
        <div class="area-subsection-title">Backsplash Measurements</div>
        <div class="grid">
          <input
            data-area-id="${area.areaId}"
            data-field="area"
            type="number"
            step="0.01"
            placeholder="Backsplash Area"
            value="${displayValue(area.measurements.area)}"
          >
        </div>
      </div>

      <div class="area-subsection">
        <div class="area-subsection-title">Installation Settings</div>
        <div class="grid">
          <input
            data-area-id="${area.areaId}"
            data-field="backsplashWaste"
            type="number"
            step="0.01"
            placeholder="Backsplash Waste %"
            value="${displayValue(area.options?.backsplashWaste)}"
          >

          <select data-area-id="${area.areaId}" data-field="backsplashTrowel">
            <option value="1/4x3/16" ${area.options?.backsplashTrowel === "1/4x3/16" ? "selected" : ""}>Backsplash Trowel 1/4 x 3/16</option>
            <option value="1/4x1/4" ${area.options?.backsplashTrowel === "1/4x1/4" ? "selected" : ""}>Backsplash Trowel 1/4 x 1/4</option>
          </select>

          <select data-area-id="${area.areaId}" data-field="masticType">
            <option value="1gal" ${area.options?.masticType === "1gal" ? "selected" : ""}>Mastic 1 Gal</option>
            <option value="3.5gal" ${area.options?.masticType === "3.5gal" ? "selected" : ""}>Mastic 3.5 Gal</option>
          </select>
        </div>
      </div>

      <div class="area-subsection">
        <div class="area-subsection-title">Edge Finishes</div>
        <div class="grid">
          <input
            data-area-id="${area.areaId}"
            data-field="metalTrimFt"
            type="number"
            step="0.01"
            placeholder="Metal Trim (ft)"
            value="${displayValue(area.edgeFinishes?.metalTrimFt)}"
          >

          <input
            data-area-id="${area.areaId}"
            data-field="bullnoseFt"
            type="number"
            step="0.01"
            placeholder="Bullnose (ft)"
            value="${displayValue(area.edgeFinishes?.bullnoseFt)}"
          >

          <input
            data-area-id="${area.areaId}"
            data-field="quartzStoneCapFt"
            type="number"
            step="0.01"
            placeholder="Quartz / Stone Cap (ft)"
            value="${displayValue(area.edgeFinishes?.quartzStoneCapFt)}"
          >
        </div>
      </div>
    `;
  }

  if (area.type === "fireplace") {
  return `
    <div class="area-subsection">
      <div class="area-subsection-title">Fireplace Measurements</div>
      <div class="grid">
        <input
          data-area-id="${area.areaId}"
          data-field="tileArea"
          type="number"
          step="0.01"
          placeholder="Fireplace Tile Area"
          value="${displayValue(area.measurements.tileArea)}"
        >

        <input
          data-area-id="${area.areaId}"
          data-field="durockPrepArea"
          type="number"
          step="0.01"
          placeholder="Durock Prep Area"
          value="${displayValue(area.measurements.durockPrepArea)}"
        >
      </div>
    </div>

    <div class="area-subsection">
      <div class="area-subsection-title">Installation Settings</div>
      <div class="grid">
        <input
          data-area-id="${area.areaId}"
          data-field="fireplaceWaste"
          type="number"
          step="0.01"
          placeholder="Fireplace Waste %"
          value="${displayValue(area.options?.fireplaceWaste)}"
        >

        <select data-area-id="${area.areaId}" data-field="fireplaceTrowel">
          <option value="1/4x1/4" ${area.options?.fireplaceTrowel === "1/4x1/4" ? "selected" : ""}>Fireplace Trowel 1/4 x 1/4</option>
          <option value="1/4x3/8" ${area.options?.fireplaceTrowel === "1/4x3/8" ? "selected" : ""}>Fireplace Trowel 1/4 x 3/8</option>
          <option value="1/2x1/2" ${area.options?.fireplaceTrowel === "1/2x1/2" ? "selected" : ""}>Fireplace Trowel 1/2 x 1/2</option>
        </select>
      </div>
    </div>

    <div class="area-subsection">
      <div class="area-subsection-title">Edge Finishes</div>
      <div class="grid">
        <input
          data-area-id="${area.areaId}"
          data-field="metalTrimFt"
          type="number"
          step="0.01"
          placeholder="Metal Trim (ft)"
          value="${displayValue(area.edgeFinishes?.metalTrimFt)}"
        >

        <input
          data-area-id="${area.areaId}"
          data-field="bullnoseFt"
          type="number"
          step="0.01"
          placeholder="Bullnose (ft)"
          value="${displayValue(area.edgeFinishes?.bullnoseFt)}"
        >

        <input
          data-area-id="${area.areaId}"
          data-field="quartzStoneCapFt"
          type="number"
          step="0.01"
          placeholder="Quartz / Stone Cap (ft)"
          value="${displayValue(area.edgeFinishes?.quartzStoneCapFt)}"
        >
      </div>
    </div>
  `;
}

     if (area.type === "stairs") {
  return `
    <div class="area-subsection">
      <div class="area-subsection-title">Stair Measurements</div>
      <div class="grid">
        <input
          data-area-id="${area.areaId}"
          data-field="steps"
          type="number"
          step="1"
          placeholder="Number of Steps"
          value="${displayValue(area.measurements.steps)}"
        >

        <input
          data-area-id="${area.areaId}"
          data-field="landings"
          type="number"
          step="1"
          placeholder="Number of Landings"
          value="${displayValue(area.measurements.landings)}"
        >
      </div>
    </div>

    <div class="area-subsection">
      <div class="area-subsection-title">Stair Pricing</div>
      <div class="grid">
        <input
          data-area-id="${area.areaId}"
          data-field="pricePerStep"
          type="number"
          step="0.01"
          placeholder="Price per Step"
          value="${displayValue(area.pricing?.pricePerStep)}"
        >

        <input
          data-area-id="${area.areaId}"
          data-field="pricePerLanding"
          type="number"
          step="0.01"
          placeholder="Price per Landing"
          value="${displayValue(area.pricing?.pricePerLanding)}"
        >
      </div>
    </div>
  `;
}

  return "";
}

function getAreaQuickSummary(area) {
  const result = calculateAreaLaborTotal(area);
  const extrasTotal = calculateAreaExtrasTotal(area);
  const grandAreaTotal = result.laborTotal + extrasTotal;

  if (area.type === "shower") {
    const wallAreaLabel = area.options?.showerMeasurementMode === "manual"
      ? "Wet Wall Area"
      : "Wall Area";

    return `
      <div class="info-panel-line"><strong>${wallAreaLabel}:</strong> ${result.wallArea.toFixed(2)} sq ft</div>
      <div class="info-panel-line"><strong>Floor Area:</strong> ${result.floorArea.toFixed(2)} sq ft</div>
      <div class="info-panel-line"><strong>Dry Tile Area:</strong> ${result.dryTileArea.toFixed(2)} sq ft</div>
      <div class="info-panel-line"><strong>Total Install Area:</strong> ${result.measuredArea.toFixed(2)} sq ft</div>
      <div class="info-panel-line"><strong>Wet Labor Total:</strong> ${formatMoney(result.wetLaborTotal || 0)}</div>
      <div class="info-panel-line"><strong>Dry Tile Labor:</strong> ${formatMoney(result.dryTileLaborTotal || 0)}</div>
      <div class="info-panel-line"><strong>Labor Total:</strong> ${formatMoney(result.laborTotal)}</div>
      <div class="info-panel-line"><strong>Extras Total:</strong> ${formatMoney(extrasTotal)}</div>
      <div class="info-panel-line"><strong>Shower Total:</strong> ${formatMoney(grandAreaTotal)}</div>
    `;
  }

  if (area.type === "floor") {
    const floorType = area.options?.floorType || "tile";
    const floorTypeLabel =
      floorType === "laminate" ? "Laminate Floor" :
      floorType === "wood" ? "Wood Floor" :
      "Tile Floor";

    return `
      <div class="info-panel-line"><strong>Floor Type:</strong> ${floorTypeLabel}</div>
      <div class="info-panel-line"><strong>Floor Area:</strong> ${result.measuredArea.toFixed(2)} sq ft</div>
      <div class="info-panel-line"><strong>Labor Total:</strong> ${formatMoney(result.laborTotal)}</div>
      <div class="info-panel-line"><strong>Extras Total:</strong> ${formatMoney(extrasTotal)}</div>
      <div class="info-panel-line"><strong>Floor Total:</strong> ${formatMoney(grandAreaTotal)}</div>
    `;
  }

  if (area.type === "backsplash") {
  return `
    <div class="info-panel-line"><strong>Backsplash Area:</strong> ${result.measuredArea.toFixed(2)} sq ft</div>
    <div class="info-panel-line"><strong>Labor Total:</strong> ${formatMoney(result.laborTotal)}</div>
    <div class="info-panel-line"><strong>Extras Total:</strong> ${formatMoney(extrasTotal)}</div>
    <div class="info-panel-line"><strong>Backsplash Total:</strong> ${formatMoney(grandAreaTotal)}</div>
  `;
}

  if (area.type === "fireplace") {
    return `
      <div class="info-panel-line"><strong>Tile Area:</strong> ${result.measuredArea.toFixed(2)} sq ft</div>
      <div class="info-panel-line"><strong>Labor Total:</strong> ${formatMoney(result.laborTotal)}</div>
      <div class="info-panel-line"><strong>Extras Total:</strong> ${formatMoney(extrasTotal)}</div>
      <div class="info-panel-line"><strong>Fireplace Total:</strong> ${formatMoney(grandAreaTotal)}</div>
    `;
  }

  if (area.type === "stairs") {
  return `
    <div class="info-panel-line"><strong>Steps:</strong> ${result.steps}</div>
    <div class="info-panel-line"><strong>Landings:</strong> ${result.landings}</div>
    <div class="info-panel-line"><strong>Steps Total:</strong> ${formatMoney(result.stepsTotal)}</div>
    <div class="info-panel-line"><strong>Landings Total:</strong> ${formatMoney(result.landingsTotal)}</div>
    <div class="info-panel-line"><strong>Stairs Total:</strong> ${formatMoney(grandAreaTotal)}</div>
  `;
}

  return "";
}

function calculateProjectMaterials(project) {
  const totals = {
    mudBedBags: 0,
    drains: 0,
    grates: 0,

    thinsetBagsTotal: 0,
    mastic1Gal: 0,

    goboard3x5: 0,
    goboard4x8: 0,
    kerdiBoard3x5: 0,
    kerdiBoard4x8: 0,
    hardieBackerHalfIn: 0,
    durockHalfBoards: 0,
    durockQuarterBoards: 0,

    foamBoardScrews: 0,
    foamBoardWashers: 0,
    cementBoardScrews: 0,
    bandRolls: 0,
    meshTapeRolls: 0,
    sealantTubes: 0,

    waterproofFoamArea: 0,
    waterproofSheetArea: 0,
    waterproofLiquidArea: 0,
    showerFloorMembraneArea: 0,

    ditraArea: 0,
    levelerBags: 0,

    laminateUnderlaymentArea: 0,
    laminateVaporBarrierArea: 0,

    woodUnderlaymentArea: 0,
    woodMoistureBarrierArea: 0,
    woodSoundBarrierArea: 0,
    woodGlueUnits: 0,
    woodNailBoxes: 0,

    foamPanUnits: 0,
    prefabPanUnits: 0,

    prefabNicheUnits: 0,
    prefabBenchUnits: 0,
    prefabCurbUnits: 0,

    metalTrimFt: 0,
    bullnoseFt: 0,
    quartzStoneCapFt: 0,
    transitionsFt: 0
  };

  if (!project || !project.areas) return totals;

  project.areas.forEach(area => {
    const materials = calculateAreaMaterials(area);
    const prep = materials.prep || {};
    const install = materials.install || {};
    const edgeFinishes = area.edgeFinishes || {};

    totals.mudBedBags += Number(prep.mudBedBags) || 0;
    totals.drains += Number(prep.drains) || 0;
    totals.grates += Number(prep.grates) || 0;

    totals.thinsetBagsTotal +=
      (Number(prep.prepThinsetBags) || 0) +
      (Number(install.wallThinsetBags) || 0) +
      (Number(install.floorThinsetBags) || 0) +
      (Number(install.thinsetBags) || 0);

    totals.mastic1Gal += Number(install.mastic1Gal) || 0;

    if (prep.boardType === "goboard") {
      if (Number(prep.boardSize) === 15) {
        totals.goboard3x5 += Number(prep.boardsNeeded) || 0;
      }

      if (Number(prep.boardSize) === 32) {
        totals.goboard4x8 += Number(prep.boardsNeeded) || 0;
      }
    }

    if (prep.boardType === "kerdi") {
      if (Number(prep.boardSize) === 15) {
        totals.kerdiBoard3x5 += Number(prep.boardsNeeded) || 0;
      }

      if (Number(prep.boardSize) === 32) {
        totals.kerdiBoard4x8 += Number(prep.boardsNeeded) || 0;
      }
    }

    if (prep.boardType === "hardie") {
      totals.hardieBackerHalfIn += Number(prep.boardsNeeded) || 0;
    }

    if (prep.boardType === "durock" && area.type === "shower") {
      totals.durockHalfBoards += Number(prep.boardsNeeded) || 0;
    }

    if (prep.durockBoards > 0 && area.type === "floor") {
      totals.durockQuarterBoards += Number(prep.durockBoards) || 0;
    }

    if (area.type === "fireplace") {
      totals.durockHalfBoards += Number(prep.durockBoards) || 0;
      totals.meshTapeRolls += Number(prep.meshTapeRolls) || 0;
    }

    totals.foamBoardScrews += Number(prep.foamBoardScrews) || 0;
    totals.foamBoardWashers += Number(prep.foamBoardWashers) || 0;
    totals.cementBoardScrews += Number(prep.cementBoardScrews) || 0;
    totals.bandRolls += Number(prep.bandRolls) || 0;

    if (area.type !== "fireplace") {
      totals.meshTapeRolls += Number(prep.meshTapeRolls) || 0;
    }

    totals.sealantTubes += Number(prep.sealantTubes) || 0;

    if (prep.waterproofType === "foam") {
      totals.waterproofFoamArea += Number(prep.waterproofArea) || 0;
    }

    if (prep.waterproofType === "sheet") {
      totals.waterproofSheetArea += Number(prep.waterproofArea) || 0;
    }

    if (prep.waterproofType === "liquid") {
      totals.waterproofLiquidArea += Number(prep.waterproofArea) || 0;
    }

    totals.showerFloorMembraneArea += Number(prep.showerFloorMembraneArea) || 0;

    totals.ditraArea += Number(prep.ditraArea) || 0;
    totals.levelerBags += Number(prep.levelerBags) || 0;

    totals.laminateUnderlaymentArea += Number(prep.laminateUnderlaymentArea) || 0;
    totals.laminateVaporBarrierArea += Number(prep.laminateVaporBarrierArea) || 0;

    totals.woodUnderlaymentArea += Number(prep.woodUnderlaymentArea) || 0;
    totals.woodMoistureBarrierArea += Number(prep.woodMoistureBarrierArea) || 0;
    totals.woodSoundBarrierArea += Number(prep.woodSoundBarrierArea) || 0;
    totals.woodGlueUnits += Number(prep.woodGlueUnits) || 0;
    totals.woodNailBoxes += Number(prep.woodNailBoxes) || 0;

    totals.foamPanUnits += Number(prep.foamPanUnits) || 0;
    totals.prefabPanUnits += Number(prep.prefabPanUnits) || 0;

    totals.prefabNicheUnits += Number(prep.prefabNicheUnits) || 0;
    totals.prefabBenchUnits += Number(prep.prefabBenchUnits) || 0;
    totals.prefabCurbUnits += Number(prep.prefabCurbUnits) || 0;

    totals.metalTrimFt += Number(edgeFinishes.metalTrimFt) || 0;
    totals.bullnoseFt += Number(edgeFinishes.bullnoseFt) || 0;
    totals.quartzStoneCapFt += Number(edgeFinishes.quartzStoneCapFt) || 0;
    totals.transitionsFt += Number(edgeFinishes.transitionsFt) || 0;
  });

  return totals;
}

function roundUpToPack(quantity, packSize) {
  const safeQuantity = Number(quantity) || 0;
  const safePackSize = Number(packSize) || 1;

  if (safeQuantity <= 0) return 0;
  return Math.ceil(safeQuantity / safePackSize) * safePackSize;
}

function getBoxCount(quantity, boxSize) {
  const safeQuantity = Number(quantity) || 0;
  const safeBoxSize = Number(boxSize) || 1;

  if (safeQuantity <= 0) return 0;
  return Math.max(1, Math.ceil(safeQuantity / safeBoxSize));
}

function renderMaterialsSummary() {
  const container = document.getElementById("materialsSummaryContainer");
  const project = state.currentProject;

  if (!container) return;
  if (!project) {
    container.textContent = "No materials calculated yet.";
    return;
  }

  const totals = calculateProjectMaterials(project);
  const lines = [];

  const foamBoardScrewsRounded = roundUpToPack(totals.foamBoardScrews, 100);
  const foamBoardWashersRounded = roundUpToPack(totals.foamBoardWashers, 100);
  const cementBoardScrewBoxes = getBoxCount(totals.cementBoardScrews, 500);

  if (totals.thinsetBagsTotal > 0) {
    lines.push(`<div class="quote-line"><span>Thinset Bags</span><span>${totals.thinsetBagsTotal}</span></div>`);
  }

  if (totals.mastic1Gal > 0) {
    lines.push(`<div class="quote-line"><span>Mastic (1 Gal)</span><span>${totals.mastic1Gal}</span></div>`);
  }

  if (totals.mudBedBags > 0) {
    lines.push(`<div class="quote-line"><span>Mud Bed Bags</span><span>${totals.mudBedBags}</span></div>`);
  }

  if (totals.drains > 0) {
    lines.push(`<div class="quote-line"><span>Drains</span><span>${totals.drains}</span></div>`);
  }

  if (totals.grates > 0) {
    lines.push(`<div class="quote-line"><span>Grates</span><span>${totals.grates}</span></div>`);
  }

  if (totals.goboard3x5 > 0) {
    lines.push(`<div class="quote-line"><span>GoBoard 3x5</span><span>${totals.goboard3x5}</span></div>`);
  }

  if (totals.goboard4x8 > 0) {
    lines.push(`<div class="quote-line"><span>GoBoard 4x8</span><span>${totals.goboard4x8}</span></div>`);
  }

  if (totals.kerdiBoard3x5 > 0) {
    lines.push(`<div class="quote-line"><span>Kerdi Board 3x5</span><span>${totals.kerdiBoard3x5}</span></div>`);
  }

  if (totals.kerdiBoard4x8 > 0) {
    lines.push(`<div class="quote-line"><span>Kerdi Board 4x8</span><span>${totals.kerdiBoard4x8}</span></div>`);
  }

  if (totals.hardieBackerHalfIn > 0) {
    lines.push(`<div class="quote-line"><span>HardieBacker 1/2 Boards</span><span>${totals.hardieBackerHalfIn}</span></div>`);
  }

  if (totals.durockHalfBoards > 0) {
    lines.push(`<div class="quote-line"><span>Durock 1/2 Boards</span><span>${totals.durockHalfBoards}</span></div>`);
  }

  if (totals.durockQuarterBoards > 0) {
    lines.push(`<div class="quote-line"><span>Durock 1/4 Boards</span><span>${totals.durockQuarterBoards}</span></div>`);
  }

  if (foamBoardScrewsRounded > 0) {
    lines.push(`<div class="quote-line"><span>Foam Board Screws (100 ct)</span><span>${foamBoardScrewsRounded}</span></div>`);
  }

  if (foamBoardWashersRounded > 0) {
    lines.push(`<div class="quote-line"><span>Foam Board Washers (100 ct)</span><span>${foamBoardWashersRounded}</span></div>`);
  }

  if (cementBoardScrewBoxes > 0) {
    lines.push(`<div class="quote-line"><span>Cement Board Screws (500 ct box)</span><span>${cementBoardScrewBoxes} box</span></div>`);
  }

  if (totals.bandRolls > 0) {
    lines.push(`<div class="quote-line"><span>Band</span><span>As needed</span></div>`);
  }

  if (totals.meshTapeRolls > 0) {
    lines.push(`<div class="quote-line"><span>Mesh Tape</span><span>As needed</span></div>`);
  }

  if (totals.sealantTubes > 0) {
    lines.push(`<div class="quote-line"><span>Sealant / Kerdi Fix</span><span>As needed</span></div>`);
  }

  if (totals.ditraArea > 0) {
    lines.push(`<div class="quote-line"><span>Ditra Area</span><span>${totals.ditraArea.toFixed(2)} sq ft</span></div>`);
  }

  if (totals.levelerBags > 0) {
    lines.push(`<div class="quote-line"><span>Leveler Bags</span><span>${totals.levelerBags}</span></div>`);
  }

  if (totals.laminateUnderlaymentArea > 0) {
    lines.push(`<div class="quote-line"><span>Laminate Underlayment</span><span>${totals.laminateUnderlaymentArea.toFixed(2)} sq ft</span></div>`);
  }

  if (totals.laminateVaporBarrierArea > 0) {
    lines.push(`<div class="quote-line"><span>Laminate Vapor Barrier</span><span>${totals.laminateVaporBarrierArea.toFixed(2)} sq ft</span></div>`);
  }

  if (totals.woodUnderlaymentArea > 0) {
    lines.push(`<div class="quote-line"><span>Wood Underlayment</span><span>${totals.woodUnderlaymentArea.toFixed(2)} sq ft</span></div>`);
  }

  if (totals.woodMoistureBarrierArea > 0) {
    lines.push(`<div class="quote-line"><span>Wood Moisture Barrier</span><span>${totals.woodMoistureBarrierArea.toFixed(2)} sq ft</span></div>`);
  }

  if (totals.woodSoundBarrierArea > 0) {
    lines.push(`<div class="quote-line"><span>Wood Sound Barrier</span><span>${totals.woodSoundBarrierArea.toFixed(2)} sq ft</span></div>`);
  }

  if (totals.woodGlueUnits > 0) {
    lines.push(`<div class="quote-line"><span>Wood Glue (gal)</span><span>${totals.woodGlueUnits}</span></div>`);
  }

  if (totals.woodNailBoxes > 0) {
    lines.push(`<div class="quote-line"><span>Wood Nails / Staples</span><span>As needed</span></div>`);
  }

  if (totals.waterproofFoamArea > 0) {
    lines.push(`<div class="quote-line"><span>Foam System Area</span><span>${totals.waterproofFoamArea.toFixed(2)} sq ft</span></div>`);
  }

  if (totals.waterproofSheetArea > 0) {
    lines.push(`<div class="quote-line"><span>Sheet Membrane Area</span><span>${totals.waterproofSheetArea.toFixed(2)} sq ft</span></div>`);
  }

  if (totals.showerFloorMembraneArea > 0) {
    lines.push(`<div class="quote-line"><span>Shower Floor Membrane</span><span>${totals.showerFloorMembraneArea.toFixed(2)} sq ft</span></div>`);
  }

  if (totals.waterproofLiquidArea > 0) {
    lines.push(`<div class="quote-line"><span>Liquid Waterproof Area</span><span>${totals.waterproofLiquidArea.toFixed(2)} sq ft</span></div>`);
  }

  if (totals.foamPanUnits > 0) {
    lines.push(`<div class="quote-line"><span>Foam Pans</span><span>${totals.foamPanUnits}</span></div>`);
  }

  if (totals.prefabPanUnits > 0) {
    lines.push(`<div class="quote-line"><span>Prefab Pans</span><span>${totals.prefabPanUnits}</span></div>`);
  }

  if (totals.prefabNicheUnits > 0) {
    lines.push(`<div class="quote-line"><span>Prefab Niches</span><span>${totals.prefabNicheUnits}</span></div>`);
  }

  if (totals.prefabBenchUnits > 0) {
    lines.push(`<div class="quote-line"><span>Prefab Benches</span><span>${totals.prefabBenchUnits}</span></div>`);
  }

  if (totals.prefabCurbUnits > 0) {
    lines.push(`<div class="quote-line"><span>Prefab Curbs</span><span>${totals.prefabCurbUnits}</span></div>`);
  }

  if (totals.metalTrimFt > 0) {
    lines.push(`<div class="quote-line"><span>Metal Trim</span><span>${totals.metalTrimFt.toFixed(2)} ft</span></div>`);
  }

  if (totals.bullnoseFt > 0) {
    lines.push(`<div class="quote-line"><span>Bullnose</span><span>${totals.bullnoseFt.toFixed(2)} ft</span></div>`);
  }

  if (totals.quartzStoneCapFt > 0) {
    lines.push(`<div class="quote-line"><span>Quartz / Stone Cap</span><span>${totals.quartzStoneCapFt.toFixed(2)} ft</span></div>`);
  }

  if (totals.transitionsFt > 0) {
    lines.push(`<div class="quote-line"><span>Transitions</span><span>${totals.transitionsFt.toFixed(2)} ft</span></div>`);
  }

  if (lines.length === 0) {
    container.textContent = "No materials calculated yet.";
    return;
  }

  container.innerHTML = `<div class="quote-block">${lines.join("")}</div>`;
}

function getDryTileExtensionsHTML(area) {
  if (area.type !== "shower") return "";

  const items = Array.isArray(area.dryTileExtensions) ? area.dryTileExtensions : [];

  return `
    <div class="info-panel">
      <div class="info-panel-title">Dry Shower Charges</div>

      ${items.length === 0 ? `<div>No dry shower charges added.</div>` : ""}

      <div class="stacked-blocks">
        ${items.map(item => {
          const itemArea = Number(item.area) || 0;
          const itemPrice = Number(item.pricePerSqFt) || 0;
          const itemTotal = itemArea * itemPrice;

          return `
          <div>
            <div class="grid task-row">
              <input
                data-area-id="${area.areaId}"
                data-dry-tile-id="${item.id}"
                data-dry-tile-field="description"
                type="text"
                placeholder="Dry Area Description"
                value="${item.description || ""}"
              >
              <input
                data-area-id="${area.areaId}"
                data-dry-tile-id="${item.id}"
                data-dry-tile-field="area"
                type="number"
                step="0.01"
                placeholder="Dry Area sq ft"
                value="${displayValue(item.area)}"
              >
              <input
                data-area-id="${area.areaId}"
                data-dry-tile-id="${item.id}"
                data-dry-tile-field="pricePerSqFt"
                type="number"
                step="0.01"
                placeholder="Dry Area Price per sq ft"
                value="${displayValue(item.pricePerSqFt)}"
              >
              <input
                type="text"
                data-dry-tile-total="${item.id}"
                value="Dry Area Total: ${formatMoney(itemTotal)}"
                readonly
              >
            </div>
            <div class="area-actions">
              <button type="button" data-action="remove-dry-tile" data-area-id="${area.areaId}" data-dry-tile-id="${item.id}">Remove Dry Shower Charge</button>
            </div>
          </div>
        `;
        }).join("")}
      </div>

      <div class="area-actions">
        <button type="button" data-action="add-dry-tile" data-area-id="${area.areaId}">Add Dry Shower Charge</button>
      </div>
    </div>
  `;
}

function getAreaMaterialsHTML(area) {
  const materials = calculateAreaMaterials(area);

  const prep = materials.prep || {};
  const install = materials.install || {};
  const derived = materials.derived || {};
  const edgeFinishes = area.edgeFinishes || {};

  let lines = [];

     if (area.type === "stairs") {
  return `<div>No materials calculated for stairs yet.</div>`;
}

  if (area.type === "fireplace") {
    if (derived.tileAreaWithWaste > 0) {
      lines.push(`<div><strong>Fireplace Tile Area w/ Waste:</strong> ${derived.tileAreaWithWaste.toFixed(2)} sq ft</div>`);
    }

    if (prep.durockPrepArea > 0) {
      lines.push(`<div><strong>Durock Prep Area:</strong> ${prep.durockPrepArea.toFixed(2)} sq ft</div>`);
    }

    if (prep.durockBoards > 0) {
      lines.push(`<div><strong>Durock Boards:</strong> ${prep.durockBoards}</div>`);
    }

    if (prep.meshTapeRolls > 0) {
      lines.push(`<div><strong>Mesh Tape:</strong> As needed</div>`);
    }

    if (install.thinsetBags > 0) {
      lines.push(`<div><strong>Thinset Bags:</strong> ${install.thinsetBags}</div>`);
    }

    if (derived.fireplaceTrowel) {
      lines.push(`<div><strong>Fireplace Trowel:</strong> ${derived.fireplaceTrowel}</div>`);
    }

    if ((Number(edgeFinishes.metalTrimFt) || 0) > 0) {
      lines.push(`<div><strong>Metal Trim:</strong> ${Number(edgeFinishes.metalTrimFt).toFixed(2)} ft</div>`);
    }

    if ((Number(edgeFinishes.bullnoseFt) || 0) > 0) {
      lines.push(`<div><strong>Bullnose:</strong> ${Number(edgeFinishes.bullnoseFt).toFixed(2)} ft</div>`);
    }

    if ((Number(edgeFinishes.quartzStoneCapFt) || 0) > 0) {
      lines.push(`<div><strong>Quartz / Stone Cap:</strong> ${Number(edgeFinishes.quartzStoneCapFt).toFixed(2)} ft</div>`);
    }

    if (lines.length === 0) {
      return `<div>No materials calculated yet.</div>`;
    }

    return lines.join("");
  }

  if (derived.wallAreaWithWaste > 0) {
    lines.push(`<div><strong>Wall Area w/ Waste:</strong> ${derived.wallAreaWithWaste.toFixed(2)} sq ft</div>`);
  }

  if (derived.floorAreaWithWaste > 0) {
    lines.push(`<div><strong>Floor Area w/ Waste:</strong> ${derived.floorAreaWithWaste.toFixed(2)} sq ft</div>`);
  }

  if (derived.areaWithWaste > 0) {
    lines.push(`<div><strong>Backsplash Area w/ Waste:</strong> ${derived.areaWithWaste.toFixed(2)} sq ft</div>`);
  }

  if (derived.dryTileArea > 0) {
    lines.push(`<div><strong>Dry Tile Area:</strong> ${derived.dryTileArea.toFixed(2)} sq ft</div>`);
  }

  if (derived.installWallArea > 0 && derived.installWallArea !== derived.wallArea) {
    lines.push(`<div><strong>Install Wall Area:</strong> ${derived.installWallArea.toFixed(2)} sq ft</div>`);
  }

  if (derived.prepWallArea > 0 && derived.prepWallArea !== derived.wallArea) {
    lines.push(`<div><strong>Prep Wall Area:</strong> ${derived.prepWallArea.toFixed(2)} sq ft</div>`);
  }

  if (derived.wetExtrasArea > 0) {
    lines.push(`<div><strong>Wet Extras Area:</strong> ${derived.wetExtrasArea.toFixed(2)} sq ft</div>`);
  }

  if (prep.floorType) {
    const floorTypeLabel =
      prep.floorType === "laminate" ? "Laminate Floor" :
      prep.floorType === "wood" ? "Wood Floor" :
      "Tile Floor";

    lines.push(`<div><strong>Floor Type:</strong> ${floorTypeLabel}</div>`);
  }

  if (prep.prepSystem && prep.prepSystem !== "none") {
    lines.push(`<div><strong>Prep System:</strong> ${prep.prepSystem}</div>`);
  }

  if (derived.useLeveler) {
    lines.push(`<div><strong>Leveler:</strong> Yes</div>`);
  }

  if (prep.boardsNeeded > 0) {
    lines.push(`<div><strong>Boards Needed:</strong> ${prep.boardsNeeded}</div>`);
  }

  if (prep.boardType) {
    lines.push(`<div><strong>Board Type:</strong> ${prep.boardType}</div>`);
  }

  if (prep.boardSize > 0) {
    lines.push(`<div><strong>Board Size:</strong> ${prep.boardSize === 15 ? "3x5" : "4x8"}</div>`);
  }

  if (prep.waterproofType) {
    lines.push(`<div><strong>Waterproof Type:</strong> ${prep.waterproofType}</div>`);
  }

  if (prep.waterproofArea > 0) {
    lines.push(`<div><strong>Waterproof Area:</strong> ${prep.waterproofArea.toFixed(2)} sq ft</div>`);
  }

  if (prep.showerFloorMembraneArea > 0) {
    lines.push(`<div><strong>Shower Floor Membrane:</strong> ${prep.showerFloorMembraneArea.toFixed(2)} sq ft</div>`);
  }

  if (prep.ditraArea > 0) {
    lines.push(`<div><strong>Ditra Area:</strong> ${prep.ditraArea.toFixed(2)} sq ft</div>`);
  }

  if (prep.durockBoards > 0) {
    lines.push(`<div><strong>Durock Boards:</strong> ${prep.durockBoards}</div>`);
  }

  if (prep.levelerBags > 0) {
    lines.push(`<div><strong>Leveler Bags:</strong> ${prep.levelerBags}</div>`);
  }

  if (prep.prepThinsetBags > 0) {
    lines.push(`<div><strong>Prep Thinset Bags:</strong> ${prep.prepThinsetBags}</div>`);
  }

  if (prep.laminateUnderlaymentArea > 0) {
    lines.push(`<div><strong>Laminate Underlayment:</strong> ${prep.laminateUnderlaymentArea.toFixed(2)} sq ft</div>`);
  }

  if (prep.laminateVaporBarrierArea > 0) {
    lines.push(`<div><strong>Laminate Vapor Barrier:</strong> ${prep.laminateVaporBarrierArea.toFixed(2)} sq ft</div>`);
  }

  if (prep.floorType === "wood" && prep.woodInstallMethod) {
    lines.push(`<div><strong>Wood Install Method:</strong> ${prep.woodInstallMethod}</div>`);
  }

  if (prep.floorType === "wood" && prep.woodInstallMethod === "glue" && prep.woodGlueTrowel) {
    const woodGlueTrowelLabel =
      prep.woodGlueTrowel === "3/16-v-notch" ? "3/16 V-Notch" :
      prep.woodGlueTrowel === "1/4-v-notch" ? "1/4 V-Notch" :
      prep.woodGlueTrowel;

    lines.push(`<div><strong>Wood Glue Trowel:</strong> ${woodGlueTrowelLabel}</div>`);
  }

  if (prep.woodUnderlaymentArea > 0) {
    lines.push(`<div><strong>Wood Underlayment:</strong> ${prep.woodUnderlaymentArea.toFixed(2)} sq ft</div>`);
  }

  if (prep.woodMoistureBarrierArea > 0) {
    lines.push(`<div><strong>Wood Moisture Barrier:</strong> ${prep.woodMoistureBarrierArea.toFixed(2)} sq ft</div>`);
  }

  if (prep.woodSoundBarrierArea > 0) {
    lines.push(`<div><strong>Wood Sound Barrier:</strong> ${prep.woodSoundBarrierArea.toFixed(2)} sq ft</div>`);
  }

  if (prep.woodGlueUnits > 0) {
    lines.push(`<div><strong>Wood Glue (gal):</strong> ${prep.woodGlueUnits}</div>`);
  }

  if (prep.floorType === "wood" && prep.woodInstallMethod === "nail") {
    lines.push(`<div><strong>Wood Nails / Staples:</strong> As needed</div>`);
  }

  if (prep.mudBedBags > 0) {
    lines.push(`<div><strong>Mud Bed Bags:</strong> ${prep.mudBedBags}</div>`);
  }

  if (derived.mudBedDepthIn > 0 && prep.panType === "mud") {
    lines.push(`<div><strong>Mud Bed Depth:</strong> ${derived.mudBedDepthIn.toFixed(2)} in</div>`);
  }

  if (derived.mudBedVolumeCuFt > 0 && prep.panType === "mud") {
    lines.push(`<div><strong>Mud Bed Volume:</strong> ${derived.mudBedVolumeCuFt.toFixed(2)} cu ft</div>`);
  }

  if (prep.foamPanUnits > 0) {
    lines.push(`<div><strong>Foam Pans:</strong> ${prep.foamPanUnits}</div>`);
  }

  if (prep.prefabPanUnits > 0) {
    lines.push(`<div><strong>Prefab Pans:</strong> ${prep.prefabPanUnits}</div>`);
  }

  if (prep.panType) {
    lines.push(`<div><strong>Pan Type:</strong> ${prep.panType}</div>`);
  }

  if (prep.drains > 0) {
    lines.push(`<div><strong>Drains:</strong> ${prep.drains}</div>`);
  }

  if (prep.grates > 0) {
    lines.push(`<div><strong>Grates:</strong> ${prep.grates}</div>`);
  }

  if (prep.foamBoardScrews > 0) {
    lines.push(`<div><strong>Foam Board Screws:</strong> ${prep.foamBoardScrews}</div>`);
  }

  if (prep.foamBoardWashers > 0) {
    lines.push(`<div><strong>Foam Board Washers:</strong> ${prep.foamBoardWashers}</div>`);
  }

  if (prep.cementBoardScrews > 0) {
    lines.push(`<div><strong>Cement Board Screws:</strong> ${prep.cementBoardScrews}</div>`);
  }

  if (prep.bandRolls > 0) {
    lines.push(`<div><strong>Band Rolls:</strong> ${prep.bandRolls}</div>`);
  }

  if (prep.meshTapeRolls > 0) {
    lines.push(`<div><strong>Mesh Tape Rolls:</strong> ${prep.meshTapeRolls}</div>`);
  }

  if (prep.sealantTubes > 0) {
    lines.push(`<div><strong>Sealant Tubes:</strong> ${prep.sealantTubes}</div>`);
  }

  if (install.wallThinsetBags > 0) {
    lines.push(`<div><strong>Wall Thinset Bags:</strong> ${install.wallThinsetBags}</div>`);
  }

  if (install.floorThinsetBags > 0) {
    lines.push(`<div><strong>Shower Floor Thinset Bags:</strong> ${install.floorThinsetBags}</div>`);
  }

  if (install.thinsetBags > 0) {
    lines.push(`<div><strong>Install Thinset Bags:</strong> ${install.thinsetBags}</div>`);
  }

  if (install.mastic1Gal > 0) {
    lines.push(`<div><strong>Mastic (1 Gal):</strong> ${install.mastic1Gal}</div>`);
  }

  if (derived.wallTrowel) {
    lines.push(`<div><strong>Wall Trowel:</strong> ${derived.wallTrowel}</div>`);
  }

  if (prep.floorType === "tile" && derived.floorTrowel) {
    lines.push(`<div><strong>Floor Trowel:</strong> ${derived.floorTrowel}</div>`);
  }

  if (prep.niche > 0) {
    lines.push(`<div><strong>Niche:</strong> Yes</div>`);
  }

  if (prep.bench > 0) {
    lines.push(`<div><strong>Bench:</strong> Yes</div>`);
  }

  if (prep.curb > 0) {
    lines.push(`<div><strong>Curb:</strong> Yes</div>`);
  }

  if (derived.nicheType && prep.niche > 0) {
    lines.push(`<div><strong>Niche Type:</strong> ${derived.nicheType}</div>`);
  }

  if (derived.benchType && prep.bench > 0) {
    lines.push(`<div><strong>Bench Type:</strong> ${derived.benchType}</div>`);
  }

  if (derived.curbType && prep.curb > 0) {
    lines.push(`<div><strong>Curb Type:</strong> ${derived.curbType}</div>`);
  }

  if (prep.prefabNicheUnits > 0) {
    lines.push(`<div><strong>Prefab Niches:</strong> ${prep.prefabNicheUnits}</div>`);
  }

  if (prep.prefabBenchUnits > 0) {
    lines.push(`<div><strong>Prefab Benches:</strong> ${prep.prefabBenchUnits}</div>`);
  }

  if (prep.prefabCurbUnits > 0) {
    lines.push(`<div><strong>Prefab Curbs:</strong> ${prep.prefabCurbUnits}</div>`);
  }

  if ((Number(edgeFinishes.metalTrimFt) || 0) > 0) {
    lines.push(`<div><strong>Metal Trim:</strong> ${Number(edgeFinishes.metalTrimFt).toFixed(2)} ft</div>`);
  }

  if ((Number(edgeFinishes.bullnoseFt) || 0) > 0) {
    lines.push(`<div><strong>Bullnose:</strong> ${Number(edgeFinishes.bullnoseFt).toFixed(2)} ft</div>`);
  }

  if ((Number(edgeFinishes.quartzStoneCapFt) || 0) > 0) {
    lines.push(`<div><strong>Quartz / Stone Cap:</strong> ${Number(edgeFinishes.quartzStoneCapFt).toFixed(2)} ft</div>`);
  }

  if ((Number(edgeFinishes.transitionsFt) || 0) > 0) {
    lines.push(`<div><strong>Transitions:</strong> ${Number(edgeFinishes.transitionsFt).toFixed(2)} ft</div>`);
  }

  if (lines.length === 0) {
    return `<div>No materials calculated yet.</div>`;
  }

  return lines.join("");
}

function addCustomTaskToArea(areaId) {
  const area = state.currentProject?.areas.find(item => item.areaId === areaId);
  if (!area || area.type !== "shower") return;

  if (!Array.isArray(area.customTasks)) {
    area.customTasks = [];
  }

  area.customTasks.push(createCustomTask());
  touchCurrentProject();
}

function removeCustomTaskFromArea(areaId, taskId) {
  const area = state.currentProject?.areas.find(item => item.areaId === areaId);
  if (!area || !Array.isArray(area.customTasks)) return;

  area.customTasks = area.customTasks.filter(task => task.id !== taskId);
  touchCurrentProject();
}

function updateCustomTaskField(areaId, taskId, field, value) {
  const area = state.currentProject?.areas.find(item => item.areaId === areaId);
  if (!area || !Array.isArray(area.customTasks)) return;

  const task = area.customTasks.find(item => item.id === taskId);
  if (!task) return;

  if (field === "description") {
    task.description = value;
  }

  if (field === "price") {
    task.price = Number(value) || 0;
  }

  touchCurrentProject();
}

function createFireplaceTask() {
  return {
    id: `fireplace-task-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    description: "",
    price: 0
  };
}

function calculateFireplaceTasksTotal(area) {
  if (!area || !Array.isArray(area.fireplaceTasks)) {
    return 0;
  }

  return area.fireplaceTasks.reduce((total, task) => {
    return total + (Number(task.price) || 0);
  }, 0);
}

function getFireplaceTasksHTML(area) {
  if (area.type !== "fireplace") return "";

  const tasks = Array.isArray(area.fireplaceTasks) ? area.fireplaceTasks : [];

  return `
    <div class="info-panel">
      <div class="info-panel-title">Additional Fireplace Charges</div>

      ${tasks.length === 0 ? `<div>No additional fireplace charges added.</div>` : ""}

      <div class="stacked-blocks">
        ${tasks.map(task => `
          <div>
            <div class="grid task-row">
              <input
                data-area-id="${area.areaId}"
                data-fireplace-task-id="${task.id}"
                data-fireplace-task-field="description"
                type="text"
                placeholder="Charge Description"
                value="${task.description || ""}"
              >
              <input
                data-area-id="${area.areaId}"
                data-fireplace-task-id="${task.id}"
                data-fireplace-task-field="price"
                type="number"
                step="0.01"
                placeholder="Charge Price"
                value="${displayValue(task.price)}"
              >
            </div>
            <div class="area-actions">
              <button type="button" data-action="remove-fireplace-task" data-area-id="${area.areaId}" data-fireplace-task-id="${task.id}">Remove Charge</button>
            </div>
          </div>
        `).join("")}
      </div>

      <div class="area-actions">
        <button type="button" data-action="add-fireplace-task" data-area-id="${area.areaId}">Add Fireplace Charge</button>
      </div>
    </div>
  `;
}

function addFireplaceTaskToArea(areaId) {
  const area = state.currentProject?.areas.find(item => item.areaId === areaId);
  if (!area || area.type !== "fireplace") return;

  if (!Array.isArray(area.fireplaceTasks)) {
    area.fireplaceTasks = [];
  }

  area.fireplaceTasks.push(createFireplaceTask());
  touchCurrentProject();
}

function removeFireplaceTaskFromArea(areaId, taskId) {
  const area = state.currentProject?.areas.find(item => item.areaId === areaId);
  if (!area || !Array.isArray(area.fireplaceTasks)) return;

  area.fireplaceTasks = area.fireplaceTasks.filter(task => task.id !== taskId);
  touchCurrentProject();
}

function updateFireplaceTaskField(areaId, taskId, field, value) {
  const area = state.currentProject?.areas.find(item => item.areaId === areaId);
  if (!area || !Array.isArray(area.fireplaceTasks)) return;

  const task = area.fireplaceTasks.find(item => item.id === taskId);
  if (!task) return;

  if (field === "description") {
    task.description = value;
  }

  if (field === "price") {
    task.price = Number(value) || 0;
  }

  touchCurrentProject();
}

function addFloorTaskToArea(areaId) {
  const area = state.currentProject?.areas.find(item => item.areaId === areaId);
  if (!area || area.type !== "floor") return;

  if (!Array.isArray(area.floorTasks)) {
    area.floorTasks = [];
  }

  area.floorTasks.push(createFloorTask());
  touchCurrentProject();
}

function removeFloorTaskFromArea(areaId, taskId) {
  const area = state.currentProject?.areas.find(item => item.areaId === areaId);
  if (!area || !Array.isArray(area.floorTasks)) return;

  area.floorTasks = area.floorTasks.filter(task => task.id !== taskId);
  touchCurrentProject();
}

function updateFloorTaskField(areaId, taskId, field, value) {
  const area = state.currentProject?.areas.find(item => item.areaId === areaId);
  if (!area || !Array.isArray(area.floorTasks)) return;

  const task = area.floorTasks.find(item => item.id === taskId);
  if (!task) return;

  if (field === "description") {
    task.description = value;
  }

  if (field === "price") {
    task.price = Number(value) || 0;
  }

  touchCurrentProject();
}

function addDryTileExtensionToArea(areaId) {
  const area = state.currentProject?.areas.find(item => item.areaId === areaId);
  if (!area || area.type !== "shower") return;

  if (!Array.isArray(area.dryTileExtensions)) {
    area.dryTileExtensions = [];
  }

  area.dryTileExtensions.push(createDryTileExtension());
  touchCurrentProject();
}

function removeDryTileExtensionFromArea(areaId, itemId) {
  const area = state.currentProject?.areas.find(item => item.areaId === areaId);
  if (!area || !Array.isArray(area.dryTileExtensions)) return;

  area.dryTileExtensions = area.dryTileExtensions.filter(item => item.id !== itemId);
  touchCurrentProject();
}

function updateDryTileExtensionField(areaId, itemId, field, value) {
  const area = state.currentProject?.areas.find(item => item.areaId === areaId);
  if (!area || !Array.isArray(area.dryTileExtensions)) return;

  const item = area.dryTileExtensions.find(entry => entry.id === itemId);
  if (!item) return;

  if (field === "description") {
    item.description = value;
  }

  if (field === "area") {
    item.area = Number(value) || 0;
  }

  if (field === "pricePerSqFt") {
    item.pricePerSqFt = Number(value) || 0;
  }

  touchCurrentProject();
}

function buildInfoPanel(title, bodyHTML, id = "") {
  return `
    <div class="info-panel" ${id ? `id="${id}"` : ""}>
      <div class="info-panel-title">${title}</div>
      <div class="info-panel-lines">
        ${bodyHTML}
      </div>
    </div>
  `;
}

function isAreaCollapsed(areaId) {
  state.collapsedAreas = state.collapsedAreas || {};
  return !!state.collapsedAreas[areaId];
}

function toggleAreaCollapsed(areaId) {
  state.collapsedAreas = state.collapsedAreas || {};
  state.collapsedAreas[areaId] = !state.collapsedAreas[areaId];
  renderApp();
}

function getCollapsedAreaSummary(area) {
  const result = calculateAreaLaborTotal(area);
  const extrasTotal = calculateAreaExtrasTotal(area);
  const areaTotal = result.laborTotal + extrasTotal;

  if (area.type === "stairs") {
    return `${result.steps || 0} steps, ${result.landings || 0} landings - ${formatMoney(areaTotal)}`;
  }

  return `${result.measuredArea.toFixed(2)} sq ft - ${formatMoney(areaTotal)}`;
}

function renderAreas() {
  const container = document.getElementById("areasContainer");
  const project = state.currentProject;

  if (!project) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = project.areas.map(area => {
    const collapsed = isAreaCollapsed(area.areaId);

    return `
      <div class="area-card ${collapsed ? "is-collapsed" : ""}" id="area-card-${area.areaId}">
        <div class="area-card-header">
          <div>
            <div class="area-title" id="area-title-${area.areaId}">${area.type.toUpperCase()} - ${area.name}</div>
            <div class="area-collapsed-summary">${getCollapsedAreaSummary(area)}</div>
          </div>

          <div class="area-card-header-actions">
            <button type="button" data-action="toggle-area-collapse" data-area-id="${area.areaId}">
              ${collapsed ? "Expand" : "Collapse"}
            </button>
            <button type="button" data-action="duplicate-area" data-area-id="${area.areaId}">Duplicate</button>
            <button type="button" data-action="remove-area" data-area-id="${area.areaId}">Remove</button>
          </div>
        </div>

        ${collapsed ? "" : `
          <div class="grid">
            <input
              data-area-id="${area.areaId}"
              data-field="name"
              type="text"
              placeholder="Area Name"
              value="${area.name}"
            >

            ${area.type === "stairs" ? "" : `
              <input
                data-area-id="${area.areaId}"
                data-field="laborPricePerSqFt"
                type="number"
                step="0.01"
                placeholder="Labor Price per sq ft"
                value="${displayValue(area.pricing.laborPricePerSqFt)}"
              >
            `}
          </div>

          ${getAreaMeasurementsHTML(area)}

          <div class="area-stack">
            ${buildInfoPanel("Summary", getAreaQuickSummary(area), `area-summary-${area.areaId}`)}
            ${buildInfoPanel("Materials", getAreaMaterialsHTML(area), `area-materials-${area.areaId}`)}
            ${area.type === "shower" ? getDryTileExtensionsHTML(area) : ""}
            ${area.type === "shower" ? getCustomTasksHTML(area) : ""}
            ${area.type === "floor" ? getFloorTasksHTML(area) : ""}
            ${area.type === "backsplash" ? getBacksplashTasksHTML(area) : ""}
            ${area.type === "fireplace" ? getFireplaceTasksHTML(area) : ""}
          </div>

          <div class="area-meta">
            Area ID: ${area.areaId}
          </div>
        `}
      </div>
    `;
  }).join("");
}

function refreshAreaDisplay(areaId) {
  const area = state.currentProject?.areas.find(item => item.areaId === areaId);
  if (!area) return;

  const title = document.getElementById(`area-title-${areaId}`);
  const summary = document.getElementById(`area-summary-${areaId}`);
  const materials = document.getElementById(`area-materials-${areaId}`);

  if (title) {
    title.textContent = `${area.type.toUpperCase()} - ${area.name}`;
  }

  if (summary) {
    summary.innerHTML = buildInfoPanel("Summary", getAreaQuickSummary(area)).replace(
      '<div class="info-panel"',
      `<div class="info-panel" id="area-summary-${areaId}"`
    );
  }

  if (materials) {
    materials.innerHTML = buildInfoPanel("Materials", getAreaMaterialsHTML(area)).replace(
      '<div class="info-panel"',
      `<div class="info-panel" id="area-materials-${areaId}"`
    );
  }
}

function renderSummary() {
  const summary = document.getElementById("summaryContainer");
  const project = state.currentProject;

  if (!project) {
    summary.textContent = "No project loaded.";
    return;
  }

  let totalMeasuredArea = 0;
let totalLabor = 0;
let totalExtras = 0;

project.areas.forEach(area => {
  const result = calculateAreaLaborTotal(area);
  totalMeasuredArea += result.measuredArea;
  totalLabor += result.laborTotal;
  totalExtras += calculateAreaExtrasTotal(area);
});

const projectCharges = getProjectChargesTotal(project);
const grandTotal = totalLabor + totalExtras + projectCharges;

  summary.innerHTML = `
  <div><strong>Project:</strong> ${project.projectName || "Untitled Project"}</div>
  <div><strong>Client:</strong> ${project.client.name || "-"}</div>
  <div><strong>Phone:</strong> ${project.client.phone || "-"}</div>
  <div><strong>Address:</strong> ${project.jobSite.address || "-"}</div>
  <div><strong>Areas:</strong> ${project.areas.length}</div>
  <div><strong>Total Measured Area:</strong> ${totalMeasuredArea.toFixed(2)} sq ft</div>
  <div><strong>Total Labor:</strong> ${formatMoney(totalLabor)}</div>
  <div><strong>Area Extras:</strong> ${formatMoney(totalExtras)}</div>
  <div><strong>Project Charges:</strong> ${formatMoney(projectCharges)}</div>
  <div><strong>Grand Total:</strong> ${formatMoney(grandTotal)}</div>
`;
}

function renderQuotePreview() {
  const container = document.getElementById("quotePreviewContainer");
  if (!container) return;

  container.innerHTML = buildQuotePreviewHTML(state.currentProject);
}

function getInvoice(project) {
  project.invoice = project.invoice || {
    number: "",
    date: new Date().toISOString().slice(0, 10),
    dueDate: "",
    status: "draft",
    mode: "detailed",
    paymentTerms: "",
    notes: "",
    amountPaid: 0,
    payments: [],
    customItems: []
  };

  project.invoice.customItems = Array.isArray(project.invoice.customItems)
    ? project.invoice.customItems
    : [];

  project.invoice.payments = Array.isArray(project.invoice.payments)
    ? project.invoice.payments
    : [];

  return project.invoice;
}

function createInvoiceCustomItem() {
  return {
    id: createId("invoice-item"),
    description: "",
    amount: 0
  };
}

function createInvoicePayment() {
  return {
    id: createId("invoice-payment"),
    date: new Date().toISOString().slice(0, 10),
    description: "",
    method: "",
    amount: 0
  };
}

function getProjectBillingTotals(project) {
  let totalLabor = 0;
  let totalExtras = 0;

  (project.areas || []).forEach(area => {
    const result = calculateAreaLaborTotal(area);
    totalLabor += result.laborTotal;
    totalExtras += calculateAreaExtrasTotal(area);
  });

  const projectCharges = getProjectChargesTotal(project);
  const grandTotal = totalLabor + totalExtras + projectCharges;

  return {
    totalLabor,
    totalExtras,
    projectCharges,
    grandTotal
  };
}

function getInvoiceCustomItemsTotal(invoice) {
  return (invoice.customItems || []).reduce((total, item) => {
    return total + (Number(item.amount) || 0);
  }, 0);
}

function getInvoicePaymentsTotal(invoice) {
  return (invoice.payments || []).reduce((total, payment) => {
    return total + (Number(payment.amount) || 0);
  }, 0);
}

function getInvoiceSubtotal(project) {
  const invoice = getInvoice(project);

  if (invoice.mode === "custom") {
    return getInvoiceCustomItemsTotal(invoice);
  }

  return getProjectBillingTotals(project).grandTotal;
}

function buildInvoiceDetailedLines(project) {
  return (project.areas || []).map(area => {
    const result = calculateAreaLaborTotal(area);
    const areaExtras = [];

    if (area.type === "shower" && area.options?.niche && (Number(area.options?.nichePrice) || 0) > 0) {
      areaExtras.push({ description: "Niche", amount: Number(area.options.nichePrice) || 0 });
    }

    if (area.type === "shower" && area.options?.bench && (Number(area.options?.benchPrice) || 0) > 0) {
      areaExtras.push({ description: "Bench", amount: Number(area.options.benchPrice) || 0 });
    }

    if (area.type === "shower" && area.options?.curb && (Number(area.options?.curbPrice) || 0) > 0) {
      areaExtras.push({ description: "Curb", amount: Number(area.options.curbPrice) || 0 });
    }

    [
      ...(area.customTasks || []),
      ...(area.floorTasks || []),
      ...(area.backsplashTasks || []),
      ...(area.fireplaceTasks || [])
    ].forEach(task => {
      if ((task.description || "").trim() || (Number(task.price) || 0) > 0) {
        areaExtras.push({
          description: task.description || "Additional Charge",
          amount: Number(task.price) || 0
        });
      }
    });

    const details = area.type === "stairs"
      ? `${result.steps || 0} steps, ${result.landings || 0} landings`
      : `${result.measuredArea.toFixed(2)} sq ft`;

    return `
      <div class="quote-line">
        <span>
          <strong>${getAreaLabel(area)} - ${area.name}</strong><br>
          ${details}
        </span>
        <span>${formatMoney(result.laborTotal)}</span>
      </div>
      ${areaExtras.map(item => `
        <div class="quote-line">
          <span>${item.description}</span>
          <span>${formatMoney(item.amount)}</span>
        </div>
      `).join("")}
    `;
  }).join("");
}

function getInvoiceStatusLabel(status) {
  const labels = {
    draft: "Draft",
    sent: "Sent",
    partial: "Partial Payment",
    paid: "Paid",
    overdue: "Overdue"
  };

  return labels[status] || "Draft";
}

function buildInvoicePreviewHTML(project) {
  if (!project) return "No project loaded.";

  const invoice = getInvoice(project);
  const business = state.businessProfile || {};
  const totals = getProjectBillingTotals(project);
  const subtotal = getInvoiceSubtotal(project);
  const totalPaid = getInvoicePaymentsTotal(invoice);
  const balanceDue = subtotal - totalPaid;

  const detailedLines = buildInvoiceDetailedLines(project);

  const simpleLines = `
    <div class="quote-line">
      <span>Tile installation labor</span>
      <span>${formatMoney(totals.totalLabor)}</span>
    </div>
    ${totals.totalExtras > 0 ? `
      <div class="quote-line">
        <span>Additional area charges</span>
        <span>${formatMoney(totals.totalExtras)}</span>
      </div>
    ` : ""}
    ${totals.projectCharges > 0 ? `
      <div class="quote-line">
        <span>Project charges</span>
        <span>${formatMoney(totals.projectCharges)}</span>
      </div>
    ` : ""}
  `;

  const customLines = (invoice.customItems || []).map(item => `
    <div class="quote-line">
      <span>${item.description || "Invoice Item"}</span>
      <span>${formatMoney(item.amount)}</span>
    </div>
  `).join("");

  const paymentLines = (invoice.payments || []).map((payment, index) => `
    <div class="quote-line">
      <span>
        ${payment.description || `Payment ${index + 1}`}<br>
        ${payment.date || "-"}${payment.method ? ` - ${payment.method}` : ""}
      </span>
      <span>${formatMoney(payment.amount)}</span>
    </div>
  `).join("");

  const invoiceLines =
    invoice.mode === "simple"
      ? simpleLines
      : invoice.mode === "custom"
      ? customLines || "<div>No custom invoice items added yet.</div>"
      : detailedLines || "<div>No areas added yet.</div>";

  return `
    <div class="quote-block">
      <div class="quote-header-grid">
        <div>
          <div class="quote-section-title">Business</div>
          ${business.logoDataUrl ? `<img class="business-logo" src="${business.logoDataUrl}" alt="Business logo">` : ""}
          <div><strong>Business:</strong> ${business.name || "-"}</div>
          <div><strong>Phone:</strong> ${business.phone || "-"}</div>
          <div><strong>Email:</strong> ${business.email || "-"}</div>
        </div>

        <div>
          <div class="quote-section-title">Invoice</div>
          <div><strong>Invoice #:</strong> ${invoice.number || "-"}</div>
          <div><strong>Date:</strong> ${invoice.date || "-"}</div>
          <div><strong>Due Date:</strong> ${invoice.dueDate || "-"}</div>
          <div><strong>Status:</strong> ${getInvoiceStatusLabel(invoice.status)}</div>
        </div>
      </div>

      <div class="quote-section-title">Client</div>
      <div><strong>Project:</strong> ${project.projectName || "Untitled Project"}</div>
      <div><strong>Client:</strong> ${project.client.name || "-"}</div>
      <div><strong>Phone:</strong> ${project.client.phone || "-"}</div>
      <div><strong>Address:</strong> ${project.jobSite.address || "-"}</div>

      <div class="quote-section-title">Invoice Items</div>
      ${invoiceLines}

      ${paymentLines ? `
        <div class="quote-section-title">Payments Received</div>
        ${paymentLines}
      ` : ""}

      ${invoice.paymentTerms ? `
        <div class="quote-section-title">Payment Terms</div>
        <div>${invoice.paymentTerms.replace(/\n/g, "<br>")}</div>
      ` : ""}

      ${invoice.notes ? `
        <div class="quote-section-title">Notes</div>
        <div>${invoice.notes.replace(/\n/g, "<br>")}</div>
      ` : ""}

      <div class="quote-total">
        <span>Subtotal</span>
        <span>${formatMoney(subtotal)}</span>
      </div>

      <div class="quote-line">
        <span>Total Paid</span>
        <span>${formatMoney(totalPaid)}</span>
      </div>

      <div class="quote-total">
        <span>Balance Due</span>
        <span>${formatMoney(balanceDue)}</span>
      </div>
    </div>
  `;
}

function renderInvoice() {
  const settings = document.getElementById("invoiceSettingsContainer");
  const preview = document.getElementById("invoicePreviewContainer");
  const project = state.currentProject;

  if (!settings || !preview) return;

  if (!project) {
    settings.textContent = "No project loaded.";
    preview.textContent = "No invoice generated yet.";
    return;
  }

  const invoice = getInvoice(project);

  settings.innerHTML = `
    <div class="info-panel no-print">
      <div class="info-panel-title">Invoice Settings</div>

      <div class="grid">
        <select data-invoice-field="mode">
          <option value="detailed" ${invoice.mode === "detailed" ? "selected" : ""}>Detailed</option>
          <option value="simple" ${invoice.mode === "simple" ? "selected" : ""}>Simple</option>
          <option value="custom" ${invoice.mode === "custom" ? "selected" : ""}>Custom</option>
        </select>

        <input data-invoice-field="number" type="text" placeholder="Invoice Number" value="${invoice.number || ""}">
        <input data-invoice-field="date" type="date" value="${invoice.date || ""}">
        <input data-invoice-field="dueDate" type="date" value="${invoice.dueDate || ""}">

        <select data-invoice-field="status">
          <option value="draft" ${invoice.status === "draft" ? "selected" : ""}>Draft</option>
          <option value="sent" ${invoice.status === "sent" ? "selected" : ""}>Sent</option>
          <option value="partial" ${invoice.status === "partial" ? "selected" : ""}>Partial Payment</option>
          <option value="paid" ${invoice.status === "paid" ? "selected" : ""}>Paid</option>
          <option value="overdue" ${invoice.status === "overdue" ? "selected" : ""}>Overdue</option>
        </select>
      </div>

      <textarea data-invoice-field="paymentTerms" placeholder="Payment Terms">${invoice.paymentTerms || ""}</textarea>
      <textarea data-invoice-field="notes" placeholder="Invoice Notes">${invoice.notes || ""}</textarea>

      ${invoice.mode === "custom" ? `
        <div class="area-subsection">
          <div class="area-subsection-title">Custom Invoice Items</div>
          <div class="actions">
            <button type="button" id="addInvoiceItemBtn">Add Invoice Item</button>
          </div>

          ${(invoice.customItems || []).map(item => `
            <div class="grid">
              <input data-invoice-item-id="${item.id}" data-invoice-item-field="description" type="text" placeholder="Description" value="${item.description || ""}">
              <input data-invoice-item-id="${item.id}" data-invoice-item-field="amount" type="number" step="0.01" placeholder="Amount" value="${displayValue(item.amount)}">
              <button type="button" data-action="remove-invoice-item" data-invoice-item-id="${item.id}">Remove</button>
            </div>
          `).join("")}
        </div>
      ` : ""}

      <div class="area-subsection">
        <div class="area-subsection-title">Payments / Payment History</div>
        <div class="actions">
          <button type="button" id="addInvoicePaymentBtn">Add Payment</button>
        </div>

        ${(invoice.payments || []).length === 0 ? `
          <div>No payments added yet.</div>
        ` : ""}

        ${(invoice.payments || []).map(payment => `
          <div class="grid">
            <input data-invoice-payment-id="${payment.id}" data-invoice-payment-field="date" type="date" value="${payment.date || ""}">
            <input data-invoice-payment-id="${payment.id}" data-invoice-payment-field="description" type="text" placeholder="Payment Description" value="${payment.description || ""}">
            <input data-invoice-payment-id="${payment.id}" data-invoice-payment-field="method" type="text" placeholder="Method: cash, check, Zelle..." value="${payment.method || ""}">
            <input data-invoice-payment-id="${payment.id}" data-invoice-payment-field="amount" type="number" step="0.01" placeholder="Amount" value="${displayValue(payment.amount)}">
            <button type="button" data-action="remove-invoice-payment" data-invoice-payment-id="${payment.id}">Remove Payment</button>
          </div>
        `).join("")}
      </div>
    </div>
  `;

  preview.innerHTML = buildInvoicePreviewHTML(project);
}

function refreshInvoicePreview() {
  const preview = document.getElementById("invoicePreviewContainer");
  if (!preview || !state.currentProject) return;

  preview.innerHTML = buildInvoicePreviewHTML(state.currentProject);
}

function updateInvoiceField(field, value) {
  if (!state.currentProject) return;

  const invoice = getInvoice(state.currentProject);
  invoice[field] = value;

  touchCurrentProject();

  if (field === "mode") {
    renderInvoice();
    bindInvoiceInputs();
    return;
  }

  refreshInvoicePreview();
}

function addInvoiceItem() {
  if (!state.currentProject) return;

  const invoice = getInvoice(state.currentProject);
  invoice.customItems.push(createInvoiceCustomItem());

  touchCurrentProject();
  renderInvoice();
  bindInvoiceInputs();
}

function updateInvoiceItem(itemId, field, value) {
  const invoice = getInvoice(state.currentProject);
  const item = invoice.customItems.find(entry => entry.id === itemId);
  if (!item) return;

  item[field] = field === "amount" ? Number(value) || 0 : value;

  touchCurrentProject();
  refreshInvoicePreview();
}

function removeInvoiceItem(itemId) {
  const invoice = getInvoice(state.currentProject);
  invoice.customItems = invoice.customItems.filter(item => item.id !== itemId);

  touchCurrentProject();
  renderInvoice();
  bindInvoiceInputs();
}

function addInvoicePayment() {
  if (!state.currentProject) return;

  const invoice = getInvoice(state.currentProject);
  invoice.payments.push(createInvoicePayment());

  touchCurrentProject();
  renderInvoice();
  bindInvoiceInputs();
}

function updateInvoicePayment(paymentId, field, value) {
  const invoice = getInvoice(state.currentProject);
  const payment = invoice.payments.find(entry => entry.id === paymentId);
  if (!payment) return;

  payment[field] = field === "amount" ? Number(value) || 0 : value;

  touchCurrentProject();
  refreshInvoicePreview();
}

function removeInvoicePayment(paymentId) {
  const invoice = getInvoice(state.currentProject);
  invoice.payments = invoice.payments.filter(payment => payment.id !== paymentId);

  touchCurrentProject();
  renderInvoice();
  bindInvoiceInputs();
}

function bindInvoiceInputs() {
  document.querySelectorAll("[data-invoice-field]").forEach(input => {
    input.addEventListener("input", (e) => {
      updateInvoiceField(e.target.dataset.invoiceField, e.target.value);
    });

    input.addEventListener("change", (e) => {
      updateInvoiceField(e.target.dataset.invoiceField, e.target.value);
    });
  });

  document.querySelectorAll("[data-invoice-item-id][data-invoice-item-field]").forEach(input => {
    input.addEventListener("input", (e) => {
      updateInvoiceItem(
        e.target.dataset.invoiceItemId,
        e.target.dataset.invoiceItemField,
        e.target.value
      );
    });

    input.addEventListener("change", (e) => {
      updateInvoiceItem(
        e.target.dataset.invoiceItemId,
        e.target.dataset.invoiceItemField,
        e.target.value
      );
    });
  });

  document.querySelectorAll("[data-invoice-payment-id][data-invoice-payment-field]").forEach(input => {
    input.addEventListener("input", (e) => {
      updateInvoicePayment(
        e.target.dataset.invoicePaymentId,
        e.target.dataset.invoicePaymentField,
        e.target.value
      );
    });

    input.addEventListener("change", (e) => {
      updateInvoicePayment(
        e.target.dataset.invoicePaymentId,
        e.target.dataset.invoicePaymentField,
        e.target.value
      );
    });
  });

  const addItemButton = document.getElementById("addInvoiceItemBtn");
  if (addItemButton) {
    addItemButton.addEventListener("click", addInvoiceItem);
  }

  const addPaymentButton = document.getElementById("addInvoicePaymentBtn");
  if (addPaymentButton) {
    addPaymentButton.addEventListener("click", addInvoicePayment);
  }

  document.querySelectorAll("[data-action='remove-invoice-item']").forEach(button => {
    button.addEventListener("click", (e) => {
      if (!confirm("Remove this invoice item? This cannot be undone.")) return;

      removeInvoiceItem(e.target.dataset.invoiceItemId);
    });
  });

  document.querySelectorAll("[data-action='remove-invoice-payment']").forEach(button => {
    button.addEventListener("click", (e) => {
      if (!confirm("Remove this payment? This cannot be undone.")) return;

      removeInvoicePayment(e.target.dataset.invoicePaymentId);
    });
  });
}
function createEvidenceItem() {
  return {
    id: `evidence-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    date: new Date().toISOString().slice(0, 10),
    category: "material-received",
    areaId: "",
    description: "",
    fileName: "",
    notes: ""
  };
}

function getEvidenceAreaOptions(selectedAreaId) {
  const areas = state.currentProject?.areas || [];

  return `
    <option value="" ${!selectedAreaId ? "selected" : ""}>General Project</option>
    ${areas.map(area => `
      <option value="${area.areaId}" ${selectedAreaId === area.areaId ? "selected" : ""}>
        ${getAreaLabel(area)} - ${area.name}
      </option>
    `).join("")}
  `;
}

function getEvidenceCategoryLabel(category) {
  const labels = {
    "material-received": "Material Received",
    "damaged-material": "Damaged Material",
    "existing-condition": "Existing Condition",
    "tile-selection": "Tile Selection",
    "grout-selection": "Grout Selection",
    "trim-selection": "Trim / Edge Finish",
    progress: "Progress",
    "change-approval": "Change / Approval",
    other: "Other"
  };

  return labels[category] || "Other";
}

function getEvidenceAreaLabel(areaId) {
  if (!areaId) return "General Project";

  const area = state.currentProject?.areas?.find(item => item.areaId === areaId);
  if (!area) return "Unknown Area";

  return `${getAreaLabel(area)} - ${area.name}`;
}

function buildEvidenceReportHTML(project) {
  if (!project) return "No project loaded.";

  const business = state.businessProfile || {};
  const evidenceLog = Array.isArray(project.evidenceLog) ? project.evidenceLog : [];
  const sortedEvidence = [...evidenceLog].sort((a, b) => {
    return String(a.date || "").localeCompare(String(b.date || ""));
  });

  const evidenceRows = sortedEvidence.map((item, index) => `
    <div class="evidence-report-item">
      <div class="quote-line">
        <span>
          <strong>Evidence ${index + 1}</strong><br>
          ${item.date || "-"} - ${getEvidenceCategoryLabel(item.category)}
        </span>
        <span>${getEvidenceAreaLabel(item.areaId)}</span>
      </div>

      <div><strong>Description:</strong> ${item.description || "-"}</div>
      <div><strong>Photo / File:</strong> ${item.fileName || "-"}</div>
      <div><strong>Notes:</strong> ${(item.notes || "-").replace(/\n/g, "<br>")}</div>
    </div>
  `).join("");

  return `
    <div class="quote-block evidence-report">
      <div class="quote-header-grid">
        <div>
          <div class="quote-section-title">Business</div>
          <div><strong>Business:</strong> ${business.name || "-"}</div>
          <div><strong>Phone:</strong> ${business.phone || "-"}</div>
          <div><strong>Email:</strong> ${business.email || "-"}</div>
        </div>

        <div>
          <div class="quote-section-title">Project</div>
          <div><strong>Project:</strong> ${project.projectName || "Untitled Project"}</div>
          <div><strong>Client:</strong> ${project.client.name || "-"}</div>
          <div><strong>Phone:</strong> ${project.client.phone || "-"}</div>
          <div><strong>Address:</strong> ${project.jobSite.address || "-"}</div>
        </div>
      </div>

      <div class="quote-section-title">Evidence Report</div>
      ${evidenceRows || "<div>No evidence added yet.</div>"}
    </div>
  `;
}

function renderEvidenceReport() {
  const container = document.getElementById("evidenceReportContainer");
  if (!container) return;

  container.innerHTML = buildEvidenceReportHTML(state.currentProject);
}

function renderEvidenceLog() {
  const container = document.getElementById("evidenceLogContainer");
  const project = state.currentProject;

  if (!container) return;

  if (!project) {
    container.textContent = "No project loaded.";
    return;
  }

  project.evidenceLog = Array.isArray(project.evidenceLog) ? project.evidenceLog : [];

  if (project.evidenceLog.length === 0) {
    container.textContent = "No evidence added yet.";
    return;
  }

  container.innerHTML = `
    <div class="stacked-blocks">
      ${project.evidenceLog.map(item => `
        <div class="evidence-card">
          <div class="grid">
            <input
              data-evidence-id="${item.id}"
              data-evidence-field="date"
              type="date"
              value="${item.date || ""}"
            >

            <select data-evidence-id="${item.id}" data-evidence-field="category">
              <option value="material-received" ${item.category === "material-received" ? "selected" : ""}>Material Received</option>
              <option value="damaged-material" ${item.category === "damaged-material" ? "selected" : ""}>Damaged Material</option>
              <option value="existing-condition" ${item.category === "existing-condition" ? "selected" : ""}>Existing Condition</option>
              <option value="tile-selection" ${item.category === "tile-selection" ? "selected" : ""}>Tile Selection</option>
              <option value="grout-selection" ${item.category === "grout-selection" ? "selected" : ""}>Grout Selection</option>
              <option value="trim-selection" ${item.category === "trim-selection" ? "selected" : ""}>Trim / Edge Finish</option>
              <option value="progress" ${item.category === "progress" ? "selected" : ""}>Progress</option>
              <option value="change-approval" ${item.category === "change-approval" ? "selected" : ""}>Change / Approval</option>
              <option value="other" ${item.category === "other" ? "selected" : ""}>Other</option>
            </select>

            <select data-evidence-id="${item.id}" data-evidence-field="areaId">
              ${getEvidenceAreaOptions(item.areaId)}
            </select>

            <input
              data-evidence-id="${item.id}"
              data-evidence-field="description"
              type="text"
              placeholder="Description"
              value="${item.description || ""}"
            >

            <input
              data-evidence-id="${item.id}"
              data-evidence-field="fileName"
              type="text"
              placeholder="Photo / File Name"
              value="${item.fileName || ""}"
            >

            <input
              data-evidence-file-id="${item.id}"
              type="file"
              accept="image/*"
            >
          </div>

          <textarea
            data-evidence-id="${item.id}"
            data-evidence-field="notes"
            placeholder="Notes"
          >${item.notes || ""}</textarea>

          <div class="area-actions">
            <button type="button" data-action="remove-evidence" data-evidence-id="${item.id}">Remove Evidence</button>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function addEvidenceItem() {
  if (!state.currentProject) return;

  state.currentProject.evidenceLog = Array.isArray(state.currentProject.evidenceLog)
    ? state.currentProject.evidenceLog
    : [];

  state.currentProject.evidenceLog.push(createEvidenceItem());
  touchCurrentProject();
  renderApp();
}

function updateEvidenceItem(evidenceId, field, value) {
  const evidenceLog = state.currentProject?.evidenceLog;
  if (!Array.isArray(evidenceLog)) return;

  const item = evidenceLog.find(entry => entry.id === evidenceId);
  if (!item) return;

  item[field] = value;
  touchCurrentProject();
  renderEvidenceReport();
}

function removeEvidenceItem(evidenceId) {
  if (!Array.isArray(state.currentProject?.evidenceLog)) return;

  state.currentProject.evidenceLog = state.currentProject.evidenceLog.filter(
    item => item.id !== evidenceId
  );

  touchCurrentProject();
  renderApp();
}

function bindEvidenceLogInputs() {
  document.querySelectorAll("[data-evidence-id][data-evidence-field]").forEach(input => {
    input.addEventListener("input", (e) => {
      updateEvidenceItem(
        e.target.dataset.evidenceId,
        e.target.dataset.evidenceField,
        e.target.value
      );
    });

    input.addEventListener("change", (e) => {
      updateEvidenceItem(
        e.target.dataset.evidenceId,
        e.target.dataset.evidenceField,
        e.target.value
      );
    });
  });

  document.querySelectorAll("[data-evidence-file-id]").forEach(input => {
    input.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      updateEvidenceItem(
        e.target.dataset.evidenceFileId,
        "fileName",
        file.name
      );

      renderEvidenceLog();
      bindEvidenceLogInputs();
      bindEvidenceLogActions();
    });
  });
}

function bindEvidenceLogActions() {
  const addButton = document.getElementById("addEvidenceBtn");

  if (addButton) {
    addButton.onclick = addEvidenceItem;
  }

  const printButton = document.getElementById("printEvidenceReportBtn");

  if (printButton) {
    printButton.onclick = () => {
      renderEvidenceReport();
      printSection("print-evidence");
    };
  }

  document.querySelectorAll("[data-action='remove-evidence']").forEach(button => {
  button.onclick = (e) => {
    if (!confirm("Remove this evidence? This cannot be undone.")) return;

    removeEvidenceItem(e.target.dataset.evidenceId);
  };
});
}

const GROUT_COVERAGE_TABLES = {
  "non-sanded-10": {
    label: "Non-sanded 10 lb",
    joints: ["1/16", "1/8"],
    coverage: {
      "1x1x1/4": { "1/16": 40, "1/8": 23 },
      "2x2x1/4": { "1/16": 76, "1/8": 40 },
      "3x3x1/4": { "1/16": 112, "1/8": 58 },
      "4.25x4.25x1/4": { "1/16": 156, "1/8": 80 },
      "6x6x1/4": { "1/16": 219, "1/8": 112 },
      "8x8x3/8": { "1/16": 194, "1/8": 98 },
      "12x12x3/8": { "1/16": 289, "1/8": 146 },
      "18x18x3/8": { "1/16": 432, "1/8": 217 },
      "20x20x3/8": { "1/16": 480, "1/8": 241 },
      "24x24x3/8": { "1/16": 575, "1/8": 289 },
      "6x24x3/8": { "1/16": 232, "1/8": 117 },
      "12x24x3/8": { "1/16": 384, "1/8": 194 },
      "6x36x3/8": { "1/16": 248, "1/8": 126 },
      "9x36x3/8": { "1/16": 346, "1/8": 175 },
      "12x48x3/8": { "1/16": 461, "1/8": 232 }
    }
  },
  "sanded-25": {
    label: "Sanded 25 lb",
    joints: ["1/8", "3/16", "1/4", "3/8", "1/2"],
    coverage: {
      "1x1x1/4": { "1/8": 54, "3/16": 40, "1/4": 33, "3/8": 27, "1/2": 24 },
      "2x2x1/4": { "1/8": 96, "3/16": 68, "1/4": 54, "3/8": 40, "1/2": 33 },
      "3x3x1/4": { "1/8": 138, "3/16": 96, "1/4": 74, "3/8": 54, "1/2": 43 },
      "4.25x4.25x1/4": { "1/8": 192, "3/16": 131, "1/4": 101, "3/8": 71, "1/2": 56 },
      "6x6x1/4": { "1/8": 266, "3/16": 181, "1/4": 139, "3/8": 96, "1/2": 75 },
      "8x8x3/8": { "1/8": 234, "3/16": 158, "1/4": 121, "3/8": 83, "1/2": 64 },
      "12x12x3/8": { "1/8": 348, "3/16": 234, "1/4": 177, "3/8": 121, "1/2": 92 },
      "16x16x3/8": { "1/8": 462, "3/16": 310, "1/4": 234, "3/8": 158, "1/2": 121 },
      "18x18x3/8": { "1/8": 518, "3/16": 348, "1/4": 262, "3/8": 177, "1/2": 135 },
      "20x20x3/8": { "1/8": 574, "3/16": 385, "1/4": 291, "3/8": 196, "1/2": 149 },
      "24x24x3/8": { "1/8": 688, "3/16": 461, "1/4": 348, "3/8": 234, "1/2": 177 },
      "6x24x3/8": { "1/8": 279, "3/16": 189, "1/4": 143, "3/8": 98, "1/2": 75 },
      "12x24x3/8": { "1/8": 461, "3/16": 310, "1/4": 234, "3/8": 158, "1/2": 121 },
      "6x36x3/8": { "1/8": 299, "3/16": 202, "1/4": 153, "3/8": 104, "1/2": 80 },
      "9x36x3/8": { "1/8": 416, "3/16": 279, "1/4": 211, "3/8": 143, "1/2": 109 },
      "12x48x3/8": { "1/8": 552, "3/16": 370, "1/4": 279, "3/8": 189, "1/2": 143 }
    }
  },
  "sanded-7": {
    label: "Sanded 7 lb",
    joints: ["1/8", "3/16", "1/4", "3/8", "1/2"],
    coverage: {
      "1x1x1/4": { "1/8": 15, "3/16": 11, "1/4": 9, "3/8": 8, "1/2": 7 },
      "2x2x1/4": { "1/8": 27, "3/16": 19, "1/4": 15, "3/8": 11, "1/2": 9 },
      "3x3x1/4": { "1/8": 39, "3/16": 27, "1/4": 21, "3/8": 15, "1/2": 12 },
      "4.25x4.25x1/4": { "1/8": 54, "3/16": 37, "1/4": 28, "3/8": 20, "1/2": 16 },
      "6x6x1/4": { "1/8": 74, "3/16": 51, "1/4": 39, "3/8": 27, "1/2": 21 },
      "8x8x3/8": { "1/8": 66, "3/16": 44, "1/4": 34, "3/8": 23, "1/2": 18 },
      "12x12x3/8": { "1/8": 97, "3/16": 66, "1/4": 50, "3/8": 34, "1/2": 26 },
      "16x16x3/8": { "1/8": 129, "3/16": 87, "1/4": 66, "3/8": 44, "1/2": 34 },
      "18x18x3/8": { "1/8": 145, "3/16": 97, "1/4": 73, "3/8": 50, "1/2": 38 },
      "20x20x3/8": { "1/8": 161, "3/16": 108, "1/4": 81, "3/8": 55, "1/2": 42 },
      "24x24x3/8": { "1/8": 193, "3/16": 129, "1/4": 97, "3/8": 66, "1/2": 50 },
      "6x24x3/8": { "1/8": 78, "3/16": 53, "1/4": 40, "3/8": 27, "1/2": 21 },
      "12x24x3/8": { "1/8": 129, "3/16": 87, "1/4": 66, "3/8": 44, "1/2": 34 },
      "6x36x3/8": { "1/8": 84, "3/16": 56, "1/4": 43, "3/8": 29, "1/2": 22 },
      "9x36x3/8": { "1/8": 116, "3/16": 78, "1/4": 59, "3/8": 40, "1/2": 31 },
      "12x48x3/8": { "1/8": 155, "3/16": 104, "1/4": 78, "3/8": 53, "1/2": 40 }
    }
  }
};

const GROUT_TILE_LABELS = {
  "1x1x1/4": '1" x 1" x 1/4"',
  "2x2x1/4": '2" x 2" x 1/4"',
  "3x3x1/4": '3" x 3" x 1/4"',
  "4.25x4.25x1/4": '4.25" x 4.25" x 1/4"',
  "6x6x1/4": '6" x 6" x 1/4"',
  "8x8x3/8": '8" x 8" x 3/8"',
  "12x12x3/8": '12" x 12" x 3/8"',
  "16x16x3/8": '16" x 16" x 3/8"',
  "18x18x3/8": '18" x 18" x 3/8"',
  "20x20x3/8": '20" x 20" x 3/8"',
  "24x24x3/8": '24" x 24" x 3/8"',
  "6x24x3/8": '6" x 24" x 3/8"',
  "12x24x3/8": '12" x 24" x 3/8"',
  "6x36x3/8": '6" x 36" x 3/8"',
  "9x36x3/8": '9" x 36" x 3/8"',
  "12x48x3/8": '12" x 48" x 3/8"'
};

function getGroutCalculator(project) {
  project.tools = project.tools || {};
  project.tools.groutCalculator = project.tools.groutCalculator || {
    area: 0,
    groutType: "non-sanded-10",
    tileSize: "12x12x3/8",
    jointWidth: "1/8"
  };

  return project.tools.groutCalculator;
}

function calculateGroutResult(calculator) {
  const groutType = calculator.groutType || "non-sanded-10";
  const table = GROUT_COVERAGE_TABLES[groutType] || GROUT_COVERAGE_TABLES["non-sanded-10"];

  const tileSize = calculator.tileSize || "12x12x3/8";
  const jointWidth = calculator.jointWidth || table.joints[0];
  const area = Number(calculator.area) || 0;

  const coverage = Number(table.coverage?.[tileSize]?.[jointWidth]) || 0;
  const bagsNeeded = area > 0 && coverage > 0 ? Math.ceil(area / coverage) : 0;

  return {
    coverage,
    bagsNeeded,
    groutTypeLabel: table.label
  };
}

function renderGroutCalculator() {
  const container = document.getElementById("groutCalculatorContainer");
  const project = state.currentProject;

  if (!container) return;

  if (!project) {
    container.textContent = "No project loaded.";
    return;
  }

  const calculator = getGroutCalculator(project);
  const table = GROUT_COVERAGE_TABLES[calculator.groutType] || GROUT_COVERAGE_TABLES["non-sanded-10"];
  const allowedJoints = table.joints;

  if (!allowedJoints.includes(calculator.jointWidth)) {
    calculator.jointWidth = allowedJoints[0];
  }

  const result = calculateGroutResult(calculator);

  container.innerHTML = `
    <div class="area-subsection">
      <div class="area-subsection-title">Grout Calculator</div>

      <div class="grid">
        <input
          data-grout-field="area"
          type="number"
          step="0.01"
          placeholder="Tile Area (sq ft)"
          value="${displayValue(calculator.area)}"
        >

        <select data-grout-field="groutType">
          ${Object.entries(GROUT_COVERAGE_TABLES).map(([value, item]) => `
            <option value="${value}" ${calculator.groutType === value ? "selected" : ""}>${item.label}</option>
          `).join("")}
        </select>

        <select data-grout-field="tileSize">
          ${Object.keys(table.coverage).map(tileSize => `
            <option value="${tileSize}" ${calculator.tileSize === tileSize ? "selected" : ""}>${GROUT_TILE_LABELS[tileSize] || tileSize}</option>
          `).join("")}
        </select>

        <select data-grout-field="jointWidth">
          ${allowedJoints.map(joint => `
            <option value="${joint}" ${calculator.jointWidth === joint ? "selected" : ""}>Joint ${joint}</option>
          `).join("")}
        </select>
      </div>

      <div class="info-panel">
        <div class="info-panel-title">Grout Result</div>
        <div class="info-panel-lines">
          <div class="info-panel-line"><strong>Coverage:</strong> ${result.coverage > 0 ? `${result.coverage} sq ft / bag` : "N/A"}</div>
          <div class="info-panel-line"><strong>Bags Needed:</strong> ${result.bagsNeeded}</div>
        </div>
      </div>
    </div>
  `;
}

function refreshGroutCalculatorResult() {
  const container = document.getElementById("groutCalculatorContainer");
  const project = state.currentProject;

  if (!container || !project) return;

  const calculator = getGroutCalculator(project);
  const result = calculateGroutResult(calculator);
  const resultPanel = container.querySelector(".info-panel-lines");

  if (!resultPanel) {
    renderGroutCalculator();
    bindGroutCalculatorInputs();
    return;
  }

  resultPanel.innerHTML = `
    <div class="info-panel-line"><strong>Coverage:</strong> ${result.coverage > 0 ? `${result.coverage} sq ft / bag` : "N/A"}</div>
    <div class="info-panel-line"><strong>Bags Needed:</strong> ${result.bagsNeeded}</div>
  `;
}

function updateGroutCalculatorField(field, value) {
  if (!state.currentProject) return;

  const calculator = getGroutCalculator(state.currentProject);

  if (field === "area") {
    calculator.area = Number(value) || 0;
    touchCurrentProject();
    refreshGroutCalculatorResult();
    return;
  }

  if (field === "groutType") {
    calculator.groutType = value;
    const table = GROUT_COVERAGE_TABLES[value] || GROUT_COVERAGE_TABLES["non-sanded-10"];
    calculator.jointWidth = table.joints.includes(calculator.jointWidth)
      ? calculator.jointWidth
      : table.joints[0];

    if (!table.coverage[calculator.tileSize]) {
      calculator.tileSize = Object.keys(table.coverage)[0];
    }
  }

  if (field === "tileSize") {
    calculator.tileSize = value;
  }

  if (field === "jointWidth") {
    calculator.jointWidth = value;
  }

  touchCurrentProject();
  renderGroutCalculator();
  bindGroutCalculatorInputs();
}

function bindGroutCalculatorInputs() {
  document.querySelectorAll("[data-grout-field]").forEach(input => {
    const handler = (e) => {
      updateGroutCalculatorField(e.target.dataset.groutField, e.target.value);
    };

    input.addEventListener("input", handler);
    input.addEventListener("change", handler);
  });
}
function getLayoutCalculator(project) {
  project.tools = project.tools || {};
  project.tools.layoutCalculator = project.tools.layoutCalculator || {
    area: 0,
    tileWidth: 12,
    tileLength: 24,
    wastePercent: 10,
    piecesPerBox: 0,
    coveragePerBox: 0
  };

  return project.tools.layoutCalculator;
}

function calculateLayoutResult(calculator) {
  const area = Number(calculator.area) || 0;
  const tileWidth = Number(calculator.tileWidth) || 0;
  const tileLength = Number(calculator.tileLength) || 0;
  const wastePercent = Number(calculator.wastePercent) || 0;
  const piecesPerBox = Number(calculator.piecesPerBox) || 0;
  const coveragePerBox = Number(calculator.coveragePerBox) || 0;

  const coveragePerPiece = tileWidth > 0 && tileLength > 0
    ? (tileWidth * tileLength) / 144
    : 0;

  const piecesNeeded = coveragePerPiece > 0
    ? Math.ceil(area / coveragePerPiece)
    : 0;

  const areaWithWaste = area * (1 + wastePercent / 100);

  const piecesWithWaste = coveragePerPiece > 0
    ? Math.ceil(areaWithWaste / coveragePerPiece)
    : 0;

  const boxesByPieces = piecesPerBox > 0
    ? Math.ceil(piecesWithWaste / piecesPerBox)
    : 0;

  const boxesByCoverage = coveragePerBox > 0
    ? Math.ceil(areaWithWaste / coveragePerBox)
    : 0;

  const recommendedBoxes = boxesByCoverage > 0
    ? boxesByCoverage
    : boxesByPieces > 0
    ? boxesByPieces
    : 0;

  const recommendedBoxesSource = boxesByCoverage > 0
    ? "Coverage per Box"
    : boxesByPieces > 0
    ? "Pieces per Box"
    : "";

  return {
    area,
    tileWidth,
    tileLength,
    wastePercent,
    coveragePerPiece,
    piecesNeeded,
    areaWithWaste,
    piecesWithWaste,
    boxesByPieces,
    boxesByCoverage,
    recommendedBoxes,
    recommendedBoxesSource
  };
}

function renderLayoutCalculator() {
  const container = document.getElementById("layoutCalculatorContainer");
  const project = state.currentProject;

  if (!container) return;

  if (!project) {
    container.textContent = "No project loaded.";
    return;
  }

  const calculator = getLayoutCalculator(project);
  const result = calculateLayoutResult(calculator);

  container.innerHTML = `
    <div class="area-subsection">
      <div class="area-subsection-title">Layout Calculator</div>

      <div class="grid">
        <label>
          Tile Area (sq ft)
          <input
            data-layout-field="area"
            type="number"
            step="0.01"
            placeholder="Tile Area (sq ft)"
            value="${displayValue(calculator.area)}"
          >
        </label>

        <label>
          Waste %
          <input
            data-layout-field="wastePercent"
            type="number"
            step="0.01"
            placeholder="Waste %"
            value="${displayValue(calculator.wastePercent)}"
          >
        </label>

        <label>
          Tile Width (in)
          <input
            data-layout-field="tileWidth"
            type="number"
            step="0.01"
            placeholder="Tile Width (in)"
            value="${displayValue(calculator.tileWidth)}"
          >
        </label>

        <label>
          Tile Length (in)
          <input
            data-layout-field="tileLength"
            type="number"
            step="0.01"
            placeholder="Tile Length (in)"
            value="${displayValue(calculator.tileLength)}"
          >
        </label>

        <label>
          Pieces per Box
          <input
            data-layout-field="piecesPerBox"
            type="number"
            step="1"
            placeholder="Pieces per Box"
            value="${displayValue(calculator.piecesPerBox)}"
          >
        </label>

        <label>
          Coverage per Box (sq ft)
          <input
            data-layout-field="coveragePerBox"
            type="number"
            step="0.01"
            placeholder="Coverage per Box (sq ft)"
            value="${displayValue(calculator.coveragePerBox)}"
          >
        </label>
      </div>

      <div class="info-panel">
        <div class="info-panel-title">Layout Result</div>
        <div class="info-panel-lines">
          <div class="info-panel-line"><strong>Recommended Boxes:</strong> ${result.recommendedBoxes > 0 ? `${result.recommendedBoxes} (${result.recommendedBoxesSource})` : "N/A"}</div>
          <div class="info-panel-line"><strong>Pieces Needed:</strong> ${result.piecesNeeded}</div>
          <div class="info-panel-line"><strong>Area With Waste:</strong> ${result.areaWithWaste.toFixed(2)} sq ft</div>
          <div class="info-panel-line"><strong>Pieces With Waste:</strong> ${result.piecesWithWaste}</div>
          <div class="info-panel-line"><strong>Boxes by Pieces:</strong> ${result.boxesByPieces > 0 ? result.boxesByPieces : "N/A"}</div>
          <div class="info-panel-line"><strong>Boxes by Coverage:</strong> ${result.boxesByCoverage > 0 ? result.boxesByCoverage : "N/A"}</div>
        </div>
      </div>
    </div>
  `;
}

function refreshLayoutCalculatorResult() {
  const container = document.getElementById("layoutCalculatorContainer");
  const project = state.currentProject;

  if (!container || !project) return;

  const calculator = getLayoutCalculator(project);
  const result = calculateLayoutResult(calculator);
  const resultPanel = container.querySelector(".info-panel-lines");

  if (!resultPanel) {
    renderLayoutCalculator();
    bindLayoutCalculatorInputs();
    return;
  }

  resultPanel.innerHTML = `
    <div class="info-panel-line"><strong>Recommended Boxes:</strong> ${result.recommendedBoxes > 0 ? `${result.recommendedBoxes} (${result.recommendedBoxesSource})` : "N/A"}</div>
    <div class="info-panel-line"><strong>Coverage per Piece:</strong> ${result.coveragePerPiece.toFixed(2)} sq ft</div>
    <div class="info-panel-line"><strong>Pieces Needed:</strong> ${result.piecesNeeded}</div>
    <div class="info-panel-line"><strong>Area With Waste:</strong> ${result.areaWithWaste.toFixed(2)} sq ft</div>
    <div class="info-panel-line"><strong>Pieces With Waste:</strong> ${result.piecesWithWaste}</div>
    <div class="info-panel-line"><strong>Boxes by Pieces:</strong> ${result.boxesByPieces > 0 ? result.boxesByPieces : "N/A"}</div>
    <div class="info-panel-line"><strong>Boxes by Coverage:</strong> ${result.boxesByCoverage > 0 ? result.boxesByCoverage : "N/A"}</div>
  `;
}

function updateLayoutCalculatorField(field, value) {
  if (!state.currentProject) return;

  const calculator = getLayoutCalculator(state.currentProject);
  calculator[field] = Number(value) || 0;

  touchCurrentProject();
  refreshLayoutCalculatorResult();
}

function bindLayoutCalculatorInputs() {
  document.querySelectorAll("[data-layout-field]").forEach(input => {
    const handler = (e) => {
      updateLayoutCalculatorField(e.target.dataset.layoutField, e.target.value);
    };

    input.addEventListener("input", handler);
    input.addEventListener("change", handler);
  });
}

function renderApp() {
  renderBusinessProfile();
  renderProjectInfo();
  renderAreas();
  renderSummary();
  renderMaterialsSummary();
  renderSavedProjectsList();
  renderProjectBackupsList();
  renderQuotePreview();
  renderEvidenceLog();
  renderEvidenceReport();
  renderGroutCalculator();
  renderLayoutCalculator();
  renderInvoice();

  bindAreaInputs();
  bindAreaActionButtons();
  bindEvidenceLogInputs();
  bindEvidenceLogActions();
  bindGroutCalculatorInputs();
  bindLayoutCalculatorInputs();
  bindInvoiceInputs();
}

function toggleMainModule(sectionId) {
  const section = document.getElementById(sectionId);
  if (!section) return;

  section.classList.toggle("is-collapsed");

  const button = section.querySelector(":scope > .module-header [data-module-toggle]");
  if (button) {
    button.textContent = section.classList.contains("is-collapsed") ? "Expand" : "Collapse";
  }
}

function bindMainModuleToggles() {
  document.querySelectorAll("[data-module-toggle]").forEach(button => {
    button.addEventListener("click", () => {
      toggleMainModule(button.dataset.moduleToggle);
    });
  });
}

function escapeCsvValue(value) {
  const text = String(value ?? "");

  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function downloadCsv(filename, rows) {
  const csvContent = rows
    .map(row => row.map(escapeCsvValue).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

function getSafeFileName(value, fallback = "project") {
  const safeValue = String(value || "")
    .trim()
    .replace(/[^a-z0-9-_]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return safeValue || fallback;
}

function downloadJson(filename, data) {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

function exportCurrentProjectJson() {
  if (!state.currentProject) {
    alert("No project loaded.");
    return;
  }

  touchCurrentProject();

  const normalizedProject = normalizeProject(state.currentProject);
  setCurrentProject(normalizedProject);

  const exportData = {
    app: "Tile Estimator V1",
    exportType: "project",
    exportedAt: new Date().toISOString(),
    project: normalizedProject
  };

  const safeProjectName = getSafeFileName(normalizedProject.projectName, "tile-estimator-project");
  downloadJson(`${safeProjectName}.json`, exportData);
}

function importProjectJsonFile(file) {
  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    try {
      const parsedData = JSON.parse(reader.result);
      const importedProject = parsedData.project || parsedData;

      if (!importedProject || typeof importedProject !== "object") {
        alert("This file does not contain a valid project.");
        return;
      }

      const normalizedProject = normalizeProject(importedProject);
      const savedProjects = getSavedProjects();

      if (savedProjects[normalizedProject.projectId]) {
        const replaceExisting = confirm(
          "A saved project with this same ID already exists. Click OK to replace it, or Cancel to import it as a copy."
        );

        if (!replaceExisting) {
          normalizedProject.projectId = createId("project");
          normalizedProject.projectName = `${normalizedProject.projectName || "Imported Project"} Copy`;
          normalizedProject.createdAt = new Date().toISOString();
        }
      }

      normalizedProject.updatedAt = new Date().toISOString();
      cancelScheduledAutosave();
      setCurrentProject(normalizedProject);
      saveProjectToStorage(normalizedProject);
      deleteProjectAutosave(normalizedProject.projectId);
      renderSavedProjectsList();
      renderApp();
      updateAutosaveStatus("Project imported.");

      alert("Project imported.");
    } catch (error) {
      console.error("Error importing project:", error);
      alert("The selected file could not be imported. Please choose a valid project JSON file.");
    }
  };

  reader.readAsText(file);
}

function restoreSelectedProjectBackup() {
  const backupId = document.getElementById("projectBackupsSelect")?.value;
  if (!backupId) {
    alert("Select a backup first.");
    return;
  }

  const backup = loadProjectBackup(backupId);
  if (!backup?.project) {
    alert("Backup not found.");
    return;
  }

  const confirmed = confirm(
    "Restore this backup? The current project will be backed up first, then replaced with the selected backup."
  );
  if (!confirmed) return;

  if (state.currentProject?.projectId) {
    saveProjectBackup(state.currentProject, "before-restore");
  }

  const restoredProject = normalizeProject(JSON.parse(JSON.stringify(backup.project)));
  restoredProject.updatedAt = new Date().toISOString();

  cancelScheduledAutosave();
  setCurrentProject(restoredProject);
  saveProjectToStorage(restoredProject);
  deleteProjectAutosave(restoredProject.projectId);
  renderSavedProjectsList();
  renderProjectBackupsList();
  renderApp();
  updateAutosaveStatus("Backup restored.");

  alert("Backup restored.");
}

function exportSelectedProjectBackupJson() {
  const backupId = document.getElementById("projectBackupsSelect")?.value;
  if (!backupId) {
    alert("Select a backup first.");
    return;
  }

  const backup = loadProjectBackup(backupId);
  if (!backup?.project) {
    alert("Backup not found.");
    return;
  }

  const exportData = {
    app: "Tile Estimator V1",
    exportType: "project-backup",
    exportedAt: new Date().toISOString(),
    backup
  };

  const safeProjectName = getSafeFileName(backup.projectName, "tile-estimator-backup");
  downloadJson(`${safeProjectName}-backup.json`, exportData);
}

const AUTOSAVE_DELAY_MS = 2500;
let autosaveTimer = null;

function updateAutosaveStatus(message) {
  const status = document.getElementById("autosaveStatus");
  if (!status) return;

  status.textContent = message;
}

function cancelScheduledAutosave() {
  if (!autosaveTimer) return;

  clearTimeout(autosaveTimer);
  autosaveTimer = null;
}

function scheduleCurrentProjectAutosave() {
  if (!state.currentProject || !currentProjectHasContent(state.currentProject)) return;

  cancelScheduledAutosave();
  updateAutosaveStatus("Autosave pending...");

  autosaveTimer = setTimeout(() => {
    runCurrentProjectAutosave();
  }, AUTOSAVE_DELAY_MS);
}

function runCurrentProjectAutosave() {
  autosaveTimer = null;

  if (!state.currentProject || !currentProjectHasContent(state.currentProject)) {
    updateAutosaveStatus("Autosave ready.");
    return;
  }

  const projectSnapshot = normalizeProject(JSON.parse(JSON.stringify(state.currentProject)));
  saveProjectAutosave(projectSnapshot);
  updateAutosaveStatus(`Autosaved ${formatBackupDate(new Date().toISOString())}`);
}

function recoverLatestProjectAutosave() {
  const autosave = getLatestProjectAutosave();

  if (!autosave?.project) {
    alert("No autosave available.");
    return;
  }

  const confirmed = confirm(
    `Recover autosaved project "${autosave.projectName || "Untitled Project"}" from ${formatBackupDate(autosave.updatedAt)}?`
  );
  if (!confirmed) return;

  if (state.currentProject?.projectId && currentProjectHasContent(state.currentProject)) {
    saveProjectBackup(state.currentProject, "before-restore");
  }

  cancelScheduledAutosave();

  const recoveredProject = normalizeProject(JSON.parse(JSON.stringify(autosave.project)));
  recoveredProject.updatedAt = new Date().toISOString();

  setCurrentProject(recoveredProject);
  saveProjectToStorage(recoveredProject);
  deleteProjectAutosave(recoveredProject.projectId);
  renderSavedProjectsList();
  renderProjectBackupsList();
  renderApp();
  updateAutosaveStatus("Autosave recovered.");

  alert("Autosave recovered.");
}

function promptForAutosaveRecovery() {
  const autosave = getLatestProjectAutosave();
  if (!autosave?.project) return null;

  const confirmed = confirm(
    `An autosaved project was found: "${autosave.projectName || "Untitled Project"}" from ${formatBackupDate(autosave.updatedAt)}. Recover it now?`
  );

  if (!confirmed) return null;

  const recoveredProject = normalizeProject(JSON.parse(JSON.stringify(autosave.project)));
  recoveredProject.updatedAt = new Date().toISOString();
  updateAutosaveStatus("Autosave loaded. Save project to keep it.");

  return recoveredProject;
}

function addMaterialCsvRow(rows, material, quantity, unit, source = "Project Summary") {
  if (quantity === undefined || quantity === null || quantity === "" || quantity === 0) return;

  rows.push([
    material,
    quantity,
    unit,
    source,
    "",
    "Pending"
  ]);
}

function buildMaterialsCsvRows(project) {
  const projectName = project?.projectName || "Project Name";

  const rows = [
    [projectName],
    ["Material", "Quantity", "Unit", "Store", "Price", "Notes", "Status"]
  ];

  if (!project) return rows;

  const totals = calculateProjectMaterials(project);

  const foamBoardScrewsRounded = roundUpToPack(totals.foamBoardScrews, 100);
  const foamBoardWashersRounded = roundUpToPack(totals.foamBoardWashers, 100);
  const cementBoardScrewBoxes = getBoxCount(totals.cementBoardScrews, 500);

  const addRow = (material, quantity, unit) => {
    if (quantity === undefined || quantity === null || quantity === "" || quantity === 0) return;

    rows.push([
      material,
      quantity,
      unit,
      "",
      "",
      "",
      ""
    ]);
  };

  addRow("Thinset Bags", totals.thinsetBagsTotal, "bags");
  addRow("Mastic (1 Gal)", totals.mastic1Gal, "gal");
  addRow("Mud Bed Bags", totals.mudBedBags, "bags");
  addRow("Drains", totals.drains, "pcs");
  addRow("Grates", totals.grates, "pcs");

  addRow("GoBoard 3x5", totals.goboard3x5, "boards");
  addRow("GoBoard 4x8", totals.goboard4x8, "boards");
  addRow("Kerdi Board 3x5", totals.kerdiBoard3x5, "boards");
  addRow("Kerdi Board 4x8", totals.kerdiBoard4x8, "boards");
  addRow("HardieBacker 1/2 Boards", totals.hardieBackerHalfIn, "boards");
  addRow("Durock 1/2 Boards", totals.durockHalfBoards, "boards");
  addRow("Durock 1/4 Boards", totals.durockQuarterBoards, "boards");

  addRow("Foam Board Screws", foamBoardScrewsRounded, "ct");
  addRow("Foam Board Washers", foamBoardWashersRounded, "ct");
  addRow("Cement Board Screws", cementBoardScrewBoxes, "500 ct box");

  if (totals.bandRolls > 0) addRow("Band", "As needed", "");
  if (totals.meshTapeRolls > 0) addRow("Mesh Tape", "As needed", "");
  if (totals.sealantTubes > 0) addRow("Sealant / Kerdi Fix", "As needed", "");

  addRow("Ditra Area", totals.ditraArea ? totals.ditraArea.toFixed(2) : 0, "sq ft");
  addRow("Leveler Bags", totals.levelerBags, "bags");

  addRow("Laminate Underlayment", totals.laminateUnderlaymentArea ? totals.laminateUnderlaymentArea.toFixed(2) : 0, "sq ft");
  addRow("Laminate Vapor Barrier", totals.laminateVaporBarrierArea ? totals.laminateVaporBarrierArea.toFixed(2) : 0, "sq ft");

  addRow("Wood Underlayment", totals.woodUnderlaymentArea ? totals.woodUnderlaymentArea.toFixed(2) : 0, "sq ft");
  addRow("Wood Moisture Barrier", totals.woodMoistureBarrierArea ? totals.woodMoistureBarrierArea.toFixed(2) : 0, "sq ft");
  addRow("Wood Sound Barrier", totals.woodSoundBarrierArea ? totals.woodSoundBarrierArea.toFixed(2) : 0, "sq ft");
  addRow("Wood Glue", totals.woodGlueUnits, "gal");

  if (totals.woodNailBoxes > 0) addRow("Wood Nails / Staples", "As needed", "");

  addRow("Foam System Area", totals.waterproofFoamArea ? totals.waterproofFoamArea.toFixed(2) : 0, "sq ft");
  addRow("Sheet Membrane Area", totals.waterproofSheetArea ? totals.waterproofSheetArea.toFixed(2) : 0, "sq ft");
  addRow("Shower Floor Membrane", totals.showerFloorMembraneArea ? totals.showerFloorMembraneArea.toFixed(2) : 0, "sq ft");
  addRow("Liquid Waterproof Area", totals.waterproofLiquidArea ? totals.waterproofLiquidArea.toFixed(2) : 0, "sq ft");

  addRow("Foam Pans", totals.foamPanUnits, "pcs");
  addRow("Prefab Pans", totals.prefabPanUnits, "pcs");
  addRow("Prefab Niches", totals.prefabNicheUnits, "pcs");
  addRow("Prefab Benches", totals.prefabBenchUnits, "pcs");
  addRow("Prefab Curbs", totals.prefabCurbUnits, "pcs");

  addRow("Metal Trim", totals.metalTrimFt ? totals.metalTrimFt.toFixed(2) : 0, "ft");
  addRow("Bullnose", totals.bullnoseFt ? totals.bullnoseFt.toFixed(2) : 0, "ft");
  addRow("Quartz / Stone Cap", totals.quartzStoneCapFt ? totals.quartzStoneCapFt.toFixed(2) : 0, "ft");
  addRow("Transitions", totals.transitionsFt ? totals.transitionsFt.toFixed(2) : 0, "ft");

  return rows;
}

function exportMaterialsCsv() {
  const project = state.currentProject;

  if (!project) {
    alert("No project loaded.");
    return;
  }

  const safeProjectName = (project.projectName || "materials-summary")
    .trim()
    .replace(/[^a-z0-9-_]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  const rows = buildMaterialsCsvRows(project);
  downloadCsv(`${safeProjectName || "materials-summary"}-materials.csv`, rows);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function downloadExcelHtml(filename, html) {
  const blob = new Blob([html], {
    type: "application/vnd.ms-excel;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

function addMaterialExcelRow(rows, material, quantity, unit) {
  if (quantity === undefined || quantity === null || quantity === "" || quantity === 0) return;

  rows.push({
    material,
    quantity,
    unit,
    store: "",
    price: "",
    notes: "",
    status: ""
  });
}

function buildMaterialsExcelRows(project) {
  const rows = [];
  if (!project) return rows;

  const totals = calculateProjectMaterials(project);

  const foamBoardScrewsRounded = roundUpToPack(totals.foamBoardScrews, 100);
  const foamBoardWashersRounded = roundUpToPack(totals.foamBoardWashers, 100);
  const cementBoardScrewBoxes = getBoxCount(totals.cementBoardScrews, 500);

  addMaterialExcelRow(rows, "Thinset Bags", totals.thinsetBagsTotal, "bags");
  addMaterialExcelRow(rows, "Mastic (1 Gal)", totals.mastic1Gal, "gal");
  addMaterialExcelRow(rows, "Mud Bed Bags", totals.mudBedBags, "bags");
  addMaterialExcelRow(rows, "Drains", totals.drains, "pcs");
  addMaterialExcelRow(rows, "Grates", totals.grates, "pcs");

  addMaterialExcelRow(rows, "GoBoard 3x5", totals.goboard3x5, "boards");
  addMaterialExcelRow(rows, "GoBoard 4x8", totals.goboard4x8, "boards");
  addMaterialExcelRow(rows, "Kerdi Board 3x5", totals.kerdiBoard3x5, "boards");
  addMaterialExcelRow(rows, "Kerdi Board 4x8", totals.kerdiBoard4x8, "boards");
  addMaterialExcelRow(rows, "Durock 1/2 Boards", totals.durockHalfBoards, "boards");
  addMaterialExcelRow(rows, "Durock 1/4 Boards", totals.durockQuarterBoards, "boards");

  addMaterialExcelRow(rows, "Foam Board Screws", foamBoardScrewsRounded, "ct");
  addMaterialExcelRow(rows, "Foam Board Washers", foamBoardWashersRounded, "ct");
  addMaterialExcelRow(rows, "Cement Board Screws", cementBoardScrewBoxes, "500 ct box");

  if (totals.bandRolls > 0) addMaterialExcelRow(rows, "Band", "As needed", "");
  if (totals.meshTapeRolls > 0) addMaterialExcelRow(rows, "Mesh Tape", "As needed", "");
  if (totals.sealantTubes > 0) addMaterialExcelRow(rows, "Sealant / Kerdi Fix", "As needed", "");

  addMaterialExcelRow(rows, "Ditra Area", totals.ditraArea ? totals.ditraArea.toFixed(2) : 0, "sq ft");
  addMaterialExcelRow(rows, "Leveler Bags", totals.levelerBags, "bags");

  addMaterialExcelRow(rows, "Foam System Area", totals.waterproofFoamArea ? totals.waterproofFoamArea.toFixed(2) : 0, "sq ft");
  addMaterialExcelRow(rows, "Sheet Membrane Area", totals.waterproofSheetArea ? totals.waterproofSheetArea.toFixed(2) : 0, "sq ft");
  addMaterialExcelRow(rows, "Shower Floor Membrane", totals.showerFloorMembraneArea ? totals.showerFloorMembraneArea.toFixed(2) : 0, "sq ft");
  addMaterialExcelRow(rows, "Liquid Waterproof Area", totals.waterproofLiquidArea ? totals.waterproofLiquidArea.toFixed(2) : 0, "sq ft");

  addMaterialExcelRow(rows, "Prefab Niches", totals.prefabNicheUnits, "pcs");
  addMaterialExcelRow(rows, "Prefab Benches", totals.prefabBenchUnits, "pcs");
  addMaterialExcelRow(rows, "Prefab Curbs", totals.prefabCurbUnits, "pcs");

  addMaterialExcelRow(rows, "Metal Trim", totals.metalTrimFt ? totals.metalTrimFt.toFixed(2) : 0, "ft");
  addMaterialExcelRow(rows, "Bullnose", totals.bullnoseFt ? totals.bullnoseFt.toFixed(2) : 0, "ft");
  addMaterialExcelRow(rows, "Quartz / Stone Cap", totals.quartzStoneCapFt ? totals.quartzStoneCapFt.toFixed(2) : 0, "ft");
  addMaterialExcelRow(rows, "Transitions", totals.transitionsFt ? totals.transitionsFt.toFixed(2) : 0, "ft");

  return rows;
}

function exportMaterialsExcel() {
  const project = state.currentProject;

  if (!project) {
    alert("No project loaded.");
    return;
  }

  const projectName = project.projectName || "Project Name";
  const rows = buildMaterialsExcelRows(project);

  const tableRows = rows.map((row, index) => `
    <tr class="${index % 2 === 0 ? "even-row" : "odd-row"}">
      <td>${escapeHtml(row.material)}</td>
      <td>${escapeHtml(row.quantity)}</td>
      <td>${escapeHtml(row.unit)}</td>
      <td>${escapeHtml(row.store)}</td>
      <td>${escapeHtml(row.price)}</td>
      <td>${escapeHtml(row.notes)}</td>
      <td>${escapeHtml(row.status)}</td>
    </tr>
  `).join("");

  const html = `
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          table {
            border-collapse: collapse;
            width: 100%;
            font-family: Arial, sans-serif;
            font-size: 12px;
          }

          th {
            background: #156082;
            color: #ffffff;
            font-weight: bold;
            border: 1px solid #333333;
            padding: 6px;
            text-align: center;
          }

          td {
            border: 1px solid #666666;
            padding: 5px;
            text-align: center;
          }

          .project-title {
            font-size: 18px;
            font-weight: bold;
            text-align: center;
            border: 1px solid #666666;
            padding: 10px;
          }

          .even-row {
            background: #c7eaf4;
          }

          .odd-row {
            background: #ffffff;
          }
        </style>
      </head>
      <body>
        <table>
          <tr>
            <td class="project-title" colspan="7">${escapeHtml(projectName)}</td>
          </tr>
          <tr>
            <th>Material</th>
            <th>Quantity</th>
            <th>Unit</th>
            <th>Store</th>
            <th>Price</th>
            <th>Notes</th>
            <th>Status</th>
          </tr>
          ${tableRows}
        </table>
      </body>
    </html>
  `;

  const safeProjectName = projectName
    .trim()
    .replace(/[^a-z0-9-_]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  downloadExcelHtml(`${safeProjectName || "materials-summary"}-materials.xls`, html);
}

function bindBusinessProfileInputs() {
  document.getElementById("businessLogoFile").addEventListener("change", event => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      alert("Logo file is too large. Please use an image under 500 KB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setBusinessProfile({
        ...state.businessProfile,
        logoDataUrl: reader.result
      });
      renderBusinessProfile();
      renderQuotePreview();
      renderInvoice();
    };

    reader.readAsDataURL(file);
  });

  document.getElementById("removeBusinessLogoBtn").addEventListener("click", () => {
    setBusinessProfile({
      ...state.businessProfile,
      logoDataUrl: ""
    });
    document.getElementById("businessLogoFile").value = "";
    renderBusinessProfile();
    renderQuotePreview();
    renderInvoice();
  });

  document.getElementById("saveBusinessBtn").addEventListener("click", () => {
    const profile = {
      name: document.getElementById("businessName").value.trim(),
      phone: document.getElementById("businessPhone").value.trim(),
      email: document.getElementById("businessEmail").value.trim(),
      logoDataUrl: state.businessProfile?.logoDataUrl || ""
    };

    setBusinessProfile(profile);
    saveBusinessProfileToStorage(profile);
    renderQuotePreview();
    renderInvoice();
    renderEvidenceReport();

    alert("Business profile saved.");
  });

  document.getElementById("printQuoteBtn").addEventListener("click", () => {
    applyQuotePrintScale(getQuotePrintScale());
    printSection("print-quote");
  });

  document.getElementById("quotePrintScale").addEventListener("input", event => {
    applyQuotePrintScale(event.target.value);
  });

  document.getElementById("printMaterialsBtn").addEventListener("click", () => {
    printSection("print-materials");
  });

  document.getElementById("exportMaterialsCsvBtn").addEventListener("click", () => {
    exportMaterialsCsv();
  });

  document.getElementById("printInvoiceBtn").addEventListener("click", () => {
  renderInvoice();
  bindInvoiceInputs();
  printSection("print-invoice");
});
}

function bindProjectInputs() {
  document.getElementById("projectName").addEventListener("input", (e) => {
    if (!state.currentProject) return;
    state.currentProject.projectName = e.target.value;
    touchCurrentProject();
    renderSummary();
    renderSavedProjectsList();
    renderQuotePreview();
    refreshInvoicePreview();
    renderEvidenceReport();
  });

  document.getElementById("clientName").addEventListener("input", (e) => {
    if (!state.currentProject) return;
    state.currentProject.client.name = e.target.value;
    touchCurrentProject();
    renderSummary();
    renderSavedProjectsList();
    renderQuotePreview();
    refreshInvoicePreview();
    renderEvidenceReport();
  });

  document.getElementById("clientPhone").addEventListener("input", (e) => {
    if (!state.currentProject) return;
    state.currentProject.client.phone = e.target.value;
    touchCurrentProject();
    renderSummary();
    renderQuotePreview();
    refreshInvoicePreview();
    renderEvidenceReport();
  });

  document.getElementById("jobAddress").addEventListener("input", (e) => {
    if (!state.currentProject) return;
    state.currentProject.jobSite.address = e.target.value;
    touchCurrentProject();
    renderSummary();
    renderQuotePreview();
    refreshInvoicePreview();
    renderEvidenceReport();
  });

  document.getElementById("scopeOfWork").addEventListener("input", (e) => {
    if (!state.currentProject) return;
    state.currentProject.scopeOfWork = e.target.value;
    touchCurrentProject();
    renderQuotePreview();
    refreshInvoicePreview();
    renderEvidenceReport();
  });

  document.getElementById("projectNotes").addEventListener("input", (e) => {
    if (!state.currentProject) return;
    state.currentProject.notes = e.target.value;
    touchCurrentProject();
    renderQuotePreview();
    refreshInvoicePreview();
    renderEvidenceReport();
  });

  document.getElementById("includeDemolition").addEventListener("change", (e) => {
    if (!state.currentProject) return;
    state.currentProject.charges.demolition.included = e.target.checked;
    touchCurrentProject();
    renderSummary();
    renderQuotePreview();
    refreshInvoicePreview();
    renderEvidenceReport();
  });

  document.getElementById("demolitionPrice").addEventListener("input", (e) => {
    if (!state.currentProject) return;
    state.currentProject.charges.demolition.price = Number(e.target.value) || 0;
    touchCurrentProject();
    renderSummary();
    renderQuotePreview();
    refreshInvoicePreview();
    renderEvidenceReport();
  });

  document.getElementById("includePlumbing").addEventListener("change", (e) => {
    if (!state.currentProject) return;
    state.currentProject.charges.plumbing.included = e.target.checked;
    touchCurrentProject();
    renderSummary();
    renderQuotePreview();
    refreshInvoicePreview();
    renderEvidenceReport();
  });

  document.getElementById("plumbingPrice").addEventListener("input", (e) => {
    if (!state.currentProject) return;
    state.currentProject.charges.plumbing.price = Number(e.target.value) || 0;
    touchCurrentProject();
    renderSummary();
    renderQuotePreview();
    refreshInvoicePreview();
    renderEvidenceReport();
  });
}

function updateAreaField(areaId, field, value) {
  const area = state.currentProject?.areas.find(item => item.areaId === areaId);
  if (!area) return;

  if (!area.options) {
    area.options = {};
  }

  if (!area.edgeFinishes) {
  area.edgeFinishes = {};
}

if (field === "metalTrimFt") area.edgeFinishes.metalTrimFt = Number(value) || 0;
if (field === "bullnoseFt") area.edgeFinishes.bullnoseFt = Number(value) || 0;
if (field === "quartzStoneCapFt") area.edgeFinishes.quartzStoneCapFt = Number(value) || 0;
if (field === "transitionsFt") area.edgeFinishes.transitionsFt = Number(value) || 0;

  if (field === "name") area.name = value;
  if (field === "laborPricePerSqFt") area.pricing.laborPricePerSqFt = Number(value) || 0;

  if (field === "showerMeasurementMode") area.options.showerMeasurementMode = value;
  if (field === "manualWetWallArea") area.measurements.manualWetWallArea = Number(value) || 0;
  if (field === "backWallWidth") area.measurements.backWall.width = Number(value) || 0;
  if (field === "backWallHeight") area.measurements.backWall.height = Number(value) || 0;
  if (field === "leftWallWidth") area.measurements.leftWall.width = Number(value) || 0;
  if (field === "leftWallHeight") area.measurements.leftWall.height = Number(value) || 0;
  if (field === "rightWallWidth") area.measurements.rightWall.width = Number(value) || 0;
  if (field === "rightWallHeight") area.measurements.rightWall.height = Number(value) || 0;
  if (field === "floorLength") area.measurements.floor.length = Number(value) || 0;
  if (field === "floorWidth") area.measurements.floor.width = Number(value) || 0;
  if (field === "panType") area.options.panType = value;
  if (field === "mudBedDepthIn") area.options.mudBedDepthIn = Number(value) || 0;
  if (field === "prepSystem") area.options.prepSystem = value;
if (field === "useLeveler") area.options.useLeveler = value;
if (field === "laminateUnderlayment") area.options.laminateUnderlayment = value;
if (field === "laminateVaporBarrier") area.options.laminateVaporBarrier = value;
if (field === "woodInstallMethod") area.options.woodInstallMethod = value;
if (field === "woodGlueTrowel") area.options.woodGlueTrowel = value;
if (field === "woodUnderlayment") area.options.woodUnderlayment = value;
if (field === "woodMoistureBarrier") area.options.woodMoistureBarrier = value;
if (field === "woodSoundBarrier") area.options.woodSoundBarrier = value;

  if (field === "length") area.measurements.length = Number(value) || 0;
  if (field === "width") area.measurements.width = Number(value) || 0;

  if (field === "area") area.measurements.area = Number(value) || 0;

  if (field === "wallWaste") area.options.wallWaste = Number(value) || 0;
  if (field === "floorWaste" && area.type === "shower") area.options.floorWaste = Number(value) || 0;
  if (field === "floorWaste" && area.type === "floor") area.options.floorWaste = Number(value) || 0;
  if (field === "backsplashWaste") area.options.backsplashWaste = Number(value) || 0;
  if (field === "wallTrowel") area.options.wallTrowel = value;
if (field === "floorTrowel") area.options.floorTrowel = value;
if (field === "backsplashTrowel") area.options.backsplashTrowel = value;
if (field === "masticType") area.options.masticType = value;
if (field === "prepType") area.options.prepType = value;
if (field === "levelerDepth") area.options.levelerDepth = Number(value) || 0;
if (field === "floorType") area.options.floorType = value;
if (field === "laminateUnderlayment") area.options.laminateUnderlayment = value;
if (field === "laminateVaporBarrier") area.options.laminateVaporBarrier = value;
if (field === "woodInstallMethod") area.options.woodInstallMethod = value;

  if (field === "boardType") area.options.boardType = value;
if (field === "boardSize") area.options.boardSize = Number(value) || 15;
if (field === "waterproofType") area.options.waterproofType = value;

if (field === "niche") area.options.niche = value;
if (field === "bench") area.options.bench = value;
if (field === "curb") area.options.curb = value;

if (field === "nichePrepArea") area.options.nichePrepArea = Number(value) || 0;
if (field === "benchPrepArea") area.options.benchPrepArea = Number(value) || 0;
if (field === "curbPrepArea") area.options.curbPrepArea = Number(value) || 0;
if (field === "nichePrice") area.options.nichePrice = Number(value) || 0;
if (field === "benchPrice") area.options.benchPrice = Number(value) || 0;
if (field === "curbPrice") area.options.curbPrice = Number(value) || 0;
if (field === "nicheType") area.options.nicheType = value;
if (field === "benchType") area.options.benchType = value;
if (field === "curbType") area.options.curbType = value;

if (field === "tileArea") area.measurements.tileArea = Number(value) || 0;
if (field === "durockPrepArea") area.measurements.durockPrepArea = Number(value) || 0;

if (field === "fireplaceWaste") area.options.fireplaceWaste = Number(value) || 0;
if (field === "fireplaceTrowel") area.options.fireplaceTrowel = value;

if (field === "steps") area.measurements.steps = Number(value) || 0;
if (field === "landings") area.measurements.landings = Number(value) || 0;

if (field === "pricePerStep") area.pricing.pricePerStep = Number(value) || 0;
if (field === "pricePerLanding") area.pricing.pricePerLanding = Number(value) || 0;

  touchCurrentProject();
}

function bindAreaInputs() {
  document.querySelectorAll("#areasContainer [data-area-id][data-field]").forEach(input => {
    const handler = (e) => {
      const areaId = e.target.dataset.areaId;
      const field = e.target.dataset.field;
      const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;

      updateAreaField(areaId, field, value);

      const structuralFields = [
        "showerMeasurementMode",
        "panType",
        "niche",
        "bench",
        "curb",
        "nicheType",
        "benchType",
        "curbType",
        "floorType",
        "prepSystem",
        "useLeveler",
        "laminateUnderlayment",
        "laminateVaporBarrier",
        "woodInstallMethod",
        "woodGlueTrowel",
        "woodUnderlayment",
        "woodMoistureBarrier",
        "woodSoundBarrier",
        "fireplaceTrowel"
      ];

      if (structuralFields.includes(field)) {
        renderApp();
        return;
      }

      refreshAreaDisplay(areaId);
      renderSummary();
      renderMaterialsSummary();
      renderQuotePreview();
    };

    input.addEventListener("input", handler);
    input.addEventListener("change", handler);
  });

  document.querySelectorAll("#areasContainer [data-area-id][data-task-id][data-task-field]").forEach(input => {
    const handler = (e) => {
      updateCustomTaskField(
        e.target.dataset.areaId,
        e.target.dataset.taskId,
        e.target.dataset.taskField,
        e.target.value
      );

      refreshAreaDisplay(e.target.dataset.areaId);
      renderSummary();
      renderQuotePreview();
    };

    input.addEventListener("input", handler);
    input.addEventListener("change", handler);
  });

  document.querySelectorAll("#areasContainer [data-area-id][data-floor-task-id][data-floor-task-field]").forEach(input => {
    const handler = (e) => {
      updateFloorTaskField(
        e.target.dataset.areaId,
        e.target.dataset.floorTaskId,
        e.target.dataset.floorTaskField,
        e.target.value
      );

      refreshAreaDisplay(e.target.dataset.areaId);
      renderSummary();
      renderQuotePreview();
    };

    input.addEventListener("input", handler);
    input.addEventListener("change", handler);
  });

  document.querySelectorAll("#areasContainer [data-area-id][data-backsplash-task-id][data-backsplash-task-field]").forEach(input => {
    const handler = (e) => {
      updateBacksplashTaskField(
        e.target.dataset.areaId,
        e.target.dataset.backsplashTaskId,
        e.target.dataset.backsplashTaskField,
        e.target.value
      );

      refreshAreaDisplay(e.target.dataset.areaId);
      renderSummary();
      renderQuotePreview();
    };

    input.addEventListener("input", handler);
    input.addEventListener("change", handler);
  });

  document.querySelectorAll("#areasContainer [data-area-id][data-fireplace-task-id][data-fireplace-task-field]").forEach(input => {
    const handler = (e) => {
      updateFireplaceTaskField(
        e.target.dataset.areaId,
        e.target.dataset.fireplaceTaskId,
        e.target.dataset.fireplaceTaskField,
        e.target.value
      );

      refreshAreaDisplay(e.target.dataset.areaId);
      renderSummary();
      renderQuotePreview();
    };

    input.addEventListener("input", handler);
    input.addEventListener("change", handler);
  });

  document.querySelectorAll("#areasContainer [data-area-id][data-dry-tile-id][data-dry-tile-field]").forEach(input => {
    const handler = (e) => {
      const areaId = e.target.dataset.areaId;
      const dryTileId = e.target.dataset.dryTileId;

      updateDryTileExtensionField(
        areaId,
        dryTileId,
        e.target.dataset.dryTileField,
        e.target.value
      );

      const area = state.currentProject?.areas.find(item => item.areaId === areaId);
      const dryTileItem = area?.dryTileExtensions?.find(item => item.id === dryTileId);
      const totalInput = document.querySelector(`#areasContainer [data-dry-tile-total="${dryTileId}"]`);

      if (dryTileItem && totalInput) {
        const dryTileTotal = (Number(dryTileItem.area) || 0) * (Number(dryTileItem.pricePerSqFt) || 0);
        totalInput.value = `Dry Area Total: ${formatMoney(dryTileTotal)}`;
      }

      refreshAreaDisplay(areaId);
      renderSummary();
      renderMaterialsSummary();
      renderQuotePreview();
    };

    input.addEventListener("input", handler);
    input.addEventListener("change", handler);
  });
}

function bindAreaActionButtons() {
  document.querySelectorAll("#areasContainer [data-action='toggle-area-collapse']").forEach(button => {
    button.addEventListener("click", (e) => {
      const areaId = e.target.dataset.areaId;
      toggleAreaCollapsed(areaId);
    });
  });

  document.querySelectorAll("#areasContainer [data-action='duplicate-area']").forEach(button => {
    button.addEventListener("click", (e) => {
      const areaId = e.target.dataset.areaId;
      const area = state.currentProject?.areas.find(item => item.areaId === areaId);
      const areaName = area ? `${getAreaLabel(area)} - ${area.name}` : "this area";

      if (!confirm(`Duplicate ${areaName}?`)) return;

      duplicateAreaInCurrentProject(areaId);
      renderApp();
    });
  });

  document.querySelectorAll("#areasContainer [data-action='add-floor-task']").forEach(button => {
    button.addEventListener("click", (e) => {
      addFloorTaskToArea(e.target.dataset.areaId);
      renderApp();
    });
  });

  document.querySelectorAll("#areasContainer [data-action='remove-floor-task']").forEach(button => {
    button.addEventListener("click", (e) => {
      if (!confirm("Remove this floor charge? This cannot be undone.")) return;

      removeFloorTaskFromArea(e.target.dataset.areaId, e.target.dataset.floorTaskId);
      renderApp();
    });
  });

  document.querySelectorAll("#areasContainer [data-action='add-fireplace-task']").forEach(button => {
    button.addEventListener("click", (e) => {
      addFireplaceTaskToArea(e.target.dataset.areaId);
      renderApp();
    });
  });

  document.querySelectorAll("#areasContainer [data-action='remove-fireplace-task']").forEach(button => {
    button.addEventListener("click", (e) => {
      if (!confirm("Remove this fireplace charge? This cannot be undone.")) return;

      removeFireplaceTaskFromArea(e.target.dataset.areaId, e.target.dataset.fireplaceTaskId);
      renderApp();
    });
  });

  document.querySelectorAll("#areasContainer [data-action='add-backsplash-task']").forEach(button => {
    button.addEventListener("click", (e) => {
      addBacksplashTaskToArea(e.target.dataset.areaId);
      renderApp();
    });
  });

  document.querySelectorAll("#areasContainer [data-action='remove-backsplash-task']").forEach(button => {
    button.addEventListener("click", (e) => {
      if (!confirm("Remove this backsplash charge? This cannot be undone.")) return;

      removeBacksplashTaskFromArea(e.target.dataset.areaId, e.target.dataset.backsplashTaskId);
      renderApp();
    });
  });

  document.querySelectorAll("#areasContainer [data-action='remove-area']").forEach(button => {
    button.addEventListener("click", (e) => {
      const areaId = e.target.dataset.areaId;
      const area = state.currentProject?.areas.find(item => item.areaId === areaId);
      const areaName = area ? `${getAreaLabel(area)} - ${area.name}` : "this area";

      if (!confirm(`Remove ${areaName}? This cannot be undone.`)) return;

      removeAreaFromCurrentProject(areaId);
      renderApp();
    });
  });

  document.querySelectorAll("#areasContainer [data-action='add-dry-tile']").forEach(button => {
    button.addEventListener("click", (e) => {
      addDryTileExtensionToArea(e.target.dataset.areaId);
      renderApp();
    });
  });

  document.querySelectorAll("#areasContainer [data-action='remove-dry-tile']").forEach(button => {
    button.addEventListener("click", (e) => {
      if (!confirm("Remove this dry tile extension? This cannot be undone.")) return;

      removeDryTileExtensionFromArea(e.target.dataset.areaId, e.target.dataset.dryTileId);
      renderApp();
    });
  });

  document.querySelectorAll("#areasContainer [data-action='add-task']").forEach(button => {
    button.addEventListener("click", (e) => {
      addCustomTaskToArea(e.target.dataset.areaId);
      renderApp();
    });
  });

  document.querySelectorAll("#areasContainer [data-action='remove-task']").forEach(button => {
    button.addEventListener("click", (e) => {
      if (!confirm("Remove this shower charge? This cannot be undone.")) return;

      removeCustomTaskFromArea(e.target.dataset.areaId, e.target.dataset.taskId);
      renderApp();
    });
  });
}

function currentProjectHasContent(project) {
  if (!project) return false;

  const hasProjectInfo =
    (project.projectName || "").trim() ||
    (project.client?.name || "").trim() ||
    (project.client?.phone || "").trim() ||
    (project.jobSite?.address || "").trim() ||
    (project.scopeOfWork || "").trim() ||
    (project.notes || "").trim();

  const hasAreas = Array.isArray(project.areas) && project.areas.length > 0;
  const hasEvidence = Array.isArray(project.evidenceLog) && project.evidenceLog.length > 0;
  const hasInvoice =
    (project.invoice?.number || "").trim() ||
    (project.invoice?.paymentTerms || "").trim() ||
    (project.invoice?.notes || "").trim() ||
    (Array.isArray(project.invoice?.payments) && project.invoice.payments.length > 0) ||
    (Array.isArray(project.invoice?.customItems) && project.invoice.customItems.length > 0);

  const hasProjectCharges =
    !!project.charges?.demolition?.included ||
    !!project.charges?.plumbing?.included ||
    (Number(project.charges?.demolition?.price) || 0) > 0 ||
    (Number(project.charges?.plumbing?.price) || 0) > 0;

  return !!hasProjectInfo || hasAreas || hasEvidence || !!hasInvoice || hasProjectCharges;
}

function bindButtons() {
  document.getElementById("newProjectBtn").addEventListener("click", () => {
  if (currentProjectHasContent(state.currentProject)) {
    const confirmed = confirm(
      "Start a new project? Any unsaved information in the current project will be lost. Save this project first if you want to keep it."
    );

    if (!confirmed) return;
  }

  cancelScheduledAutosave();
  setCurrentProject(createProject());
  updateAutosaveStatus("Autosave ready.");
  renderApp();
});

  document.getElementById("saveProjectBtn").addEventListener("click", () => {
  if (!state.currentProject) return;

  touchCurrentProject();

  const normalizedProject = normalizeProject(state.currentProject);
  setCurrentProject(normalizedProject);

  cancelScheduledAutosave();
  saveProjectToStorage(normalizedProject);
  deleteProjectAutosave(normalizedProject.projectId);
  renderSavedProjectsList();
  renderApp();
  updateAutosaveStatus("Project saved.");

  alert("Project saved.");
});

  document.getElementById("loadProjectBtn").addEventListener("click", () => {
  const projectId = document.getElementById("savedProjectsSelect").value;
  if (!projectId) return;

  const project = loadProjectFromStorage(projectId);
  if (!project) return;

  const normalizedProject = normalizeProject(project);

  cancelScheduledAutosave();
  setCurrentProject(normalizedProject);
  updateAutosaveStatus("Autosave ready.");
  renderApp();
});

  document.getElementById("deleteProjectBtn").addEventListener("click", () => {
    const projectId = document.getElementById("savedProjectsSelect").value || state.currentProject?.projectId;
    if (!projectId) return;

    const confirmed = confirm("Delete this saved project? This cannot be undone.");
    if (!confirmed) return;

    deleteProjectFromStorage(projectId);
    deleteProjectAutosave(projectId);

    const currentId = state.currentProject?.projectId;
    if (currentId === projectId) {
      cancelScheduledAutosave();
      setCurrentProject(createProject());
      updateAutosaveStatus("Autosave ready.");
    }

    renderApp();
    alert("Project deleted.");
  });

  document.getElementById("exportProjectBtn").addEventListener("click", () => {
    exportCurrentProjectJson();
  });

  document.getElementById("importProjectBtn").addEventListener("click", () => {
    document.getElementById("importProjectFile").click();
  });

  document.getElementById("importProjectFile").addEventListener("change", event => {
    const file = event.target.files?.[0];
    importProjectJsonFile(file);
    event.target.value = "";
  });

  document.getElementById("recoverAutosaveBtn").addEventListener("click", () => {
    recoverLatestProjectAutosave();
  });

  document.getElementById("restoreProjectBackupBtn").addEventListener("click", () => {
    restoreSelectedProjectBackup();
  });

  document.getElementById("exportProjectBackupBtn").addEventListener("click", () => {
    exportSelectedProjectBackupJson();
  });

  document.getElementById("addShowerBtn").addEventListener("click", () => {
    addAreaToCurrentProject(createArea("shower"));
    renderApp();
  });

  document.getElementById("addFloorBtn").addEventListener("click", () => {
    addAreaToCurrentProject(createArea("floor"));
    renderApp();
  });

  document.getElementById("addBacksplashBtn").addEventListener("click", () => {
  addAreaToCurrentProject(createArea("backsplash"));
  renderApp();
});

document.getElementById("addFireplaceBtn").addEventListener("click", () => {
  addAreaToCurrentProject(createArea("fireplace"));
  renderApp();
});

document.getElementById("addStairsBtn").addEventListener("click", () => {
  addAreaToCurrentProject(createArea("stairs"));
  renderApp();
});
}

function normalizeShowerArea(area) {
  area.measurements = area.measurements || {};
  area.measurements.backWall = area.measurements.backWall || { width: 0, height: 0 };
  area.measurements.leftWall = area.measurements.leftWall || { width: 0, height: 0 };
  area.measurements.rightWall = area.measurements.rightWall || { width: 0, height: 0 };
  area.measurements.manualWetWallArea = area.measurements.manualWetWallArea ?? 0;
  area.measurements.floor = area.measurements.floor || { length: 0, width: 0 };

  area.options = area.options || {};

  area.options.showerMeasurementMode = area.options.showerMeasurementMode || "manual";
  area.options.wallWaste = area.options.wallWaste ?? 10;
  area.options.floorWaste = area.options.floorWaste ?? 10;
  area.options.wallTrowel = area.options.wallTrowel || "1/4x3/8";
  area.options.floorTrowel = area.options.floorTrowel || "1/2x1/2";

  area.options.boardType = area.options.boardType || "kerdi";
  area.options.boardSize = area.options.boardSize ?? 15;
  area.options.waterproofType = area.options.waterproofType || "foam";

  area.options.panType = area.options.panType || "mud";
  area.options.mudBedDepthIn = area.options.mudBedDepthIn ?? 2;

  area.options.niche = area.options.niche ?? false;
  area.options.bench = area.options.bench ?? false;
  area.options.curb = area.options.curb ?? false;

  area.options.nicheType = area.options.nicheType || "inplace";
  area.options.benchType = area.options.benchType || "inplace";
  area.options.curbType = area.options.curbType || "inplace";

  area.options.nichePrepArea = area.options.nichePrepArea ?? 6;
  area.options.benchPrepArea = area.options.benchPrepArea ?? 10;
  area.options.curbPrepArea = area.options.curbPrepArea ?? 5;

  area.options.nichePrice = area.options.nichePrice ?? 0;
  area.options.benchPrice = area.options.benchPrice ?? 0;
  area.options.curbPrice = area.options.curbPrice ?? 0;

  area.edgeFinishes = area.edgeFinishes || {};
  area.edgeFinishes.metalTrimFt = area.edgeFinishes.metalTrimFt ?? 0;
  area.edgeFinishes.bullnoseFt = area.edgeFinishes.bullnoseFt ?? 0;
  area.edgeFinishes.quartzStoneCapFt = area.edgeFinishes.quartzStoneCapFt ?? 0;

  area.customTasks = Array.isArray(area.customTasks) ? area.customTasks : [];
  area.dryTileExtensions = Array.isArray(area.dryTileExtensions) ? area.dryTileExtensions : [];
  area.dryTileExtensions = area.dryTileExtensions.map(item => ({
    id: item.id || `dry-tile-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    description: item.description || "",
    area: item.area ?? 0,
    pricePerSqFt: item.pricePerSqFt ?? 0
  }));

  return area;
}

function normalizeFloorArea(area) {
  area.measurements = area.measurements || {};
  area.measurements.length = area.measurements.length ?? 0;
  area.measurements.width = area.measurements.width ?? 0;

  area.options = area.options || {};
  area.options.floorType = area.options.floorType || "tile";
  area.options.floorWaste = area.options.floorWaste ?? 10;
  area.options.floorTrowel = area.options.floorTrowel || "1/2x1/2";

  area.options.prepSystem = area.options.prepSystem || "none";
  area.options.useLeveler = area.options.useLeveler ?? false;
  area.options.levelerDepth = area.options.levelerDepth ?? 0.25;

  area.options.laminateUnderlayment = area.options.laminateUnderlayment ?? true;
  area.options.laminateVaporBarrier = area.options.laminateVaporBarrier ?? false;

  area.options.woodInstallMethod = area.options.woodInstallMethod || "nail";
  area.options.woodGlueTrowel = area.options.woodGlueTrowel || "1/4-v-notch";
  area.options.woodUnderlayment = area.options.woodUnderlayment ?? true;
  area.options.woodMoistureBarrier = area.options.woodMoistureBarrier ?? true;
  area.options.woodSoundBarrier = area.options.woodSoundBarrier ?? false;
  area.edgeFinishes = area.edgeFinishes || {};
  area.edgeFinishes.metalTrimFt = area.edgeFinishes.metalTrimFt ?? 0;
  area.edgeFinishes.transitionsFt = area.edgeFinishes.transitionsFt ?? 0;

  area.floorTasks = Array.isArray(area.floorTasks) ? area.floorTasks : [];

  return area;
}

function normalizeBacksplashArea(area) {
  area.measurements = area.measurements || {};
  area.measurements.area = area.measurements.area ?? 0;

  area.options = area.options || {};
  area.options.backsplashWaste = area.options.backsplashWaste ?? 10;
  area.options.backsplashTrowel = area.options.backsplashTrowel || "1/4x3/16";
  area.options.masticType = area.options.masticType || "1gal";
  area.edgeFinishes = area.edgeFinishes || {};
area.edgeFinishes.metalTrimFt = area.edgeFinishes.metalTrimFt ?? 0;
area.edgeFinishes.bullnoseFt = area.edgeFinishes.bullnoseFt ?? 0;
area.edgeFinishes.quartzStoneCapFt = area.edgeFinishes.quartzStoneCapFt ?? 0;

area.backsplashTasks = Array.isArray(area.backsplashTasks) ? area.backsplashTasks : [];

  return area;
}

function normalizeFireplaceArea(area) {
  area.measurements = area.measurements || {};
  area.measurements.tileArea = area.measurements.tileArea ?? 0;
  area.measurements.durockPrepArea = area.measurements.durockPrepArea ?? 0;

  area.options = area.options || {};
  area.options.fireplaceWaste = area.options.fireplaceWaste ?? 10;
  area.options.fireplaceTrowel = area.options.fireplaceTrowel || "1/4x3/8";

  area.edgeFinishes = area.edgeFinishes || {};
  area.edgeFinishes.metalTrimFt = area.edgeFinishes.metalTrimFt ?? 0;
  area.edgeFinishes.bullnoseFt = area.edgeFinishes.bullnoseFt ?? 0;
  area.edgeFinishes.quartzStoneCapFt = area.edgeFinishes.quartzStoneCapFt ?? 0;

  area.fireplaceTasks = Array.isArray(area.fireplaceTasks) ? area.fireplaceTasks : [];

  return area;
}

function normalizeStairsArea(area) {
  area.measurements = area.measurements || {};
  area.measurements.steps = area.measurements.steps ?? 0;
  area.measurements.landings = area.measurements.landings ?? 0;

  area.pricing = area.pricing || {};
  area.pricing.pricePerStep = area.pricing.pricePerStep ?? 0;
  area.pricing.pricePerLanding = area.pricing.pricePerLanding ?? 0;
  area.pricing.laborPricePerSqFt = area.pricing.laborPricePerSqFt ?? 0;

  area.stairTasks = Array.isArray(area.stairTasks) ? area.stairTasks : [];

  return area;
}

function normalizeArea(area) {
  area.pricing = area.pricing || {};
  area.pricing.laborPricePerSqFt = area.pricing.laborPricePerSqFt ?? 0;

  if (area.type === "shower") return normalizeShowerArea(area);
  if (area.type === "floor") return normalizeFloorArea(area);
  if (area.type === "backsplash") return normalizeBacksplashArea(area);
  if (area.type === "fireplace") return normalizeFireplaceArea(area);
  if (area.type === "stairs") return normalizeStairsArea(area);

  return area;
}

function normalizeProject(project) {
  if (!project) return createProject();

  project.projectId = project.projectId || createId("project");
  project.projectName = project.projectName || "";
  project.createdAt = project.createdAt || new Date().toISOString();
  project.updatedAt = project.updatedAt || new Date().toISOString();
  project.status = project.status || "draft";

  project.client = project.client || {};
  project.client.name = project.client.name || "";
  project.client.phone = project.client.phone || "";

  project.jobSite = project.jobSite || {};
  project.jobSite.address = project.jobSite.address || "";

  project.scopeOfWork = project.scopeOfWork || "";
  project.notes = project.notes || "";

  project.charges = project.charges || {};
  project.charges.demolition = project.charges.demolition || { included: false, price: 0 };
  project.charges.plumbing = project.charges.plumbing || { included: false, price: 0 };

  project.areas = Array.isArray(project.areas) ? project.areas.map(normalizeArea) : [];
  project.evidenceLog = Array.isArray(project.evidenceLog) ? project.evidenceLog : [];

  project.tools = project.tools || {};
project.tools.groutCalculator = project.tools.groutCalculator || {
  area: 0,
  groutType: "non-sanded-10",
  tileSize: "12x12x3/8",
  jointWidth: "1/8"
};

project.tools.layoutCalculator = project.tools.layoutCalculator || {
  area: 0,
  tileWidth: 12,
  tileLength: 24,
  wastePercent: 10,
  piecesPerBox: 0,
  coveragePerBox: 0
};

project.invoice = project.invoice || {};
project.invoice.number = project.invoice.number || "";
project.invoice.date = project.invoice.date || new Date().toISOString().slice(0, 10);
project.invoice.dueDate = project.invoice.dueDate || "";
project.invoice.status = project.invoice.status || "draft";
project.invoice.mode = project.invoice.mode || "detailed";
project.invoice.paymentTerms = project.invoice.paymentTerms || "";
project.invoice.notes = project.invoice.notes || "";
project.invoice.amountPaid = Number(project.invoice.amountPaid) || 0;
project.invoice.customItems = Array.isArray(project.invoice.customItems) ? project.invoice.customItems : [];

project.invoice.payments = Array.isArray(project.invoice.payments) ? project.invoice.payments : [];

if (project.invoice.payments.length === 0 && (Number(project.invoice.amountPaid) || 0) > 0) {
  project.invoice.payments.push({
    id: createId("invoice-payment"),
    date: project.invoice.date || new Date().toISOString().slice(0, 10),
    description: "Previous payment",
    method: "",
    amount: Number(project.invoice.amountPaid) || 0
  });
}

  return project;
}

function initApp() {
  const savedBusinessProfile = loadBusinessProfileFromStorage();
  if (savedBusinessProfile) {
    setBusinessProfile(savedBusinessProfile);
  }

  setCurrentProject(promptForAutosaveRecovery() || createProject());
  bindBusinessProfileInputs();
  bindProjectInputs();
  bindButtons();
  bindMainModuleToggles();
  renderApp();
  applyQuotePrintScale(getQuotePrintScale());
}

initApp();





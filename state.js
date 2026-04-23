const state = {
  currentProject: null,
  businessProfile: {
    name: "",
    phone: "",
    email: "",
    logoDataUrl: ""
  }
};

function setCurrentProject(project) {
  state.currentProject = project;
}

function setBusinessProfile(profile) {
  state.businessProfile = {
    name: profile?.name || "",
    phone: profile?.phone || "",
    email: profile?.email || "",
    logoDataUrl: profile?.logoDataUrl || ""
  };
}

function clearCurrentProject() {
  state.currentProject = null;
}

function addAreaToCurrentProject(area) {
  if (!state.currentProject) return;

  state.currentProject.areas.push(area);
  touchCurrentProject();
}

function removeAreaFromCurrentProject(areaId) {
  if (!state.currentProject) return;

  state.currentProject.areas = state.currentProject.areas.filter(
    area => area.areaId !== areaId
  );

  touchCurrentProject();
}

function duplicateAreaInCurrentProject(areaId) {
  if (!state.currentProject) return;

  const originalArea = state.currentProject.areas.find(
    area => area.areaId === areaId
  );

  if (!originalArea) return;

  const copiedArea = structuredClone(originalArea);
  copiedArea.areaId = createId("area");
  copiedArea.name = `${originalArea.name} Copy`;

  state.currentProject.areas.push(copiedArea);
  touchCurrentProject();
}

function updateCurrentProject(updates) {
  if (!state.currentProject) return;

  state.currentProject = {
    ...state.currentProject,
    ...updates
  };

  touchCurrentProject();
}

function touchCurrentProject() {
  if (!state.currentProject) return;
  state.currentProject.updatedAt = new Date().toISOString();

  if (typeof scheduleCurrentProjectAutosave === "function") {
    scheduleCurrentProjectAutosave();
  }
}

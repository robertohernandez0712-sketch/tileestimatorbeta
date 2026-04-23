const STORAGE_KEY = "tile_estimator_projects_v1";
const BUSINESS_PROFILE_KEY = "tile_estimator_business_profile_v1";
const PROJECT_BACKUPS_KEY = "tile_estimator_project_backups_v1";
const PROJECT_AUTOSAVES_KEY = "tile_estimator_project_autosaves_v1";
const MAX_PROJECT_BACKUPS = 20;
const MAX_PROJECT_AUTOSAVES = 5;

function getSavedProjects() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.error("Error reading saved projects:", error);
    return {};
  }
}

function saveProjectToStorage(project) {
  if (!project || !project.projectId) return;

  const projects = getSavedProjects();
  if (projects[project.projectId]) {
    saveProjectBackup(projects[project.projectId], "before-save");
  }

  projects[project.projectId] = project;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

function loadProjectFromStorage(projectId) {
  const projects = getSavedProjects();
  return projects[projectId] || null;
}

function deleteProjectFromStorage(projectId) {
  const projects = getSavedProjects();
  if (projects[projectId]) {
    saveProjectBackup(projects[projectId], "before-delete");
  }

  delete projects[projectId];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

function getSavedProjectsList() {
  const projects = getSavedProjects();

  return Object.values(projects).sort((a, b) => {
    const aDate = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const bDate = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return bDate - aDate;
  });
}

function saveBusinessProfileToStorage(profile) {
  localStorage.setItem(BUSINESS_PROFILE_KEY, JSON.stringify(profile));
}

function loadBusinessProfileFromStorage() {
  try {
    const raw = localStorage.getItem(BUSINESS_PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error("Error reading business profile:", error);
    return null;
  }
}

function getProjectBackups() {
  try {
    const raw = localStorage.getItem(PROJECT_BACKUPS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error("Error reading project backups:", error);
    return [];
  }
}

function saveProjectBackup(project, action = "manual") {
  if (!project || !project.projectId) return;

  try {
    const backups = getProjectBackups();
    const backup = {
      backupId: createId("backup"),
      projectId: project.projectId,
      projectName: project.projectName || "Untitled Project",
      action,
      createdAt: new Date().toISOString(),
      project: JSON.parse(JSON.stringify(project))
    };

    backups.unshift(backup);
    localStorage.setItem(
      PROJECT_BACKUPS_KEY,
      JSON.stringify(backups.slice(0, MAX_PROJECT_BACKUPS))
    );
  } catch (error) {
    console.error("Error saving project backup:", error);
  }
}

function loadProjectBackup(backupId) {
  const backups = getProjectBackups();
  return backups.find(backup => backup.backupId === backupId) || null;
}

function getProjectAutosaves() {
  try {
    const raw = localStorage.getItem(PROJECT_AUTOSAVES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.error("Error reading project autosaves:", error);
    return {};
  }
}

function getProjectAutosavesList() {
  const autosaves = getProjectAutosaves();

  return Object.values(autosaves).sort((a, b) => {
    const aDate = new Date(a.updatedAt || 0).getTime();
    const bDate = new Date(b.updatedAt || 0).getTime();
    return bDate - aDate;
  });
}

function getLatestProjectAutosave() {
  return getProjectAutosavesList()[0] || null;
}

function saveProjectAutosave(project) {
  if (!project || !project.projectId) return;

  try {
    const autosaves = getProjectAutosaves();
    autosaves[project.projectId] = {
      autosaveId: createId("autosave"),
      projectId: project.projectId,
      projectName: project.projectName || "Untitled Project",
      updatedAt: new Date().toISOString(),
      project: JSON.parse(JSON.stringify(project))
    };

    const limitedAutosaves = getProjectAutosavesListFromMap(autosaves)
      .slice(0, MAX_PROJECT_AUTOSAVES)
      .reduce((acc, autosave) => {
        acc[autosave.projectId] = autosave;
        return acc;
      }, {});

    localStorage.setItem(PROJECT_AUTOSAVES_KEY, JSON.stringify(limitedAutosaves));
  } catch (error) {
    console.error("Error saving project autosave:", error);
  }
}

function deleteProjectAutosave(projectId) {
  if (!projectId) return;

  const autosaves = getProjectAutosaves();
  delete autosaves[projectId];
  localStorage.setItem(PROJECT_AUTOSAVES_KEY, JSON.stringify(autosaves));
}

function getProjectAutosavesListFromMap(autosaves) {
  return Object.values(autosaves).sort((a, b) => {
    const aDate = new Date(a.updatedAt || 0).getTime();
    const bDate = new Date(b.updatedAt || 0).getTime();
    return bDate - aDate;
  });
}

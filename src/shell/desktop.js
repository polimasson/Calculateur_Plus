/**
 * Shell bureau générique. Le look vient du thème (classes window.*, CSS).
 * Pour un thème desktop n3 : mêmes hooks, autre CSS / classes dans themes.json.
 */

import {
    initFS,
    listEntries,
    createFolder,
    createTextFile,
    createShortcut,
    importFiles,
    renameEntry,
    moveEntry,
    copyEntry,
    deleteEntries,
    trashEntries,
    restoreEntry,
    emptyTrash,
    listCorbeille,
    readText,
    writeText,
    getEntry,
    putEntry,
    formatSize,
    fileCategory,
    typeLabel,
    extOf,
    parentPath,
    nameOfPath,
    displayPath,
    CORBEILLE,
    HOME,
} from "./fs.js?v=11";

const MODULES = "modules";
const DEFAULTS = {
    display: "folders", arrange: "grid", iconSize: "large",
    showIcons: true, showExt: false,
    deskExplorer: true, deskCorbeille: true, deskControlPanel: true, deskInfo: true,
    startExplorer: false, startCorbeille: false, startBureau: true, startApps: true, startDossiers: true, startSearch: true, startTheme: false, startPrefs: false,
    leftNewFolder: true, leftNewFile: true, leftImport: true, leftPaste: true,
    leftExplorer: true, leftCorbeille: true,
    leftDisplayFolders: false, leftDisplayAll: false,
    leftArrangeAuto: false, leftArrangeGrid: false, leftArrangeFree: false,
    leftSort: true, leftAlign: false, leftViewIcons: true,
    leftControlPanel: false, leftTaskMgr: false, leftRefresh: true,
    autoFullscreen: true,
};

function fileSvg() {
    return `<svg class="icon-gfx" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path fill="#fff" stroke="#0a0a0a" d="M5 3h15l7 7v19H5z"/>
        <path fill="#e8e8e8" d="M20 3l7 7h-7z"/>
        <path fill="#0a0a0a" d="M9 14h14v2H9z M9 18h14v2H9z M9 22h9v2H9z"/>
    </svg>`;
}
function imageFileSvg() {
    return `<svg class="icon-gfx" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path fill="#fff" stroke="#0a0a0a" d="M5 3h15l7 7v19H5z"/><path fill="#e8e8e8" d="M20 3l7 7h-7z"/>
        <rect x="9" y="12" width="14" height="10" fill="#8ec6ff" stroke="#0a0a0a"/><circle cx="13" cy="15" r="2" fill="#ffd24a" stroke="#0a0a0a"/><path fill="#2ecc71" stroke="#0a0a0a" d="M9 21l5-5 4 3 5-6v9H9z"/>
    </svg>`;
}
function audioFileSvg() {
    return `<svg class="icon-gfx" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path fill="#fff" stroke="#0a0a0a" d="M5 3h15l7 7v19H5z"/><path fill="#e8e8e8" d="M20 3l7 7h-7z"/>
        <path fill="none" stroke="#0a0a0a" stroke-width="2" d="M11 18q4-4 8 0"/><path fill="#000080" d="M13 17h3v7h-3z M18 14h3v10h-3z"/>
    </svg>`;
}
function videoFileSvg() {
    return `<svg class="icon-gfx" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path fill="#fff" stroke="#0a0a0a" d="M5 3h15l7 7v19H5z"/><path fill="#e8e8e8" d="M20 3l7 7h-7z"/>
        <rect x="9" y="14" width="14" height="9" rx="1" fill="#1a1a1a" stroke="#0a0a0a"/><path fill="#fff" d="M14 17l6 2.5-6 2.5z"/>
    </svg>`;
}

function folderSvg() {
    return `<svg class="icon-gfx" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path fill="#ffd24a" stroke="#c4a000" d="M3 8h10l2 3h14v16H3z"/>
        <path fill="#ffe680" d="M5 12h22v13H5z"/>
    </svg>`;
}

function systemFolderSvg() {
    return `<svg class="icon-gfx" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path fill="#c9c9c9" stroke="#8a8a8a" d="M3 8h10l2 3h14v16H3z"/>
        <path fill="#e0e0e0" d="M5 12h22v13H5z"/>
    </svg>`;
}

function shortcutBadge() {
    return `<g>
        <rect x="1" y="20" width="13" height="11" fill="#f0f0f0" stroke="#0a0a0a"/>
        <rect x="3" y="22" width="9" height="7" fill="#f0f0f0"/>
        <path fill="#0a0a0a" d="M8 24l4 4-4 4v-2.5H4v-3h4z"/>
    </g>`;
}

function shortcutFileSvg() {
    return `<svg class="icon-gfx" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path fill="#fff" stroke="#0a0a0a" d="M5 3h15l7 7v19H5z"/>
        <path fill="#e8e8e8" d="M20 3l7 7h-7z"/>
        <path fill="#0a0a0a" d="M9 14h14v2H9z M9 18h14v2H9z M9 22h9v2H9z"/>
        ${shortcutBadge()}
    </svg>`;
}
function shortcutImageSvg() {
    return `<svg class="icon-gfx" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path fill="#fff" stroke="#0a0a0a" d="M5 3h15l7 7v19H5z"/><path fill="#e8e8e8" d="M20 3l7 7h-7z"/>
        <rect x="9" y="12" width="14" height="10" fill="#8ec6ff" stroke="#0a0a0a"/><circle cx="13" cy="15" r="2" fill="#ffd24a" stroke="#0a0a0a"/><path fill="#2ecc71" stroke="#0a0a0a" d="M9 21l5-5 4 3 5-6v9H9z"/>${shortcutBadge()}
    </svg>`;
}
function shortcutAudioSvg() {
    return `<svg class="icon-gfx" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path fill="#fff" stroke="#0a0a0a" d="M5 3h15l7 7v19H5z"/><path fill="#e8e8e8" d="M20 3l7 7h-7z"/>
        <path fill="none" stroke="#0a0a0a" stroke-width="2" d="M11 18q4-4 8 0"/><path fill="#000080" d="M13 17h3v7h-3z M18 14h3v10h-3z"/>${shortcutBadge()}
    </svg>`;
}
function shortcutVideoSvg() {
    return `<svg class="icon-gfx" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path fill="#fff" stroke="#0a0a0a" d="M5 3h15l7 7v19H5z"/><path fill="#e8e8e8" d="M20 3l7 7h-7z"/>
        <rect x="9" y="14" width="14" height="9" rx="1" fill="#1a1a1a" stroke="#0a0a0a"/><path fill="#fff" d="M14 17l6 2.5-6 2.5z"/>${shortcutBadge()}
    </svg>`;
}

function shortcutFolderSvg() {
    return `<svg class="icon-gfx" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path fill="#ffd24a" stroke="#c4a000" d="M3 8h10l2 3h14v16H3z"/>
        <path fill="#ffe680" d="M5 12h22v13H5z"/>
        ${shortcutBadge()}
    </svg>`;
}

function programSvg() {
    return `<svg class="icon-gfx" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="4" y="3" width="24" height="26" fill="#c3c7cb" stroke="#0a0a0a"/>
        <rect x="6" y="5" width="20" height="12" fill="#000080"/>
        <rect x="8" y="20" width="6" height="5" fill="#000080"/>
        <rect x="16" y="20" width="8" height="2" fill="#0a0a0a"/>
        <rect x="16" y="23" width="8" height="2" fill="#0a0a0a"/>
    </svg>`;
}

function controlPrefSvg() {
    return `<svg class="icon-gfx" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="3" y="4" width="26" height="24" fill="#c3c7cb" stroke="#0a0a0a"/>
        <rect x="6" y="10" width="9" height="3" fill="#0a0a0a"/>
        <rect x="6" y="19" width="9" height="3" fill="#0a0a0a"/>
        <circle cx="18" cy="11.5" r="3" fill="#000080" stroke="#0a0a0a"/>
        <circle cx="22" cy="20.5" r="3" fill="#000080" stroke="#0a0a0a"/>
    </svg>`;
}

function controlCheckSvg() {
    return `<svg class="icon-gfx" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="3" y="3" width="26" height="26" fill="#c3c7cb" stroke="#0a0a0a"/>
        <rect x="7" y="7" width="18" height="18" fill="#fff" stroke="#0a0a0a"/>
        <path fill="none" stroke="#008000" stroke-width="4" d="M10 16l5 5 8-10"/>
    </svg>`;
}

function controlThemeSvg() {
    return `<svg class="icon-gfx" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="16" cy="17" r="12" fill="#e8e8e8" stroke="#0a0a0a"/>
        <circle cx="10" cy="11" r="2" fill="#ff0000"/>
        <circle cx="18" cy="9" r="2" fill="#00b000"/>
        <circle cx="23" cy="15" r="2" fill="#0000c0"/>
        <circle cx="9" cy="18" r="2" fill="#ffff00"/>
        <path fill="none" stroke="#0a0a0a" stroke-width="2" d="M15 26l6-6"/>
    </svg>`;
}

function trashSvg() {
    return trashEmptySvg();
}
function trashEmptySvg() {
    return `<svg class="icon-gfx" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path fill="#e8e8e8" stroke="#0a0a0a" d="M8 8l2-4h12l2 4z"/>
        <path fill="#e8e8e8" stroke="#0a0a0a" d="M6 8h20l-2 22H8z"/>
        <path fill="#0a0a0a" d="M14 13h2v11h-2z M18 13h2v11h-2z"/>
        <path fill="#fff" stroke="#0a0a0a" d="M12 4l1 4h6l1-4z"/>
    </svg>`;
}
function trashFullSvg() {
    return `<svg class="icon-gfx" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path fill="#e8e8e8" stroke="#0a0a0a" d="M8 8l2-4h12l2 4z"/>
        <path fill="#e8e8e8" stroke="#0a0a0a" d="M6 8h20l-2 22H8z"/>
        <path fill="#d0d0d0" stroke="#0a0a0a" d="M10 12h12l-1 6H11z"/><path fill="#fff" stroke="#0a0a0a" d="M12 14h8v2H12z"/>
        <path fill="#0a0a0a" d="M14 18h2v6h-2z M18 18h2v6h-2z"/>
    </svg>`;
}
function explorerDesktopSvg() {
    return `<svg class="icon-gfx" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path fill="#ffd24a" stroke="#c4a000" d="M3 8h10l2 3h14v16H3z"/><path fill="#ffe680" d="M5 12h22v13H5z"/>
        <circle cx="20" cy="20" r="6" fill="#fff" stroke="#0a0a0a" stroke-width="1.2"/><path fill="none" stroke="#0a0a0a" stroke-width="1.5" d="M24.2 24.2l4 4"/>
        <circle cx="20" cy="20" r="2" fill="#000080"/>
    </svg>`;
}
function controlPanelDesktopSvg() {
    return `<svg class="icon-gfx" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="4" y="4" width="24" height="24" rx="2" fill="#c3c7cb" stroke="#0a0a0a"/><rect x="7" y="7" width="18" height="3" fill="#000080"/>
        <g fill="#fff" stroke="#0a0a0a"><circle cx="11" cy="16" r="3"/><circle cx="21" cy="16" r="3"/><circle cx="16" cy="23" r="3"/></g>
        <path fill="#0a0a0a" d="M11 15h-1v2h1z M21 15h-1v2h1z M16 22h-1v2h1z"/>
    </svg>`;
}
function infoDesktopSvg() {
    return `<svg class="icon-gfx" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="4" y="3" width="24" height="26" rx="3" fill="#fff" stroke="#0a0a0a"/><rect x="6" y="5" width="20" height="7" rx="1" fill="#000080"/>
        <circle cx="16" cy="19" r="6" fill="#0080ff" stroke="#0a0a0a"/><rect x="15" y="15" width="2" height="7" fill="#fff" rx="1"/><rect x="15" y="13" width="2" height="2" fill="#fff"/>
    </svg>`;
}

export function mountDesktop(options) {
    const {
        root,
        modules: initialModules,
        catalog,
        theme,
        basePath,
        onSwitchTheme,
        themes,
        isHidden,
        setHidden,
    } = options;
    let modules = initialModules;
    const all = catalog || modules;

    const W = theme.window || {};
    const DISP_KEY = "cp.desktopDisplay";
    const ARR_KEY = "cp.desktopArrange";
    let display = localStorage.getItem(DISP_KEY);
    if (!["folders", "all"].includes(display)) display = DEFAULTS.display;
    let arrange = localStorage.getItem(ARR_KEY);
    if (!["auto", "grid", "free"].includes(arrange)) arrange = DEFAULTS.arrange;
    const legacyMode = localStorage.getItem("cp.desktopMode");
    if (legacyMode) {
        if (legacyMode === "folders") { display = "folders"; arrange = "auto"; }
        else if (legacyMode === "all") { display = "all"; arrange = "auto"; }
        else if (legacyMode === "free") { display = "all"; arrange = "free"; }
        localStorage.removeItem("cp.desktopMode");
        localStorage.setItem(DISP_KEY, display);
        localStorage.setItem(ARR_KEY, arrange);
    }
    let zTop = 20;
    let winSeq = 0;
    const windows = new Map();
    let startOpen = false;
    let taskmgrRender = null;

    const POS_KEY = "cp.freePositions";
    const WALL_KEY = "cp.wallpaper";
    const SIZE_KEY = "cp.iconSize";
    const VIEW_KEY = "cp.showIcons";
    let userEntries = [];
    const _v = (k,d)=>{ const v=localStorage.getItem(k); return v===null?d:v!=="0"; };
    const _v1 = (k,d)=>{ const v=localStorage.getItem(k); return v===null?d:v==="1"; };
    let showIcons = _v(VIEW_KEY, DEFAULTS.showIcons);
    let showExt = _v("cp.showExt", DEFAULTS.showExt);
    const DESK_ICON_EXPLORER_KEY = "cp.desktopIconExplorer";
    const DESK_ICON_CORBEILLE_KEY = "cp.desktopIconCorbeille";
    const DESK_ICON_CONTROLPANEL_KEY = "cp.desktopIconControlPanel";
    const DESK_ICON_INFO_KEY = "cp.desktopIconInfo";
    let deskIconExplorer = _v1(DESK_ICON_EXPLORER_KEY, DEFAULTS.deskExplorer);
    let deskIconCorbeille = _v(DESK_ICON_CORBEILLE_KEY, DEFAULTS.deskCorbeille);
    let deskIconControlPanel = _v1(DESK_ICON_CONTROLPANEL_KEY, DEFAULTS.deskControlPanel);
    let deskIconInfo = _v1(DESK_ICON_INFO_KEY, DEFAULTS.deskInfo);
    let trashHasItems = false;
    const START_EXPLORER_KEY = "cp.startExplorer";
    const START_CORBEILLE_KEY = "cp.startCorbeille";
    const START_BUREAU_KEY = "cp.startBureau";
    const START_APPS_KEY = "cp.startApps";
    const START_DOSSIERS_KEY = "cp.startDossiers";
    const START_SEARCH_KEY = "cp.startSearch";
    const START_THEME_KEY = "cp.startTheme";
    const START_PREFS_KEY = "cp.startPrefs";
    let startExplorer = _v1(START_EXPLORER_KEY, DEFAULTS.startExplorer);
    let startCorbeille = _v1(START_CORBEILLE_KEY, DEFAULTS.startCorbeille);
    let startBureau = _v(START_BUREAU_KEY, DEFAULTS.startBureau);
    let startApps = _v(START_APPS_KEY, DEFAULTS.startApps);
    let startDossiers = _v(START_DOSSIERS_KEY, DEFAULTS.startDossiers);
    let startSearch = _v(START_SEARCH_KEY, DEFAULTS.startSearch);
    let startTheme = _v(START_THEME_KEY, DEFAULTS.startTheme);
    let startPrefs = _v(START_PREFS_KEY, DEFAULTS.startPrefs);
    // --- Clic gauche bureau (menu quand rien n'est sélectionné) ---
    const LEFT_NEWFOLDER_KEY = "cp.leftNewFolder";
    const LEFT_NEWFILE_KEY = "cp.leftNewFile";
    const LEFT_IMPORT_KEY = "cp.leftImport";
    const LEFT_PASTE_KEY = "cp.leftPaste";
    const LEFT_EXPLORER_KEY = "cp.leftExplorer";
    const LEFT_CORBEILLE_KEY = "cp.leftCorbeille";
    const LEFT_DISPLAYFOLDERS_KEY = "cp.leftDisplayFolders";
    const LEFT_DISPLAYALL_KEY = "cp.leftDisplayAll";
    const LEFT_ARRANGEAUTO_KEY = "cp.leftArrangeAuto";
    const LEFT_ARRANGEGRID_KEY = "cp.leftArrangeGrid";
    const LEFT_ARRANGEFREE_KEY = "cp.leftArrangeFree";
    const LEFT_SORT_KEY = "cp.leftSort";
    const LEFT_ALIGN_KEY = "cp.leftAlign";
    const LEFT_VIEWICONS_KEY = "cp.leftViewIcons";
    const LEFT_CONTROLPANEL_KEY = "cp.leftControlPanel";
    const LEFT_TASKMGR_KEY = "cp.leftTaskMgr";
    const LEFT_REFRESH_KEY = "cp.leftRefresh";
    let leftNewFolder = _v(LEFT_NEWFOLDER_KEY, DEFAULTS.leftNewFolder);
    let leftNewFile = _v(LEFT_NEWFILE_KEY, DEFAULTS.leftNewFile);
    let leftImport = _v(LEFT_IMPORT_KEY, DEFAULTS.leftImport);
    let leftPaste = _v(LEFT_PASTE_KEY, DEFAULTS.leftPaste);
    let leftExplorer = _v(LEFT_EXPLORER_KEY, DEFAULTS.leftExplorer);
    let leftCorbeille = _v(LEFT_CORBEILLE_KEY, DEFAULTS.leftCorbeille);
    let leftDisplayFolders = _v(LEFT_DISPLAYFOLDERS_KEY, DEFAULTS.leftDisplayFolders);
    let leftDisplayAll = _v(LEFT_DISPLAYALL_KEY, DEFAULTS.leftDisplayAll);
    let leftArrangeAuto = _v(LEFT_ARRANGEAUTO_KEY, DEFAULTS.leftArrangeAuto);
    let leftArrangeGrid = _v(LEFT_ARRANGEGRID_KEY, DEFAULTS.leftArrangeGrid);
    let leftArrangeFree = _v(LEFT_ARRANGEFREE_KEY, DEFAULTS.leftArrangeFree);
    let leftSort = _v(LEFT_SORT_KEY, DEFAULTS.leftSort);
    let leftAlign = _v(LEFT_ALIGN_KEY, DEFAULTS.leftAlign);
    let leftViewIcons = _v(LEFT_VIEWICONS_KEY, DEFAULTS.leftViewIcons);
    let leftControlPanel = _v(LEFT_CONTROLPANEL_KEY, DEFAULTS.leftControlPanel);
    let leftTaskMgr = _v(LEFT_TASKMGR_KEY, DEFAULTS.leftTaskMgr);
    let leftRefresh = _v(LEFT_REFRESH_KEY, DEFAULTS.leftRefresh);
    if (localStorage.getItem("cp.startExtra") === "1") {
        startExplorer = true;
        startCorbeille = true;
        localStorage.removeItem("cp.startExtra");
    }
    let sortMode = "name";
    let fsOk = false;
    let fileInput = null;
    let clipboard = null;
    let htmlDragPaths = [];

    const MODE_LABELS = {
        "display-folders": "Bureau : dossiers",
        "display-all": "Bureau : toutes les icônes",
        "arrange-auto": "Alignement automatique",
        "arrange-grid": "Grille",
        "arrange-free": "Libre",
    };

    root.hidden = false;
    root.innerHTML = "";
    root.style.setProperty(
        "--desktop-wallpaper",
        localStorage.getItem(WALL_KEY) || theme.wallpaper || "#008080"
    );
    applyIconSize(localStorage.getItem(SIZE_KEY) || DEFAULTS.iconSize);

    const surface = el("div", "desktop-surface");
    const iconsEl = el("div", "desktop-icons");
    const taskbar = el("div", "taskbar");
    const startBtn = document.createElement("button");
    startBtn.className = "taskbar-start";
    startBtn.textContent = theme.startLabel || "Démarrer";
    const tasksEl = el("div", "taskbar-windows");
    const tray = el("div", "taskbar-tray");
    const fsBtn = document.createElement("button");
    fsBtn.type = "button"; fsBtn.textContent = "⛶"; fsBtn.title = "Plein écran (F11)";
    fsBtn.style.marginRight = "4px"; fsBtn.style.padding = "0 6px";
    fsBtn.addEventListener("click", toggleFullscreen);
    const clock = document.createElement("span");
    clock.className = "taskbar-clock";
    clock.style.cursor = "pointer";
    clock.addEventListener("click", () => openClockWindow());
    clock.addEventListener("dblclick", () => openControlPanel());
    clock.addEventListener("contextmenu", (e) => { e.preventDefault(); openControlPanel(); });
    tray.append(fsBtn, clock);
    taskbar.append(startBtn, tasksEl, tray);

    const startMenu = el("div", "start-menu window");
    startMenu.hidden = true;
    startMenu.innerHTML = `
        <div class="start-menu-banner">Calculateur Plus!</div>
        <div class="start-menu-items">
            <div class="start-search-box">
                <input class="start-search" type="search" placeholder="Rechercher...">
                <div class="start-search-results"></div>
            </div>
            <hr class="start-sep" id="sep-0">
            <div class="start-dossiers">
                <div class="start-label">Dossiers</div>
                <div class="start-tags"></div>
            </div>
            <hr class="start-sep" id="sep-1">
            <div class="start-bureau">
                <div class="start-label">Bureau</div>
                <button type="button" data-act="display-folders" class="start-item">
                    <span class="start-item-icon">${folderSvg()}</span><span class="start-item-text"></span>
                </button>
                <button type="button" data-act="display-all" class="start-item">
                    <span class="start-item-icon">${programSvg()}</span><span class="start-item-text"></span>
                </button>
                <button type="button" data-act="arrange-auto" class="start-item">
                    <span class="start-item-icon">${programSvg()}</span><span class="start-item-text"></span>
                </button>
                <button type="button" data-act="arrange-grid" class="start-item">
                    <span class="start-item-icon">${programSvg()}</span><span class="start-item-text"></span>
                </button>
                <button type="button" data-act="arrange-free" class="start-item">
                    <span class="start-item-icon">${programSvg()}</span><span class="start-item-text"></span>
                </button>
            </div>
            <button type="button" data-act="explorer" class="start-item">
                <span class="start-item-icon">${explorerDesktopSvg()}</span><span class="start-item-text">Explorateur</span>
            </button>
            <button type="button" data-act="corbeille" class="start-item">
                <span class="start-item-icon">${trashSvg()}</span><span class="start-item-text">Corbeille</span>
            </button>
            <hr class="start-sep" id="sep-2">
            <div class="start-themes-section">
                <div class="start-label">Thèmes</div>
                <div class="start-themes"></div>
            </div>
            <hr class="start-sep" id="sep-3">
            <div class="start-apps">
                <button type="button" data-act="controlpanel" class="start-item">
                    <span class="start-item-icon">${programSvg()}</span><span class="start-item-text">Panneau de configuration</span>
                </button>
                <button type="button" data-act="taskmgr" class="start-item">
                    <span class="start-item-icon">${programSvg()}</span><span class="start-item-text">Gestionnaire des tâches</span>
                </button>
                <button type="button" data-act="info" class="start-item">
                    <span class="start-item-icon">${programSvg()}</span><span class="start-item-text">Plus d'info</span>
                </button>
            </div>
            <hr class="start-sep" id="sep-4">
            <div class="start-prefs-wrap">
                <div class="start-label">Menu Démarré</div>
                <div class="start-prefs"></div>
            </div>
        </div>`;

    function applyStartPrefs() {
        startMenu.querySelector(".start-search-box").hidden = !startSearch;
        startMenu.querySelector(".start-dossiers").hidden = !startDossiers;
        startMenu.querySelector(".start-bureau").hidden = !startBureau;
        startMenu.querySelector('[data-act="explorer"]').hidden = !startExplorer;
        startMenu.querySelector('[data-act="corbeille"]').hidden = !startCorbeille;
        startMenu.querySelector(".start-themes-section").hidden = !startTheme;
        startMenu.querySelector(".start-apps").hidden = !startApps;
        startMenu.querySelector(".start-prefs-wrap").hidden = !startPrefs;
        startMenu.querySelector("#sep-0").hidden = !(startSearch || startDossiers);
        startMenu.querySelector("#sep-1").hidden = !(startDossiers || startBureau || startExplorer || startCorbeille);
        startMenu.querySelector("#sep-2").hidden = !(startBureau || startExplorer || startCorbeille || startTheme);
        startMenu.querySelector("#sep-3").hidden = !(startTheme || startApps);
        startMenu.querySelector("#sep-4").hidden = !(startApps || startPrefs);
        buildStartPrefs();
    }
    function setStartExplorer(v) {
        startExplorer = v;
        localStorage.setItem(START_EXPLORER_KEY, v ? "1" : "0");
        applyStartPrefs();
    }
    function setStartCorbeille(v) {
        startCorbeille = v;
        localStorage.setItem(START_CORBEILLE_KEY, v ? "1" : "0");
        applyStartPrefs();
    }
    function setStartBureau(v) {
        startBureau = v;
        localStorage.setItem(START_BUREAU_KEY, v ? "1" : "0");
        applyStartPrefs();
    }
    function setStartApps(v) {
        startApps = v;
        localStorage.setItem(START_APPS_KEY, v ? "1" : "0");
        applyStartPrefs();
    }
    function setStartDossiers(v) {
        startDossiers = v;
        localStorage.setItem(START_DOSSIERS_KEY, v ? "1" : "0");
        applyStartPrefs();
    }
    function setStartSearch(v) {
        startSearch = v;
        localStorage.setItem(START_SEARCH_KEY, v ? "1" : "0");
        applyStartPrefs();
    }
    function setStartTheme(v) {
        startTheme = v;
        localStorage.setItem(START_THEME_KEY, v ? "1" : "0");
        applyStartPrefs();
    }
    function setStartPrefs(v) {
        startPrefs = v;
        localStorage.setItem(START_PREFS_KEY, v ? "1" : "0");
        applyStartPrefs();
    }
    function setLeftPref(key, setter) {
        return (v) => {
            setter(v);
            localStorage.setItem(key, v ? "1" : "0");
            buildLeftMenu();
            buildCtx();
        };
    }
    const setLeftNewFolder = setLeftPref(LEFT_NEWFOLDER_KEY, (v) => leftNewFolder = v);
    const setLeftNewFile = setLeftPref(LEFT_NEWFILE_KEY, (v) => leftNewFile = v);
    const setLeftImport = setLeftPref(LEFT_IMPORT_KEY, (v) => leftImport = v);
    const setLeftPaste = setLeftPref(LEFT_PASTE_KEY, (v) => leftPaste = v);
    const setLeftExplorer = setLeftPref(LEFT_EXPLORER_KEY, (v) => leftExplorer = v);
    const setLeftCorbeille = setLeftPref(LEFT_CORBEILLE_KEY, (v) => leftCorbeille = v);
    const setLeftDisplayFolders = setLeftPref(LEFT_DISPLAYFOLDERS_KEY, (v) => leftDisplayFolders = v);
    const setLeftDisplayAll = setLeftPref(LEFT_DISPLAYALL_KEY, (v) => leftDisplayAll = v);
    const setLeftArrangeAuto = setLeftPref(LEFT_ARRANGEAUTO_KEY, (v) => leftArrangeAuto = v);
    const setLeftArrangeGrid = setLeftPref(LEFT_ARRANGEGRID_KEY, (v) => leftArrangeGrid = v);
    const setLeftArrangeFree = setLeftPref(LEFT_ARRANGEFREE_KEY, (v) => leftArrangeFree = v);
    const setLeftSort = setLeftPref(LEFT_SORT_KEY, (v) => leftSort = v);
    const setLeftAlign = setLeftPref(LEFT_ALIGN_KEY, (v) => leftAlign = v);
    const setLeftViewIcons = setLeftPref(LEFT_VIEWICONS_KEY, (v) => leftViewIcons = v);
    const setLeftControlPanel = setLeftPref(LEFT_CONTROLPANEL_KEY, (v) => leftControlPanel = v);
    const setLeftTaskMgr = setLeftPref(LEFT_TASKMGR_KEY, (v) => leftTaskMgr = v);
    const setLeftRefresh = setLeftPref(LEFT_REFRESH_KEY, (v) => leftRefresh = v);
    function setShowIcons(v) {
        showIcons = v;
        localStorage.setItem(VIEW_KEY, v ? "1" : "0");
        renderDesktop();
        updateCtxViewLabel();
        buildLeftMenu();
    }
    function setDeskIconExplorer(v) { deskIconExplorer = v; localStorage.setItem(DESK_ICON_EXPLORER_KEY, v ? "1" : "0"); renderDesktop(); }
    function setDeskIconCorbeille(v) { deskIconCorbeille = v; localStorage.setItem(DESK_ICON_CORBEILLE_KEY, v ? "1" : "0"); renderDesktop(); }
    function setDeskIconControlPanel(v) { deskIconControlPanel = v; localStorage.setItem(DESK_ICON_CONTROLPANEL_KEY, v ? "1" : "0"); renderDesktop(); }
    function setDeskIconInfo(v) { deskIconInfo = v; localStorage.setItem(DESK_ICON_INFO_KEY, v ? "1" : "0"); renderDesktop(); }
    function makePrefToggle(label, get, set) {
        const row = document.createElement("label");
        row.className = "control-row";
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = !!get();
        const name = el("span", "control-name");
        name.textContent = label;
        const state = el("span", "control-state");
        state.className = "control-state " + (cb.checked ? "on" : "off");
        state.textContent = cb.checked ? "activé" : "désactivé";
        cb.addEventListener("change", () => {
            set(cb.checked);
            state.className = "control-state " + (cb.checked ? "on" : "off");
            state.textContent = cb.checked ? "activé" : "désactivé";
        });
        row.append(cb, name, state);
        return row;
    }
    function buildStartPrefs() {
        const box = startMenu.querySelector(".start-prefs");
        if (!box) return;
        box.innerHTML = "";
        box.appendChild(makePrefToggle("Dossiers dans le menu Démarré", () => startDossiers, (v) => setStartDossiers(v)));
        box.appendChild(makePrefToggle("Barre de recherche dans le menu Démarré", () => startSearch, (v) => setStartSearch(v)));
        box.appendChild(makePrefToggle("Explorateur dans le menu Démarré", () => startExplorer, (v) => setStartExplorer(v)));
        box.appendChild(makePrefToggle("Corbeille dans le menu Démarré", () => startCorbeille, (v) => setStartCorbeille(v)));
        box.appendChild(makePrefToggle("Préférences du Bureau dans le menu Démarré", () => startBureau, (v) => setStartBureau(v)));
        box.appendChild(makePrefToggle("Thème dans le menu Démarré", () => startTheme, (v) => setStartTheme(v)));
        box.appendChild(makePrefToggle("Applications dans le menu Démarré", () => startApps, (v) => setStartApps(v)));
        box.appendChild(makePrefToggle("Préférence dans le menu Démarré", () => startPrefs, (v) => setStartPrefs(v)));
    }
    applyStartPrefs();

    const ctx = el("div", "desktop-ctx window");
    ctx.hidden = true;
    const leftMenu = el("div", "desktop-ctx window desktop-left-menu");
    leftMenu.hidden = true;
    function buildLeftMenu() {
        leftMenu.innerHTML = "";
        const addBtn = (act, label, hidden) => {
            if (hidden) return;
            const b = document.createElement("button");
            b.type = "button";
            b.dataset.act = act;
            b.textContent = label;
            leftMenu.appendChild(b);
        };
        const hasNewGroup = leftNewFolder || leftNewFile || leftImport || leftPaste;
        const hasNavGroup = leftExplorer || leftCorbeille;
        const hasDisplayGroup = leftDisplayFolders || leftDisplayAll;
        const hasArrangeGroup = leftArrangeAuto || leftArrangeGrid || leftArrangeFree || leftSort || leftAlign || leftViewIcons;
        const hasSystemGroup = leftControlPanel || leftTaskMgr || leftRefresh;
        if (hasNewGroup) {
            addBtn("newfolder", "Nouveau dossier", !leftNewFolder);
            addBtn("newfile", "Nouveau fichier texte", !leftNewFile);
            addBtn("import", "Importer des fichiers...", !leftImport);
            addBtn("paste", "Coller", !leftPaste);
        }
        if (hasNewGroup && (hasNavGroup || hasDisplayGroup || hasArrangeGroup || hasSystemGroup)) {
            const hr = document.createElement("hr");
            hr.className = "start-sep";
            leftMenu.appendChild(hr);
        }
        if (hasNavGroup) {
            addBtn("explorer", "Explorateur", !leftExplorer);
            addBtn("corbeille", "Corbeille", !leftCorbeille);
        }
        if (hasNavGroup && (hasDisplayGroup || hasArrangeGroup || hasSystemGroup)) {
            const hr = document.createElement("hr");
            hr.className = "start-sep";
            leftMenu.appendChild(hr);
        }
        if (hasDisplayGroup) {
            if (leftDisplayFolders) addBtn("display-folders", (display === "folders" ? "✓ " : "") + MODE_LABELS["display-folders"], false);
            if (leftDisplayAll) addBtn("display-all", (display === "all" ? "✓ " : "") + MODE_LABELS["display-all"], false);
        }
        if (hasDisplayGroup && (hasArrangeGroup || hasSystemGroup)) {
            const hr = document.createElement("hr");
            hr.className = "start-sep";
            leftMenu.appendChild(hr);
        }
        if (hasArrangeGroup) {
            addBtn("arrange-auto", (arrange === "auto" ? "✓ " : "") + MODE_LABELS["arrange-auto"], !leftArrangeAuto);
            addBtn("arrange-grid", (arrange === "grid" ? "✓ " : "") + MODE_LABELS["arrange-grid"], !leftArrangeGrid);
            addBtn("arrange-free", (arrange === "free" ? "✓ " : "") + MODE_LABELS["arrange-free"], !leftArrangeFree);
            addBtn("sort", "Trier par ▸", !leftSort);
            addBtn("align", "Aligner les icônes", !leftAlign);
            if (leftViewIcons) {
                const vBtn = document.createElement("button");
                vBtn.type = "button";
                vBtn.dataset.act = "viewicons";
                vBtn.textContent = (showIcons ? "✓ " : "") + "Afficher les icônes du bureau";
                leftMenu.appendChild(vBtn);
            }
        }
        if (hasArrangeGroup && hasSystemGroup) {
            const hr = document.createElement("hr");
            hr.className = "start-sep";
            leftMenu.appendChild(hr);
        }
        if (hasSystemGroup) {
            addBtn("controlpanel", "Panneau de configuration", !leftControlPanel);
            addBtn("taskmgr", "Gestionnaire des tâches", !leftTaskMgr);
            addBtn("refresh", "Actualiser", !leftRefresh);
        }
        const pasteBtn = leftMenu.querySelector('[data-act="paste"]');
        if (pasteBtn) pasteBtn.disabled = !clipboard || !clipboard.items.length;
    }

    function buildCtx() {
        ctx.innerHTML = "";
        const add = (act, label, hidden) => {
            if (hidden) return;
            const b = document.createElement("button");
            b.type = "button";
            b.dataset.act = act;
            b.textContent = label;
            ctx.appendChild(b);
        };
        const hasNew = leftNewFolder || leftNewFile || leftImport || leftPaste;
        const hasNav = leftExplorer || leftCorbeille;
        const hasDisplay = leftDisplayFolders || leftDisplayAll;
        const hasArrange = leftArrangeAuto || leftArrangeGrid || leftArrangeFree || leftSort || leftAlign || leftViewIcons;
        const hasSystem = leftControlPanel || leftTaskMgr || leftRefresh;
        if (hasNew) {
            add("newfolder", "Nouveau dossier", !leftNewFolder);
            add("newfile", "Nouveau fichier texte", !leftNewFile);
            add("import", "Importer des fichiers...", !leftImport);
            add("paste", "Coller", !leftPaste);
        }
        if (hasNew && (hasNav || hasDisplay || hasArrange || hasSystem)) {
            const hr = document.createElement("hr"); hr.className = "start-sep"; ctx.appendChild(hr);
        }
        if (hasNav) {
            add("explorer", "Explorateur", !leftExplorer);
            add("corbeille", "Corbeille", !leftCorbeille);
        }
        if (hasNav && (hasDisplay || hasArrange || hasSystem)) {
            const hr = document.createElement("hr"); hr.className = "start-sep"; ctx.appendChild(hr);
        }
        if (hasDisplay) {
            if (leftDisplayFolders) add("display-folders", (display === "folders" ? "✓ " : "") + MODE_LABELS["display-folders"], false);
            if (leftDisplayAll) add("display-all", (display === "all" ? "✓ " : "") + MODE_LABELS["display-all"], false);
        }
        if (hasDisplay && (hasArrange || hasSystem)) {
            const hr = document.createElement("hr"); hr.className = "start-sep"; ctx.appendChild(hr);
        }
        if (hasArrange) {
            add("arrange-auto", (arrange === "auto" ? "✓ " : "") + MODE_LABELS["arrange-auto"], !leftArrangeAuto);
            add("arrange-grid", (arrange === "grid" ? "✓ " : "") + MODE_LABELS["arrange-grid"], !leftArrangeGrid);
            add("arrange-free", (arrange === "free" ? "✓ " : "") + MODE_LABELS["arrange-free"], !leftArrangeFree);
            add("sort", "Trier par ▸", !leftSort);
            add("align", "Aligner les icônes", !leftAlign);
            if (leftViewIcons) {
                const b = document.createElement("button"); b.type = "button"; b.dataset.act = "viewicons";
                b.textContent = (showIcons ? "✓ " : "") + "Afficher les icônes du bureau";
                ctx.appendChild(b);
            }
        }
        if (hasArrange && hasSystem) {
            const hr = document.createElement("hr"); hr.className = "start-sep"; ctx.appendChild(hr);
        }
        if (hasSystem) {
            add("controlpanel", "Panneau de configuration", !leftControlPanel);
            add("taskmgr", "Gestionnaire des tâches", !leftTaskMgr);
            add("refresh", "Actualiser", !leftRefresh);
        }
        updateCtxViewLabel();
    }

    function updateCtxViewLabel() {
        buildLeftMenu();
        const v1 = ctx.querySelector('[data-act="viewicons"]');
        if (v1) v1.textContent = (showIcons ? "✓ " : "") + "Afficher les icônes du bureau";
        const v2 = leftMenu.querySelector('[data-act="viewicons"]');
        if (v2) v2.textContent = (showIcons ? "✓ " : "") + "Afficher les icônes du bureau";
        const paste = ctx.querySelector('[data-act="paste"]');
        if (paste) paste.disabled = !clipboard || !clipboard.items.length;
        const paste2 = leftMenu.querySelector('[data-act="paste"]');
        if (paste2) paste2.disabled = !clipboard || !clipboard.items.length;
        syncModeMarks();
    }

    function syncModeMarks() {
        const active = {
            "display-folders": display === "folders",
            "display-all": display === "all",
            "arrange-auto": arrange === "auto",
            "arrange-grid": arrange === "grid",
            "arrange-free": arrange === "free",
        };
        for (const [act, label] of Object.entries(MODE_LABELS)) {
            const text = (active[act] ? "✓ " : "") + label;
            const c = ctx.querySelector(`[data-act="${act}"]`);
            if (c) c.textContent = text;
            const l = leftMenu && leftMenu.querySelector(`[data-act="${act}"]`);
            if (l) l.textContent = text;
            const s = startMenu.querySelector(`[data-act="${act}"] .start-item-text`);
            if (s) s.textContent = text;
        }
    }
    buildLeftMenu();
    buildCtx();

    surface.append(iconsEl, startMenu, ctx, leftMenu);
    root.append(surface, taskbar);
    // --- Clic gauche sur le bureau vide : menu contextuel gauche ---
    leftMenu.addEventListener("click", (e) => {
        e.stopPropagation();
        const act = e.target.closest("[data-act]")?.dataset.act;
        if (!act) return;
        handleDesktopAction(act);
        leftMenu.hidden = true;
    });
    function handleDesktopAction(act) {
        if (act === "display-folders") setDisplay("folders");
        if (act === "display-all") setDisplay("all");
        if (act === "arrange-auto") setArrange("auto");
        if (act === "arrange-grid") setArrange("grid");
        if (act === "arrange-free") setArrange("free");
        if (act === "newfolder") createNewItem("folder", HOME);
        if (act === "newfile") createNewItem("file", HOME);
        if (act === "import") pickFiles(HOME, () => refreshUserEntries());
        if (act === "paste") pasteTo(HOME);
        if (act === "explorer") openExplorer("");
        if (act === "corbeille") openCorbeille();
        if (act === "sort") {
            leftMenu.innerHTML = `
                <button type="button" data-act="sort-name">Trier par nom</button>
                <button type="button" data-act="sort-type">Trier par type</button>
                <button type="button" data-act="sort-back">← Retour</button>
            `;
            leftMenu.hidden = false;
            return;
        }
        if (act === "sort-name") { sortMode = "name"; renderDesktop(); }
        if (act === "sort-type") { sortMode = "type"; renderDesktop(); }
        if (act === "sort-back") buildLeftMenu();
        if (act === "align") alignIcons();
        if (act === "viewicons") setShowIcons(!showIcons);
        if (act === "controlpanel") openControlPanel();
        if (act === "taskmgr") openTaskManager();
        if (act === "refresh") renderDesktop();
        if (act !== "sort" && act !== "sort-back") leftMenu.hidden = true;
        ctx.hidden = true;
    }
    function allSelectedEmpty() {
        for (const [, s] of selectedByContainer) if (s.size) return false;
        return true;
    }
    let tags = [...new Set(modules.flatMap((m) => m.tags || []))].sort((a, b) =>
        a.localeCompare(b, "fr")
    );

    const tagsBox = startMenu.querySelector(".start-tags");
    function buildStartTags() {
        tagsBox.innerHTML = "";
        const mod = document.createElement("button");
        mod.type = "button";
        mod.classList.add("start-item");
        mod.innerHTML = `<span class="start-item-icon">${systemFolderSvg()}</span><span class="start-item-text"></span>`;
        mod.querySelector(".start-item-text").textContent = "Modules";
        mod.addEventListener("click", () => {
            closeStart();
            openFolder(MODULES);
        });
        tagsBox.appendChild(mod);
        for (const tag of tags) {
            const b = document.createElement("button");
            b.type = "button";
            b.classList.add("start-item");
            b.innerHTML = `<span class="start-item-icon">${systemFolderSvg()}</span><span class="start-item-text"></span>`;
            b.querySelector(".start-item-text").textContent = tag;
            b.addEventListener("click", () => {
                closeStart();
                openFolder(tag);
            });
            tagsBox.appendChild(b);
        }
    }
    buildStartTags();

    const themesBox = startMenu.querySelector(".start-themes");
    for (const t of themes) {
        const b = document.createElement("button");
        b.type = "button";
        b.classList.add("start-item");
        b.innerHTML = `<span class="start-item-icon">${programSvg()}</span><span class="start-item-text"></span>`;
        b.querySelector(".start-item-text").textContent = t.name;
        if (t.id === theme.id) b.disabled = true;
        b.addEventListener("click", () => {
            closeStart();
            onSwitchTheme(t.id);
        });
        themesBox.appendChild(b);
    }

    function el(tag, className) {
        const n = document.createElement(tag);
        n.className = className;
        return n;
    }

    function visibleByTag(tag) {
        return modules.filter((m) => (m.tags || []).includes(tag));
    }

    function makeIcon({ kind, id, label, onOpen, entry, system }) {
        const node = el("div", "desktop-icon");
        node.dataset.kind = kind;
        node.dataset.id = id;
        if (entry) node.__entry = entry;
        if (system) node.classList.add("system");
        const isShortcut = !!(entry && entry.kind === "shortcut");
        let svg;
        if (id === "__explorer") svg = explorerDesktopSvg();
        else if (id === "__controlpanel") svg = controlPanelDesktopSvg();
        else if (id === "__info") svg = infoDesktopSvg();
        else if (isShortcut) {
            if (kind === "ufolder") svg = shortcutFolderSvg();
            else {
                const tName = entry.target ? nameOfPath(entry.target) : entry.name;
                const cat = fileCategory({ name: tName, mime: entry.mime });
                if (cat === "image") svg = shortcutImageSvg();
                else if (cat === "audio") svg = shortcutAudioSvg();
                else if (cat === "video") svg = shortcutVideoSvg();
                else svg = shortcutFileSvg();
            }
        } else if (kind === "ufile") {
            const cat = entry ? fileCategory(entry) : "other";
            if (cat === "image") svg = imageFileSvg();
            else if (cat === "audio") svg = audioFileSvg();
            else if (cat === "video") svg = videoFileSvg();
            else svg = fileSvg();
        } else svg = system ? systemFolderSvg() :
            kind === "trash" ? (trashHasItems ? trashFullSvg() : trashEmptySvg()) :
            kind === "folder" || kind === "ufolder" ? folderSvg() : programSvg();
        node.innerHTML = `${svg}<span class="icon-label"></span>`;
        node.querySelector(".icon-label").textContent = label;
        if (entry && clipboard && clipboard.mode === "cut" && clipboard.items.includes(id)) {
            node.classList.add("cut");
        }
        node.addEventListener("click", (e) => {
            e.stopPropagation();
            selectIcon(node, e);
        });
        node.addEventListener("dblclick", (e) => {
            e.stopPropagation();
            onOpen(e);
        });
        node.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            e.stopPropagation();
            const c = node.parentElement;
            const s = iconsOf(c);
            if (!s.has(node)) {
                clearSelection();
                const s2 = iconsOf(c);
                s2.add(node);
                node.classList.add("selected");
                selAnchor = node;
            }
            showIconMenu(node, e.clientX, e.clientY);
        });
        return node;
    }

    const selectedByContainer = new Map();
    let selAnchor = null;
    let dragSuppressClick = false;

    function iconsOf(c) {
        if (!selectedByContainer.has(c)) selectedByContainer.set(c, new Set());
        return selectedByContainer.get(c);
    }

    function clearSelection() {
        for (const [, s] of selectedByContainer) {
            for (const n of s) n.classList.remove("selected");
            s.clear();
        }
        selectedByContainer.clear();
        selAnchor = null;
    }

    function selectIcon(node, e) {
        const c = node.parentElement;
        if (!e || !(e.ctrlKey || e.shiftKey)) {
            const s = iconsOf(c);
            if (s.has(node)) return;
            clearSelection();
            const s2 = iconsOf(c);
            s2.add(node);
            node.classList.add("selected");
            selAnchor = node;
            return;
        }
        const s = iconsOf(c);
        if (e.ctrlKey) {
            if (s.has(node)) {
                s.delete(node);
                node.classList.remove("selected");
            } else {
                s.add(node);
                node.classList.add("selected");
            }
            selAnchor = node;
            return;
        }
        if (selAnchor && selAnchor.parentElement === c) {
            const icons = [...c.querySelectorAll(".desktop-icon")];
            const from = icons.indexOf(selAnchor);
            const to = icons.indexOf(node);
            if (from !== -1 && to !== -1) {
                clearSelection();
                const range = iconsOf(c);
                const [a, b] = from < to ? [from, to] : [to, from];
                for (let i = a; i <= b; i++) {
                    range.add(icons[i]);
                    icons[i].classList.add("selected");
                }
                selAnchor = node;
            }
            return;
        }
        s.add(node);
        node.classList.add("selected");
        selAnchor = node;
    }

    function enableRubberBand(container, iconSel) {
        container.addEventListener("mousedown", (e) => {
            if (e.button !== 0) return;
            if (e.target.closest(".desktop-icon")) return;
            if (container === surface && e.target.closest(".wm-window")) return;
            if (e.target.closest(".start-menu")) return;
            if (e.target.closest(".desktop-ctx")) return;
            if (e.target.closest(".explorer-toolbar")) return;
            e.preventDefault();
            const cRect = container.getBoundingClientRect();
            const sx = e.clientX - cRect.left;
            const sy = e.clientY - cRect.top;
            const box = el("div", "selection-box");
            box.style.left = `${sx}px`;
            box.style.top = `${sy}px`;
            container.appendChild(box);
            let dragged = false;
            const move = (ev) => {
                const x = Math.min(ev.clientX - cRect.left, sx);
                const y = Math.min(ev.clientY - cRect.top, sy);
                const w = Math.abs(ev.clientX - cRect.left - sx);
                const h = Math.abs(ev.clientY - cRect.top - sy);
                box.style.left = `${x}px`;
                box.style.top = `${y}px`;
                box.style.width = `${w}px`;
                box.style.height = `${h}px`;
                if (w > 3 || h > 3) dragged = true;
            };
            const up = (ev) => {
                document.removeEventListener("mousemove", move);
                document.removeEventListener("mouseup", up);
                const boxRect = box.getBoundingClientRect();
                box.remove();
                dragSuppressClick = true;
                setTimeout(() => {
                    dragSuppressClick = false;
                }, 0);
                if (!(ev.ctrlKey || ev.shiftKey)) clearSelection();
                if (!dragged) return;
                const query = container === surface ? iconsEl : container;
                const s = iconsOf(query);
                for (const icon of query.querySelectorAll(iconSel)) {
                    const r = icon.getBoundingClientRect();
                    if (r.left < boxRect.right && r.right > boxRect.left && r.top < boxRect.bottom && r.bottom > boxRect.top) {
                        s.add(icon);
                        icon.classList.add("selected");
                    }
                }
                selAnchor = null;
            };
            document.addEventListener("mousemove", move);
            document.addEventListener("mouseup", up);
        });
    }

    function iconKey(node) {
        const kind = node.dataset.kind;
        if (kind === "program") return "mod:" + node.dataset.id;
        if (kind === "folder") return "tag:" + node.dataset.id;
        return node.dataset.id;
    }

    function snapGrid(p) {
        const CELL_W = 82;
        const CELL_H = 88;
        return {
            x: Math.max(8, Math.round((p.x - 8) / CELL_W) * CELL_W + 8),
            y: Math.max(8, Math.round((p.y - 8) / CELL_H) * CELL_H + 8),
        };
    }

    function renderDesktop() {
        iconsEl.innerHTML = "";
        clearSelection();
        iconsEl.hidden = !showIcons;
        const items = [];
        if (display === "folders") {
            for (const tag of tags) {
                items.push({
                    kind: "folder",
                    id: tag,
                    label: tag,
                    system: true,
                    onOpen: () => openFolder(tag),
                });
            }
        } else {
            for (const m of sortModules(modules)) {
                items.push({
                    kind: "program",
                    id: m.id,
                    label: m.name,
                    onOpen: (e) => openModule(m.id, e && e.shiftKey),
                });
            }
        }
        for (const e of userEntries) {
            items.push({
                kind: userIconKind(e),
                id: e.path,
                label: displayName(e),
                entry: e,
                onOpen: () => openEntryPath(e),
            });
        }
        if (deskIconExplorer) items.push({ kind: "folder", id: "__explorer", label: "Explorateur", system: true, onOpen: () => openExplorer("") });
        if (deskIconControlPanel) items.push({ kind: "program", id: "__controlpanel", label: "Panneau de configuration", system: true, onOpen: () => openControlPanel() });
        if (deskIconInfo) items.push({ kind: "program", id: "__info", label: "Plus d'info", system: true, onOpen: () => openModule("info") });
        if (deskIconCorbeille) items.push({
            kind: "trash",
            id: "corbeille",
            label: "Corbeille",
            onOpen: () => openCorbeille(),
        });
        if (arrange === "auto") {
            iconsEl.classList.remove("free");
            for (const it of items) iconsEl.appendChild(makeIcon(it));
            return;
        }
        iconsEl.classList.add("free");
        const positions = loadPositions();
        const CELL_W = 82;
        const CELL_H = 88;
        const cols = Math.max(1, Math.floor(iconsEl.clientWidth / CELL_W));
        if (arrange === "grid") {
            // Grille stricte : une case par icône, jamais de superposition
            const taken = new Set();
            for (const it of items) {
                const key = iconKey({ dataset: { kind: it.kind, id: it.id } });
                const saved = positions[key];
                if (saved) {
                    const sp = snapGrid(saved);
                    let cellKey = `${sp.x},${sp.y}`;
                    if (!taken.has(cellKey)) { taken.add(cellKey); positions[key] = sp; }
                    else delete positions[key];
                }
            }
            let c = 0, r = 0;
            for (const it of items) {
                const key = iconKey({ dataset: { kind: it.kind, id: it.id } });
                if (positions[key]) continue;
                while (taken.has(`${8 + c * CELL_W},${8 + r * CELL_H}`)) {
                    c++; if (c >= cols) { c = 0; r++; }
                }
                const p = { x: 8 + c * CELL_W, y: 8 + r * CELL_H };
                taken.add(`${p.x},${p.y}`);
                positions[key] = p;
                c++; if (c >= cols) { c = 0; r++; }
            }
        } else {
            // Libre : purge des clés orphelines (fichiers supprimés/déplacés)
            const validKeys = new Set(items.map((it) => iconKey({ dataset: { kind: it.kind, id: it.id } })));
            for (const k of Object.keys(positions)) {
                if (!validKeys.has(k)) delete positions[k];
            }
        }
        let auto = 0;
        for (const it of items) {
            const node = makeIcon(it);
            const key = iconKey(node);
            let p = positions[key];
            if (!p) {
                p = { x: 8 + (auto % cols) * CELL_W, y: 8 + Math.floor(auto / cols) * CELL_H };
                positions[key] = p;
                auto++;
            }
            node.style.left = `${Math.max(0, p.x)}px`;
            node.style.top = `${Math.max(0, p.y)}px`;
            iconsEl.appendChild(node);
        }
        savePositionsMap(positions);
    }

    function sortModules(list) {
        const copy = [...list];
        if (sortMode === "type") {
            copy.sort((a, b) => {
                const ta = (a.tags || [])[0] || "";
                const tb = (b.tags || [])[0] || "";
                return ta.localeCompare(tb, "fr") || a.name.localeCompare(b.name, "fr");
            });
        } else {
            copy.sort((a, b) => a.name.localeCompare(b.name, "fr"));
        }
        return copy;
    }

    function loadPositions() {
        try {
            return JSON.parse(localStorage.getItem(POS_KEY)) || {};
        } catch {
            return {};
        }
    }

    function savePositionsMap(map) {
        try {
            localStorage.setItem(POS_KEY, JSON.stringify(map));
        } catch {}
    }

    function setDisplay(next) {
        display = next;
        localStorage.setItem(DISP_KEY, next);
        renderDesktop();
        syncModeMarks();
        buildLeftMenu();
        closeStart();
        ctx.hidden = true;
        leftMenu.hidden = true;
    }

    function setArrange(next) {
        arrange = next;
        localStorage.setItem(ARR_KEY, next);
        renderDesktop();
        syncModeMarks();
        buildLeftMenu();
        closeStart();
        ctx.hidden = true;
        leftMenu.hidden = true;
    }

    function refreshModules() {
        modules = options.getModules ? options.getModules() : initialModules;
        tags = [...new Set(modules.flatMap((m) => m.tags || []))].sort((a, b) =>
            a.localeCompare(b, "fr")
        );
        buildStartTags();
        renderDesktop();
    }

    function applyIconSize(size) {
        const sizes = {
            small: { "--icon-size": "60px", "--icon-gfx": "24px", "--icon-label": "10px" },
            med: { "--icon-size": "74px", "--icon-gfx": "32px", "--icon-label": "11px" },
            large: { "--icon-size": "98px", "--icon-gfx": "42px", "--icon-label": "13px" },
            xlarge: { "--icon-size": "120px", "--icon-gfx": "52px", "--icon-label": "14px" },
        };
        const vars = sizes[size] || sizes[DEFAULTS.iconSize];
        for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
    }

    function setIconSize(size) {
        applyIconSize(size);
        localStorage.setItem(SIZE_KEY, size);
        renderDesktop();
    }

    function setWallpaper(color) {
        root.style.setProperty("--desktop-wallpaper", color);
        localStorage.setItem(WALL_KEY, color);
    }

    function displayName(entry) {
        if (entry && !showExt && (entry.kind === "file" || entry.kind === "shortcut")) {
            const ext = extOf(entry.name);
            if (ext && entry.name.length > ext.length) return entry.name.slice(0, -ext.length);
        }
        return entry ? entry.name : "";
    }

    function userIconKind(e) {
        if (e.kind === "shortcut") return e.targetKind === "folder" ? "ufolder" : "ufile";
        return e.kind === "folder" ? "ufolder" : "ufile";
    }

    async function openEntryPath(entry) {
        const target = entry.kind === "shortcut" ? await getEntry(entry.target) : entry;
        if (!target) {
            showPlaceholder(entry.name, "La cible de ce raccourci est introuvable.");
            return;
        }
        if (target.kind === "folder") openExplorer(target.path);
        else openFile(target.path);
    }

    function setShowExt(v) {
        showExt = v;
        localStorage.setItem("cp.showExt", v ? "1" : "0");
        renderDesktop();
        refreshFileWindows();
    }

    function alignIcons() {
        const pos = {};
        const CELL_W = 82;
        const CELL_H = 88;
        const cols = Math.max(1, Math.floor(iconsEl.clientWidth / CELL_W));
        let i = 0;
        for (const node of iconsEl.querySelectorAll(".desktop-icon")) {
            const key = iconKey(node);
            pos[key] = { x: 8 + (i % cols) * CELL_W, y: 8 + Math.floor(i / cols) * CELL_H };
            i++;
        }
        savePositionsMap(pos);
        renderDesktop();
        ctx.hidden = true;
    }

    function refreshUserEntries() {
        if (!fsOk) return Promise.resolve();
        return listEntries(HOME).then((list) => {
            userEntries = list;
            renderDesktop();
            refreshFileWindows();
            refreshTrashState();
        });
    }

    function pickFiles(parent, after) {
        if (!fsOk) return;
        if (!fileInput) {
            fileInput = document.createElement("input");
            fileInput.type = "file";
            fileInput.multiple = true;
            fileInput.style.display = "none";
            document.body.appendChild(fileInput);
            fileInput.addEventListener("change", async () => {
                const files = [...fileInput.files];
                fileInput.value = "";
                if (!files.length) return;
                await importFiles(parent, files);
                refreshUserEntries();
                after?.();
            });
        }
        fileInput.click();
    }

    function beginRename(node, onCommit, onCancel, opts) {
        const label = node.querySelector(".icon-label");
        const input = document.createElement("input");
        input.className = "icon-rename";
        input.value = label.textContent;
        label.replaceWith(input);
        input.focus();
        input.select();
        let done = false;
        const finish = (commit) => {
            if (done) return;
            done = true;
            if (!commit) {
                onCancel();
                return;
            }
            let v = input.value.trim();
            if (opts && opts.ext && !extOf(v)) v += opts.ext;
            onCommit(v || label.textContent);
        };
        input.addEventListener("keydown", (e) => {
            e.stopPropagation();
            if (e.key === "Enter") finish(true);
            else if (e.key === "Escape") finish(false);
        });
        input.addEventListener("blur", () => finish(true));
        input.addEventListener("mousedown", (e) => e.stopPropagation());
    }

    async function createNewItem(kind, parent, container) {
        if (!fsOk) return;
        parent = parent || "";
        container = container || iconsEl;
        const name = kind === "folder" ? "Nouveau dossier" : "Nouveau fichier texte.txt";
        const entry = await (kind === "folder" ? createFolder : createTextFile)(parent, name);
        await refreshUserEntries();
        const sel = `.desktop-icon[data-kind="${kind === "folder" ? "ufolder" : "ufile"}"][data-id="${CSS.escape(entry.path)}"]`;
        const node = container.querySelector(sel);
        if (!node) return;
        node.classList.add("selected");
        const done = () => {
            refreshFileWindows();
            updateCtxViewLabel();
        };
        beginRename(node, (newName) => {
            renameEntry(entry.path, newName).then(refreshUserEntries).then(done);
        }, () => {
            deleteEntries([entry.path]).then(refreshUserEntries).then(done);
        }, kind === "file" ? { ext: ".txt" } : undefined);
    }

    function renameNode(node) {
        const kind = node.dataset.kind;
        const id = node.dataset.id;
        const entryName = node.__entry ? node.__entry.name : node.querySelector(".icon-label").textContent;
        beginRename(node, (newName) => {
            renameEntry(id, newName).then(refreshUserEntries).then(refreshFileWindows).then(updateCtxViewLabel);
        }, () => {
            refreshUserEntries();
            refreshFileWindows();
        }, kind === "ufile" ? { ext: extOf(entryName) } : undefined);
    }

    function clearDropTarget() {
        iconsEl.querySelectorAll(".drop-target").forEach((n) => n.classList.remove("drop-target"));
    }

    function isDropFolder(node) {
        return !!node && node.dataset.kind === "ufolder" && !(node.__entry && node.__entry.kind === "shortcut");
    }

    function enableIconDrag(container) {
        container.addEventListener("mousedown", (e) => {
            if (e.button !== 0) return;
            const icon = e.target.closest(".desktop-icon");
            if (!icon) return;
            if (icon.closest(".explorer-icons")) return;
            if (arrange === "auto" && icon.dataset.kind === "program") return;
            e.preventDefault();
            const origX = icon.offsetLeft;
            const origY = icon.offsetTop;
            const startX = e.clientX;
            const startY = e.clientY;
            let dragged = false;
            const move = (ev) => {
                const dx = ev.clientX - startX;
                const dy = ev.clientY - startY;
                if (!dragged && Math.hypot(dx, dy) > 4) {
                    dragged = true;
                    icon.classList.add("dragging");
                }
                if (!dragged) return;
                if (arrange !== "auto") {
                    icon.style.left = `${Math.max(0, origX + dx)}px`;
                    icon.style.top = `${Math.max(0, origY + dy)}px`;
                } else {
                    icon.style.transform = `translate(${dx}px, ${dy}px)`;
                }
                clearDropTarget();
                const t = document.elementFromPoint(ev.clientX, ev.clientY)?.closest('.desktop-icon[data-kind="ufolder"]');
                if (t && t !== icon && isDropFolder(t)) t.classList.add("drop-target");
            };
            const up = async (ev) => {
                document.removeEventListener("mousemove", move);
                document.removeEventListener("mouseup", up);
                if (!dragged) return;
                icon.classList.remove("dragging");
                icon.style.transform = "";
                clearDropTarget();
                const dropOn = document.elementFromPoint(ev.clientX, ev.clientY);
                const into = dropOn?.closest('.desktop-icon[data-kind="ufolder"]');
                const ontoTrash = dropOn?.closest('.desktop-icon[data-id="corbeille"]');
                if (into && into !== icon && icon.dataset.kind !== "program" && isDropFolder(into)) {
                    await moveMany([icon.dataset.id], into.dataset.id);
                } else if (ontoTrash && ontoTrash !== icon && icon.dataset.kind !== "program") {
                    trashSelected([icon.dataset.id]);
                } else {
                    const grid = dropOn?.closest(".explorer-icons");
                    if (grid && grid.dataset.dir !== undefined && icon.dataset.kind !== "program") {
                        await moveMany([icon.dataset.id], grid.dataset.dir || "");
                        refreshFileWindows();
                    } else if (arrange !== "auto") {
                        const pos = loadPositions();
                        const key = iconKey(icon);
                        let p = { x: icon.offsetLeft, y: icon.offsetTop };
                        if (arrange === "grid") {
                            const snapped = snapGrid(p);
                            const occupied = new Set(Object.entries(pos).filter(([k])=>k!==key).map(([,v])=>`${v.x},${v.y}`));
                            if (occupied.has(`${snapped.x},${snapped.y}`)) {
                                icon.style.left = `${origX}px`;
                                icon.style.top = `${origY}px`;
                            } else {
                                p = snapped;
                                pos[key] = p;
                                icon.style.left = `${p.x}px`;
                                icon.style.top = `${p.y}px`;
                                savePositionsMap(pos);
                            }
                        } else {
                            pos[key] = p;
                            savePositionsMap(pos);
                        }
                    }
                }
                dragSuppressClick = true;
                setTimeout(() => (dragSuppressClick = false), 0);
            };
            document.addEventListener("mousemove", move);
            document.addEventListener("mouseup", up);
        });
    }

    function openControlPanel() {
        const winId = "control";
        const existed = windows.has(winId);
        const rec = createWindow({
            id: winId,
            title: "Panneau de configuration",
            kind: "control",
            width: 520,
            height: 470,
        });
        if (existed) return;
        rec.body.innerHTML = "";
        rec.body.classList.add("control-body");

        const nav = el("div", "control-nav");
        const backBtn = document.createElement("button");
        backBtn.type = "button";
        backBtn.textContent = "← Retour";
        nav.appendChild(backBtn);

        const content = el("div", "control-content");
        rec.body.append(nav, content);

        const views = {};
        function go(view) {
            for (const key in views) views[key].hidden = key !== view;
            backBtn.hidden = view === "root";
        }

        const root = el("div", "control-root");
        const items = [
            ["prefs", "Préférence", "Taille des icônes, extensions de fichiers", controlPrefSvg()],
            ["modules", "Truc actif", "Activer ou masquer les modules", controlCheckSvg()],
            ["theme", "Thème", "Apparence du bureau, couleur du fond", controlThemeSvg()],
        ];
        for (const [key, name, desc, svg] of items) {
            const item = el("button", "control-item");
            item.type = "button";
            item.innerHTML =
                `<span class="control-item-icon">${svg}</span>` +
                `<span class="control-item-text">` +
                `<span class="control-item-name"></span><span class="control-item-desc"></span></span>`;
            item.querySelector(".control-item-name").textContent = name;
            item.querySelector(".control-item-desc").textContent = desc;
            item.addEventListener("click", () => go(key));
            root.appendChild(item);
        }
        views.root = root;

        const prefs = el("div", "control-tabpanel");
        buildPrefsSection(prefs);
        views.prefs = prefs;

        const modulesPanel = el("div", "control-tabpanel");
        buildModulesSection(modulesPanel);
        views.modules = modulesPanel;

        const themePanel = el("div", "control-tabpanel");
        buildThemeSection(themePanel);
        views.theme = themePanel;

        content.append(root, prefs, modulesPanel, themePanel);
        backBtn.addEventListener("click", () => go("root"));
        go("root");
    }

    function buildPrefsSection(container) {
        // Groupe Système
        const sysGroup = el("div", "control-group");
        const sysTitle = el("div", "control-group-title");
        sysTitle.textContent = "Système";
        sysGroup.appendChild(sysTitle);

        const rowSize = el("div", "control-row");
        const sizeLabel = el("span", "control-name");
        sizeLabel.textContent = "Taille des icônes";
        rowSize.appendChild(sizeLabel);
        const sizes = [
            ["small", "Petite"],
            ["med", "Moyenne"],
            ["large", "Grande"],
            ["xlarge", "Très grande"],
        ];
        const cur = localStorage.getItem(SIZE_KEY) || DEFAULTS.iconSize;
        for (const [val, text] of sizes) {
            const b = document.createElement("button");
            b.type = "button";
            b.textContent = text;
            b.disabled = cur === val;
            b.addEventListener("click", () => {
                setIconSize(val);
                sysGroup.querySelectorAll("button").forEach((x) => (x.disabled = false));
                b.disabled = true;
            });
            rowSize.appendChild(b);
        }
        sysGroup.appendChild(rowSize);
        sysGroup.appendChild(makePrefToggle("Extensions de fichiers", () => showExt, (v) => setShowExt(v)));
        container.appendChild(sysGroup);

        // Groupe Menu Démarré
        const menuGroup = el("div", "control-group");
        const menuTitle = el("div", "control-group-title");
        menuTitle.textContent = "Menu Démarré";
        menuGroup.appendChild(menuTitle);

        const startToggles = [
            ["Dossiers dans le menu Démarré", () => startDossiers, (v) => setStartDossiers(v)],
            ["Barre de recherche dans le menu Démarré", () => startSearch, (v) => setStartSearch(v)],
            ["Explorateur dans le menu Démarré", () => startExplorer, (v) => setStartExplorer(v)],
            ["Corbeille dans le menu Démarré", () => startCorbeille, (v) => setStartCorbeille(v)],
            ["Préférences du Bureau dans le menu Démarré", () => startBureau, (v) => setStartBureau(v)],
            ["Thème dans le menu Démarré", () => startTheme, (v) => setStartTheme(v)],
            ["Applications dans le menu Démarré", () => startApps, (v) => setStartApps(v)],
            ["Préférence dans le menu Démarré", () => startPrefs, (v) => setStartPrefs(v)],
        ];
        for (const [label, get, set] of startToggles) {
            menuGroup.appendChild(makePrefToggle(label, get, set));
        }
        container.appendChild(menuGroup);

        // Groupe Bureau - préférences du bureau accessibles depuis le panneau
        const bureauGroup = el("div", "control-group");
        const bureauTitle = el("div", "control-group-title");
        bureauTitle.textContent = "Bureau";
        bureauGroup.appendChild(bureauTitle);
        bureauGroup.appendChild(makePrefToggle("Afficher les icônes du bureau", () => showIcons, (v) => setShowIcons(v)));
        bureauGroup.appendChild(makePrefToggle("Corbeille sur le bureau", () => deskIconCorbeille, (v) => setDeskIconCorbeille(v)));
        bureauGroup.appendChild(makePrefToggle("Explorateur sur le bureau", () => deskIconExplorer, (v) => setDeskIconExplorer(v)));
        bureauGroup.appendChild(makePrefToggle("Panneau de configuration sur le bureau", () => deskIconControlPanel, (v) => setDeskIconControlPanel(v)));
        bureauGroup.appendChild(makePrefToggle("Plus d'info sur le bureau", () => deskIconInfo, (v) => setDeskIconInfo(v)));
        const rowDisplay = el("div", "control-row");
        const dispLabel = el("span", "control-name");
        dispLabel.textContent = "Affichage";
        rowDisplay.appendChild(dispLabel);
        for (const [val, text] of [["folders", "Dossiers"], ["all", "Toutes les icônes"]]) {
            const b = document.createElement("button");
            b.type = "button";
            b.textContent = text;
            b.disabled = display === val;
            b.addEventListener("click", () => {
                setDisplay(val);
                bureauGroup.querySelectorAll("button").forEach((x) => {
                    if (x.textContent === "Dossiers" || x.textContent === "Toutes les icônes") x.disabled = false;
                });
                b.disabled = true;
                buildLeftMenu();
            });
            rowDisplay.appendChild(b);
        }
        bureauGroup.appendChild(rowDisplay);
        const rowArrange = el("div", "control-row");
        const arrLabel = el("span", "control-name");
        arrLabel.textContent = "Alignement";
        rowArrange.appendChild(arrLabel);
        for (const [val, text] of [["auto", "Automatique"], ["grid", "Grille"], ["free", "Libre"]]) {
            const b = document.createElement("button");
            b.type = "button";
            b.textContent = text;
            b.disabled = arrange === val;
            b.addEventListener("click", () => {
                setArrange(val);
                bureauGroup.querySelectorAll("button").forEach((x) => {
                    if (["Automatique", "Grille", "Libre"].includes(x.textContent)) x.disabled = false;
                });
                b.disabled = true;
                buildLeftMenu();
            });
            rowArrange.appendChild(b);
        }
        bureauGroup.appendChild(rowArrange);
        const rowBureauActions = el("div", "control-row");
        const alignBtn = document.createElement("button");
        alignBtn.type = "button";
        alignBtn.textContent = "Aligner les icônes";
        alignBtn.addEventListener("click", () => alignIcons());
        rowBureauActions.appendChild(alignBtn);
        const refreshBtn = document.createElement("button");
        refreshBtn.type = "button";
        refreshBtn.textContent = "Actualiser";
        refreshBtn.addEventListener("click", () => renderDesktop());
        rowBureauActions.appendChild(refreshBtn);
        bureauGroup.appendChild(rowBureauActions);
        container.appendChild(bureauGroup);
        // Groupe Clic gauche (bureau vide)
        const leftGroup = el("div", "control-group");
        const leftTitle = el("div", "control-group-title");
        leftTitle.textContent = "Clic gauche (bureau vide)";
        leftGroup.appendChild(leftTitle);
        const leftToggles = [
            ["Nouveau dossier", () => leftNewFolder, setLeftNewFolder],
            ["Nouveau fichier texte", () => leftNewFile, setLeftNewFile],
            ["Importer des fichiers...", () => leftImport, setLeftImport],
            ["Coller", () => leftPaste, setLeftPaste],
            ["Explorateur", () => leftExplorer, setLeftExplorer],
            ["Corbeille", () => leftCorbeille, setLeftCorbeille],
            ["Bureau : dossiers", () => leftDisplayFolders, setLeftDisplayFolders],
            ["Bureau : toutes les icônes", () => leftDisplayAll, setLeftDisplayAll],
            ["Alignement automatique", () => leftArrangeAuto, setLeftArrangeAuto],
            ["Grille", () => leftArrangeGrid, setLeftArrangeGrid],
            ["Libre", () => leftArrangeFree, setLeftArrangeFree],
            ["Trier par", () => leftSort, setLeftSort],
            ["Aligner les icônes", () => leftAlign, setLeftAlign],
            ["Afficher les icônes du bureau", () => leftViewIcons, setLeftViewIcons],
            ["Panneau de configuration", () => leftControlPanel, setLeftControlPanel],
            ["Gestionnaire des tâches", () => leftTaskMgr, setLeftTaskMgr],
            ["Actualiser", () => leftRefresh, setLeftRefresh],
        ];
        for (const [label, get, set] of leftToggles) {
            leftGroup.appendChild(makePrefToggle(label, get, set));
        }
        container.appendChild(leftGroup);
        const baseGroup = el("div", "control-group");
        const baseTitle = el("div", "control-group-title");
        baseTitle.textContent = "Préférences de base";
        baseGroup.appendChild(baseTitle);
        const baseDesc = el("div", "control-name");
        baseDesc.style.padding = "2px 4px"; baseDesc.style.fontSize = "11px"; baseDesc.style.whiteSpace = "normal";
        baseDesc.textContent = "Choisir le profil par défaut. Ça réinitialise toutes les préférences (icônes, taille, bureau, menu, clic gauche).";
        baseGroup.appendChild(baseDesc);
        const baseRow = el("div", "control-row");
        const btnDefault = document.createElement("button"); btnDefault.type = "button"; btnDefault.textContent = "Par défaut (recommandé)";
        const btnMinimal = document.createElement("button"); btnMinimal.type = "button"; btnMinimal.textContent = "Minimal";
        const btnFull = document.createElement("button"); btnFull.type = "button"; btnFull.textContent = "Tout afficher";
        const btnReset = document.createElement("button"); btnReset.type = "button"; btnReset.textContent = "Réinitialiser";
        const applyBase = (preset) => {
            const defaults = { ...DEFAULTS };
            if (preset === "minimal") {
                defaults.startDossiers=false; defaults.startSearch=false; defaults.startBureau=false; defaults.startTheme=false; defaults.startApps=false; defaults.startPrefs=false; defaults.deskCorbeille=false;
                Object.keys(defaults).forEach(k=>{ if(k.startsWith("left")) defaults[k]=false; });
            }
            if (preset === "full") {
                defaults.deskExplorer=true; defaults.deskControlPanel=true; defaults.deskInfo=true; defaults.startExplorer=true; defaults.startCorbeille=true;
                Object.keys(defaults).forEach(k=>{ if(k.startsWith("left")) defaults[k]=true; });
            }
            if (preset === "reset") {
                Object.keys(localStorage).forEach(k=>{ if(k.startsWith("cp.")) localStorage.removeItem(k); });
                location.reload(); return;
            }
            localStorage.setItem(VIEW_KEY, defaults.showIcons?"1":"0"); localStorage.setItem(SIZE_KEY, defaults.iconSize); localStorage.setItem("cp.showExt", defaults.showExt?"1":"0");
            localStorage.setItem(DESK_ICON_EXPLORER_KEY, defaults.deskExplorer?"1":"0"); localStorage.setItem(DESK_ICON_CORBEILLE_KEY, defaults.deskCorbeille?"1":"0"); localStorage.setItem(DESK_ICON_CONTROLPANEL_KEY, defaults.deskControlPanel?"1":"0"); localStorage.setItem(DESK_ICON_INFO_KEY, defaults.deskInfo?"1":"0");
            localStorage.setItem(DISP_KEY, defaults.display); localStorage.setItem(ARR_KEY, defaults.arrange);
            localStorage.setItem(START_DOSSIERS_KEY, defaults.startDossiers?"1":"0"); localStorage.setItem(START_SEARCH_KEY, defaults.startSearch?"1":"0"); localStorage.setItem(START_BUREAU_KEY, defaults.startBureau?"1":"0"); localStorage.setItem(START_EXPLORER_KEY, defaults.startExplorer?"1":"0"); localStorage.setItem(START_CORBEILLE_KEY, defaults.startCorbeille?"1":"0"); localStorage.setItem(START_THEME_KEY, defaults.startTheme?"1":"0"); localStorage.setItem(START_APPS_KEY, defaults.startApps?"1":"0"); localStorage.setItem(START_PREFS_KEY, defaults.startPrefs?"1":"0");
            localStorage.setItem(LEFT_NEWFOLDER_KEY, defaults.leftNewFolder?"1":"0"); localStorage.setItem(LEFT_NEWFILE_KEY, defaults.leftNewFile?"1":"0"); localStorage.setItem(LEFT_IMPORT_KEY, defaults.leftImport?"1":"0"); localStorage.setItem(LEFT_PASTE_KEY, defaults.leftPaste?"1":"0");
            localStorage.setItem(LEFT_EXPLORER_KEY, defaults.leftExplorer?"1":"0"); localStorage.setItem(LEFT_CORBEILLE_KEY, defaults.leftCorbeille?"1":"0");
            localStorage.setItem(LEFT_DISPLAYFOLDERS_KEY, defaults.leftDisplayFolders?"1":"0"); localStorage.setItem(LEFT_DISPLAYALL_KEY, defaults.leftDisplayAll?"1":"0");
            localStorage.setItem(LEFT_ARRANGEAUTO_KEY, defaults.leftArrangeAuto?"1":"0"); localStorage.setItem(LEFT_ARRANGEGRID_KEY, defaults.leftArrangeGrid?"1":"0"); localStorage.setItem(LEFT_ARRANGEFREE_KEY, defaults.leftArrangeFree?"1":"0");
            localStorage.setItem(LEFT_SORT_KEY, defaults.leftSort?"1":"0"); localStorage.setItem(LEFT_ALIGN_KEY, defaults.leftAlign?"1":"0"); localStorage.setItem(LEFT_VIEWICONS_KEY, defaults.leftViewIcons?"1":"0");
            localStorage.setItem(LEFT_CONTROLPANEL_KEY, defaults.leftControlPanel?"1":"0"); localStorage.setItem(LEFT_TASKMGR_KEY, defaults.leftTaskMgr?"1":"0"); localStorage.setItem(LEFT_REFRESH_KEY, defaults.leftRefresh?"1":"0");
            location.reload();
        };
        btnDefault.addEventListener("click", ()=>applyBase("default"));
        btnMinimal.addEventListener("click", ()=>applyBase("minimal"));
        btnFull.addEventListener("click", ()=>applyBase("full"));
        btnReset.addEventListener("click", ()=>applyBase("reset"));
        baseRow.append(btnDefault, btnMinimal, btnFull, btnReset);
        baseGroup.appendChild(baseRow);
        const fsRow = el("div", "control-row");
        fsRow.appendChild(makePrefToggle("Plein écran auto au démarrage", () => localStorage.getItem("cp.autoFullscreen") !== "0", (v) => localStorage.setItem("cp.autoFullscreen", v?"1":"0")));
        const fsNow = document.createElement("button"); fsNow.type="button"; fsNow.textContent="Passer en plein écran (F11)"; fsNow.addEventListener("click", toggleFullscreen);
        fsRow.appendChild(fsNow);
        baseGroup.appendChild(fsRow);
        container.appendChild(baseGroup);
    }

    function buildModulesSection(container) {
        const toolbar = el("div", "control-toolbar");
        const onBtn = document.createElement("button");
        onBtn.type = "button";
        onBtn.textContent = "Tout activer";
        const offBtn = document.createElement("button");
        offBtn.type = "button";
        offBtn.textContent = "Tout désactiver";
        toolbar.append(onBtn, offBtn);
        const list = el("div", "control-list");
        const applyAll = (hidden) => {
            for (const m of all) {
                if (m.visibility !== "off") setHidden?.(m.id, hidden);
            }
            buildControlList(list);
            refreshModules();
        };
        onBtn.addEventListener("click", () => applyAll(false));
        offBtn.addEventListener("click", () => applyAll(true));
        container.append(toolbar, list);
        buildControlList(list);
    }

    function buildThemeSection(container) {
        const rowTheme = el("div", "control-row");
        const themeLabel = el("span", "control-name");
        themeLabel.textContent = "Thème";
        for (const t of themes) {
            const b = document.createElement("button");
            b.type = "button";
            b.textContent = t.name;
            b.disabled = t.id === theme.id;
            b.addEventListener("click", () => onSwitchTheme(t.id));
            rowTheme.appendChild(b);
        }
        container.appendChild(rowTheme);

        const rowWall = el("div", "control-row");
        const wallLabel = el("span", "control-name");
        wallLabel.textContent = "Couleur du fond";
        const color = document.createElement("input");
        color.type = "color";
        color.value = localStorage.getItem(WALL_KEY) || theme.wallpaper || "#008080";
        color.addEventListener("input", () => setWallpaper(color.value));
        const defBtn = document.createElement("button");
        defBtn.type = "button";
        defBtn.textContent = "Par défaut";
        defBtn.addEventListener("click", () => {
            const w = theme.wallpaper || "#008080";
            color.value = w;
            setWallpaper(w);
        });
        rowWall.append(wallLabel, color, defBtn);
        container.appendChild(rowWall);
    }

    function buildControlList(container) {
        container.innerHTML = "";
        for (const m of all) {
            const isOff = m.visibility === "off";
            const hidden = isHidden ? isHidden(m) : isOff;
            const row = el("label", "control-row");
            const cb = document.createElement("input");
            cb.type = "checkbox";
            cb.checked = !hidden;
            cb.disabled = isOff;
            const name = el("span", "control-name");
            name.textContent = m.name;
            const tagsEl = el("small", "control-tags");
            tagsEl.textContent = (m.tags || []).map((t) => `#${t}`).join(" ");
            const state = el("span", "control-state");
            state.className = "control-state " + (isOff || hidden ? "off" : "on");
            state.textContent = isOff ? "désactivé" : hidden ? "masqué" : "activé";
            row.append(cb, name, tagsEl, state);
            cb.addEventListener("change", () => {
                setHidden?.(m.id, !cb.checked);
                state.className = "control-state " + (isOff || !cb.checked ? "off" : "on");
                state.textContent = isOff ? "désactivé" : cb.checked ? "activé" : "masqué";
                refreshModules();
            });
            container.appendChild(row);
        }
    }

    function closeStart() {
        startOpen = false;
        startMenu.hidden = true;
    }

    function toggleStart() {
        startOpen = !startOpen;
        startMenu.hidden = !startOpen;
        ctx.hidden = true;
        if (startOpen) startMenu.querySelector(".start-search").focus();
    }

    async function refreshTrashState() {
        try {
            const list = await listCorbeille();
            const has = list.length > 0;
            if (has !== trashHasItems) {
                trashHasItems = has;
                const node = iconsEl.querySelector('.desktop-icon[data-id="corbeille"]');
                if (node) {
                    const old = node.querySelector('.icon-gfx');
                    if (old) {
                        const tmp = document.createElement('div');
                        tmp.innerHTML = trashHasItems ? trashFullSvg() : trashEmptySvg();
                        old.replaceWith(tmp.firstElementChild);
                    }
                }
                const startIcon = startMenu.querySelector('[data-act="corbeille"] .start-item-icon');
                if (startIcon) startIcon.innerHTML = trashHasItems ? trashFullSvg() : trashEmptySvg();
            } else trashHasItems = has;
        } catch {}
    }
    async function toggleFullscreen() {
        try {
            if (document.fullscreenElement) await document.exitFullscreen();
            else await (root.requestFullscreen?.({ navigationUI: "hide" }) || document.documentElement.requestFullscreen?.({ navigationUI: "hide" }));
        } catch {}
    }
    function tickClock() {
        const d = new Date();
        clock.textContent = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
        clock.title = d.toLocaleString("fr-FR", { weekday:"long", year:"numeric", month:"long", day:"numeric", hour:"2-digit", minute:"2-digit", second:"2-digit" });
    }
    function openClockWindow() {
        const winId = "clock";
        if (windows.has(winId)) { focusWindow(winId); return; }
        const rec = createWindow({ id: winId, title: "Horloge", kind: "clock", width: 320, height: 240 });
        const renderClock = () => {
            const d = new Date();
            const t = rec.body.querySelector('.clock-time');
            const da = rec.body.querySelector('.clock-date');
            if (t) t.textContent = d.toLocaleTimeString("fr-FR");
            if (da) da.textContent = d.toLocaleDateString("fr-FR", { weekday:"long", year:"numeric", month:"long", day:"numeric" });
        };
        const d = new Date();
        rec.body.innerHTML = `<div style="padding:12px;text-align:center"><div class="clock-time" style="font-size:28px">${d.toLocaleTimeString("fr-FR")}</div><div class="clock-date">${d.toLocaleDateString("fr-FR", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}</div><button type="button" data-act="clock-refresh" style="margin-top:12px">Actualiser</button></div>`;
        rec.body.querySelector('[data-act="clock-refresh"]').addEventListener("click", renderClock);
    }

    function focusWindow(id) {
        const rec = windows.get(id);
        if (!rec) return;
        rec.el.classList.remove("minimized");
        rec.el.querySelector(`.${W.titleBar}`)?.classList.remove(W.inactiveTitle || "inactive");
        rec.el.style.zIndex = String(++zTop);
        for (const [otherId, other] of windows) {
            if (otherId !== id) {
                other.el.querySelector(`.${W.titleBar}`)?.classList.add(W.inactiveTitle || "inactive");
            }
        }
        tasksEl.querySelectorAll(".task-btn").forEach((b) => {
            b.classList.toggle("active-task", b.dataset.win === id);
        });
    }

    function createWindow({ id, title, kind, width, height }) {
        if (windows.has(id)) {
            focusWindow(id);
            return windows.get(id);
        }

        winSeq += 1;
        const left = 24 + ((winSeq * 22) % 140);
        const top = 24 + ((winSeq * 22) % 100);

        const win = el("div", `${W.className || "window"} wm-window`);
        win.dataset.win = id;
        win.style.left = `${left}px`;
        win.style.top = `${top}px`;
        win.style.width = `${width || 520}px`;
        win.style.height = `${height || 420}px`;
        win.style.zIndex = String(++zTop);

        win.innerHTML = `
            <div class="${W.titleBar || "title-bar"}">
                <div class="${W.titleBarText || "title-bar-text"}"></div>
                <div class="${W.titleBarControls || "title-bar-controls"}">
                    <button type="button" aria-label="Minimize" data-act="min"></button>
                    <button type="button" aria-label="Maximize" data-act="max"></button>
                    <button type="button" aria-label="Close" data-act="close"></button>
                </div>
            </div>
            <div class="${W.body || "window-body"}"></div>
            <div class="wm-resize"></div>
        `;
        win.querySelector(`.${W.titleBarText || "title-bar-text"}`).textContent = title;
        const body = win.querySelector(`.${W.body || "window-body"}`);

        const taskBtn = document.createElement("button");
        taskBtn.className = "task-btn";
        taskBtn.dataset.win = id;
        taskBtn.textContent = title;
        taskBtn.addEventListener("click", (e) => {
            if (e.shiftKey && kind === "module") {
                const moduleId = id.replace(/^mod:/, "").replace(/#\d+$/, "");
                openModule(moduleId, true);
                return;
            }
            const rec = windows.get(id);
            if (!rec) return;
            if (rec.el.classList.contains("minimized")) {
                rec.el.classList.remove("minimized");
                focusWindow(id);
            } else if (Number(rec.el.style.zIndex) === zTop && !rec.el.classList.contains("minimized")) {
                rec.el.classList.add("minimized");
            } else {
                focusWindow(id);
            }
        });
        tasksEl.appendChild(taskBtn);

        const rec = { el: win, body, taskBtn, kind, title };
        windows.set(id, rec);

        win.addEventListener("mousedown", () => focusWindow(id));

        win.querySelector('[data-act="min"]').addEventListener("click", (e) => {
            e.stopPropagation();
            win.classList.add("minimized");
        });
        win.querySelector('[data-act="max"]').addEventListener("click", (e) => {
            e.stopPropagation();
            win.classList.toggle("maximized");
        });
        win.querySelector('[data-act="close"]').addEventListener("click", (e) => {
            e.stopPropagation();
            closeWindow(id);
        });

        enableDrag(win);
        enableResize(win);

        surface.appendChild(win);
        focusWindow(id);
        taskmgrRender?.();
        return rec;
    }

    function closeWindow(id) {
        const rec = windows.get(id);
        if (!rec) return;
        rec.el.remove();
        rec.taskBtn.remove();
        windows.delete(id);
        folderWindowRenders.delete(id);
        taskmgrRender?.();
    }

    function enableDrag(win) {
        const bar = win.querySelector(`.${W.titleBar || "title-bar"}`);
        bar.addEventListener("mousedown", (e) => {
            if (e.button !== 0) return;
            if (e.target.closest("button")) return;
            if (win.classList.contains("maximized")) return;
            e.preventDefault();
            const startX = e.clientX;
            const startY = e.clientY;
            const origL = win.offsetLeft;
            const origT = win.offsetTop;
            const move = (ev) => {
                win.style.left = `${origL + ev.clientX - startX}px`;
                win.style.top = `${Math.max(0, origT + ev.clientY - startY)}px`;
            };
            const up = () => {
                document.removeEventListener("mousemove", move);
                document.removeEventListener("mouseup", up);
            };
            document.addEventListener("mousemove", move);
            document.addEventListener("mouseup", up);
        });
    }

    function enableResize(win) {
        const handle = win.querySelector(".wm-resize");
        handle.addEventListener("mousedown", (e) => {
            if (win.classList.contains("maximized")) return;
            e.preventDefault();
            e.stopPropagation();
            const startX = e.clientX;
            const startY = e.clientY;
            const origW = win.offsetWidth;
            const origH = win.offsetHeight;
            const move = (ev) => {
                win.style.width = `${Math.max(240, origW + ev.clientX - startX)}px`;
                win.style.height = `${Math.max(160, origH + ev.clientY - startY)}px`;
            };
            const up = () => {
                document.removeEventListener("mousemove", move);
                document.removeEventListener("mouseup", up);
            };
            document.addEventListener("mousemove", move);
            document.addEventListener("mouseup", up);
        });
    }

    function openFolder(tag) {
        const isModules = tag === MODULES;
        const id = `folder:${tag}`;
        const rec = createWindow({
            id,
            title: tag,
            kind: "folder",
            width: 480,
            height: 340,
        });
        rec.body.innerHTML = "";
        const toolbar = el("div", "explorer-toolbar");
        toolbar.textContent = isModules ? displayPath(MODULES) : displayPath(HOME + "/" + tag);
        const grid = el("div", "explorer-icons sunken-panel");
        const list = isModules ? sortModules(modules) : visibleByTag(tag);
        for (const m of list) {
            const node = makeIcon({
                kind: "program",
                id: m.id,
                label: m.name,
                onOpen: (e) => openModule(m.id, e && e.shiftKey),
            });
            if (isModules) node.dataset.format = "js";
            grid.appendChild(node);
        }
        rec.body.append(toolbar, grid);
        rec.el.querySelector(`.${W.titleBarText || "title-bar-text"}`).textContent = tag;
        enableRubberBand(grid, ".desktop-icon");
    }

    const folderWindowRenders = new Map();

    function refreshFileWindows() {
        for (const render of folderWindowRenders.values()) render?.();
    }

    function mkBtn(text) {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = text;
        return b;
    }

    function openExplorer(dir, opts = {}) {
        const trashMode = opts.mode === "trash";
        const winId = trashMode ? "explorer:corbeille" : `explorer:${dir || ""}`;
        const existed = windows.has(winId);
        const rec = createWindow({
            id: winId,
            title: trashMode ? "Corbeille" : dir ? nameOfPath(dir) : "Calculateur Plus!",
            kind: "explorer",
            width: 620,
            height: 460,
        });
        if (existed) return;
        rec.body.innerHTML = "";
        rec.body.classList.add("explorer-body");

        const nav = el("div", "explorer-toolbar");
        const backBtn = mkBtn("←");
        backBtn.title = "Précédent";
        const upBtn = mkBtn("↑");
        upBtn.title = "Dossier parent";
        const newFolderBtn = mkBtn("Nouveau dossier");
        const importBtn = mkBtn("Importer des fichiers...");
        const address = el("span", "explorer-path");

        const act = el("div", "explorer-toolbar");
        const cutBtn = mkBtn("Couper");
        const copyBtn = mkBtn("Copier");
        const pasteBtn = mkBtn("Coller");
        const delBtn = mkBtn("Supprimer");
        const renBtn = mkBtn("Renommer");
        const propBtn = mkBtn("Propriétés");
        const dlSelBtn = mkBtn("Télécharger");
        const restoreBtn = mkBtn("Restaurer");
        const permBtn = mkBtn("Supprimer définitivement");
        const emptyBtn = mkBtn("Vider la Corbeille");

        const grid = el("div", "explorer-icons sunken-panel");
        const status = el("div", "explorer-status");

        nav.append(backBtn, upBtn, newFolderBtn, importBtn, address);
        if (trashMode) {
            act.append(restoreBtn, permBtn, emptyBtn);
            nav.querySelectorAll("button").forEach((b) => (b.disabled = true));
            newFolderBtn.disabled = false;
            newFolderBtn.disabled = true;
        } else {
            act.append(cutBtn, copyBtn, pasteBtn, delBtn, renBtn, dlSelBtn, propBtn);
        }
        rec.body.append(nav, act, grid, status);
        enableRubberBand(grid, ".desktop-icon");

        let currentDir = trashMode ? CORBEILLE : (dir || "");
        const history = [];
        const titleSel = `.${W.titleBarText || "title-bar-text"}`;

        function setTitle() {
            rec.el.querySelector(titleSel).textContent = trashMode
                ? "Corbeille"
                : currentDir
                ? nameOfPath(currentDir)
                : "Calculateur Plus!";
        }

        function updateStatus(n) {
            status.textContent = `${n} élément${n > 1 ? "s" : ""}${trashMode ? " dans la Corbeille" : ""}`;
        }

        function render() {
            grid.innerHTML = "";
            grid.dataset.dir = currentDir || "";
            if (trashMode) {
                renderTrash();
                return;
            }
            address.textContent = displayPath(currentDir || "");
            backBtn.disabled = history.length === 0;
            upBtn.disabled = !currentDir;
            pasteBtn.disabled = !clipboard || !clipboard.items.length;
            setTitle();
            listEntries(currentDir || "").then((list) => {
                grid.innerHTML = "";
                const sorted = [...list].sort(
                    (a, b) =>
                        (a.kind === b.kind
                            ? a.name.localeCompare(b.name, "fr", { numeric: true })
                            : a.kind === "folder" ? -1 : 1)
                );
                for (const e of sorted) {
                    const isSys = e.path === HOME || e.path === CORBEILLE;
                    const node = makeIcon({
                        kind: userIconKind(e),
                        id: e.path,
                        label: displayName(e),
                        entry: e,
                        system: isSys,
                        onOpen: () =>
                            e.kind === "folder" && e.path === CORBEILLE
                                ? openCorbeille()
                                : e.kind === "folder"
                                ? navigateTo(e.path)
                                : openEntryPath(e),
                    });
                    if (!isSys) {
                        node.draggable = true;
                        node.addEventListener("dragstart", (ev) => startHtmlDrag(ev, e.path));
                    }
                    grid.appendChild(node);
                }
                let nSys = 0;
                if (currentDir === HOME) {
                    for (const tag of tags) {
                        const node = makeIcon({
                            kind: "folder",
                            id: tag,
                            label: tag,
                            system: true,
                            onOpen: () => openFolder(tag),
                        });
                        grid.appendChild(node);
                        nSys++;
                    }
                }
                if (currentDir === "") {
                    const node = makeIcon({
                        kind: "folder",
                        id: MODULES,
                        label: "Modules",
                        system: true,
                        onOpen: () => openFolder(MODULES),
                    });
                    grid.appendChild(node);
                    nSys++;
                }
                updateStatus(list.length + nSys);
            });
        }

        async function renderTrash() {
            address.textContent = displayPath(CORBEILLE);
            backBtn.disabled = true;
            upBtn.disabled = true;
            setTitle();
            const list = await listCorbeille();
            grid.innerHTML = "";
            for (const e of list) {
                const node = makeIcon({
                    kind: userIconKind(e),
                    id: e.path,
                    label: displayName(e),
                    entry: e,
                    onOpen: () => openEntryPath(e),
                });
                grid.appendChild(node);
            }
            updateStatus(list.length);
        }

        function navigateTo(dir) {
            if (currentDir) history.push(currentDir);
            currentDir = dir;
            render();
        }

        backBtn.addEventListener("click", () => {
            if (history.length) {
                currentDir = history.pop();
                render();
            }
        });
        upBtn.addEventListener("click", () => navigateTo(parentPath(currentDir || "")));
        newFolderBtn.addEventListener("click", () => createNewItem("folder", currentDir || "", grid));
        importBtn.addEventListener("click", () => pickFiles(currentDir || "", render));
        cutBtn.addEventListener("click", () => cutToClipboard(containerPaths(grid)));
        copyBtn.addEventListener("click", () => copyToClipboard(containerPaths(grid)));
        pasteBtn.addEventListener("click", () => pasteTo(currentDir || ""));
        delBtn.addEventListener("click", () => trashSelected(containerPaths(grid)));
        renBtn.addEventListener("click", () => {
            const f = firstSelected(grid);
            if (f) renameNode(f);
        });
        propBtn.addEventListener("click", () => openProperties([...iconsOf(grid)]));
        dlSelBtn.addEventListener("click", () => downloadSelected(containerPaths(grid)));
        restoreBtn.addEventListener("click", async () => {
            for (const p of containerPaths(grid)) await restoreEntry(p);
            await refreshUserEntries();
            refreshFileWindows();
        });
        permBtn.addEventListener("click", () => {
            const list = containerPaths(grid);
            if (!list.length) return;
            confirmDialog(
                "Supprimer définitivement",
                `${list.length} élément${list.length > 1 ? "s" : ""} sera${list.length > 1 ? "ont" : ""} supprimé${list.length > 1 ? "s" : ""} sans possibilité de récupération.`,
                async () => {
                    await deleteEntries(list);
                    await refreshUserEntries();
                    refreshFileWindows();
                }
            );
        });
        emptyBtn.addEventListener("click", () => {
            confirmDialog("Vider la Corbeille", "Vider définitivement la Corbeille ?", async () => {
                await emptyTrash();
                await refreshUserEntries();
                refreshFileWindows();
            });
        });

        if (!trashMode) {
            grid.addEventListener("dragover", (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
            });
            grid.addEventListener("drop", async (e) => {
                e.preventDefault();
                const paths = readHtmlPaths(e);
                htmlDragPaths = [];
                if (!paths.length) return;
                const folderIcon = e.target.closest('.desktop-icon[data-kind="ufolder"]');
                const dir = isDropFolder(folderIcon) ? folderIcon.dataset.id : (currentDir || "");
                await moveMany(paths, dir);
                render();
            });
        }

        folderWindowRenders.set(winId, render);
        render();
    }

    function openCorbeille() {
        openExplorer(null, { mode: "trash" });
    }

    function startHtmlDrag(ev, path) {
        htmlDragPaths = [path];
        ev.dataTransfer.setData("text/plain", path);
        ev.dataTransfer.effectAllowed = "copyMove";
    }

    function readHtmlPaths(e) {
        if (htmlDragPaths.length) return htmlDragPaths;
        try {
            const v = e.dataTransfer.getData("text/plain");
            return v ? [v] : [];
        } catch {
            return [];
        }
    }

    async function moveMany(paths, dir) {
        let moved = 0;
        for (const p of paths) {
            try {
                if (await moveEntry(p, dir)) moved++;
            } catch {}
        }
        if (moved) {
            await refreshUserEntries();
            refreshFileWindows();
        }
    }

    function containerPaths(container) {
        return [...iconsOf(container)]
            .filter((n) => n.dataset.kind === "ufolder" || n.dataset.kind === "ufile")
            .map((n) => n.dataset.id);
    }

    function firstSelected(container) {
        const list = [...iconsOf(container)];
        return list.find((n) => n.dataset.kind === "ufolder" || n.dataset.kind === "ufile") || list[0] || null;
    }

    function updateCtxPaste() {
        updateCtxViewLabel();
    }

    function cutToClipboard(paths) {
        if (!paths.length) return;
        clipboard = { mode: "cut", items: paths };
        refreshUserEntries();
        refreshFileWindows();
        updateCtxPaste();
    }

    function copyToClipboard(paths) {
        if (!paths.length) return;
        clipboard = { mode: "copy", items: paths };
        updateCtxPaste();
        refreshFileWindows();
    }

    async function pasteTo(dir) {
        if (!clipboard || !clipboard.items.length) return;
        const items = [];
        for (const p of clipboard.items) {
            const e = await getEntry(p);
            if (e) items.push(e);
        }
        if (!items.length) {
            clipboard = null;
            await refreshUserEntries();
            refreshFileWindows();
            updateCtxPaste();
            return;
        }
        if (clipboard.mode === "cut") {
            for (const it of items) await moveEntry(it.path, dir);
            clipboard = null;
        } else {
            for (const it of items) await copyEntry(it.path, dir);
        }
        await refreshUserEntries();
        refreshFileWindows();
        updateCtxPaste();
    }

    function allSelectedNodes() {
        const nodes = [];
        for (const [, s] of selectedByContainer) {
            for (const n of s) nodes.push(n);
        }
        return nodes;
    }

    function allSelectedPaths() {
        const paths = [];
        for (const n of allSelectedNodes()) {
            if (n.dataset.kind === "ufolder" || n.dataset.kind === "ufile") paths.push(n.dataset.id);
        }
        return paths;
    }

    function currentPasteTarget() {
        const selected = allSelectedNodes();
        const user = selected.filter((n) => n.dataset.kind === "ufolder" || n.dataset.kind === "ufile");
        if (user.length === 1 && isDropFolder(user[0])) return user[0].dataset.id;
        for (const [, s] of selectedByContainer) {
            if (!s.size) continue;
            const grid = [...s][0].closest(".explorer-icons");
            if (grid && grid.dataset.dir !== undefined) return grid.dataset.dir || "";
        }
        return HOME;
    }

    function openFirstSelected() {
        const node = allSelectedNodes()[0];
        if (node) openIconTarget(node);
    }

    function renameFirstSelected() {
        const node = allSelectedNodes().find((n) => n.dataset.kind === "ufolder" || n.dataset.kind === "ufile");
        if (node) renameNode(node);
    }

    function openIconTarget(node) {
        const kind = node.dataset.kind;
        const id = node.dataset.id;
        if (kind === "folder") openFolder(id);
        else if (kind === "ufolder" || kind === "ufile") {
            if (node.__entry) openEntryPath(node.__entry);
            else openFile(id);
        } else if (kind === "trash") openCorbeille();
        else openModule(id);
    }

    function confirmDialog(title, msg, onOk) {
        const id = `confirm:${winSeq}`;
        const rec = createWindow({ id, title, kind: "info", width: 400, height: 180 });
        rec.body.innerHTML = "";
        rec.body.classList.add("props-body");
        const p = el("p", "note-message");
        p.textContent = msg;
        const footer = el("div", "props-footer");
        const ok = document.createElement("button");
        ok.type = "button";
        ok.textContent = "Oui";
        ok.addEventListener("click", () => {
            closeWindow(id);
            onOk?.();
        });
        const no = document.createElement("button");
        no.type = "button";
        no.textContent = "Non";
        no.addEventListener("click", () => closeWindow(id));
        footer.append(ok, no);
        rec.body.append(p, footer);
    }

    function trashSelected(paths) {
        const list = (paths || []).filter(Boolean);
        if (!list.length) return;
        confirmDialog(
            "Supprimer",
            `${list.length} élément${list.length > 1 ? "s" : ""} va${list.length > 1 ? "ent" : ""} être envoyé${list.length > 1 ? "s" : ""} à la Corbeille.`,
            async () => {
                await trashEntries(list);
                clipboard = null;
                await refreshUserEntries();
                refreshFileWindows();
                updateCtxPaste();
            }
        );
    }

    async function openFile(entryId) {
        const entry = await getEntry(entryId);
        if (!entry) return;
        const cat = fileCategory(entry);
        if (cat === "image") { openImageViewer(entryId); return; }
        if (cat === "audio") { openAudioPlayer(entryId); return; }
        if (cat === "video") { openVideoPlayer(entryId); return; }
        const mime = entry.mime || "";
        if (mime.startsWith("text/") || /\.(txt|md|log|ini|csv|json)$/i.test(entry.name)) {
            openTextEditor(entryId);
            return;
        }
        showPlaceholder(
            entry.name,
            `Aucun programme associé pour « ${entry.name} ». Les lecteurs audio/vidéo et les éditeurs arrivent bientôt.`
        );
    }
    async function openImageViewer(entryId) {
        const entry = await getEntry(entryId);
        if (!entry?.blob) { showPlaceholder(entry?.name||"Image","Fichier vide."); return; }
        const winId = `img:${entryId}`; if (windows.has(winId)) { focusWindow(winId); return; }
        const rec = createWindow({ id: winId, title: `${entry.name} - Visionneuse`, kind: "image", width: 640, height: 480 });
        const url = URL.createObjectURL(entry.blob);
        rec.body.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#000"><img src="${url}" style="max-width:100%;max-height:100%;object-fit:contain"/></div>`;
        rec.el.addEventListener("close", () => URL.revokeObjectURL(url), { once:true });
        const oldClose = rec.el.querySelector('[data-act="close"]');
        oldClose?.addEventListener("click", () => URL.revokeObjectURL(url), { once:true });
    }
    async function openAudioPlayer(entryId) {
        const entry = await getEntry(entryId);
        if (!entry?.blob) { showPlaceholder(entry?.name||"Audio","Fichier vide."); return; }
        const winId = `audio:${entryId}`; if (windows.has(winId)) { focusWindow(winId); return; }
        const rec = createWindow({ id: winId, title: `${entry.name} - Lecteur audio`, kind: "audio", width: 420, height: 140 });
        const url = URL.createObjectURL(entry.blob);
        rec.body.innerHTML = `<div style="padding:16px"><div style="margin-bottom:8px;font-weight:600">${entry.name}</div><audio controls autoplay style="width:100%" src="${url}"></audio></div>`;
        const cleanup = () => URL.revokeObjectURL(url);
        rec.el.addEventListener("close", cleanup, { once:true });
        rec.el.querySelector('[data-act="close"]')?.addEventListener("click", cleanup, { once:true });
    }
    async function openVideoPlayer(entryId) {
        const entry = await getEntry(entryId);
        if (!entry?.blob) { showPlaceholder(entry?.name||"Vidéo","Fichier vide."); return; }
        const winId = `video:${entryId}`; if (windows.has(winId)) { focusWindow(winId); return; }
        const rec = createWindow({ id: winId, title: `${entry.name} - Lecteur vidéo`, kind: "video", width: 640, height: 420 });
        const url = URL.createObjectURL(entry.blob);
        rec.body.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#000"><video controls autoplay style="max-width:100%;max-height:100%" src="${url}"></video></div>`;
        const cleanup = () => URL.revokeObjectURL(url);
        rec.el.addEventListener("close", cleanup, { once:true });
        rec.el.querySelector('[data-act="close"]')?.addEventListener("click", cleanup, { once:true });
    }

    async function openTextEditor(entryId) {
        const entry = await getEntry(entryId);
        if (!entry) return;
        const winId = `note:${entryId}`;
        const existed = windows.has(winId);
        const rec = createWindow({
            id: winId,
            title: `${entry.name} - Bloc-notes`,
            kind: "note",
            width: 520,
            height: 420,
        });
        if (existed) return;
        rec.body.innerHTML = "";
        rec.body.classList.add("note-body");
        const toolbar = el("div", "explorer-toolbar");
        const save = document.createElement("button");
        save.type = "button";
        save.textContent = "Enregistrer";
        const encSel = document.createElement("select");
        ["utf-8","windows-1252","iso-8859-1","utf-16le","utf-16be"].forEach(enc=>{
            const o=document.createElement("option"); o.value=enc; o.textContent=enc.toUpperCase(); encSel.appendChild(o);
        });
        encSel.value="utf-8"; encSel.title="Encodage"; encSel.style.marginLeft="8px";
        const ta = document.createElement("textarea");
        ta.className = "note-textarea";
        const status = el("div", "note-status");
        const updateStatus = () => {
            const lines = ta.value === "" ? 0 : ta.value.split("\n").length;
            let chars; try { const seg = new Intl.Segmenter(undefined,{granularity:"grapheme"}); chars = [...seg.segment(ta.value)].length; } catch { chars = Array.from(ta.value).length; }
            status.textContent = `Lignes : ${lines} — Caractères : ${chars} — ${encSel.value.toUpperCase()}`;
        };
        const decode = async (blob, enc) => {
            if (!blob) return "";
            try { const buf=await blob.arrayBuffer(); return new TextDecoder(enc, {fatal:false}).decode(buf); } catch { return await blob.text(); }
        };
        const encode = (text, enc) => {
            if (enc==="utf-8") return new Blob([text], {type:"text/plain;charset=utf-8"});
            if (enc==="utf-16le" || enc==="utf-16be") {
                const le = enc==="utf-16le"; const buf=new Uint8Array(text.length*2);
                for(let i=0;i<text.length;i++){ const c=text.charCodeAt(i); buf[i*2]= le?c&255:c>>8; buf[i*2+1]= le?c>>8:c&255; }
                return new Blob([buf], {type:`text/plain;charset=${enc}`});
            }
            const buf=new Uint8Array(text.length); for(let i=0;i<text.length;i++) buf[i]=text.charCodeAt(i)&255;
            return new Blob([buf], {type:`text/plain;charset=${enc}`});
        };
        let rawBlob = entry.blob;
        ta.addEventListener("input", updateStatus);
        ta.addEventListener("keydown", (e) => {
            if (e.ctrlKey && e.key.toLowerCase() === "s") {
                e.preventDefault();
                save.click();
            }
        });
        encSel.addEventListener("change", async () => {
            ta.value = await decode(rawBlob, encSel.value);
            updateStatus();
        });
        save.addEventListener("click", async () => {
            const e = await getEntry(entryId);
            if (!e) return;
            const b = encode(ta.value, encSel.value);
            e.blob = b; e.size = b.size; e.mime = `text/plain;charset=${encSel.value}`; e.modifiedAt = Date.now();
            await putEntry(e);
            rawBlob = b;
            save.textContent = "Enregistré";
            setTimeout(() => (save.textContent = "Enregistrer"), 1200);
        });
        toolbar.append(save, encSel);
        rec.body.append(toolbar, ta, status);
        ta.value = await decode(rawBlob, encSel.value);
        updateStatus();
    }

    function showPlaceholder(title, msg) {
        const winId = `info:${winSeq}`;
        const rec = createWindow({
            id: winId,
            title,
            kind: "info",
            width: 380,
            height: 160,
        });
        rec.body.innerHTML = "";
        rec.body.classList.add("props-body");
        const p = document.createElement("p");
        p.className = "note-message";
        p.textContent = msg;
        const footer = el("div", "props-footer");
        const ok = document.createElement("button");
        ok.type = "button";
        ok.textContent = "OK";
        ok.addEventListener("click", () => closeWindow(winId));
        footer.appendChild(ok);
        rec.body.append(p, footer);
    }

    function openModule(moduleId, forceNew) {
        const meta = all.find((m) => m.id === moduleId) || { id: moduleId, name: moduleId };
        let id = `mod:${moduleId}`;
        if (forceNew) {
            let n = 1;
            do {
                id = `mod:${moduleId}${n === 1 ? "" : `#${n}`}`;
                n++;
            } while (windows.has(id));
        }
        const existed = windows.has(id);
        const rec = createWindow({
            id,
            title: meta.name,
            kind: "module",
            width: 640,
            height: 500,
        });
        if (!existed) {
            rec.body.innerHTML = "";
            const iframe = document.createElement("iframe");
            iframe.title = meta.name;
            iframe.src = `${basePath}src/shell/frame.html?theme=${encodeURIComponent(theme.id)}&id=${encodeURIComponent(moduleId)}`;
            rec.body.appendChild(iframe);
            rec.el.querySelector(`.${W.titleBarText || "title-bar-text"}`).textContent = meta.name;
        }
        closeStart();
    }

    async function downloadSelected(paths) {
        const list = (paths || []).filter(Boolean);
        if (!list.length) return;
        const entries = [];
        for (const p of list) {
            const e = await getEntry(p);
            if (e?.kind === "file" && e.blob) entries.push(e);
        }
        if (!entries.length) return;
        if (entries.length === 1) {
            const url = URL.createObjectURL(entries[0].blob);
            const a = document.createElement("a");
            a.href = url; a.download = entries[0].name;
            document.body.appendChild(a); a.click(); a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 4000);
            return;
        }
        // plusieurs fichiers → un .zip par morceaux (store, sans compression)
        const chunks = [];
        let offset = 0;
        const central = [];
        const enc = new TextEncoder();
        const filesData = [];
        for (const e of entries) {
            const nameBytes = enc.encode(e.name);
            const data = new Uint8Array(await e.blob.arrayBuffer());
            const crcTable = zipCrcTable();
            let crc = 0xFFFFFFFF;
            for (let i = 0; i < data.length; i++) crc = (crc >>> 8) ^ crcTable[(crc ^ data[i]) & 0xFF];
            crc = (crc ^ 0xFFFFFFFF) >>> 0;
            filesData.push({ nameBytes, data, crc });
        }
        const now = new Date();
        const dosTime = ((now.getHours() & 31) << 11) | ((now.getMinutes() & 63) << 5) | ((now.getSeconds() / 2) & 31);
        const dosDate = (((now.getFullYear() - 1980) & 127) << 9) | (((now.getMonth() + 1) & 15) << 5) | (now.getDate() & 31);
        for (const f of filesData) {
            const local = new Uint8Array(30 + f.nameBytes.length);
            const lv = new DataView(local.buffer);
            lv.setUint32(0, 0x04034b50, true); lv.setUint16(4, 20, true); lv.setUint16(6, 0, true);
            lv.setUint16(8, 0, true); lv.setUint16(10, dosTime, true); lv.setUint16(12, dosDate, true);
            lv.setUint32(14, f.crc, true); lv.setUint32(18, f.data.length, true); lv.setUint32(22, f.data.length, true);
            lv.setUint16(26, f.nameBytes.length, true); lv.setUint16(28, 0, true);
            local.set(f.nameBytes, 30);
            central.push({ f, offset });
            chunks.push(local, f.data);
            offset += local.length + f.data.length;
        }
        const cdStart = offset;
        for (const { f, offset: o } of central) {
            const cd = new Uint8Array(46 + f.nameBytes.length);
            const cv = new DataView(cd.buffer);
            cv.setUint32(0, 0x02014b50, true); cv.setUint16(4, 20, true); cv.setUint16(6, 20, true);
            cv.setUint16(8, 0, true); cv.setUint16(10, 0, true); cv.setUint16(12, dosTime, true); cv.setUint16(14, dosDate, true);
            cv.setUint32(16, f.crc, true); cv.setUint32(20, f.data.length, true); cv.setUint32(24, f.data.length, true);
            cv.setUint16(28, f.nameBytes.length, true); cv.setUint16(42, o, true);
            cd.set(f.nameBytes, 46);
            chunks.push(cd);
            offset += cd.length;
        }
        const eocd = new Uint8Array(22);
        const ev = new DataView(eocd.buffer);
        ev.setUint32(0, 0x06054b50, true); ev.setUint16(8, filesData.length, true);
        ev.setUint16(10, filesData.length, true); ev.setUint32(12, offset - cdStart, true); ev.setUint32(16, cdStart, true);
        chunks.push(eocd);
        const zip = new Blob(chunks, { type: "application/zip" });
        const url = URL.createObjectURL(zip);
        const a = document.createElement("a");
        a.href = url; a.download = "Calculateur_Plus_fichiers.zip";
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
    }
    function zipCrcTable() {
        if (zipCrcTable._t) return zipCrcTable._t;
        const t = new Uint32Array(256);
        for (let n = 0; n < 256; n++) {
            let c = n;
            for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
            t[n] = c >>> 0;
        }
        zipCrcTable._t = t;
        return t;
    }

    function showIconMenu(node, x, y) {
        const kind = node.dataset.kind;
        const id = node.dataset.id;
        const menu = el("div", "desktop-ctx window");
        root.appendChild(menu);
        menu.style.left = `${Math.min(x, window.innerWidth - 200)}px`;
        menu.style.top = `${Math.min(y, window.innerHeight - 220)}px`;
        const open = document.createElement("button");
        open.type = "button";
        open.textContent = "Ouvrir";
        open.addEventListener("click", () => {
            menu.remove();
            openIconTarget(node);
        });
        const rename = document.createElement("button");
        rename.type = "button";
        rename.textContent = "Renommer";
        rename.addEventListener("click", () => {
            menu.remove();
            renameNode(node);
        });
        const openWith = document.createElement("button");
        openWith.type = "button";
        openWith.textContent = "Ouvrir avec...";
        openWith.addEventListener("click", () => {
            menu.innerHTML = "";
            const back = document.createElement("button");
            back.type = "button";
            back.textContent = "← Retour";
            back.addEventListener("click", () => {
                menu.remove();
                showIconMenu(node, x, y);
            });
            menu.appendChild(back);
            const cat = node.__entry ? fileCategory(node.__entry) : "other";
            const editors = modules.filter((m) => (m.openWith || []).includes(cat));
            if (!editors.length) {
                const none = document.createElement("button");
                none.type = "button";
                none.disabled = true;
                none.textContent = "Aucun programme associé";
                menu.appendChild(none);
            }
            for (const m of editors) {
                const b = document.createElement("button");
                b.type = "button";
                b.textContent = m.name;
                b.addEventListener("click", () => {
                    menu.remove();
                    openModule(m.id);
                });
                menu.appendChild(b);
            }
        });
        const props = document.createElement("button");
        props.type = "button";
        props.textContent = "Propriétés";
        props.addEventListener("click", () => {
            menu.remove();
            const targets = [...iconsOf(node.parentElement)];
            if (!targets.includes(node)) targets.push(node);
            openProperties(targets);
        });
        const cutBtn = document.createElement("button");
        cutBtn.type = "button";
        cutBtn.textContent = "Couper";
        cutBtn.addEventListener("click", () => {
            menu.remove();
            cutToClipboard(containerPaths(node.parentElement));
        });
        const copyBtn = document.createElement("button");
        copyBtn.type = "button";
        copyBtn.textContent = "Copier";
        copyBtn.addEventListener("click", () => {
            menu.remove();
            copyToClipboard(containerPaths(node.parentElement));
        });
        const pasteBtn = document.createElement("button");
        pasteBtn.type = "button";
        pasteBtn.textContent = "Coller";
        pasteBtn.disabled = !clipboard || !clipboard.items.length;
        pasteBtn.addEventListener("click", () => {
            menu.remove();
            const parent = node.closest(".explorer-icons")?.dataset.dir ?? "";
            pasteTo(kind === "ufolder" && !(node.__entry && node.__entry.kind === "shortcut") ? id : parent);
        });
        const delBtn = document.createElement("button");
        delBtn.type = "button";
        delBtn.textContent = "Supprimer";
        delBtn.addEventListener("click", () => {
            menu.remove();
            trashSelected(containerPaths(node.parentElement));
        });
        const mkLink = document.createElement("button");
        mkLink.type = "button";
        mkLink.textContent = "Créer un raccourci";
        mkLink.addEventListener("click", async () => {
            menu.remove();
            const dir = node.closest(".explorer-icons")?.dataset.dir ?? parentPath(id);
            await createShortcut(id, dir);
            await refreshUserEntries();
            refreshFileWindows();
        });
        if (kind === "ufile") {
            var dlBtn = document.createElement("button");
            dlBtn.type = "button";
            dlBtn.textContent = "Télécharger";
            dlBtn.addEventListener("click", async () => {
                menu.remove();
                const sel = containerPaths(node.parentElement);
                const list = sel.length ? sel : [id];
                await downloadSelected(list);
            });
        }
        if (kind === "trash") {
            const emptyBtn = document.createElement("button");
            emptyBtn.type = "button";
            emptyBtn.textContent = "Vider la corbeille";
            emptyBtn.disabled = !trashHasItems;
            emptyBtn.addEventListener("click", async () => {
                menu.remove();
                await emptyTrash();
                await refreshUserEntries();
                refreshFileWindows();
                await refreshTrashState();
            });
            menu.append(emptyBtn, open, props);
        } else {
            menu.append(open, props);
        }
        if (kind === "ufolder" || kind === "ufile") {
            menu.insertBefore(rename, props);
            if (kind === "ufile") menu.insertBefore(openWith, props);
            menu.insertBefore(cutBtn, props);
            menu.insertBefore(copyBtn, props);
            menu.insertBefore(pasteBtn, props);
            menu.insertBefore(delBtn, props);
            menu.insertBefore(mkLink, props);
            if (kind === "ufile") menu.insertBefore(dlBtn, mkLink);
        }
        const kill = (ev) => {
            if (!menu.contains(ev.target)) {
                menu.remove();
                document.removeEventListener("mousedown", kill, true);
            }
        };
        document.addEventListener("mousedown", kill, true);
    }

    function kindType(k) {
        if (k === "folder" || k === "ufolder") return "Dossier";
        if (k === "ufile") return "Fichier";
        return "Raccourci de programme";
    }

    async function openProperties(nodes) {
        const list = (Array.isArray(nodes) ? nodes : [nodes]).filter((n) => n && n.dataset);
        const first = list[0];
        if (!first) return;
        const kind = first.dataset.kind;
        const id = first.dataset.id;
        const label = first.querySelector(".icon-label").textContent;
        const winId = list.length > 1 ? "props:multi" : `props:${kind}:${id}`;
        const existed = windows.has(winId);
        const rec = createWindow({
            id: winId,
            title: list.length > 1 ? `Propriétés de ${list.length} éléments` : `Propriétés de ${label}`,
            kind: "props",
            width: 380,
            height: 320,
        });
        if (existed) return;
        rec.body.innerHTML = "";
        rec.body.classList.add("props-body");

        const entries = [];
        for (const n of list) {
            if (n.dataset.kind === "ufolder" || n.dataset.kind === "ufile") {
                entries.push(await getEntry(n.dataset.id));
            } else {
                entries.push(null);
            }
        }

        const rows = [];
        if (list.length > 1) {
            const names = list.map((n) => n.querySelector(".icon-label").textContent);
            const types = [...new Set(list.map((n) => kindType(n.dataset.kind)))];
            rows.push(["Éléments", String(list.length)]);
            rows.push(["Noms", names.join(", ")]);
            rows.push(["Type", types.join(", ")]);
            rows.push(["Emplacement", displayPath("")]);
        } else if (kind === "trash") {
            const count = (await listCorbeille()).length;
            rows.push(["Nom", "Corbeille"]);
            rows.push(["Type", "Dossier système"]);
            rows.push(["Emplacement", displayPath(CORBEILLE)]);
            rows.push(["Contenu", `${count} élément${count > 1 ? "s" : ""}`]);
        } else if (kind === "ufolder" || kind === "ufile") {
            const entry = entries[0];
            rows.push(["Nom", entry?.name || label]);
            if (entry && entry.kind === "shortcut") {
                rows.push(["Type", "Raccourci"]);
                rows.push(["Format", ".lnk"]);
                rows.push(["Cible", entry.target ? displayPath(entry.target) : ""]);
            } else {
                rows.push(["Type", kind === "ufolder" ? "Dossier" : typeLabel(entry)]);
                if (kind === "ufile") {
                    rows.push(["Format", entry?.mime || "inconnu"]);
                    rows.push(["Taille", formatSize(entry?.size || 0)]);
                }
            }
            rows.push(["Emplacement", displayPath((entry && entry.parent) || "")]);
            rows.push(["Chemin complet", entry ? displayPath(entry.path) : ""]);
            rows.push(["Modifié le", entry ? new Date(entry.modifiedAt).toLocaleString("fr-FR") : ""]);
        } else {
            const isFolder = kind === "folder";
            const isJs = first.dataset.format === "js";
            const name = isFolder ? label : (all.find((m) => m.id === id)?.name || label);
            rows.push(["Nom", name]);
            rows.push(["Type", isFolder ? "Dossier" : isJs ? "Module" : "Raccourci de programme"]);
            rows.push(["Format", isFolder ? "Dossier de raccourcis" : isJs ? "Module (.js)" : "Raccourci (.lnk)"]);
            rows.push(["Emplacement", isFolder ? displayPath(HOME + "/" + id) : "C:\\modules"]);
        }

        const table = el("div", "props-table");
        for (const [k, v] of rows) {
            const row = el("div", "props-row");
            const key = el("span", "props-key");
            key.textContent = k;
            const val = el("span", "props-val");
            val.textContent = v;
            row.append(key, val);
            table.appendChild(row);
        }

        let noteText;
        if (list.length > 1) {
            const nFolders = list.filter((n) => ["folder", "ufolder"].includes(n.dataset.kind)).length;
            const nFiles = list.filter((n) => n.dataset.kind === "ufile").length;
            const nProgs = list.length - nFolders - nFiles;
            const parts = [];
            if (nFolders) parts.push(`${nFolders} dossier(s)`);
            if (nFiles) parts.push(`${nFiles} fichier(s)`);
            if (nProgs) parts.push(`${nProgs} raccourci(s) (aucune taille)`);
            noteText = parts.join(" — ") + ".";
        } else if (kind === "trash") {
            noteText = "Système — les éléments supprimés y sont conservés jusqu'à la restauration ou la suppression définitive.";
        } else if (entries[0] && entries[0].kind === "shortcut") {
            noteText = `Raccourci (.lnk) — pointe vers ${displayPath(entries[0].target)}.`;
        } else if (kind === "ufolder") {
            const children = await listEntries(id);
            noteText = `${children.length} élément${children.length > 1 ? "s" : ""} dans ce dossier.`;
        } else if (kind === "ufile") {
            noteText = `Fichier ${formatSize(entries[0]?.size || 0)}.`;
        } else if (kind === "folder") {
            const count = visibleByTag(id).length;
            noteText = `${count} élément${count > 1 ? "s" : ""} dans ce dossier.`;
        } else {
            noteText = first.dataset.format === "js" ? "" : "Raccourci — aucune taille à afficher.";
        }

        const note = el("div", "props-note");
        note.textContent = noteText;
        const footer = el("div", "props-footer");
        const ok = document.createElement("button");
        ok.type = "button";
        ok.textContent = "OK";
        ok.addEventListener("click", () => closeWindow(winId));
        footer.appendChild(ok);
        rec.body.append(table, note, footer);
    }

    function openTaskManager() {
        const id = "taskmgr";
        const rec = createWindow({
            id,
            title: "Gestionnaire des tâches",
            kind: "taskmgr",
            width: 480,
            height: 400,
        });
        rec.body.innerHTML = "";
        rec.body.classList.add("taskmgr-body");

        const header = el("div", "taskmgr-header");
        const list = el("div", "taskmgr-list sunken-panel");
        const actions = el("div", "taskmgr-actions");
        const refreshBtn = document.createElement("button");
        refreshBtn.type = "button";
        refreshBtn.textContent = "Actualiser";
        refreshBtn.addEventListener("click", render);
        const closeBtn = document.createElement("button");
        closeBtn.type = "button";
        closeBtn.textContent = "Fermer";
        closeBtn.addEventListener("click", () => {
            taskmgrRender = null;
            closeWindow(id);
        });
        actions.append(refreshBtn, closeBtn);
        rec.body.append(header, list, actions);

        let lastSig = "";
        function render() {
            const sig = [...windows.keys()].join("|");
            if (sig === lastSig) return;
            lastSig = sig;
            header.textContent = `Fenêtres ouvertes : ${windows.size}`;
            list.innerHTML = "";
            for (const [winId, other] of windows) {
                if (winId === id) continue;
                const row = el("div", "taskmgr-row");
                const label = document.createElement("span");
                label.className = "taskmgr-name";
                label.textContent = other.title;
                const activate = document.createElement("button");
                activate.type = "button";
                activate.textContent = "Activer";
                activate.addEventListener("click", () => {
                    focusWindow(winId);
                });
                const end = document.createElement("button");
                end.type = "button";
                end.textContent = "Terminer";
                end.addEventListener("click", () => {
                    closeWindow(winId);
                });
                row.append(label, activate, end);
                list.appendChild(row);
            }
        }

        taskmgrRender = render;
        render();
    }

    const searchInput = startMenu.querySelector(".start-search");
    const searchResults = startMenu.querySelector(".start-search-results");
    searchInput.addEventListener("input", () => {
        const q = searchInput.value.trim().toLowerCase();
        searchResults.innerHTML = "";
        if (!q) return;
        const hits = modules.filter(
            (m) =>
                m.name.toLowerCase().includes(q) ||
                m.id.toLowerCase().includes(q) ||
                (m.tags || []).some((t) => t.toLowerCase().includes(q))
        ).slice(0, 8);
        for (const m of hits) {
            const b = document.createElement("button");
            b.type = "button";
            b.textContent = m.name;
            b.addEventListener("click", (e) => openModule(m.id, e.shiftKey));
            searchResults.appendChild(b);
        }
    });

    startMenu.addEventListener("click", (e) => {
        e.stopPropagation();
        const act = e.target.closest("[data-act]")?.dataset.act;
        if (act === "display-folders") setDisplay("folders");
        if (act === "display-all") setDisplay("all");
        if (act === "arrange-auto") setArrange("auto");
        if (act === "arrange-grid") setArrange("grid");
        if (act === "arrange-free") setArrange("free");
        if (act === "controlpanel") openControlPanel();
        if (act === "taskmgr") openTaskManager();
        if (act === "info") openModule("info");
        if (act === "explorer") openExplorer("");
        if (act === "corbeille") openCorbeille();
    });

    ctx.addEventListener("click", (e) => {
        e.stopPropagation();
        const act = e.target.closest("[data-act]")?.dataset.act;
        if (act === "display-folders") setDisplay("folders");
        if (act === "display-all") setDisplay("all");
        if (act === "arrange-auto") setArrange("auto");
        if (act === "arrange-grid") setArrange("grid");
        if (act === "arrange-free") setArrange("free");
        if (act === "newfolder") createNewItem("folder", HOME);
        if (act === "newfile") createNewItem("file", HOME);
        if (act === "import") pickFiles(HOME);
        if (act === "paste") pasteTo(HOME);
        if (act === "explorer") openExplorer("");
        if (act === "corbeille") openCorbeille();
        if (act === "align") alignIcons();
        if (act === "viewicons") {
            showIcons = !showIcons;
            localStorage.setItem(VIEW_KEY, showIcons ? "1" : "0");
            iconsEl.hidden = !showIcons;
            updateCtxViewLabel();
        }
        if (act === "sort") {
            ctx.innerHTML = `
                <button type="button" data-act="sort-name">Trier par nom</button>
                <button type="button" data-act="sort-type">Trier par type</button>
                <button type="button" data-act="sort-back">← Retour</button>
            `;
            return;
        }
        if (act === "sort-name") {
            sortMode = "name";
            renderDesktop();
        }
        if (act === "sort-type") {
            sortMode = "type";
            renderDesktop();
        }
        if (act === "sort-back") buildCtx();
        if (act === "controlpanel") openControlPanel();
        if (act === "taskmgr") openTaskManager();
        if (act === "refresh") renderDesktop();
        ctx.hidden = true;
    });

    startBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleStart();
    });

    taskbar.addEventListener("contextmenu", (e) => {
        if (e.target.closest(".taskbar-start")) return;
        if (e.target.closest(".task-btn")) return;
        if (e.target.closest(".taskbar-tray")) return;
        e.preventDefault();
        closeStart();
        ctx.hidden = true;
        const tctx = el("div", "desktop-ctx window");
        root.appendChild(tctx);
        tctx.style.left = `${Math.min(e.clientX, window.innerWidth - 200)}px`;
        tctx.style.top = `${Math.max(0, e.clientY - tctx.offsetHeight)}px`;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = "Gestionnaire des tâches";
        btn.addEventListener("click", () => {
            tctx.remove();
            openTaskManager();
        });
        tctx.appendChild(btn);
        const kill = (ev) => {
            if (!tctx.contains(ev.target)) {
                tctx.remove();
                document.removeEventListener("mousedown", kill, true);
            }
        };
        document.addEventListener("mousedown", kill, true);
    });

    surface.addEventListener("click", (e) => {
        const isEmptyClick = !e.target.closest(".desktop-icon") && !e.target.closest(".wm-window") && !e.target.closest(".start-menu") && !e.target.closest(".desktop-ctx");
        const wasEmpty = allSelectedEmpty();
        if (isEmptyClick && wasEmpty && !dragSuppressClick && e.button === 0) {
            e.preventDefault();
            e.stopPropagation();
            ctx.hidden = true;
            closeStart();
            buildLeftMenu();
            if (!leftMenu.children.length) {
                leftMenu.hidden = true;
                return;
            }
            leftMenu.hidden = false;
            const pad = 8;
            let x = e.clientX;
            let y = e.clientY;
            leftMenu.style.left = `${x}px`;
            leftMenu.style.top = `${y}px`;
            requestAnimationFrame(() => {
                const r = leftMenu.getBoundingClientRect();
                if (r.right > window.innerWidth - pad) leftMenu.style.left = `${Math.max(pad, window.innerWidth - r.width - pad)}px`;
                if (r.bottom > window.innerHeight - pad) leftMenu.style.top = `${Math.max(pad, window.innerHeight - r.height - pad)}px`;
            });
            return;
        }
        closeStart();
        ctx.hidden = true;
        leftMenu.hidden = true;
        clearSelection();
    });

    document.addEventListener(
        "click",
        (e) => {
            if (dragSuppressClick) {
                e.preventDefault();
                e.stopPropagation();
                dragSuppressClick = false;
            }
        },
        true
    );

    surface.addEventListener("contextmenu", (e) => {
        if (e.target.closest(".wm-window") || e.target.closest(".start-menu")) return;
        e.preventDefault();
        closeStart();
        ctx.hidden = false;
        ctx.style.left = `${e.clientX}px`;
        ctx.style.top = `${Math.min(e.clientY, window.innerHeight - 120)}px`;
    });

    enableRubberBand(surface, ".desktop-icon");
    enableIconDrag(surface);

    surface.addEventListener("dragover", (e) => {
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
    });
    surface.addEventListener("drop", async (e) => {
        e.preventDefault();
        const paths = readHtmlPaths(e);
        htmlDragPaths = [];
        if (!paths.length) return;
        const folderIcon = e.target.closest('.desktop-icon[data-kind="ufolder"]');
        await moveMany(paths, folderIcon ? folderIcon.dataset.id : HOME);
    });
    document.addEventListener("dragend", () => {
        htmlDragPaths = [];
    });

    document.addEventListener("mousedown", onDocDown);
    document.addEventListener("keydown", onKey);
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && document.fullscreenElement) {
            e.preventDefault();
            e.stopImmediatePropagation();
            closeStart(); ctx.hidden = true; leftMenu.hidden = true;
        }
    }, true);
    function onDocDown(e) {
        if (!startMenu.contains(e.target) && !startBtn.contains(e.target)) closeStart();
        if (!ctx.contains(e.target)) ctx.hidden = true;
        if (!leftMenu.contains(e.target)) leftMenu.hidden = true;
    }
    function onKey(e) {
        if (e.key === "F11") { e.preventDefault(); toggleFullscreen(); return; }
        if (e.metaKey && (e.ctrlKey || e.shiftKey)) {
            e.preventDefault();
            toggleStart();
            return;
        }
        if (e.key === "Escape") {
            closeStart();
            ctx.hidden = true;
            leftMenu.hidden = true;
            return;
        }
        const tag = (e.target && e.target.tagName) || "";
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || e.target?.isContentEditable) {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") return;
            return;
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
            e.preventDefault();
            let targetGrid = null;
            let topZ = -1;
            for (const [, w] of windows) {
                const g = w.el.querySelector('.explorer-icons');
                if (g) {
                    const z = parseInt(w.el.style.zIndex || "0", 10);
                    if (z > topZ) { topZ = z; targetGrid = g; }
                }
            }
            const activeTask = document.querySelector('.task-btn.active-task');
            if (activeTask) {
                const rec = windows.get(activeTask.dataset.win);
                const g = rec?.el.querySelector('.explorer-icons');
                if (g) targetGrid = g;
            }
            if (!targetGrid || targetGrid.closest('.wm-window.minimized')) targetGrid = iconsEl;
            // si le grid actif est vide, fallback bureau
            let icons = [...targetGrid.querySelectorAll(".desktop-icon")];
            if (!icons.length && targetGrid !== iconsEl) {
                icons = [...iconsEl.querySelectorAll(".desktop-icon")];
                targetGrid = iconsEl;
            }
            if (icons.length) {
                clearSelection();
                const s = iconsOf(targetGrid);
                icons.forEach(n => { s.add(n); n.classList.add("selected"); });
                selAnchor = icons[icons.length-1];
            }
            return;
        }
        const sel = allSelectedPaths();
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
            if (sel.length) copyToClipboard(sel);
            return;
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "x") {
            if (sel.length) cutToClipboard(sel);
            return;
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
            const sel2 = allSelectedPaths();
            if (sel2.length) { e.preventDefault(); downloadSelected(sel2); return; }
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
            pasteTo(currentPasteTarget());
            return;
        }
        if (e.key === "Delete" || e.key === "Suppr") {
            if (sel.length) trashSelected(sel);
            return;
        }
        if (e.key === "F2") {
            if (sel.length) renameFirstSelected();
            return;
        }
        if (e.key === "Enter") {
            if (allSelectedNodes().length) openFirstSelected();
        }
    }

    tickClock();
    const clockTimer = setInterval(tickClock, 10000);
    initFS()
        .then(() => {
            fsOk = true;
            refreshUserEntries();
            refreshTrashState();
        })
        .catch(() => {});
    renderDesktop();
    refreshTrashState();
    // auto plein écran (évite la barre d'adresse qui réapparaît au hover en F11 navigateur)
    try { if (localStorage.getItem("cp.autoFullscreen") !== "0" && !document.fullscreenElement && document.hasTransientActivation) root.requestFullscreen?.({ navigationUI: "hide" }); } catch {}
    document.addEventListener("fullscreenchange", () => { document.body.classList.toggle("is-fullscreen", !!document.fullscreenElement); });

    return {
        unmount() {
            clearInterval(clockTimer);
            document.removeEventListener("keydown", onKey);
            document.removeEventListener("mousedown", onDocDown);
            root.innerHTML = "";
            root.hidden = true;
        },
        openModule,
        openFolder,
        openTaskManager,
        openControlPanel,
        refresh: refreshModules,
    };
}

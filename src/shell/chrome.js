import { el } from "./utils.js?v=1";
import { DEFAULTS, MODULES } from "./constants.js?v=1";
import {
    programSvg,
    controlPrefSvg,
    controlCheckSvg,
    controlThemeSvg,
    systemFolderSvg,
    trashEmptySvg,
    trashFullSvg,
    explorerDesktopSvg,
    folderSvg,
    trashSvg,
} from "./icons.js?v=1";
import { listCorbeille } from "./fs.js?v=11";

export function createChrome(ctx, deps = {}) {
    const VIEW_KEY = "cp.showIcons";
    const POS_KEY = "cp.freePositions";
    const WALL_KEY = "cp.wallpaper";
    const SIZE_KEY = "cp.iconSize";
    const DISP_KEY = "cp.desktopDisplay";
    const ARR_KEY = "cp.desktopArrange";
    const DESK_ICON_EXPLORER_KEY = "cp.desktopIconExplorer";
    const DESK_ICON_CORBEILLE_KEY = "cp.desktopIconCorbeille";
    const DESK_ICON_CONTROLPANEL_KEY = "cp.desktopIconControlPanel";
    const DESK_ICON_INFO_KEY = "cp.desktopIconInfo";
    const START_EXPLORER_KEY = "cp.startExplorer";
    const START_CORBEILLE_KEY = "cp.startCorbeille";
    const START_BUREAU_KEY = "cp.startBureau";
    const START_APPS_KEY = "cp.startApps";
    const START_DOSSIERS_KEY = "cp.startDossiers";
    const START_SEARCH_KEY = "cp.startSearch";
    const START_THEME_KEY = "cp.startTheme";
    const START_PREFS_KEY = "cp.startPrefs";
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
    const TABLE_GRID_KEY = "cp.tableGrid";

    const _v = (k, d) => { const v = localStorage.getItem(k); return v === null ? d : v !== "0"; };
    const _v1 = (k, d) => { const v = localStorage.getItem(k); return v === null ? d : v === "1"; };

    if (ctx.display === undefined) {
        let v = localStorage.getItem(DISP_KEY);
        if (!["folders", "all"].includes(v)) v = DEFAULTS.display;
        ctx.display = v;
    }
    if (ctx.arrange === undefined) {
        let v = localStorage.getItem(ARR_KEY);
        if (!["auto", "grid", "free"].includes(v)) v = DEFAULTS.arrange;
        ctx.arrange = v;
    }
    if (ctx.showIcons === undefined) ctx.showIcons = _v(VIEW_KEY, DEFAULTS.showIcons);
    if (ctx.showExt === undefined) ctx.showExt = _v("cp.showExt", DEFAULTS.showExt);
    if (ctx.deskIconExplorer === undefined) ctx.deskIconExplorer = _v1(DESK_ICON_EXPLORER_KEY, DEFAULTS.deskExplorer);
    if (ctx.deskIconCorbeille === undefined) ctx.deskIconCorbeille = _v(DESK_ICON_CORBEILLE_KEY, DEFAULTS.deskCorbeille);
    if (ctx.deskIconControlPanel === undefined) ctx.deskIconControlPanel = _v1(DESK_ICON_CONTROLPANEL_KEY, DEFAULTS.deskControlPanel);
    if (ctx.deskIconInfo === undefined) ctx.deskIconInfo = _v1(DESK_ICON_INFO_KEY, DEFAULTS.deskInfo);
    if (ctx.trashHasItems === undefined) ctx.trashHasItems = false;
    if (ctx.startExplorer === undefined) ctx.startExplorer = _v1(START_EXPLORER_KEY, DEFAULTS.startExplorer);
    if (ctx.startCorbeille === undefined) ctx.startCorbeille = _v1(START_CORBEILLE_KEY, DEFAULTS.startCorbeille);
    if (ctx.startBureau === undefined) ctx.startBureau = _v(START_BUREAU_KEY, DEFAULTS.startBureau);
    if (ctx.startApps === undefined) ctx.startApps = _v(START_APPS_KEY, DEFAULTS.startApps);
    if (ctx.startDossiers === undefined) ctx.startDossiers = _v(START_DOSSIERS_KEY, DEFAULTS.startDossiers);
    if (ctx.startSearch === undefined) ctx.startSearch = _v(START_SEARCH_KEY, DEFAULTS.startSearch);
    if (ctx.startTheme === undefined) ctx.startTheme = _v(START_THEME_KEY, DEFAULTS.startTheme);
    if (ctx.startPrefs === undefined) ctx.startPrefs = _v(START_PREFS_KEY, DEFAULTS.startPrefs);
    if (ctx.leftNewFolder === undefined) ctx.leftNewFolder = _v(LEFT_NEWFOLDER_KEY, DEFAULTS.leftNewFolder);
    if (ctx.leftNewFile === undefined) ctx.leftNewFile = _v(LEFT_NEWFILE_KEY, DEFAULTS.leftNewFile);
    if (ctx.leftImport === undefined) ctx.leftImport = _v(LEFT_IMPORT_KEY, DEFAULTS.leftImport);
    if (ctx.leftPaste === undefined) ctx.leftPaste = _v(LEFT_PASTE_KEY, DEFAULTS.leftPaste);
    if (ctx.leftExplorer === undefined) ctx.leftExplorer = _v(LEFT_EXPLORER_KEY, DEFAULTS.leftExplorer);
    if (ctx.leftCorbeille === undefined) ctx.leftCorbeille = _v(LEFT_CORBEILLE_KEY, DEFAULTS.leftCorbeille);
    if (ctx.leftDisplayFolders === undefined) ctx.leftDisplayFolders = _v(LEFT_DISPLAYFOLDERS_KEY, DEFAULTS.leftDisplayFolders);
    if (ctx.leftDisplayAll === undefined) ctx.leftDisplayAll = _v(LEFT_DISPLAYALL_KEY, DEFAULTS.leftDisplayAll);
    if (ctx.leftArrangeAuto === undefined) ctx.leftArrangeAuto = _v(LEFT_ARRANGEAUTO_KEY, DEFAULTS.leftArrangeAuto);
    if (ctx.leftArrangeGrid === undefined) ctx.leftArrangeGrid = _v(LEFT_ARRANGEGRID_KEY, DEFAULTS.leftArrangeGrid);
    if (ctx.leftArrangeFree === undefined) ctx.leftArrangeFree = _v(LEFT_ARRANGEFREE_KEY, DEFAULTS.leftArrangeFree);
    if (ctx.leftSort === undefined) ctx.leftSort = _v(LEFT_SORT_KEY, DEFAULTS.leftSort);
    if (ctx.leftAlign === undefined) ctx.leftAlign = _v(LEFT_ALIGN_KEY, DEFAULTS.leftAlign);
    if (ctx.leftViewIcons === undefined) ctx.leftViewIcons = _v(LEFT_VIEWICONS_KEY, DEFAULTS.leftViewIcons);
    if (ctx.leftControlPanel === undefined) ctx.leftControlPanel = _v(LEFT_CONTROLPANEL_KEY, DEFAULTS.leftControlPanel);
    if (ctx.leftTaskMgr === undefined) ctx.leftTaskMgr = _v(LEFT_TASKMGR_KEY, DEFAULTS.leftTaskMgr);
    if (ctx.leftRefresh === undefined) ctx.leftRefresh = _v(LEFT_REFRESH_KEY, DEFAULTS.leftRefresh);
    if (ctx.tableGrid === undefined) ctx.tableGrid = _v(TABLE_GRID_KEY, DEFAULTS.tableGrid);
    if (ctx.startOpen === undefined) ctx.startOpen = false;
    if (ctx.taskmgrRender === undefined) ctx.taskmgrRender = null;
    if (ctx.clockTimer === undefined) ctx.clockTimer = null;
    if (ctx.sortMode === undefined) ctx.sortMode = "name";
    if (ctx.MODULES === undefined) ctx.MODULES = MODULES;

    const MODE_LABELS = ctx.MODE_LABELS || {
        "display-folders": "Bureau : dossiers",
        "display-all": "Bureau : toutes les icônes",
        "arrange-auto": "Alignement automatique",
        "arrange-grid": "Grille",
        "arrange-free": "Libre",
    };
    ctx.MODE_LABELS = MODE_LABELS;

    const get = (name) => (deps[name] !== undefined ? deps[name] : ctx[name]);

    // ensure DOM: taskbar / clock / startMenu / ctxMenu / leftMenu
    // if ctx already has them, reuse; otherwise create minimal ones
    if (!ctx.taskbar) {
        ctx.taskbar = el("div", "taskbar");
        ctx.startBtn = document.createElement("button");
        ctx.startBtn.className = "taskbar-start";
        ctx.startBtn.textContent = (ctx.theme && ctx.theme.startLabel) || "Démarrer";
        ctx.tasksEl = el("div", "taskbar-windows");
        ctx.tray = el("div", "taskbar-tray");
        const fsBtn = document.createElement("button");
        fsBtn.type = "button"; fsBtn.textContent = "⛶"; fsBtn.title = "Plein écran (F11)";
        fsBtn.style.marginRight = "4px"; fsBtn.style.padding = "0 6px";
        fsBtn.addEventListener("click", () => { const fn = get("toggleFullscreen"); if (fn) fn(); });
        ctx.clock = document.createElement("span");
        ctx.clock.className = "taskbar-clock";
        ctx.clock.style.cursor = "pointer";
        ctx.clock.addEventListener("click", () => openClockWindow());
        ctx.clock.addEventListener("dblclick", () => openControlPanel());
        ctx.clock.addEventListener("contextmenu", (e) => { e.preventDefault(); openControlPanel(); });
        ctx.tray.append(fsBtn, ctx.clock);
        ctx.taskbar.append(ctx.startBtn, ctx.tasksEl, ctx.tray);
        if (ctx.root) ctx.root.append(ctx.taskbar);
        if (ctx.surface && !ctx.surface.contains(ctx.taskbar)) ctx.root?.append(ctx.surface, ctx.taskbar);
    }
    if (!ctx.startMenu) {
        ctx.startMenu = el("div", "start-menu window");
        ctx.startMenu.hidden = true;
        ctx.startMenu.innerHTML = `
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
                <button type="button" data-act="display-folders" class="start-item"><span class="start-item-icon">${folderSvg()}</span><span class="start-item-text"></span></button>
                <button type="button" data-act="display-all" class="start-item"><span class="start-item-icon">${programSvg()}</span><span class="start-item-text"></span></button>
                <button type="button" data-act="arrange-auto" class="start-item"><span class="start-item-icon">${programSvg()}</span><span class="start-item-text"></span></button>
                <button type="button" data-act="arrange-grid" class="start-item"><span class="start-item-icon">${programSvg()}</span><span class="start-item-text"></span></button>
                <button type="button" data-act="arrange-free" class="start-item"><span class="start-item-icon">${programSvg()}</span><span class="start-item-text"></span></button>
            </div>
            <button type="button" data-act="explorer" class="start-item"><span class="start-item-icon">${explorerDesktopSvg()}</span><span class="start-item-text">Explorateur</span></button>
            <button type="button" data-act="corbeille" class="start-item"><span class="start-item-icon">${trashSvg()}</span><span class="start-item-text">Corbeille</span></button>
            <hr class="start-sep" id="sep-2">
            <div class="start-themes-section"><div class="start-label">Thèmes</div><div class="start-themes"></div></div>
            <hr class="start-sep" id="sep-3">
            <div class="start-apps">
                <button type="button" data-act="controlpanel" class="start-item"><span class="start-item-icon">${programSvg()}</span><span class="start-item-text">Panneau de configuration</span></button>
                <button type="button" data-act="taskmgr" class="start-item"><span class="start-item-icon">${programSvg()}</span><span class="start-item-text">Gestionnaire des tâches</span></button>
                <button type="button" data-act="info" class="start-item"><span class="start-item-icon">${programSvg()}</span><span class="start-item-text">Plus d'info</span></button>
            </div>
            <hr class="start-sep" id="sep-4">
            <div class="start-prefs-wrap"><div class="start-label">Menu Démarré</div><div class="start-prefs"></div></div>
        </div>`;
        if (ctx.surface) ctx.surface.append(ctx.startMenu);
        else ctx.root?.append(ctx.startMenu);
    }
    if (!ctx.ctxMenu) {
        ctx.ctxMenu = el("div", "desktop-ctx window");
        ctx.ctxMenu.hidden = true;
        if (ctx.surface) ctx.surface.append(ctx.ctxMenu);
    }
    if (!ctx.leftMenu) {
        ctx.leftMenu = el("div", "desktop-ctx window desktop-left-menu");
        ctx.leftMenu.hidden = true;
        if (ctx.surface) ctx.surface.append(ctx.leftMenu);
    }
    // helpers that may be in ctx/deps
    function renderDesktop() { const fn = get("renderDesktop"); if (fn) fn(); }
    function refreshTrashStateInner() { return refreshTrashState(); }

    function applyStartPrefs() {
        const sm = ctx.startMenu;
        if (!sm) return;
        sm.querySelector(".start-search-box").hidden = !ctx.startSearch;
        sm.querySelector(".start-dossiers").hidden = !ctx.startDossiers;
        sm.querySelector(".start-bureau").hidden = !ctx.startBureau;
        sm.querySelector('[data-act="explorer"]').hidden = !ctx.startExplorer;
        sm.querySelector('[data-act="corbeille"]').hidden = !ctx.startCorbeille;
        sm.querySelector(".start-themes-section").hidden = !ctx.startTheme;
        sm.querySelector(".start-apps").hidden = !ctx.startApps;
        sm.querySelector(".start-prefs-wrap").hidden = !ctx.startPrefs;
        sm.querySelector("#sep-0").hidden = !(ctx.startSearch || ctx.startDossiers);
        sm.querySelector("#sep-1").hidden = !(ctx.startDossiers || ctx.startBureau || ctx.startExplorer || ctx.startCorbeille);
        sm.querySelector("#sep-2").hidden = !(ctx.startBureau || ctx.startExplorer || ctx.startCorbeille || ctx.startTheme);
        sm.querySelector("#sep-3").hidden = !(ctx.startTheme || ctx.startApps);
        sm.querySelector("#sep-4").hidden = !(ctx.startApps || ctx.startPrefs);
        buildStartPrefs();
    }
    function setStartExplorer(v) { ctx.startExplorer = v; localStorage.setItem(START_EXPLORER_KEY, v ? "1" : "0"); applyStartPrefs(); }
    function setStartCorbeille(v) { ctx.startCorbeille = v; localStorage.setItem(START_CORBEILLE_KEY, v ? "1" : "0"); applyStartPrefs(); }
    function setStartBureau(v) { ctx.startBureau = v; localStorage.setItem(START_BUREAU_KEY, v ? "1" : "0"); applyStartPrefs(); }
    function setStartApps(v) { ctx.startApps = v; localStorage.setItem(START_APPS_KEY, v ? "1" : "0"); applyStartPrefs(); }
    function setStartDossiers(v) { ctx.startDossiers = v; localStorage.setItem(START_DOSSIERS_KEY, v ? "1" : "0"); applyStartPrefs(); }
    function setStartSearch(v) { ctx.startSearch = v; localStorage.setItem(START_SEARCH_KEY, v ? "1" : "0"); applyStartPrefs(); }
    function setStartTheme(v) { ctx.startTheme = v; localStorage.setItem(START_THEME_KEY, v ? "1" : "0"); applyStartPrefs(); }
    function setStartPrefs(v) { ctx.startPrefs = v; localStorage.setItem(START_PREFS_KEY, v ? "1" : "0"); applyStartPrefs(); }

    function setLeftPref(key, setter) {
        return (v) => {
            setter(v);
            localStorage.setItem(key, v ? "1" : "0");
            buildLeftMenu();
            buildCtx();
        };
    }
    const setLeftNewFolder = setLeftPref(LEFT_NEWFOLDER_KEY, (v) => ctx.leftNewFolder = v);
    const setLeftNewFile = setLeftPref(LEFT_NEWFILE_KEY, (v) => ctx.leftNewFile = v);
    const setLeftImport = setLeftPref(LEFT_IMPORT_KEY, (v) => ctx.leftImport = v);
    const setLeftPaste = setLeftPref(LEFT_PASTE_KEY, (v) => ctx.leftPaste = v);
    const setLeftExplorer = setLeftPref(LEFT_EXPLORER_KEY, (v) => ctx.leftExplorer = v);
    const setLeftCorbeille = setLeftPref(LEFT_CORBEILLE_KEY, (v) => ctx.leftCorbeille = v);
    const setLeftDisplayFolders = setLeftPref(LEFT_DISPLAYFOLDERS_KEY, (v) => ctx.leftDisplayFolders = v);
    const setLeftDisplayAll = setLeftPref(LEFT_DISPLAYALL_KEY, (v) => ctx.leftDisplayAll = v);
    const setLeftArrangeAuto = setLeftPref(LEFT_ARRANGEAUTO_KEY, (v) => ctx.leftArrangeAuto = v);
    const setLeftArrangeGrid = setLeftPref(LEFT_ARRANGEGRID_KEY, (v) => ctx.leftArrangeGrid = v);
    const setLeftArrangeFree = setLeftPref(LEFT_ARRANGEFREE_KEY, (v) => ctx.leftArrangeFree = v);
    const setLeftSort = setLeftPref(LEFT_SORT_KEY, (v) => ctx.leftSort = v);
    const setLeftAlign = setLeftPref(LEFT_ALIGN_KEY, (v) => ctx.leftAlign = v);
    const setLeftViewIcons = setLeftPref(LEFT_VIEWICONS_KEY, (v) => ctx.leftViewIcons = v);
    const setLeftControlPanel = setLeftPref(LEFT_CONTROLPANEL_KEY, (v) => ctx.leftControlPanel = v);
    const setLeftTaskMgr = setLeftPref(LEFT_TASKMGR_KEY, (v) => ctx.leftTaskMgr = v);
    const setLeftRefresh = setLeftPref(LEFT_REFRESH_KEY, (v) => ctx.leftRefresh = v);

    function setShowIcons(v) {
        ctx.showIcons = v;
        localStorage.setItem(VIEW_KEY, v ? "1" : "0");
        renderDesktop();
        updateCtxViewLabel();
        buildLeftMenu();
    }
    function setDeskIconExplorer(v) { ctx.deskIconExplorer = v; localStorage.setItem(DESK_ICON_EXPLORER_KEY, v ? "1" : "0"); renderDesktop(); }
    function setDeskIconCorbeille(v) { ctx.deskIconCorbeille = v; localStorage.setItem(DESK_ICON_CORBEILLE_KEY, v ? "1" : "0"); renderDesktop(); }
    function setDeskIconControlPanel(v) { ctx.deskIconControlPanel = v; localStorage.setItem(DESK_ICON_CONTROLPANEL_KEY, v ? "1" : "0"); renderDesktop(); }
    function setDeskIconInfo(v) { ctx.deskIconInfo = v; localStorage.setItem(DESK_ICON_INFO_KEY, v ? "1" : "0"); renderDesktop(); }

    function makePrefToggle(label, getVal, setVal) {
        const row = document.createElement("label");
        row.className = "control-row";
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = !!getVal();
        const name = el("span", "control-name");
        name.textContent = label;
        const state = el("span", "control-state");
        state.className = "control-state " + (cb.checked ? "on" : "off");
        state.textContent = cb.checked ? "activé" : "désactivé";
        cb.addEventListener("change", () => {
            setVal(cb.checked);
            state.className = "control-state " + (cb.checked ? "on" : "off");
            state.textContent = cb.checked ? "activé" : "désactivé";
        });
        row.append(cb, name, state);
        return row;
    }
    function buildStartPrefs() {
        const box = ctx.startMenu.querySelector(".start-prefs");
        if (!box) return;
        box.innerHTML = "";
        box.appendChild(makePrefToggle("Dossiers dans le menu Démarré", () => ctx.startDossiers, (v) => setStartDossiers(v)));
        box.appendChild(makePrefToggle("Barre de recherche dans le menu Démarré", () => ctx.startSearch, (v) => setStartSearch(v)));
        box.appendChild(makePrefToggle("Explorateur dans le menu Démarré", () => ctx.startExplorer, (v) => setStartExplorer(v)));
        box.appendChild(makePrefToggle("Corbeille dans le menu Démarré", () => ctx.startCorbeille, (v) => setStartCorbeille(v)));
        box.appendChild(makePrefToggle("Préférences du Bureau dans le menu Démarré", () => ctx.startBureau, (v) => setStartBureau(v)));
        box.appendChild(makePrefToggle("Thème dans le menu Démarré", () => ctx.startTheme, (v) => setStartTheme(v)));
        box.appendChild(makePrefToggle("Applications dans le menu Démarré", () => ctx.startApps, (v) => setStartApps(v)));
        box.appendChild(makePrefToggle("Préférence dans le menu Démarré", () => ctx.startPrefs, (v) => setStartPrefs(v)));
    }

    function buildLeftMenu() {
        const leftMenu = ctx.leftMenu;
        if (!leftMenu) return;
        leftMenu.innerHTML = "";
        const addBtn = (act, label, hidden) => {
            if (hidden) return;
            const b = document.createElement("button");
            b.type = "button";
            b.dataset.act = act;
            b.textContent = label;
            leftMenu.appendChild(b);
        };
        const hasNewGroup = ctx.leftNewFolder || ctx.leftNewFile || ctx.leftImport || ctx.leftPaste;
        const hasNavGroup = ctx.leftExplorer || ctx.leftCorbeille;
        const hasDisplayGroup = ctx.leftDisplayFolders || ctx.leftDisplayAll;
        const hasArrangeGroup = ctx.leftArrangeAuto || ctx.leftArrangeGrid || ctx.leftArrangeFree || ctx.leftSort || ctx.leftAlign || ctx.leftViewIcons;
        const hasSystemGroup = ctx.leftControlPanel || ctx.leftTaskMgr || ctx.leftRefresh;
        if (hasNewGroup) {
            addBtn("newfolder", "Nouveau dossier", !ctx.leftNewFolder);
            addBtn("newfile", "Nouveau fichier texte", !ctx.leftNewFile);
            addBtn("import", "Importer des fichiers...", !ctx.leftImport);
            addBtn("paste", "Coller", !ctx.leftPaste);
        }
        if (hasNewGroup && (hasNavGroup || hasDisplayGroup || hasArrangeGroup || hasSystemGroup)) {
            const hr = document.createElement("hr"); hr.className = "start-sep"; leftMenu.appendChild(hr);
        }
        if (hasNavGroup) {
            addBtn("explorer", "Explorateur", !ctx.leftExplorer);
            addBtn("corbeille", "Corbeille", !ctx.leftCorbeille);
        }
        if (hasNavGroup && (hasDisplayGroup || hasArrangeGroup || hasSystemGroup)) {
            const hr = document.createElement("hr"); hr.className = "start-sep"; leftMenu.appendChild(hr);
        }
        if (hasDisplayGroup) {
            if (ctx.leftDisplayFolders) addBtn("display-folders", (ctx.display === "folders" ? "✓ " : "") + MODE_LABELS["display-folders"], false);
            if (ctx.leftDisplayAll) addBtn("display-all", (ctx.display === "all" ? "✓ " : "") + MODE_LABELS["display-all"], false);
        }
        if (hasDisplayGroup && (hasArrangeGroup || hasSystemGroup)) {
            const hr = document.createElement("hr"); hr.className = "start-sep"; leftMenu.appendChild(hr);
        }
        if (hasArrangeGroup) {
            addBtn("arrange-auto", (ctx.arrange === "auto" ? "✓ " : "") + MODE_LABELS["arrange-auto"], !ctx.leftArrangeAuto);
            addBtn("arrange-grid", (ctx.arrange === "grid" ? "✓ " : "") + MODE_LABELS["arrange-grid"], !ctx.leftArrangeGrid);
            addBtn("arrange-free", (ctx.arrange === "free" ? "✓ " : "") + MODE_LABELS["arrange-free"], !ctx.leftArrangeFree);
            addBtn("sort", "Trier par ▸", !ctx.leftSort);
            addBtn("align", "Aligner les icônes", !ctx.leftAlign);
            if (ctx.leftViewIcons) {
                const vBtn = document.createElement("button");
                vBtn.type = "button";
                vBtn.dataset.act = "viewicons";
                vBtn.textContent = (ctx.showIcons ? "✓ " : "") + "Afficher les icônes du bureau";
                leftMenu.appendChild(vBtn);
            }
        }
        if (hasArrangeGroup && hasSystemGroup) {
            const hr = document.createElement("hr"); hr.className = "start-sep"; leftMenu.appendChild(hr);
        }
        if (hasSystemGroup) {
            addBtn("controlpanel", "Panneau de configuration", !ctx.leftControlPanel);
            addBtn("taskmgr", "Gestionnaire des tâches", !ctx.leftTaskMgr);
            addBtn("refresh", "Actualiser", !ctx.leftRefresh);
        }
        const pasteBtn = leftMenu.querySelector('[data-act="paste"]');
        if (pasteBtn) pasteBtn.disabled = !ctx.clipboard || !ctx.clipboard.items.length;
    }

    function buildCtx() {
        const c = ctx.ctxMenu;
        if (!c) return;
        c.innerHTML = "";
        const add = (act, label, hidden) => {
            if (hidden) return;
            const b = document.createElement("button");
            b.type = "button";
            b.dataset.act = act;
            b.textContent = label;
            c.appendChild(b);
        };
        const hasNew = ctx.leftNewFolder || ctx.leftNewFile || ctx.leftImport || ctx.leftPaste;
        const hasNav = ctx.leftExplorer || ctx.leftCorbeille;
        const hasDisplay = ctx.leftDisplayFolders || ctx.leftDisplayAll;
        const hasArrange = ctx.leftArrangeAuto || ctx.leftArrangeGrid || ctx.leftArrangeFree || ctx.leftSort || ctx.leftAlign || ctx.leftViewIcons;
        const hasSystem = ctx.leftControlPanel || ctx.leftTaskMgr || ctx.leftRefresh;
        if (hasNew) {
            add("newfolder", "Nouveau dossier", !ctx.leftNewFolder);
            add("newfile", "Nouveau fichier texte", !ctx.leftNewFile);
            add("import", "Importer des fichiers...", !ctx.leftImport);
            add("paste", "Coller", !ctx.leftPaste);
        }
        if (hasNew && (hasNav || hasDisplay || hasArrange || hasSystem)) {
            const hr = document.createElement("hr"); hr.className = "start-sep"; c.appendChild(hr);
        }
        if (hasNav) {
            add("explorer", "Explorateur", !ctx.leftExplorer);
            add("corbeille", "Corbeille", !ctx.leftCorbeille);
        }
        if (hasNav && (hasDisplay || hasArrange || hasSystem)) {
            const hr = document.createElement("hr"); hr.className = "start-sep"; c.appendChild(hr);
        }
        if (hasDisplay) {
            if (ctx.leftDisplayFolders) add("display-folders", (ctx.display === "folders" ? "✓ " : "") + MODE_LABELS["display-folders"], false);
            if (ctx.leftDisplayAll) add("display-all", (ctx.display === "all" ? "✓ " : "") + MODE_LABELS["display-all"], false);
        }
        if (hasDisplay && (hasArrange || hasSystem)) {
            const hr = document.createElement("hr"); hr.className = "start-sep"; c.appendChild(hr);
        }
        if (hasArrange) {
            add("arrange-auto", (ctx.arrange === "auto" ? "✓ " : "") + MODE_LABELS["arrange-auto"], !ctx.leftArrangeAuto);
            add("arrange-grid", (ctx.arrange === "grid" ? "✓ " : "") + MODE_LABELS["arrange-grid"], !ctx.leftArrangeGrid);
            add("arrange-free", (ctx.arrange === "free" ? "✓ " : "") + MODE_LABELS["arrange-free"], !ctx.leftArrangeFree);
            add("sort", "Trier par ▸", !ctx.leftSort);
            add("align", "Aligner les icônes", !ctx.leftAlign);
            if (ctx.leftViewIcons) {
                const b = document.createElement("button"); b.type = "button"; b.dataset.act = "viewicons";
                b.textContent = (ctx.showIcons ? "✓ " : "") + "Afficher les icônes du bureau";
                c.appendChild(b);
            }
        }
        if (hasArrange && hasSystem) {
            const hr = document.createElement("hr"); hr.className = "start-sep"; c.appendChild(hr);
        }
        if (hasSystem) {
            add("controlpanel", "Panneau de configuration", !ctx.leftControlPanel);
            add("taskmgr", "Gestionnaire des tâches", !ctx.leftTaskMgr);
            add("refresh", "Actualiser", !ctx.leftRefresh);
        }
        updateCtxViewLabel();
    }

    function updateCtxViewLabel() {
        buildLeftMenu();
        const c = ctx.ctxMenu;
        const lm = ctx.leftMenu;
        const v1 = c ? c.querySelector('[data-act="viewicons"]') : null;
        if (v1) v1.textContent = (ctx.showIcons ? "✓ " : "") + "Afficher les icônes du bureau";
        const v2 = lm ? lm.querySelector('[data-act="viewicons"]') : null;
        if (v2) v2.textContent = (ctx.showIcons ? "✓ " : "") + "Afficher les icônes du bureau";
        const paste = c ? c.querySelector('[data-act="paste"]') : null;
        if (paste) paste.disabled = !ctx.clipboard || !ctx.clipboard.items.length;
        const paste2 = lm ? lm.querySelector('[data-act="paste"]') : null;
        if (paste2) paste2.disabled = !ctx.clipboard || !ctx.clipboard.items.length;
        syncModeMarks();
    }

    function syncModeMarks() {
        const active = {
            "display-folders": ctx.display === "folders",
            "display-all": ctx.display === "all",
            "arrange-auto": ctx.arrange === "auto",
            "arrange-grid": ctx.arrange === "grid",
            "arrange-free": ctx.arrange === "free",
        };
        for (const [act, label] of Object.entries(MODE_LABELS)) {
            const text = (active[act] ? "✓ " : "") + label;
            const c = ctx.ctxMenu && ctx.ctxMenu.querySelector(`[data-act="${act}"]`);
            if (c) c.textContent = text;
            const l = ctx.leftMenu && ctx.leftMenu.querySelector(`[data-act="${act}"]`);
            if (l) l.textContent = text;
            const s = ctx.startMenu && ctx.startMenu.querySelector(`[data-act="${act}"] .start-item-text`);
            if (s) s.textContent = text;
        }
    }

    function buildStartTags() {
        const tagsBox = ctx.startMenu ? ctx.startMenu.querySelector(".start-tags") : null;
        if (!tagsBox) return;
        tagsBox.innerHTML = "";
        const mod = document.createElement("button");
        mod.type = "button";
        mod.classList.add("start-item");
        mod.innerHTML = `<span class="start-item-icon">${systemFolderSvg()}</span><span class="start-item-text"></span>`;
        mod.querySelector(".start-item-text").textContent = "Modules";
        mod.addEventListener("click", () => {
            closeStart();
            const fn = get("openFolder"); if (fn) fn(MODULES);
        });
        tagsBox.appendChild(mod);
        const tags = ctx.tags || [...new Set((ctx.modules || []).flatMap((m) => m.tags || []))].sort((a, b) => a.localeCompare(b, "fr"));
        ctx.tags = tags;
        for (const tag of tags) {
            const b = document.createElement("button");
            b.type = "button";
            b.classList.add("start-item");
            b.innerHTML = `<span class="start-item-icon">${systemFolderSvg()}</span><span class="start-item-text"></span>`;
            b.querySelector(".start-item-text").textContent = tag;
            b.addEventListener("click", () => {
                closeStart();
                const fn = get("openFolder"); if (fn) fn(tag);
            });
            tagsBox.appendChild(b);
        }
    }

    function openControlPanel() {
        const createWindow = get("createWindow");
        const windows = ctx.windows;
        if (!createWindow || !windows) return;
        const winId = "control";
        const existed = windows.has(winId);
        const rec = createWindow({ id: winId, title: "Panneau de configuration", kind: "control", width: 520, height: 470 });
        if (existed) return;
        rec.body.innerHTML = "";
        rec.body.classList.add("control-body");
        const nav = el("div", "control-nav");
        const backBtn = document.createElement("button");
        backBtn.type = "button"; backBtn.textContent = "← Retour";
        nav.appendChild(backBtn);
        const content = el("div", "control-content");
        rec.body.append(nav, content);
        const views = {};
        function go(view) {
            for (const key in views) views[key].hidden = key !== view;
            backBtn.hidden = view === "root";
        }
        const rootEl = el("div", "control-root");
        const items = [
            ["prefs", "Préférence", "Taille des icônes, extensions de fichiers", controlPrefSvg()],
            ["modules", "Truc actif", "Activer ou masquer les modules", controlCheckSvg()],
            ["theme", "Thème", "Apparence du bureau, couleur du fond", controlThemeSvg()],
        ];
        for (const [key, name, desc, svg] of items) {
            const item = el("button", "control-item");
            item.type = "button";
            item.innerHTML = `<span class="control-item-icon">${svg}</span><span class="control-item-text"><span class="control-item-name"></span><span class="control-item-desc"></span></span>`;
            item.querySelector(".control-item-name").textContent = name;
            item.querySelector(".control-item-desc").textContent = desc;
            item.addEventListener("click", () => go(key));
            rootEl.appendChild(item);
        }
        views.root = rootEl;
        const prefs = el("div", "control-tabpanel");
        buildPrefsSection(prefs);
        views.prefs = prefs;
        const modulesPanel = el("div", "control-tabpanel");
        buildModulesSection(modulesPanel);
        views.modules = modulesPanel;
        const themePanel = el("div", "control-tabpanel");
        buildThemeSection(themePanel);
        views.theme = themePanel;
        content.append(rootEl, prefs, modulesPanel, themePanel);
        backBtn.addEventListener("click", () => go("root"));
        go("root");
    }

    function buildPrefsSection(container) {
        const sysGroup = el("div", "control-group");
        const sysTitle = el("div", "control-group-title"); sysTitle.textContent = "Système"; sysGroup.appendChild(sysTitle);
        const rowSize = el("div", "control-row");
        const sizeLabel = el("span", "control-name"); sizeLabel.textContent = "Taille des icônes"; rowSize.appendChild(sizeLabel);
        const sizes = [["small", "Petite"], ["med", "Moyenne"], ["large", "Grande"], ["xlarge", "Très grande"]];
        const cur = localStorage.getItem(SIZE_KEY) || DEFAULTS.iconSize;
        for (const [val, text] of sizes) {
            const b = document.createElement("button"); b.type = "button"; b.textContent = text; b.disabled = cur === val;
            b.addEventListener("click", () => {
                const fn = get("setIconSize"); if (fn) fn(val); else { localStorage.setItem(SIZE_KEY, val); }
                sysGroup.querySelectorAll("button").forEach((x) => (x.disabled = false)); b.disabled = true;
            });
            rowSize.appendChild(b);
        }
        sysGroup.appendChild(rowSize);
        const getShowExt = () => ctx.showExt;
        const setShowExt = (v) => { const fn = get("setShowExt"); if (fn) fn(v); else { ctx.showExt = v; localStorage.setItem("cp.showExt", v ? "1" : "0"); } };
        sysGroup.appendChild(makePrefToggle("Extensions de fichiers", getShowExt, setShowExt));
        container.appendChild(sysGroup);

        const menuGroup = el("div", "control-group");
        const menuTitle = el("div", "control-group-title"); menuTitle.textContent = "Menu Démarré"; menuGroup.appendChild(menuTitle);
        const startToggles = [
            ["Dossiers dans le menu Démarré", () => ctx.startDossiers, (v) => setStartDossiers(v)],
            ["Barre de recherche dans le menu Démarré", () => ctx.startSearch, (v) => setStartSearch(v)],
            ["Explorateur dans le menu Démarré", () => ctx.startExplorer, (v) => setStartExplorer(v)],
            ["Corbeille dans le menu Démarré", () => ctx.startCorbeille, (v) => setStartCorbeille(v)],
            ["Préférences du Bureau dans le menu Démarré", () => ctx.startBureau, (v) => setStartBureau(v)],
            ["Thème dans le menu Démarré", () => ctx.startTheme, (v) => setStartTheme(v)],
            ["Applications dans le menu Démarré", () => ctx.startApps, (v) => setStartApps(v)],
            ["Préférence dans le menu Démarré", () => ctx.startPrefs, (v) => setStartPrefs(v)],
        ];
        for (const [label, getVal, setVal] of startToggles) menuGroup.appendChild(makePrefToggle(label, getVal, setVal));
        container.appendChild(menuGroup);

        const bureauGroup = el("div", "control-group");
        const bureauTitle = el("div", "control-group-title"); bureauTitle.textContent = "Bureau"; bureauGroup.appendChild(bureauTitle);
        bureauGroup.appendChild(makePrefToggle("Afficher les icônes du bureau", () => ctx.showIcons, (v) => setShowIcons(v)));
        bureauGroup.appendChild(makePrefToggle("Corbeille sur le bureau", () => ctx.deskIconCorbeille, (v) => setDeskIconCorbeille(v)));
        bureauGroup.appendChild(makePrefToggle("Explorateur sur le bureau", () => ctx.deskIconExplorer, (v) => setDeskIconExplorer(v)));
        bureauGroup.appendChild(makePrefToggle("Panneau de configuration sur le bureau", () => ctx.deskIconControlPanel, (v) => setDeskIconControlPanel(v)));
        bureauGroup.appendChild(makePrefToggle("Plus d'info sur le bureau", () => ctx.deskIconInfo, (v) => setDeskIconInfo(v)));
        const rowDisplay = el("div", "control-row");
        const dispLabel = el("span", "control-name"); dispLabel.textContent = "Affichage"; rowDisplay.appendChild(dispLabel);
        for (const [val, text] of [["folders", "Dossiers"], ["all", "Toutes les icônes"]]) {
            const b = document.createElement("button"); b.type = "button"; b.textContent = text; b.disabled = ctx.display === val;
            b.addEventListener("click", () => {
                const fn = get("setDisplay"); if (fn) fn(val); else { ctx.display = val; localStorage.setItem(DISP_KEY, val); }
                bureauGroup.querySelectorAll("button").forEach((x) => { if (x.textContent === "Dossiers" || x.textContent === "Toutes les icônes") x.disabled = false; });
                b.disabled = true; buildLeftMenu();
            });
            rowDisplay.appendChild(b);
        }
        bureauGroup.appendChild(rowDisplay);
        const rowArrange = el("div", "control-row");
        const arrLabel = el("span", "control-name"); arrLabel.textContent = "Alignement"; rowArrange.appendChild(arrLabel);
        for (const [val, text] of [["auto", "Automatique"], ["grid", "Grille"], ["free", "Libre"]]) {
            const b = document.createElement("button"); b.type = "button"; b.textContent = text; b.disabled = ctx.arrange === val;
            b.addEventListener("click", () => {
                const fn = get("setArrange"); if (fn) fn(val); else { ctx.arrange = val; localStorage.setItem(ARR_KEY, val); }
                bureauGroup.querySelectorAll("button").forEach((x) => { if (["Automatique", "Grille", "Libre"].includes(x.textContent)) x.disabled = false; });
                b.disabled = true; buildLeftMenu();
            });
            rowArrange.appendChild(b);
        }
        bureauGroup.appendChild(rowArrange);
        const rowBureauActions = el("div", "control-row");
        const alignBtn = document.createElement("button"); alignBtn.type = "button"; alignBtn.textContent = "Aligner les icônes";
        alignBtn.addEventListener("click", () => { const fn = get("alignIcons"); if (fn) fn(); });
        rowBureauActions.appendChild(alignBtn);
        const refreshBtn = document.createElement("button"); refreshBtn.type = "button"; refreshBtn.textContent = "Actualiser";
        refreshBtn.addEventListener("click", () => renderDesktop());
        rowBureauActions.appendChild(refreshBtn);
        bureauGroup.appendChild(rowBureauActions);
        container.appendChild(bureauGroup);

        const leftGroup = el("div", "control-group");
        const leftTitle = el("div", "control-group-title"); leftTitle.textContent = "Clic gauche (bureau vide)"; leftGroup.appendChild(leftTitle);
        const leftToggles = [
            ["Nouveau dossier", () => ctx.leftNewFolder, setLeftNewFolder],
            ["Nouveau fichier texte", () => ctx.leftNewFile, setLeftNewFile],
            ["Importer des fichiers...", () => ctx.leftImport, setLeftImport],
            ["Coller", () => ctx.leftPaste, setLeftPaste],
            ["Explorateur", () => ctx.leftExplorer, setLeftExplorer],
            ["Corbeille", () => ctx.leftCorbeille, setLeftCorbeille],
            ["Bureau : dossiers", () => ctx.leftDisplayFolders, setLeftDisplayFolders],
            ["Bureau : toutes les icônes", () => ctx.leftDisplayAll, setLeftDisplayAll],
            ["Alignement automatique", () => ctx.leftArrangeAuto, setLeftArrangeAuto],
            ["Grille", () => ctx.leftArrangeGrid, setLeftArrangeGrid],
            ["Libre", () => ctx.leftArrangeFree, setLeftArrangeFree],
            ["Trier par", () => ctx.leftSort, setLeftSort],
            ["Aligner les icônes", () => ctx.leftAlign, setLeftAlign],
            ["Afficher les icônes du bureau", () => ctx.leftViewIcons, setLeftViewIcons],
            ["Panneau de configuration", () => ctx.leftControlPanel, setLeftControlPanel],
            ["Gestionnaire des tâches", () => ctx.leftTaskMgr, setLeftTaskMgr],
            ["Actualiser", () => ctx.leftRefresh, setLeftRefresh],
        ];
        for (const [label, getVal, setVal] of leftToggles) leftGroup.appendChild(makePrefToggle(label, getVal, setVal));
        container.appendChild(leftGroup);

        const baseGroup = el("div", "control-group");
        const baseTitle = el("div", "control-group-title"); baseTitle.textContent = "Préférences de base"; baseGroup.appendChild(baseTitle);
        const baseDesc = el("div", "control-name"); baseDesc.style.padding = "2px 4px"; baseDesc.style.fontSize = "11px"; baseDesc.style.whiteSpace = "normal";
        baseDesc.textContent = "Choisir le profil par défaut. Ça réinitialise toutes les préférences (icônes, taille, bureau, menu, clic gauche)."; baseGroup.appendChild(baseDesc);
        const baseRow = el("div", "control-row");
        const btnDefault = document.createElement("button"); btnDefault.type = "button"; btnDefault.textContent = "Par défaut (recommandé)";
        const btnMinimal = document.createElement("button"); btnMinimal.type = "button"; btnMinimal.textContent = "Minimal";
        const btnFull = document.createElement("button"); btnFull.type = "button"; btnFull.textContent = "Tout afficher";
        const btnReset = document.createElement("button"); btnReset.type = "button"; btnReset.textContent = "Réinitialiser";
        const applyBase = (preset) => {
            const defaults = { ...DEFAULTS };
            if (preset === "minimal") {
                defaults.startDossiers = false; defaults.startSearch = false; defaults.startBureau = false; defaults.startTheme = false; defaults.startApps = false; defaults.startPrefs = false; defaults.deskCorbeille = false;
                Object.keys(defaults).forEach(k => { if (k.startsWith("left")) defaults[k] = false; });
            }
            if (preset === "full") {
                defaults.deskExplorer = true; defaults.deskControlPanel = true; defaults.deskInfo = true; defaults.startExplorer = true; defaults.startCorbeille = true;
                Object.keys(defaults).forEach(k => { if (k.startsWith("left")) defaults[k] = true; });
            }
            if (preset === "reset") {
                Object.keys(localStorage).forEach(k => { if (k.startsWith("cp.")) localStorage.removeItem(k); });
                location.reload(); return;
            }
            localStorage.setItem(VIEW_KEY, defaults.showIcons ? "1" : "0"); localStorage.setItem(SIZE_KEY, defaults.iconSize); localStorage.setItem("cp.showExt", defaults.showExt ? "1" : "0");
            localStorage.setItem(DESK_ICON_EXPLORER_KEY, defaults.deskExplorer ? "1" : "0"); localStorage.setItem(DESK_ICON_CORBEILLE_KEY, defaults.deskCorbeille ? "1" : "0"); localStorage.setItem(DESK_ICON_CONTROLPANEL_KEY, defaults.deskControlPanel ? "1" : "0"); localStorage.setItem(DESK_ICON_INFO_KEY, defaults.deskInfo ? "1" : "0");
            localStorage.setItem(DISP_KEY, defaults.display); localStorage.setItem(ARR_KEY, defaults.arrange);
            localStorage.setItem(START_DOSSIERS_KEY, defaults.startDossiers ? "1" : "0"); localStorage.setItem(START_SEARCH_KEY, defaults.startSearch ? "1" : "0"); localStorage.setItem(START_BUREAU_KEY, defaults.startBureau ? "1" : "0"); localStorage.setItem(START_EXPLORER_KEY, defaults.startExplorer ? "1" : "0"); localStorage.setItem(START_CORBEILLE_KEY, defaults.startCorbeille ? "1" : "0"); localStorage.setItem(START_THEME_KEY, defaults.startTheme ? "1" : "0"); localStorage.setItem(START_APPS_KEY, defaults.startApps ? "1" : "0"); localStorage.setItem(START_PREFS_KEY, defaults.startPrefs ? "1" : "0");
            localStorage.setItem(LEFT_NEWFOLDER_KEY, defaults.leftNewFolder ? "1" : "0"); localStorage.setItem(LEFT_NEWFILE_KEY, defaults.leftNewFile ? "1" : "0"); localStorage.setItem(LEFT_IMPORT_KEY, defaults.leftImport ? "1" : "0"); localStorage.setItem(LEFT_PASTE_KEY, defaults.leftPaste ? "1" : "0");
            localStorage.setItem(LEFT_EXPLORER_KEY, defaults.leftExplorer ? "1" : "0"); localStorage.setItem(LEFT_CORBEILLE_KEY, defaults.leftCorbeille ? "1" : "0");
            localStorage.setItem(LEFT_DISPLAYFOLDERS_KEY, defaults.leftDisplayFolders ? "1" : "0"); localStorage.setItem(LEFT_DISPLAYALL_KEY, defaults.leftDisplayAll ? "1" : "0");
            localStorage.setItem(LEFT_ARRANGEAUTO_KEY, defaults.leftArrangeAuto ? "1" : "0"); localStorage.setItem(LEFT_ARRANGEGRID_KEY, defaults.leftArrangeGrid ? "1" : "0"); localStorage.setItem(LEFT_ARRANGEFREE_KEY, defaults.leftArrangeFree ? "1" : "0");
            localStorage.setItem(LEFT_SORT_KEY, defaults.leftSort ? "1" : "0"); localStorage.setItem(LEFT_ALIGN_KEY, defaults.leftAlign ? "1" : "0"); localStorage.setItem(LEFT_VIEWICONS_KEY, defaults.leftViewIcons ? "1" : "0");
            localStorage.setItem(LEFT_CONTROLPANEL_KEY, defaults.leftControlPanel ? "1" : "0"); localStorage.setItem(LEFT_TASKMGR_KEY, defaults.leftTaskMgr ? "1" : "0"); localStorage.setItem(LEFT_REFRESH_KEY, defaults.leftRefresh ? "1" : "0");
            localStorage.setItem(TABLE_GRID_KEY, defaults.tableGrid ? "1" : "0");
            location.reload();
        };
        btnDefault.addEventListener("click", () => applyBase("default"));
        btnMinimal.addEventListener("click", () => applyBase("minimal"));
        btnFull.addEventListener("click", () => applyBase("full"));
        btnReset.addEventListener("click", () => applyBase("reset"));
        baseRow.append(btnDefault, btnMinimal, btnFull, btnReset);
        baseGroup.appendChild(baseRow);
        const fsRow = el("div", "control-row");
        fsRow.appendChild(makePrefToggle("Plein écran auto au démarrage", () => localStorage.getItem("cp.autoFullscreen") !== "0", (v) => localStorage.setItem("cp.autoFullscreen", v ? "1" : "0")));
        const fsNow = document.createElement("button"); fsNow.type = "button"; fsNow.textContent = "Passer en plein écran (F11)"; fsNow.addEventListener("click", () => { const fn = get("toggleFullscreen"); if (fn) fn(); });
        fsRow.appendChild(fsNow);
        baseGroup.appendChild(fsRow);
        const gridPrefRow = el("div", "control-row");
        const getGrid = () => ctx.tableGrid;
        const setGrid = (v) => { const fn = get("setTableGrid"); if (fn) fn(v); else { ctx.tableGrid = v; localStorage.setItem(TABLE_GRID_KEY, v ? "1" : "0"); } };
        gridPrefRow.appendChild(makePrefToggle("Grille du tableau (convertisseur)", getGrid, setGrid));
        baseGroup.appendChild(gridPrefRow);
        container.appendChild(baseGroup);
    }

    function buildModulesSection(container) {
        const toolbar = el("div", "control-toolbar");
        const onBtn = document.createElement("button"); onBtn.type = "button"; onBtn.textContent = "Tout activer";
        const offBtn = document.createElement("button"); offBtn.type = "button"; offBtn.textContent = "Tout désactiver";
        toolbar.append(onBtn, offBtn);
        const list = el("div", "control-list");
        const applyAll = (hidden) => {
            const all = ctx.all || ctx.catalog || ctx.modules || [];
            for (const m of all) { if (m.visibility !== "off") { const fn = get("setHidden"); if (fn) fn(m.id, hidden); } }
            buildControlList(list);
            const fn = get("refreshModules"); if (fn) fn(); else renderDesktop();
        };
        onBtn.addEventListener("click", () => applyAll(false));
        offBtn.addEventListener("click", () => applyAll(true));
        container.append(toolbar, list);
        buildControlList(list);
    }

    function buildThemeSection(container) {
        const rowTheme = el("div", "control-row");
        const themeLabel = el("span", "control-name"); themeLabel.textContent = "Thème";
        rowTheme.appendChild(themeLabel);
        const themes = ctx.themes || [];
        for (const t of themes) {
            const b = document.createElement("button"); b.type = "button"; b.textContent = t.name; b.disabled = t.id === (ctx.theme && ctx.theme.id);
            b.addEventListener("click", () => { const fn = get("onSwitchTheme"); if (fn) fn(t.id); });
            rowTheme.appendChild(b);
        }
        container.appendChild(rowTheme);
        const rowWall = el("div", "control-row");
        const wallLabel = el("span", "control-name"); wallLabel.textContent = "Couleur du fond";
        const color = document.createElement("input"); color.type = "color";
        color.value = localStorage.getItem(WALL_KEY) || (ctx.theme && ctx.theme.wallpaper) || "#008080";
        color.addEventListener("input", () => {
            const fn = get("setWallpaper"); if (fn) fn(color.value); else { if (ctx.root) ctx.root.style.setProperty("--desktop-wallpaper", color.value); localStorage.setItem(WALL_KEY, color.value); }
        });
        const defBtn = document.createElement("button"); defBtn.type = "button"; defBtn.textContent = "Par défaut";
        defBtn.addEventListener("click", () => {
            const w = (ctx.theme && ctx.theme.wallpaper) || "#008080";
            color.value = w;
            const fn = get("setWallpaper"); if (fn) fn(w); else { if (ctx.root) ctx.root.style.setProperty("--desktop-wallpaper", w); localStorage.setItem(WALL_KEY, w); }
        });
        rowWall.append(wallLabel, color, defBtn);
        container.appendChild(rowWall);
    }

    function buildControlList(container) {
        container.innerHTML = "";
        const all = ctx.all || ctx.catalog || ctx.modules || [];
        const isHidden = get("isHidden");
        const setHidden = get("setHidden");
        for (const m of all) {
            const isOff = m.visibility === "off";
            const hidden = isHidden ? isHidden(m) : isOff;
            const row = el("label", "control-row");
            const cb = document.createElement("input"); cb.type = "checkbox"; cb.checked = !hidden; cb.disabled = isOff;
            const name = el("span", "control-name"); name.textContent = m.name;
            const tagsEl = el("small", "control-tags"); tagsEl.textContent = (m.tags || []).map((t) => `#${t}`).join(" ");
            const state = el("span", "control-state"); state.className = "control-state " + (isOff || hidden ? "off" : "on"); state.textContent = isOff ? "désactivé" : hidden ? "masqué" : "activé";
            row.append(cb, name, tagsEl, state);
            cb.addEventListener("change", () => {
                if (setHidden) setHidden(m.id, !cb.checked);
                state.className = "control-state " + (isOff || !cb.checked ? "off" : "on");
                state.textContent = isOff ? "désactivé" : cb.checked ? "activé" : "masqué";
                const fn = get("refreshModules"); if (fn) fn(); else renderDesktop();
            });
            container.appendChild(row);
        }
    }

    function closeStart() { ctx.startOpen = false; if (ctx.startMenu) ctx.startMenu.hidden = true; }
    function toggleStart() {
        ctx.startOpen = !ctx.startOpen;
        if (ctx.startMenu) ctx.startMenu.hidden = !ctx.startOpen;
        if (ctx.ctxMenu) ctx.ctxMenu.hidden = true;
        if (ctx.startOpen && ctx.startMenu) { const inp = ctx.startMenu.querySelector(".start-search"); if (inp) inp.focus(); }
    }

    async function refreshTrashState() {
        try {
            const list = await listCorbeille();
            const has = list.length > 0;
            if (has !== ctx.trashHasItems) {
                ctx.trashHasItems = has;
                const iconsEl = ctx.iconsEl;
                const node = iconsEl ? iconsEl.querySelector('.desktop-icon[data-id="corbeille"]') : null;
                if (node) {
                    const old = node.querySelector('.icon-gfx');
                    if (old) { const tmp = document.createElement('div'); tmp.innerHTML = has ? trashFullSvg() : trashEmptySvg(); const nxt = tmp.firstElementChild; if (nxt) old.replaceWith(nxt); }
                }
                const startIcon = ctx.startMenu ? ctx.startMenu.querySelector('[data-act="corbeille"] .start-item-icon') : null;
                if (startIcon) startIcon.innerHTML = has ? trashFullSvg() : trashEmptySvg();
            } else ctx.trashHasItems = has;
        } catch {}
    }

    function tickClock() {
        if (!ctx.clock) return;
        const d = new Date();
        ctx.clock.textContent = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
        ctx.clock.title = d.toLocaleString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
    }
    function openClockWindow() {
        const createWindow = get("createWindow");
        const focusWindow = get("focusWindow");
        const windows = ctx.windows;
        if (!createWindow || !windows) return;
        const winId = "clock";
        if (windows.has(winId)) { if (focusWindow) focusWindow(winId); return; }
        const rec = createWindow({ id: winId, title: "Horloge", kind: "clock", width: 320, height: 240 });
        const renderClock = () => {
            const d = new Date();
            const t = rec.body.querySelector('.clock-time');
            const da = rec.body.querySelector('.clock-date');
            if (t) t.textContent = d.toLocaleTimeString("fr-FR");
            if (da) da.textContent = d.toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
        };
        const d = new Date();
        rec.body.innerHTML = `<div style="padding:12px;text-align:center"><div class="clock-time" style="font-size:28px">${d.toLocaleTimeString("fr-FR")}</div><div class="clock-date">${d.toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div><button type="button" data-act="clock-refresh" style="margin-top:12px">Actualiser</button></div>`;
        const btn = rec.body.querySelector('[data-act="clock-refresh"]');
        if (btn) btn.addEventListener("click", renderClock);
    }

    function openTaskManager() {
        const createWindow = get("createWindow");
        const closeWindow = get("closeWindow");
        const focusWindow = get("focusWindow");
        const windows = ctx.windows;
        if (!createWindow || !windows) return;
        const id = "taskmgr";
        const rec = createWindow({ id, title: "Gestionnaire des tâches", kind: "taskmgr", width: 480, height: 400 });
        rec.body.innerHTML = "";
        rec.body.classList.add("taskmgr-body");
        const header = el("div", "taskmgr-header");
        const list = el("div", "taskmgr-list sunken-panel");
        const actions = el("div", "taskmgr-actions");
        const refreshBtn = document.createElement("button"); refreshBtn.type = "button"; refreshBtn.textContent = "Actualiser";
        refreshBtn.addEventListener("click", render);
        const closeBtn = document.createElement("button"); closeBtn.type = "button"; closeBtn.textContent = "Fermer";
        closeBtn.addEventListener("click", () => { ctx.taskmgrRender = null; if (closeWindow) closeWindow(id); });
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
                const label = document.createElement("span"); label.className = "taskmgr-name"; label.textContent = other.title;
                const activate = document.createElement("button"); activate.type = "button"; activate.textContent = "Activer";
                activate.addEventListener("click", () => { if (focusWindow) focusWindow(winId); });
                const end = document.createElement("button"); end.type = "button"; end.textContent = "Terminer";
                end.addEventListener("click", () => { if (closeWindow) closeWindow(winId); });
                row.append(label, activate, end);
                list.appendChild(row);
            }
        }
        ctx.taskmgrRender = render;
        render();
    }

    function onDocDown(e) {
        if (ctx.startMenu && ctx.startBtn && !ctx.startMenu.contains(e.target) && !ctx.startBtn.contains(e.target)) closeStart();
        if (ctx.ctxMenu && !ctx.ctxMenu.contains(e.target)) ctx.ctxMenu.hidden = true;
        if (ctx.leftMenu && !ctx.leftMenu.contains(e.target)) ctx.leftMenu.hidden = true;
    }
    function onKey(e) {
        const toggleFullscreen = get("toggleFullscreen");
        if (e.key === "F11") { e.preventDefault(); if (toggleFullscreen) toggleFullscreen(); return; }
        if (e.metaKey && (e.ctrlKey || e.shiftKey)) { e.preventDefault(); toggleStart(); return; }
        if (e.key === "Escape") { closeStart(); if (ctx.ctxMenu) ctx.ctxMenu.hidden = true; if (ctx.leftMenu) ctx.leftMenu.hidden = true; return; }
        const tag = (e.target && e.target.tagName) || "";
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || e.target?.isContentEditable) {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") return;
            return;
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
            e.preventDefault();
            let targetGrid = null;
            let topZ = -1;
            const windows = ctx.windows;
            if (windows) {
                for (const [, w] of windows) {
                    const g = w.el.querySelector('.explorer-icons');
                    if (g) { const z = parseInt(w.el.style.zIndex || "0", 10); if (z > topZ) { topZ = z; targetGrid = g; } }
                }
            }
            const activeTask = document.querySelector('.task-btn.active-task');
            if (activeTask && windows) {
                const rec = windows.get(activeTask.dataset.win);
                const g = rec?.el.querySelector('.explorer-icons');
                if (g) targetGrid = g;
            }
            if (!targetGrid || targetGrid.closest('.wm-window.minimized')) targetGrid = ctx.iconsEl;
            let icons = targetGrid ? [...targetGrid.querySelectorAll(".desktop-icon")] : [];
            if (!icons.length && targetGrid !== ctx.iconsEl && ctx.iconsEl) {
                icons = [...ctx.iconsEl.querySelectorAll(".desktop-icon")];
                targetGrid = ctx.iconsEl;
            }
            if (icons.length) {
                const clearSelection = get("clearSelection");
                const iconsOf = get("iconsOf");
                if (clearSelection) clearSelection();
                if (iconsOf && targetGrid) {
                    const s = iconsOf(targetGrid);
                    icons.forEach(n => { s.add(n); n.classList.add("selected"); });
                } else {
                    icons.forEach(n => n.classList.add("selected"));
                }
                ctx.selAnchor = icons[icons.length - 1];
            }
            return;
        }
        const allSelectedPaths = get("allSelectedPaths");
        const sel = allSelectedPaths ? allSelectedPaths() : [];
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") { if (sel.length) { const fn = get("copyToClipboard"); if (fn) fn(sel); } return; }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "x") { if (sel.length) { const fn = get("cutToClipboard"); if (fn) fn(sel); } return; }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
            const sel2 = allSelectedPaths ? allSelectedPaths() : [];
            if (sel2.length) { e.preventDefault(); const fn = get("downloadSelected"); if (fn) fn(sel2); return; }
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") { const fn = get("pasteTo"); const targetFn = get("currentPasteTarget"); const dir = targetFn ? targetFn() : (ctx.HOME || ""); if (fn) fn(dir); return; }
        if (e.key === "Delete" || e.key === "Suppr") { if (sel.length) { const fn = get("trashSelected"); if (fn) fn(sel); } return; }
        if (e.key === "F2") { if (sel.length) { const fn = get("renameFirstSelected"); if (fn) fn(); } return; }
        if (e.key === "Enter") { const nodesFn = get("allSelectedNodes"); const nodes = nodesFn ? nodesFn() : []; if (nodes.length) { const fn = get("openFirstSelected"); if (fn) fn(); } }
    }

    // init state
    applyStartPrefs();
    buildLeftMenu();
    buildCtx();
    buildStartTags();
    // theme tags
    if (ctx.themes && ctx.startMenu) {
        const themesBox = ctx.startMenu.querySelector(".start-themes");
        if (themesBox) {
            themesBox.innerHTML = "";
            for (const t of ctx.themes) {
                const b = document.createElement("button");
                b.type = "button"; b.classList.add("start-item");
                b.innerHTML = `<span class="start-item-icon">${programSvg()}</span><span class="start-item-text"></span>`;
                b.querySelector(".start-item-text").textContent = t.name;
                if (t.id === (ctx.theme && ctx.theme.id)) b.disabled = true;
                b.addEventListener("click", () => { closeStart(); const fn = get("onSwitchTheme"); if (fn) fn(t.id); });
                themesBox.appendChild(b);
            }
        }
    }

    // wire chrome events
    function handleDesktopAction(act) {
        const setDisplay = get("setDisplay");
        const setArrange = get("setArrange");
        const createNewItem = get("createNewItem");
        const pickFiles = get("pickFiles");
        const pasteTo = get("pasteTo");
        const openExplorer = get("openExplorer");
        const openCorbeille = get("openCorbeille");
        const alignIcons = get("alignIcons");
        if (act === "display-folders" && setDisplay) setDisplay("folders");
        if (act === "display-all" && setDisplay) setDisplay("all");
        if (act === "arrange-auto" && setArrange) setArrange("auto");
        if (act === "arrange-grid" && setArrange) setArrange("grid");
        if (act === "arrange-free" && setArrange) setArrange("free");
        if (act === "newfolder" && createNewItem) createNewItem("folder", ctx.HOME || "");
        if (act === "newfile" && createNewItem) createNewItem("file", ctx.HOME || "");
        if (act === "import" && pickFiles) pickFiles(ctx.HOME || "", () => { const fn = get("refreshUserEntries"); if (fn) fn(); });
        if (act === "paste" && pasteTo) pasteTo(ctx.HOME || "");
        if (act === "explorer" && openExplorer) openExplorer("");
        if (act === "corbeille" && openCorbeille) openCorbeille();
        if (act === "sort") {
            if (ctx.leftMenu) {
                ctx.leftMenu.innerHTML = `<button type="button" data-act="sort-name">Trier par nom</button><button type="button" data-act="sort-type">Trier par type</button><button type="button" data-act="sort-back">← Retour</button>`;
                ctx.leftMenu.hidden = false;
            }
            return;
        }
        if (act === "sort-name") { ctx.sortMode = "name"; renderDesktop(); }
        if (act === "sort-type") { ctx.sortMode = "type"; renderDesktop(); }
        if (act === "sort-back") buildLeftMenu();
        if (act === "align" && alignIcons) alignIcons();
        if (act === "viewicons") setShowIcons(!ctx.showIcons);
        if (act === "controlpanel") openControlPanel();
        if (act === "taskmgr") openTaskManager();
        if (act === "refresh") renderDesktop();
        if (act !== "sort" && act !== "sort-back" && ctx.leftMenu) ctx.leftMenu.hidden = true;
        if (ctx.ctxMenu) ctx.ctxMenu.hidden = true;
    }

    if (ctx.leftMenu) {
        ctx.leftMenu.addEventListener("click", (e) => {
            e.stopPropagation();
            const act = e.target.closest("[data-act]")?.dataset.act;
            if (!act) return;
            handleDesktopAction(act);
            if (act !== "sort" && act !== "sort-back") ctx.leftMenu.hidden = true;
        });
    }

    const searchInput = ctx.startMenu ? ctx.startMenu.querySelector(".start-search") : null;
    const searchResults = ctx.startMenu ? ctx.startMenu.querySelector(".start-search-results") : null;
    if (searchInput && searchResults) {
        searchInput.addEventListener("input", () => {
            const q = searchInput.value.trim().toLowerCase();
            searchResults.innerHTML = "";
            if (!q) return;
            const modules = ctx.modules || ctx.all || [];
            const hits = modules.filter((m) => m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q) || (m.tags || []).some((t) => t.toLowerCase().includes(q))).slice(0, 8);
            for (const m of hits) {
                const b = document.createElement("button"); b.type = "button"; b.textContent = m.name;
                b.addEventListener("click", (e) => { const fn = get("openModule"); if (fn) fn(m.id, e.shiftKey); });
                searchResults.appendChild(b);
            }
        });
    }
    if (ctx.startMenu) {
        ctx.startMenu.addEventListener("click", (e) => {
            e.stopPropagation();
            const act = e.target.closest("[data-act]")?.dataset.act;
            const setDisplay = get("setDisplay");
            const setArrange = get("setArrange");
            const openExplorer = get("openExplorer");
            const openCorbeille = get("openCorbeille");
            const openModule = get("openModule");
            if (act === "display-folders" && setDisplay) setDisplay("folders");
            if (act === "display-all" && setDisplay) setDisplay("all");
            if (act === "arrange-auto" && setArrange) setArrange("auto");
            if (act === "arrange-grid" && setArrange) setArrange("grid");
            if (act === "arrange-free" && setArrange) setArrange("free");
            if (act === "controlpanel") openControlPanel();
            if (act === "taskmgr") openTaskManager();
            if (act === "info" && openModule) openModule("info");
            if (act === "explorer" && openExplorer) openExplorer("");
            if (act === "corbeille" && openCorbeille) openCorbeille();
        });
    }
    if (ctx.ctxMenu) {
        ctx.ctxMenu.addEventListener("click", (e) => {
            e.stopPropagation();
            const act = e.target.closest("[data-act]")?.dataset.act;
            const setDisplay = get("setDisplay");
            const setArrange = get("setArrange");
            const createNewItem = get("createNewItem");
            const pickFiles = get("pickFiles");
            const pasteTo = get("pasteTo");
            const openExplorer = get("openExplorer");
            const openCorbeille = get("openCorbeille");
            const alignIcons = get("alignIcons");
            if (act === "display-folders" && setDisplay) setDisplay("folders");
            if (act === "display-all" && setDisplay) setDisplay("all");
            if (act === "arrange-auto" && setArrange) setArrange("auto");
            if (act === "arrange-grid" && setArrange) setArrange("grid");
            if (act === "arrange-free" && setArrange) setArrange("free");
            if (act === "newfolder" && createNewItem) createNewItem("folder", ctx.HOME || "");
            if (act === "newfile" && createNewItem) createNewItem("file", ctx.HOME || "");
            if (act === "import" && pickFiles) pickFiles(ctx.HOME || "");
            if (act === "paste" && pasteTo) pasteTo(ctx.HOME || "");
            if (act === "explorer" && openExplorer) openExplorer("");
            if (act === "corbeille" && openCorbeille) openCorbeille();
            if (act === "align" && alignIcons) alignIcons();
            if (act === "viewicons") {
                ctx.showIcons = !ctx.showIcons;
                localStorage.setItem(VIEW_KEY, ctx.showIcons ? "1" : "0");
                if (ctx.iconsEl) ctx.iconsEl.hidden = !ctx.showIcons;
                updateCtxViewLabel();
            }
            if (act === "sort") {
                ctx.ctxMenu.innerHTML = `<button type="button" data-act="sort-name">Trier par nom</button><button type="button" data-act="sort-type">Trier par type</button><button type="button" data-act="sort-back">← Retour</button>`;
                return;
            }
            if (act === "sort-name") { ctx.sortMode = "name"; renderDesktop(); }
            if (act === "sort-type") { ctx.sortMode = "type"; renderDesktop(); }
            if (act === "sort-back") buildCtx();
            if (act === "controlpanel") openControlPanel();
            if (act === "taskmgr") openTaskManager();
            if (act === "refresh") renderDesktop();
            ctx.ctxMenu.hidden = true;
        });
    }
    if (ctx.startBtn) ctx.startBtn.addEventListener("click", (e) => { e.stopPropagation(); toggleStart(); });
    if (ctx.taskbar) {
        ctx.taskbar.addEventListener("contextmenu", (e) => {
            if (e.target.closest(".taskbar-start")) return;
            if (e.target.closest(".task-btn")) return;
            if (e.target.closest(".taskbar-tray")) return;
            e.preventDefault();
            closeStart();
            if (ctx.ctxMenu) ctx.ctxMenu.hidden = true;
            const tctx = el("div", "desktop-ctx window");
            if (ctx.root) ctx.root.appendChild(tctx);
            tctx.style.left = `${Math.min(e.clientX, window.innerWidth - 200)}px`;
            tctx.style.top = `${Math.max(0, e.clientY - (tctx.offsetHeight || 0))}px`;
            const btn = document.createElement("button"); btn.type = "button"; btn.textContent = "Gestionnaire des tâches";
            btn.addEventListener("click", () => { tctx.remove(); openTaskManager(); });
            tctx.appendChild(btn);
            const kill = (ev) => { if (!tctx.contains(ev.target)) { tctx.remove(); document.removeEventListener("mousedown", kill, true); } };
            document.addEventListener("mousedown", kill, true);
        });
    }

    // global listeners (attach once)
    if (!ctx._chromeListenersAttached) {
        ctx._chromeListenersAttached = true;
        document.addEventListener("mousedown", onDocDown);
        document.addEventListener("keydown", onKey);
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && document.fullscreenElement) {
                e.preventDefault(); e.stopImmediatePropagation();
                closeStart(); if (ctx.ctxMenu) ctx.ctxMenu.hidden = true; if (ctx.leftMenu) ctx.leftMenu.hidden = true;
            }
        }, true);
    }

    // clock
    tickClock();
    if (ctx.clockTimer) clearInterval(ctx.clockTimer);
    ctx.clockTimer = setInterval(tickClock, 10000);

    return {
        applyStartPrefs,
        setStartExplorer,
        setStartCorbeille,
        setStartBureau,
        setStartApps,
        setStartDossiers,
        setStartSearch,
        setStartTheme,
        setStartPrefs,
        setLeftPref,
        setLeftNewFolder,
        setLeftNewFile,
        setLeftImport,
        setLeftPaste,
        setLeftExplorer,
        setLeftCorbeille,
        setLeftDisplayFolders,
        setLeftDisplayAll,
        setLeftArrangeAuto,
        setLeftArrangeGrid,
        setLeftArrangeFree,
        setLeftSort,
        setLeftAlign,
        setLeftViewIcons,
        setLeftControlPanel,
        setLeftTaskMgr,
        setLeftRefresh,
        setShowIcons,
        setDeskIconExplorer,
        setDeskIconCorbeille,
        setDeskIconControlPanel,
        setDeskIconInfo,
        makePrefToggle,
        buildStartPrefs,
        buildLeftMenu,
        buildCtx,
        updateCtxViewLabel,
        syncModeMarks,
        buildStartTags,
        openControlPanel,
        buildPrefsSection,
        buildModulesSection,
        buildThemeSection,
        buildControlList,
        closeStart,
        toggleStart,
        refreshTrashState,
        tickClock,
        openClockWindow,
        openTaskManager,
        onDocDown,
        onKey,
    };
}

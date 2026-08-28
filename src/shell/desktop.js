/**
 * Shell bureau générique — façade de composition.
 * Le look vient du thème (classes window.*, CSS).
 * Modules : icons, constants, utils, window (WM), selection, desktop-grid,
 * explorer, viewers, chrome. Ce fichier crée le contexte partagé et branche tout.
 */

import { initFS } from "./fs.js?v=11";
import {
    folderSvg,
    programSvg,
    explorerDesktopSvg,
    trashSvg,
    systemFolderSvg,
} from "./icons.js?v=1";
import { MODULES, DEFAULTS } from "./constants.js?v=1";
import { el } from "./utils.js?v=1";
import { createWindowManager } from "./window.js?v=1";
import { createSelectionManager } from "./selection.js?v=1";
import { createDesktopGrid } from "./desktop-grid.js?v=1";
import { createExplorer } from "./explorer.js?v=1";
import { createViewers } from "./viewers.js?v=1";
import { createChrome } from "./chrome.js?v=1";

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
        getModules,
    } = options;

    // ---------- Contexte partagé ----------
    const ctx = {
        root,
        theme,
        themes: themes || [],
        basePath,
        onSwitchTheme,
        isHidden,
        setHidden,
        options,
        W: theme.window || {},
        modules: initialModules,
        all: catalog || initialModules,
        initialModules,
        tags: [...new Set(initialModules.flatMap((m) => m.tags || []))].sort((a, b) =>
            a.localeCompare(b, "fr")
        ),
        userEntries: [],
        windows: new Map(),
        folderWindowRenders: new Map(),
        zTop: 20,
        winSeq: 0,
        startOpen: false,
        taskmgrRender: null,
        sortMode: "name",
        fsOk: false,
        fileInput: null,
        clipboard: null,
        htmlDragPaths: [],
        selectedByContainer: new Map(),
        selAnchor: null,
        dragSuppressClick: false,
        trashHasItems: false,
        HOME: "Bureau",
        CORBEILLE: ".corbeille",
        MODULES,
    };

    // prefs localStorage -> ctx
    const _v = (k, d) => { const v = localStorage.getItem(k); return v === null ? d : v !== "0"; };
    const _v1 = (k, d) => { const v = localStorage.getItem(k); return v === null ? d : v === "1"; };
    let display = localStorage.getItem("cp.desktopDisplay");
    if (!["folders", "all"].includes(display)) display = DEFAULTS.display;
    let arrange = localStorage.getItem("cp.desktopArrange");
    if (!["auto", "grid", "free"].includes(arrange)) arrange = DEFAULTS.arrange;
    const legacyMode = localStorage.getItem("cp.desktopMode");
    if (legacyMode) {
        if (legacyMode === "folders") { display = "folders"; arrange = "auto"; }
        else if (legacyMode === "all") { display = "all"; arrange = "auto"; }
        else if (legacyMode === "free") { display = "all"; arrange = "free"; }
        localStorage.removeItem("cp.desktopMode");
        localStorage.setItem("cp.desktopDisplay", display);
        localStorage.setItem("cp.desktopArrange", arrange);
    }
    ctx.display = display;
    ctx.arrange = arrange;
    ctx.showIcons = _v("cp.showIcons", DEFAULTS.showIcons);
    ctx.showExt = _v("cp.showExt", DEFAULTS.showExt);
    ctx.deskIconExplorer = _v1("cp.desktopIconExplorer", DEFAULTS.deskExplorer);
    ctx.deskIconCorbeille = _v("cp.desktopIconCorbeille", DEFAULTS.deskCorbeille);
    ctx.deskIconControlPanel = _v1("cp.desktopIconControlPanel", DEFAULTS.deskControlPanel);
    ctx.deskIconInfo = _v1("cp.desktopIconInfo", DEFAULTS.deskInfo);
    ctx.startBureau = _v("cp.startBureau", DEFAULTS.startBureau);
    ctx.startApps = _v("cp.startApps", DEFAULTS.startApps);
    ctx.startDossiers = _v("cp.startDossiers", DEFAULTS.startDossiers);
    ctx.startSearch = _v("cp.startSearch", DEFAULTS.startSearch);
    if (localStorage.getItem("cp.startExtra") === "1") {
        ctx.startExplorer = true;
        ctx.startCorbeille = true;
        localStorage.removeItem("cp.startExtra");
    }

    // ---------- DOM racine ----------
    root.hidden = false;
    root.innerHTML = "";
    root.style.setProperty(
        "--desktop-wallpaper",
        localStorage.getItem("cp.wallpaper") || theme.wallpaper || "#008080"
    );

    const surface = el("div", "desktop-surface");
    const iconsEl = el("div", "desktop-icons");
    ctx.surface = surface;
    ctx.iconsEl = iconsEl;

    // ---------- Window manager ----------
    const wm = createWindowManager(ctx);

    // openModule est défini plus bas ; on le référence pour le WM (task-btn shift+click)
    ctx.openModuleRef = (id, forceNew) => api.openModule(id, forceNew);

    // ---------- Selection / desktop ----------
    const sm = createSelectionManager(ctx, {});
    Object.assign(ctx, {
        makeIcon: sm.makeIcon,
        iconsOf: sm.iconsOf,
        clearSelection: sm.clearSelection,
        selectIcon: sm.selectIcon,
        enableRubberBand: sm.enableRubberBand,
        clearDropTarget: sm.clearDropTarget,
        isDropFolder: sm.isDropFolder,
        enableIconDrag: sm.enableIconDrag,
        allSelectedEmpty: sm.allSelectedEmpty,
        updateCtxViewLabel: sm.updateCtxViewLabel,
        buildCtx: sm.buildCtx,
        buildLeftMenu: sm.buildLeftMenu,
        syncModeMarks: sm.syncModeMarks,
        handleDesktopAction: sm.handleDesktopAction,
        startHtmlDrag: sm.startHtmlDrag,
        readHtmlPaths: sm.readHtmlPaths,
        moveMany: sm.moveMany,
        containerPaths: sm.containerPaths,
        firstSelected: sm.firstSelected,
        updateCtxPaste: sm.updateCtxPaste,
        cutToClipboard: sm.cutToClipboard,
        copyToClipboard: sm.copyToClipboard,
        pasteTo: sm.pasteTo,
        allSelectedNodes: sm.allSelectedNodes,
        allSelectedPaths: sm.allSelectedPaths,
        currentPasteTarget: sm.currentPasteTarget,
        openFirstSelected: sm.openFirstSelected,
        renameFirstSelected: sm.renameFirstSelected,
        openIconTarget: sm.openIconTarget,
    });

    // ---------- Desktop grid ----------
    const grid = createDesktopGrid(ctx, {
        makeIcon: sm.makeIcon,
        openFolder: (...a) => explorer.openFolder(...a),
        openModule: (...a) => api.openModule(...a),
        openEntryPath: (...a) => openEntryPath(...a),
        openExplorer: (...a) => explorer.openExplorer(...a),
        openControlPanel: () => chrome.openControlPanel(),
        openCorbeille: () => explorer.openCorbeille(),
    });
    ctx.renderDesktop = grid.renderDesktop;
    ctx.sortModules = grid.sortModules;
    ctx.setDisplay = grid.setDisplay;
    ctx.setArrange = grid.setArrange;
    ctx.refreshModules = grid.refreshModules;
    ctx.applyIconSize = grid.applyIconSize;
    ctx.setIconSize = grid.setIconSize;
    ctx.setWallpaper = grid.setWallpaper;
    ctx.alignIcons = grid.alignIcons;
    ctx.displayName = grid.displayName;
    ctx.userIconKind = grid.userIconKind;
    ctx.visibleByTag = (tag) => ctx.modules.filter((m) => (m.tags || []).includes(tag));

    ctx.applyIconSize(localStorage.getItem("cp.iconSize") || DEFAULTS.iconSize);

    // ---------- Viewers ----------
    const viewers = createViewers(ctx, {
        createWindow: wm.createWindow,
        focusWindow: wm.focusWindow,
        closeWindow: wm.closeWindow,
        confirmDialog: wm.confirmDialog,
    });
    ctx.openFile = viewers.openFile;
    ctx.downloadSelected = viewers.downloadSelected;
    ctx.openProperties = viewers.openProperties;
    ctx.showPlaceholder = viewers.showPlaceholder;

    // ---------- Explorer ----------
    const explorer = createExplorer(ctx, {
        windowManager: wm,
        selectionManager: sm,
        fileCategoryUtils: {},
        downloadSelected: (...a) => viewers.downloadSelected(...a),
        openProperties: (...a) => viewers.openProperties(...a),
        showIconMenu: showIconMenu,
        openEntryPath: (...a) => openEntryPath(...a),
        openModule: (...a) => api.openModule(...a),
    });
    ctx.openFolder = explorer.openFolder;
    ctx.openExplorer = explorer.openExplorer;
    ctx.openCorbeille = explorer.openCorbeille;
    ctx.refreshFileWindows = explorer.refreshFileWindows;
    ctx.createNewItem = explorer.createNewItem;
    ctx.renameNode = explorer.renameNode;
    ctx.pickFiles = explorer.pickFiles;
    ctx.refreshUserEntries = explorer.refreshUserEntries;
    ctx.trashSelected = (paths) => {
        const list = (paths || []).filter(Boolean);
        if (!list.length) return;
        wm.confirmDialog(
            "Supprimer",
            `${list.length} élément${list.length > 1 ? "s" : ""} va${list.length > 1 ? "ent" : ""} être envoyé${list.length > 1 ? "s" : ""} à la Corbeille.`,
            async () => {
                const { trashEntries } = await import("./fs.js?v=11");
                await trashEntries(list);
                ctx.clipboard = null;
                await explorer.refreshUserEntries();
                explorer.refreshFileWindows();
                sm.updateCtxPaste();
            }
        );
    };

    async function openEntryPath(entry) {
        const { getEntry } = await import("./fs.js?v=11");
        const target = entry.kind === "shortcut" ? await getEntry(entry.target) : entry;
        if (!target) {
            viewers.showPlaceholder(entry.name, "La cible de ce raccourci est introuvable.");
            return;
        }
        if (target.kind === "folder") explorer.openExplorer(target.path);
        else viewers.openFile(target.path);
    }
    ctx.openEntryPath = openEntryPath;

    function setShowExt(v) {
        ctx.showExt = v;
        localStorage.setItem("cp.showExt", v ? "1" : "0");
        grid.renderDesktop();
        explorer.refreshFileWindows();
    }
    ctx.setShowExt = setShowExt;
    function setTableGrid(v) {
        ctx.tableGrid = v;
        localStorage.setItem("cp.tableGrid", v ? "1" : "0");
    }
    ctx.setTableGrid = setTableGrid;

    // ---------- Chrome (taskbar/startmenu/panneau/taskmgr) ----------
    const chrome = createChrome(ctx, {        createWindow: wm.createWindow,
        closeWindow: wm.closeWindow,
        focusWindow: wm.focusWindow,
        toggleFullscreen: wm.toggleFullscreen,
        renderDesktop: grid.renderDesktop,
        refreshModules: grid.refreshModules,
        setIconSize: grid.setIconSize,
        setShowExt,
        setTableGrid,
        setDisplay: grid.setDisplay,
        setArrange: grid.setArrange,
        alignIcons: grid.alignIcons,
        setWallpaper: grid.setWallpaper,
        onSwitchTheme,
        setHidden,
        isHidden,
        openFolder: (...a) => explorer.openFolder(...a),
        openExplorer: (...a) => explorer.openExplorer(...a),
        openCorbeille: () => explorer.openCorbeille(),
        openModule: (...a) => api.openModule(...a),
        createNewItem: (...a) => explorer.createNewItem(...a),
        pickFiles: (...a) => explorer.pickFiles(...a),
        pasteTo: sm.pasteTo,
        refreshUserEntries: () => explorer.refreshUserEntries(),
        refreshFileWindows: () => explorer.refreshFileWindows(),
        downloadSelected: (...a) => viewers.downloadSelected(...a),
        clearSelection: sm.clearSelection,
        iconsOf: sm.iconsOf,
        allSelectedPaths: sm.allSelectedPaths,
        allSelectedNodes: sm.allSelectedNodes,
        copyToClipboard: sm.copyToClipboard,
        cutToClipboard: sm.cutToClipboard,
        currentPasteTarget: sm.currentPasteTarget,
        trashSelected: ctx.trashSelected,
        renameFirstSelected: sm.renameFirstSelected,
        openFirstSelected: sm.openFirstSelected,
        makeIcon: sm.makeIcon,
        visibleByTag: ctx.visibleByTag,
    });
    ctx.chrome = chrome;
    ctx.ctxEl = chrome.ctxMenuEl || null;
    if (!ctx.ctxEl) {
        const cm = ctx.ctxMenu;
        if (cm) ctx.ctxEl = cm;
    }
    ctx.refreshTrashState = chrome.refreshTrashState;
    ctx.closeStart = chrome.closeStart;
    ctx.buildLeftMenu = chrome.buildLeftMenu;
    ctx.buildCtx = chrome.buildCtx;
    ctx.buildStartTags = chrome.buildStartTags;
    ctx.syncModeMarks = chrome.syncModeMarks;
    ctx.updateCtxViewLabel = chrome.updateCtxViewLabel;
    ctx.setShowIcons = chrome.setShowIcons;

    // ---------- Menu contextuel d'icône ----------
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
            sm.openIconTarget(node);
        });
        const rename = document.createElement("button");
        rename.type = "button";
        rename.textContent = "Renommer";
        rename.addEventListener("click", () => {
            menu.remove();
            explorer.renameNode(node);
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
            const cat = node.__entry ? node.__entry.mime || "" : "";
            const catName = cat.startsWith("image/") ? "image" : cat.startsWith("audio/") ? "audio" : cat.startsWith("video/") ? "video" : cat.startsWith("text/") ? "text" : /\.json$/i.test(node.__entry?.name || "") ? "json" : "other";
            const editors = ctx.modules.filter((m) => (m.openWith || []).includes(catName));
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
                    api.openModule(m.id);
                });
                menu.appendChild(b);
            }
        });
        const props = document.createElement("button");
        props.type = "button";
        props.textContent = "Propriétés";
        props.addEventListener("click", () => {
            menu.remove();
            const targets = [...sm.iconsOf(node.parentElement)];
            if (!targets.includes(node)) targets.push(node);
            viewers.openProperties(targets);
        });
        const cutBtn = document.createElement("button");
        cutBtn.type = "button";
        cutBtn.textContent = "Couper";
        cutBtn.addEventListener("click", () => {
            menu.remove();
            sm.cutToClipboard(sm.containerPaths(node.parentElement));
        });
        const copyBtn = document.createElement("button");
        copyBtn.type = "button";
        copyBtn.textContent = "Copier";
        copyBtn.addEventListener("click", () => {
            menu.remove();
            sm.copyToClipboard(sm.containerPaths(node.parentElement));
        });
        const pasteBtn = document.createElement("button");
        pasteBtn.type = "button";
        pasteBtn.textContent = "Coller";
        pasteBtn.disabled = !ctx.clipboard || !ctx.clipboard.items.length;
        pasteBtn.addEventListener("click", () => {
            menu.remove();
            const parent = node.closest(".explorer-icons")?.dataset.dir ?? "";
            sm.pasteTo(kind === "ufolder" && !(node.__entry && node.__entry.kind === "shortcut") ? id : parent);
        });
        const delBtn = document.createElement("button");
        delBtn.type = "button";
        delBtn.textContent = "Supprimer";
        delBtn.addEventListener("click", () => {
            menu.remove();
            ctx.trashSelected(sm.containerPaths(node.parentElement));
        });
        const mkLink = document.createElement("button");
        mkLink.type = "button";
        mkLink.textContent = "Créer un raccourci";
        mkLink.addEventListener("click", async () => {
            menu.remove();
            const dir = node.closest(".explorer-icons")?.dataset.dir ?? "";
            const { createShortcut, parentPath } = await import("./fs.js?v=11");
            await createShortcut(id, dir || parentPath(id));
            await explorer.refreshUserEntries();
            explorer.refreshFileWindows();
        });
        if (kind === "ufile") {
            var dlBtn = document.createElement("button");
            dlBtn.type = "button";
            dlBtn.textContent = "Télécharger";
            dlBtn.addEventListener("click", async () => {
                menu.remove();
                const sel = sm.containerPaths(node.parentElement);
                const list = sel.length ? sel : [id];
                await viewers.downloadSelected(list);
            });
        }
        if (kind === "trash") {
            const emptyBtn = document.createElement("button");
            emptyBtn.type = "button";
            emptyBtn.textContent = "Vider la corbeille";
            emptyBtn.disabled = !ctx.trashHasItems;
            emptyBtn.addEventListener("click", async () => {
                menu.remove();
                const { emptyTrash } = await import("./fs.js?v=11");
                await emptyTrash();
                await explorer.refreshUserEntries();
                explorer.refreshFileWindows();
                await chrome.refreshTrashState();
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
    ctx.showIconMenu = showIconMenu;

    // ---------- Montage DOM + interactions surface ----------
    surface.append(iconsEl, chrome.ctxMenuEl || ctx.ctxMenu, ctx.leftMenu, ctx.startMenu);
    root.append(surface, ctx.taskbar);
    ctx.leftMenu.addEventListener("click", (e) => {
        e.stopPropagation();
        const act = e.target.closest("[data-act]")?.dataset.act;
        if (!act) return;
        chrome.handleDesktopAction(act);
        ctx.leftMenu.hidden = true;
    });

    surface.addEventListener("click", (e) => {
        const isEmptyClick = !e.target.closest(".desktop-icon") && !e.target.closest(".wm-window") && !e.target.closest(".start-menu") && !e.target.closest(".desktop-ctx");
        const wasEmpty = sm.allSelectedEmpty();
        if (isEmptyClick && wasEmpty && !ctx.dragSuppressClick && e.button === 0) {
            e.preventDefault();
            e.stopPropagation();
            if (ctx.ctxMenu) ctx.ctxMenu.hidden = true;
            chrome.closeStart();
            chrome.buildLeftMenu();
            if (!ctx.leftMenu.children.length) {
                ctx.leftMenu.hidden = true;
                return;
            }
            ctx.leftMenu.hidden = false;
            const pad = 8;
            ctx.leftMenu.style.left = `${e.clientX}px`;
            ctx.leftMenu.style.top = `${e.clientY}px`;
            requestAnimationFrame(() => {
                const r = ctx.leftMenu.getBoundingClientRect();
                if (r.right > window.innerWidth - pad) ctx.leftMenu.style.left = `${Math.max(pad, window.innerWidth - r.width - pad)}px`;
                if (r.bottom > window.innerHeight - pad) ctx.leftMenu.style.top = `${Math.max(pad, window.innerHeight - r.height - pad)}px`;
            });
            return;
        }
        chrome.closeStart();
        if (ctx.ctxMenu) ctx.ctxMenu.hidden = true;
        ctx.leftMenu.hidden = true;
        sm.clearSelection();
    });

    document.addEventListener(
        "click",
        (e) => {
            if (ctx.dragSuppressClick) {
                e.preventDefault();
                e.stopPropagation();
                ctx.dragSuppressClick = false;
            }
        },
        true
    );

    surface.addEventListener("contextmenu", (e) => {
        if (e.target.closest(".wm-window") || e.target.closest(".start-menu")) return;
        e.preventDefault();
        chrome.closeStart();
        if (!ctx.ctxMenu) return;
        ctx.ctxMenu.hidden = false;
        ctx.ctxMenu.style.left = `${e.clientX}px`;
        ctx.ctxMenu.style.top = `${Math.min(e.clientY, window.innerHeight - 120)}px`;
    });

    sm.enableRubberBand(surface, ".desktop-icon");
    sm.enableIconDrag(surface);

    surface.addEventListener("dragover", (e) => {
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
    });
    surface.addEventListener("drop", async (e) => {
        e.preventDefault();
        const paths = sm.readHtmlPaths(e);
        ctx.htmlDragPaths = [];
        if (!paths.length) return;
        const folderIcon = e.target.closest('.desktop-icon[data-kind="ufolder"]');
        await sm.moveMany(paths, folderIcon ? folderIcon.dataset.id : ctx.HOME);
    });
    document.addEventListener("dragend", () => {
        ctx.htmlDragPaths = [];
    });

    // ---------- API publique ----------
    async function openModule(moduleId, forceNew) {
        const meta = ctx.all.find((m) => m.id === moduleId) || { id: moduleId, name: moduleId };
        let id = `mod:${moduleId}`;
        if (forceNew) {
            let n = 1;
            do {
                id = `mod:${moduleId}${n === 1 ? "" : `#${n}`}`;
                n++;
            } while (ctx.windows.has(id));
        }
        const existed = ctx.windows.has(id);
        const rec = wm.createWindow({
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
            rec.el.querySelector(`.${(theme.window || {}).titleBarText || "title-bar-text"}`).textContent = meta.name;
        }
        chrome.closeStart();
    }

    const api = {
        unmount() {
            clearInterval(ctx.clockTimer);
            root.innerHTML = "";
            root.hidden = true;
        },
        openModule,
        openFolder: explorer.openFolder,
        openTaskManager: chrome.openTaskManager,
        openControlPanel: chrome.openControlPanel,
        refresh: grid.refreshModules,
    };

    // ---------- Boot ----------
    initFS()
        .then(() => {
            ctx.fsOk = true;
            explorer.refreshUserEntries();
            chrome.refreshTrashState();
        })
        .catch(() => {});
    grid.renderDesktop();
    chrome.refreshTrashState();
    try { if (localStorage.getItem("cp.autoFullscreen") !== "0" && !document.fullscreenElement && document.hasTransientActivation) root.requestFullscreen?.({ navigationUI: "hide" }); } catch {}
    document.addEventListener("fullscreenchange", () => { document.body.classList.toggle("is-fullscreen", !!document.fullscreenElement); });

    return api;
}

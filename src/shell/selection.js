import { el } from "./utils.js?v=1";
import {
    HOME,
    CORBEILLE,
    getEntry,
    moveEntry,
    copyEntry,
    parentPath,
    nameOfPath,
    fileCategory,
    extOf,
} from "./fs.js?v=11";
import {
    fileSvg,
    imageFileSvg,
    audioFileSvg,
    videoFileSvg,
    folderSvg,
    systemFolderSvg,
    shortcutFileSvg,
    shortcutImageSvg,
    shortcutAudioSvg,
    shortcutVideoSvg,
    shortcutFolderSvg,
    programSvg,
    trashEmptySvg,
    trashFullSvg,
    explorerDesktopSvg,
    controlPanelDesktopSvg,
    infoDesktopSvg,
} from "./icons.js?v=1";

const MODE_LABELS = {
    "display-folders": "Bureau : dossiers",
    "display-all": "Bureau : toutes les icônes",
    "arrange-auto": "Alignement automatique",
    "arrange-grid": "Grille",
    "arrange-free": "Libre",
};

const POS_KEY = "cp.freePositions";

export function createSelectionManager(ctx, deps = {}) {
    // Normalise l'état partagé (références closure -> ctx.xxx)
    ctx.selectedByContainer ??= new Map();
    if (ctx.selAnchor === undefined) ctx.selAnchor = null;
    if (ctx.dragSuppressClick === undefined) ctx.dragSuppressClick = false;
    if (ctx.clipboard === undefined) ctx.clipboard = null;
    if (ctx.htmlDragPaths === undefined) ctx.htmlDragPaths = [];
    if (ctx.trashHasItems === undefined) ctx.trashHasItems = false;

    // Helpers d'accès DOM / deps avec fallback
    const getCtxEl = () => ctx.ctxEl || ctx.ctx || ctx.desktopCtx || null;
    const getLeftMenu = () => ctx.leftMenu || null;
    const getStartMenu = () => ctx.startMenu || null;
    const getIconsEl = () => ctx.iconsEl || null;
    const getSurface = () => ctx.surface || null;

    function _getRefreshUserEntries() { return deps.refreshUserEntries || ctx.refreshUserEntries || null; }
    function _getRefreshFileWindows() { return deps.refreshFileWindows || ctx.refreshFileWindows || null; }
    function _getRefreshTrashState() { return deps.refreshTrashState || ctx.refreshTrashState || null; }
    function _getRenderDesktop() { return deps.renderDesktop || ctx.renderDesktop || null; }

    // --- helpers internes repris de desktop.js ---
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

    // --- selection / icons ---
    function iconsOf(c) {
        if (!ctx.selectedByContainer.has(c)) ctx.selectedByContainer.set(c, new Set());
        return ctx.selectedByContainer.get(c);
    }

    function clearSelection() {
        for (const [, s] of ctx.selectedByContainer) {
            for (const n of s) n.classList.remove("selected");
            s.clear();
        }
        ctx.selectedByContainer.clear();
        ctx.selAnchor = null;
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
            ctx.selAnchor = node;
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
            ctx.selAnchor = node;
            return;
        }
        if (ctx.selAnchor && ctx.selAnchor.parentElement === c) {
            const icons = [...c.querySelectorAll(".desktop-icon")];
            const from = icons.indexOf(ctx.selAnchor);
            const to = icons.indexOf(node);
            if (from !== -1 && to !== -1) {
                clearSelection();
                const range = iconsOf(c);
                const [a, b] = from < to ? [from, to] : [to, from];
                for (let i = a; i <= b; i++) {
                    range.add(icons[i]);
                    icons[i].classList.add("selected");
                }
                ctx.selAnchor = node;
            }
            return;
        }
        s.add(node);
        node.classList.add("selected");
        ctx.selAnchor = node;
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
            kind === "trash" ? (ctx.trashHasItems ? trashFullSvg() : trashEmptySvg()) :
            kind === "folder" || kind === "ufolder" ? folderSvg() : programSvg();
        node.innerHTML = `${svg}<span class="icon-label"></span>`;
        node.querySelector(".icon-label").textContent = label;
        if (entry && ctx.clipboard && ctx.clipboard.mode === "cut" && ctx.clipboard.items.includes(id)) {
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
                ctx.selAnchor = node;
            }
            const showIconMenuFn = deps.showIconMenu || ctx.showIconMenu || deps.windowManager?.showIconMenu;
            if (showIconMenuFn) showIconMenuFn(node, e.clientX, e.clientY);
        });
        return node;
    }

    function enableRubberBand(container, iconSel) {
        container.addEventListener("mousedown", (e) => {
            if (e.button !== 0) return;
            if (e.target.closest(".desktop-icon")) return;
            if (container === getSurface() && e.target.closest(".wm-window")) return;
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
                ctx.dragSuppressClick = true;
                setTimeout(() => {
                    ctx.dragSuppressClick = false;
                }, 0);
                if (!(ev.ctrlKey || ev.shiftKey)) clearSelection();
                if (!dragged) return;
                const query = container === getSurface() ? getIconsEl() : container;
                if (!query) return;
                const s = iconsOf(query);
                for (const icon of query.querySelectorAll(iconSel)) {
                    const r = icon.getBoundingClientRect();
                    if (r.left < boxRect.right && r.right > boxRect.left && r.top < boxRect.bottom && r.bottom > boxRect.top) {
                        s.add(icon);
                        icon.classList.add("selected");
                    }
                }
                ctx.selAnchor = null;
            };
            document.addEventListener("mousemove", move);
            document.addEventListener("mouseup", up);
        });
    }

    function clearDropTarget() {
        const iconsEl = getIconsEl();
        if (!iconsEl) return;
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
            const arrange = ctx.arrange;
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
                if (ctx.arrange !== "auto") {
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
                    const trashSelected = deps.trashSelected || ctx.trashSelected;
                    if (trashSelected) trashSelected([icon.dataset.id]);
                } else {
                    const grid = dropOn?.closest(".explorer-icons");
                    if (grid && grid.dataset.dir !== undefined && icon.dataset.kind !== "program") {
                        await moveMany([icon.dataset.id], grid.dataset.dir || "");
                        _getRefreshFileWindows()?.();
                    } else if (ctx.arrange !== "auto") {
                        const pos = loadPositions();
                        const key = iconKey(icon);
                        let p = { x: icon.offsetLeft, y: icon.offsetTop };
                        if (ctx.arrange === "grid") {
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
                ctx.dragSuppressClick = true;
                setTimeout(() => (ctx.dragSuppressClick = false), 0);
            };
            document.addEventListener("mousemove", move);
            document.addEventListener("mouseup", up);
        });
    }

    function allSelectedEmpty() {
        for (const [, s] of ctx.selectedByContainer) if (s.size) return false;
        return true;
    }

    function updateCtxViewLabel() {
        buildLeftMenu();
        const ctxEl = getCtxEl();
        if (ctxEl) {
            const v1 = ctxEl.querySelector('[data-act="viewicons"]');
            if (v1) v1.textContent = (ctx.showIcons ? "✓ " : "") + "Afficher les icônes du bureau";
            const paste = ctxEl.querySelector('[data-act="paste"]');
            if (paste) paste.disabled = !ctx.clipboard || !ctx.clipboard.items.length;
        }
        const leftMenu = getLeftMenu();
        if (leftMenu) {
            const v2 = leftMenu.querySelector('[data-act="viewicons"]');
            if (v2) v2.textContent = (ctx.showIcons ? "✓ " : "") + "Afficher les icônes du bureau";
            const paste2 = leftMenu.querySelector('[data-act="paste"]');
            if (paste2) paste2.disabled = !ctx.clipboard || !ctx.clipboard.items.length;
        }
        syncModeMarks();
    }

    function syncModeMarks() {
        const ctxEl = getCtxEl();
        const leftMenu = getLeftMenu();
        const startMenu = getStartMenu();
        const active = {
            "display-folders": ctx.display === "folders",
            "display-all": ctx.display === "all",
            "arrange-auto": ctx.arrange === "auto",
            "arrange-grid": ctx.arrange === "grid",
            "arrange-free": ctx.arrange === "free",
        };
        for (const [act, label] of Object.entries(MODE_LABELS)) {
            const text = (active[act] ? "✓ " : "") + label;
            const c = ctxEl && ctxEl.querySelector(`[data-act="${act}"]`);
            if (c) c.textContent = text;
            const l = leftMenu && leftMenu.querySelector(`[data-act="${act}"]`);
            if (l) l.textContent = text;
            const s = startMenu && startMenu.querySelector(`[data-act="${act}"] .start-item-text`);
            if (s) s.textContent = text;
        }
    }

    function buildLeftMenu() {
        const leftMenu = getLeftMenu();
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
            const hr = document.createElement("hr");
            hr.className = "start-sep";
            leftMenu.appendChild(hr);
        }
        if (hasNavGroup) {
            addBtn("explorer", "Explorateur", !ctx.leftExplorer);
            addBtn("corbeille", "Corbeille", !ctx.leftCorbeille);
        }
        if (hasNavGroup && (hasDisplayGroup || hasArrangeGroup || hasSystemGroup)) {
            const hr = document.createElement("hr");
            hr.className = "start-sep";
            leftMenu.appendChild(hr);
        }
        if (hasDisplayGroup) {
            if (ctx.leftDisplayFolders) addBtn("display-folders", (ctx.display === "folders" ? "✓ " : "") + MODE_LABELS["display-folders"], false);
            if (ctx.leftDisplayAll) addBtn("display-all", (ctx.display === "all" ? "✓ " : "") + MODE_LABELS["display-all"], false);
        }
        if (hasDisplayGroup && (hasArrangeGroup || hasSystemGroup)) {
            const hr = document.createElement("hr");
            hr.className = "start-sep";
            leftMenu.appendChild(hr);
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
            const hr = document.createElement("hr");
            hr.className = "start-sep";
            leftMenu.appendChild(hr);
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
        const ctxEl = getCtxEl();
        if (!ctxEl) return;
        ctxEl.innerHTML = "";
        const add = (act, label, hidden) => {
            if (hidden) return;
            const b = document.createElement("button");
            b.type = "button";
            b.dataset.act = act;
            b.textContent = label;
            ctxEl.appendChild(b);
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
            const hr = document.createElement("hr"); hr.className = "start-sep"; ctxEl.appendChild(hr);
        }
        if (hasNav) {
            add("explorer", "Explorateur", !ctx.leftExplorer);
            add("corbeille", "Corbeille", !ctx.leftCorbeille);
        }
        if (hasNav && (hasDisplay || hasArrange || hasSystem)) {
            const hr = document.createElement("hr"); hr.className = "start-sep"; ctxEl.appendChild(hr);
        }
        if (hasDisplay) {
            if (ctx.leftDisplayFolders) add("display-folders", (ctx.display === "folders" ? "✓ " : "") + MODE_LABELS["display-folders"], false);
            if (ctx.leftDisplayAll) add("display-all", (ctx.display === "all" ? "✓ " : "") + MODE_LABELS["display-all"], false);
        }
        if (hasDisplay && (hasArrange || hasSystem)) {
            const hr = document.createElement("hr"); hr.className = "start-sep"; ctxEl.appendChild(hr);
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
                ctxEl.appendChild(b);
            }
        }
        if (hasArrange && hasSystem) {
            const hr = document.createElement("hr"); hr.className = "start-sep"; ctxEl.appendChild(hr);
        }
        if (hasSystem) {
            add("controlpanel", "Panneau de configuration", !ctx.leftControlPanel);
            add("taskmgr", "Gestionnaire des tâches", !ctx.leftTaskMgr);
            add("refresh", "Actualiser", !ctx.leftRefresh);
        }
        updateCtxViewLabel();
    }

    function handleDesktopAction(act) {
        const setDisplay = deps.setDisplay || ctx.setDisplay;
        const setArrange = deps.setArrange || ctx.setArrange;
        const createNewItem = deps.createNewItem || ctx.createNewItem;
        const pickFiles = deps.pickFiles || ctx.pickFiles;
        const openExplorer = deps.openExplorer || ctx.openExplorer;
        const openCorbeille = deps.openCorbeille || ctx.openCorbeille;
        const openControlPanel = deps.openControlPanel || ctx.openControlPanel;
        const openTaskManager = deps.openTaskManager || ctx.openTaskManager;
        const renderDesktop = _getRenderDesktop();
        const alignIcons = deps.alignIcons || ctx.alignIcons;
        const setShowIcons = deps.setShowIcons || ctx.setShowIcons;
        const leftMenuEl = getLeftMenu();
        const ctxEl = getCtxEl();

        if (act === "display-folders" && setDisplay) setDisplay("folders");
        if (act === "display-all" && setDisplay) setDisplay("all");
        if (act === "arrange-auto" && setArrange) setArrange("auto");
        if (act === "arrange-grid" && setArrange) setArrange("grid");
        if (act === "arrange-free" && setArrange) setArrange("free");
        if (act === "newfolder" && createNewItem) createNewItem("folder", HOME);
        if (act === "newfile" && createNewItem) createNewItem("file", HOME);
        if (act === "import" && pickFiles) pickFiles(HOME, () => _getRefreshUserEntries()?.());
        if (act === "paste") pasteTo(HOME);
        if (act === "explorer" && openExplorer) openExplorer("");
        if (act === "corbeille" && openCorbeille) openCorbeille();
        if (act === "sort") {
            if (leftMenuEl) {
                leftMenuEl.innerHTML = `
                    <button type="button" data-act="sort-name">Trier par nom</button>
                    <button type="button" data-act="sort-type">Trier par type</button>
                    <button type="button" data-act="sort-back">← Retour</button>
                `;
                leftMenuEl.hidden = false;
            }
            return;
        }
        if (act === "sort-name") { ctx.sortMode = "name"; renderDesktop?.(); }
        if (act === "sort-type") { ctx.sortMode = "type"; renderDesktop?.(); }
        if (act === "sort-back") buildLeftMenu();
        if (act === "align" && alignIcons) alignIcons();
        if (act === "viewicons" && setShowIcons) setShowIcons(!ctx.showIcons);
        if (act === "controlpanel" && openControlPanel) openControlPanel();
        if (act === "taskmgr" && openTaskManager) openTaskManager();
        if (act === "refresh" && renderDesktop) renderDesktop();
        if (act !== "sort" && act !== "sort-back") {
            if (leftMenuEl) leftMenuEl.hidden = true;
            if (ctxEl) ctxEl.hidden = true;
        }
    }

    function startHtmlDrag(ev, path) {
        ctx.htmlDragPaths = [path];
        try {
            ev.dataTransfer.setData("text/plain", path);
            ev.dataTransfer.effectAllowed = "copyMove";
        } catch {}
    }

    function readHtmlPaths(e) {
        if (ctx.htmlDragPaths.length) return ctx.htmlDragPaths;
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
            await _getRefreshUserEntries()?.();
            _getRefreshFileWindows()?.();
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
        ctx.clipboard = { mode: "cut", items: paths };
        _getRefreshUserEntries()?.();
        _getRefreshFileWindows()?.();
        updateCtxPaste();
    }

    function copyToClipboard(paths) {
        if (!paths.length) return;
        ctx.clipboard = { mode: "copy", items: paths };
        updateCtxPaste();
        _getRefreshFileWindows()?.();
    }

    async function pasteTo(dir) {
        if (!ctx.clipboard || !ctx.clipboard.items.length) return;
        const items = [];
        for (const p of ctx.clipboard.items) {
            const e = await getEntry(p);
            if (e) items.push(e);
        }
        if (!items.length) {
            ctx.clipboard = null;
            await _getRefreshUserEntries()?.();
            _getRefreshFileWindows()?.();
            updateCtxPaste();
            return;
        }
        if (ctx.clipboard.mode === "cut") {
            for (const it of items) await moveEntry(it.path, dir);
            ctx.clipboard = null;
        } else {
            for (const it of items) await copyEntry(it.path, dir);
        }
        await _getRefreshUserEntries()?.();
        _getRefreshFileWindows()?.();
        updateCtxPaste();
    }

    function allSelectedNodes() {
        const nodes = [];
        for (const [, s] of ctx.selectedByContainer) {
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
        for (const [, s] of ctx.selectedByContainer) {
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
        if (node) {
            const renameNode = deps.renameNode || ctx.renameNode;
            if (renameNode) renameNode(node);
        }
    }

    function openIconTarget(node) {
        const kind = node.dataset.kind;
        const id = node.dataset.id;
        const openFolder = deps.openFolder || ctx.openFolder;
        const openExplorer = deps.openExplorer || ctx.openExplorer;
        const openCorbeille = deps.openCorbeille || ctx.openCorbeille;
        const openModule = deps.openModule || ctx.openModule;
        const openEntryPath = deps.openEntryPath || ctx.openEntryPath;
        const openFile = deps.openFile || ctx.openFile;
        // legacy explorer entry
        const windowManager = deps.windowManager || ctx.windowManager;
        void windowManager;
        void openExplorer;
        if (kind === "folder" && openFolder) openFolder(id);
        else if (kind === "ufolder" || kind === "ufile") {
            if (node.__entry && openEntryPath) openEntryPath(node.__entry);
            else if (openFile) openFile(id);
        } else if (kind === "trash" && openCorbeille) openCorbeille();
        else if (openModule) openModule(id);
    }

    return {
        makeIcon,
        iconsOf,
        clearSelection,
        selectIcon,
        enableRubberBand,
        clearDropTarget,
        isDropFolder,
        enableIconDrag,
        allSelectedEmpty,
        updateCtxViewLabel,
        buildCtx,
        buildLeftMenu,
        syncModeMarks,
        handleDesktopAction,
        startHtmlDrag,
        readHtmlPaths,
        moveMany,
        containerPaths,
        firstSelected,
        updateCtxPaste,
        cutToClipboard,
        copyToClipboard,
        pasteTo,
        allSelectedNodes,
        allSelectedPaths,
        currentPasteTarget,
        openFirstSelected,
        renameFirstSelected,
        openIconTarget,
        // helpers exposés pour tests / compat
        iconKey,
        snapGrid,
    };
}

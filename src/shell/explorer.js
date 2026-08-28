import {
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
    getEntry,
    putEntry,
    formatSize,
    fileCategory as fileCategoryImport,
    typeLabel,
    extOf as extOfImport,
    parentPath as parentPathImport,
    nameOfPath as nameOfPathImport,
    displayPath as displayPathImport,
    CORBEILLE as CORBEILLEImport,
    HOME as HOMEImport,
} from "./fs.js?v=11";
import { MODULES as MODULESImport } from "./constants.js?v=1";
import { el as elImport } from "./utils.js?v=1";

export function createExplorer(ctx, deps) {
    deps = deps || {};
    const wm = deps.windowManager || {};
    const sm = deps.selectionManager || {};

    // résolve helpers via ctx / deps / imports avec fallback
    const W = ctx.W || {};
    const windows = ctx.windows;
    const surface = ctx.surface;
    const folderWindowRenders = ctx.folderWindowRenders || new Map();
    // si ctx.folderWindowRenders manquant, on l'assigne pour partager
    if (!ctx.folderWindowRenders) ctx.folderWindowRenders = folderWindowRenders;

    const getFileCategory = deps.fileCategory || deps.fileCategoryUtils?.fileCategory || ctx.fileCategory || fileCategoryImport;
    const getExtOf = deps.extOf || ctx.extOf || extOfImport;
    const getParentPath = deps.parentPath || ctx.parentPath || parentPathImport;
    const getNameOfPath = deps.nameOfPath || ctx.nameOfPath || nameOfPathImport;
    const getDisplayPath = deps.displayPath || ctx.displayPath || displayPathImport;
    const CORBEILLE = ctx.CORBEILLE || deps.CORBEILLE || CORBEILLEImport;
    const HOME = ctx.HOME || deps.HOME || HOMEImport;
    const MODULES = ctx.MODULES || deps.MODULES || MODULESImport;
    const elFn = ctx.el || deps.el || elImport;

    const createWindow = wm.createWindow || deps.createWindow || ctx.createWindow;
    const closeWindow = wm.closeWindow || deps.closeWindow || ctx.closeWindow;
    const focusWindow = wm.focusWindow || deps.focusWindow || ctx.focusWindow;
    const confirmDialog = wm.confirmDialog || deps.confirmDialog || ctx.confirmDialog;
    const showPlaceholder = wm.showPlaceholder || deps.showPlaceholder || ctx.showPlaceholder;

    const iconsOf = sm.iconsOf || deps.iconsOf || ctx.iconsOf;
    const makeIcon = ctx.makeIcon || deps.makeIcon || sm.makeIcon;
    const enableRubberBand = ctx.enableRubberBand || deps.enableRubberBand || sm.enableRubberBand;

    // accès mutable via ctx pour partager l'état avec desktop.js
    // ctx.clipboard, ctx.htmlDragPaths, ctx.fileInput, ctx.userEntries, ctx.fsOk, ctx.showExt, etc.
    if (!Array.isArray(ctx.htmlDragPaths)) ctx.htmlDragPaths = [];
    if (!ctx.clipboard) ctx.clipboard = null;

    function getTags() { return ctx.tags || []; }
    function getModules() { return ctx.modules || []; }
    function getAll() { return ctx.all || getModules(); }

    function visibleByTag(tag) {
        if (ctx.visibleByTag) return ctx.visibleByTag(tag);
        const mods = getModules();
        return mods.filter((m) => (m.tags || []).includes(tag));
    }
    function sortModules(list) {
        if (ctx.sortModules) return ctx.sortModules(list);
        const copy = [...list];
        const mode = ctx.sortMode || "name";
        if (mode === "type") {
            copy.sort((a, b) => {
                const ta = (a.tags || [])[0] || "";
                const tb = (b.tags || [])[0] || "";
                return ta.localeCompare(tb, "fr") || a.name.localeCompare(b.name, "fr");
            });
        } else copy.sort((a, b) => a.name.localeCompare(b.name, "fr"));
        return copy;
    }
    function displayName(entry) {
        if (ctx.displayName) return ctx.displayName(entry);
        if (entry && !ctx.showExt && (entry.kind === "file" || entry.kind === "shortcut")) {
            const ext = getExtOf(entry.name);
            if (ext && entry.name.length > ext.length) return entry.name.slice(0, -ext.length);
        }
        return entry ? entry.name : "";
    }
    function userIconKind(e) {
        if (ctx.userIconKind) return ctx.userIconKind(e);
        if (e.kind === "shortcut") return e.targetKind === "folder" ? "ufolder" : "ufile";
        return e.kind === "folder" ? "ufolder" : "ufile";
    }
    function elTag(tag, className) { return (elFn || elImport)(tag, className); }

    function refreshFileWindows() {
        const map = ctx.folderWindowRenders || folderWindowRenders;
        for (const render of map.values()) render?.();
    }

    function mkBtn(text) {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = text;
        return b;
    }

    function refreshUserEntries() {
        if (!ctx.fsOk) return Promise.resolve();
        return listEntries(HOME).then((list) => {
            ctx.userEntries = list;
            ctx.renderDesktop?.();
            refreshFileWindows();
            ctx.refreshTrashState?.();
        });
    }

    function pickFiles(parent, after) {
        if (!ctx.fsOk) return;
        if (!ctx.fileInput) {
            const inp = document.createElement("input");
            inp.type = "file";
            inp.multiple = true;
            inp.style.display = "none";
            document.body.appendChild(inp);
            inp.addEventListener("change", async () => {
                const files = [...inp.files];
                inp.value = "";
                if (!files.length) return;
                await importFiles(parent, files);
                refreshUserEntries();
                after?.();
            });
            ctx.fileInput = inp;
        }
        ctx.fileInput.click();
    }

    function beginRename(node, onCommit, onCancel, opts) {
        const label = node.querySelector(".icon-label");
        if (!label) { onCancel?.(); return; }
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
            if (!commit) { onCancel?.(); return; }
            let v = input.value.trim();
            if (opts && opts.ext && !getExtOf(v)) v += opts.ext;
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
        if (!ctx.fsOk) return;
        parent = parent || "";
        container = container || ctx.iconsEl;
        const name = kind === "folder" ? "Nouveau dossier" : "Nouveau fichier texte.txt";
        const entry = await (kind === "folder" ? createFolder : createTextFile)(parent, name);
        await refreshUserEntries();
        const sel = `.desktop-icon[data-kind="${kind === "folder" ? "ufolder" : "ufile"}"][data-id="${CSS.escape(entry.path)}"]`;
        const node = container ? container.querySelector(sel) : null;
        if (!node) return;
        node.classList.add("selected");
        const done = () => {
            refreshFileWindows();
            ctx.updateCtxViewLabel?.();
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
        const entryName = node.__entry ? node.__entry.name : node.querySelector(".icon-label")?.textContent || "";
        beginRename(node, (newName) => {
            renameEntry(id, newName).then(refreshUserEntries).then(refreshFileWindows).then(() => ctx.updateCtxViewLabel?.());
        }, () => {
            refreshUserEntries();
            refreshFileWindows();
        }, kind === "ufile" ? { ext: getExtOf(entryName) } : undefined);
    }

    function isDropFolder(node) {
        if (ctx.isDropFolder) return ctx.isDropFolder(node);
        return !!node && node.dataset.kind === "ufolder" && !(node.__entry && node.__entry.kind === "shortcut");
    }

    function containerPaths(container) {
        if (!iconsOf) return [];
        return [...iconsOf(container)]
            .filter((n) => n.dataset.kind === "ufolder" || n.dataset.kind === "ufile")
            .map((n) => n.dataset.id);
    }
    function firstSelected(container) {
        if (!iconsOf) return null;
        const list = [...iconsOf(container)];
        return list.find((n) => n.dataset.kind === "ufolder" || n.dataset.kind === "ufile") || list[0] || null;
    }

    function startHtmlDrag(ev, path) {
        ctx.htmlDragPaths = [path];
        try { ev.dataTransfer.setData("text/plain", path); } catch {}
        try { ev.dataTransfer.effectAllowed = "copyMove"; } catch {}
    }
    function readHtmlPaths(e) {
        if (ctx.htmlDragPaths && ctx.htmlDragPaths.length) return ctx.htmlDragPaths;
        try {
            const v = e.dataTransfer.getData("text/plain");
            return v ? [v] : [];
        } catch { return []; }
    }
    async function moveMany(paths, dir) {
        let moved = 0;
        for (const p of paths) {
            try { if (await moveEntry(p, dir)) moved++; } catch {}
        }
        if (moved) {
            await refreshUserEntries();
            refreshFileWindows();
        }
    }

    function updateCtxPaste() {
        if (ctx.updateCtxViewLabel) ctx.updateCtxViewLabel();
        else if (ctx.updateCtxPaste) ctx.updateCtxPaste();
    }

    function cutToClipboard(paths) {
        if (!paths.length) return;
        ctx.clipboard = { mode: "cut", items: paths };
        refreshUserEntries();
        refreshFileWindows();
        updateCtxPaste();
    }
    function copyToClipboard(paths) {
        if (!paths.length) return;
        ctx.clipboard = { mode: "copy", items: paths };
        updateCtxPaste();
        refreshFileWindows();
    }
    async function pasteTo(dir) {
        const cb = ctx.clipboard;
        if (!cb || !cb.items.length) return;
        const items = [];
        for (const p of cb.items) {
            const e = await getEntry(p);
            if (e) items.push(e);
        }
        if (!items.length) {
            ctx.clipboard = null;
            await refreshUserEntries();
            refreshFileWindows();
            updateCtxPaste();
            return;
        }
        if (cb.mode === "cut") {
            for (const it of items) await moveEntry(it.path, dir);
            ctx.clipboard = null;
        } else {
            for (const it of items) await copyEntry(it.path, dir);
        }
        await refreshUserEntries();
        refreshFileWindows();
        updateCtxPaste();
    }

    function trashSelected(paths) {
        const list = (paths || []).filter(Boolean);
        if (!list.length) return;
        const dlg = confirmDialog || ctx.confirmDialog;
        if (!dlg) return;
        dlg(
            "Supprimer",
            `${list.length} élément${list.length > 1 ? "s" : ""} va${list.length > 1 ? "ent" : ""} être envoyé${list.length > 1 ? "s" : ""} à la Corbeille.`,
            async () => {
                await trashEntries(list);
                ctx.clipboard = null;
                await refreshUserEntries();
                refreshFileWindows();
                updateCtxPaste();
            }
        );
    }

    function downloadSelected(paths) {
        if (ctx.downloadSelected) return ctx.downloadSelected(paths);
        if (deps.downloadSelected) return deps.downloadSelected(paths);
    }
    function openProperties(nodes) {
        if (ctx.openProperties) return ctx.openProperties(nodes);
        if (deps.openProperties) return deps.openProperties(nodes);
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
        // createWindow focus si existait déjà, desktop.js retournait sans rebuild
        if (ctx.windows && ctx.windows.has(id) && rec && rec.body && rec.body.children.length) {
            // si déjà existant mais on a rappelé, focus seulement
            // heuristique: si createWindow a focusé, on sort
            const existing = ctx.windows.get(id);
            if (existing && existing.body && existing.body.children.length && existing.body.querySelector(".explorer-icons")) return;
        }
        // si createWindow a retourné un rec déjà existant avec body rempli, on évite de recréer
        // mais la logique originale : if (existed) return; donc on check existed avant
        // on a déjà créé, on rebuild seulement si c'était nouveau (on détecte via body vide)
        // Pour compatibilité, on rebuild toujours si on est arrivé ici (nouvelle fenêtre)
        if (!rec || !rec.body) return;
        // si fenêtre déjà existait, createWindow l'a focus et on ne rebuild pas - détecté via flag
        // On utilise windows.has avant création pour décider ; recréé check
        // Simplification: si rec.body a déjà du contenu et qu'on vient de créer, on le vide
        rec.body.innerHTML = "";
        const toolbar = elTag("div", "explorer-toolbar");
        toolbar.textContent = isModules ? getDisplayPath(MODULES) : getDisplayPath(HOME + "/" + tag);
        const grid = elTag("div", "explorer-icons sunken-panel");
        const list = isModules ? sortModules(getModules()) : visibleByTag(tag);
        for (const m of list) {
            const node = makeIcon ? makeIcon({
                kind: "program",
                id: m.id,
                label: m.name,
                onOpen: (e) => (ctx.openModule || deps.openModule)?.(m.id, e && e.shiftKey),
            }) : (() => { const n = elTag("div","desktop-icon"); n.dataset.kind="program"; n.dataset.id=m.id; n.textContent=m.name; n.addEventListener("dblclick",(e)=> (ctx.openModule||deps.openModule)?.(m.id, e.shiftKey)); return n; })();
            if (isModules && node) node.dataset.format = "js";
            if (node) grid.appendChild(node);
        }
        rec.body.append(toolbar, grid);
        const sel = `.${(W.titleBarText || "title-bar-text")}`;
        const t = rec.el.querySelector(sel);
        if (t) t.textContent = tag;
        if (enableRubberBand) enableRubberBand(grid, ".desktop-icon");
    }

    function openExplorer(dir, opts = {}) {
        const trashMode = opts.mode === "trash";
        const winId = trashMode ? "explorer:corbeille" : `explorer:${dir || ""}`;
        const existed = ctx.windows ? ctx.windows.has(winId) : false;
        const rec = createWindow({
            id: winId,
            title: trashMode ? "Corbeille" : dir ? getNameOfPath(dir) : "Calculateur Plus!",
            kind: "explorer",
            width: 620,
            height: 460,
        });
        if (existed) return;
        if (!rec || !rec.body) return;
        rec.body.innerHTML = "";
        rec.body.classList.add("explorer-body");

        const nav = elTag("div", "explorer-toolbar");
        const backBtn = mkBtn("←");
        backBtn.title = "Précédent";
        const upBtn = mkBtn("↑");
        upBtn.title = "Dossier parent";
        const newFolderBtn = mkBtn("Nouveau dossier");
        const importBtn = mkBtn("Importer des fichiers...");
        const address = elTag("span", "explorer-path");

        const act = elTag("div", "explorer-toolbar");
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

        const grid = elTag("div", "explorer-icons sunken-panel");
        const status = elTag("div", "explorer-status");

        nav.append(backBtn, upBtn, newFolderBtn, importBtn, address);
        if (trashMode) {
            act.append(restoreBtn, permBtn, emptyBtn);
            nav.querySelectorAll("button").forEach((b) => (b.disabled = true));
            newFolderBtn.disabled = true;
        } else {
            act.append(cutBtn, copyBtn, pasteBtn, delBtn, renBtn, dlSelBtn, propBtn);
        }
        rec.body.append(nav, act, grid, status);
        if (enableRubberBand) enableRubberBand(grid, ".desktop-icon");

        let currentDir = trashMode ? CORBEILLE : (dir || "");
        const history = [];
        const titleSel = `.${W.titleBarText || "title-bar-text"}`;

        function setTitle() {
            const elTitle = rec.el.querySelector(titleSel);
            if (!elTitle) return;
            elTitle.textContent = trashMode
                ? "Corbeille"
                : currentDir
                ? getNameOfPath(currentDir)
                : "Calculateur Plus!";
        }

        function updateStatus(n) {
            status.textContent = `${n} élément${n > 1 ? "s" : ""}${trashMode ? " dans la Corbeille" : ""}`;
        }

        function render() {
            grid.innerHTML = "";
            grid.dataset.dir = currentDir || "";
            if (trashMode) { renderTrash(); return; }
            address.textContent = getDisplayPath(currentDir || "");
            backBtn.disabled = history.length === 0;
            upBtn.disabled = !currentDir;
            const cb = ctx.clipboard;
            pasteBtn.disabled = !cb || !cb.items.length;
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
                    const node = makeIcon ? makeIcon({
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
                                : (ctx.openEntryPath || deps.openEntryPath)?.(e),
                    }) : null;
                    if (!node) continue;
                    if (!isSys) {
                        node.draggable = true;
                        node.addEventListener("dragstart", (ev) => startHtmlDrag(ev, e.path));
                    }
                    grid.appendChild(node);
                }
                let nSys = 0;
                if (currentDir === HOME) {
                    for (const tag of getTags()) {
                        const node = makeIcon ? makeIcon({
                            kind: "folder",
                            id: tag,
                            label: tag,
                            system: true,
                            onOpen: () => openFolder(tag),
                        }) : null;
                        if (node) grid.appendChild(node);
                        nSys++;
                    }
                }
                if (currentDir === "") {
                    const node = makeIcon ? makeIcon({
                        kind: "folder",
                        id: MODULES,
                        label: "Modules",
                        system: true,
                        onOpen: () => openFolder(MODULES),
                    }) : null;
                    if (node) grid.appendChild(node);
                    nSys++;
                }
                updateStatus(list.length + nSys);
            });
        }

        async function renderTrash() {
            address.textContent = getDisplayPath(CORBEILLE);
            backBtn.disabled = true;
            upBtn.disabled = true;
            setTitle();
            const list = await listCorbeille();
            grid.innerHTML = "";
            for (const e of list) {
                const node = makeIcon ? makeIcon({
                    kind: userIconKind(e),
                    id: e.path,
                    label: displayName(e),
                    entry: e,
                    onOpen: () => (ctx.openEntryPath || deps.openEntryPath)?.(e),
                }) : null;
                if (node) grid.appendChild(node);
            }
            updateStatus(list.length);
        }

        function navigateTo(dirPath) {
            if (currentDir) history.push(currentDir);
            currentDir = dirPath;
            render();
        }

        backBtn.addEventListener("click", () => {
            if (history.length) {
                currentDir = history.pop();
                render();
            }
        });
        upBtn.addEventListener("click", () => navigateTo(getParentPath(currentDir || "")));
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
        propBtn.addEventListener("click", () => openProperties([...(iconsOf ? iconsOf(grid) : [])]));
        dlSelBtn.addEventListener("click", () => downloadSelected(containerPaths(grid)));
        restoreBtn.addEventListener("click", async () => {
            for (const p of containerPaths(grid)) await restoreEntry(p);
            await refreshUserEntries();
            refreshFileWindows();
        });
        permBtn.addEventListener("click", () => {
            const list = containerPaths(grid);
            if (!list.length) return;
            const dlg = confirmDialog || ctx.confirmDialog;
            dlg?.(
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
            const dlg = confirmDialog || ctx.confirmDialog;
            dlg?.("Vider la Corbeille", "Vider définitivement la Corbeille ?", async () => {
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
                ctx.htmlDragPaths = [];
                if (!paths.length) return;
                const folderIcon = e.target.closest('.desktop-icon[data-kind="ufolder"]');
                const dirTarget = isDropFolder(folderIcon) ? folderIcon.dataset.id : (currentDir || "");
                await moveMany(paths, dirTarget);
                render();
            });
        }

        const map = ctx.folderWindowRenders || folderWindowRenders;
        map.set(winId, render);
        render();
    }

    function openCorbeille() {
        openExplorer(null, { mode: "trash" });
    }

    return { openFolder, openExplorer, openCorbeille, refreshFileWindows, mkBtn, beginRename, createNewItem, renameNode, pickFiles, refreshUserEntries };
}

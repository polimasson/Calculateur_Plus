// Desktop grid : rendu des icônes du bureau, positions, tri, taille d'icônes.
import { DEFAULTS } from "./constants.js?v=1";

const POS_KEY = "cp.freePositions";
const SIZE_KEY = "cp.iconSize";
const WALL_KEY = "cp.wallpaper";

export function createDesktopGrid(ctx, deps = {}) {
    const get = (name) => (deps[name] !== undefined ? deps[name] : ctx[name]);

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

    function sortModules(list) {
        const copy = [...list];
        if (ctx.sortMode === "type") {
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

    function displayName(entry) {
        if (entry && !ctx.showExt && (entry.kind === "file" || entry.kind === "shortcut")) {
            const ext = extOfName(entry.name);
            if (ext && entry.name.length > ext.length) return entry.name.slice(0, -ext.length);
        }
        return entry ? entry.name : "";
    }

    function extOfName(name) {
        const dot = name.lastIndexOf(".");
        return dot > 0 ? name.slice(dot).toLowerCase() : "";
    }

    function userIconKind(e) {
        if (e.kind === "shortcut") return e.targetKind === "folder" ? "ufolder" : "ufile";
        return e.kind === "folder" ? "ufolder" : "ufile";
    }

    function renderDesktop() {
        const iconsEl = ctx.iconsEl;
        if (!iconsEl) return;
        const makeIcon = get("makeIcon");
        iconsEl.innerHTML = "";
        ctx.clearSelection?.();
        iconsEl.hidden = !ctx.showIcons;
        const items = [];
        if (ctx.display === "folders") {
            for (const tag of ctx.tags) {
                items.push({
                    kind: "folder",
                    id: tag,
                    label: tag,
                    system: true,
                    onOpen: () => get("openFolder")(tag),
                });
            }
        } else {
            for (const m of sortModules(ctx.modules)) {
                items.push({
                    kind: "program",
                    id: m.id,
                    label: m.name,
                    onOpen: (e) => get("openModule")(m.id, e && e.shiftKey),
                });
            }
        }
        for (const e of ctx.userEntries || []) {
            items.push({
                kind: userIconKind(e),
                id: e.path,
                label: displayName(e),
                entry: e,
                onOpen: () => get("openEntryPath")(e),
            });
        }
        if (ctx.deskIconExplorer) items.push({ kind: "folder", id: "__explorer", label: "Explorateur", system: true, onOpen: () => get("openExplorer")("") });
        if (ctx.deskIconControlPanel) items.push({ kind: "program", id: "__controlpanel", label: "Panneau de configuration", system: true, onOpen: () => get("openControlPanel")() });
        if (ctx.deskIconInfo) items.push({ kind: "program", id: "__info", label: "Plus d'info", system: true, onOpen: () => get("openModule")("info") });
        if (ctx.deskIconCorbeille) items.push({
            kind: "trash",
            id: "corbeille",
            label: "Corbeille",
            onOpen: () => get("openCorbeille")(),
        });
        if (ctx.arrange === "auto") {
            iconsEl.classList.remove("free");
            for (const it of items) iconsEl.appendChild(makeIcon(it));
            return;
        }
        iconsEl.classList.add("free");
        const positions = loadPositions();
        const CELL_W = 82;
        const CELL_H = 88;
        const cols = Math.max(1, Math.floor(iconsEl.clientWidth / CELL_W));
        if (ctx.arrange === "grid") {
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

    function setDisplay(next) {
        ctx.display = next;
        localStorage.setItem(DISP_KEY(), next);
        renderDesktop();
        ctx.syncModeMarks?.();
        ctx.buildLeftMenu?.();
        ctx.closeStart?.();
        if (ctx.ctxMenu) ctx.ctxMenu.hidden = true;
        if (ctx.leftMenu) ctx.leftMenu.hidden = true;
    }

    function setArrange(next) {
        ctx.arrange = next;
        localStorage.setItem(ARR_KEY(), next);
        renderDesktop();
        ctx.syncModeMarks?.();
        ctx.buildLeftMenu?.();
        ctx.closeStart?.();
        if (ctx.ctxMenu) ctx.ctxMenu.hidden = true;
        if (ctx.leftMenu) ctx.leftMenu.hidden = true;
    }

    function DISP_KEY() { return "cp.desktopDisplay"; }
    function ARR_KEY() { return "cp.desktopArrange"; }

    function refreshModules() {
        ctx.modules = ctx.options?.getModules ? ctx.options.getModules() : ctx.initialModules;
        ctx.tags = [...new Set(ctx.modules.flatMap((m) => m.tags || []))].sort((a, b) =>
            a.localeCompare(b, "fr")
        );
        ctx.buildStartTags?.();
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
        for (const [k, v] of Object.entries(vars)) ctx.root.style.setProperty(k, v);
    }

    function setIconSize(size) {
        applyIconSize(size);
        localStorage.setItem(SIZE_KEY, size);
        renderDesktop();
    }

    function setWallpaper(color) {
        ctx.root.style.setProperty("--desktop-wallpaper", color);
        localStorage.setItem(WALL_KEY, color);
    }

    function alignIcons() {
        const pos = {};
        const CELL_W = 82;
        const CELL_H = 88;
        const iconsEl = ctx.iconsEl;
        const cols = Math.max(1, Math.floor(iconsEl.clientWidth / CELL_W));
        let i = 0;
        for (const node of iconsEl.querySelectorAll(".desktop-icon")) {
            const key = iconKey(node);
            pos[key] = { x: 8 + (i % cols) * CELL_W, y: 8 + Math.floor(i / cols) * CELL_H };
            i++;
        }
        savePositionsMap(pos);
        renderDesktop();
        if (ctx.ctxMenu) ctx.ctxMenu.hidden = true;
    }

    return {
        renderDesktop, sortModules, loadPositions, savePositionsMap,
        setDisplay, setArrange, refreshModules, applyIconSize, setIconSize,
        setWallpaper, alignIcons, displayName, userIconKind, iconKey, snapGrid,
    };
}

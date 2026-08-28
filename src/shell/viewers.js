// Media viewers : image / audio / vidéo / bloc-notes + propriétés + téléchargement.
import { el } from "./utils.js?v=1";
import {
    getEntry,
    putEntry,
    formatSize,
    fileCategory,
    typeLabel,
    listEntries,
    listCorbeille,
    displayPath,
    HOME,
    CORBEILLE,
} from "./fs.js?v=11";

export function createViewers(ctx, deps = {}) {
    const get = (name) => (deps[name] !== undefined ? deps[name] : ctx[name]);
    const createWindow = () => get("createWindow");
    const focusWindow = (id) => get("focusWindow")(id);
    const closeWindow = (id) => get("closeWindow")(id);

    function showPlaceholder(title, msg) {
        const winId = `info:${ctx.winSeq}`;
        const rec = get("createWindow")({
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
        if (!entry?.blob) { showPlaceholder(entry?.name || "Image", "Fichier vide."); return; }
        const winId = `img:${entryId}`;
        if (ctx.windows.has(winId)) { focusWindow(winId); return; }
        const rec = get("createWindow")({ id: winId, title: `${entry.name} - Visionneuse`, kind: "image", width: 640, height: 480 });
        const url = URL.createObjectURL(entry.blob);
        rec.body.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#000"><img src="${url}" style="max-width:100%;max-height:100%;object-fit:contain"/></div>`;
        rec.el.addEventListener("close", () => URL.revokeObjectURL(url), { once: true });
        rec.el.querySelector('[data-act="close"]')?.addEventListener("click", () => URL.revokeObjectURL(url), { once: true });
    }

    async function openAudioPlayer(entryId) {
        const entry = await getEntry(entryId);
        if (!entry?.blob) { showPlaceholder(entry?.name || "Audio", "Fichier vide."); return; }
        const winId = `audio:${entryId}`;
        if (ctx.windows.has(winId)) { focusWindow(winId); return; }
        const rec = get("createWindow")({ id: winId, title: `${entry.name} - Lecteur audio`, kind: "audio", width: 420, height: 140 });
        const url = URL.createObjectURL(entry.blob);
        rec.body.innerHTML = `<div style="padding:16px"><div style="margin-bottom:8px;font-weight:600">${entry.name}</div><audio controls autoplay style="width:100%" src="${url}"></audio></div>`;
        const cleanup = () => URL.revokeObjectURL(url);
        rec.el.addEventListener("close", cleanup, { once: true });
        rec.el.querySelector('[data-act="close"]')?.addEventListener("click", cleanup, { once: true });
    }

    async function openVideoPlayer(entryId) {
        const entry = await getEntry(entryId);
        if (!entry?.blob) { showPlaceholder(entry?.name || "Vidéo", "Fichier vide."); return; }
        const winId = `video:${entryId}`;
        if (ctx.windows.has(winId)) { focusWindow(winId); return; }
        const rec = get("createWindow")({ id: winId, title: `${entry.name} - Lecteur vidéo`, kind: "video", width: 640, height: 420 });
        const url = URL.createObjectURL(entry.blob);
        rec.body.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#000"><video controls autoplay style="max-width:100%;max-height:100%" src="${url}"></video></div>`;
        const cleanup = () => URL.revokeObjectURL(url);
        rec.el.addEventListener("close", cleanup, { once: true });
        rec.el.querySelector('[data-act="close"]')?.addEventListener("click", cleanup, { once: true });
    }

    async function openTextEditor(entryId) {
        const entry = await getEntry(entryId);
        if (!entry) return;
        const winId = `note:${entryId}`;
        const existed = ctx.windows.has(winId);
        const rec = get("createWindow")({
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
        ["utf-8", "windows-1252", "iso-8859-1", "utf-16le", "utf-16be"].forEach((enc) => {
            const o = document.createElement("option"); o.value = enc; o.textContent = enc.toUpperCase(); encSel.appendChild(o);
        });
        encSel.value = "utf-8"; encSel.title = "Encodage"; encSel.style.marginLeft = "8px";
        const ta = document.createElement("textarea");
        ta.className = "note-textarea";
        const status = el("div", "note-status");
        const updateStatus = () => {
            const lines = ta.value === "" ? 0 : ta.value.split("\n").length;
            let chars; try { const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" }); chars = [...seg.segment(ta.value)].length; } catch { chars = Array.from(ta.value).length; }
            status.textContent = `Lignes : ${lines} — Caractères : ${chars} — ${encSel.value.toUpperCase()}`;
        };
        const decode = async (blob, enc) => {
            if (!blob) return "";
            try { const buf = await blob.arrayBuffer(); return new TextDecoder(enc, { fatal: false }).decode(buf); } catch { return await blob.text(); }
        };
        const encode = (text, enc) => {
            if (enc === "utf-8") return new Blob([text], { type: "text/plain;charset=utf-8" });
            if (enc === "utf-16le" || enc === "utf-16be") {
                const le = enc === "utf-16le"; const buf = new Uint8Array(text.length * 2);
                for (let i = 0; i < text.length; i++) { const c = text.charCodeAt(i); buf[i * 2] = le ? c & 255 : c >> 8; buf[i * 2 + 1] = le ? c >> 8 : c & 255; }
                return new Blob([buf], { type: `text/plain;charset=${enc}` });
            }
            const buf = new Uint8Array(text.length); for (let i = 0; i < text.length; i++) buf[i] = text.charCodeAt(i) & 255;
            return new Blob([buf], { type: `text/plain;charset=${enc}` });
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

    function kindType(k) {
        if (k === "folder" || k === "ufolder") return "Dossier";
        if (k === "ufile") return "Fichier";
        return "Raccourci de programme";
    }

    async function openProperties(nodes) {
        const all = ctx.all || [];
        const list = (Array.isArray(nodes) ? nodes : [nodes]).filter((n) => n && n.dataset);
        const first = list[0];
        if (!first) return;
        const kind = first.dataset.kind;
        const id = first.dataset.id;
        const label = first.querySelector(".icon-label").textContent;
        const winId = list.length > 1 ? "props:multi" : `props:${kind}:${id}`;
        const existed = ctx.windows.has(winId);
        const rec = get("createWindow")({
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
            const count = (ctx.modules || []).filter((m) => (m.tags || []).includes(id)).length;
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

    return {
        openFile, openImageViewer, openAudioPlayer, openVideoPlayer,
        openTextEditor, openProperties, downloadSelected, showPlaceholder, kindType,
    };
}

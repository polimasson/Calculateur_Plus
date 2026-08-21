/**
 * Système de fichiers virtuel du bureau (IndexedDB).
 *
 * Règle d'or : l'IDENTIFIANT d'une entrée EST SON CHEMIN.
 *   - racine = "" (chaîne vide)
 *   - enfant = parent === "" ? name : `${parent}/${name}`
 *   - la Corbeille vit sous le préfixe réservé ".corbeille" (pas d'enregistrement
 *     pour le préfixe lui-même, donc il n'apparaît jamais dans les listages).
 *
 * Toute opération qui change l'emplacement (renommer/déplacer) réécrit le préfixe
 * de l'entrée ET de tous ses descendants. La vérification d'unicité des noms est
 * centralisée dans `uniqueName` / `uniqueNameFrom`, utilisée partout.
 */

const DB_NAME = "calculateur-plus-fs";
const STORE = "files";
const DB_VERSION = 3;
export const CORBEILLE = ".corbeille";
export const HOME = "Bureau";

let dbPromise = null;

function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
            const db = req.result;
            const tx = req.transaction;
            const hadOld = db.objectStoreNames.contains(STORE);
            const oldVersion = req.oldVersion;

            let oldAll = [];
            if (hadOld) {
                const oldStore = tx.objectStore(STORE);
                const gr = oldStore.getAll();
                gr.onsuccess = () => {
                    oldAll = gr.result || [];
                    rebuild(hadOld);
                };
                gr.onerror = () => rebuild(hadOld);
            } else {
                rebuild(false);
            }

            function rebuild(migrate) {
                if (migrate) db.deleteObjectStore(STORE);
                const ns = db.createObjectStore(STORE, { keyPath: "path" });
                ns.createIndex("parent", "parent");

                const now = Date.now();
                const system = (parent, path, name, kind) => {
                    ns.put({
                        path, parent, name, kind,
                        mime: "", size: 0, blob: null,
                        createdAt: now, modifiedAt: now, trashedFrom: null,
                    });
                };
                // Racine C:\ = dossier vide. Le bureau (accueil) = dossier "Bureau".
                // La Corbeille est un dossier système à la racine (préfixe ".corbeille").
                system("", HOME, "Bureau", "folder");
                system("", CORBEILLE, "Corbeille", "folder");

                if (!migrate || !oldAll.length) return;

                if (oldVersion < 2) {
                    // v1 (id) → nouveau modèle : l'accueil vit sous "Bureau"
                    const byParent = new Map();
                    for (const e of oldAll) {
                        const p = e.parent || null;
                        if (!byParent.has(p)) byParent.set(p, []);
                        byParent.get(p).push(e);
                    }
                    const taken = new Set([CORBEILLE, HOME]);
                    const queue = [];
                    for (const e of byParent.get(null) || []) {
                        const n = uniqueNameFrom([...taken], e.name);
                        taken.add(n);
                        const rec = migrateRecord(e, n, HOME);
                        ns.put(rec);
                        queue.push([e.id, rec.path]);
                    }
                    while (queue.length) {
                        const [oldParentId, newParentPath] = queue.shift();
                        const siblings = (byParent.get(oldParentId) || []).map((s) => s.name);
                        for (const c of byParent.get(oldParentId) || []) {
                            const n = uniqueNameFrom(siblings, c.name);
                            const rec = migrateRecord(c, n, newParentPath);
                            ns.put(rec);
                            queue.push([c.id, rec.path]);
                        }
                    }
                } else {
                    // v2 (chemin) → v3 : la Corbeille reste à la racine,
                    // tout le reste (l'ancien accueil) est déplacé sous "Bureau"
                    for (const e of oldAll) {
                        const path = e.path || "";
                        if (!path) continue;
                        if (path === CORBEILLE || path.startsWith(CORBEILLE + "/")) {
                            ns.put(e);
                        } else {
                            e.path = HOME + "/" + path;
                            e.parent = (e.parent || "") === "" ? HOME : HOME + "/" + (e.parent || "");
                            ns.put(e);
                        }
                    }
                }
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
    return dbPromise;
}

function migrateRecord(old, name, parentPath) {
    return {
        path: parentPath ? `${parentPath}/${name}` : name,
        parent: parentPath,
        name,
        kind: old.kind === "folder" ? "folder" : "file",
        mime: old.mime || "",
        size: old.size || 0,
        blob: old.blob || null,
        createdAt: old.createdAt || Date.now(),
        modifiedAt: old.modifiedAt || Date.now(),
        trashedFrom: old.trashedFrom || null,
    };
}

async function run(mode, fn) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const store = t.objectStore(STORE);
        let out;
        try {
            out = fn(store);
        } catch (err) {
            reject(err);
            return;
        }
        if (out instanceof IDBRequest) {
            out.onsuccess = () => resolve(out.result);
            out.onerror = () => reject(out.error);
            return;
        }
        t.oncomplete = () => resolve(out);
        t.onerror = () => reject(t.error);
        t.onabort = () => reject(t.error);
    });
}

function byName(a, b) {
    return a.name.localeCompare(b.name, "fr", { numeric: true });
}

/**
 * Unicité des noms — fonction PURE, système, réutilisée partout.
 * base "Rapport.txt" + collision → "Rapport (2).txt", "Rapport (3).txt"...
 */
export function uniqueNameFrom(existing, base) {
    const name = String(base || "").trim() || "Sans nom";
    if (!existing.includes(name)) return name;
    const dot = name.lastIndexOf(".");
    const stem = dot > 0 ? name.slice(0, dot) : name;
    const ext = dot > 0 ? name.slice(dot) : "";
    let i = 2;
    while (existing.includes(`${stem} (${i})${ext}`)) i++;
    return `${stem} (${i})${ext}`;
}

/** Unicité des noms — version async qui liste les frères du parent. */
export async function uniqueName(parent, base) {
    const siblings = await listEntries(parent);
    const existing = siblings.map((s) => s.name);
    if ((parent || "") === "") existing.push(CORBEILLE);
    return uniqueNameFrom(existing, base);
}

export function initFS() {
    return openDB();
}

export function listEntries(parent = "") {
    parent = parent || "";
    return run("readonly", (store) => store.index("parent").getAll(parent)).then((r) =>
        (r || []).sort(byName)
    );
}

export function getEntry(path) {
    return run("readonly", (store) => store.get(path));
}

export function parentPath(path) {
    const i = path.lastIndexOf("/");
    return i === -1 ? "" : path.slice(0, i);
}

export function nameOfPath(path) {
    const i = path.lastIndexOf("/");
    return i === -1 ? path : path.slice(i + 1);
}

function pathJoin(parent, name) {
    return parent ? `${parent}/${name}` : name;
}

async function put(record) {
    await run("readwrite", (store) => store.put(record));
    return record;
}
export async function putEntry(entry) { return put(entry); }

function baseRecord(parent, name, kind) {
    const path = pathJoin(parent, name);
    return {
        path,
        parent: parent || "",
        name,
        kind,
        mime: "",
        size: 0,
        blob: null,
        createdAt: Date.now(),
        modifiedAt: Date.now(),
        trashedFrom: null,
    };
}

export async function createFolder(parent, base) {
    const name = await uniqueName(parent, base);
    const rec = baseRecord(parent, name, "folder");
    return put(rec);
}

export async function createTextFile(parent, base, content = "") {
    const name = await uniqueName(parent, base);
    const rec = baseRecord(parent, name, "file");
    rec.mime = "text/plain;charset=utf-8";
    rec.blob = new Blob([content], { type: rec.mime });
    rec.size = rec.blob.size;
    return put(rec);
}

/**
 * Crée un raccourci (.lnk) vers une entrée utilisateur.
 * Si la cible est elle-même un raccourci, on pointe vers sa cible réelle.
 */
export async function createShortcut(targetPath, parent) {
    const t0 = await getEntry(targetPath);
    if (!t0) return null;
    const targetPathReal = t0.kind === "shortcut" ? t0.target : t0.path;
    const target = await getEntry(targetPathReal);
    if (!target) return null;
    const base = (target.name || "Fichier").replace(/\.[^.]+$/, "") + " - Raccourci.lnk";
    const name = await uniqueName(parent, base);
    const rec = baseRecord(parent, name, "shortcut");
    rec.target = targetPathReal;
    rec.targetKind = target.kind;
    rec.mime = target.mime || "";
    return put(rec);
}

export async function importFiles(parent, fileList) {
    const created = [];
    for (const file of fileList) {
        const rec = baseRecord(parent, await uniqueName(parent, file.name), "file");
        rec.mime = file.type || "application/octet-stream";
        rec.size = file.size;
        rec.blob = file;
        await put(rec);
        created.push(rec);
    }
    return created;
}

/** Tous les descendants directs/indirects d'un chemin (préfixe path + "/"). */
function descendantsRange(path) {
    const prefix = path + "/";
    return run("readonly", (store) =>
        store.getAll(IDBKeyRange.bound(prefix, prefix + "\uffff"))
    );
}

/**
 * Cœur : déplace l'entrée `oldPath` (et toute sa descendance) vers `newPath`.
 * Réécrit le préfixe de chaque descendant. `meta` permet de poser trashedFrom.
 */
async function changePath(oldPath, newPath, meta = {}) {
    const rec = await getEntry(oldPath);
    if (!rec) return null;
    if (oldPath === newPath) return rec;
    const prefix = oldPath + "/";
    const desc = await descendantsRange(oldPath);
    await run("readwrite", (store) => {
        if (meta.trashedFrom !== undefined) rec.trashedFrom = meta.trashedFrom;
        rec.path = newPath;
        rec.parent = parentPath(newPath);
        rec.name = nameOfPath(newPath);
        rec.modifiedAt = Date.now();
        store.put(rec);
        store.delete(oldPath);
        for (const d of desc) {
            const oldChild = d.path;
            d.path = newPath + "/" + d.path.slice(prefix.length);
            d.parent = parentPath(d.path);
            d.name = nameOfPath(d.path);
            store.put(d);
            store.delete(oldChild);
        }
    });
    return rec;
}

/** Dossiers système : le bureau (Bureau) et la Corbeille sont intouchables. */
function isProtected(path) {
    return path === HOME || path === CORBEILLE;
}

/** Vrai si le dossier de destination est la Corbeille ou son contenu. */
function isInsideCorbeille(dir) {
    return dir === CORBEILLE || dir.startsWith(CORBEILLE + "/");
}

function mimeForName(name, fallback = "") {
    const ext = extOf(name).toLowerCase();
    const map = {
        ".txt": "text/plain", ".md": "text/markdown", ".json": "application/json", ".csv": "text/csv", ".log": "text/plain", ".ini": "text/plain",
        ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp", ".bmp": "image/bmp", ".svg": "image/svg+xml",
        ".mp3": "audio/mpeg", ".wav": "audio/wav", ".ogg": "audio/ogg", ".flac": "audio/flac", ".m4a": "audio/mp4", ".aac": "audio/aac", ".opus": "audio/opus",
        ".mp4": "video/mp4", ".webm": "video/webm", ".mkv": "video/x-matroska", ".avi": "video/x-msvideo", ".mov": "video/quicktime",
        ".pdf": "application/pdf", ".zip": "application/zip",
    };
    return map[ext] || fallback || "application/octet-stream";
}
/** Renomme l'entrée `path` (nom seul, le parent ne change pas). */
export async function renameEntry(path, newName) {
    const rec = await getEntry(path);
    if (!rec || isProtected(path)) return null;
    const siblings = await listEntries(rec.parent);
    const finalName = uniqueNameFrom(
        siblings.filter((s) => s.path !== path).map((s) => s.name),
        newName
    );
    const newPath = pathJoin(rec.parent, finalName);
    const rec2 = await changePath(path, newPath);
    if (rec2 && rec2.kind === "file") {
        const newMime = mimeForName(finalName, rec2.mime);
        if (newMime !== rec2.mime) { rec2.mime = newMime; await put(rec2); }
    }
    return rec2;
}

/** Déplace l'entrée `path` dans le dossier `newParent` (nom auto-unique). */
export async function moveEntry(path, newParent) {
    const rec = await getEntry(path);
    if (!rec || isProtected(path)) return null;
    if (isInsideCorbeille(newParent)) return null;
    if ((rec.parent || "") === (newParent || "")) return rec;
    if (newParent === path || newParent.startsWith(path + "/")) return null;
    const finalName = await uniqueName(newParent, rec.name);
    const newPath = pathJoin(newParent, finalName);
    return changePath(path, newPath);
}

/** Copie l'entrée `path` (sous-arbre entier) dans `newParent`. */
export async function copyEntry(path, newParent) {
    const rec = await getEntry(path);
    if (!rec || isProtected(path)) return null;
    if (isInsideCorbeille(newParent)) return null;
    const finalName = await uniqueName(newParent, rec.name);
    const newPath = pathJoin(newParent, finalName);
    const prefix = path + "/";
    const desc = await descendantsRange(path);
    const copyOf = (src, destPath) => ({
        path: destPath,
        parent: parentPath(destPath),
        name: nameOfPath(destPath),
        kind: src.kind,
        mime: src.mime,
        size: src.size,
        blob: src.blob,
        createdAt: Date.now(),
        modifiedAt: Date.now(),
        trashedFrom: null,
        ...(src.kind === "shortcut" ? { target: src.target, targetKind: src.targetKind } : {}),
    });
    await run("readwrite", (store) => {
        store.put(copyOf(rec, newPath));
        for (const d of desc) {
            store.put(copyOf(d, newPath + "/" + d.path.slice(prefix.length)));
        }
    });
    return getEntry(newPath);
}

/** Supprime définitivement plusieurs chemins (avec leur sous-arbre). */
export async function deleteEntries(paths) {
    const unique = dedupePaths(paths).filter((p) => !isProtected(p));
    if (!unique.length) return;
    await run("readwrite", (store) => {
        for (const p of unique) {
            store.delete(p);
            const prefix = p + "/";
            store.delete(IDBKeyRange.bound(prefix, prefix + "\uffff"));
        }
    });
}

/** Envoie à la Corbeille (déplacement sous ".corbeille", trashedFrom conservé). */
export async function trashEntries(paths) {
    const unique = dedupePaths(paths);
    const moved = [];
    for (const p of unique) {
        if (isProtected(p)) continue;
        const rec = await getEntry(p);
        if (!rec) continue;
        const finalName = await uniqueName(CORBEILLE, rec.name);
        const newPath = pathJoin(CORBEILLE, finalName);
        await changePath(p, newPath, { trashedFrom: p });
        moved.push(newPath);
    }
    return moved;
}

/** Restaure l'entrée corbeillée vers son dossier d'origine (ou la racine). */
export async function restoreEntry(path) {
    const rec = await getEntry(path);
    if (!rec || path === CORBEILLE) return null;
    const destParent = rec.trashedFrom ? parentPath(rec.trashedFrom) : "";
    const finalName = await uniqueName(destParent, rec.name);
    const newPath = pathJoin(destParent, finalName);
    return changePath(path, newPath, { trashedFrom: null });
}

/** Liste les éléments de premier niveau de la Corbeille. */
export async function listCorbeille() {
    return listEntries(CORBEILLE);
}

/** Vide la Corbeille. Renvoie le nombre d'éléments supprimés. */
export async function emptyTrash() {
    const all = await run("readonly", (store) =>
        store.getAll(IDBKeyRange.bound(CORBEILLE + "/", CORBEILLE + "/\uffff"))
    );
    await run("readwrite", (store) =>
        store.delete(IDBKeyRange.bound(CORBEILLE + "/", CORBEILLE + "/\uffff"))
    );
    return all.length;
}

export async function readText(path) {
    const rec = await getEntry(path);
    if (!rec || !rec.blob) return "";
    if (typeof rec.blob.text === "function") return rec.blob.text();
    return rec.blob instanceof Blob ? await new Response(rec.blob).text() : String(rec.blob);
}

export async function writeText(path, content) {
    const rec = await getEntry(path);
    if (!rec) return null;
    rec.blob = new Blob([content], { type: rec.mime || "text/plain;charset=utf-8" });
    rec.size = rec.blob.size;
    rec.modifiedAt = Date.now();
    return put(rec);
}

export function formatSize(bytes) {
    if (!Number.isFinite(bytes)) return "0 octet";
    if (bytes < 1024) return `${bytes} octet${bytes > 1 ? "s" : ""}`;
    const units = ["Ko", "Mo", "Go", "To"];
    let v = bytes;
    let i = -1;
    do {
        v /= 1024;
        i++;
    } while (v >= 1024 && i < units.length - 1);
    return `${v.toFixed(1).replace(".", ",")} ${units[i]}`;
}

export const FILE_TYPES = {
    audio: { label: "Fichier audio", exts: ["wav", "mp3", "ogg", "flac", "m4a", "aac", "opus"] },
    video: { label: "Fichier vidéo", exts: ["mp4", "webm", "mkv", "avi", "mov"] },
    image: { label: "Fichier image", exts: ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"] },
    text: { label: "Fichier texte", exts: ["txt", "md", "log", "ini", "csv"] },
    json: { label: "Fichier JSON", exts: ["json"] },
    pdf: { label: "Document PDF", exts: ["pdf"] },
    archive: { label: "Archive", exts: ["zip", "rar", "7z", "tar", "gz"] },
    other: { label: "Fichier", exts: [] },
};

export function extOf(name) {
    const dot = name.lastIndexOf(".");
    return dot > 0 ? name.slice(dot).toLowerCase() : "";
}

export function fileCategory(entry) {
    const mime = (entry && entry.mime) || "";
    const name = entry ? entry.name : "";
    if (mime.startsWith("audio/") || /\.(mp3|wav|ogg|flac|m4a|aac|opus)$/i.test(name)) return "audio";
    if (mime.startsWith("video/") || /\.(mp4|webm|mkv|avi|mov)$/i.test(name)) return "video";
    if (mime.startsWith("image/") || /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i.test(name)) return "image";
    if (mime.startsWith("text/") || /\.(txt|md|log|ini|csv)$/i.test(name)) return "text";
    if (/\.json$/i.test(name)) return "json";
    if (/\.pdf$/i.test(name)) return "pdf";
    if (/\.(zip|rar|7z|tar|gz)$/i.test(name)) return "archive";
    return "other";
}

export function typeLabel(entry) {
    const cat = fileCategory(entry);
    const def = FILE_TYPES[cat] || FILE_TYPES.other;
    if (cat === "other") return def.label;
    return `[${cat}] : ${def.exts.join(", ")}`;
}

/** Chemin affichable à la Windows : C:\Bureau\Dossier\fichier.txt */
export function displayPath(path) {
    const norm = path ? path.replace(/\//g, "\\") : "";
    if (norm === CORBEILLE || norm.startsWith(CORBEILLE + "\\")) {
        const rest = norm.slice(CORBEILLE.length);
        return `C:\\Corbeille${rest ? "\\" + rest : ""}`;
    }
    return `C:\\${norm}`;
}

function dedupePaths(paths) {
    const out = [];
    for (const p of paths) {
        if (!p || p === CORBEILLE) continue;
        if (out.some((o) => o === p || p.startsWith(o + "/"))) continue;
        out.push(p);
    }
    return out;
}
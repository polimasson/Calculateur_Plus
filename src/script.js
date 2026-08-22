let allModules = []; // Stockage des données JSON
let activeTags = new Set(); // Tags sélectionnés pour le filtre
let strictTagMode = false; // Mode strict : AND entre les tags, sinon OR
let currentModuleJs = null; // Référence au module actif pour le cleanup
let isLoadingModule = false; // Empêche le double chargement
let activeModuleId = null; // ID du module actif ou en cours de chargement
let themesDoc = { default: "classic", themes: [] };
let currentThemeId = "classic";
let desktopHandle = null;

const menu = document.getElementById("menu");
const content = document.getElementById("content");
const moduleContainer = document.getElementById("module");
const moduleList = document.getElementById("moduleList");
const tagFiltersContainer = document.getElementById("tagFilters");
const desktopRoot = document.getElementById("desktop-root");

// Chemin de base : racine du site (script dans src/)
let basePath = "./";
try {
    const scriptEl = document.querySelector("script[src*='src/script.js']");
    const scriptSrc = scriptEl?.src || document.currentScript?.src || "";
    if (scriptSrc) {
        const cleanSrc = scriptSrc.split("?")[0].split("#")[0];
        basePath = new URL("..", cleanSrc).href;
    }
} catch (e) {
    console.warn("Impossible de déterminer le chemin de base", e);
}

function themeStorageKey() {
    return themesDoc.storageKey || "cp.theme";
}

function currentThemeDef() {
    return themesDoc.themes.find((t) => t.id === currentThemeId) || themesDoc.themes[0];
}

function isDesktopShell() {
    return currentThemeDef()?.shell === "desktop";
}

const hiddenModulesKey = "cp.hiddenModules";

function hiddenModuleIds() {
    try {
        return JSON.parse(localStorage.getItem(hiddenModulesKey) || "[]");
    } catch {
        return [];
    }
}

function isModuleHidden(m) {
    return m.visibility === "off" || hiddenModuleIds().includes(m.id);
}

function setModuleHidden(id, hidden) {
    const ids = hiddenModuleIds();
    const i = ids.indexOf(id);
    if (hidden && i === -1) ids.push(id);
    if (!hidden && i !== -1) ids.splice(i, 1);
    localStorage.setItem(hiddenModulesKey, JSON.stringify(ids));
}

function visibleModules() {
    return allModules.filter((m) => !isModuleHidden(m));
}

function renderThemeSwitcher() {
    const host = document.getElementById("shellSwitcher");
    if (!host) return;
    host.innerHTML = "";
    for (const t of themesDoc.themes) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = t.name;
        btn.classList.toggle("active-shell", t.id === currentThemeId);
        btn.addEventListener("click", () => setTheme(t.id));
        host.appendChild(btn);
    }
}

function clearThemeStyles() {
    document.querySelectorAll("link[data-theme-css]").forEach((l) => l.remove());
}

async function setTheme(id) {
    const def = themesDoc.themes.find((t) => t.id === id);
    if (!def) return;

    currentThemeId = def.id;
    localStorage.setItem(themeStorageKey(), def.id);
    document.documentElement.dataset.theme = def.id;
    renderThemeSwitcher();

    if (desktopHandle) {
        desktopHandle.unmount();
        desktopHandle = null;
    }
    clearThemeStyles();

    if (def.shell === "desktop") {
        if (!content.classList.contains("hidden")) goBack();
        menu.classList.add("hidden");
        content.classList.add("hidden");
        document.body.classList.add("shell-desktop");
        for (const href of def.css || []) {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = `${basePath}${href}`;
            link.dataset.themeCss = def.id;
            document.head.appendChild(link);
        }
        const { mountDesktop } = await import(`${basePath}src/shell/desktop.js?v=55`);
        desktopHandle = mountDesktop({
            root: desktopRoot,
            modules: visibleModules(),
            catalog: allModules,
            theme: def,
            basePath,
            themes: themesDoc.themes,
            onSwitchTheme: setTheme,
            isHidden: isModuleHidden,
            setHidden: setModuleHidden,
            getModules: () => visibleModules(),
        });
        return;
    }

    document.body.classList.remove("shell-desktop");
    if (desktopRoot) {
        desktopRoot.hidden = true;
        desktopRoot.innerHTML = "";
    }
    menu.classList.remove("hidden");
}

// --- 1. CHARGEMENT INITIAL ---
async function initApp() {
    try {
        themesDoc = await fetch(`${basePath}src/themes/themes.json`).then((r) => r.json());
        const saved = localStorage.getItem(themeStorageKey());
        currentThemeId =
            themesDoc.themes.some((t) => t.id === saved) ? saved : (themesDoc.default || "classic");

        const response = await fetch(`${basePath}src/modules.json`);
        allModules = await response.json();
        
        // On lance le filtre directement pour masquer les "off" d'entrée de jeu
        filterModules(); 
        renderTags();
        renderThemeSwitcher();
        await setTheme(currentThemeId);
        
        const hash = window.location.hash.slice(1);
        if (hash && hash.startsWith("module-")) {
            const moduleId = hash.replace("module-", "");
            const moduleExists = allModules.find((m) => m.id === moduleId && !isModuleHidden(m));
            if (moduleExists) {
                if (isDesktopShell() && desktopHandle) {
                    desktopHandle.openModule(moduleId);
                } else if (!isDesktopShell()) {
                    loadModule(moduleId);
                }
            }
        }
    } catch (e) {
        console.error("Erreur chargement modules.json", e);
    }
}
// --- 2. AFFICHAGE DU MENU ---
function renderMenu(modules) {
    moduleList.innerHTML = `
        <li class="module-item control-panel-entry">
            <a onclick="openControlPanel()">
                <span class="name">🛠️ Panneau de configuration</span>
            </a>
        </li>
    ` + modules.map(m => `
        <li class="module-item" data-id="${m.id}">
            <a onclick="loadModule('${m.id}')">
                <span class="name">${m.name}</span>
                <span class="version">v${m.version}</span>
            </a>
            <div class="tags">${m.tags.map(t => `<small>#${t}</small>`).join(' ')}</div>
        </li>
    `).join('');
}

function renderTags() {
    const visible = visibleModules();
    const tags = [...new Set(visible.flatMap((m) => m.tags || []))];
    const pruned = [...activeTags].filter((t) => tags.includes(t));
    if (pruned.length !== activeTags.size) {
        activeTags = new Set(pruned);
        filterModules();
    }
    tagFiltersContainer.innerHTML = tags.map(t => `
        <button class="tag-btn ${activeTags.has(t) ? 'active' : ''}" onclick="toggleTag('${t}', this)">${t}</button>
    `).join('');
}

// --- 3. LOGIQUE DE FILTRE ---
function toggleTag(tag, el) {
    el.classList.toggle('active');
    activeTags.has(tag) ? activeTags.delete(tag) : activeTags.add(tag);
    filterModules();
}

function filterModules() {
    const searchTerm = document.getElementById("searchInput").value.toLowerCase();
    strictTagMode = document.getElementById("strictTagFilter")?.checked || false;
    
    const filtered = allModules.filter(m => {
        // Condition 1 : Est-ce que le module est visible ?
        const isVisible = !isModuleHidden(m);
        
        // Condition 2 : Correspond-il à la recherche texte ?
        const matchesSearch = m.name.toLowerCase().includes(searchTerm);
        
        // Condition 3 : Correspond-il aux tags sélectionnés ?
        let matchesTags;
        if (activeTags.size === 0) {
            matchesTags = true;
        } else if (strictTagMode) {
            // Mode strict : le module doit avoir TOUS les tags sélectionnés
            matchesTags = [...activeTags].every(t => m.tags.includes(t));
        } else {
            // Mode normal : le module doit avoir AU MOINS UN des tags sélectionnés
            matchesTags = m.tags.some(t => activeTags.has(t));
        }
        
        // Il faut que TOUTES les conditions soient vraies, surtout la visibilité
        return isVisible && matchesSearch && matchesTags;
    });
    
    renderMenu(filtered);
    updateModuleCount(filtered.length);
}

function updateModuleCount(count) {
    const totalModules = visibleModules().length;
    const moduleCountEl = document.getElementById("moduleCount");
    if (moduleCountEl) {
        if (count === totalModules) {
            moduleCountEl.innerHTML = `<span class="count-number">${count}</span> module${count > 1 ? 's' : ''} disponible${count > 1 ? 's' : ''}`;
        } else {
            moduleCountEl.innerHTML = `<span class="count-number">${count}</span> / ${totalModules} module${totalModules > 1 ? 's' : ''} (filtré${count > 1 ? 's' : ''})`;
        }
    }
}

// --- 4. CHARGEMENT DYNAMIQUE DU MODULE ---
async function loadModule(moduleId) {
    if (isDesktopShell()) {
        if (!desktopHandle) await setTheme(currentThemeId);
        desktopHandle?.openModule(moduleId);
        return;
    }
    // Éviter le double chargement
    if (isLoadingModule) {
        console.log('Module déjà en cours de chargement, ignore');
        return;
    }
    activeModuleId = moduleId;
    isLoadingModule = true;
    
    const oldStyle = document.querySelector('link[id^="css-"]');
    if (oldStyle) oldStyle.remove();
    // Nettoyer le module précédent s'il expose une fonction destroy()
    if (currentModuleJs && typeof currentModuleJs.destroy === 'function') {
        try { currentModuleJs.destroy(); } catch(e) { console.warn('Erreur cleanup module:', e); }
    }
    currentModuleJs = null;

    const meta = allModules.find(m => m.id === moduleId);
    const effectiveId = meta?.alias || moduleId;
    const preset = meta?.preset;
    const path = `${basePath}modules/${effectiveId}/`;

    // Mettre à jour l'URL avec le hash du module
    //double chargement
    window.location.hash = `module-${moduleId}`;

    // UI transition
    menu.classList.add("hidden");
    content.classList.remove("hidden");
    moduleContainer.innerHTML = "<p>Chargement...</p>";
    try {
        // Chargement CSS
        const cssId = `css-${effectiveId}`;
        if (!document.getElementById(cssId)) {
            const link = document.createElement("link");
            link.id = cssId;
            link.rel = "stylesheet";
            link.href = `${path}module.css`;
            document.head.appendChild(link);
        }

        // Chargement HTML
        const html = await fetch(`${path}module.html`).then(r => r.text());
        moduleContainer.innerHTML = html;
        //console.log("Contenu injecté dans #module :", moduleContainer.innerHTML);
        // Informations du module (version, dates)
        document.getElementById('module-info').innerHTML = `
            <small>Nom: ${meta.name} | Version: ${meta.version} | Auteur: ${meta.author}</small>
        `;

        // Chargement JS (ES Modules)
        const moduleJs = await import(`${path}module.js?v=55`);
        currentModuleJs = moduleJs;
        if (moduleJs.init) moduleJs.init(moduleContainer, preset ? { preset, locked: !!meta?.alias } : {});

    } catch (err) {
        console.error(err);
        moduleContainer.innerHTML = "<p>Erreur lors du chargement du module.</p>";
    } finally {
        isLoadingModule = false; // Toujours remettre à false
    }
}

function goBack() {
    // 1. Récupérer l'ID du module actuellement chargé
    // On peut le retrouver via l'info stockée ou en cherchant la balise link qui commence par 'css-'
    const currentStyle = document.querySelector('link[id^="css-"]');
    
    if (currentStyle) {
        currentStyle.remove();
        console.log(`Style ${currentStyle.id} supprimé.`);
    }

    // 2. Nettoyer le hash de l'URL
    window.history.pushState("", document.title, window.location.pathname + window.location.search);

    // 3. Transition UI
    menu.classList.remove("hidden");
    content.classList.add("hidden");

    // 4. Nettoyage du contenu et du module actif
    if (currentModuleJs && typeof currentModuleJs.destroy === 'function') {
        try { currentModuleJs.destroy(); } catch(e) { console.warn('Erreur cleanup module:', e); }
    }
    currentModuleJs = null;
    activeModuleId = null;
    moduleContainer.innerHTML = "";
}
// --- PANNAU DE CONFIGURATION (visibilité des modules) ---
function openControlPanel() {
    let panel = document.getElementById("controlPanel");
    if (panel) {
        panel.hidden = !panel.hidden;
        if (!panel.hidden) renderControlPanel(panel);
        return;
    }
    panel = document.createElement("div");
    panel.id = "controlPanel";
    panel.className = "control-panel";
    document.body.appendChild(panel);
    panel.addEventListener("click", (e) => {
        if (e.target === panel) panel.hidden = true;
    });
    renderControlPanel(panel);
}

function renderControlPanel(panel) {
    panel.innerHTML = `
        <div class="control-panel-box">
            <div class="control-panel-header">
                <h3>Panneau de configuration</h3>
                <button type="button" onclick="document.getElementById('controlPanel').hidden = true">✕</button>
            </div>
            <div class="control-panel-toolbar">
                <button type="button" id="cpAllOn">Tout activer</button>
                <button type="button" id="cpAllOff">Tout désactiver</button>
            </div>
            <div class="control-panel-list"></div>
        </div>`;
    const list = panel.querySelector(".control-panel-list");
    const applyAll = (hidden) => {
        for (const m of allModules) {
            if (m.visibility !== "off") setModuleHidden(m.id, hidden);
        }
        filterModules();
        renderTags();
        renderControlPanel(panel);
    };
    panel.querySelector("#cpAllOn").addEventListener("click", () => applyAll(false));
    panel.querySelector("#cpAllOff").addEventListener("click", () => applyAll(true));
    for (const m of allModules) {
        const isOff = m.visibility === "off";
        const row = document.createElement("label");
        row.className = "control-row";
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = !isModuleHidden(m);
        cb.disabled = isOff;
        const name = document.createElement("span");
        name.className = "control-name";
        name.textContent = m.name;
        const tags = document.createElement("small");
        tags.className = "control-tags";
        tags.textContent = (m.tags || []).map((t) => `#${t}`).join(" ");
        row.append(cb, name, tags);
        cb.addEventListener("change", () => {
            setModuleHidden(m.id, !cb.checked);
            filterModules();
            renderTags();
        });
        list.appendChild(row);
    }
}

// --- GESTION DU THEME ---
function initTheme() {
    const savedTheme = localStorage.getItem('darkMode');
    const isDark = savedTheme === 'true';
    if (isDark) {
        document.body.classList.add('dark-mode');
        updateThemeIcon(true);
    }
}

function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', isDark);
    updateThemeIcon(isDark);
}

function updateThemeIcon(isDark) {
    const btn = document.getElementById('themeToggle');
    if (btn) btn.textContent = isDark ? '☀️' : '🌙';
}

// Détection des changements de hash (retour/avant navigation)
window.addEventListener('hashchange', () => {
   const hash = window.location.hash.slice(1);
   if (isDesktopShell()) {
       if (hash.startsWith('module-') && desktopHandle) {
           desktopHandle.openModule(hash.replace('module-', ''));
       }
       return;
   }
   if (!hash) {
       goBack(); // Si le hash disparaît, on revient au menu
   } else if (hash.startsWith('module-')) {
       const moduleId = hash.replace('module-', '');
       if (moduleId === activeModuleId) {
           return; // Déjà chargé ou en cours de chargement
       }
       const moduleExists = allModules.find(m => m.id === moduleId && !isModuleHidden(m));
       if (moduleExists) {
           loadModule(moduleId);
       }
   }
});

window.addEventListener("message", (e) => {
    if (e.data?.type === "cp-open-module" && e.data.id) {
        loadModule(e.data.id);
    }
});

// Lancement au démarrage
initTheme();
initApp();

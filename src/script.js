let allModules = []; // Stockage des données JSON
let activeTags = new Set(); // Tags sélectionnés pour le filtre
let strictTagMode = false; // Mode strict : AND entre les tags, sinon OR
let currentModuleJs = null; // Référence au module actif pour le cleanup
let isLoadingModule = false; // Empêche le double chargement

const menu = document.getElementById("menu");
const content = document.getElementById("content");
const moduleContainer = document.getElementById("module");
const moduleList = document.getElementById("moduleList");
const tagFiltersContainer = document.getElementById("tagFilters");

// Chemin de base dynamique déduit de l'emplacement du script
let basePath = './';
try {
    const scriptSrc = document.currentScript?.src || '';
    if (scriptSrc) {
        const cleanSrc = scriptSrc.split('?')[0].split('#')[0];
        basePath = new URL('..', cleanSrc).href;
    }
} catch (e) {
    console.warn('Impossible de déterminer le chemin de base', e);
}

// --- 1. CHARGEMENT INITIAL ---
async function initApp() {
    try {
        const response = await fetch(`${basePath}src/modules.json`);
        allModules = await response.json();
        
        // On lance le filtre directement pour masquer les "off" d'entrée de jeu
        filterModules(); 
        renderTags();
        
        // Vérifier si un hash existe dans l'URL et charger le module correspondant
        const hash = window.location.hash.slice(1);
        if (hash && hash.startsWith('module-')) {
            const moduleId = hash.replace('module-', '');
            const moduleExists = allModules.find(m => m.id === moduleId && m.visibility !== 'off');
            if (moduleExists) {
                loadModule(moduleId);
            }
        }
    } catch (e) {
        console.error("Erreur chargement modules.json", e);
    }
}
// --- 2. AFFICHAGE DU MENU ---
function renderMenu(modules) {
    moduleList.innerHTML = modules.map(m => `
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
    // On ne récupère les tags que des modules qui ne sont pas sur "off"
    const visibleModules = allModules.filter(m => m.visibility !== "off");
    const tags = [...new Set(visibleModules.flatMap(m => m.tags))];
    
    tagFiltersContainer.innerHTML = tags.map(t => `
        <button class="tag-btn" onclick="toggleTag('${t}', this)">${t}</button>
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
        const isVisible = m.visibility !== "off";
        
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
    const totalModules = allModules.filter(m => m.visibility !== "off").length;
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
    // Éviter le double chargement
    if (isLoadingModule) {
        console.log('Module déjà en cours de chargement, ignore');
        return;
    }
    isLoadingModule = true;
    
    const oldStyle = document.querySelector('link[id^="css-"]');
    if (oldStyle) oldStyle.remove();
    // Nettoyer le module précédent s'il expose une fonction destroy()
    if (currentModuleJs && typeof currentModuleJs.destroy === 'function') {
        try { currentModuleJs.destroy(); } catch(e) { console.warn('Erreur cleanup module:', e); }
    }
    currentModuleJs = null;

    const meta = allModules.find(m => m.id === moduleId);
    const path = `${basePath}modules/${moduleId}/`;

    // Mettre à jour l'URL avec le hash du module
    //double chargement
    window.location.hash = `module-${moduleId}`;

    // UI transition
    menu.classList.add("hidden");
    content.classList.remove("hidden");
    moduleContainer.innerHTML = "<p>Chargement...</p>";
    try {
        // Chargement CSS
        const cssId = `css-${moduleId}`;
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
        const moduleJs = await import(`${path}module.js`);
        currentModuleJs = moduleJs;
        if (moduleJs.init) moduleJs.init(moduleContainer);

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
    moduleContainer.innerHTML = "";
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
   if (!hash) {
       goBack(); // Si le hash disparaît, on revient au menu
   } else if (hash.startsWith('module-')) {
       const moduleId = hash.replace('module-', '');
       const moduleExists = allModules.find(m => m.id === moduleId && m.visibility !== 'off');
       if (moduleExists) {
           loadModule(moduleId);
       }
   }
});

// Lancement au démarrage
initTheme();
initApp();

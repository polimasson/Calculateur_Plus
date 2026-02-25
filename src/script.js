let allModules = []; // Stockage des données JSON
let activeTags = new Set(); // Tags sélectionnés pour le filtre

const menu = document.getElementById("menu");
const content = document.getElementById("content");
const moduleContainer = document.getElementById("module");
const moduleList = document.getElementById("moduleList");
const tagFiltersContainer = document.getElementById("tagFilters");

// --- 1. CHARGEMENT INITIAL ---
async function initApp() {
    try {
        const response = await fetch('./modules.json');
        allModules = await response.json();
        
        // On lance le filtre directement pour masquer les "off" d'entrée de jeu
        filterModules(); 
        renderTags();
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
    
    const filtered = allModules.filter(m => {
        // Condition 1 : Est-ce que le module est visible ?
        const isVisible = m.visibility !== "off";
        
        // Condition 2 : Correspond-il à la recherche texte ?
        const matchesSearch = m.name.toLowerCase().includes(searchTerm);
        
        // Condition 3 : Correspond-il aux tags sélectionnés ?
        const matchesTags = activeTags.size === 0 || m.tags.some(t => activeTags.has(t));
        
        // Il faut que TOUTES les conditions soient vraies, surtout la visibilité
        return isVisible && matchesSearch && matchesTags;
    });
    
    renderMenu(filtered);
}

// --- 4. CHARGEMENT DYNAMIQUE DU MODULE ---
async function loadModule(moduleId) {
    const oldStyle = document.querySelector('link[id^="css-"]');
    if (oldStyle) oldStyle.remove();
    const meta = allModules.find(m => m.id === moduleId);
    const path = `/Calculateur_Plus/modules/${moduleId}/`;

    // UI transition
    menu.classList.add("hidden");
    content.classList.remove("hidden");
    moduleContainer.innerHTML = "<p>Chargement...</p>";
    await new Promise(r => setTimeout(r, 900)); // Simuler un délai de chargement pour la transition
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
        console.log("Contenu injecté dans #module :", moduleContainer.innerHTML);
        // Informations du module (version, dates)
        document.getElementById('module-info').innerHTML = `
            <small>Nom: ${meta.name} | Version: ${meta.version} | Modifié le: ${meta.modified}</small>
        `;

        // Chargement JS (ES Modules)
        const moduleJs = await import(`${path}module.js?t=${Date.now()}`);
        if (moduleJs.init) moduleJs.init(moduleContainer);

    } catch (err) {
        console.error(err);
        moduleContainer.innerHTML = "<p>Erreur lors du chargement du module.</p>";
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

    // 2. Transition UI
    menu.classList.remove("hidden");
    content.classList.add("hidden");
    
    // 3. Nettoyage du contenu
    moduleContainer.innerHTML = "";
}
// Lancement au démarrage
initApp();

const params = new URLSearchParams(location.search);
const themeId = params.get("theme") || "win95";
const moduleId = params.get("id");
const moduleRoot = document.getElementById("module");

window.loadModule = (id) => {
    window.parent.postMessage({ type: "cp-open-module", id }, "*");
};

function addCss(href) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
}

async function boot() {
    if (!moduleId) {
        moduleRoot.textContent = "Module manquant.";
        return;
    }

    const themesDoc = await fetch("src/themes/themes.json").then((r) => r.json());
    const theme = themesDoc.themes.find((t) => t.id === themeId) || themesDoc.themes[0];
    const catalog = await fetch("src/modules.json").then((r) => r.json());
    const meta = catalog.find((m) => m.id === moduleId);
    const effectiveId = meta?.alias || moduleId;
    const preset = meta?.preset;

    const path = `modules/${effectiveId}/`;
    addCss(`${path}module.css`);
    for (const href of theme.frameCss || []) {
        addCss(href);
    }

    try {
        const html = await fetch(`${path}module.html`).then((r) => {
            if (!r.ok) throw new Error(r.status);
            return r.text();
        });
        moduleRoot.innerHTML = html;
        try {
            const mod = await import(`../../${path}module.js`);
            if (mod.init) await mod.init(moduleRoot, preset ? { preset, locked: !!meta?.alias } : {});
        } catch (jsErr) {
            console.warn("Pas de module.js (ou init ignoré)", jsErr);
        }
        document.title = meta?.name || moduleId;
    } catch (err) {
        console.error(err);
        moduleRoot.textContent = "Erreur lors du chargement du module.";
    }
}

boot();

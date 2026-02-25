/**
 * Modèle de Conversion Universel
 * Il suffit de modifier l'objet 'units' et 'groups'
 */

export async function init(container) {
    if (typeof Decimal === "undefined") {
        await new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = "dependencies/decimal.js";
            script.onload = resolve;
            document.head.appendChild(script);
        });
    }
    setupConverter(container);
}

function setupConverter(container) {
    // Sélection générique par classe
    const fromSelect = container.querySelector(".module-from");
    const toSelect   = container.querySelector(".module-to");
    const inputField = container.querySelector(".module-input");
    const precField  = container.querySelector(".module-precision");
    const resultDisp = container.querySelector(".module-result");
    const btnConvert = container.querySelector(".module-btn-convert");

    // --- CONFIGURATION DU MODULE (À modifier selon le besoin) ---
    const PI = Decimal.acos(-1);

const conversionRates = {
    "rad": new Decimal(1),
    "deg": PI.div(180),
    "grad": PI.div(200),
    "arcmin": PI.div(10800),
    "arcsec": PI.div(648000),
    "rev": PI.mul(2),
    "sextant": PI.div(3),
    "quadrant": PI.div(2)
};

const displayNames = {
    "rad": "Radian (rad)", "deg": "Degré (°)", "grad": "Grade (grad)",
    "arcmin": "Minute d'arc (')", "arcsec": "Seconde d'arc ('')",
    "rev": "Révolution (tr)", "sextant": "Sextant", "quadrant": "Quadrant"
};

const groups = {
    "Unités Standard": ["deg", "rad", "rev", "grad"],
    "Précision / Astronomie": ["arcmin", "arcsec"],
    "Navigation": ["sextant", "quadrant"]
};

    // --- LOGIQUE UNIVERSELLE (Ne pas toucher) ---
    const populate = () => {
        [fromSelect, toSelect].forEach(select => {
            select.innerHTML = "";
            for (let label in groups) {
                let optgroup = document.createElement("optgroup");
                optgroup.label = label;
                groups[label].forEach(key => {
                    optgroup.appendChild(new Option(displayNames[key] || key, key));
                });
                select.appendChild(optgroup);
            }
        });
    };

    const runConversion = () => {
        const rawValue = inputField.value;
        if (rawValue === "" || isNaN(rawValue)) {
            resultDisp.innerText = "Erreur : valeur invalide";
            return;
        }

        try {
            const val = new Decimal(rawValue);
            const from = fromSelect.value;
            const to = toSelect.value;
            const precision = parseInt(precField.value) || 0;

            const result = val.mul(conversionRates[from]).div(conversionRates[to]);
            let resStr = result.toFixed(precision).replace(/\.?0+$/, '');
            
            resultDisp.innerText = `Résultat : ${resStr} ${to}`;
        } catch (e) {
            resultDisp.innerText = "Erreur de calcul";
        }
    };

    btnConvert.onclick = runConversion;
    populate();
}
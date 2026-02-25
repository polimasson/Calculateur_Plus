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
    const conversionRates = {
    "n": new Decimal(1),
    "kn": new Decimal(1000),
    "mn": new Decimal(1e6),
    "dyn": new Decimal("1e-5"),
    "lbf": new Decimal("4.4482216152605"),
    "kgf": new Decimal("9.80665"),
    "kip": new Decimal("4448.2216")
};

const displayNames = {
    "n": "Newton (N)", "kn": "Kilonewton (kN)", "mn": "Méganewton (MN)",
    "dyn": "Dyne", "lbf": "Pound-force (lbf)", "kgf": "Kilogramme-force (kgf)", "kip": "Kip"
};

const groups = {
    "Système International": ["n", "kn", "mn"],
    "Impérial & Autres": ["lbf", "kgf", "dyn", "kip"]
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
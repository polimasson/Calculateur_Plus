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
    "hz": new Decimal(1),
    "khz": new Decimal(1000),
    "mhz": new Decimal(1e6),
    "ghz": new Decimal(1e9),
    "thz": new Decimal(1e12),
    "rpm": new Decimal(1).div(60),
    "deg_s": new Decimal(1).div(360),
    "rad_s": new Decimal(1).div(new Decimal(2).mul(Decimal.acos(-1)))
};

const displayNames = {
    "hz": "Hertz (Hz)", "khz": "Kilohertz (kHz)", "mhz": "Mégahertz (MHz)",
    "ghz": "Gigahertz (GHz)", "thz": "Térahertz (THz)",
    "rpm": "Tours par minute (RPM)", "deg_s": "Degré par seconde", "rad_s": "Radian par seconde"
};

const groups = {
    "Ondes & Radio": ["hz", "khz", "mhz", "ghz", "thz"],
    "Rotation": ["rpm", "deg_s", "rad_s"]
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
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
    "w": new Decimal(1),
    "kw": new Decimal(1000),
    "mw": new Decimal(1e6),
    "gw": new Decimal(1e9),
    "hp": new Decimal("745.69987158"), // Mechanical HP
    "hp_m": new Decimal("735.49875"),   // Metric HP (cv)
    "btu_h": new Decimal("0.293071"),
    "tr": new Decimal("3516.85"),       // Ton of refrigeration
    "ft_lb_s": new Decimal("1.355818")
};

const displayNames = {
    "w": "Watt (W)", "kw": "Kilowatt (kW)", "mw": "Mégawatt (MW)", "gw": "Gigawatt (GW)",
    "hp": "Horsepower (hp)", "hp_m": "Cheval-vapeur (cv)",
    "btu_h": "BTU/h", "tr": "Tonne de réfrigération", "ft_lb_s": "Foot-pound/sec"
};

const groups = {
    "Système International": ["w", "kw", "mw", "gw"],
    "Mécanique": ["hp", "hp_m", "ft_lb_s"],
    "Thermique & Clim": ["btu_h", "tr"]
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
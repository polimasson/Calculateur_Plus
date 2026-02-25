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
    "j": new Decimal(1),
    "kj": new Decimal(1000),
    "mj": new Decimal(1e6),
    "gj": new Decimal(1e9),
    "cal": new Decimal("4.184"),
    "kcal": new Decimal("4184"),
    "wh": new Decimal(3600),
    "kwh": new Decimal(3600000),
    "mwh": new Decimal(3600000000),
    "btu": new Decimal("1055.05585262"),
    "ft_lb": new Decimal("1.355817948"),
    "erg": new Decimal("1e-7"),
    "ev": new Decimal("1.602176634e-19"),
    "thm": new Decimal("105480400") // Therm (US)
};

const displayNames = {
    "j": "Joule (J)", "kj": "Kilojoule (kJ)", "mj": "Mégajoule (MJ)", "gj": "Gigajoule (GJ)",
    "cal": "Calorie (cal)", "kcal": "Kilocalorie (kcal)",
    "wh": "Watt-heure (Wh)", "kwh": "Kilowatt-heure (kWh)", "mwh": "Mégawatt-heure (MWh)",
    "btu": "BTU International Table", "ft_lb": "Foot-pound", "erg": "Erg", "ev": "Électronvolt (eV)", "thm": "Therm"
};

const groups = {
    "Système International": ["j", "kj", "mj", "gj"],
    "Électricité": ["wh", "kwh", "mwh"],
    "Thermique": ["cal", "kcal", "btu", "thm"],
    "Physique & Mécanique": ["ev", "erg", "ft_lb"]
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
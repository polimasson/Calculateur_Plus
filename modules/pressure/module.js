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
    "pa": new Decimal(1),
    "hpa": new Decimal(100),
    "kpa": new Decimal(1000),
    "mpa": new Decimal(1e6),
    "bar": new Decimal(100000),
    "mbar": new Decimal(100),
    "psi": new Decimal("4.4482216152605").div("0.00064516"),
    "atm": new Decimal(101325),
    "torr": new Decimal(101325).div(760),
    "inhg": new Decimal("3386.389"),
    "mmhg": new Decimal("133.322387415"),
    "kgf_cm2": new Decimal("98066.5")
};

const displayNames = {
    "pa": "Pascal (Pa)", "hpa": "Hectopascal (hPa)", "kpa": "Kilopascal (kPa)", "mpa": "Mégapascal (MPa)",
    "bar": "Bar", "mbar": "Millibar (mbar)", "psi": "PSI (lb/in²)",
    "atm": "Atmosphère (atm)", "torr": "Torr", "inhg": "Pouce de Mercure (inHg)",
    "mmhg": "Millimètre de Mercure (mmHg)", "kgf_cm2": "kgf/cm²"
};

const groups = {
    "Système International": ["pa", "hpa", "kpa", "mpa"],
    "Atmosphérique": ["bar", "mbar", "atm", "torr", "mmhg", "inhg"],
    "Industriel": ["psi", "kgf_cm2"]
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
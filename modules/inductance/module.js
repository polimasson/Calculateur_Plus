/**
 * Convertisseur d'Inductance
 * Henry et préfixes SI - FACTEURS EXACTS puissances de 10
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
    const fromSelect = container.querySelector("#from");
    const toSelect = container.querySelector("#to");
    const inputField = container.querySelector("#input");
    const precField = container.querySelector("#precision-input");
    const resultDisp = container.querySelector("#result");
    const btnConvert = container.querySelector("#btn-convert");

// Facteurs basés sur la vitesse de la lumière exacte : 299 792 458 m/s
// et les définitions du Bureau International des Poids et Mesures (BIPM).

const conversionRates = {
    // --- SI - Préfixes de 10³⁰ à 10⁻³⁰ ---
    "QH": new Decimal("1e30"),          // Quettahenry
    "RH": new Decimal("1e27"),          // Ronnahenry
    "YH": new Decimal("1e24"),          // Yottahenry
    "ZH": new Decimal("1e21"),          // Zettahenry
    "EH": new Decimal("1e18"),          // Exahenry
    "PH": new Decimal("1e15"),          // Pétahenry
    "TH": new Decimal("1e12"),          // Térahenry
    "GH": new Decimal("1e9"),           // Gigahenry
    "MH": new Decimal("1e6"),           // Mégahenry
    "kH": new Decimal("1e3"),           // Kilohenry
    "hH": new Decimal("1e2"),           // Hectohenry
    "daH": new Decimal("1e1"),          // Décahenry
    "H": new Decimal(1),                // Henry (Base)
    "dH": new Decimal("1e-1"),          // Décihenry
    "cH": new Decimal("1e-2"),          // Centihenry
    "mH": new Decimal("1e-3"),          // Millihenry
    "uH": new Decimal("1e-6"),          // Microhenry
    "nH": new Decimal("1e-9"),          // Nanohenry
    "pH": new Decimal("1e-12"),         // Picohenry
    "fH": new Decimal("1e-15"),         // Femtohenry
    "aH": new Decimal("1e-18"),         // Attohenry
    "zH": new Decimal("1e-21"),         // Zeptohenry
    "yH": new Decimal("1e-24"),         // Yoctohenry
    "rH": new Decimal("1e-27"),         // Rontohenry
    "qH": new Decimal("1e-30"),         // Quectohenry

    // --- CGS / SCIENTIFIQUE ---
    // abhenry = 10⁻⁹ H (exact)
    "abH": new Decimal("1e-9"),
    // stathenry = c² * 10⁻⁹ (où c est la vitesse de la lumière en m/s)
    "statH": new Decimal("299792458").pow(2).div("1e9") 
};

const displayNames = {
    "QH": "Quettahenry (QH)",
    "RH": "Ronnahenry (RH)",
    "YH": "Yottahenry (YH)",
    "ZH": "Zettahenry (ZH)",
    "EH": "Exahenry (EH)",
    "PH": "Pétahenry (PH)",
    "TH": "Térahenry (TH)",
    "GH": "Gigahenry (GH)",
    "MH": "Mégahenry (MH)",
    "kH": "Kilohenry (kH)",
    "hH": "Hectohenry (hH)",
    "daH": "Décahenry (daH)",
    "H": "Henry (H)",
    "dH": "Décihenry (dH)",
    "cH": "Centihenry (cH)",
    "mH": "Millihenry (mH)",
    "uH": "Microhenry (µH)",
    "nH": "Nanohenry (nH)",
    "pH": "Picohenry (pH)",
    "fH": "Femtohenry (fH)",
    "aH": "Attohenry (aH)",
    "zH": "Zeptohenry (zH)",
    "yH": "Yoctohenry (yH)",
    "rH": "Rontohenry (rH)",
    "qH": "Quectohenry (qH)",
    "abH": "Abhenry (CGS-EMU)",
    "statH": "Stathenry (CGS-ESU)"
};

const groups = {
    "SI - Multiples (Grands)": ["QH", "RH", "YH", "ZH", "EH", "PH", "TH", "GH", "MH", "kH", "hH", "daH", "H"],
    "SI - Sous-multiples (Petits)": ["dH", "cH", "mH", "uH", "nH", "pH", "fH", "aH", "zH", "yH", "rH", "qH"],
    "CGS / Scientifique": ["abH", "statH"]
};

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
            let resStr = result.toFixed(precision);
            if (precision > 0) {
                resStr = resStr.replace(/\.?0+$/, '');
            }
            resultDisp.innerText = `Résultat : ${resStr}`;
        } catch (e) {
            resultDisp.innerText = "Erreur de calcul";
        }
    };

    btnConvert.onclick = runConversion;
    populate();
}

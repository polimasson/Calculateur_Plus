/**
 * Convertisseur de Viscosité Dynamique et Cinématique
 * Facteurs EXACTS sans approximation
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

    // Pa·s = N·s/m² = kg/(m·s) comme base
    // Facteurs EXACTS sans approximation
// Facteurs de conversion basés sur : 
// 1 lb = 0.45359237 kg (International Pound)
// 1 ft = 0.3048 m (International Foot)
// 1 lb_f = 4.4482216152605 N (Standard Gravity Force)

const conversionRates = {
    // --- DYNAMIQUE (Base : Pa·s) ---
    "Pa_s": new Decimal(1),
    "mPa_s": new Decimal("1e-3"),
    "uPa_s": new Decimal("1e-6"),
    "nPa_s": new Decimal("1e-9"),
    "kPa_s": new Decimal("1e3"),
    "MPa_s": new Decimal("1e6"),
    "N_s_m2": new Decimal(1),
    "N_s_cm2": new Decimal("1e4"),
    
    // CGS
    "P": new Decimal("0.1"),
    "cP": new Decimal("0.001"),
    "mP": new Decimal("1e-4"),
    "uP": new Decimal("1e-7"),
    "dP": new Decimal("0.01"),
    
    // Impérial (Calculs exacts via Decimal)
    "lb_ft_s": new Decimal("0.45359237").div("0.3048"),
    "lb_in_s": new Decimal("0.45359237").div("0.0254"),
    "reyn": new Decimal("4.4482216152605").div(new Decimal("0.0254").pow(2)),
    "slug_ft_s": new Decimal("14.593902937206363285"),

    // --- CINÉMATIQUE (Base : m²/s) ---
    "m2_s": new Decimal(1),
    "St": new Decimal("1e-4"),
    "cSt": new Decimal("1e-6"),
    "mm2_s": new Decimal("1e-6"),
    "cm2_s": new Decimal("1e-4"),
    "ft2_s": new Decimal("0.3048").pow(2),
    "in2_s": new Decimal("0.0254").pow(2),

    // --- AUTRES ---
    "kg_m_s": new Decimal(1),
    "g_cm_s": new Decimal("0.1"),
    "Pl": new Decimal(1) 
};

const displayNames = {
    "Pa_s": "Pascal-seconde (Pa·s)",
    "mPa_s": "Millipascal-seconde (mPa·s)",
    "uPa_s": "Micropascal-seconde (µPa·s)",
    "nPa_s": "Nanopascal-seconde (nPa·s)",
    "kPa_s": "Kilopascal-seconde (kPa·s)",
    "MPa_s": "Mégapascal-seconde (MPa·s)",
    "N_s_m2": "Newton·seconde par m²",
    "N_s_cm2": "Newton·seconde par cm²",
    "P": "Poise (P)",
    "cP": "Centipoise (cP)",
    "mP": "Millipoise (mP)",
    "uP": "Micropoise (µP)",
    "dP": "Décipoise (dP)",
    "lb_ft_s": "Livre par pied-seconde",
    "lb_in_s": "Livre par pouce-seconde",
    "reyn": "Reyn (lb_f·s/in²)",
    "slug_ft_s": "Slug par pied-seconde",
    "m2_s": "Mètre carré par seconde (m²/s)",
    "St": "Stokes (St)",
    "cSt": "Centistokes (cSt)",
    "mm2_s": "Millimètre carré par seconde",
    "cm2_s": "Centimètre carré par seconde",
    "ft2_s": "Pied carré par seconde",
    "in2_s": "Pouce carré par seconde",
    "kg_m_s": "Kilogramme par mètre-seconde",
    "g_cm_s": "Gramme par centimètre-seconde",
    "Pl": "Poiseuille (Pl)"
};

const groups = {
    "Viscosité Dynamique (SI/CGS)": ["Pa_s", "mPa_s", "uPa_s", "nPa_s", "kPa_s", "MPa_s", "N_s_m2", "N_s_cm2", "P", "cP", "mP", "uP", "dP", "Pl"],
    "Viscosité Dynamique (Impérial/US)": ["lb_ft_s", "lb_in_s", "reyn", "slug_ft_s"],
    "Viscosité Cinématique": ["m2_s", "St", "cSt", "mm2_s", "cm2_s", "ft2_s", "in2_s"],
    "Unités alternatives": ["kg_m_s", "g_cm_s"]
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
            // Supprimer les zéros finis uniquement si demandé
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

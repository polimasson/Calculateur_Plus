/**
 * Module de conversion de Surfaces - Version Ultra-Précision
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
    setupAreaModule(container);
}

function setupAreaModule(container) {
    const fromSelect = container.querySelector("#area-from");
    const toSelect = container.querySelector("#area-to");
    const inputField = container.querySelector("#area-input");
    const precisionField = container.querySelector("#area-precision");
    const resultDisplay = container.querySelector("#area-result");
    const btnConvert = container.querySelector("#btn-convert-area");

    // --- DÉFINITIONS DES CONSTANTES EXACTES ---
    const M = new Decimal(1);
    const IN = new Decimal("0.0254"); // Définition internationale exacte
    const FT = IN.mul(12);
    const YD = FT.mul(3);
    const MI = FT.mul(5280);

    const conversionRates = {
        // Métrique (Calculé par puissances exactes)
        "nm2": new Decimal("1e-9").pow(2),
        "µm2": new Decimal("1e-6").pow(2),
        "mm2": new Decimal("1e-3").pow(2),
        "cm2": new Decimal("1e-2").pow(2),
        "dm2": new Decimal("1e-1").pow(2),
        "m2":  M,
        "dam2": new Decimal(10).pow(2),
        "hm2": new Decimal(100).pow(2),
        "km2": new Decimal(1000).pow(2),

        // Agraire
        "ca": M,
        "a":  new Decimal(100),
        "ha": new Decimal(10000),

        // Impérial & US (Zéro perte de précision)
        "in2": IN.pow(2),
        "ft2": FT.pow(2),
        "yd2": YD.pow(2),
        "ac":  new Decimal(43560).mul(FT.pow(2)), // 1 acre = 43,560 ft²
        "mi2": MI.pow(2)
    };

    const displayNames = {
        "nm2": "Nanomètre carré (nm²)", "µm2": "Micromètre carré (µm²)",
        "mm2": "Millimètre carré (mm²)", "cm2": "Centimètre carré (cm²)",
        "dm2": "Décimètre carré (dm²)", "m2": "Mètre carré (m²)",
        "dam2": "Décamètre carré (dam²)", "hm2": "Hectomètre carré (hm²)",
        "km2": "Kilomètre carré (km²)", "ca": "Centiare (ca)",
        "a": "Are (a)", "ha": "Hectare (ha)",
        "in2": "Pouce carré (in²)", "ft2": "Pied carré (ft²)",
        "yd2": "Yard carré (yd²)", "ac": "Acre (ac)", "mi2": "Mile carré (mi²)"
    };

    const groups = {
        "Métrique": ["nm2", "µm2", "mm2", "cm2", "dm2", "m2", "dam2", "hm2", "km2"],
        "Agraire": ["ca", "a", "ha"],
        "Impérial & US": ["in2", "ft2", "yd2", "ac", "mi2"]
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
            resultDisplay.innerText = "Erreur : valeur invalide";
            return;
        }

        try {
            const val = new Decimal(rawValue);
            const from = fromSelect.value;
            const to = toSelect.value;
            const precision = parseInt(precisionField.value) || 0;

            // Formule : (Valeur * TauxSource) / TauxCible
            const result = val.mul(conversionRates[from]).div(conversionRates[to]);
            
            // Formatage intelligent : retire les zéros inutiles à la fin
            let resStr = result.toFixed(precision).replace(/\.?0+$/, '');
            
            resultDisplay.innerText = `Résultat : ${resStr} ${to}`;
        } catch (e) {
            resultDisplay.innerText = "Erreur de calcul";
        }
    };

    btnConvert.onclick = runConversion;
    populate();
}
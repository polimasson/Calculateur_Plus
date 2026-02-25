/**
 * Module de conversion de Volumes - Version Ultra-Précision
 * Gère le métrique, la capacité (Litres) et les systèmes US/UK
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
    setupVolumeModule(container);
}

function setupVolumeModule(container) {
    const fromSelect = container.querySelector("#vol-from");
    const toSelect = container.querySelector("#vol-to");
    const inputField = container.querySelector("#vol-input");
    const precisionField = container.querySelector("#vol-precision");
    const resultDisplay = container.querySelector("#vol-result");
    const btnConvert = container.querySelector("#btn-convert-vol");

    // --- DÉFINITIONS EXACTES ---
    const M3 = new Decimal(1);
    const L = new Decimal("1e-3"); // 1 Litre = 1 dm³ = 0.001 m³
    const IN3 = new Decimal("0.0254").pow(3); // Pouce cube basé sur 25.4mm
    
    // Système US Liquid (basé sur le gallon de 231 pouces cubes)
    const US_GAL = new Decimal(231).mul(IN3);
    const US_FL_OZ = US_GAL.div(128);

    // Système Impérial / UK (basé sur 4.54609 Litres exactement)
    const IMP_GAL = new Decimal("4.54609").mul(L);
    const IMP_FL_OZ = IMP_GAL.div(160);

    const conversionRates = {
        // Métrique Géométrique
        "mm3": new Decimal("1e-3").pow(3),
        "cm3": new Decimal("1e-2").pow(3),
        "dm3": new Decimal("1e-1").pow(3),
        "m3":  M3,
        "km3": new Decimal("1e3").pow(3),

        // Capacité Métrique
        "ml": L.div(1000),
        "cl": L.div(100),
        "l":  L,
        "hl": L.mul(100),

        // US Liquid
        "us_tsp":  US_FL_OZ.div(6),
        "us_tbsp": US_FL_OZ.div(2),
        "us_floz": US_FL_OZ,
        "us_cup":  US_FL_OZ.mul(8),
        "us_pt":   US_FL_OZ.mul(16),
        "us_qt":   US_FL_OZ.mul(32),
        "us_gal":  US_GAL,

        // Impérial (UK)
        "uk_floz": IMP_FL_OZ,
        "uk_pt":   IMP_FL_OZ.mul(20),
        "uk_gal":  IMP_GAL,

        // Cubes Impériaux
        "in3": IN3,
        "ft3": new Decimal(12).pow(3).mul(IN3),
        "yd3": new Decimal(36).pow(3).mul(IN3)
    };

    const displayNames = {
        "mm3": "Millimètre cube (mm³)", "cm3": "Centimètre cube (cm³)",
        "dm3": "Décimètre cube (dm³)", "m3": "Mètre cube (m³)",
        "km3": "Kilomètre cube (km³)",
        "ml": "Millilitre (ml)", "cl": "Centilitre (cl)", "l": "Litre (L)", "hl": "Hectolitre (hL)",
        "us_tsp": "Cuillère à café (US tsp)", "us_tbsp": "Cuillère à soupe (US tbsp)",
        "us_floz": "Once liquide (US fl oz)", "us_cup": "Tasse (US cup)",
        "us_pt": "Pinte (US pt)", "us_qt": "Quart (US qt)", "us_gal": "Gallon (US gal)",
        "uk_floz": "Once liquide (UK fl oz)", "uk_pt": "Pinte (UK pt)", "uk_gal": "Gallon (UK gal)",
        "in3": "Pouce cube (in³)", "ft3": "Pied cube (ft³)", "yd3": "Yard cube (yd³)"
    };

    const groups = {
        "Métrique (Volume)": ["mm3", "cm3", "dm3", "m3", "km3"],
        "Métrique (Capacité)": ["ml", "cl", "l", "hl"],
        "Système US (Liquide)": ["us_tsp", "us_tbsp", "us_floz", "us_cup", "us_pt", "us_qt", "us_gal"],
        "Système Impérial (UK)": ["uk_floz", "uk_pt", "uk_gal"],
        "Unités Cubiques (Anglosaxonnes)": ["in3", "ft3", "yd3"]
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

            const result = val.mul(conversionRates[from]).div(conversionRates[to]);
            let resStr = result.toFixed(precision).replace(/\.?0+$/, '');
            
            resultDisplay.innerText = `Résultat : ${resStr} ${to}`;
        } catch (e) {
            resultDisplay.innerText = "Erreur de calcul";
        }
    };

    btnConvert.onclick = runConversion;
    populate();
}
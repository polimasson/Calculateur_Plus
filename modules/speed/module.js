/**
 * Module de conversion de Vitesse
 * Conservation de TOUTES les unités (SI, Impériales, Astronomiques)
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
    setupSpeedModule(container);
}

function setupSpeedModule(container) {
    const fromSelect = container.querySelector("#speed-from");
    const toSelect = container.querySelector("#speed-to");
    const inputField = container.querySelector("#speed-input");
    const tempField = container.querySelector("#mach-temp");
    const machConfig = container.querySelector("#mach-config");
    const precisionField = container.querySelector("#speed-precision");
    const resultDisplay = container.querySelector("#speed-result");
    const btnConvert = container.querySelector("#btn-convert-speed");

    // TOUTES TES UNITÉS SONT ICI
    const speedRates = {
        "m/s": new Decimal(1),
        "km/h": new Decimal("1000").div("3600"),
        "cm/s": new Decimal("1e-2"),
        "mm/s": new Decimal("1e-3"),
        "µm/s": new Decimal("1e-6"),
        "nm/s": new Decimal("1e-9"),
        "Mm/s": new Decimal("1e6"),
        "Gm/s": new Decimal("1e9"),
        "ft/s": new Decimal("0.3048"),
        "in/s": new Decimal("0.0254"),
        "mi/h": new Decimal("1609.344").div("3600"),
        "yd/s": new Decimal("0.9144"),
        "kn": new Decimal("1852").div("3600"),
        "c": new Decimal("299792458"),
        "mach": new Decimal("340.29"),
        "ls": new Decimal("299792458"),
        "lm": new Decimal("17987547480"),
        "lh": new Decimal("1079252848800"),
        "ld": new Decimal("25902068371200"),
        "ly": new Decimal("9460730472580800"),
    };

    const displayNames = {
        "m/s": "Mètre par seconde (m/s)",
        "km/h": "Kilomètre par heure (km/h)",
        "cm/s": "Centimètre par seconde (cm/s)",
        "mm/s": "Millimètre par seconde (mm/s)",
        "µm/s": "Micromètre par seconde (µm/s)",
        "nm/s": "Nanomètre par seconde (nm/s)",
        "Mm/s": "Mégamètre par seconde (Mm/s)",
        "Gm/s": "Gigamètre par seconde (Gm/s)",
        "ft/s": "Pied par seconde (ft/s)",
        "in/s": "Pouce par seconde (in/s)",
        "mi/h": "Mile par heure (mi/h)",
        "yd/s": "Yard par seconde (yd/s)",
        "kn": "Nœud (kn)",
        "c": "Vitesse de la lumière (c)",
        "mach": "Mach (mach)",
        "ls": "Seconde-lumière (ls)",
        "lm": "Minute-lumière (lm)",
        "lh": "Heure-lumière (lh)",
        "ld": "Jour-lumière (ld)",
        "ly": "Année-lumière (ly)"
    };

    const populateSpeedMenus = () => {
        const groups = {
            "Unités SI": ["m/s", "km/h", "cm/s", "mm/s", "µm/s", "nm/s", "Mm/s", "Gm/s"],
            "Système impérial": ["ft/s", "in/s", "mi/h", "yd/s"],
            "Navigation et aviation": ["kn"],
            "Unités astronomiques": ["c", "mach", "ls", "lm", "lh", "ld", "ly"]
        };

        [fromSelect, toSelect].forEach(select => {
            select.innerHTML = "";
            for (let label in groups) {
                let optgroup = document.createElement("optgroup");
                optgroup.label = label;
                groups[label].forEach(key => {
                    let option = new Option(displayNames[key] || key, key);
                    optgroup.appendChild(option);
                });
                select.appendChild(optgroup);
            }
        });
    };

    const refreshMachUI = () => {
        const needsMach = fromSelect.value === "mach" || toSelect.value === "mach";
        machConfig.style.display = needsMach ? "block" : "none";
    };

    const getDynamicMachSpeed = (tempCelsius) => {
        // Ta formule : sqrt(1.4 * 287.05 * (T + 273.15))
        const T = new Decimal(tempCelsius).plus(273.15);
        return new Decimal(Math.sqrt(T.mul(1.4 * 287.05).toNumber()));
    };

    const runSpeedConversion = () => {
        const inputVal = inputField.value;
        if (!inputVal || isNaN(inputVal)) {
            resultDisplay.innerText = "Erreur : valeur invalide";
            return;
        }

        try {
            const amount = new Decimal(inputVal);
            const fromUnit = fromSelect.value;
            const toUnit = toSelect.value;
            const precision = parseInt(precisionField.value) || 0;

            let fromRate = speedRates[fromUnit];
            let toRate = speedRates[toUnit];

            // Gestion dynamique du Mach
            const currentTemp = tempField.value || 15;
            if (fromUnit === "mach") fromRate = getDynamicMachSpeed(currentTemp);
            if (toUnit === "mach") toRate = getDynamicMachSpeed(currentTemp);

            const result = amount.mul(fromRate).div(toRate);
            const resultStr = result.toFixed(precision).replace(/\.?0+$/, '');

            resultDisplay.innerText = `Résultat : ${resultStr} ${toUnit}`;
        } catch (error) {
            resultDisplay.innerText = "Erreur de calcul";
        }
    };

    // Événements
    fromSelect.addEventListener("change", refreshMachUI);
    toSelect.addEventListener("change", refreshMachUI);
    btnConvert.addEventListener("click", runSpeedConversion);

    // Initialisation
    populateSpeedMenus();
    refreshMachUI();
}
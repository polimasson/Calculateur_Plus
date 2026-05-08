/**
 * Module de conversion de couple (torque)
 * Supporte la précision arbitraire via Decimal.js
 */

export async function init(container) {
    // Vérifier ou charger Decimal.js
    if (typeof Decimal === "undefined") {
        await loadScript("dependencies/decimal.js");
    }

    setup(container);
}

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

function setup(container) {
    const fromSelect = container.querySelector("#from");
    const toSelect = container.querySelector("#to");
    const btnConvert = container.querySelector("#btn-convert");

    // Facteurs de conversion vers N·m (Newton-mètre) - calculs exacts
    const conversionRates = {
        // --- Système Métrique (Base Nm) ---
        "Nm": new Decimal(1),
        "mNm": new Decimal("0.001"),
        "uNm": new Decimal("1e-6"),
        "kNm": new Decimal(1000),
        "MNm": new Decimal(1000000),
        "Ncm": new Decimal("0.01"),
        "Nmm": new Decimal("0.001"),

        // --- Gravitationnel (Basé sur g = 9.80665) ---
        "kgfm": new Decimal("9.80665"),
        "kgfcm": new Decimal("0.0980665"),
        "kgfmm": new Decimal("0.00980665"),
        "gfm": new Decimal("0.00980665"),
        "gfcm": new Decimal("0.0000980665"),

        // --- Impérial / US (Calculs exacts) ---
        // 1 lbf = 4.4482216152605 N | 1 ft = 0.3048 m
        "lbfft": new Decimal("4.4482216152605").mul("0.3048"),
        "lbfin": new Decimal("4.4482216152605").mul("0.0254"),
        "ozfin": new Decimal("4.4482216152605").div(16).mul("0.0254"),
        "ozfft": new Decimal("4.4482216152605").div(16).mul("0.3048"),
        
        // Poundal-foot : 1 pdl = 0.138254954376 N
        "pdlft": new Decimal("0.138254954376").mul("0.3048"),
        "pdlin": new Decimal("0.138254954376").mul("0.0254"),

        // CGS
        "dynecm": new Decimal("1e-7")
    };

    const displayNames = {
        "Nm": "Newton-mètre (N·m)",
        "mNm": "Millinewton-mètre (mN·m)",
        "uNm": "Micronewton-mètre (µN·m)",
        "kNm": "Kilonewton-mètre (kN·m)",
        "MNm": "Méganewton-mètre (MN·m)",
        "Ncm": "Newton-centimètre (N·cm)",
        "Nmm": "Newton-millimètre (N·mm)",
        "kgfm": "Kilogramme-force mètre (kgf·m)",
        "kgfcm": "Kilogramme-force cm (kgf·cm)",
        "kgfmm": "Kilogramme-force mm (kgf·mm)",
        "gfm": "Gramme-force mètre (gf·m)",
        "gfcm": "Gramme-force cm (gf·cm)",
        "lbfft": "Livre-force pied (lbf·ft)",
        "lbfin": "Livre-force pouce (lbf·in)",
        "ozfin": "Once-force pouce (ozf·in)",
        "ozfft": "Once-force pied (ozf·ft)",
        "pdlft": "Poundal-pied (pdl·ft)",
        "pdlin": "Poundal-pouce (pdl·in)",
        "dynecm": "Dyne-centimètre (dyn·cm)"
    };

    const groups = {
        "Métrique (SI)": ["Nm", "mNm", "uNm", "kNm", "MNm", "Ncm", "Nmm"],
        "Métrique (Gravitationnel)": ["kgfm", "kgfcm", "kgfmm", "gfm", "gfcm"],
        "Impérial / US": ["lbfft", "lbfin", "ozfin", "ozfft", "pdlft", "pdlin"],
        "CGS": ["dynecm"]
    };

    const populate = () => {
        [fromSelect, toSelect].forEach(select => {
            for (let groupName in groups) {
                let optGroup = document.createElement("optgroup");
                optGroup.label = groupName;
                groups[groupName].forEach(unit => {
                    let option = document.createElement("option");
                    option.value = unit;
                    option.textContent = displayNames[unit];
                    optGroup.appendChild(option);
                });
                select.appendChild(optGroup);
            }
        });
    };

    if (fromSelect && toSelect) {
        populate();
        fromSelect.value = "Nm";
        toSelect.value = "kNm";
    }

    // Conversion vers N·m (unité de base)
    const toNewtonMetre = (value, from) => {
        return value.mul(conversionRates[from]);
    };

    // Conversion depuis N·m vers l'unité cible
    const fromNewtonMetre = (value, to) => {
        return value.div(conversionRates[to]);
    };

    const performConversion = () => {
        const inputVal = container.querySelector("#input").value;
        if (!inputVal || isNaN(inputVal)) {
            container.querySelector("#result").innerText = "Erreur : valeur invalide";
            return;
        }

        const value = new Decimal(inputVal);
        const from = fromSelect.value;
        const to = toSelect.value;
        const precisionInput = container.querySelector("#precision-input");
        const precision = parseInt(precisionInput ? precisionInput.value : 10, 10);

        try {
            const valueInNm = toNewtonMetre(value, from);
            const result = fromNewtonMetre(valueInNm, to);

            let resultStr = result.toFixed(precision);
            resultStr = resultStr.replace(/\.?0+$/, '');

            container.querySelector("#result").innerText = `Résultat : ${resultStr} ${to}`;
        } catch (error) {
            console.error(error);
            container.querySelector("#result").innerText = "Erreur de conversion";
        }
    };

    if (btnConvert) {
        btnConvert.addEventListener('click', performConversion);
    }

    const input = container.querySelector("#input");
    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performConversion();
        });
    }
}

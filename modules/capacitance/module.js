/**
 * Convertisseur de Capacité Électrique
 * Farad et préfixes SI - FACTEURS EXACTS puissances de 10
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

    // Farad comme base - FACTEURS EXACTS puissances de 10
    // Définitions basées sur les constantes SI et la vitesse de la lumière (c)
// 1 Statfarad = 1/(c² * 10⁻⁹) Farad (Exact)

const conversionRates = {
    // --- SI - Préfixes standard ---
    "QF": new Decimal("1e30"),
    "RF": new Decimal("1e27"),
    "YF": new Decimal("1e24"),
    "ZF": new Decimal("1e21"),
    "EF": new Decimal("1e18"),
    "PF": new Decimal("1e15"),
    "TF": new Decimal("1e12"),
    "GF": new Decimal("1e9"),
    "MF": new Decimal("1e6"),
    "kF": new Decimal("1e3"),
    "hF": new Decimal("1e2"),
    "daF": new Decimal("10"),
    "F": new Decimal(1),
    "dF": new Decimal("0.1"),
    "cF": new Decimal("0.01"),
    "mF": new Decimal("1e-3"),
    "uF": new Decimal("1e-6"),
    "nF": new Decimal("1e-9"),
    "pF": new Decimal("1e-12"),
    "fF": new Decimal("1e-15"),
    "aF": new Decimal("1e-18"),
    "zF": new Decimal("1e-21"),
    "yF": new Decimal("1e-24"),
    "rF": new Decimal("1e-27"),
    "qF": new Decimal("1e-30"),

    // --- CGS / SCIENTIFIQUE ---
    // Abfarad = 10⁹ Farad (Exact)
    "abF": new Decimal("1e9"),
    // Statfarad = 1 / (c² * 10⁻⁹)
    "statF": new Decimal(1).div(new Decimal("299792458").pow(2).mul("1e-9"))
};

const displayNames = {
    "QF": "Quettafarad (QF)",
    "RF": "Ronnafarad (RF)",
    "YF": "Yottafarad (YF)",
    "ZF": "Zettafarad (ZF)",
    "EF": "Exafarad (EF)",
    "PF": "Pétafarad (PF)",
    "TF": "Térafarad (TF)",
    "GF": "Gigafarad (GF)",
    "MF": "Mégafarad (MF)",
    "kF": "Kilofarad (kF)",
    "hF": "Hectofarad (hF)",
    "daF": "Décafarad (daF)",
    "F": "Farad (F)",
    "dF": "Décifarad (dF)",
    "cF": "Centifarad (cF)",
    "mF": "Millifarad (mF)",
    "uF": "Microfarad (µF)",
    "nF": "Nanofarad (nF)",
    "pF": "Picofarad (pF)",
    "fF": "Femtofarad (fF)",
    "aF": "Attofarad (aF)",
    "zF": "Zeptofarad (zF)",
    "yF": "Yoctofarad (yF)",
    "rF": "Rontofarad (rF)",
    "qF": "Quectofarad (qF)",
    "abF": "Abfarad (CGS-EMU)",
    "statF": "Statfarad (CGS-ESU)"
};

const groups = {
    "Multiples SI (Grands)": ["QF", "RF", "YF", "ZF", "EF", "PF", "TF", "GF", "MF", "kF", "hF", "daF", "F"],
    "Sous-multiples SI (Petits)": ["dF", "cF", "mF", "uF", "nF", "pF", "fF", "aF", "zF", "yF", "rF", "qF"],
    "Unités CGS / Spéciales": ["abF", "statF"]
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

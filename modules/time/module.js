/**
 * Module de conversion de Temps
 * Système modulaire v2
 */

export async function init(container) {
    // 1. Chargement asynchrone de la librairie Decimal
    if (typeof Decimal === "undefined") {
        await new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = "dependencies/decimal.js";
            script.onload = resolve;
            document.head.appendChild(script);
        });
    }

    setup(container);
}

function setup(container) {
    // Sélection des éléments internes au container
    const fromSelect = container.querySelector("#from");
    const toSelect = container.querySelector("#to");
    const inputField = container.querySelector("#input");
    const precisionField = container.querySelector("#precision-input");
    const resultDisplay = container.querySelector("#result");
    const btnConvert = container.querySelector("#btn-convert");

    const conversionRates = {
        ms: new Decimal("1e-3"),
        s: new Decimal(1),
        min: new Decimal(60),
        h: new Decimal(3600),
        d: new Decimal(86400),
        week: new Decimal(86400 * 7),
        month: new Decimal(86400 * 30),
        year: new Decimal(86400 * 365),
        decade: new Decimal(86400 * 365 * 10),
        century: new Decimal(86400 * 365 * 100),
        millennium: new Decimal(86400 * 365 * 1000),
        s_d: new Decimal(86164.0916),
        s_week: new Decimal(86164.0916 * 7),
        s_month: new Decimal(2360592.6592),
        s_year: new Decimal(31558149.5388),
        s_decade: new Decimal(31558149.5388 * 10),
        s_century: new Decimal(31558149.5388 * 100),
        s_millennium: new Decimal(31558149.5388 * 1000),
    };

    const displayNames = {
        ms: "Milliseconde [ms]", s: "Seconde [s]", min: "Minute [min]", h: "Heure [h]",
        d: "Jour (civile)", week: "Semaine (civile)", month: "Mois (civile)",
        year: "Année (civile)", decade: "Décennie (civile)", century: "Siècle (civile)",
        millennium: "Millénaire (civile)", s_d: "Jour (sidéral)", s_week: "Semaine (sidéral)",
        s_month: "Mois (sidéral)", s_year: "Année (sidéral)", s_decade: "Décennie (sidéral)",
        s_century: "Siècle (sidéral)", s_millennium: "Millénaire (sidéral)"
    };

    const groups = {
        "Unités de base": ["ms", "s", "min", "h", "d", "week", "month", "year", "decade", "century", "millennium"],
        "Unités astronomiques": ["s_d", "s_week", "s_month", "s_year", "s_decade", "s_century", "s_millennium"]
    };

    function populate(select) {
        select.innerHTML = "";
        for (let label in groups) {
            let optgroup = document.createElement("optgroup");
            optgroup.label = label;
            groups[label].forEach(key => {
                let option = new Option(displayNames[key], key);
                optgroup.appendChild(option);
            });
            select.appendChild(optgroup);
        }
    }

    populate(fromSelect);
    populate(toSelect);

    const performConversion = () => {
        const valRaw = inputField.value;
        if (valRaw === "" || isNaN(valRaw)) {
            resultDisplay.innerText = "Erreur : valeur invalide";
            return;
        }

        try {
            const value = new Decimal(valRaw);
            const from = fromSelect.value;
            const to = toSelect.value;
            const precision = parseInt(precisionField.value) || 0;

            const result = value.mul(conversionRates[from]).div(conversionRates[to]);
            let resultStr = result.toFixed(precision).replace(/\.?0+$/, '');
            
            resultDisplay.innerText = `Résultat : ${resultStr} ${to}`;
        } catch (e) {
            resultDisplay.innerText = "Erreur de conversion";
        }
    };

    if (btnConvert) {
        btnConvert.onclick = performConversion;
    }
}
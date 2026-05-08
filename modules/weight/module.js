/**
 * Module de conversion de Poids
 * Système modulaire v2 - Février 2026
 */

export async function init(container) {
    // 1. Charger Decimal.js si pas présent
    if (typeof Decimal === "undefined") {
        await loadDecimalLibrary();
    }

    setup(container);
}

function loadDecimalLibrary() {
    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "dependencies/decimal.js";
        script.onload = () => {
            console.log("Poids : decimal.js chargé");
            resolve();
        };
        script.onerror = () => reject("Échec chargement Decimal.js");
        document.head.appendChild(script);
    });
}

function setup(container) {
    // On utilise container.querySelector pour ne pas interférer avec les autres modules
    const fromSelect = container.querySelector("#from");
    const toSelect = container.querySelector("#to");
    const inputField = container.querySelector("#input");
    const precisionField = container.querySelector("#precision-input");
    const resultDisplay = container.querySelector("#result");
    const btnConvert = container.querySelector("#btn-convert");

    const conversionRates = {
        // Métrique
        qg: new Decimal("1e-33"), rg: new Decimal("1e-30"), yg: new Decimal("1e-27"),
        zg: new Decimal("1e-24"), ag: new Decimal("1e-21"), fg: new Decimal("1e-18"),
        pg: new Decimal("1e-15"), ng: new Decimal("1e-12"), µg: new Decimal("1e-9"),
        dmg: new Decimal("1e-7"), mg: new Decimal("1e-6"), cg: new Decimal("1e-5"),
        dg: new Decimal("1e-4"), g: new Decimal("1e-3"), dag: new Decimal("1e-2"),
        hg: new Decimal("1e-1"), kg: new Decimal(1), mag: new Decimal("1e1"),
        q: new Decimal("1e2"), Mg: new Decimal("1e3"), Gg: new Decimal("1e6"),
        Tg: new Decimal("1e9"), Pg: new Decimal("1e12"), Eg: new Decimal("1e15"),
        Zg: new Decimal("1e18"), Yg: new Decimal("1e21"), Rg: new Decimal("1e24"),
        Qg: new Decimal("1e27"),
        // Impérial
        oz: new Decimal("0.0283495"), lb: new Decimal("0.45359237"), st: new Decimal("6.35029"),
        qt: new Decimal("12.7006"), cwt_us: new Decimal("45.359237"), cwt_uk: new Decimal("50.8023"),
        ton_us: new Decimal("907.18474"), ton_uk: new Decimal("1016.04691"),
        // Autres
        ct: new Decimal("0.0002"), gr: new Decimal("0.0000648"), dram: new Decimal("0.00177"),
        talent: new Decimal("30"), quintal: new Decimal("100")
    };

    const displayNames = {
        qg: "quectogramme (qg)", rg: "rontogramme (rg)", yg: "yoctogramme (yg)",
        zg: "zeptogramme (zg)", ag: "attogramme (ag)", fg: "femtogramme (fg)",
        pg: "picogramme (pg)", ng: "nanogramme (ng)", µg: "microgramme (µg)",
        dmg: "décimilligramme (dmg)", mg: "milligramme (mg)", cg: "centigramme (cg)",
        dg: "décigramme (dg)", g: "gramme (g)", dag: "décagramme (dag)",
        hg: "hectogramme (hg)", kg: "kilogramme (kg)", mag: "myriagramme (mag)",
        Mg: "mégagramme (Mg) / Tonne", Gg: "gigagramme (Gg)", Tg: "téragramme (Tg)",
        Pg: "pétagramme (Pg)", Eg: "exagramme (Eg)", Zg: "zettagramme (Zg)",
        Yg: "yottagramme (Yg)", Rg: "ronnagramme (Rg)", Qg: "quettagramme (Qg)",
        oz: "Once (oz)", lb: "Livre (lb)", st: "Stone (st)", qt: "Quarter (qt)",
        cwt_us: "Hundredweight US (cwt)", cwt_uk: "Hundredweight UK (cwt)",
        ton_us: "Tonne courte (ton US)", ton_uk: "Tonne longue (ton UK)",
        ct: "Carat (ct)", gr: "Grain (gr)", dram: "Dram",
        talent: "Talent antique", quintal: "Quintal"
    };

    const groups = {
        "Système Métrique": ["qg","rg","yg","zg","ag","fg","pg","ng","µg","dmg","mg","cg","dg","g","dag","hg","kg","mag","Mg","Gg","Tg","Pg","Eg","Zg","Yg","Rg","Qg"],
        "Unités Impériales": ["oz", "lb", "st", "qt", "cwt_us", "cwt_uk", "ton_us", "ton_uk"],
        "Spécifiques / Anciennes": ["ct", "gr", "dram", "talent", "quintal"]
    };

    function populate(select) {
        select.innerHTML = ""; // Sécurité : on vide avant de remplir
        for (let label in groups) {
            let optgroup = document.createElement("optgroup");
            optgroup.label = label;
            groups[label].forEach(key => {
                if (conversionRates[key]) {
                    let option = new Option(displayNames[key] || key, key);
                    optgroup.appendChild(option);
                }
            });
            select.appendChild(optgroup);
        }
    }

    populate(fromSelect);
    populate(toSelect);

    const convert = () => {
        const inputVal = inputField.value;
        if (inputVal === "" || isNaN(inputVal)) {
            resultDisplay.innerText = "Erreur : valeur invalide";
            return;
        }

        try {
            const value = new Decimal(inputVal);
            const from = fromSelect.value;
            const to = toSelect.value;
            const precision = parseInt(precisionField.value) || 0;

            const res = value.mul(conversionRates[from]).div(conversionRates[to]);
            let resStr = res.toFixed(precision).replace(/\.?0+$/, '');
            
            resultDisplay.innerText = `Résultat : ${resStr} ${to}`;
        } catch (e) {
            resultDisplay.innerText = "Erreur de calcul";
            console.error(e);
        }
    };

    // Branchement du bouton (plus propre que onclick)
    if (btnConvert) {
        btnConvert.onclick = convert;
    }
}
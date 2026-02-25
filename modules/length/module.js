/**
 * Module de conversion de Longueur
 * Système modulaire v2 - Conservation intégrale des unités
 */

export async function init(container) {
    // Chargement sécurisé de Decimal.js
    if (typeof Decimal === "undefined") {
        await new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = "dependencies/decimal.js";
            script.onload = resolve;
            document.head.appendChild(script);
        });
    }
    setupLengthModule(container);
}

function setupLengthModule(container) {
    // Sélection des éléments locaux au container
    const fromSelect = container.querySelector("#from");
    const toSelect = container.querySelector("#to");
    const inputField = container.querySelector("#input");
    const precisionField = container.querySelector("#precision-input");
    const resultDisplay = container.querySelector("#result");
    const btnConvert = container.querySelector("#btn-convert");

    const conversionRates = {
        qm: new Decimal("1e-30"), rm: new Decimal("1e-27"), ym: new Decimal("1e-24"),
        zm: new Decimal("1e-21"), am: new Decimal("1e-18"), fm: new Decimal("1e-15"),
        pm: new Decimal("1e-12"), an: new Decimal("1e-10"), nm: new Decimal("1e-9"),
        µm: new Decimal("1e-6"), dmm: new Decimal("1e-4"), mm: new Decimal("1e-3"),
        cm: new Decimal("1e-2"), dm: new Decimal("1e-1"), m: new Decimal(1),
        km: new Decimal("1e3"), mam: new Decimal("1e4"), Mm: new Decimal("1e6"),
        Gm: new Decimal("1e9"), Tm: new Decimal("1e12"), Pm: new Decimal("1e15"),
        Em: new Decimal("1e18"), Zm: new Decimal("1e21"), Ym: new Decimal("1e24"),
        Rm: new Decimal("1e27"), Qm: new Decimal("1e30"),
        in: new Decimal("127").div("5000"), ft: new Decimal("381").div("12500"),
        yd: new Decimal("1143").div("37500"), mi: new Decimal("1609344").div("1000000"),
        nmi: new Decimal("1852"), AU: new Decimal("149597870700"),
        pc: new Decimal("30856775814913673"), ls: new Decimal("299792458"),
        lm: new Decimal("17987547480"), lh: new Decimal("1079252848800"),
        ld: new Decimal("25902068371200"), ly: new Decimal("9460730472580800"),
        lc: new Decimal("946073047258080000")
    };

    const displayNames = {
        qm: "Quintamètre (qm)", rm: "Robamètre (rm)", ym: "Yoctomètre (ym)",
        zm: "Zeptomètre (zm)", am: "Attamètre (am)", fm: "Femtomètre (fm)",
        pm: "Picomètre (pm)", an: "Ångström (Å)", nm: "Nanomètre (nm)",
        µm: "Micromètre (µm)", dmm: "Décimilimètre (dmm)", mm: "Millimètre (mm)",
        cm: "Centimètre (cm)", dm: "Décimètre (dm)", m: "Mètre (m)",
        km: "Kilomètre (km)", mam: "Myriamètre (myr)", Mm: "Mégamètre (Mm)",
        Gm: "Gigamètre (Gm)", Tm: "Téramètre (Tm)", Pm: "Pétamètre (Pm)",
        Em: "Examètre (Em)", Zm: "Zettamètre (Zm)", Ym: "Yottamètre (Ym)",
        Rm: "Ronnamètre (Rm)", Qm: "Quettamètre (Qm)", in: "Pouce (in)",
        ft: "Pied (ft)", yd: "Yard (yd)", mi: "Mile (mi)", nmi: "Mille marin (nmi)",
        AU: "Unité astronomique (AU)", pc: "Parsec (pc)", ls: "Seconde-lumière (ls)",
        lm: "Minute-lumière (lm)", lh: "Heure-lumière (lh)", ld: "Jour-lumière (ld)",
        ly: "Année-lumière (ly)", lc: "Siècle-lumière (lc)"
    };

    const groups = {
        "Multiples et sous-multiples du mètre": ["qm", "rm", "ym", "zm", "am", "fm", "pm", "an" , "nm", "µm", "dmm", "mm", "cm", "dm", "m", "km", "mam", "Mm", "Gm", "Tm", "Pm", "Em", "Zm", "Ym", "Rm", "Qm"],
        "Système impérial & US Customary": ["in", "ft", "yd", "mi", "nmi"],
        "Unités astronomiques": ["AU", "pc", "ls", "lm", "lh", "ld", "ly", "lc"]
    };

    const populateLengthMenus = () => {
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

    const executeConversion = () => {
        const inputVal = inputField.value;
        if (inputVal === "" || isNaN(inputVal)) {
            resultDisplay.innerText = "Erreur : valeur invalide";
            return;
        }

        try {
            const val = new Decimal(inputVal);
            const from = fromSelect.value;
            const to = toSelect.value;
            const precision = parseInt(precisionField.value) || 0;

            const res = val.mul(conversionRates[from]).div(conversionRates[to]);
            let resStr = res.toFixed(precision).replace(/\.?0+$/, '');
            
            resultDisplay.innerText = `Résultat : ${resStr} ${to}`;
        } catch (e) {
            resultDisplay.innerText = "Erreur lors du calcul";
        }
    };

    btnConvert.onclick = executeConversion;
    populateLengthMenus();
}
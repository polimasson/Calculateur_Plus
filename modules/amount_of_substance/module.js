/**
 * Module de conversion de Quantité de Matière
 * Gère les échelles SI de la mole et le nombre d'entités (Avogadro)
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
    setupMoleModule(container);
}

function setupMoleModule(container) {
    const fromSelect = container.querySelector("#mol-from");
    const toSelect = container.querySelector("#mol-to");
    const inputField = container.querySelector("#mol-input");
    const precisionField = container.querySelector("#mol-precision");
    const resultDisplay = container.querySelector("#mol-result");
    const btnConvert = container.querySelector("#btn-convert-mol");

    // Conservation intégrale de tes taux de conversion
const conversionRates = {
        // Préfixes Géants
        Qmol: new Decimal("1e30"), // Quetta (tu avais mis 24, c'est 30 !)
        Rmol: new Decimal("1e27"), // Ronna (tu avais mis 27 pour ronto, c'est l'inverse)
        Ymol: new Decimal("1e24"), // Yotta
        Zmol: new Decimal("1e21"), 
        Emol: new Decimal("1e18"),
        Pmol: new Decimal("1e15"),
        Tmol: new Decimal("1e12"),
        Gmol: new Decimal("1e9"),
        Mmol: new Decimal("1e6"),
        kmol: new Decimal("1e3"),
        hmol: new Decimal("1e2"),
        damol: new Decimal("1e1"),
        
        // Base
        mol: new Decimal(1),
        
        // Préfixes Petits
        dmol: new Decimal("1e-1"),
        cmol: new Decimal("1e-2"),
        mmol: new Decimal("1e-3"),
        µmol: new Decimal("1e-6"),
        nmol: new Decimal("1e-9"),
        pmol: new Decimal("1e-12"),
        fmol: new Decimal("1e-15"),
        amol: new Decimal("1e-18"),
        zmol: new Decimal("1e-21"),
        ymol: new Decimal("1e-24"),
        rmol: new Decimal("1e-27"),
        qmol: new Decimal("1e-30"),

        // La constante d'Avogadro EXACTE
        entites: new Decimal("6.02214076e23")
    };

    const displayNames = {
        Qmol: "Quettamole (Qmol)", Rmol: "Ronnamole (Rmol)", Ymol: "Yottamole (Ymol)",
        Zmol: "Zettamole (Zmol)", Emol: "Examole (Emol)", Pmol: "Petamole (Pmol)",
        Tmol: "Teramole (Tmol)", Gmol: "Gigamole (Gmol)", Mmol: "Mégamole (Mmol)",
        kmol: "Kilomole (kmol)", hmol: "Hectomole (hmol)", damol: "Décamole (damol)",
        mol: "Mole (mol)", dmol: "Décimole (dmol)", cmol: "Centimole (cmol)",
        mmol: "Millimole (mmol)", µmol: "Micromole (µmol)", nmol: "Nanomole (nmol)",
        pmol: "Picomole (pmol)", fmol: "Femtomole (fmol)", amol: "Attomole (amol)",
        zmol: "Zeptomole (zmol)", ymol: "Yoctomole (ymol)", rmol: "Rontomole (rmol)",
        qmol: "Quectomole (qmol)", entites: "Nombre d'atomes/molécules"
    };

    const groups = {
        "Multiples (Grands)": ["Qmol", "Rmol", "Ymol", "Zmol", "Emol", "Pmol", "Tmol", "Gmol", "Mmol", "kmol", "hmol", "damol"],
        "Base": ["mol"],
        "Sous-multiples (Petits)": ["dmol", "cmol", "mmol", "µmol", "nmol", "pmol", "fmol", "amol", "zmol", "ymol", "rmol", "qmol"],
        "Décompte réel": ["entites"]
    };

    const populateMenus = () => {
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
        const valRaw = inputField.value;
        if (valRaw === "" || isNaN(valRaw)) {
            resultDisplay.innerText = "Erreur : valeur invalide";
            return;
        }

        try {
            const amount = new Decimal(valRaw);
            const from = fromSelect.value;
            const to = toSelect.value;
            const precision = parseInt(precisionField.value) || 0;

            const result = amount.mul(conversionRates[from]).div(conversionRates[to]);
            let resStr = result.toFixed(precision).replace(/\.?0+$/, '');
            
            resultDisplay.innerText = `Résultat : ${resStr} ${to}`;
        } catch (e) {
            resultDisplay.innerText = "Erreur de calcul";
        }
    };

    btnConvert.onclick = executeConversion;
    populateMenus();
}
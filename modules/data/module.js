/**
 * Module de conversion de Données Numériques
 * Gère les bases 1000 (SI) et 1024 (IEC)
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
    setupDataModule(container);
}

function setupDataModule(container) {
    const fromSelect = container.querySelector("#data-from");
    const toSelect = container.querySelector("#data-to");
    const inputField = container.querySelector("#data-input");
    const precisionField = container.querySelector("#data-precision");
    const resultDisplay = container.querySelector("#data-result");
    const btnConvert = container.querySelector("#btn-convert-data");

    // Conservation de l'intégralité de tes taux de conversion
    const conversionRates = {
        b: new Decimal(1), B: new Decimal(8),
        Kb: new Decimal("1e3"), Mb: new Decimal("1e6"), Gb: new Decimal("1e9"),
        Tb: new Decimal("1e12"), Pb: new Decimal("1e15"), Eb: new Decimal("1e18"),
        Zb: new Decimal("1e21"), Yb: new Decimal("1e24"),
        Kib: new Decimal("1024"), Mib: new Decimal("1048576"), Gib: new Decimal("1073741824"),
        Tib: new Decimal("1099511627776"), Pib: new Decimal("1125899906842624"),
        Eib: new Decimal("1152921504606846976"), Zib: new Decimal("1180591620717411303424"),
        Yib: new Decimal("1208925819614629174706176"),
        KB: new Decimal("1e3").mul(8), MB: new Decimal("1e6").mul(8),
        GB: new Decimal("1e9").mul(8), TB: new Decimal("1e12").mul(8),
        PB: new Decimal("1e15").mul(8), EB: new Decimal("1e18").mul(8),
        ZB: new Decimal("1e21").mul(8), YB: new Decimal("1e24").mul(8),
        KiB: new Decimal("1024").mul(8), MiB: new Decimal("1048576").mul(8),
        GiB: new Decimal("1073741824").mul(8), TiB: new Decimal("1099511627776").mul(8),
        PiB: new Decimal("1125899906842624").mul(8), EiB: new Decimal("1152921504606846976").mul(8),
        ZiB: new Decimal("1180591620717411303424").mul(8), YiB: new Decimal("1208925819614629174706176").mul(8)
    };

    const displayNames = {
        b: "Bit (b)", B: "Octet (B)", Kb: "Kilobit (Kb)", Mb: "Megabit (Mb)", Gb: "Gigabit (Gb)",
        Tb: "Terabit (Tb)", Pb: "Petabit (Pb)", Eb: "Exabit (Eb)", Zb: "Zettabit (Zb)", Yb: "Yottabit (Yb)",
        Kib: "Kibibit (Kib)", Mib: "Mebibit (Mib)", Gib: "Gibibit (Gib)", Tib: "Tebibit (Tib)",
        Pib: "Pebibit (Pib)", Eib: "Exbibit (Eib)", Zib: "Zebibit (Zib)", Yib: "Yobibit (Yib)",
        KB: "Kilooctet (KB)", MB: "Megaoctet (MB)", GB: "Gigaoctet (GB)", TB: "Teraoctet (TB)",
        PB: "Petaoctet (PB)", EB: "Exaoctet (EB)", ZB: "Zettaoctet (ZB)", YB: "Yottaoctet (YB)",
        KiB: "Kibioctet (KiB)", MiB: "Mebioctet (MiB)", GiB: "Gibioctet (GiB)", TiB: "Tebioctet (TiB)",
        PiB: "Pebioctet (PiB)", EiB: "Exbioctet (EiB)", ZiB: "Zebioctet (ZiB)", YiB: "Yobioctet (YiB)"
    };

    const groups = {
        "Unités de base": ["b", "B"],
        "Unités décimales": ["Kb", "Mb", "Gb", "Tb", "Pb", "Eb", "Zb", "Yb"],
        "Unités binaires": ["Kib", "Mib", "Gib", "Tib", "Pib", "Eib", "Zib", "Yib"],
        "Unités décimales en octets": ["KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"],
        "Unités binaires en octets": ["KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"]
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
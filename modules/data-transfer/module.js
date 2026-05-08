/**
 * Module de transfert de données
 * Gère les débits binaires et décimaux sur des échelles de temps variables.
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
    setupDataTransfer(container);
}

function setupDataTransfer(container) {
    const fromUnit = container.querySelector("#from");
    const fromTime = container.querySelector("#from-time");
    const toUnit = container.querySelector("#to");
    const toTime = container.querySelector("#to-time");
    const inputVal = container.querySelector("#input");
    const precisionInp = container.querySelector("#precision-input");
    const resultDisplay = container.querySelector("#result");
    const btnConvert = container.querySelector("#btn-convert");

    const dataRates = {
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

    const timeUnits = {
        "s": 1, "min": 60, "h": 3600, "j": 86400,
        "semaine": 604800, "mois": 2628000, "an": 31536000
    };

    const dataNames = {
        b: "Bit (b)", B: "Octet (B)", Kb: "Kilobit (Kb)", Mb: "Megabit (Mb)",
        Gb: "Gigabit (Gb)", Tb: "Terabit (Tb)", Pb: "Petabit (Pb)", Eb: "Exabit (Eb)",
        Zb: "Zettabit (Zb)", Yb: "Yottabit (Yb)", Kib: "Kibibit (Kib)", Mib: "Mebibit (Mib)",
        Gib: "Gibibit (Gib)", Tib: "Tebibit (Tib)", Pib: "Pebibit (Pib)", Eib: "Exbibit (Eib)",
        Zib: "Zebibit (Zib)", Yib: "Yobibit (Yib)", KB: "Kilooctet (KB)", MB: "Megaoctet (MB)",
        GB: "Gigaoctet (GB)", TB: "Teraoctet (TB)", PB: "Petaoctet (PB)", EB: "Exaoctet (EB)",
        ZB: "Zettaoctet (ZB)", YB: "Yottaoctet (YB)", KiB: "Kibioctet (KiB)", MiB: "Mebioctet (MiB)",
        GiB: "Gibioctet (GiB)", TiB: "Tebioctet (TiB)", PiB: "Pebioctet (PiB)",
        EiB: "Exbioctet (EiB)", ZiB: "Zebioctet (ZiB)", YiB: "Yobioctet (YiB)"
    };

    const timeNames = {
        "s": "Seconde (s)", "min": "Minute (min)", "h": "Heure (h)", 
        "j": "Jour (j)", "semaine": "Semaine", "mois": "Mois", "an": "An"
    };

    const populate = () => {
        // Data units
        [fromUnit, toUnit].forEach(sel => {
            for (let k in dataRates) sel.appendChild(new Option(dataNames[k] || k, k));
        });
        // Time units
        [fromTime, toTime].forEach(sel => {
            for (let k in timeUnits) sel.appendChild(new Option(timeNames[k] || k, k));
        });
    };

    const processConversion = () => {
        const valRaw = inputVal.value || 0;
        const precision = parseInt(precisionInp.value) || 0;

        try {
            const value = new Decimal(valRaw);
            // Calcul du débit de base en bits/seconde
            // (Valeur * Facteur Data) / Facteur Temps Source
            const bitsPerSec = value.mul(dataRates[fromUnit.value]).div(timeUnits[fromTime.value]);
            
            // Conversion vers la cible
            // bitsPerSec * Facteur Temps Cible / Facteur Data Cible
            const converted = bitsPerSec.mul(timeUnits[toTime.value]).div(dataRates[toUnit.value]);

            let resStr = converted.toFixed(precision).replace(/\.?0+$/, '');
            resultDisplay.textContent = `Résultat : ${resStr} ${toUnit.value}/${toTime.value}`;
        } catch (e) {
            resultDisplay.textContent = "Erreur de conversion";
        }
    };

    btnConvert.onclick = processConversion;
    populate();
}
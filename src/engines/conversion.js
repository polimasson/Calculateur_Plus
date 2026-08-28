/**
 * Moteur de conversion générique
 * supporte : factor, affine (temp), compound (débit), context (Mach)
 */
export function createConverter(config) {
    return {
        convert(val, from, to, ctx={}) {
            if (config.type === "affine") {
                const toBase = config.toBase[from];
                const fromBase = config.fromBase[to];
                if (!toBase || !fromBase) throw new Error("Unité inconnue");
                return fromBase(toBase(val));
            }
            if (config.type === "compound") {
                // data-transfer : val * dataRate[fromData] / timeRate[fromTime] -> * timeRate[toTime] / dataRate[toData]
                // config : { dataRates, timeRates }
                // from/to sont objets {data, time}
                const bits = val.mul(config.dataRates[from.data]).div(config.timeRates[from.time]);
                return bits.div(config.dataRates[to.data]).mul(config.timeRates[to.time]);
            }
            // factor (défaut)
            const rFrom = config.rates[from];
            const rTo = config.rates[to];
            if (!rFrom || !rTo) throw new Error("Unité inconnue");
            return val.mul(rFrom).div(rTo);
        },
        contextFactor(unit, ctx) {
            if (unit === "mach" && config.mach) return config.mach(ctx.temp ?? 15);
            return null;
        }
    };
}
export async function ensureDecimal() {
    if (typeof Decimal === "undefined") {
        await new Promise((resolve) => {
            const s = document.createElement("script");
            s.src = "dependencies/decimal.js";
            s.onload = resolve;
            document.head.appendChild(s);
        });
    }
}
export function mountConverter(container, config, opts={}) {
    const fromSel = container.querySelector("#from");
    const toSel = container.querySelector("#to");
    const input = container.querySelector("#input");
    const prec = container.querySelector("#precision-input");
    const result = container.querySelector("#result");
    const btn = container.querySelector("#btn-convert");
    const displayMode = container.querySelector("#display-mode");
    const parTemps = container.querySelector("#par-temps");
    const tableGridCb = container.querySelector("#table-grid");
    const tableDiv = container.querySelector("#vers-tout-table");
    const hubTime = container.querySelector("#hub-time");
    const timeFrom = container.querySelector("#time-from");
    const timeTo = container.querySelector("#time-to");
    const locked = !!opts.locked;
    if (tableGridCb) {
        tableGridCb.checked = localStorage.getItem("cp.tableGrid") !== "0";
        tableGridCb.addEventListener("change", () => localStorage.setItem("cp.tableGrid", tableGridCb.checked ? "1" : "0"));
    }
    const useGrid = () => tableGridCb ? tableGridCb.checked : localStorage.getItem("cp.tableGrid") !== "0";

    // pour compound : 4 selects (#fromData #fromTime #toData #toTime)
    const isCompound = config.type === "compound";
    const timeRates = { "s": new Decimal(1), "ms": new Decimal("0.001"), "min": new Decimal(60), "h": new Decimal(3600), "day": new Decimal(86400), "week": new Decimal(604800) };

    const populate = () => {
        const groups = config.groups || { "Unités": Object.keys(config.rates || config.dataRates || {}) };
        const selects = isCompound ? [container.querySelector("#fromData"), container.querySelector("#fromTime"), container.querySelector("#toData"), container.querySelector("#toTime")] : [fromSel, toSel];
        selects.forEach(sel => {
            if (!sel) return;
            sel.innerHTML = "";
            for (const label in groups) {
                const og = document.createElement("optgroup");
                og.label = label;
                groups[label].forEach(k => og.appendChild(new Option(config.displayNames[k] || k, k)));
                sel.appendChild(og);
            }
        });
        if (timeFrom && timeTo) {
            const tNames = { s:"Seconde (s)", ms:"Milliseconde (ms)", min:"Minute (min)", h:"Heure (h)", day:"Jour", week:"Semaine" };
            [timeFrom, timeTo].forEach(sel => {
                sel.innerHTML = "";
                Object.keys(timeRates).forEach(k => sel.appendChild(new Option(tNames[k]||k, k)));
            });
            timeFrom.value = "s"; timeTo.value = "s";
        }
    };

    const updateMode = () => {
        const m = displayMode?.value || "normal";
        const hideTo = m === "vers-tout" || m === "tableau";
        const hideFrom = m === "tableau";
        if (toSel) toSel.style.display = hideTo ? "none" : "";
        if (fromSel) fromSel.style.display = hideFrom ? "none" : "";
        const arrow = container.querySelector("#hub-simple span");
        if (arrow) arrow.style.display = hideTo ? "none" : "";
        if (m === "normal") tableDiv.style.display = "none";
        const gridRow = tableGridCb?.closest("div") || tableGridCb?.parentElement;
        if (gridRow) gridRow.style.display = m === "normal" ? "none" : "";
    };
    if (displayMode) displayMode.addEventListener("change", updateMode);

    const doConvert = () => {
        const v = input.value;
        if (v === "" || isNaN(v)) { result.innerText = "Erreur : valeur invalide"; return; }
        try {
            const val = new Decimal(v);
            const p = parseInt(prec.value) || 0;
            const mode = displayMode?.value || "normal";
            const useParTemps = parTemps?.checked && !isCompound;
            if (mode === "tableau" && !isCompound) {
                const usePT = useParTemps;
                const tf = usePT ? timeFrom.value : null, tt = usePT ? timeTo.value : null;
                const g = useGrid();
                const tbl = g ? 'width:100%;font-size:10px;border-collapse:collapse;border:1px solid #888' : 'width:100%;font-size:10px;border-collapse:collapse';
                const th = g ? 'border:1px solid #888;padding:2px 4px;background:#c0c0c0' : 'padding:2px 4px;background:#c0c0c0';
                const td = g ? 'border:1px solid #888;padding:2px 4px' : 'padding:2px 4px';
                let html = `<table style="${tbl}"><tr><th style="${th}"></th>`;
                const units = Object.keys(config.rates || {});
                units.forEach(u => html += `<th style="${th}">${u}${usePT?`/${tt}`:""}</th>`);
                html += `</tr>`;
                units.forEach(from => {
                    html += `<tr><th style="${th}">${from}${usePT?`/${tf}`:""}</th>`;
                    units.forEach(to => {
                        let r;
                        if (usePT) {
                            r = val.mul(config.rates[from]).div(timeRates[tf]).mul(timeRates[tt]).div(config.rates[to]);
                        } else {
                            r = val.mul(config.rates[from]).div(config.rates[to]);
                        }
                        html += `<td style="${td}">${r.toFixed(Math.min(p,4)).replace(/\.?0+$/,'')}</td>`;
                    });
                    html += `</tr>`;
                });
                html += `</table>`;
                tableDiv.innerHTML = html; tableDiv.style.display = "";
                result.innerText = `Tableau ${units.length}×${units.length} depuis ${val}${usePT?` ${tf}→${tt}`:""}`;
                return;
            }
            if (useParTemps) {
                const from = fromSel.value;
                const tf = timeFrom.value, tt = timeTo.value;
                const rFrom = config.rates[from];
                const tfRate = timeRates[tf], ttRate = timeRates[tt];
                if (mode === "vers-tout") {
                    const g = useGrid();
                    const tbl = g ? 'width:100%;font-size:11px;border-collapse:collapse;border:1px solid #888' : 'width:100%;font-size:11px;border-collapse:collapse';
                    const th = g ? 'border:1px solid #888;padding:2px 4px;background:#c0c0c0' : 'padding:2px 4px;background:#c0c0c0';
                    const td = g ? 'border:1px solid #888;padding:2px 4px' : 'padding:2px 4px';
                    let html = `<table style="${tbl}"><tr><th style="${th}">Unité</th><th style="${th}">Valeur</th></tr>`;
                    for (const k of Object.keys(config.rates)) {
                        const r = val.mul(rFrom).div(tfRate).mul(ttRate).div(config.rates[k]);
                        html += `<tr><td style="${td}">${config.displayNames[k]||k}</td><td style="${td}">${r.toFixed(p).replace(/\.?0+$/,'')} ${k}/${tt}</td></tr>`;
                    }
                    html += `</table>`;
                    tableDiv.innerHTML = html; tableDiv.style.display = "";
                    result.innerText = `${val} ${from}/${tf} → vers tout en /${tt} : ${Object.keys(config.rates).length} unités`;
                    return;
                }
                const to = toSel.value, rTo = config.rates[to];
                const res = val.mul(rFrom).div(tfRate).mul(ttRate).div(rTo);
                tableDiv.style.display = "none";
                result.innerText = `Résultat : ${val} ${from}/${tf} = ${res.toFixed(p).replace(/\.?0+$/,'')} ${to}/${tt}`;
                return;
            }
            if (mode === "vers-tout" && !isCompound) {
                const from = fromSel.value;
                const rFrom = config.rates[from];
                const g = useGrid();
                const tbl = g ? 'width:100%;font-size:11px;border-collapse:collapse;border:1px solid #888' : 'width:100%;font-size:11px;border-collapse:collapse';
                const th = g ? 'border:1px solid #888;padding:2px 4px;background:#c0c0c0' : 'padding:2px 4px;background:#c0c0c0';
                const td = g ? 'border:1px solid #888;padding:2px 4px' : 'padding:2px 4px';
                let html = `<table style="${tbl}"><tr><th style="${th}">Unité</th><th style="${th}">Valeur</th></tr>`;
                for (const k of Object.keys(config.rates)) {
                    const r = val.mul(rFrom).div(config.rates[k]);
                    html += `<tr><td style="${td}">${config.displayNames[k]||k}</td><td style="${td}">${r.toFixed(p).replace(/\.?0+$/,'')} ${k}</td></tr>`;
                }
                html += `</table>`;
                tableDiv.innerHTML = html; tableDiv.style.display = "";
                result.innerText = `${val} ${from} → vers tout : ${Object.keys(config.rates).length} unités`;
                return;
            }
            tableDiv && (tableDiv.style.display = "none");
            let res;
            if (isCompound) {
                const conv = createConverter(config);
                const f = { data: container.querySelector("#fromData").value, time: container.querySelector("#fromTime").value };
                const t = { data: container.querySelector("#toData").value, time: container.querySelector("#toTime").value };
                res = conv.convert(val, f, t);
                result.innerText = `Résultat : ${res.toFixed(p).replace(/\.?0+$/, '')} ${t.data}/${t.time}`;
            } else {
                let from = fromSel.value, to = toSel.value;
                if ((from === "mach" || to === "mach") && config.mach) {
                    const temp = parseFloat(container.querySelector("#mach-temp")?.value) || 15;
                    const machFactor = config.mach(temp);
                    const rates = { ...config.rates, mach: machFactor };
                    const tmp = { ...config, rates };
                    res = createConverter(tmp).convert(val, from, to);
                } else {
                    res = createConverter(config).convert(val, from, to);
                }
                result.innerText = `Résultat : ${res.toFixed(p).replace(/\.?0+$/, '')} ${to}`;
            }
        } catch (e) { result.innerText = "Erreur lors du calcul"; }
    };
    if (btn) btn.onclick = doConvert;
    if (parTemps) parTemps.addEventListener("change", () => { hubTime.style.display = parTemps.checked ? "" : "none"; tableDiv.style.display = "none"; });
    if (displayMode) displayMode.addEventListener("change", updateMode);
    populate();
    updateMode();
}

export async function init(container) {
    setup(container);
}

function setup(container) {
    const n1Field = container.querySelector('#n1');
    const n2Field = container.querySelector('#n2');
    const btnCalc = container.querySelector('#btn-calc');
    const btnFactor1 = container.querySelector('#btn-factor1');
    const btnFactor2 = container.querySelector('#btn-factor2');
    const btnClear = container.querySelector('#btn-clear');
    const resGcd = container.querySelector('#result-gcd');
    const resLcm = container.querySelector('#result-lcm');
    const resFactors = container.querySelector('#result-factors');

    btnCalc.addEventListener('click', () => {
        const a = parseInput(n1Field.value);
        const b = parseInput(n2Field.value);
        if (a === null || b === null) {
            resGcd.innerText = 'Erreur : entrez deux entiers valides.';
            resLcm.innerText = '';
            resFactors.innerText = '';
            return;
        }

        const g = gcdBig(a, b);
        const l = lcmBig(a, b);

        const factA = factorizeBig(a);
        const factB = factorizeBig(b);
        const factG = intersectFactors(factA, factB);
        const factL = unionMaxFactors(factA, factB);

        const exprG = formatFactorsObj(factG, { alwaysShowExponent: true });
        const exprL = formatFactorsObj(factL, { alwaysShowExponent: false });

        resGcd.innerText = `PGCD : ${exprG} = ${g.toString()}`;
        resLcm.innerText = `PPCM : ${exprL} = ${l.toString()}`;
        resFactors.innerHTML = `Décomposition N1: ${formatFactorsObj(factA)}<br>Décomposition N2: ${formatFactorsObj(factB)}`;
    });

    btnFactor1.addEventListener('click', () => {
        const a = parseInput(n1Field.value);
        if (a === null) {
            resFactors.innerText = 'Erreur : N1 invalide.';
            return;
        }
        resFactors.innerText = `Décomposition N1: ${formatFactorsObj(factorizeBig(a))}`;
    });

    btnFactor2.addEventListener('click', () => {
        const b = parseInput(n2Field.value);
        if (b === null) {
            resFactors.innerText = 'Erreur : N2 invalide.';
            return;
        }
        resFactors.innerText = `Décomposition N2: ${formatFactorsObj(factorizeBig(b))}`;
    });

    btnClear.addEventListener('click', () => {
        n1Field.value = '';
        n2Field.value = '';
        resGcd.innerText = '';
        resLcm.innerText = '';
        resFactors.innerText = '';
    });
}

function parseInput(raw) {
    if (raw === '' || raw === null || raw === undefined) return null;
    const s = String(raw).trim();
    if (s === '') return null;
    try {
        return BigInt(s);
    } catch (e) {
        const num = Number(s);
        if (!Number.isFinite(num)) return null;
        return BigInt(Math.trunc(num));
    }
}

function gcdBig(a, b) {
    a = a < 0n ? -a : a;
    b = b < 0n ? -b : b;
    if (a === 0n) return b;
    if (b === 0n) return a;
    while (b !== 0n) {
        const t = a % b;
        a = b;
        b = t;
    }
    return a;
}

function lcmBig(a, b) {
    a = a < 0n ? -a : a;
    b = b < 0n ? -b : b;
    if (a === 0n || b === 0n) return 0n;
    const g = gcdBig(a, b);
    const res = (a / g) * b;
    return res < 0n ? -res : res;
}

function factorizeBig(n) {
    n = n < 0n ? -n : n;
    const out = {};
    if (n === 0n) {
        out['0'] = '1';
        return out;
    }
    if (n === 1n) {
        out['1'] = '1';
        return out;
    }

    let count = 0n;
    while (n % 2n === 0n) {
        n = n / 2n;
        count += 1n;
    }
    if (count > 0n) out['2'] = count.toString();

    let p = 3n;
    while (p * p <= n) {
        let c = 0n;
        while (n % p === 0n) {
            n = n / p;
            c += 1n;
        }
        if (c > 0n) out[p.toString()] = c.toString();
        p += 2n;
    }

    if (n > 1n) out[n.toString()] = '1';
    return out;
}
function intersectFactors(a, b) {
    const out = {};
    for (const p in a) {
        if (Object.prototype.hasOwnProperty.call(b, p)) {
            const ea = Number(a[p] || '0');
            const eb = Number(b[p] || '0');
            const e = Math.min(ea, eb);
            if (e > 0) out[p] = String(e);
        }
    }
    return out;
}

function unionMaxFactors(a, b) {
    const out = {};
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    keys.forEach((p) => {
        const ea = Number(a[p] || '0');
        const eb = Number(b[p] || '0');
        const e = Math.max(ea, eb);
        if (e > 0) out[p] = String(e);
    });
    return out;
}

function toSuperscript(n) {
    const map = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };
    return String(n).split('').map(ch => map[ch] || ch).join('');
}

function formatFactorsObj(obj, opts = {}) {
    if (!obj || Object.keys(obj).length === 0) return '1';
    const entries = Object.entries(obj);
    entries.sort((a, b) => {
        const A = BigInt(a[0]);
        const B = BigInt(b[0]);
        return A < B ? -1 : A > B ? 1 : 0;
    });
    const parts = entries.map(([p, e]) => {
        const ei = Number(e);
        const showExp = opts.alwaysShowExponent === true || ei !== 1;
        return showExp ? `${p}${toSuperscript(e)}` : `${p}`;
    });
    return parts.join(' × ');
}

export async function init(container) {
    setupConverter(container);
}

function setupConverter(container) {
    const fromBase = container.querySelector("#fromBase");
    const toBase = container.querySelector("#toBase");
    const inputValue = container.querySelector("#inputValue");
    const outputValue = container.querySelector("#outputValue");
    const inputHint = container.querySelector("#inputHint");
    const outputHint = container.querySelector("#outputHint");
    const convertBtn = container.querySelector("#convertBtn");
    const clearBtn = container.querySelector("#clearBtn");
    const copyBtn = container.querySelector("#copyBtn");
    const swapBtn = container.querySelector("#swapBtn");

    const allBin = container.querySelector("#allBin");
    const allOct = container.querySelector("#allOct");
    const allDec = container.querySelector("#allDec");
    const allHex = container.querySelector("#allHex");
    const allB32 = container.querySelector("#allB32");
    const allB58 = container.querySelector("#allB58");
    const allB64 = container.querySelector("#allB64");

    const hints = {
        bin: "0-1",
        oct: "0-7",
        dec: "0-9",
        hex: "0-9, A-F",
        b32: "A-Z, 2-7",
        b58: "1-9, A-H, J-N, P-Z, a-k, m-z (sans 0, O, I, l)",
        b64: "A-Z, a-z, 0-9, +/="
    };

    function updateHints() {
        inputHint.textContent = hints[fromBase.value];
        outputHint.textContent = hints[toBase.value];
    }

    function validateInput(value, base) {
        const clean = value.trim().replace(/\s/g, '');
        if (!clean) return null;

        switch (base) {
            case 'bin':
                if (!/^[01]+$/.test(clean)) return null;
                return clean;
            case 'oct':
                if (!/^[0-7]+$/.test(clean)) return null;
                return clean;
            case 'dec':
                if (!/^\d+$/.test(clean)) return null;
                return clean;
            case 'hex':
                if (!/^[0-9A-Fa-f]+$/.test(clean)) return null;
                return clean.toLowerCase();
            case 'b32':
                if (!/^[A-Z2-7]+$/i.test(clean)) return null;
                return clean.toUpperCase();
            case 'b58':
                if (!/^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/.test(clean)) return null;
                return clean;
            case 'b64':
                if (!/^[A-Za-z0-9+/=]+$/.test(clean)) return null;
                return clean;
            default:
                return null;
        }
    }

    function toDecimal(value, from) {
        try {
            switch (from) {
                case 'bin':
                    return BigInt('0b' + value);
                case 'dec':
                    return BigInt(value);
                case 'hex':
                    return BigInt('0x' + value);
                case 'oct':
                    return BigInt('0o' + value);
                case 'b32':
                    return base32ToBigInt(value);
                case 'b58':
                    return base58ToBigInt(value);
                case 'b64':
                    const bytesFromB64 = base64ToBytes(value);
                    if (!bytesFromB64) return null;
                    let hexFromB64 = '';
                    for (const b of bytesFromB64) {
                        hexFromB64 += b.toString(16).padStart(2, '0');
                    }
                    return BigInt('0x' + hexFromB64 || '0');
                default:
                    return null;
            }
        } catch (e) {
            return null;
        }
    }

    function fromDecimal(decimal, to) {
        try {
            if (decimal === null) return null;
            const bigVal = BigInt(decimal);

            switch (to) {
                case 'bin':
                    return bigVal.toString(2);
                case 'dec':
                    return bigVal.toString(10);
                case 'hex':
                    return bigVal.toString(16).toUpperCase();
                case 'oct':
                    return bigVal.toString(8);
                case 'b32':
                    return bigIntToBase32(bigVal);
                case 'b58':
                    return bigIntToBase58(bigVal);
                case 'b64':
                    let hexToB64 = bigVal.toString(16);
                    if (hexToB64.length % 2) hexToB64 = '0' + hexToB64;
                    const bytePairs = hexToB64.match(/.{2}/g);
                    if (!bytePairs) return null;
                    const bytesToB64 = bytePairs.map(h => parseInt(h, 16));
                    return bytesToBase64(new Uint8Array(bytesToB64));
                default:
                    return null;
            }
        } catch (e) {
            return null;
        }
    }

    function base64ToBytes(base64) {
        try {
            // Ajouter padding si nécessaire
            let padded = base64;
            while (padded.length % 4 !== 0) {
                padded += '=';
            }
            const binary = atob(padded);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
            }
            return bytes;
        } catch (e) {
            return null;
        }
    }

    function bytesToBase64(bytes) {
        try {
            // Convertir Uint8Array en chaîne binaire
            let binary = '';
            for (let i = 0; i < bytes.length; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            return btoa(binary);
        } catch (e) {
            return null;
        }
    }

    // Base32 (RFC 4648)
    const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    
    function base32ToBigInt(value) {
        try {
            let result = BigInt(0);
            for (const char of value.toUpperCase()) {
                const index = BASE32_ALPHABET.indexOf(char);
                if (index === -1) return null;
                result = (result << BigInt(5)) | BigInt(index);
            }
            return result;
        } catch (e) {
            return null;
        }
    }
    
    function bigIntToBase32(value) {
        try {
            if (value === BigInt(0)) return 'A';
            let result = '';
            let num = value;
            while (num > BigInt(0)) {
                const index = Number(num & BigInt(31));
                result = BASE32_ALPHABET[index] + result;
                num = num >> BigInt(5);
            }
            return result || 'A';
        } catch (e) {
            return null;
        }
    }
    
    // Base58 (Bitcoin alphabet)
    const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    
    function base58ToBigInt(value) {
        try {
            let result = BigInt(0);
            for (const char of value) {
                const index = BASE58_ALPHABET.indexOf(char);
                if (index === -1) return null;
                result = (result * BigInt(58)) + BigInt(index);
            }
            return result;
        } catch (e) {
            return null;
        }
    }
    
    function bigIntToBase58(value) {
        try {
            if (value === BigInt(0)) return '1';
            let result = '';
            let num = value;
            while (num > BigInt(0)) {
                const remainder = Number(num % BigInt(58));
                result = BASE58_ALPHABET[remainder] + result;
                num = num / BigInt(58);
            }
            return result || '1';
        } catch (e) {
            return null;
        }
    }

    function convert() {
        const rawValue = inputValue.value;
        const from = fromBase.value;
        const to = toBase.value;

        const cleanValue = validateInput(rawValue, from);
        if (!cleanValue) {
            outputValue.value = "Valeur invalide";
            updateAllResults(null);
            return;
        }

        const decimal = toDecimal(cleanValue, from);
        if (decimal === null) {
            outputValue.value = "Erreur de conversion";
            updateAllResults(null);
            return;
        }

        const result = fromDecimal(decimal, to);
        outputValue.value = result || "Erreur";
        updateAllResults(decimal);
    }

    function updateAllResults(decimal) {
        if (decimal === null) {
            allBin.textContent = '-';
            allOct.textContent = '-';
            allDec.textContent = '-';
            allHex.textContent = '-';
            allB32.textContent = '-';
            allB58.textContent = '-';
            allB64.textContent = '-';
            return;
        }

        allBin.textContent = fromDecimal(decimal, 'bin') || '-';
        allOct.textContent = fromDecimal(decimal, 'oct') || '-';
        allDec.textContent = fromDecimal(decimal, 'dec') || '-';
        allHex.textContent = fromDecimal(decimal, 'hex') || '-';
        allB32.textContent = fromDecimal(decimal, 'b32') || '-';
        allB58.textContent = fromDecimal(decimal, 'b58') || '-';
        allB64.textContent = fromDecimal(decimal, 'b64') || '-';
    }

    function clear() {
        inputValue.value = '';
        outputValue.value = '';
        updateAllResults(null);
    }

    async function copyResult() {
        if (!outputValue.value || outputValue.value === 'Valeur invalide' || outputValue.value === 'Erreur') return;
        try {
            await navigator.clipboard.writeText(outputValue.value);
            copyBtn.textContent = 'Copié!';
            setTimeout(() => copyBtn.textContent = 'Copier', 1500);
        } catch (e) {
            copyBtn.textContent = 'Erreur';
        }
    }

    function swap() {
        const temp = fromBase.value;
        fromBase.value = toBase.value;
        toBase.value = temp;
        updateHints();

        const inputTemp = inputValue.value;
        inputValue.value = outputValue.value !== 'Valeur invalide' && outputValue.value !== 'Erreur' ? outputValue.value : '';
        outputValue.value = inputTemp;
        convert();
    }

    async function copyAllResult(e) {
        const targetId = e.target.dataset.target;
        const el = container.querySelector('#' + targetId);
        if (!el || el.textContent === '-') return;
        try {
            await navigator.clipboard.writeText(el.textContent);
            e.target.textContent = '✓';
            setTimeout(() => e.target.textContent = '📋', 1500);
        } catch (e) {
            e.target.textContent = '✗';
        }
    }

    convertBtn.addEventListener('click', convert);
    clearBtn.addEventListener('click', clear);
    copyBtn.addEventListener('click', copyResult);
    swapBtn.addEventListener('click', swap);
    fromBase.addEventListener('change', updateHints);
    toBase.addEventListener('change', updateHints);
    inputValue.addEventListener('input', () => {
        if (inputValue.value) convert();
    });

    container.querySelectorAll('.btn-copy-small').forEach(btn => {
        btn.addEventListener('click', copyAllResult);
    });

    updateHints();
}
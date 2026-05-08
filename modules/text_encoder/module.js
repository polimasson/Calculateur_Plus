export async function init(container) {
    setupTextEncoder(container);
}

function setupTextEncoder(container) {
    const tabBtns = container.querySelectorAll(".tab-btn");
    const tabContents = container.querySelectorAll(".tab-content");
    const swapBtn = container.querySelector("#swapBtn");
    const clearBtn = container.querySelector("#clearBtn");
    const copyResultBtn = container.querySelector("#copyResultBtn");
    const historyList = container.querySelector("#historyList");
    const clearHistoryBtn = container.querySelector("#clearHistoryBtn");
    const errorMessage = container.querySelector("#errorMessage");

    let currentTab = "base64";
    let history = [];
    let isSwapped = false;
    
    // Punycode constants (RFC 3492)
    const PC_BASE = 36;
    const PC_TMIN = 1;
    const PC_TMAX = 26;
    const PC_SKEW = 38;
    const PC_DAMP = 700;
    const PC_INITIAL_BIAS = 72;
    const PC_INITIAL_N = 0x80;
    const PC_DELIMITER = '-';

    // Configuration des labels et placeholders par type
    const typeConfig = {
        base64: { encodedLabel: "Base64", encodePlaceholder: "Entrez le texte à encoder en Base64...", decodePlaceholder: "Entrez le Base64 à décoder..." },
        url: { encodedLabel: "URL Encoded", encodePlaceholder: "Entrez le texte à encoder en URL...", decodePlaceholder: "Entrez l'URL à décoder..." },
        html: { encodedLabel: "HTML Entities", encodePlaceholder: "Entrez le texte à convertir en entités HTML...", decodePlaceholder: "Entrez les entités HTML à décoder..." },
        hex: { encodedLabel: "Hexadécimal", encodePlaceholder: "Entrez le texte à convertir en hexadécimal...", decodePlaceholder: "Entrez l'hexadécimal à convertir en texte..." },
        binary: { encodedLabel: "Binaire", encodePlaceholder: "Entrez le texte à convertir en binaire...", decodePlaceholder: "Entrez le binaire à convertir en texte..." },
        unicode: { encodedLabel: "Unicode Escape", encodePlaceholder: "Entrez le texte à convertir en Unicode...", decodePlaceholder: "Entrez l'Unicode à convertir en texte..." },
        punycode: { encodedLabel: "Punycode", encodePlaceholder: "Entrez le domaine Unicode à encoder (ex: café.com)...", decodePlaceholder: "Entrez le Punycode à décoder (ex: xn--caf-dma.com)..." }
    };

    // Tab switching
    tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            tabBtns.forEach(b => b.classList.remove("active"));
            tabContents.forEach(c => c.classList.remove("active"));
            btn.classList.add("active");
            currentTab = btn.dataset.tab;
            container.querySelector(`#tab-${currentTab}`).classList.add("active");
            
            // Réinitialiser l'état du swap quand on change d'onglet
            isSwapped = false;
            
            // Restaurer les labels et placeholders par défaut
            const currentTabEl = container.querySelector(`#tab-${currentTab}`);
            const encodeSection = currentTabEl.querySelector(".encode-section");
            const decodeSection = currentTabEl.querySelector(".decode-section");
            const encodeLabel = encodeSection.querySelector("label");
            const decodeLabel = decodeSection.querySelector("label");
            const inputEl = container.querySelector(`#${currentTab}Input`);
            const outputEl = container.querySelector(`#${currentTab}Output`);
            
            const config = typeConfig[currentTab];
            encodeLabel.textContent = "Texte original";
            decodeLabel.textContent = config.encodedLabel;
            inputEl.placeholder = config.encodePlaceholder;
            outputEl.placeholder = `Résultat ${config.encodedLabel.toLowerCase()}...`;
            
            hideError();
        });
    });

    // Encode/Decode buttons
    container.querySelectorAll(".btn-encode, .btn-decode").forEach(btn => {
        btn.addEventListener("click", () => {
            const action = btn.dataset.action;
            const type = btn.dataset.type;
            processEncoding(type, action);
        });
    });

    // Swap button
    swapBtn.addEventListener("click", () => {
        const inputEl = container.querySelector(`#${currentTab}Input`);
        const outputEl = container.querySelector(`#${currentTab}Output`);
        const currentTabEl = container.querySelector(`#tab-${currentTab}`);
        const encodeSection = currentTabEl.querySelector(".encode-section");
        const decodeSection = currentTabEl.querySelector(".decode-section");
        const encodeLabel = encodeSection.querySelector("label");
        const decodeLabel = decodeSection.querySelector("label");
        
        const config = typeConfig[currentTab];
        
        // Échanger les valeurs
        const temp = inputEl.value;
        inputEl.value = outputEl.value;
        outputEl.value = temp;
        
        // Échanger les labels et placeholders
        if (!isSwapped) {
            // Mode: input = format encodé, output = texte
            encodeLabel.textContent = config.encodedLabel;
            decodeLabel.textContent = "Texte décodé";
            inputEl.placeholder = config.decodePlaceholder;
            outputEl.placeholder = "Résultat texte...";
        } else {
            // Mode: input = texte, output = format encodé
            encodeLabel.textContent = "Texte original";
            decodeLabel.textContent = config.encodedLabel;
            inputEl.placeholder = config.encodePlaceholder;
            outputEl.placeholder = `Résultat ${config.encodedLabel.toLowerCase()}...`;
        }
        
        isSwapped = !isSwapped;
    });

    // Clear button
    clearBtn.addEventListener("click", () => {
        const inputEl = container.querySelector(`#${currentTab}Input`);
        const outputEl = container.querySelector(`#${currentTab}Output`);
        inputEl.value = "";
        outputEl.value = "";
        hideError();
    });

    // Copy result button
    copyResultBtn.addEventListener("click", async () => {
        const outputEl = container.querySelector(`#${currentTab}Output`);
        if (outputEl.value) {
            await navigator.clipboard.writeText(outputEl.value);
            copyResultBtn.textContent = "✓ Copié !";
            setTimeout(() => copyResultBtn.textContent = "📋 Copier résultat", 1500);
        }
    });

    // Clear history
    clearHistoryBtn.addEventListener("click", () => {
        history = [];
        renderHistory();
    });

    function processEncoding(type, action) {
        const inputEl = container.querySelector(`#${type}Input`);
        const outputEl = container.querySelector(`#${type}Output`);
        const input = inputEl.value;

        if (!input) {
            showError("Veuillez entrer du texte à encoder/décoder");
            return;
        }

        try {
            let result;
            if (action === "encode") {
                result = encode(input, type);
                addToHistory(type, "encoder", input, result);
            } else {
                result = decode(input, type);
                addToHistory(type, "décoder", input, result);
            }
            outputEl.value = result;
            hideError();
        } catch (e) {
            showError(`Erreur lors de ${action === "encode" ? "l'encodage" : "du décodage"} : ${e.message}`);
        }
    }

    function encode(input, type) {
        switch (type) {
            case "base64":
                return btoa(unescape(encodeURIComponent(input)));
            case "url":
                return encodeURIComponent(input);
            case "html":
                return encodeHtml(input);
            case "hex":
                return encodeHex(input);
            case "binary":
                return encodeBinary(input);
            case "unicode":
                return encodeUnicode(input);
            case "punycode":
                return encodePunycode(input);
            default:
                throw new Error("Type non supporté");
        }
    }

    function decode(input, type) {
        switch (type) {
            case "base64":
                return decodeURIComponent(escape(atob(input)));
            case "url":
                return decodeURIComponent(input);
            case "html":
                return decodeHtml(input);
            case "hex":
                return decodeHex(input);
            case "binary":
                return decodeBinary(input);
            case "unicode":
                return decodeUnicode(input);
            case "punycode":
                return decodePunycode(input);
            default:
                throw new Error("Type non supporté");
        }
    }

    function encodeHtml(text) {
        const mode = container.querySelector('input[name="htmlMode"]:checked').value;
        return text.replace(/[<>&"']/g, char => {
            if (mode === "named") {
                const namedEntities = { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#x27;' };
                return namedEntities[char];
            } else if (mode === "numeric") {
                return `&#${char.charCodeAt(0)};`;
            } else {
                return `&#x${char.charCodeAt(0).toString(16).toUpperCase()};`;
            }
        });
    }

    function decodeHtml(text) {
        const textarea = document.createElement("textarea");
        textarea.innerHTML = text;
        return textarea.value;
    }

    // UTF-8 utility functions
    function stringToUtf8Bytes(text) {
        const encoder = new TextEncoder();
        return encoder.encode(text);
    }

    function utf8BytesToString(bytes) {
        const decoder = new TextDecoder('utf-8', { fatal: true });
        return decoder.decode(bytes);
    }

    function encodeHex(text) {
        const uppercase = container.querySelector("#hexUppercase").checked;
        const withSpaces = container.querySelector("#hexWithSpaces").checked;
        const withPrefix = container.querySelector("#hexWithPrefix").checked;
        
        // Convert to UTF-8 bytes
        const bytes = stringToUtf8Bytes(text);
        let hex = Array.from(bytes)
            .map(byte => byte.toString(16).padStart(2, "0"));
        
        if (uppercase) hex = hex.map(h => h.toUpperCase());
        if (withPrefix) hex = hex.map(h => "0x" + h);
        
        return hex.join(withSpaces ? " " : "");
    }

    function decodeHex(hex) {
        // Supprimer tous les caractères non hexadécimaux (sauf 0-9, a-f, A-F)
        hex = hex.replace(/[^0-9a-fA-F]/g, "");
        
        if (hex.length === 0) {
            throw new Error("Le hexadécimal est vide (aucun caractère hexadécimal trouvé)");
        }
        
        if (hex.length % 2 !== 0) hex = "0" + hex;
        
        // Convert hex to bytes
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
            const byte = parseInt(hex.substr(i, 2), 16);
            if (isNaN(byte)) {
                throw new Error(`Octet invalide à la position ${i}: ${hex.substr(i, 2)}`);
            }
            bytes[i / 2] = byte;
        }
        
        // Convert bytes to UTF-8 string
        return utf8BytesToString(bytes);
    }

    function encodeBinary(text) {
        const withSpaces = container.querySelector("#binaryWithSpaces").checked;
        const withPrefix = container.querySelector("#binaryWithPrefix").checked;
        
        // Convert to UTF-8 bytes
        const bytes = stringToUtf8Bytes(text);
        let binary = Array.from(bytes)
            .map(byte => byte.toString(2).padStart(8, "0"));
        
        if (withPrefix) binary = binary.map(b => "0b" + b);
        
        return binary.join(withSpaces ? " " : "");
    }

    function decodeBinary(binary) {
        // Supprimer tous les caractères non binaires (sauf 0 et 1)
        binary = binary.replace(/[^01]/g, "");
        
        if (binary.length === 0) {
            throw new Error("Le binaire est vide (aucun caractère 0 ou 1 trouvé)");
        }
        
        // Compléter avec des zéros en début si nécessaire pour avoir un multiple de 8
        const paddingNeeded = (8 - (binary.length % 8)) % 8;
        if (paddingNeeded > 0) {
            binary = "0".repeat(paddingNeeded) + binary;
        }
        
        // Convert binary to bytes
        const bytes = new Uint8Array(binary.length / 8);
        for (let i = 0; i < binary.length; i += 8) {
            const byte = parseInt(binary.substr(i, 8), 2);
            if (isNaN(byte)) {
                throw new Error(`Octet invalide à la position ${i}: ${binary.substr(i, 8)}`);
            }
            bytes[i / 8] = byte;
        }
        
        // Convert bytes to UTF-8 string
        return utf8BytesToString(bytes);
    }

    function encodeUnicode(text) {
        const mode = container.querySelector('input[name="unicodeMode"]:checked').value;
        
        return Array.from(text).map(char => {
            const code = char.codePointAt(0);
            const hex = code.toString(16).toUpperCase().padStart(4, "0");
            
            if (mode === "escape") return `\\u${hex}`;
            else if (mode === "braces") return `\\u{${hex}}`;
            else return `U+${hex}`;
        }).join("");
    }

    function decodeUnicode(text) {
        // Vérifier si le texte contient des séquences Unicode valides
        const hasEscape = /\\u[0-9a-fA-F]{4}/.test(text);
        const hasBraces = /\\u\{[0-9a-fA-F]+\}/.test(text);
        const hasUPlus = /U\+[0-9a-fA-F]+/i.test(text);
        
        if (!hasEscape && !hasBraces && !hasUPlus) {
            throw new Error("Aucune séquence Unicode trouvée (formats: \\uXXXX, \\u{XXXX} ou U+XXXX)");
        }
        
        // Handle \uXXXX, \u{XXXX}, and U+XXXX formats
        return text
            .replace(/\\u\{([0-9a-fA-F]+)\}/g, (_, hex) => {
                const code = parseInt(hex, 16);
                if (isNaN(code)) throw new Error(`Code Unicode invalide: ${hex}`);
                return String.fromCodePoint(code);
            })
            .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => {
                const code = parseInt(hex, 16);
                if (isNaN(code)) throw new Error(`Code Unicode invalide: ${hex}`);
                return String.fromCharCode(code);
            })
            .replace(/U\+([0-9a-fA-F]+)/gi, (_, hex) => {
                const code = parseInt(hex, 16);
                if (isNaN(code)) throw new Error(`Code Unicode invalide: ${hex}`);
                return String.fromCodePoint(code);
            });
    }

    // Punycode encoding/decoding functions
    function encodePunycode(domain) {
        // Encode each label separately
        return domain.split('.').map(label => {
            // Check if label contains non-ASCII characters
            if (/^[ -]*$/.test(label)) {
                // ASCII only, no encoding needed
                return label;
            }
            // Encode to punycode with xn-- prefix
            return 'xn--' + punycodeEncode(label);
        }).join('.');
    }

    function decodePunycode(domain) {
        // Decode each label separately
        return domain.split('.').map(label => {
            if (label.toLowerCase().startsWith('xn--')) {
                // Decode punycode
                return punycodeDecode(label.substring(4));
            }
            // Regular ASCII label
            return label;
        }).join('.');
    }

    // Punycode encoding algorithm (RFC 3492)
    function punycodeEncode(input) {
        const BASE = PC_BASE;
        const TMIN = PC_TMIN;
        const TMAX = PC_TMAX;
        const SKEW = PC_SKEW;
        const DAMP = PC_DAMP;
        const INITIAL_BIAS = PC_INITIAL_BIAS;
        const INITIAL_N = PC_INITIAL_N;
        const DELIMITER = PC_DELIMITER;

        // Get all non-ASCII code points and sort them
        const codePoints = Array.from(input).map(c => c.codePointAt(0));
        const basic = codePoints.filter(cp => cp < 0x80);
        const extended = [...new Set(codePoints.filter(cp => cp >= 0x80))].sort((a, b) => a - b);

        // Start with basic code points
        let output = basic.map(cp => String.fromCodePoint(cp)).join('');
        if (basic.length > 0 && extended.length > 0) {
            output += DELIMITER;
        }

        let n = INITIAL_N;
        let delta = 0;
        let bias = INITIAL_BIAS;

        for (const m of extended) {
            const delta1 = m - n;
            delta += delta1 * (basic.length + 1);
            n = m;

            for (const c of codePoints) {
                if (c < n) {
                    delta++;
                } else if (c === n) {
                    let q = delta;
                    let k = BASE;
                    while (true) {
                        const t = k <= bias ? TMIN : k >= bias + TMAX ? TMAX : k - bias;
                        if (q < t) break;
                        output += encodeDigit(t + ((q - t) % (BASE - t)));
                        q = Math.floor((q - t) / (BASE - t));
                        k += BASE;
                    }
                    output += encodeDigit(q);
                    bias = adapt(delta, basic.length + 1, basic.length === 0);
                    delta = 0;
                    basic.push(n);
                }
            }
            delta++;
        }

        return output;
    }

    function punycodeDecode(input) {
        const BASE = PC_BASE;
        const TMIN = PC_TMIN;
        const TMAX = PC_TMAX;
        const SKEW = PC_SKEW;
        const DAMP = PC_DAMP;
        const INITIAL_BIAS = PC_INITIAL_BIAS;
        const INITIAL_N = PC_INITIAL_N;
        const DELIMITER = PC_DELIMITER;

        // Find the last delimiter
        const delimIndex = input.lastIndexOf(DELIMITER);
        const basic = delimIndex >= 0 ? input.substring(0, delimIndex) : '';
        let i = basic.length;

        let n = INITIAL_N;
        let bias = INITIAL_BIAS;
        let output = basic;
        let index = 0;

        const extended = delimIndex >= 0 ? input.substring(delimIndex + 1) : input;

        for (const char of extended) {
            const digit = decodeDigit(char);
            if (digit === null) continue;

            let w = 1;
            let k = BASE;

            while (true) {
                const t = k <= bias ? TMIN : k >= bias + TMAX ? TMAX : k - bias;
                if (digit < t) break;
                index += (digit - t) * w;
                w *= BASE - t;
                k += BASE;
            }

            bias = adapt(index - i, output.length + 1, i === 0);
            n += Math.floor(index / (output.length + 1));
            index = index % (output.length + 1);
            output = output.substring(0, index) + String.fromCodePoint(n) + output.substring(index);
            index++;
            i++;
        }

        return output;
    }

    function encodeDigit(d) {
        return String.fromCodePoint(d + (d < 26 ? 97 : 22));
    }

    function decodeDigit(char) {
        const code = char.codePointAt(0);
        if (code >= 48 && code <= 57) return code - 22; // 0-9
        if (code >= 65 && code <= 90) return code - 65; // A-Z
        if (code >= 97 && code <= 122) return code - 97; // a-z
        return null;
    }

    function adapt(delta, numpoints, firsttime) {
        delta = firsttime ? Math.floor(delta / PC_DAMP) : delta >> 1;
        delta += Math.floor(delta / numpoints);
        let k = 0;
        while (delta > ((PC_BASE - PC_TMIN) * PC_TMAX) / 2) {
            delta = Math.floor(delta / (PC_BASE - PC_TMIN));
            k += PC_BASE;
        }
        return k + Math.floor(((PC_BASE - PC_TMIN + 1) * delta) / (delta + PC_SKEW));
    }

    function addToHistory(type, action, input, output) {
        const entry = {
            type,
            action,
            input: input.substring(0, 50) + (input.length > 50 ? "..." : ""),
            output: output.substring(0, 50) + (output.length > 50 ? "..." : ""),
            timestamp: new Date().toLocaleTimeString()
        };
        
        history.unshift(entry);
        if (history.length > 10) history.pop();
        renderHistory();
    }

    function renderHistory() {
        if (history.length === 0) {
            historyList.innerHTML = "<p class='history-empty'>Aucun historique</p>";
            return;
        }

        historyList.innerHTML = history.map((entry, index) => `
            <div class="history-item" data-index="${index}">
                <div class="history-meta">
                    <span class="history-type">${entry.type.toUpperCase()}</span>
                    <span class="history-action">${entry.action}</span>
                    <span class="history-time">${entry.timestamp}</span>
                </div>
                <div class="history-preview">
                    <span class="history-input">${escapeHtml(entry.input)}</span>
                    <span class="history-arrow">→</span>
                    <span class="history-output">${escapeHtml(entry.output)}</span>
                </div>
            </div>
        `).join("");

        // Click to restore
        container.querySelectorAll(".history-item").forEach(item => {
            item.addEventListener("click", () => {
                const index = parseInt(item.dataset.index);
                const entry = history[index];
                
                // Switch to the correct tab
                tabBtns.forEach(b => b.classList.remove("active"));
                tabContents.forEach(c => c.classList.remove("active"));
                container.querySelector(`[data-tab="${entry.type}"]`).classList.add("active");
                container.querySelector(`#tab-${entry.type}`).classList.add("active");
                currentTab = entry.type;
                
                // Note: We can't restore full input/output from truncated history
                // This would require storing full values
            });
        });
    }

    function escapeHtml(text) {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = "block";
    }

    function hideError() {
        errorMessage.style.display = "none";
    }

    // Initialize
    renderHistory();
}

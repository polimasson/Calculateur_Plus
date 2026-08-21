export async function init(container) {
    setupJsonTool(container);
}

function setupJsonTool(container) {
    const jsonInput = container.querySelector("#jsonInput");
    const jsonOutput = container.querySelector("#jsonOutput");
    const treeInput = container.querySelector("#treeInput");
    const treeView = container.querySelector("#treeView");
    const validationStatus = container.querySelector("#validationStatus");
    const outputStats = container.querySelector("#outputStats");
    const errorMessage = container.querySelector("#errorMessage");
    
    // Tab switching
    const tabBtns = container.querySelectorAll(".tab-btn");
    const tabContents = container.querySelectorAll(".tab-content");
    
    tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            tabBtns.forEach(b => b.classList.remove("active"));
            tabContents.forEach(c => c.classList.remove("active"));
            btn.classList.add("active");
            container.querySelector(`#tab-${btn.dataset.tab}`).classList.add("active");
        });
    });
    
    // Auto-validate on input
    jsonInput.addEventListener("input", () => {
        validateJson();
    });
    
    // Beautify
    container.querySelector("#btnBeautify").addEventListener("click", () => {
        try {
            const obj = JSON.parse(jsonInput.value);
            jsonOutput.value = JSON.stringify(obj, null, 2);
            updateStats(jsonOutput.value);
            hideError();
        } catch (e) {
            showError(`Erreur d'enjolivage : ${e.message}`);
        }
    });
    
    // Minify
    container.querySelector("#btnMinify").addEventListener("click", () => {
        try {
            const obj = JSON.parse(jsonInput.value);
            jsonOutput.value = JSON.stringify(obj);
            updateStats(jsonOutput.value);
            hideError();
        } catch (e) {
            showError(`Erreur de minification : ${e.message}`);
        }
    });
    
    // Validate
    container.querySelector("#btnValidate").addEventListener("click", () => {
        validateJson(true);
    });
    
    // Escape
    container.querySelector("#btnEscape").addEventListener("click", () => {
        try {
            const obj = JSON.parse(jsonInput.value);
            const str = JSON.stringify(obj);
            jsonOutput.value = str.replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
            updateStats(jsonOutput.value);
            hideError();
        } catch (e) {
            showError(`Erreur : ${e.message}`);
        }
    });
    
    // Unescape
    container.querySelector("#btnUnescape").addEventListener("click", () => {
        try {
            const input = jsonInput.value.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
            const obj = JSON.parse(input);
            jsonOutput.value = JSON.stringify(obj, null, 2);
            updateStats(jsonOutput.value);
            hideError();
        } catch (e) {
            showError(`Erreur : ${e.message}`);
        }
    });
    
    // Paste button
    container.querySelector("#pasteJson").addEventListener("click", async () => {
        try {
            const text = await navigator.clipboard.readText();
            jsonInput.value = text;
            validateJson();
        } catch (e) {
            showError("Impossible d'accéder au presse-papier");
        }
    });
    
    // Sample button
    container.querySelector("#loadSample").addEventListener("click", () => {
        const sample = {
            name: "Calculateur Plus",
            version: "1.0.0",
            modules: [
                { id: "standard_calculator", name: "Calculatrice Standard" },
                { id: "color_converter", name: "Convertisseur de Couleurs" }
            ],
            settings: {
                theme: "dark",
                language: "fr",
                precision: 10
            }
        };
        jsonInput.value = JSON.stringify(sample, null, 2);
        validateJson();
    });
    
    // Clear button
    container.querySelector("#clearInput").addEventListener("click", () => {
        jsonInput.value = "";
        jsonOutput.value = "";
        validationStatus.textContent = "";
        outputStats.textContent = "";
    });
    
    // Copy output
    container.querySelector("#copyOutput").addEventListener("click", async () => {
        if (jsonOutput.value) {
            await navigator.clipboard.writeText(jsonOutput.value);
            const btn = container.querySelector("#copyOutput");
            btn.textContent = "✓";
            setTimeout(() => btn.textContent = "📋", 1000);
        }
    });
    
    // Download
    container.querySelector("#downloadJson").addEventListener("click", () => {
        if (!jsonOutput.value) return;
        const blob = new Blob([jsonOutput.value], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "output.json";
        a.click();
        URL.revokeObjectURL(url);
    });
    
    // Convert to tree
    container.querySelector("#btnConvertTree").addEventListener("click", () => {
        try {
            const obj = JSON.parse(treeInput.value);
            treeView.innerHTML = renderTree(obj);
            hideError();
        } catch (e) {
            showError(`Erreur de parsing : ${e.message}`);
        }
    });
    
    function validateJson(showSuccess = false) {
        const value = jsonInput.value.trim();
        if (!value) {
            validationStatus.textContent = "";
            validationStatus.className = "validation-status";
            return false;
        }
        
        try {
            JSON.parse(value);
            validationStatus.textContent = "✓ JSON valide";
            validationStatus.className = "validation-status valid";
            if (showSuccess) {
                showError("JSON valide !", false);
                setTimeout(hideError, 2000);
            }
            return true;
        } catch (e) {
            validationStatus.textContent = `✗ ${e.message}`;
            validationStatus.className = "validation-status invalid";
            if (showSuccess) {
                showError(`JSON invalide : ${e.message}`);
            }
            return false;
        }
    }
    
    function updateStats(text) {
        const lines = text === "" ? 0 : text.split('\n').length;
        let chars;
        try {
            if (typeof Intl !== "undefined" && Intl.Segmenter) {
                const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
                chars = [...seg.segment(text)].length;
            } else {
                chars = Array.from(text).length;
            }
        } catch { chars = Array.from(text).length; }
        const bytes = new TextEncoder().encode(text).length;
        outputStats.textContent = `${lines} lignes | ${chars} caractères | ${bytes} octets`;
    }
    
    function renderTree(obj, key = null, isLast = true, prefix = "") {
        const type = getType(obj);
        const keyStr = key !== null ? `"${key}": ` : "";
        const comma = isLast ? "" : ",";
        
        if (type === "primitive") {
            const value = typeof obj === "string" ? `"${obj}"` : String(obj);
            const valueClass = typeof obj === "string" ? "string" : typeof obj === "number" ? "number" : "boolean";
            return `<div class="tree-line">${prefix}<span class="tree-key">${keyStr}</span><span class="tree-value ${valueClass}">${escapeHtml(value)}${comma}</span></div>`;
        }
        
        if (type === "array") {
            if (obj.length === 0) {
                return `<div class="tree-line">${prefix}<span class="tree-key">${keyStr}</span><span class="tree-bracket">[]</span>${comma}</div>`;
            }
            
            let html = `<div class="tree-node">`;
            html += `<div class="tree-line tree-toggle">${prefix}<span class="tree-key">${keyStr}</span><span class="tree-bracket">[</span><span class="tree-count">${obj.length}</span><span class="tree-bracket">]</span>${comma}</div>`;
            html += `<div class="tree-children">`;
            
            obj.forEach((item, index) => {
                html += renderTree(item, null, index === obj.length - 1, prefix + "  ");
            });
            
            html += `</div>`;
            html += `<div class="tree-line">${prefix}<span class="tree-bracket">]</span></div>`;
            html += `</div>`;
            return html;
        }
        
        if (type === "object") {
            const keys = Object.keys(obj);
            if (keys.length === 0) {
                return `<div class="tree-line">${prefix}<span class="tree-key">${keyStr}</span><span class="tree-bracket">{}</span>${comma}</div>`;
            }
            
            let html = `<div class="tree-node">`;
            html += `<div class="tree-line tree-toggle">${prefix}<span class="tree-key">${keyStr}</span><span class="tree-bracket">{</span><span class="tree-count">${keys.length}</span><span class="tree-bracket">}</span>${comma}</div>`;
            html += `<div class="tree-children">`;
            
            keys.forEach((k, index) => {
                html += renderTree(obj[k], k, index === keys.length - 1, prefix + "  ");
            });
            
            html += `</div>`;
            html += `<div class="tree-line">${prefix}<span class="tree-bracket">}</span></div>`;
            html += `</div>`;
            return html;
        }
        
        return "";
    }
    
    function getType(obj) {
        if (obj === null || typeof obj !== "object") return "primitive";
        if (Array.isArray(obj)) return "array";
        return "object";
    }
    
    function escapeHtml(text) {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }
    
    function showError(message, isError = true) {
        errorMessage.textContent = message;
        errorMessage.style.display = "block";
        errorMessage.className = isError ? "error-message error" : "error-message success";
    }
    
    function hideError() {
        errorMessage.style.display = "none";
    }
    
    // Tree toggle functionality
    treeView.addEventListener("click", (e) => {
        if (e.target.classList.contains("tree-toggle")) {
            const node = e.target.closest(".tree-node");
            node.classList.toggle("collapsed");
        }
    });
}

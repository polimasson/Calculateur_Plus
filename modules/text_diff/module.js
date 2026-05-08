/**
 * Comparateur de Texte (Diff)
 * Algorithme de diff simple et rapide
 */

export function init(container) {
    setupDiffModule(container);
}

function setupDiffModule(container) {
    const textOriginal = container.querySelector("#text-original");
    const textModified = container.querySelector("#text-modified");
    const ignoreCase = container.querySelector("#ignore-case");
    const ignoreWhitespace = container.querySelector("#ignore-whitespace");
    const ignorePunctuation = container.querySelector("#ignore-punctuation");
    const diffMode = container.querySelector("#diff-mode");
    const btnCompare = container.querySelector("#btn-compare");
    const btnClear = container.querySelector("#btn-clear");
    const resultSection = container.querySelector("#result-section");
    const diffOutput = container.querySelector("#diff-output");
    const statsAdded = container.querySelector("#stats-added");
    const statsRemoved = container.querySelector("#stats-removed");
    const statsUnchanged = container.querySelector("#stats-unchanged");
    const statsSimilarity = container.querySelector("#stats-similarity");
    const btnCopyResult = container.querySelector("#btn-copy-result");
    const btnExport = container.querySelector("#btn-export");
    const resultMessage = container.querySelector("#result-message");

    // Éléments de stats
    const origLines = container.querySelector("#orig-lines");
    const origWords = container.querySelector("#orig-words");
    const origChars = container.querySelector("#orig-chars");
    const origSpaces = container.querySelector("#orig-spaces");
    const modLines = container.querySelector("#mod-lines");
    const modWords = container.querySelector("#mod-words");
    const modChars = container.querySelector("#mod-chars");
    const modSpaces = container.querySelector("#mod-spaces");

    let lastDiffResult = null;

    function updateStats(textarea, linesEl, wordsEl, charsEl, spacesEl) {
        const text = textarea.value;
        const lines = text.length > 0 ? text.split('\n').length : 0;
        const chars = text.length;
        const spaces = text.replace(/\s/g, '').length;
        const words = text.trim().length > 0 ? text.trim().split(/\s+/).length : 0;

        linesEl.textContent = lines;
        wordsEl.textContent = words;
        charsEl.textContent = chars;
        spacesEl.textContent = spaces;
    }

    // Mise à jour en temps réel
    textOriginal.addEventListener('input', () => {
        updateStats(textOriginal, origLines, origWords, origChars, origSpaces);
    });

    textModified.addEventListener('input', () => {
        updateStats(textModified, modLines, modWords, modChars, modSpaces);
    });

    btnCompare.addEventListener("click", () => {
        compareTexts();
    });

    btnClear.addEventListener("click", () => {
        textOriginal.value = "";
        textModified.value = "";
        resultSection.classList.remove("show");
        resultMessage.textContent = "";
        // Reset stats
        updateStats(textOriginal, origLines, origWords, origChars, origSpaces);
        updateStats(textModified, modLines, modWords, modChars, modSpaces);
    });

    btnCopyResult.addEventListener("click", () => {
        if (lastDiffResult) {
            const plainText = lastDiffResult.map(item => {
                const marker = item.type === 'added' ? '+ ' : item.type === 'removed' ? '- ' : '  ';
                return marker + item.text;
            }).join('\n');
            navigator.clipboard.writeText(plainText);
            btnCopyResult.textContent = "✓ Copié!";
            setTimeout(() => btnCopyResult.textContent = "📋 Copier résultat", 2000);
        }
    });

    btnExport.addEventListener("click", () => {
        if (!lastDiffResult) return;
        
        let html = `<!DOCTYPE html>
<html>
<head><title>Diff Result</title>
<style>
body { font-family: monospace; line-height: 1.6; padding: 20px; }
.added { background: #d4edda; color: #155724; padding: 2px; }
.removed { background: #f8d7da; color: #721c24; padding: 2px; text-decoration: line-through; }
.unchanged { background: #f8f9fa; padding: 2px; }
</style>
</head>
<body>
<h2>Comparaison de texte</h2>
<pre>`;
        
        lastDiffResult.forEach(item => {
            const cssClass = item.type;
            const marker = item.type === 'added' ? '+' : item.type === 'removed' ? '-' : ' ';
            html += `<span class="${cssClass}">${marker} ${escapeHtml(item.text)}</span>\n`;
        });
        
        html += `</pre></body></html>`;
        
        const blob = new Blob([html], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `diff_${new Date().toISOString().slice(0,10)}.html`;
        a.click();
        URL.revokeObjectURL(url);
    });

    function compareTexts() {
        let original = textOriginal.value;
        let modified = textModified.value;

        if (!original && !modified) {
            resultMessage.textContent = "Veuillez entrer au moins un texte";
            return;
        }

        // Prétraitement selon options
        if (ignoreCase.checked) {
            original = original.toLowerCase();
            modified = modified.toLowerCase();
        }

        if (ignoreWhitespace.checked) {
            original = original.replace(/\s+/g, ' ').trim();
            modified = modified.replace(/\s+/g, ' ').trim();
        }

        if (ignorePunctuation.checked) {
            original = original.replace(/[^\w\s]/g, '');
            modified = modified.replace(/[^\w\s]/g, '');
        }

        // Tokenisation selon le mode
        const mode = diffMode.value;
        const originalTokens = tokenize(original, mode);
        const modifiedTokens = tokenize(modified, mode);

        // Algorithme de diff (LCS simplifié)
        const diff = computeDiff(originalTokens, modifiedTokens);

        // Affichage
        displayDiff(diff, mode);
        lastDiffResult = diff;
        resultSection.classList.add("show");
        resultMessage.textContent = "";
    }

    function tokenize(text, mode) {
        if (!text) return [];
        if (mode === 'line') {
            // Par lignes (garde les sauts de ligne)
            return text.split(/(\n)/).filter(t => t.length > 0);
        } else if (mode === 'word') {
            // Par mots (séparateurs: espaces, sauts de ligne)
            return text.split(/(\s+)/).filter(t => t.length > 0);
        } else {
            // Par caractères
            return text.split('');
        }
    }

    function computeDiff(original, modified) {
        const diff = [];
        let i = 0, j = 0;

        // Algorithme simple de diff
        while (i < original.length || j < modified.length) {
            if (i >= original.length) {
                // Reste de modified sont des ajouts
                while (j < modified.length) {
                    diff.push({ type: 'added', text: modified[j] });
                    j++;
                }
                break;
            }

            if (j >= modified.length) {
                // Reste de original sont des suppressions
                while (i < original.length) {
                    diff.push({ type: 'removed', text: original[i] });
                    i++;
                }
                break;
            }

            if (original[i] === modified[j]) {
                // Identique
                diff.push({ type: 'unchanged', text: original[i] });
                i++;
                j++;
            } else {
                // Chercher le prochain match dans modified
                let foundInModified = -1;
                for (let k = j + 1; k < Math.min(j + 10, modified.length); k++) {
                    if (modified[k] === original[i]) {
                        foundInModified = k;
                        break;
                    }
                }

                // Chercher le prochain match dans original
                let foundInOriginal = -1;
                for (let k = i + 1; k < Math.min(i + 10, original.length); k++) {
                    if (original[k] === modified[j]) {
                        foundInOriginal = k;
                        break;
                    }
                }

                if (foundInModified !== -1 && (foundInOriginal === -1 || foundInModified - j <= foundInOriginal - i)) {
                    // Les éléments entre j et foundInModified sont des ajouts
                    while (j < foundInModified) {
                        diff.push({ type: 'added', text: modified[j] });
                        j++;
                    }
                } else if (foundInOriginal !== -1) {
                    // Les éléments entre i et foundInOriginal sont des suppressions
                    while (i < foundInOriginal) {
                        diff.push({ type: 'removed', text: original[i] });
                        i++;
                    }
                } else {
                    // Remplacement simple
                    diff.push({ type: 'removed', text: original[i] });
                    diff.push({ type: 'added', text: modified[j] });
                    i++;
                    j++;
                }
            }
        }

        return diff;
    }

    function displayDiff(diff, mode) {
        const isLineMode = mode === 'line';
        // Calcul stats
        const added = diff.filter(d => d.type === 'added').length;
        const removed = diff.filter(d => d.type === 'removed').length;
        const unchanged = diff.filter(d => d.type === 'unchanged').length;
        const total = added + removed + unchanged;
        const similarity = total > 0 ? Math.round((unchanged / total) * 100) : 100;

        statsAdded.textContent = `${added} ajoutés`;
        statsRemoved.textContent = `${removed} supprimés`;
        statsUnchanged.textContent = `${unchanged} identiques`;
        statsSimilarity.textContent = `${similarity}% similitude`;

        // Construction HTML
        let html = '';
        let currentLine = '';
        let currentType = null;

        diff.forEach((item, index) => {
            const marker = item.type === 'added' ? '+' : item.type === 'removed' ? '-' : ' ';
            const cssClass = item.type;

            if (isLineMode) {
                // Mode ligne par ligne
                const lineNum = index + 1;
                const lineContent = escapeHtml(item.text);
                if (item.text === '\n') {
                    html += `<div class="diff-line ${cssClass}"><span class="line-num">${lineNum}</span><span class="diff-marker ${item.type === 'added' ? 'add' : item.type === 'removed' ? 'del' : 'eq'}">${marker}</span><span class="empty-line">(ligne vide)</span></div>`;
                } else {
                    html += `<div class="diff-line ${cssClass}"><span class="line-num">${lineNum}</span><span class="diff-marker ${item.type === 'added' ? 'add' : item.type === 'removed' ? 'del' : 'eq'}">${marker}</span>${lineContent}</div>`;
                }
            } else if (mode === 'word') {
                // Mode mot : afficher directement avec couleurs
                if (item.text.includes('\n')) {
                    // Saut de ligne
                    if (currentLine) {
                        html += `<div class="diff-line ${currentType || 'unchanged'}">${escapeHtml(currentLine)}</div>`;
                        currentLine = '';
                        currentType = null;
                    }
                    html += `<div class="diff-line unchanged">${marker} <span class="diff-marker ${item.type === 'added' ? 'add' : item.type === 'removed' ? 'del' : 'eq'}">${marker}</span>${escapeHtml(item.text)}</div>`;
                } else {
                    if (currentType === item.type || !currentType) {
                        currentLine += item.text;
                        currentType = item.type;
                    } else {
                        if (currentLine) {
                            html += `<div class="diff-line ${currentType}"><span class="diff-marker ${currentType === 'added' ? 'add' : currentType === 'removed' ? 'del' : 'eq'}">${currentType === 'added' ? '+' : currentType === 'removed' ? '-' : ' '}</span>${escapeHtml(currentLine)}</div>`;
                        }
                        currentLine = item.text;
                        currentType = item.type;
                    }
                }
            } else {
                // Mode caractère : ligne par ligne
                html += `<span class="diff-${item.type}">${escapeHtml(item.text)}</span>`;
            }
        });

        if (mode === 'word' && currentLine) {
            html += `<div class="diff-line ${currentType}"><span class="diff-marker ${currentType === 'added' ? 'add' : currentType === 'removed' ? 'del' : 'eq'}">${currentType === 'added' ? '+' : currentType === 'removed' ? '-' : ' '}</span>${escapeHtml(currentLine)}</div>`;
        }

        diffOutput.innerHTML = html || '<em>Aucune différence détectée</em>';
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

export async function init(container) {
    setupConverter(container);
}

function setupConverter(container) {
    const colorPreview = container.querySelector("#colorPreview");
    const hexInput = container.querySelector("#hexInput");
    const hexPicker = container.querySelector("#hexPicker");
    const rSlider = container.querySelector("#rSlider");
    const gSlider = container.querySelector("#gSlider");
    const bSlider = container.querySelector("#bSlider");
    const hSlider = container.querySelector("#hSlider");
    const sSlider = container.querySelector("#sSlider");
    const lSlider = container.querySelector("#lSlider");
    const rgbInput = container.querySelector("#rgbInput");
    const hslInput = container.querySelector("#hslInput");
    const alphaSlider = container.querySelector("#alphaSlider");
    const alphaValue = container.querySelector("#alphaValue");
    const resultHex = container.querySelector("#resultHex");
    const resultHexAlpha = container.querySelector("#resultHexAlpha");
    const resultRgb = container.querySelector("#resultRgb");
    const resultRgba = container.querySelector("#resultRgba");
    const resultHsl = container.querySelector("#resultHsl");
    const resultHsla = container.querySelector("#resultHsla");
    const colorHistory = container.querySelector("#colorHistory");
    const clearHistoryBtn = container.querySelector("#clearColorHistory");
    const addToHistoryBtn = container.querySelector("#addToHistoryBtn");
    const tabBtns = container.querySelectorAll(".tab-btn");
    const tabContents = container.querySelectorAll(".tab-content");

    let currentColor = { r: 255, g: 87, b: 51, a: 1, hex: "#FF5733" };
    let history = [];

    function hexToRgb(hex) {
        const clean = hex.replace("#", "");
        // Support HEX 8 (RGBA) ou HEX 6 (RGB)
        if (clean.length === 8) {
            const bigint = parseInt(clean, 16);
            return {
                r: (bigint >> 24) & 255,
                g: (bigint >> 16) & 255,
                b: (bigint >> 8) & 255,
                a: (bigint & 255) / 255
            };
        } else {
            const bigint = parseInt(clean, 16);
            return {
                r: (bigint >> 16) & 255,
                g: (bigint >> 8) & 255,
                b: bigint & 255,
                a: 1
            };
        }
    }

    function rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
    }

    function rgbToHexAlpha(r, g, b, a) {
        const alpha = Math.round(a * 255);
        return "#" + ((1 << 32) + (r << 24) + (g << 16) + (b << 8) + alpha).toString(16).slice(1).toUpperCase();
    }

    function rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }
        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100)
        };
    }

    function hslToRgb(h, s, l) {
        h /= 360; s /= 100; l /= 100;
        let r, g, b;
        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    }

    function updateDisplay(fromRgb = true) {
        const { r, g, b, a } = currentColor;
        const hex = rgbToHex(r, g, b);
        const hexAlpha = rgbToHexAlpha(r, g, b, a);
        const hsl = rgbToHsl(r, g, b);
        currentColor.hex = hex;

        // Appliquer la couleur avec transparence
        colorPreview.style.backgroundColor = `rgba(${r}, ${g}, ${b}, ${a})`;
        
        // Mettre à jour les résultats
        resultHex.textContent = hex;
        resultHexAlpha.textContent = hexAlpha;
        resultRgb.textContent = `rgb(${r}, ${g}, ${b})`;
        resultRgba.textContent = `rgba(${r}, ${g}, ${b}, ${a})`;
        resultHsl.textContent = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
        resultHsla.textContent = `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${a})`;

        if (fromRgb) {
            hexInput.value = a < 1 ? hexAlpha.replace("#", "") : hex.replace("#", "");
            hexPicker.value = hex;
            rSlider.value = r; container.querySelector("#rValue").textContent = r;
            gSlider.value = g; container.querySelector("#gValue").textContent = g;
            bSlider.value = b; container.querySelector("#bValue").textContent = b;
            hSlider.value = hsl.h; container.querySelector("#hValue").textContent = hsl.h;
            sSlider.value = hsl.s; container.querySelector("#sValue").textContent = hsl.s;
            lSlider.value = hsl.l; container.querySelector("#lValue").textContent = hsl.l;
            alphaSlider.value = Math.round(a * 100);
            alphaValue.textContent = Math.round(a * 100);
        }
    }

    function setColorFromHex(hex) {
        const rgb = hexToRgb(hex);
        if (!isNaN(rgb.r)) {
            currentColor = { ...rgb, hex: rgb.a < 1 ? rgbToHexAlpha(rgb.r, rgb.g, rgb.b, rgb.a) : rgbToHex(rgb.r, rgb.g, rgb.b) };
            updateDisplay(true);
        }
    }

    function setColorFromRgb(r, g, b, a = currentColor.a) {
        currentColor = { r, g, b, a, hex: rgbToHex(r, g, b) };
        updateDisplay(true);
    }

    function setColorFromHsl(h, s, l, a = currentColor.a) {
        const rgb = hslToRgb(h, s, l);
        currentColor = { ...rgb, a, hex: rgbToHex(rgb.r, rgb.g, rgb.b) };
        updateDisplay(false);
    }

    function setAlpha(a) {
        currentColor.a = a;
        updateDisplay(false);
    }

    function addToHistory() {
        const colorData = {
            hex: currentColor.hex,
            hexAlpha: rgbToHexAlpha(currentColor.r, currentColor.g, currentColor.b, currentColor.a),
            rgba: `rgba(${currentColor.r}, ${currentColor.g}, ${currentColor.b}, ${currentColor.a})`
        };
        
        // Vérifier si cette couleur existe déjà (même HEX avec alpha)
        const exists = history.some(h => h.hexAlpha === colorData.hexAlpha);
        if (exists) return;
        
        history.unshift(colorData);
        // Plus de limite - l'historique peut contenir autant de couleurs que voulu
        renderHistory();
    }

    function renderHistory() {
        colorHistory.innerHTML = history.map((colorData, index) => `
            <div class="color-swatch" data-index="${index}" style="background: ${colorData.rgba}" title="${colorData.hexAlpha}"></div>
        `).join("");

        container.querySelectorAll(".color-swatch").forEach(swatch => {
            swatch.addEventListener("click", () => {
                const index = parseInt(swatch.dataset.index);
                const colorData = history[index];
                // Extraire les valeurs RGBA
                const rgbaMatch = colorData.rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),?\s*([\d.]*)\)/);
                if (rgbaMatch) {
                    const r = parseInt(rgbaMatch[1]);
                    const g = parseInt(rgbaMatch[2]);
                    const b = parseInt(rgbaMatch[3]);
                    const a = rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1;
                    currentColor = { r, g, b, a, hex: rgbToHex(r, g, b) };
                    updateDisplay(true);
                }
            });
        });
    }

    // Tab switching
    tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            tabBtns.forEach(b => b.classList.remove("active"));
            tabContents.forEach(c => c.classList.remove("active"));
            btn.classList.add("active");
            container.querySelector(`#tab-${btn.dataset.tab}`).classList.add("active");
        });
    });

    // Event listeners
    hexInput.addEventListener("input", (e) => {
        let val = e.target.value.replace(/[^0-9A-Fa-f]/g, "");
        if (val.length === 6 || val.length === 8) setColorFromHex("#" + val);
    });

    hexPicker.addEventListener("input", (e) => {
        setColorFromHex(e.target.value);
    });

    [rSlider, gSlider, bSlider].forEach(slider => {
        slider.addEventListener("input", () => {
            setColorFromRgb(parseInt(rSlider.value), parseInt(gSlider.value), parseInt(bSlider.value));
        });
    });

    [hSlider, sSlider, lSlider].forEach(slider => {
        slider.addEventListener("input", () => {
            setColorFromHsl(parseInt(hSlider.value), parseInt(sSlider.value), parseInt(lSlider.value));
        });
    });

    // Slider de transparence
    alphaSlider.addEventListener("input", () => {
        const alpha = parseInt(alphaSlider.value) / 100;
        setAlpha(alpha);
    });

    // Bouton ajouter à l'historique
    addToHistoryBtn.addEventListener("click", () => {
        addToHistory();
    });

    // Inputs texte RGB/RGBA et HSL/HSLA
    rgbInput.addEventListener("input", (e) => {
        const rgbaMatch = e.target.value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),?\s*([\d.]*)\)/);
        if (rgbaMatch) {
            const r = parseInt(rgbaMatch[1]);
            const g = parseInt(rgbaMatch[2]);
            const b = parseInt(rgbaMatch[3]);
            const a = rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1;
            setColorFromRgb(r, g, b, a);
        }
    });

    hslInput.addEventListener("input", (e) => {
        const hslaMatch = e.target.value.match(/hsla?\((\d+),\s*(\d+)%,\s*(\d+)%,?\s*([\d.]*)\)/);
        if (hslaMatch) {
            const h = parseInt(hslaMatch[1]);
            const s = parseInt(hslaMatch[2]);
            const l = parseInt(hslaMatch[3]);
            const a = hslaMatch[4] ? parseFloat(hslaMatch[4]) : 1;
            setColorFromHsl(h, s, l, a);
        }
    });

    container.querySelectorAll(".btn-copy").forEach(btn => {
        btn.addEventListener("click", async () => {
            const target = container.querySelector(`#${btn.dataset.target}`);
            try {
                await navigator.clipboard.writeText(target.textContent);
                btn.textContent = "✓";
                setTimeout(() => btn.textContent = "📋", 1000);
            } catch (e) {}
        });
    });

    clearHistoryBtn.addEventListener("click", () => {
        history = [];
        colorHistory.innerHTML = "";
    });

    updateDisplay();
}

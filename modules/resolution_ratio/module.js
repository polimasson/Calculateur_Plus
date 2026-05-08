export function init(container) {
    const lockSwitch = container.querySelector('#lock-ratio');
    const ratioConfig = container.querySelector('#ratio-config');
    const preset = container.querySelector('#ratio-preset');
    const rWPart = container.querySelector('#ratio-w-part');
    const rHPart = container.querySelector('#ratio-h-part');
    const widthIn = container.querySelector('#res-width');
    const heightIn = container.querySelector('#res-height');
    const decOut = container.querySelector('#ratio-decimal');
    const fracOut = container.querySelector('#ratio-fraction');
    const preview = container.querySelector('#ratio-preview');

    function getGCD(a, b) {
        a = Math.abs(a); b = Math.abs(b);
        return b === 0 ? a : getGCD(b, a % b);
    }

    function syncUI() {
        const w = parseFloat(widthIn.value) || 0;
        const h = parseFloat(heightIn.value) || 0;

        if (w > 0 && h > 0) {
            // Mise à jour des textes
            decOut.innerText = (w / h).toFixed(2);
            const common = getGCD(w, h);
            fracOut.innerText = `${w/common}:${h/common}`;
            
            // Calcul de l'aperçu (le secret est de garder le ratio dans le parent)
            let pW, pH;
            if (w >= h) {
                pW = 100;
                pH = (h / w) * 100;
            } else {
                pH = 100;
                pW = (w / h) * 100;
            }
            preview.style.width = pW + '%';
            preview.style.height = pH + '%';
            preview.innerText = `${w} x ${h}`;
        }
    }

    function updateHeight() {
        if (lockSwitch.checked) {
            const w = parseFloat(widthIn.value) || 0;
            const rw = parseFloat(rWPart.value) || 1;
            const rh = parseFloat(rHPart.value) || 1;
            if (w > 0) heightIn.value = Math.round((w * rh) / rw);
        }
        syncUI();
    }

    function updateWidth() {
        if (lockSwitch.checked) {
            const h = parseFloat(heightIn.value) || 0;
            const rw = parseFloat(rWPart.value) || 1;
            const rh = parseFloat(rHPart.value) || 1;
            if (h > 0) widthIn.value = Math.round((h * rw) / rh);
        }
        syncUI();
    }

    // Événements
    widthIn.addEventListener('input', updateHeight);
    heightIn.addEventListener('input', updateWidth);
    rWPart.addEventListener('input', updateHeight);
    rHPart.addEventListener('input', updateHeight);

    preset.addEventListener('change', () => {
        const customInputs = container.querySelector('#custom-ratio-inputs');
        if (preset.value === "custom") {
            customInputs.classList.remove('hidden');
        } else {
            customInputs.classList.add('hidden');
            const [w, h] = preset.value.split('/');
            rWPart.value = w; 
            rHPart.value = h;
            updateHeight();
        }
    });

    lockSwitch.addEventListener('change', () => {
        ratioConfig.classList.toggle('disabled-area', !lockSwitch.checked);
        if (lockSwitch.checked) updateHeight();
    });

    // Lancement initial
    syncUI();
}
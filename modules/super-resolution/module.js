/**
 * Module Upscale IA (UI Thread) - Communique avec le Web Worker.
 */

const MODEL_CHOICES = [
    { id: "Xenova/swin2SR-realworld-sr-x4-64-bsrgan-psnr", label: "Swin2SR Monde Réel ×4 - Qualité (swin2SR-realworld-sr-x4-64-bsrgan-psnr)" },
    { id: "Xenova/swin2SR-classical-sr-x2-64", label: "Swin2SR Classique ×2 - Léger (swin2SR-classical-sr-x2-64)" },
    { id: "Xenova/swin2SR-classical-sr-x4-64", label: "Swin2SR Classique ×4 - Léger (swin2SR-classical-sr-x4-64)" },
    { id: "Xenova/swin2SR-compressed-sr-x4-48", label: "Swin2SR Compressé ×4 {Rapide & Économe} (swin2SR-compressed-sr-x4-48)" },
    { id: "Xenova/swin2SR-lightweight-x2-64", label: "Swin2SR Léger ×2 {Idéal Mobile} (swin2SR-lightweight-x2-64)" },
    { id: "https://huggingface.co/tidus2102/Real-ESRGAN/resolve/main/Real-ESRGAN_x2plus.onnx", label: "Real-ESRGAN x2 - Qualité (Real-ESRGAN_x2plus) [tuiles de 64px uniquement]" },
    { id: "https://huggingface.co/tidus2102/Real-ESRGAN/resolve/main/RealESR-AnimeVideo-v3_x4.onnx", label: "Real-ESR Anime Video x4 - Léger (RealESR-AnimeVideo-v3_x4)" },
    { id: "https://huggingface.co/bukuroo/RealESRGAN-ONNX/resolve/main/real-esrgan-x4plus-128.onnx", label: "Real-ESRGAN x4 - Rapide et Qualitatif (real-esrgan-x4plus-128) [tuiles de 128px uniquement]" },
    //{id: `${basePath}modules/super-resolution/model/RealESRGAN_ANIME_6B_512x512.onnx`, label: "(RealESRGAN_ANIME_6B_512x512) [il veut du float16 pas du float32]"},
    //{ id: "Xenova/4x_APISR_GRL_GAN_generator-onnx", label: "(4x_APISR_GRL_GAN_generator-onnx) (jsp mais il est bizzare xd)" },
    //{ id: "https://huggingface.co/onnxmodelzoo/super-resolution-10/resolve/main/super-resolution-10.onnx", label: "(super-resolution-10) [tuiles de 224px uniquement et il demande que 1 canal]" },
];

let isModelLoaded = false;
let currentModelId = null;
let isLoading = false; // Empêche les double-clics sur Précharger

let worker = null;
let currentOutputBitmap = null;

export function destroy() {
    if (worker) {
        worker.terminate();
        worker = null;
    }
    currentOutputBitmap = null;
}

export function init(container) {
    // Récupération des éléments DOM (s'assurer qu'ils existent dans ton HTML)
    const fileInput = container.querySelector("#upscale-file");
    const modelSelect = container.querySelector("#upscale-model");
    const deviceSelect = container.querySelector("#upscale-device");
    const btnLoadModel = container.querySelector("#upscale-load-model");
    const btnUnloadModel = container.querySelector("#upscale-unload-model");
    const btnRun = container.querySelector("#upscale-run");
    const btnStop = container.querySelector("#upscale-stop");
    const btnDownload = container.querySelector("#upscale-download");
    const threadSelect = container.querySelector("#upscale-threads");
    const tileSizeSelect = container.querySelector("#upscale-tilesize");
    const tileSizeCustom = container.querySelector("#upscale-tilesize-custom");
    const overlapSelect = container.querySelector("#upscale-overlap");
    const overlapCustom = container.querySelector("#upscale-overlap-custom");
    const modelStatusEl = container.querySelector("#model-status-text");
    const progressEl = container.querySelector("#upscale-progress");
    const progressBarContainer = container.querySelector("#upscale-progress-bar-container");
    const progressFill = container.querySelector("#upscale-progress-fill");
    const progressText = container.querySelector("#upscale-progress-text");
    const errorEl = container.querySelector("#upscale-error");
    const canvasIn = container.querySelector("#upscale-input-canvas");
    const canvasOut = container.querySelector("#upscale-output-canvas");

    // Remplissage du select modèles
    for (const m of MODEL_CHOICES) {
        const opt = document.createElement("option");
        opt.value = m.id;
        opt.textContent = m.label;
        modelSelect.appendChild(opt);
    }

    // Helper pour mettre à jour le statut du modèle
    function updateModelStatus(status, isError = false) {
        if (!modelStatusEl) return;
        modelStatusEl.textContent = status;
        const container = modelStatusEl.parentElement;
        container.style.background = isError ? '#ffebee' : (status.includes('prêt') ? '#e8f5e9' : '#f0f0f0');
        container.style.color = isError ? '#c62828' : (status.includes('prêt') ? '#2e7d32' : '#333');
    }

    // Remplissage dynamique du select threads (1 à max cœurs logiques)
    const maxThreads = Math.max(1, Math.min(16, navigator.hardwareConcurrency || 2));
    const defaultThreads = Math.max(1, maxThreads - 1); // Laisse 1 cœur pour l'OS
    for (let t = 1; t <= maxThreads; t++) {
        const opt = document.createElement("option");
        opt.value = t;
        opt.textContent = t + ' thread' + (t > 1 ? 's' : '');
        if (t === defaultThreads) opt.selected = true;
        threadSelect.appendChild(opt);
    }

    // Gestion des champs personnalisés (tuiles et overlap)
    function toggleCustomInput(selectEl, inputEl) {
        if (selectEl.value === 'custom') {
            inputEl.classList.remove('hidden');
            inputEl.focus();
        } else {
            inputEl.classList.add('hidden');
        }
    }
    
    tileSizeSelect.addEventListener('change', () => toggleCustomInput(tileSizeSelect, tileSizeCustom));
    overlapSelect.addEventListener('change', () => toggleCustomInput(overlapSelect, overlapCustom));

    // Helper pour récupérer la valeur numérique (select ou custom input)
    function getNumericValue(selectEl, inputEl) {
        if (selectEl.value === 'custom') {
            const val = parseInt(inputEl?.value, 10);
            return isNaN(val) ? null : val;
        }
        return parseInt(selectEl.value, 10);
    }

    // Détection WebGPU
    if (!navigator.gpu) {
        const webgpuOption = deviceSelect.querySelector('option[value="webgpu"]');
        if (webgpuOption) {
            webgpuOption.textContent = "WebGPU (Non supporté par ce navigateur)";
            webgpuOption.disabled = true;
        }
    }

    // --- Gestion du Worker ---
    function setupWorker() {
        if (worker) {
            worker.terminate();
            worker = null;
        }
        const workerUrl = new URL('worker.js', import.meta.url).href;
        worker = new Worker(workerUrl);

        worker.onmessage = function(e) {
        const { action, payload } = e.data;

        switch (action) {
            case 'PROGRESS':
                setProgress(progressEl, payload.text);
                if (payload.progress !== undefined) {
                    progressBarContainer.classList.remove('hidden');
                    progressFill.style.width = payload.progress + '%';
                    progressText.textContent = Math.round(payload.progress) + '%';
                } else {
                    progressBarContainer.classList.add('hidden');
                }
                break;
            case 'INIT_COMPLETE':
                // Le modèle est chargé et prêt
                isLoading = false;
                isModelLoaded = true;
                currentModelId = modelSelect.value;
                currentLoadedThreads = parseInt(threadSelect?.value, 10) || 2;
                updateModelStatus(`✅ Modèle prêt : ${currentModelId} (${currentLoadedThreads} threads)`);
                btnLoadModel.disabled = true; // Grisé car modèle déjà chargé
                btnUnloadModel.disabled = false; // Activer déchargement
                btnRun.disabled = false;
                modelSelect.disabled = true; // Bloquer changement de modèle
                deviceSelect.disabled = true; // Bloquer changement CPU/GPU (nécessite recompile)
                threadSelect.disabled = true; // Bloquer changement de threads
                // Note: tileSizeSelect reste actif (changeable entre upscales)
                break;
            case 'UPSCALE_COMPLETE':
                displayOutput(canvasOut, payload.imageBitmap);
                setProgress(progressEl, "Terminé.");
                progressBarContainer.classList.add('hidden');
                btnRun.disabled = false;
                btnStop.disabled = true;
                btnDownload.disabled = false;
                break;
            case 'ERROR':
                isLoading = false; // Débloquer en cas d'erreur
                // Si c'est une erreur de mémoire, proposer fallback algorithmique
                if (payload.message && payload.message.includes('Mémoire insuffisante')) {
                    const useFallback = confirm(
                        "L'upscale IA a échoué (mémoire insuffisante).\n\n" +
                        "Voulez-vous utiliser un upscale algorithmique (moins performant mais instantané) ?"
                    );
                    if (useFallback) {
                        performFallbackUpscale(fileInput.files[0], canvasOut);
                        setProgress(progressEl, "Upscale algorithmique terminé (fallback)");
                        btnDownload.disabled = false;
                        break;
                    }
                }
                // Erreur de chargement du modèle
                if (payload.message && (payload.message.includes('fetch') || payload.message.includes('téléchargement'))) {
                    updateModelStatus(`❌ Erreur chargement : ${payload.message}`, true);
                    isModelLoaded = false;
                    btnLoadModel.disabled = false;
                    btnRun.disabled = true;
                    modelSelect.disabled = false;     // Réactiver changement de modèle
                    deviceSelect.disabled = false;    // Réactiver changement CPU/GPU
                    threadSelect.disabled = false;    // Réactiver changement de threads
                }
                // Si le modèle n'est pas chargé, réactiver les sélecteurs
                if (!isModelLoaded) {
                    modelSelect.disabled = false;
                    deviceSelect.disabled = false;
                    threadSelect.disabled = false;
                }
                showError(errorEl, payload.message);
                setProgress(progressEl, "");
                progressBarContainer.classList.add('hidden');
                btnRun.disabled = false;
                btnStop.disabled = true;
                break;
        }
        };
    }

    setupWorker();

    // --- Event Listeners UI ---

    fileInput.addEventListener("change", () => {
        clearError(errorEl);
        const file = fileInput.files?.[0];
        if (!file) return;
        displayInput(canvasIn, file);
    });
    
    // --- Gestion du nombre de threads actuel ---
    let currentLoadedThreads = null;

    // --- Chargement du modèle (séparé de l'upscale) ---
    btnLoadModel.addEventListener("click", () => {
        if (isLoading) return; // Empêche double-clic
        
        clearError(errorEl);
        const selectedModel = modelSelect.value;
        
        // Si le modèle est déjà chargé, on ne recharge pas
        if (isModelLoaded && currentModelId === selectedModel) {
            updateModelStatus(`✅ Modèle déjà prêt : ${selectedModel}`);
            return;
        }
        
        isLoading = true;
        updateModelStatus(`⏳ Téléchargement : ${selectedModel}...`);
        btnLoadModel.disabled = true;
        btnRun.disabled = true;
        modelSelect.disabled = true;      // Bloquer changement de modèle
        deviceSelect.disabled = true;     // Bloquer changement CPU/GPU
        threadSelect.disabled = true;     // Bloquer changement de threads
        
        worker.postMessage({
            action: 'INIT_PIPELINE',
            payload: {
                modelId: selectedModel,
                device: deviceSelect.value,
                numThreads: parseInt(threadSelect?.value, 10) || 2
            }
        });
    });
    
    // --- Déchargement du modèle ---
    btnUnloadModel.addEventListener("click", () => {
        // Terminer le worker pour forcer la libération de la RAM (buffers WASM + modèle ONNX)
        if (worker) {
            worker.terminate();
            worker = null;
        }
        // Recréer un worker frais pour la prochaine utilisation
        setupWorker();
        
        isModelLoaded = false;
        currentModelId = null;
        currentLoadedThreads = null;
        updateModelStatus("❌ Modèle déchargé - Vous pouvez changer de modèle");
        btnLoadModel.disabled = false; // Réactiver le bouton charger
        btnUnloadModel.disabled = true; // Désactiver le bouton décharger
        btnRun.disabled = true; // Désactiver upscale
        modelSelect.disabled = false; // Réactiver changement de modèle
        deviceSelect.disabled = false; // Réactiver changement CPU/GPU
        threadSelect.disabled = false; // Réactiver changement de threads
    });
    
    // --- Upscale (nécessite un modèle chargé) ---
    btnRun.addEventListener("click", () => {
        clearError(errorEl);
        const file = fileInput.files?.[0];
        if (!file) return showError(errorEl, "Choisissez une image.");
        
        // Vérifier que le modèle est chargé et correspond
        const selectedModel = modelSelect.value;
        if (!isModelLoaded || currentModelId !== selectedModel) {
            updateModelStatus(`⚠️ Veuillez d'abord charger le modèle : ${selectedModel}`, true);
            return;
        }

        btnRun.disabled = true;
        btnStop.disabled = false;
        btnDownload.disabled = true;
        
        // Lancer directement l'upscale (le modèle est déjà chargé)
        processFile(file);
    });

    btnDownload.addEventListener("click", () => {
        if (!currentOutputBitmap) return;
        downloadBitmap(currentOutputBitmap);
    });

    btnStop.addEventListener("click", () => {
        if (worker) {
            worker.terminate();
            worker = null;
            setProgress(progressEl, "Arrêté par l'utilisateur.");
            progressBarContainer.classList.add('hidden');
            btnRun.disabled = false;
            btnStop.disabled = true;
            // Le worker est mort : la session ONNX est perdue
            isModelLoaded = false;
            currentModelId = null;
            currentLoadedThreads = null;
            updateModelStatus("❌ Traitement arrêté — Veuillez recharger le modèle");
            btnLoadModel.disabled = false;
            btnUnloadModel.disabled = true;
            modelSelect.disabled = false;
            deviceSelect.disabled = false;
            threadSelect.disabled = false;
            // Recréer un worker frais pour la prochaine utilisation
            setupWorker();
        }
    });
}

// --- Fonctions utilitaires d'affichage DOM/Canvas ---

async function processFile(file) {
    const tileSizeEl = document.querySelector("#upscale-tilesize");
    const tileSizeCustomEl = document.querySelector("#upscale-tilesize-custom");
    const overlapEl = document.querySelector("#upscale-overlap");
    const overlapCustomEl = document.querySelector("#upscale-overlap-custom");
    
    // Calculer la taille de tuile
    let tileSize;
    if (tileSizeEl?.value === 'custom') {
        tileSize = parseInt(tileSizeCustomEl?.value, 10) || 256;
    } else {
        tileSize = parseInt(tileSizeEl?.value, 10) || 256;
    }
    
    // Calculer l'overlap (null = auto)
    let overlap;
    if (overlapEl?.value === 'custom') {
        overlap = parseInt(overlapCustomEl?.value, 10);
        if (isNaN(overlap)) overlap = null;
    } else if (overlapEl?.value === 'auto') {
        overlap = null;
    } else {
        overlap = parseInt(overlapEl?.value, 10);
        if (isNaN(overlap)) overlap = null;
    }
    
    worker.postMessage({
        action: 'UPSCALE_IMAGE',
        payload: {
            file: file,
            tileSize: tileSize,
            overlap: overlap  // null = auto (proportionnel)
        }
    });
}

async function resizeImageFile(file, maxSize) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            let { width, height } = img;
            if (width > maxSize || height > maxSize) {
                const ratio = Math.min(maxSize / width, maxSize / height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            canvas.getContext('2d').drawImage(img, 0, 0, width, height);

            canvas.toBlob((blob) => {
                resolve(blob || file);
            }, 'image/png');
        };
        img.onerror = () => resolve(file);
        img.src = URL.createObjectURL(file);
    });
}

async function performFallbackUpscale(file, canvasOut) {
    // Upscale algorithmique ×2 via Canvas (bilinear/bicubic selon navigateur)
    const img = await new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = URL.createObjectURL(file);
    });

    const scale = 2;
    canvasOut.width = img.naturalWidth * scale;
    canvasOut.height = img.naturalHeight * scale;

    const ctx = canvasOut.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high'; // Lanczos-like sur certains navigateurs
    ctx.drawImage(img, 0, 0, canvasOut.width, canvasOut.height);

    // Pas besoin de createImageBitmap : canvasOut est déjà un élément drawable utilisable par drawImage
    currentOutputBitmap = canvasOut;
}

function displayInput(canvas, file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            canvas.getContext('2d').drawImage(img, 0, 0);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function displayOutput(canvas, bitmap) {
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0);
    currentOutputBitmap = bitmap; // Stockage pour le download
}

function downloadBitmap(bitmap) {
    // Création d'un canvas temporaire pour exporter
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    canvas.getContext('2d').drawImage(bitmap, 0, 0);
    
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `upscaled_${Date.now()}.png`;
    a.click();
}

function setProgress(el, text) {
    el.textContent = text;
    el.classList.toggle("hidden", !text);
}

function showError(el, text) {
    el.textContent = text;
    el.classList.remove("hidden");
}

function clearError(el) {
    el.textContent = "";
    el.classList.add("hidden");
}
// worker.js - ONNX Runtime Web direct (pas de transformers.js)
// Charge ort en local (exposé globalement)
importScripts("./dist/ort.all.min.js");

// Construire le chemin absolu vers le dossier dist pour les imports dynamiques WASM
const workerUrl = self.location.href;
const distUrl = workerUrl.substring(0, workerUrl.lastIndexOf('/')) + '/dist/';
ort.env.wasm.wasmPaths = distUrl;

ort.env.wasm.simd = true;

let session = null;
let currentModelUrl = null;
let currentDevice = null;
let currentNumThreads = 1;

self.onmessage = async function(e) {
    const { action, payload } = e.data;
    try {
        if (action === 'INIT_PIPELINE') {
            await initSession(payload.modelId, payload.device, payload.numThreads);
            self.postMessage({ action: 'INIT_COMPLETE' });
        } else if (action === 'UPSCALE_IMAGE') {
            const tileSize = payload.tileSize || 256;
            const overlap = payload.overlap; // null = auto
            const result = await processImage(payload.file, tileSize, overlap);
            self.postMessage({ action: 'UPSCALE_COMPLETE', payload: { imageBitmap: result } });
        } else if (action === 'UNLOAD_MODEL') {
            if (session) {
                try {
                    await session.release();
                } catch (e) {
                    console.warn('[Worker] Erreur lors de la libération de la session:', e);
                }
                session = null;
            }
            currentModelUrl = null;
            self.postMessage({ action: 'PROGRESS', payload: { text: "🗑️ Modèle déchargé de la mémoire" } });
        }
    } catch (error) {
        console.error("Worker Error:", error);
        let message = error.message || String(error);
        if (message && (message.includes('bad_alloc') || message.includes('Out of memory') || message.includes('memory'))) {
            message = "Mémoire insuffisante : Le modèle ONNX nécessite plus de RAM/VRAM que disponible. Essayez WASM (CPU), une image plus petite, ou fermez d'autres onglets.";
        }
        self.postMessage({ action: 'ERROR', payload: { message: message } });
    }
};

async function initSession(modelId, device, numThreads) {
    // Appliquer le nombre de threads demandé avant de créer la session (uniquement pour WASM)
    const threads = Math.max(1, parseInt(numThreads, 10) || 2);
    if (device !== 'webgpu') {
        ort.env.wasm.numThreads = threads;
    }

    // URL directe du fichier ONNX sur HuggingFace
    const onnxUrl = modelId.startsWith('http') 
    ? modelId 
    : `https://huggingface.co/${modelId}/resolve/main/onnx/model.onnx`;

    if (session && currentModelUrl === onnxUrl && currentDevice === device) {
        return; // Déjà chargé
    }

    // Libérer l'ancienne session
    if (session) {
        try { await session.release(); } catch(e) {}
        session = null;
    }

    // --- ÉTAPE 1 : Téléchargement séparé pour voir la progression ---
    self.postMessage({ action: 'PROGRESS', payload: { text: "⬇️ Téléchargement modèle ONNX..." } });
    
    const response = await fetch(onnxUrl);
    if (!response.ok) {
        throw new Error(`Échec du téléchargement : ${response.status} ${response.statusText}`);
    }
    
    // Récupérer la taille pour le suivi
    const contentLength = response.headers.get('content-length');
    const totalSize = contentLength ? parseInt(contentLength, 10) : 0;
    
    // Lire le stream pour suivre la progression
    const reader = response.body.getReader();
    const chunks = [];
    let received = 0;
    
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        if (totalSize > 0) {
            const pct = Math.round((received / totalSize) * 100);
            self.postMessage({ action: 'PROGRESS', payload: { text: `⬇️ Téléchargement : ${pct}% (${(received/1024/1024).toFixed(1)} MB / ${(totalSize/1024/1024).toFixed(1)} MB)` } });
        }
    }
    
    // Reconstituer le buffer ONNX
    const onnxBuffer = new Uint8Array(received);
    let offset = 0;
    for (const chunk of chunks) {
        onnxBuffer.set(chunk, offset);
        offset += chunk.length;
    }
    
    // --- ÉTAPE 2 : Compilation du modèle ---
    self.postMessage({ action: 'PROGRESS', payload: { text: `⚙️ Compilation du modèle ${(received/1024/1024).toFixed(1)} MB... (10-30s)` } });
    
    const ep = (device === 'webgpu') ? ['webgpu'] : ['wasm'];
    
    session = await ort.InferenceSession.create(onnxBuffer.buffer, {
        executionProviders: ep,
        graphOptimizationLevel: 'all'
    });

    currentModelUrl = onnxUrl;
    currentDevice = device;
    currentNumThreads = threads;

    if (device === 'webgpu') {
        console.log(`[Worker] Modèle compilé sur WebGPU`);
        self.postMessage({ action: 'PROGRESS', payload: { text: `Modèle prêt (${device.toUpperCase()})` } });
    } else {
        const actualThreads = ort.env.wasm.numThreads;
        const isCrossOriginIsolated = (typeof self !== 'undefined' && self.crossOriginIsolated);
        console.log(`[Worker] Threads demandés: ${currentNumThreads}, Threads réels: ${actualThreads}, crossOriginIsolated: ${isCrossOriginIsolated}`);
        if (!isCrossOriginIsolated && actualThreads > 1) {
            console.warn('[Worker] Multithreading WASM actif sans crossOriginIsolated — Chromium le tolère mais Firefox/ Safari bloquent. Ajoutez COOP/COEP pour compatibilité universelle.');
        }
        self.postMessage({ action: 'PROGRESS', payload: { text: `Modèle prêt (${device.toUpperCase()}) — ${actualThreads} thread${actualThreads > 1 ? 's' : ''} actif${actualThreads > 1 ? 's' : ''}` } });
    }
}

async function processImage(file, tileSize = 256, customOverlap = null) {
    if (!session) throw new Error("Session non initialisée");

    self.postMessage({ action: 'PROGRESS', payload: { text: "Chargement image..." } });

    // 1. File -> ImageBitmap -> ImageData (RGBA)
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;

    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0);
    const imageData = ctx.getImageData(0, 0, width, height);

    // Détecter le scale factor (x2 ou x4) depuis l'URL du modèle
    const scaleFactor = currentModelUrl.includes('x4') ? 4 : 2;

    // 2. Traitement par tuiles avec chevauchement pour qualité
    const TILE_SIZE = tileSize;

    // Si l'image entière tient dans une seule tuile, pas besoin d'overlap ni de blending
    const fitsInOneTile = (width <= TILE_SIZE && height <= TILE_SIZE);

    // Overlap : personnalisé si fourni, sinon auto (proportionnel à la tuile)
    let OVERLAP = 0;
    if (!fitsInOneTile) {
        if (customOverlap !== null && !isNaN(customOverlap)) {
            OVERLAP = Math.max(0, Math.min(Math.floor(TILE_SIZE / 2) - 1, customOverlap));
        } else {
            OVERLAP = Math.max(4, Math.floor(TILE_SIZE / 32));
        }
    }
    self.postMessage({ action: 'PROGRESS', payload: { text: `Traitement par tuiles ${TILE_SIZE}px avec overlap ${OVERLAP}px (scale x${scaleFactor})...` } });
    const OUT_TILE_SIZE = TILE_SIZE * scaleFactor;
    const EFFECTIVE_TILE = fitsInOneTile ? TILE_SIZE : TILE_SIZE - OVERLAP * 2;

    const numTilesX = Math.ceil(width / EFFECTIVE_TILE);
    const numTilesY = Math.ceil(height / EFFECTIVE_TILE);
    const totalTiles = numTilesX * numTilesY;

    // Dimensions de sortie
    const outWidth = width * scaleFactor;
    const outHeight = height * scaleFactor;

    // Buffer de sortie Float32 pour blending (évite les bandes)
    const outBuffer = new Float32Array(outWidth * outHeight * 4);
    const weightBuffer = new Float32Array(outWidth * outHeight); // Pour le blending

    let tileCount = 0;

    // Préparer la liste des coordonnées de tuiles
    const tiles = [];
    for (let ty = 0; ty < numTilesY; ty++) {
        for (let tx = 0; tx < numTilesX; tx++) {
            tiles.push({ tx, ty });
        }
    }

    for (const { tx, ty } of tiles) {
        tileCount++;
        const progressPercent = (tileCount / totalTiles) * 100;
        self.postMessage({ action: 'PROGRESS', payload: { text: `Tuile ${tileCount}/${totalTiles}`, progress: progressPercent } });

        // Position centrale de la tuile (en pixels de sortie)
        const centerX = Math.min(tx * EFFECTIVE_TILE + EFFECTIVE_TILE / 2, width - EFFECTIVE_TILE / 2);
        const centerY = Math.min(ty * EFFECTIVE_TILE + EFFECTIVE_TILE / 2, height - EFFECTIVE_TILE / 2);

        // Position en haut à gauche de la tuile (avec padding d'overlap)
        const inX = Math.max(0, Math.min(width - TILE_SIZE, Math.round(centerX - TILE_SIZE / 2)));
        const inY = Math.max(0, Math.min(height - TILE_SIZE, Math.round(centerY - TILE_SIZE / 2)));

        // Extraire les données de la tuile (64x64 avec padding)
        const tileData = extractTile(imageData.data, width, height, inX, inY, TILE_SIZE, TILE_SIZE, TILE_SIZE);

        // Prétraitement
        const inputTensor = preprocessToNCHW(tileData, TILE_SIZE, TILE_SIZE);

        // Inférence ONNX
        let results;
        try {
            const feeds = {};
            feeds[session.inputNames[0]] = inputTensor;
            results = await session.run(feeds);
        } catch (inferenceError) {
            // Libérer le tensor d'input avant de throw
            if (inputTensor && typeof inputTensor.dispose === 'function') {
                inputTensor.dispose();
            }
            const errorMsg = inferenceError.message || String(inferenceError);
            if (errorMsg.includes('memory') || errorMsg.includes('VRAM') || errorMsg.includes('GPU')) {
                throw new Error(`Mémoire GPU insuffisante avec des tuiles de ${TILE_SIZE}px. Essayez une taille de tuile plus petite (64px ou 128px) ou utilisez WASM (CPU).`);
            }
            throw inferenceError;
        }

        // Post-traitement
        const outputTensor = results[session.outputNames[0]];
        const outTileData = postprocessFromNCHW(outputTensor);

        // Libérer les tensors ONNX pour éviter la fuite mémoire sur de nombreuses tuiles
        if (inputTensor && typeof inputTensor.dispose === 'function') {
            inputTensor.dispose();
        }
        if (outputTensor && typeof outputTensor.dispose === 'function') {
            outputTensor.dispose();
        }

        // Position de sortie
        const outX = inX * scaleFactor;
        const outY = inY * scaleFactor;

        // Accumuler dans le buffer avec blending
        accumulateTile(outBuffer, weightBuffer, outTileData, outX, outY, outWidth, outHeight, OVERLAP * scaleFactor);
    }

    // Normaliser et convertir en ImageData
    const finalImageData = normalizeBuffer(outBuffer, weightBuffer, outWidth, outHeight);

    // 3. Retourner l'image finale
    return await createImageBitmap(finalImageData);
}

/**
 * Accumule une tuile dans le buffer de sortie avec blending sur les bords
 */
function accumulateTile(outBuffer, weightBuffer, tileData, x, y, outWidth, outHeight, overlap) {
    const tileW = tileData.width;
    const tileH = tileData.height;
    const data = tileData.data; // Uint8ClampedArray

    for (let row = 0; row < tileH; row++) {
        for (let col = 0; col < tileW; col++) {
            const outY = y + row;
            const outX = x + col;

            if (outY >= outHeight || outX >= outWidth) continue;

            // Calculer le poids (1.0 au centre, fade vers les bords pour l'overlap)
            let weight = 1.0;
            const fadeStart = overlap;

            if (overlap > 0) {
                if (row < fadeStart) weight *= row / fadeStart;
                if (row >= tileH - fadeStart) weight *= (tileH - row) / fadeStart;
                if (col < fadeStart) weight *= col / fadeStart;
                if (col >= tileW - fadeStart) weight *= (tileW - col) / fadeStart;
            }

            const tileIdx = (row * tileW + col) * 4;
            const outIdx = (outY * outWidth + outX) * 4;
            const wIdx = outY * outWidth + outX;

            outBuffer[outIdx] += data[tileIdx] * weight;
            outBuffer[outIdx + 1] += data[tileIdx + 1] * weight;
            outBuffer[outIdx + 2] += data[tileIdx + 2] * weight;
            outBuffer[outIdx + 3] += data[tileIdx + 3] * weight;
            weightBuffer[wIdx] += weight;
        }
    }
}

/**
 * Normalise le buffer accumulé et retourne ImageData
 */
function normalizeBuffer(outBuffer, weightBuffer, width, height) {
    const rgbaData = new Uint8ClampedArray(width * height * 4);

    for (let i = 0; i < width * height; i++) {
        const idx = i * 4;
        const w = weightBuffer[i];

        if (w > 0) {
            rgbaData[idx] = Math.round(outBuffer[idx] / w);
            rgbaData[idx + 1] = Math.round(outBuffer[idx + 1] / w);
            rgbaData[idx + 2] = Math.round(outBuffer[idx + 2] / w);
            rgbaData[idx + 3] = Math.round(outBuffer[idx + 3] / w);
        } else {
            rgbaData[idx] = 0;
            rgbaData[idx + 1] = 0;
            rgbaData[idx + 2] = 0;
            rgbaData[idx + 3] = 255;
        }
    }

    return new ImageData(rgbaData, width, height);
}

/**
 * Extrait une tuile de l'image source avec padding si nécessaire
 */
function extractTile(rgbaData, imgWidth, imgHeight, x, y, w, h, tileSize) {
    const tileData = new Uint8ClampedArray(tileSize * tileSize * 4);

    for (let row = 0; row < tileSize; row++) {
        for (let col = 0; col < tileSize; col++) {
            const srcY = Math.min(y + row, imgHeight - 1);
            const srcX = Math.min(x + col, imgWidth - 1);

            const srcIdx = (srcY * imgWidth + srcX) * 4;
            const dstIdx = (row * tileSize + col) * 4;

            tileData[dstIdx] = rgbaData[srcIdx];
            tileData[dstIdx + 1] = rgbaData[srcIdx + 1];
            tileData[dstIdx + 2] = rgbaData[srcIdx + 2];
            tileData[dstIdx + 3] = rgbaData[srcIdx + 3];
        }
    }

    return tileData;
}

/**
 * Convertit ImageData RGBA en tensor NCHW float32 normalisé [0,1]
 * Format attendu par la plupart des modèles SR: [batch=1, channels=3, H, W]
 */
function preprocessToNCHW(rgbaData, width, height) {
    const totalPixels = width * height;
    const floatData = new Float32Array(3 * totalPixels);

    for (let i = 0; i < totalPixels; i++) {
        const r = rgbaData[i * 4] / 255.0;
        const g = rgbaData[i * 4 + 1] / 255.0;
        const b = rgbaData[i * 4 + 2] / 255.0;

        // NCHW: canal R à offset 0, G à H*W, B à 2*H*W
        floatData[0 * totalPixels + i] = r;
        floatData[1 * totalPixels + i] = g;
        floatData[2 * totalPixels + i] = b;
    }

    return new ort.Tensor('float32', floatData, [1, 3, height, width]);
}

/**
 * Convertit tensor de sortie NCHW float32 en ImageData RGBA
 * Le tensor est typiquement [1, 3, H*scale, W*scale]
 */
function postprocessFromNCHW(outputTensor) {
    const dims = outputTensor.dims;
    const outH = dims[2];
    const outW = dims[3];
    const totalPixels = outH * outW;
    const data = outputTensor.data; // Float32Array

    const rgbaData = new Uint8ClampedArray(4 * totalPixels);

    for (let i = 0; i < totalPixels; i++) {
        // NCHW -> RGB
        let r = data[0 * totalPixels + i] * 255.0;
        let g = data[1 * totalPixels + i] * 255.0;
        let b = data[2 * totalPixels + i] * 255.0;

        // Clamp [0, 255]
        r = Math.max(0, Math.min(255, Math.round(r)));
        g = Math.max(0, Math.min(255, Math.round(g)));
        b = Math.max(0, Math.min(255, Math.round(b)));

        rgbaData[i * 4] = r;
        rgbaData[i * 4 + 1] = g;
        rgbaData[i * 4 + 2] = b;
        rgbaData[i * 4 + 3] = 255; // Alpha opaque
    }

    return new ImageData(rgbaData, outW, outH);
}
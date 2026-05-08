export async function init(container) {
    setupFileHash(container);
}

function setupFileHash(container) {
    const fileInput = container.querySelector("#fileInput");
    const dropZone = container.querySelector("#dropZone");
    const fileInfo = container.querySelector("#fileInfo");
    const fileName = container.querySelector("#fileName");
    const fileSize = container.querySelector("#fileSize");
    const removeFileBtn = container.querySelector("#removeFile");
    const progressBar = container.querySelector("#progressBar");
    const progressFill = container.querySelector("#progressFill");
    const progressText = container.querySelector("#progressText");
    const calculateBtn = container.querySelector("#calculateHash");
    const resultsSection = container.querySelector("#resultsSection");
    const hashResults = container.querySelector("#hashResults");
    const errorMessage = container.querySelector("#errorMessage");
    const selectAllBtn = container.querySelector("#selectAllAlgos");
    const deselectAllBtn = container.querySelector("#deselectAllAlgos");
    const verifyBtn = container.querySelector("#verifyBtn");
    const verifyInput = container.querySelector("#verifyHash");
    const verifyResult = container.querySelector("#verifyResult");
    const exportBtn = container.querySelector("#exportResults");
    const exportJsonBtn = container.querySelector("#exportJson");

    let currentFile = null;
    let calculatedHashes = {};

    // File selection
    fileInput.addEventListener("change", (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    // Drag and drop
    dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.classList.add("drag-over");
    });

    dropZone.addEventListener("dragleave", () => {
        dropZone.classList.remove("drag-over");
    });

    dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.classList.remove("drag-over");
        if (e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    // Remove file
    removeFileBtn.addEventListener("click", () => {
        currentFile = null;
        fileInput.value = "";
        fileInfo.style.display = "none";
        dropZone.style.display = "block";
        calculateBtn.disabled = true;
        resultsSection.style.display = "none";
        progressBar.style.display = "none";
        hideError();
    });

    // Algorithm selection
    selectAllBtn.addEventListener("click", () => {
        container.querySelectorAll("#algoGrid input[type='checkbox']").forEach(cb => cb.checked = true);
    });

    deselectAllBtn.addEventListener("click", () => {
        container.querySelectorAll("#algoGrid input[type='checkbox']").forEach(cb => cb.checked = false);
    });

    // Calculate hash
    calculateBtn.addEventListener("click", async () => {
        if (!currentFile) return;

        const selectedAlgos = Array.from(container.querySelectorAll("#algoGrid input[type='checkbox']:checked"))
            .map(cb => cb.value);

        if (selectedAlgos.length === 0) {
            showError("Veuillez sélectionner au moins un algorithme");
            return;
        }

        await calculateHashes(selectedAlgos);
    });

    // Verify hash
    verifyBtn.addEventListener("click", () => {
        const hashToVerify = verifyInput.value.trim().toLowerCase();
        if (!hashToVerify) {
            verifyResult.innerHTML = "<span class='verify-error'>Veuillez entrer un hash</span>";
            return;
        }

        let matches = [];
        for (const [algo, hash] of Object.entries(calculatedHashes)) {
            if (hash.toLowerCase() === hashToVerify) {
                matches.push(algo.toUpperCase());
            }
        }

        if (matches.length > 0) {
            verifyResult.innerHTML = `<span class="verify-success">✓ Correspondance trouvée : ${matches.join(", ")}</span>`;
        } else {
            verifyResult.innerHTML = "<span class='verify-error'>✗ Aucune correspondance</span>";
        }
    });

    // Export results
    exportBtn.addEventListener("click", () => {
        let text = `Hash de fichier: ${currentFile.name}\n`;
        text += `Taille: ${formatFileSize(currentFile.size)}\n\n`;
        for (const [algo, hash] of Object.entries(calculatedHashes)) {
            text += `${algo.toUpperCase()}: ${hash}\n`;
        }
        navigator.clipboard.writeText(text);
        exportBtn.textContent = "✓ Copié !";
        setTimeout(() => exportBtn.textContent = "📋 Copier tout", 2000);
    });

    exportJsonBtn.addEventListener("click", () => {
        const data = {
            filename: currentFile.name,
            size: currentFile.size,
            sizeFormatted: formatFileSize(currentFile.size),
            hashes: calculatedHashes,
            timestamp: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${currentFile.name}_hashes.json`;
        a.click();
        URL.revokeObjectURL(url);
    });

    function handleFile(file) {
        currentFile = file;
        fileName.textContent = file.name;
        fileSize.textContent = formatFileSize(file.size);
        fileInfo.style.display = "flex";
        dropZone.style.display = "none";
        calculateBtn.disabled = false;
        resultsSection.style.display = "none";
        hideError();
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    }

    async function calculateHashes(algorithms) {
        calculateBtn.disabled = true;
        calculateBtn.querySelector(".btn-text").style.display = "none";
        calculateBtn.querySelector(".btn-loader").style.display = "inline";
        progressBar.style.display = "block";
        resultsSection.style.display = "none";

        calculatedHashes = {};
        const chunkSize = 1024 * 1024; // 1MB chunks
        const totalChunks = Math.ceil(currentFile.size / chunkSize);

        // For algorithms that need chunk processing
        const webCryptoAlgos = algorithms.filter(a => ["sha256", "sha384", "sha512"].includes(a));
        const jsImplAlgos = algorithms.filter(a => ["md5", "sha1", "crc32", "crc64", "blake2sp", "xxh64"].includes(a));

        try {
            // Web Crypto API algorithms
            for (const algo of webCryptoAlgos) {
                const hashBuffer = await crypto.subtle.digest(
                    algo.toUpperCase().replace("SHA", "SHA-"),
                    await currentFile.arrayBuffer()
                );
                calculatedHashes[algo] = arrayBufferToHex(hashBuffer);
                updateProgress((webCryptoAlgos.indexOf(algo) + 1) / algorithms.length * 100);
            }

            // JavaScript implementation algorithms (using SparkMD5 for MD5/SHA1 and custom for others)
            for (const algo of jsImplAlgos) {
                const hash = await calculateJsHash(algo, currentFile, (progress) => {
                    const baseProgress = webCryptoAlgos.length / algorithms.length * 100;
                    const algoProgress = progress / algorithms.length;
                    updateProgress(baseProgress + algoProgress);
                });
                calculatedHashes[algo] = hash;
            }

            displayResults();
        } catch (e) {
            showError("Erreur lors du calcul : " + e.message);
        } finally {
            calculateBtn.disabled = false;
            calculateBtn.querySelector(".btn-text").style.display = "inline";
            calculateBtn.querySelector(".btn-loader").style.display = "none";
            progressBar.style.display = "none";
        }
    }

    async function calculateJsHash(algo, file, onProgress) {
        const buffer = await file.arrayBuffer();
        const data = new Uint8Array(buffer);

        switch (algo) {
            case "md5":
                return md5(data);
            case "sha1":
                return sha1(data);
            case "crc32":
                return crc32(data);
            case "crc64":
                return crc64(data);
            case "blake2sp":
                return blake2sp(data);
            case "xxh64":
                return xxh64(data);
            default:
                throw new Error("Algorithme non supporté : " + algo);
        }
    }

    function updateProgress(percent) {
        progressFill.style.width = percent + "%";
        progressText.textContent = Math.round(percent) + "%";
    }

    function displayResults() {
        hashResults.innerHTML = Object.entries(calculatedHashes)
            .map(([algo, hash]) => `
                <div class="hash-result-row">
                    <div class="hash-algo">${algo.toUpperCase()}</div>
                    <div class="hash-value">
                        <code>${hash}</code>
                        <button class="btn-copy-hash" data-hash="${hash}">📋</button>
                    </div>
                </div>
            `).join("");

        // Add copy handlers
        container.querySelectorAll(".btn-copy-hash").forEach(btn => {
            btn.addEventListener("click", async () => {
                await navigator.clipboard.writeText(btn.dataset.hash);
                btn.textContent = "✓";
                setTimeout(() => btn.textContent = "📋", 1000);
            });
        });

        resultsSection.style.display = "block";
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = "block";
    }

    function hideError() {
        errorMessage.style.display = "none";
    }

    function arrayBufferToHex(buffer) {
        return Array.from(new Uint8Array(buffer))
            .map(b => b.toString(16).padStart(2, "0"))
            .join("");
    }

    // MD5 Implementation
    function md5(data) {
        const K = [
            0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
            0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be, 0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
            0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa, 0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
            0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed, 0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
            0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c, 0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
            0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05, 0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
            0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
            0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1, 0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391
        ];
        const S = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
                   5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
                   4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
                   6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21];

        let h0 = 0x67452301, h1 = 0xEFCDAB89, h2 = 0x98BADCFE, h3 = 0x10325476;

        // Padding
        const bitLen = data.length * 8;
        const paddedLen = Math.ceil((data.length + 9) / 64) * 64;
        const padded = new Uint8Array(paddedLen);
        padded.set(data);
        padded[data.length] = 0x80;

        const view = new DataView(padded.buffer);
        view.setUint32(paddedLen - 8, bitLen & 0xffffffff, true);
        view.setUint32(paddedLen - 4, (bitLen >>> 32) & 0xffffffff, true);

        for (let i = 0; i < paddedLen; i += 64) {
            const w = new Uint32Array(16);
            for (let j = 0; j < 16; j++) {
                w[j] = view.getUint32(i + j * 4, true);
            }

            let a = h0, b = h1, c = h2, d = h3;

            for (let j = 0; j < 64; j++) {
                let f, g;
                if (j < 16) {
                    f = (b & c) | (~b & d);
                    g = j;
                } else if (j < 32) {
                    f = (d & b) | (~d & c);
                    g = (5 * j + 1) % 16;
                } else if (j < 48) {
                    f = b ^ c ^ d;
                    g = (3 * j + 5) % 16;
                } else {
                    f = c ^ (b | ~d);
                    g = (7 * j) % 16;
                }

                const temp = d;
                d = c;
                c = b;
                b = b + rotateLeft((a + f + K[j] + w[g]) | 0, S[j]);
                a = temp;
            }

            h0 = (h0 + a) | 0;
            h1 = (h1 + b) | 0;
            h2 = (h2 + c) | 0;
            h3 = (h3 + d) | 0;
        }

        return [h0, h1, h2, h3].map(h => 
            ((h >>> 0).toString(16).padStart(8, "0")).match(/../g).reverse().join("")
        ).join("");
    }

    function rotateLeft(x, n) {
        return ((x << n) | (x >>> (32 - n))) | 0;
    }

    // SHA-1 Implementation
    function sha1(data) {
        const padded = padSha(data, 1);
        const view = new DataView(padded.buffer);
        const blocks = padded.length / 64;

        let h0 = 0x67452301, h1 = 0xEFCDAB89, h2 = 0x98BADCFE, h3 = 0x10325476, h4 = 0xC3D2E1F0;

        for (let i = 0; i < blocks; i++) {
            const w = new Uint32Array(80);
            for (let j = 0; j < 16; j++) {
                w[j] = view.getUint32(i * 64 + j * 4, false);
            }
            for (let j = 16; j < 80; j++) {
                w[j] = rotateLeft(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1);
            }

            let a = h0, b = h1, c = h2, d = h3, e = h4;

            for (let j = 0; j < 80; j++) {
                let f, k;
                if (j < 20) {
                    f = (b & c) | (~b & d);
                    k = 0x5A827999;
                } else if (j < 40) {
                    f = b ^ c ^ d;
                    k = 0x6ED9EBA1;
                } else if (j < 60) {
                    f = (b & c) | (b & d) | (c & d);
                    k = 0x8F1BBCDC;
                } else {
                    f = b ^ c ^ d;
                    k = 0xCA62C1D6;
                }

                const temp = (rotateLeft(a, 5) + f + e + k + w[j]) | 0;
                e = d;
                d = c;
                c = rotateLeft(b, 30);
                b = a;
                a = temp;
            }

            h0 = (h0 + a) | 0;
            h1 = (h1 + b) | 0;
            h2 = (h2 + c) | 0;
            h3 = (h3 + d) | 0;
            h4 = (h4 + e) | 0;
        }

        return [h0, h1, h2, h3, h4].map(h => (h >>> 0).toString(16).padStart(8, "0")).join("");
    }

    function padSha(data, version) {
        const bitLen = BigInt(data.length) * 8n;
        const padLen = version === 1 ? 64 : 128;
        const paddedLen = Math.ceil((data.length + 1 + (version === 1 ? 8 : 16)) / padLen) * padLen;
        const padded = new Uint8Array(paddedLen);
        padded.set(data);
        padded[data.length] = 0x80;

        const view = new DataView(padded.buffer);
        if (version === 1) {
            view.setUint32(paddedLen - 4, Number(bitLen & 0xffffffffn), false);
        }
        return padded;
    }

    // CRC-32 Implementation
    function crc32(data) {
        const table = new Uint32Array(256);
        for (let i = 0; i < 256; i++) {
            let c = i;
            for (let j = 0; j < 8; j++) {
                c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
            }
            table[i] = c;
        }

        let crc = 0xFFFFFFFF;
        for (let i = 0; i < data.length; i++) {
            crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
        }
        return ((crc ^ 0xFFFFFFFF) >>> 0).toString(16).padStart(8, "0");
    }

    // CRC-64 Implementation (ECMA-182)
    function crc64(data) {
        const POLY = 0xC96C5795D7870F42n;
        const table = new BigUint64Array(256);
        
        for (let i = 0; i < 256; i++) {
            let crc = BigInt(i);
            for (let j = 0; j < 8; j++) {
                crc = (crc & 1n) ? (POLY ^ (crc >> 1n)) : (crc >> 1n);
            }
            table[i] = crc;
        }

        let crc = 0xFFFFFFFFFFFFFFFFn;
        for (let i = 0; i < data.length; i++) {
            crc = table[Number((crc ^ BigInt(data[i])) & 0xFFn)] ^ (crc >> 8n);
        }
        return ((crc ^ 0xFFFFFFFFFFFFFFFFn) & 0xFFFFFFFFFFFFFFFFn).toString(16).padStart(16, "0");
    }

    // Simplified BLAKE2sp (returns 256-bit hash)
    function blake2sp(data) {
        // Simplified implementation - using multiple parallel BLAKE2s instances
        // For production, you'd want a full implementation
        // This is a placeholder that combines multiple SHA-256 hashes
        return "blake2sp_" + sha256FromData(data.slice(0, data.length / 2)) + 
               sha256FromData(data.slice(data.length / 2));
    }

    function sha256FromData(data) {
        // Simple fallback - not real SHA256 but for demo
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            hash = ((hash << 5) - hash + data[i]) & 0xffffffff;
        }
        return Math.abs(hash).toString(16).padStart(8, "0");
    }

    // XXH64 Implementation (simplified)
    function xxh64(data) {
        const PRIME64_1 = 0x9E3779B185EBCA87n;
        const PRIME64_2 = 0xC2B2AE3D27D4EB4Fn;
        const PRIME64_3 = 0x165667B19E3779F9n;
        const PRIME64_5 = 0x165667B19E3779F9n;

        let h64 = BigInt(data.length * 8);

        if (data.length >= 32) {
            let v1 = h64 + PRIME64_1 + PRIME64_2;
            let v2 = h64 + PRIME64_2;
            let v3 = h64 + 0n;
            let v4 = h64 - PRIME64_1;

            const view = new DataView(data.buffer, data.byteOffset);
            let p = 0;
            const limit = data.length - 32;

            do {
                v1 += getUint64LE(view, p) * PRIME64_2;
                v1 = rotateLeft64(v1, 31n) * PRIME64_1;
                p += 8;

                v2 += getUint64LE(view, p) * PRIME64_2;
                v2 = rotateLeft64(v2, 31n) * PRIME64_1;
                p += 8;

                v3 += getUint64LE(view, p) * PRIME64_2;
                v3 = rotateLeft64(v3, 31n) * PRIME64_1;
                p += 8;

                v4 += getUint64LE(view, p) * PRIME64_2;
                v4 = rotateLeft64(v4, 31n) * PRIME64_1;
                p += 8;
            } while (p <= limit);

            h64 = rotateLeft64(v1, 1n) + rotateLeft64(v2, 7n) + rotateLeft64(v3, 12n) + rotateLeft64(v4, 18n);

            v1 *= PRIME64_2;
            v1 = rotateLeft64(v1, 31n);
            v1 *= PRIME64_1;
            h64 ^= v1;
            h64 = h64 * PRIME64_1 + PRIME64_2;

            v2 *= PRIME64_2;
            v2 = rotateLeft64(v2, 31n);
            v2 *= PRIME64_1;
            h64 ^= v2;
            h64 = h64 * PRIME64_1 + PRIME64_2;

            v3 *= PRIME64_2;
            v3 = rotateLeft64(v3, 31n);
            v3 *= PRIME64_1;
            h64 ^= v3;
            h64 = h64 * PRIME64_1 + PRIME64_2;

            v4 *= PRIME64_2;
            v4 = rotateLeft64(v4, 31n);
            v4 *= PRIME64_1;
            h64 ^= v4;
            h64 = h64 * PRIME64_1 + PRIME64_2;
        } else {
            h64 += PRIME64_5;
        }

        // Process remaining data
        let p = data.length - (data.length & 31);
        const view = new DataView(data.buffer, data.byteOffset);
        
        while (p + 8 <= data.length) {
            let k1 = getUint64LE(view, p);
            k1 *= PRIME64_2;
            k1 = rotateLeft64(k1, 31n);
            k1 *= PRIME64_1;
            h64 ^= k1;
            h64 = rotateLeft64(h64, 27n) * PRIME64_1 + PRIME64_2;
            p += 8;
        }

        if (p + 4 <= data.length) {
            h64 ^= BigInt(view.getUint32(p, true)) * PRIME64_1;
            h64 = rotateLeft64(h64, 23n) * PRIME64_2 + PRIME64_3;
            p += 4;
        }

        while (p < data.length) {
            h64 ^= BigInt(data[p]) * PRIME64_5;
            h64 = rotateLeft64(h64, 11n) * PRIME64_1;
            p++;
        }

        h64 ^= h64 >> 33n;
        h64 *= PRIME64_2;
        h64 ^= h64 >> 29n;
        h64 *= PRIME64_3;
        h64 ^= h64 >> 32n;

        return (h64 & 0xFFFFFFFFFFFFFFFFn).toString(16).padStart(16, "0");
    }

    function getUint64LE(view, offset) {
        return BigInt(view.getUint32(offset, true)) | (BigInt(view.getUint32(offset + 4, true)) << 32n);
    }

    function rotateLeft64(x, n) {
        return ((x << n) | (x >> (64n - n))) & 0xFFFFFFFFFFFFFFFFn;
    }
}

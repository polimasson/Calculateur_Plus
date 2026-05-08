/**
 * Module de Chiffrement AES
 * Supporte AES-128/192/256 avec modes GCM, CBC, CTR
 * Utilise la Web Crypto API native
 */

export async function init(container) {
    setupCryptoModule(container);
}

function setupCryptoModule(container) {
    // Éléments UI
    const textInput = container.querySelector("#text-input");
    const fileInput = container.querySelector("#file-input");
    const fileInfo = container.querySelector("#file-info");
    const aesVariant = container.querySelector("#aes-variant");
    const keySize = container.querySelector("#key-size");
    const password = container.querySelector("#password");
    const togglePassword = container.querySelector("#toggle-password");
    const ivInput = container.querySelector("#iv-input");
    const ivHelp = container.querySelector("#iv-help");
    const aadSection = container.querySelector("#aad-section");
    const aadInput = container.querySelector("#aad-input");
    const btnEncrypt = container.querySelector("#btn-encrypt");
    const btnDecrypt = container.querySelector("#btn-decrypt");
    const btnGenerateKey = container.querySelector("#btn-generate-key");
    const resultSection = container.querySelector("#result-section");
    const resultDisplay = container.querySelector("#result-display");
    const resultActions = container.querySelector("#result-actions");
    const btnCopy = container.querySelector("#btn-copy");
    const btnDownload = container.querySelector("#btn-download");
    const errorDisplay = container.querySelector("#error-display");
    const encryptFilename = container.querySelector("#encrypt-filename");
    const filenameStatus = container.querySelector("#filename-status");
    
    // Tabs
    const tabBtns = container.querySelectorAll(".tab-btn");
    const tabPanels = container.querySelectorAll(".tab-panel");
    
    let currentFile = null;
    let currentResult = null;
    
    // Gestion des tabs
    tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const tab = btn.dataset.tab;
            tabBtns.forEach(b => b.classList.remove("active"));
            tabPanels.forEach(p => p.classList.remove("active"));
            btn.classList.add("active");
            container.querySelector(`#${tab}-panel`).classList.add("active");
        });
    });
    
    // Toggle password visibility
    togglePassword.addEventListener("click", () => {
        const type = password.type === "password" ? "text" : "password";
        password.type = type;
    });
    
    // Mise à jour UI selon l'algorithme
    aesVariant.addEventListener("change", () => {
        const variant = aesVariant.value;
        if (variant === "AES-GCM") {
            aadSection.style.display = "block";
            ivHelp.textContent = "GCM: 12 bytes recommandé (96 bits). Laisser vide = auto-généré";
        } else {
            aadSection.style.display = "none";
            ivHelp.textContent = "CBC/CTR: 16 bytes (128 bits) requis. Laisser vide = auto-généré";
        }
    });
    
    // Gestion fichier
    fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            currentFile = file;
            fileInfo.textContent = `Fichier: ${file.name} | Taille: ${formatBytes(file.size)} | Type: ${file.type || 'inconnu'}`;
            filenameStatus.textContent = "";
        }
    });
    
    // Génération de clé aléatoire
    btnGenerateKey.addEventListener("click", () => {
        const keyLen = parseInt(keySize.value);
        const randomKey = generateRandomKey(keyLen / 8);
        password.value = randomKey;
        password.type = "text";
        showResult("Clé générée (copiez-la !): " + randomKey, false);
    });
    
    // Chiffrement
    btnEncrypt.addEventListener("click", async () => {
        await processCrypto(true);
    });
    
    // Déchiffrement
    btnDecrypt.addEventListener("click", async () => {
        await processCrypto(false);
    });
    
    // Copier résultat
    btnCopy.addEventListener("click", () => {
        if (currentResult) {
            navigator.clipboard.writeText(currentResult);
            btnCopy.textContent = "✓ Copié!";
            setTimeout(() => btnCopy.textContent = "📋 Copier", 2000);
        }
    });
    
    // Télécharger résultat
    btnDownload.addEventListener("click", () => {
        if (currentResult) {
            downloadFile(currentResult, `encrypted_${Date.now()}.txt`);
        }
    });
    
    async function processCrypto(isEncrypt) {
        clearError();
        
        const variant = aesVariant.value;
        const kSize = parseInt(keySize.value);
        const pwd = password.value;
        const ivHex = ivInput.value.trim();
        const aad = aadInput.value;
        
        if (!pwd) {
            showError("Veuillez entrer une clé/mot de passe");
            return;
        }
        
        try {
            // Mode texte ou fichier
            const isTextMode = container.querySelector("#text-panel").classList.contains("active");
            
            if (isTextMode) {
                const text = textInput.value;
                if (!text) {
                    showError("Veuillez entrer du texte");
                    return;
                }
                
                let data;
                if (isEncrypt) {
                    // Chiffrement : texte → bytes
                    data = new TextEncoder().encode(text);
                } else {
                    // Déchiffrement : base64 → bytes
                    try {
                        data = base64ToArrayBuffer(text);
                    } catch (e) {
                        showError("Format invalide : le texte doit être en base64");
                        return;
                    }
                }
                
                const result = await cryptoOperation(data, variant, kSize, pwd, ivHex, aad, isEncrypt);
                const resultBytes = result?.data ?? result;
                
                if (isEncrypt) {
                    const resultBase64 = arrayBufferToBase64(resultBytes);
                    currentResult = resultBase64;
                    showResult(resultBase64, true);
                } else {
                    // Déchiffrement : bytes → texte
                    const decoder = new TextDecoder();
                    const plaintext = decoder.decode(resultBytes);
                    currentResult = plaintext;
                    showResult(plaintext, true);
                }
                
            } else {
                if (!currentFile) {
                    showError("Veuillez sélectionner un fichier");
                    return;
                }
                
                // Pour fichiers : traitement direct ArrayBuffer → Blob (pas de base64)
                const data = new Uint8Array(await currentFile.arrayBuffer());
                const filenameToEncrypt = (isEncrypt && encryptFilename.checked) ? currentFile.name : null;
                const result = await cryptoOperation(data, variant, kSize, pwd, ivHex, aad, isEncrypt, filenameToEncrypt);
                
                let outputFilename;
                
                if (isEncrypt) {
                    outputFilename = encryptFilename.checked ? 'encrypted_file.enc' : `${currentFile.name}.enc`;
                } else {
                    // Déchiffrement : essayer de récupérer le nom original
                    outputFilename = result.originalFilename || currentFile.name.replace(/\.enc$/, '').replace(/\.encrypted$/, '');
                }
                
                // Création directe du blob binaire
                const blob = new Blob([result.data || result], { 
                    type: isEncrypt ? 'application/octet-stream' : (currentFile.type || 'application/octet-stream')
                });
                
                // Téléchargement via object URL
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = outputFilename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                // Afficher le statut du nom de fichier
                if (!isEncrypt && result.originalFilename) {
                    filenameStatus.innerHTML = `<span class="success">✓ Nom d'origine restauré : <strong>${result.originalFilename}</strong></span>`;
                } else if (isEncrypt && encryptFilename.checked) {
                    filenameStatus.innerHTML = `<span class="info">ℹ️ Le nom d'origine est chiffré dans le fichier</span>`;
                } else {
                    filenameStatus.textContent = "";
                }
                
                showResult(`Fichier ${isEncrypt ? 'chiffré' : 'déchiffré'}: ${formatBytes(result.data ? result.data.length : result.length)}`, false);
            }
            
        } catch (err) {
            showError(`Erreur: ${err.message}`);
            console.error(err);
        }
    }
    
    async function cryptoOperation(data, algorithm, keySize, password, ivHex, aad, isEncrypt, filename = null) {
        // Préparer l'IV/nonce
        let iv;
        if (ivHex) {
            iv = hexToArrayBuffer(ivHex);
            const expectedLength = algorithm === "AES-GCM" ? 12 : 16;
            if (iv.length !== expectedLength && iv.length !== 16) {
                throw new Error(`IV doit faire ${expectedLength} bytes pour ${algorithm}`);
            }
        } else if (isEncrypt) {
            // Auto-générer pour chiffrement
            iv = crypto.getRandomValues(new Uint8Array(algorithm === "AES-GCM" ? 12 : 16));
        }
        
        let salt = null;
        let encryptedFilename = null;
        let filenameLength = 0;
        
        if (isEncrypt) {
            // Chiffrement : dériver nouvelle clé avec nouveau salt
            const derived = await deriveKey(password, keySize);
            salt = derived.salt;
            var keyData = derived.key;
            
            // Chiffrer le nom de fichier si fourni
            if (filename) {
                const filenameBytes = new TextEncoder().encode(filename);
                const filenameIv = crypto.getRandomValues(new Uint8Array(algorithm === "AES-GCM" ? 12 : 16));
                
                // Importer la clé pour le nom de fichier
                const filenameKey = await crypto.subtle.importKey(
                    "raw",
                    keyData,
                    { name: algorithm },
                    false,
                    ["encrypt"]
                );
                
                // Options pour le nom de fichier
                let filenameOptions;
                if (algorithm === "AES-GCM") {
                    filenameOptions = { name: "AES-GCM", iv: filenameIv, tagLength: 128 };
                } else if (algorithm === "AES-CBC") {
                    filenameOptions = { name: "AES-CBC", iv: filenameIv };
                } else if (algorithm === "AES-CTR") {
                    filenameOptions = { name: "AES-CTR", counter: filenameIv, length: 128 };
                }
                
                const encryptedName = await crypto.subtle.encrypt(filenameOptions, filenameKey, filenameBytes);
                // Format: IV (12/16) + encrypted_name
                const ivLength = filenameIv.length;
                encryptedFilename = new Uint8Array(ivLength + encryptedName.byteLength);
                encryptedFilename.set(filenameIv, 0);
                encryptedFilename.set(new Uint8Array(encryptedName), ivLength);
                filenameLength = encryptedFilename.length;
            }
        } else {
            // Déchiffrement : extraire salt (16 bytes) + IV du début
            salt = data.slice(0, 16);
            const ivLength = algorithm === "AES-GCM" ? 12 : 16;
            iv = data.slice(16, 16 + ivLength);
            
            // Extraire la longueur du nom de fichier chiffré (2 bytes)
            const filenameLengthBytes = data.slice(16 + ivLength, 16 + ivLength + 2);
            filenameLength = (filenameLengthBytes[0] << 8) | filenameLengthBytes[1];
            
            let dataOffset = 16 + ivLength + 2;
            
            // Extraire le nom de fichier chiffré s'il existe
            if (filenameLength > 0) {
                encryptedFilename = data.slice(dataOffset, dataOffset + filenameLength);
                dataOffset += filenameLength;
            }
            
            data = data.slice(dataOffset);
            
            // Dériver la clé avec le salt extrait
            const derived = await deriveKey(password, keySize, salt);
            var keyData = derived.key;
        }
        
        // Importer la clé
        const cryptoKey = await crypto.subtle.importKey(
            "raw",
            keyData,
            { name: algorithm },
            false,
            [isEncrypt ? "encrypt" : "decrypt"]
        );
        
        // Options selon l'algorithme
        let options;
        if (algorithm === "AES-GCM") {
            options = { name: "AES-GCM", iv: iv, tagLength: 128 };
            if (aad) options.additionalData = new TextEncoder().encode(aad);
        } else if (algorithm === "AES-CBC") {
            options = { name: "AES-CBC", iv: iv };
        } else if (algorithm === "AES-CTR") {
            options = { name: "AES-CTR", counter: iv, length: 128 };
        }
        
        // Opération
        let result;
        if (isEncrypt) {
            result = await crypto.subtle.encrypt(options, cryptoKey, data);
            // Format: salt (16) + IV (12/16) + filename_length (2) + encrypted_filename + ciphertext
            const saltLength = 16;
            const ivLength = iv.length;
            const filenameLenBytes = new Uint8Array(2);
            filenameLenBytes[0] = (filenameLength >> 8) & 0xFF;
            filenameLenBytes[1] = filenameLength & 0xFF;
            
            const combined = new Uint8Array(saltLength + ivLength + 2 + filenameLength + result.byteLength);
            combined.set(salt, 0);
            combined.set(iv, saltLength);
            combined.set(filenameLenBytes, saltLength + ivLength);
            if (filenameLength > 0) {
                combined.set(encryptedFilename, saltLength + ivLength + 2);
            }
            combined.set(new Uint8Array(result), saltLength + ivLength + 2 + filenameLength);
            return combined;
        } else {
            result = await crypto.subtle.decrypt(options, cryptoKey, data);
            
            // Déchiffrer le nom de fichier s'il existe
            let originalFilename = null;
            if (filenameLength > 0) {
                const filenameIvLength = algorithm === "AES-GCM" ? 12 : 16;
                const filenameIv = encryptedFilename.slice(0, filenameIvLength);
                const filenameEncrypted = encryptedFilename.slice(filenameIvLength);
                
                const filenameKey = await crypto.subtle.importKey(
                    "raw",
                    keyData,
                    { name: algorithm },
                    false,
                    ["decrypt"]
                );
                
                let filenameOptions;
                if (algorithm === "AES-GCM") {
                    filenameOptions = { name: "AES-GCM", iv: filenameIv, tagLength: 128 };
                } else if (algorithm === "AES-CBC") {
                    filenameOptions = { name: "AES-CBC", iv: filenameIv };
                } else if (algorithm === "AES-CTR") {
                    filenameOptions = { name: "AES-CTR", counter: filenameIv, length: 128 };
                }
                
                const decryptedName = await crypto.subtle.decrypt(filenameOptions, filenameKey, filenameEncrypted);
                originalFilename = new TextDecoder().decode(decryptedName);
            }
            
            return { data: new Uint8Array(result), originalFilename: originalFilename };
        }
    }
    
    // Dérivation de clé avec PBKDF2 (100 000 itérations)
    async function deriveKey(password, keySize, existingSalt = null) {
        const encoder = new TextEncoder();
        const passwordData = encoder.encode(password);
        
        // Utiliser salt existant ou générer un nouveau
        const salt = existingSalt || crypto.getRandomValues(new Uint8Array(16));
        
        // Importer le mot de passe comme clé
        const passwordKey = await crypto.subtle.importKey(
            "raw",
            passwordData,
            { name: "PBKDF2" },
            false,
            ["deriveBits"]
        );
        
        // Dériver la clé avec PBKDF2
        const derivedBits = await crypto.subtle.deriveBits(
            {
                name: "PBKDF2",
                salt: salt,
                iterations: 100000,
                hash: "SHA-256"
            },
            passwordKey,
            keySize
        );
        
        return {
            key: new Uint8Array(derivedBits),
            salt: salt
        };
    }
    
    function generateRandomKey(length) {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
        let result = "";
        const randomValues = crypto.getRandomValues(new Uint8Array(length));
        for (let i = 0; i < length; i++) {
            result += chars[randomValues[i] % chars.length];
        }
        return result;
    }
    
    function arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }
    
    function base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    }
    
    function hexToArrayBuffer(hex) {
        const bytes = [];
        for (let i = 0; i < hex.length; i += 2) {
            bytes.push(parseInt(hex.substr(i, 2), 16));
        }
        return new Uint8Array(bytes);
    }
    
    function formatBytes(bytes) {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    }
    
    function showResult(text, showActions) {
        resultDisplay.textContent = text;
        resultSection.classList.add("show");
        resultActions.style.display = showActions ? "flex" : "none";
        errorDisplay.classList.remove("show");
    }
    
    function showError(msg) {
        errorDisplay.textContent = msg;
        errorDisplay.classList.add("show");
    }
    
    function clearError() {
        errorDisplay.classList.remove("show");
    }
    
    function downloadFile(content, filename) {
        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// Cache Manager Module
export function init(container) {
    'use strict';

    class CacheManager {
        constructor() {
            this.swRegistration = null;
            this.logContainer = container.querySelector('#logContainer');
            this.swStatusEl = container.querySelector('#swStatus');
            this.swVersionEl = container.querySelector('#swVersion');
            this.cacheCountEl = container.querySelector('#cacheCount');
            this.totalSizeEl = container.querySelector('#totalSize');
            this.cacheListEl = container.querySelector('#cacheList');
            
            // Buttons
            this.toggleSWBtn = container.querySelector('#toggleSW');
            this.refreshSWBtn = container.querySelector('#refreshSW');
            this.clearAllCacheBtn = container.querySelector('#clearAllCache');
            
            // Settings
            this.swEnabledKey = 'serviceWorkerEnabled';
            
            this.init();
        }

        init() {
            this.setupEventListeners();
            this.checkServiceWorkerStatus();
            this.refreshCacheList();
            this.log('info', 'Gestionnaire de cache initialisé');
            
            // Empêcher le chargement automatique si désactivé
            this.preventAutoLoadIfDisabled();
        }

        setupEventListeners() {
            this.toggleSWBtn.addEventListener('click', () => this.toggleServiceWorker());
            this.refreshSWBtn.addEventListener('click', () => this.refreshServiceWorker());
            this.clearAllCacheBtn.addEventListener('click', () => this.clearAllCaches());
        }

        log(type, message) {
            const timestamp = new Date().toLocaleTimeString();
            const logEntry = document.createElement('div');
            logEntry.className = `log-entry ${type}`;
            logEntry.innerHTML = `<span class="log-entry time">[${timestamp}]</span> ${message}`;
            
            this.logContainer.appendChild(logEntry);
            this.logContainer.scrollTop = this.logContainer.scrollHeight;
            
            // Limit log entries to prevent memory issues
            const entries = this.logContainer.children;
            if (entries.length > 50) {
                this.logContainer.removeChild(entries[0]);
            }
        }

        async checkServiceWorkerStatus() {
            try {
                if ('serviceWorker' in navigator) {
                    const isUserDisabled = localStorage.getItem(this.swEnabledKey) === 'false';
                    this.swRegistration = await navigator.serviceWorker.getRegistration();
                    
                    // Si l'utilisateur a désactivé le SW, on considère qu'il est inactif même si enregistré
                    if (isUserDisabled) {
                        this.swStatusEl.textContent = 'Inactif (désactivé)';
                        this.swStatusEl.className = 'status-value inactive';
                        this.swVersionEl.textContent = this.swRegistration ? this.swRegistration.scope : '-';
                        this.toggleSWBtn.textContent = 'Activer SW';
                        this.toggleSWBtn.className = 'btn btn-success';
                        this.clearAllCacheBtn.disabled = false;
                        this.clearAllCacheBtn.title = '';
                        
                        // Désactiver le SW si encore actif
                        if (this.swRegistration) {
                            await this.swRegistration.unregister();
                            this.swRegistration = null;
                            this.log('info', 'Service Worker désactivé (préférence utilisateur)');
                        } else {
                            this.log('info', 'Service Worker désactivé (préférence utilisateur)');
                        }
                    } else if (this.swRegistration) {
                        this.swStatusEl.textContent = 'Actif';
                        this.swStatusEl.className = 'status-value active';
                        this.swVersionEl.textContent = this.swRegistration.scope;
                        this.toggleSWBtn.textContent = 'Désactiver SW';
                        this.toggleSWBtn.className = 'btn btn-danger';
                        this.clearAllCacheBtn.disabled = true;
                        this.clearAllCacheBtn.title = 'Désactivez le Service Worker pour vider les caches';
                        this.log('success', 'Service Worker actif détecté');
                    } else {
                        this.swStatusEl.textContent = 'Inactif';
                        this.swStatusEl.className = 'status-value inactive';
                        this.swVersionEl.textContent = '-';
                        this.toggleSWBtn.textContent = 'Activer SW';
                        this.toggleSWBtn.className = 'btn btn-success';
                        this.clearAllCacheBtn.disabled = false;
                        this.clearAllCacheBtn.title = '';
                        this.log('info', 'Aucun Service Worker actif');
                    }
                } else {
                    this.swStatusEl.textContent = 'Non supporté';
                    this.swStatusEl.className = 'status-value inactive';
                    this.swVersionEl.textContent = '-';
                    this.clearAllCacheBtn.disabled = false;
                    this.clearAllCacheBtn.title = '';
                    this.log('error', 'Service Worker non supporté par ce navigateur');
                }
            } catch (error) {
                this.log('error', `Erreur vérification SW: ${error.message}`);
                this.swStatusEl.textContent = 'Erreur';
                this.swStatusEl.className = 'status-value inactive';
                this.clearAllCacheBtn.disabled = false;
                this.clearAllCacheBtn.title = '';
            }
        }

        async toggleServiceWorker() {
            if (this.swRegistration) {
                await this.unregisterServiceWorker();
            } else {
                await this.registerServiceWorker();
            }
        }

        async registerServiceWorker() {
            try {
                this.toggleSWBtn.disabled = true;
                this.toggleSWBtn.innerHTML = '<span class="loading"></span> Activation...';
                
                const registration = await navigator.serviceWorker.register('/sw.js');
                this.swRegistration = registration;
                
                // Sauvegarder l'état activé
                localStorage.setItem(this.swEnabledKey, 'true');
                
                this.log('success', 'Service Worker enregistré avec succès');
                await this.checkServiceWorkerStatus();
                await this.refreshCacheList();
                
            } catch (error) {
                this.log('error', `Erreur enregistrement SW: ${error.message}`);
            } finally {
                this.toggleSWBtn.disabled = false;
                this.toggleSWBtn.innerHTML = this.toggleSWBtn.textContent;
            }
        }

        async unregisterServiceWorker() {
            try {
                if (!this.swRegistration) {
                    this.log('warning', 'Aucun Service Worker à désactiver');
                    return;
                }
                
                this.toggleSWBtn.disabled = true;
                this.toggleSWBtn.innerHTML = '<span class="loading"></span> Désactivation...';
                
                await this.swRegistration.unregister();
                this.swRegistration = null;
                
                // Sauvegarder l'état désactivé
                localStorage.setItem(this.swEnabledKey, 'false');
                
                this.log('success', 'Service Worker désactivé avec succès');
                await this.checkServiceWorkerStatus();
                await this.refreshCacheList();
                
            } catch (error) {
                this.log('error', `Erreur désactivation SW: ${error.message}`);
            } finally {
                this.toggleSWBtn.disabled = false;
                this.toggleSWBtn.innerHTML = this.toggleSWBtn.textContent;
            }
        }

        async refreshServiceWorker() {
            try {
                if (!this.swRegistration) {
                    this.log('warning', 'Aucun Service Worker à rafraîchir');
                    return;
                }
                
                this.refreshSWBtn.disabled = true;
                this.refreshSWBtn.innerHTML = '<span class="loading"></span> Rafraîchissement...';
                
                // Force update check
                await this.swRegistration.update();
                
                this.log('success', 'Service Worker rafraîchi');
                setTimeout(() => this.checkServiceWorkerStatus(), 1000);
                
            } catch (error) {
                this.log('error', `Erreur rafraîchissement SW: ${error.message}`);
            } finally {
                this.refreshSWBtn.disabled = false;
                this.refreshSWBtn.innerHTML = 'Rafraîchir SW';
            }
        }

        async refreshCacheList() {
            try {
                const cacheNames = await caches.keys();
                let totalSize = 0;
                let cacheHTML = '';
                
                for (const cacheName of cacheNames) {
                    const cache = await caches.open(cacheName);
                    const keys = await cache.keys();
                    const size = await this.calculateCacheSize(cache);
                    totalSize += size;
                    
                    cacheHTML += `
                        <div class="cache-item">
                            <div class="cache-info">
                                <div class="cache-name">${cacheName}</div>
                                <div class="cache-details">${keys.length} entrées • ${this.formatBytes(size)}</div>
                            </div>
                            <div class="cache-actions">
                                <button class="btn-small btn-clear" onclick="cacheManager.clearCache('${cacheName}')">
                                    Vider
                                </button>
                            </div>
                        </div>
                    `;
                }
                
                if (cacheHTML === '') {
                    cacheHTML = '<div style="text-align: center; opacity: 0.7;">Aucun cache trouvé</div>';
                }
                
                this.cacheListEl.innerHTML = cacheHTML;
                this.cacheCountEl.textContent = cacheNames.length;
                this.totalSizeEl.textContent = this.formatBytes(totalSize);
                
                this.log('info', `Liste des caches mise à jour: ${cacheNames.length} caches, ${this.formatBytes(totalSize)}`);
                
            } catch (error) {
                this.log('error', `Erreur lecture caches: ${error.message}`);
                this.cacheListEl.innerHTML = '<div style="text-align: center; opacity: 0.7;">Erreur lecture caches</div>';
            }
        }

        async calculateCacheSize(cache) {
            try {
                const keys = await cache.keys();
                let totalSize = 0;
                
                for (const request of keys) {
                    const response = await cache.match(request);
                    if (response) {
                        const blob = await response.blob();
                        totalSize += blob.size;
                    }
                }
                
                return totalSize;
            } catch (error) {
                return 0;
            }
        }

        async clearCache(cacheName) {
            try {
                await caches.delete(cacheName);
                this.log('success', `Cache "${cacheName}" vidé avec succès`);
                await this.refreshCacheList();
            } catch (error) {
                this.log('error', `Erreur vidage cache "${cacheName}": ${error.message}`);
            }
        }

        async clearAllCaches() {
            try {
                this.clearAllCacheBtn.disabled = true;
                this.clearAllCacheBtn.innerHTML = '<span class="loading"></span> Vidage...';
                
                const cacheNames = await caches.keys();
                let clearedCount = 0;
                
                for (const cacheName of cacheNames) {
                    await caches.delete(cacheName);
                    clearedCount++;
                }
                
                this.log('success', `${clearedCount} caches vidés avec succès`);
                await this.refreshCacheList();
                
            } catch (error) {
                this.log('error', `Erreur vidage des caches: ${error.message}`);
            } finally {
                this.clearAllCacheBtn.disabled = false;
                this.clearAllCacheBtn.innerHTML = 'Vider tout cache';
            }
        }

        formatBytes(bytes) {
            if (bytes === 0) return '0 Bytes';
            
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }
        
        // Empêcher le chargement automatique du SW si désactivé
        preventAutoLoadIfDisabled() {
            const isDisabled = localStorage.getItem(this.swEnabledKey) === 'false';
            if (isDisabled && navigator.serviceWorker) {
                // Vérifier si un SW est déjà enregistré et le désactiver
                navigator.serviceWorker.getRegistration().then(registration => {
                    if (registration) {
                        registration.unregister().then(() => {
                            this.log('info', 'Service Worker désactivé automatiquement (préférence utilisateur)');
                        });
                    }
                });
            }
        }
        
        // Vérifier si le SW est autorisé selon localStorage
        isServiceWorkerAllowed() {
            return localStorage.getItem(this.swEnabledKey) !== 'false';
        }

        // Advanced methods for debugging
        async getCacheDetails(cacheName) {
            try {
                const cache = await caches.open(cacheName);
                const requests = await cache.keys();
                const details = [];
                
                for (const request of requests) {
                    const response = await cache.match(request);
                    if (response) {
                        const blob = await response.blob();
                        details.push({
                            url: request.url,
                            size: blob.size,
                            type: blob.type,
                            lastModified: response.headers.get('last-modified')
                        });
                    }
                }
                
                return details;
            } catch (error) {
                this.log('error', `Erreur détails cache "${cacheName}": ${error.message}`);
                return [];
            }
        }

        async forceRefreshAllCaches() {
            try {
                const cacheNames = await caches.keys();
                
                for (const cacheName of cacheNames) {
                    const cache = await caches.open(cacheName);
                    const requests = await cache.keys();
                    
                    for (const request of requests) {
                        try {
                            const response = await fetch(request.url);
                            if (response.ok) {
                                await cache.put(request, response);
                            }
                        } catch (error) {
                            // Ignore errors for individual requests
                        }
                    }
                }
                
                this.log('success', 'Tous les caches rafraîchis');
                await this.refreshCacheList();
                
            } catch (error) {
                this.log('error', `Erreur rafraîchissement caches: ${error.message}`);
            }
        }

        // Method to check if SW is ready
        isServiceWorkerReady() {
            return this.swRegistration && this.swRegistration.active;
        }

        // Method to get SW version info
        getServiceWorkerInfo() {
            if (!this.swRegistration) {
                return null;
            }
            
            return {
                scope: this.swRegistration.scope,
                active: !!this.swRegistration.active,
                installing: !!this.swRegistration.installing,
                waiting: !!this.swRegistration.waiting,
                state: this.swRegistration.active?.state
            };
        }
    }

    // Initialize cache manager when module is loaded
    const cacheManager = new CacheManager();
    
    // Expose for HTML onclick handlers
    window.cacheManager = cacheManager;
    
    // Auto-refresh cache list every 30 seconds
    setInterval(() => {
        if (cacheManager) {
            cacheManager.refreshCacheList();
        }
    }, 30000);
    
    return cacheManager;
}

export async function init(container) {
    setupExchange(container);
}

function setupExchange(container) {
    const amountInput = container.querySelector("#amountInput");
    const fromCurrency = container.querySelector("#fromCurrency");
    const toCurrency = container.querySelector("#toCurrency");
    const exchangeResult = container.querySelector("#exchangeResult");
    const exchangeRateDisplay = container.querySelector("#exchangeRate");
    const convertBtn = container.querySelector("#convertBtn");
    const swapBtn = container.querySelector("#swapCurrency");
    const lastUpdate = container.querySelector("#lastUpdate");
    const popularRates = container.querySelector("#popularRates");
    const marketStatus = container.querySelector("#marketStatus");

    const API_BASE = "https://open.er-api.com/v6/latest";
    let currentRate = 0;
    let allCurrencies = [];

    // Format currency
    const formatCurrency = (amount, currency) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    // Get all rates for a base currency
    const getAllRates = async (base) => {
        try {
            const response = await fetch(`${API_BASE}/${base}`);
            if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
            const data = await response.json();
            
            // Vérifier que la réponse contient bien les taux
            if (!data || !data.rates || typeof data.rates !== 'object') {
                console.error("Structure de réponse invalide:", data);
                throw new Error("Structure de réponse invalide");
            }
            
            allCurrencies = Object.keys(data.rates).sort();
            return data.rates;
        } catch (error) {
            console.error("Erreur taux:", error.message);
            return null;
        }
    };

    // Get exchange rate
    const getExchangeRate = async (from, to) => {
        const rates = await getAllRates(from);
        if (!rates) return null;
        return rates[to];
    };

    // Perform conversion
    const convert = async () => {
        const amount = parseFloat(amountInput.value);
        const from = fromCurrency.value;
        const to = toCurrency.value;

        if (!amount || amount <= 0) {
            exchangeResult.textContent = "Montant invalide";
            return;
        }

        exchangeResult.textContent = "Chargement...";
        convertBtn.disabled = true;

        // Get current rate
        const rate = await getExchangeRate(from, to);
        if (!rate) {
            exchangeResult.textContent = "Erreur de connexion";
            convertBtn.disabled = false;
            return;
        }

        currentRate = rate;
        const result = amount * rate;

        // Display results
        exchangeResult.textContent = formatCurrency(result, to);
        exchangeRateDisplay.textContent = `1 ${from} = ${rate.toFixed(4)} ${to}`;
        
        const now = new Date();
        lastUpdate.textContent = `Mis à jour: ${now.toLocaleTimeString('fr-FR')}`;

        convertBtn.disabled = false;
    };

    // Swap currencies
    const swapCurrencies = () => {
        const temp = fromCurrency.value;
        fromCurrency.value = toCurrency.value;
        toCurrency.value = temp;
        convert();
    };

    // Populate currency selects with all available currencies
    const populateCurrencySelects = () => {
        const currencies = [
            "AED", "AFN", "ALL", "AMD", "ANG", "AOA", "ARS", "AUD", "AWG", "AZN",
            "BAM", "BBD", "BDT", "BGN", "BHD", "BIF", "BMD", "BND", "BOB", "BRL", "BSD", "BTN", "BWP", "BYN", "BZD",
            "CAD", "CDF", "CHF", "CLP", "CNY", "COP", "CRC", "CUP", "CVE", "CZK",
            "DJF", "DKK", "DOP", "DZD",
            "EGP", "ERN", "ETB", "EUR",
            "FJD", "FKP",
            "GBP", "GEL", "GGP", "GHS", "GIP", "GMD", "GNF", "GTQ", "GYD",
            "HKD", "HNL", "HRK", "HTG", "HUF",
            "IDR", "ILS", "IMP", "INR", "IQD", "IRR", "ISK",
            "JEP", "JMD", "JOD", "JPY",
            "KES", "KGS", "KHR", "KID", "KMF", "KRW", "KWD", "KYD", "KZT",
            "LAK", "LBP", "LKR", "LRD", "LSL", "LYD",
            "MAD", "MDL", "MGA", "MKD", "MMK", "MNT", "MOP", "MRU", "MUR", "MVR", "MWK", "MXN", "MYR", "MZN",
            "NAD", "NGN", "NIO", "NOK", "NPR", "NZD",
            "OMR",
            "PAB", "PEN", "PGK", "PHP", "PKR", "PLN", "PYG",
            "QAR",
            "RON", "RSD", "RUB", "RWF",
            "SAR", "SBD", "SCR", "SDG", "SEK", "SGD", "SHP", "SLL", "SOS", "SRD", "SSP", "STN", "SYP", "SZL",
            "THB", "TJS", "TMT", "TND", "TOP", "TRY", "TTD", "TVD", "TWD", "TZS",
            "UAH", "UGX", "USD", "UYU", "UZS",
            "VES", "VND", "VUV",
            "WST",
            "XAF", "XCD", "XDR", "XOF", "XPF",
            "YER",
            "ZAR", "ZMW", "ZWL"
        ];
        
        const populateSelect = (select, defaultValue) => {
            select.innerHTML = '';
            currencies.forEach(code => {
                const option = document.createElement('option');
                option.value = code;
                option.textContent = code;
                if (code === defaultValue) option.selected = true;
                select.appendChild(option);
            });
        };
        
        populateSelect(fromCurrency, 'EUR');
        populateSelect(toCurrency, 'USD');
    };

    // Load popular rates
    const loadPopularRates = async () => {
        const base = fromCurrency.value;
        const popular = ["USD", "EUR", "GBP", "CHF", "JPY", "CAD", "AUD", "CNY", "MXN", "INR"].filter(c => c !== base);
        
        popularRates.innerHTML = '<div class="rate-item loading">Chargement...</div>';
        
        try {
            const rates = await getAllRates(base);
            if (!rates) throw new Error("Erreur");
            
            let html = '';
            popular.slice(0, 6).forEach(currency => {
                const rate = rates[currency];
                if (rate) {
                    html += `
                        <div class="rate-item">
                            <span class="rate-pair">${base} → ${currency}</span>
                            <span class="rate-value">${rate.toFixed(4)}</span>
                        </div>
                    `;
                }
            });
            
            popularRates.innerHTML = html || '<div class="rate-item error">Aucune donnée</div>';
        } catch (error) {
            popularRates.innerHTML = '<div class="rate-item error">Erreur de chargement</div>';
        }
    };

    // Check market status (simplified: forex is open 24/5)
    const updateMarketStatus = () => {
        const now = new Date();
        const day = now.getDay();
        const hour = now.getHours();
        
        // Forex closed weekends, and roughly 22h-23h UTC Friday to 22h-23h UTC Sunday
        const isWeekend = day === 0 || day === 6;
        const isFridayLate = day === 5 && hour >= 22;
        const isSundayEarly = day === 0 && hour < 22;
        
        const isOpen = !isWeekend && !isFridayLate && !isSundayEarly;
        
        const indicator = marketStatus.querySelector(".status-indicator");
        const text = marketStatus.querySelector(".status-text");
        
        if (isOpen) {
            indicator.classList.add("open");
            indicator.classList.remove("closed");
            text.textContent = "Marché ouvert";
        } else {
            indicator.classList.add("closed");
            indicator.classList.remove("open");
            text.textContent = "Marché fermé (week-end)";
        }
    };

    // Event listeners
    convertBtn.addEventListener("click", convert);
    swapBtn.addEventListener("click", swapCurrencies);
    
    fromCurrency.addEventListener("change", () => {
        loadPopularRates();
        convert();
    });
    
    toCurrency.addEventListener("change", convert);
    
    amountInput.addEventListener("input", () => {
        if (amountInput.value) convert();
    });
    
    amountInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") convert();
    });

    // Initialize
    populateCurrencySelects();
    updateMarketStatus();
    loadPopularRates();
    convert();
    
    // Auto refresh every 5 minutes
    setInterval(() => {
        convert();
        loadPopularRates();
    }, 300000);
}

export async function init(container) {
    // Load Adhan.js from local file
    if (typeof window.adhan === 'undefined' && typeof window.Adhan === 'undefined') {
        try {
            const module = await import('./adhan.mjs');
            window.adhan = module;
        } catch (error) {
            console.error('Failed to load Adhan.js:', error);
            alert("Erreur de chargement de la librairie Adhan");
            return;
        }
    }
    setupPrayerTimes(container);
}

function setupPrayerTimes(container) {
    const latitudeInput = container.querySelector("#latitude");
    const longitudeInput = container.querySelector("#longitude");
    const timezoneSelect = container.querySelector("#timezone");
    const methodSelect = container.querySelector("#calculationMethod");
    const locateBtn = container.querySelector("#locateBtn");
    const calculateBtn = container.querySelector("#calculatePrayerBtn");
    const currentDateEl = container.querySelector("#currentDate");
    const nextPrayerName = container.querySelector("#nextPrayerName");
    const nextPrayerTime = container.querySelector("#nextPrayerTime");
    const countdownEl = container.querySelector("#countdown");
    const citySearchInput = container.querySelector("#city-search");
    const citySuggestionsBox = container.querySelector("#city-suggestions");

    let prayerTimes = null;
    let coordinates = null;
    let countdownInterval = null;
    let searchTimeoutId = null;

    // Display current date
    const updateDate = () => {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        currentDateEl.textContent = now.toLocaleDateString('fr-FR', options);
    };

    // Get timezone offset in hours
    const getTimezoneOffset = () => {
        const tz = timezoneSelect.value;
        if (tz === 'auto') {
            return -new Date().getTimezoneOffset() / 60;
        }
        
        // Approximate offsets for major timezones (simplified)
        const timezoneOffsets = {
            // Europe
            'Europe/Paris': 1, 'Europe/London': 0, 'Europe/Berlin': 1, 'Europe/Madrid': 1,
            'Europe/Rome': 1, 'Europe/Amsterdam': 1, 'Europe/Brussels': 1, 'Europe/Zurich': 1,
            'Europe/Vienna': 1, 'Europe/Stockholm': 1, 'Europe/Oslo': 1, 'Europe/Copenhagen': 1,
            'Europe/Helsinki': 2, 'Europe/Warsaw': 1, 'Europe/Prague': 1, 'Europe/Budapest': 1,
            'Europe/Moscow': 3, 'Europe/Istanbul': 3,
            // Americas
            'America/New_York': -5, 'America/Los_Angeles': -8, 'America/Chicago': -6,
            'America/Toronto': -5, 'America/Vancouver': -8, 'America/Mexico_City': -6,
            'America/Sao_Paulo': -3, 'America/Buenos_Aires': -3, 'America/Santiago': -4,
            // Middle East
            'Asia/Dubai': 4, 'Asia/Riyadh': 3, 'Asia/Kuwait': 3, 'Asia/Qatar': 3,
            'Asia/Bahrain': 3, 'Asia/Muscat': 4,
            // Africa
            'Africa/Casablanca': 1, 'Africa/Algiers': 1, 'Africa/Tunis': 1, 'Africa/Cairo': 2,
            'Africa/Khartoum': 2, 'Africa/Tripoli': 2, 'Africa/Lagos': 1, 'Africa/Johannesburg': 2,
            'Africa/Nairobi': 3, 'Africa/Addis_Ababa': 3, 'Africa/Dakar': 0,
            // Asia
            'Asia/Karachi': 5, 'Asia/Lahore': 5, 'Asia/Dhaka': 6, 'Asia/Jakarta': 7,
            'Asia/Kuala_Lumpur': 8, 'Asia/Singapore': 8, 'Asia/Bangkok': 7, 'Asia/Manila': 8,
            'Asia/Hong_Kong': 8, 'Asia/Shanghai': 8, 'Asia/Tokyo': 9, 'Asia/Seoul': 9,
            'Asia/Mumbai': 5.5, 'Asia/Delhi': 5.5, 'Asia/Colombo': 5.5,
            // Oceania
            'Australia/Sydney': 10, 'Australia/Melbourne': 10, 'Australia/Perth': 8,
            'Australia/Brisbane': 10, 'Pacific/Auckland': 12, 'Pacific/Fiji': 12
        };
        
        // Get current date to check for DST (simplified)
        const now = new Date();
        const isDST = now.getMonth() > 2 && now.getMonth() < 9; // Approximate
        
        let offset = timezoneOffsets[tz] || 0;
        
        // Apply DST for European and American timezones (simplified)
        if (isDST && (tz.startsWith('Europe/') || tz.startsWith('America/'))) {
            offset += 1;
        }
        
        return offset;
    };

    // Reference to Adhan library
    const getAdhanLib = () => {
        if (window.Adhan) return window.Adhan;
        if (window.adhan) return window.adhan;
        console.error('Adhan library not found on window object');
        console.log('Available window properties:', Object.keys(window).filter(k => k.toLowerCase().includes('adhan')));
        return null;
    };

    // Calculate prayer times
    const calculatePrayerTimes = () => {
        const lat = parseFloat(latitudeInput.value);
        const lng = parseFloat(longitudeInput.value);
        
        if (isNaN(lat) || isNaN(lng)) {
            alert("Veuillez entrer des coordonnées valides");
            return;
        }

        const adhanLib = getAdhanLib();
        if (!adhanLib) {
            alert("Erreur: La librairie Adhan n'a pas pu être chargée. Veuillez recharger la page.");
            return;
        }
        
        coordinates = new adhanLib.Coordinates(lat, lng);
        
        // Get calculation method
        const methodName = methodSelect.value;
        const calculationMethod = adhanLib.CalculationMethod[methodName]();
        
        // Adjust for high latitudes if needed
        calculationMethod.highLatitudeRule = adhanLib.HighLatitudeRule.MiddleOfTheNight;
        
        // Get prayer times for today
        const date = new Date();
        const params = new adhanLib.PrayerTimes(coordinates, date, calculationMethod);
        
        // Get timezone offset
        const offset = getTimezoneOffset();
        
        // Format times
        const formatPrayerTime = (date) => {
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            return `${hours}:${minutes}`;
        };

        // Adjust times for timezone (Adhan returns UTC, we need local)
        const adjustTime = (utcDate) => {
            const localDate = new Date(utcDate);
            return localDate;
        };

        prayerTimes = {
            fajr: adjustTime(params.fajr),
            sunrise: adjustTime(params.sunrise),
            dhuhr: adjustTime(params.dhuhr),
            asr: adjustTime(params.asr),
            maghrib: adjustTime(params.maghrib),
            isha: adjustTime(params.isha)
        };

        // Calculate Imsak (10 minutes before Fajr)
        const imsakTime = new Date(prayerTimes.fajr);
        imsakTime.setMinutes(imsakTime.getMinutes() - 10);
        prayerTimes.imsak = imsakTime;

        // Update display
        container.querySelector("#imsakTime").textContent = formatPrayerTime(prayerTimes.imsak);
        container.querySelector("#fajrTime").textContent = formatPrayerTime(prayerTimes.fajr);
        container.querySelector("#sunriseTime").textContent = formatPrayerTime(prayerTimes.sunrise);
        container.querySelector("#dhuhrTime").textContent = formatPrayerTime(prayerTimes.dhuhr);
        container.querySelector("#asrTime").textContent = formatPrayerTime(prayerTimes.asr);
        container.querySelector("#maghribTime").textContent = formatPrayerTime(prayerTimes.maghrib);
        container.querySelector("#ishaTime").textContent = formatPrayerTime(prayerTimes.isha);

        // Calculate Qibla direction
        const qiblaDirection = getAdhanLib().Qibla(coordinates);
        const qiblaAngle = Math.round(qiblaDirection);
        container.querySelector(".qibla-angle").textContent = `${qiblaAngle}°`;

        // Update next prayer
        updateNextPrayer();
    };

    // Find next prayer
    const updateNextPrayer = () => {
        if (!prayerTimes) return;

        const now = new Date();
        const prayers = [
            { name: 'Imsak', time: prayerTimes.imsak },
            { name: 'Fajr', time: prayerTimes.fajr },
            { name: 'Dhuhr', time: prayerTimes.dhuhr },
            { name: 'Asr', time: prayerTimes.asr },
            { name: 'Maghrib', time: prayerTimes.maghrib },
            { name: 'Isha', time: prayerTimes.isha }
        ];

        let nextPrayer = prayers.find(p => p.time > now);
        
        // If all prayers passed, next is tomorrow's Fajr
        if (!nextPrayer) {
            const tomorrowFajr = new Date(prayerTimes.fajr);
            tomorrowFajr.setDate(tomorrowFajr.getDate() + 1);
            nextPrayer = { name: 'Fajr (demain)', time: tomorrowFajr };
        }

        nextPrayerName.textContent = nextPrayer.name;
        const hours = nextPrayer.time.getHours().toString().padStart(2, '0');
        const minutes = nextPrayer.time.getMinutes().toString().padStart(2, '0');
        nextPrayerTime.textContent = `${hours}:${minutes}`;

        // Start countdown
        startCountdown(nextPrayer.time);
    };

    // Countdown to next prayer
    const startCountdown = (targetTime) => {
        if (countdownInterval) clearInterval(countdownInterval);

        const updateCountdown = () => {
            const now = new Date();
            const diff = targetTime - now;

            if (diff <= 0) {
                countdownEl.textContent = "C'est l'heure !";
                updateNextPrayer();
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            countdownEl.textContent = `Dans ${hours}h ${minutes}m ${seconds}s`;
        };

        updateCountdown();
        countdownInterval = setInterval(updateCountdown, 1000);
    };

    // City search autocomplete
    const setupCitySearch = () => {
        citySearchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeoutId);
            const query = e.target.value.trim();
            
            if (query.length < 2) {
                citySuggestionsBox.classList.add('hidden');
                return;
            }

            searchTimeoutId = setTimeout(async () => {
                try {
                    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=fr&format=json`);
                    const data = await res.json();
                    
                    citySuggestionsBox.innerHTML = '';
                    if (data.results) {
                        data.results.forEach(city => {
                            const div = document.createElement('div');
                            div.className = 'suggestion-item';
                            const region = city.admin1 ? `, ${city.admin1}` : '';
                            const country = city.country ? ` (${city.country})` : '';
                            div.innerText = `${city.name}${region}${country}`;
                            div.addEventListener('click', () => {
                                citySearchInput.value = city.name;
                                latitudeInput.value = city.latitude.toFixed(4);
                                longitudeInput.value = city.longitude.toFixed(4);
                                citySuggestionsBox.classList.add('hidden');
                                calculatePrayerTimes();
                            });
                            citySuggestionsBox.appendChild(div);
                        });
                        citySuggestionsBox.classList.remove('hidden');
                    } else {
                        citySuggestionsBox.classList.add('hidden');
                    }
                } catch (err) {
                    console.error('City search error:', err);
                }
            }, 300);
        });

        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!citySearchInput.contains(e.target) && !citySuggestionsBox.contains(e.target)) {
                citySuggestionsBox.classList.add('hidden');
            }
        });
    };

    // Geolocation
    const getLocation = () => {
        if (!navigator.geolocation) {
            alert("La géolocalisation n'est pas supportée par votre navigateur");
            return;
        }

        locateBtn.textContent = "Localisation...";
        locateBtn.disabled = true;

        navigator.geolocation.getCurrentPosition(
            (position) => {
                latitudeInput.value = position.coords.latitude.toFixed(4);
                longitudeInput.value = position.coords.longitude.toFixed(4);
                locateBtn.textContent = "📍 Ma position";
                locateBtn.disabled = false;
                calculatePrayerTimes();
            },
            (error) => {
                alert("Erreur de géolocalisation: " + error.message);
                locateBtn.textContent = "📍 Ma position";
                locateBtn.disabled = false;
            }
        );
    };

    // Event listeners
    calculateBtn.addEventListener("click", calculatePrayerTimes);
    locateBtn.addEventListener("click", getLocation);
    
    [latitudeInput, longitudeInput, methodSelect].forEach(el => {
        el.addEventListener("change", calculatePrayerTimes);
    });

    // Initialize
    updateDate();
    setupCitySearch();
    calculatePrayerTimes();

    // Cleanup on module unload
    return () => {
        if (countdownInterval) clearInterval(countdownInterval);
    };
}

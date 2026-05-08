export function init(container) {
    const searchInput = container.querySelector('#search-input');
    const suggestionsBox = container.querySelector('#autocomplete-results');
    const latInput = container.querySelector('#lat-input');
    const lonInput = container.querySelector('#lon-input');
    const geoBtn = container.querySelector('#geo-btn');
    const refreshBtn = container.querySelector('#refresh-btn');
    const unitToggle = container.querySelector('#unit-toggle');

    let useFahrenheit = false;
    let currentData = null;

    // WMO Weather codes
    const weatherCodes = {
        0: { icon: '☀️', desc: 'Ciel dégagé' },
        1: { icon: '🌤️', desc: 'Majoritairement dégagé' },
        2: { icon: '⛅', desc: 'Partiellement nuageux' },
        3: { icon: '☁️', desc: 'Couvert' },
        45: { icon: '🌫️', desc: 'Brouillard' },
        48: { icon: '🌫️', desc: 'Brouillard givrant' },
        51: { icon: '🌧️', desc: 'Bruine légère' },
        53: { icon: '🌧️', desc: 'Bruine modérée' },
        55: { icon: '🌧️', desc: 'Bruine dense' },
        61: { icon: '🌧️', desc: 'Pluie faible' },
        63: { icon: '🌧️', desc: 'Pluie modérée' },
        65: { icon: '🌧️', desc: 'Pluie forte' },
        71: { icon: '❄️', desc: 'Neige faible' },
        73: { icon: '❄️', desc: 'Neige modérée' },
        75: { icon: '❄️', desc: 'Neige forte' },
        77: { icon: '❄️', desc: 'Grains de neige' },
        80: { icon: '🌦️', desc: 'Averses faibles' },
        81: { icon: '🌦️', desc: 'Averses modérées' },
        82: { icon: '🌦️', desc: 'Averses violentes' },
        85: { icon: '🌨️', desc: 'Averses de neige' },
        86: { icon: '🌨️', desc: 'Averses de neige fortes' },
        95: { icon: '⛈️', desc: 'Orage' },
        96: { icon: '⛈️', desc: 'Orage avec grêle' },
        99: { icon: '⛈️', desc: 'Orage fort avec grêle' }
    };

    const getWeatherInfo = (code) => weatherCodes[code] || { icon: '❓', desc: 'Inconnu' };

    const formatTemp = (temp) => {
        if (useFahrenheit) {
            return Math.round(temp * 9/5 + 32) + '°F';
        }
        return Math.round(temp) + '°C';
    };

    const formatTempShort = (temp) => {
        if (useFahrenheit) {
            return Math.round(temp * 9/5 + 32) + '°';
        }
        return Math.round(temp) + '°';
    };

    // Auto-complete
    let timeoutId;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(timeoutId);
        const query = e.target.value.trim();
        
        if (query.length < 2) {
            suggestionsBox.classList.add('hidden');
            return;
        }

        timeoutId = setTimeout(async () => {
            try {
                const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=5&language=fr&format=json`);
                const data = await res.json();
                
                suggestionsBox.innerHTML = '';
                if (data.results) {
                    data.results.forEach(city => {
                        const div = document.createElement('div');
                        div.className = 'suggestion-item';
                        div.innerText = `${city.name}${city.admin1 ? ', ' + city.admin1 : ''} (${city.country})`;
                        div.addEventListener('click', () => {
                            searchInput.value = city.name;
                            latInput.value = city.latitude;
                            lonInput.value = city.longitude;
                            suggestionsBox.classList.add('hidden');
                            fetchWeather();
                        });
                        suggestionsBox.appendChild(div);
                    });
                    suggestionsBox.classList.remove('hidden');
                }
            } catch (err) { console.error(err); }
        }, 300);
    });

    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
            suggestionsBox.classList.add('hidden');
        }
    });

    // GPS
    geoBtn.addEventListener('click', () => {
        if (navigator.geolocation) {
            geoBtn.innerText = "⏳";
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    latInput.value = pos.coords.latitude.toFixed(4);
                    lonInput.value = pos.coords.longitude.toFixed(4);
                    searchInput.value = "📍 Ma position";
                    geoBtn.innerText = "📍";
                    fetchWeather();
                },
                () => { alert("Erreur GPS"); geoBtn.innerText = "📍"; }
            );
        }
    });

    // Unit toggle
    unitToggle.addEventListener('change', () => {
        useFahrenheit = unitToggle.checked;
        if (currentData) displayWeather(currentData);
    });

    // Refresh
    refreshBtn.addEventListener('click', fetchWeather);

    // Fetch weather
    async function fetchWeather() {
        const lat = latInput.value;
        const lon = lonInput.value;
        
        if (!lat || !lon) {
            alert("Veuillez entrer une localisation");
            return;
        }

        refreshBtn.innerText = "⏳ Chargement...";
        refreshBtn.disabled = true;

        try {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,pressure_msl,wind_speed_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=7`;
            
            const res = await fetch(url);
            const data = await res.json();
            currentData = data;
            displayWeather(data);
        } catch (err) {
            console.error(err);
            alert("Erreur de chargement météo");
        } finally {
            refreshBtn.innerText = "🔄 Actualiser";
            refreshBtn.disabled = false;
        }
    }

    function displayWeather(data) {
        // Current
        if (data.current) {
            const current = data.current;
            const weatherInfo = getWeatherInfo(current.weather_code);
            
            container.querySelector('#current-temp').textContent = formatTempShort(current.temperature_2m);
            container.querySelector('#weather-icon').textContent = weatherInfo.icon;
            container.querySelector('#weather-desc').textContent = weatherInfo.desc;
            container.querySelector('#feels-like').textContent = formatTemp(current.apparent_temperature);
            container.querySelector('#humidity').textContent = current.relative_humidity_2m + '%';
            container.querySelector('#wind').textContent = current.wind_speed_10m + ' km/h';
            container.querySelector('#pressure').textContent = current.pressure_msl + ' hPa';
        }

        // Daily forecast
        if (data.daily) {
            const forecastList = container.querySelector('#forecast-list');
            forecastList.innerHTML = '';
            
            for (let i = 0; i < data.daily.time.length; i++) {
                const date = new Date(data.daily.time[i]);
                const dayName = i === 0 ? 'Aujourd\'hui' : 
                               i === 1 ? 'Demain' : 
                               date.toLocaleDateString('fr-FR', { weekday: 'short' });
                
                const weatherInfo = getWeatherInfo(data.daily.weather_code[i]);
                
                const item = document.createElement('div');
                item.className = 'forecast-item';
                item.innerHTML = `
                    <span class="forecast-day">${dayName}</span>
                    <span class="forecast-icon">${weatherInfo.icon}</span>
                    <div class="forecast-temps">
                        <span class="temp-max">${formatTempShort(data.daily.temperature_2m_max[i])}</span>
                        <span class="temp-min">${formatTempShort(data.daily.temperature_2m_min[i])}</span>
                    </div>
                `;
                forecastList.appendChild(item);
            }
        }

        // Hourly
        if (data.hourly) {
            const hourlyList = container.querySelector('#hourly-list');
            hourlyList.innerHTML = '';
            
            // Show next 12 hours
            const now = new Date();
            let count = 0;
            
            for (let i = 0; i < data.hourly.time.length && count < 12; i++) {
                const hourTime = new Date(data.hourly.time[i]);
                if (hourTime >= now) {
                    const weatherInfo = getWeatherInfo(data.hourly.weather_code[i]);
                    const hourStr = hourTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                    
                    const item = document.createElement('div');
                    item.className = 'hourly-item';
                    item.innerHTML = `
                        <div class="hourly-time">${hourStr}</div>
                        <div class="hourly-icon">${weatherInfo.icon}</div>
                        <div class="hourly-temp">${formatTempShort(data.hourly.temperature_2m[i])}</div>
                    `;
                    hourlyList.appendChild(item);
                    count++;
                }
            }
        }
    }

    // Initial load
    fetchWeather();
}

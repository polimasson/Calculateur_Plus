export function init(container) {
    const searchInput = container.querySelector('#search-input');
    const suggestionsBox = container.querySelector('#autocomplete-results');
    const latInput = container.querySelector('#lat-input');
    const lonInput = container.querySelector('#lon-input');
    const geoBtn = container.querySelector('#geo-btn');
    const startDate = container.querySelector('#start-date');
    const endDate = container.querySelector('#end-date');
    const fetchBtn = container.querySelector('#fetch-btn');
    const jsonRaw = container.querySelector('#json-raw');
    const visualRender = container.querySelector('#visual-render');

    // Dictionnaire pour traduire les variables de l'API en français
const labels = {
    // Actuel & Horaire
    temperature_2m: "Température",
    apparent_temperature: "Ressenti",
    relative_humidity_2m: "Humidité",
    dew_point_2m: "Pt Rosée",
    pressure_msl: "Pression",
    cloud_cover: "Nuages",
    cloud_cover_low: "Nuages bas",
    visibility: "Visibilité",
    wind_speed_10m: "Vent (10m)",
    wind_speed_80m: "Vent (80m)",
    wind_speed_180m: "Vent (180m)",
    wind_gusts_10m: "Rafales",
    uv_index: "Indice UV",
    soil_temperature_0cm: "Temp. Sol",
    soil_moisture_0_to_1cm: "Humidité Sol",
    // Quotidien
    temperature_2m_max: "Temp Max",
    temperature_2m_min: "Temp Min",
    apparent_temperature_max: "Ressenti Max",
    precipitation_sum: "Pluie Totale",
    rain_sum: "Pluie",
    snowfall_sum: "Neige",
    precipitation_hours: "Heures de pluie",
    sunrise: "Lever",
    sunset: "Coucher",
    daylight_duration: "Durée jour",
    uv_index_max: "UV Max",
    weather_code: "Météo"
};

// --- LE TRADUCTEUR DE CODES WMO ---
function getWeatherDesc(code) {
    const codes = {
        0: "☀️ Ciel dégagé",
        1: "🌤️ Majoritairement dégagé", 2: "⛅ Partiellement nuageux", 3: "☁️ Couvert",
        45: "🌫️ Brouillard", 48: "🌫️ Brouillard givrant",
        51: "🌧️ Bruine légère", 53: "🌧️ Bruine modérée", 55: "🌧️ Bruine dense",
        61: "🌧️ Pluie faible", 63: "🌧️ Pluie modérée", 65: "🌧️ Pluie forte",
        71: "❄️ Neige faible", 73: "❄️ Neige modérée", 75: "❄️ Neige forte",
        80: "🌦️ Averses de pluie faibles", 81: "🌦️ Averses modérées", 82: "🌦️ Averses violentes",
        95: "⛈️ Orage", 96: "⛈️ Orage avec grêle", 99: "⛈️ Orage fort"
    };
    return codes[code] || `Code ${code}`;
}

    function getLabel(key) {
        return labels[key] || key.replace(/_/g, ' ');
    }

    // --- 1. INITIALISATION DES DATES ---
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    startDate.value = today.toISOString().split('T')[0];
    endDate.value = nextWeek.toISOString().split('T')[0];

    // --- 2. AUTO-COMPLÉTION ---
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
                        });
                        suggestionsBox.appendChild(div);
                    });
                    suggestionsBox.classList.remove('hidden');
                } else {
                    suggestionsBox.classList.add('hidden');
                }
            } catch (err) { console.error(err); }
        }, 300);
    });

    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
            suggestionsBox.classList.add('hidden');
        }
    });

    // --- 3. BOUTON GPS ---
    geoBtn.addEventListener('click', () => {
        if (navigator.geolocation) {
            geoBtn.innerText = "⏳";
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    latInput.value = pos.coords.latitude.toFixed(4);
                    lonInput.value = pos.coords.longitude.toFixed(4);
                    searchInput.value = "📍 Position GPS";
                    geoBtn.innerText = "🎯";
                },
                () => { alert("Erreur GPS"); geoBtn.innerText = "🎯"; }
            );
        }
    });

    // --- 4. RÉCUPÉRATION ET AFFICHAGE DYNAMIQUE ---
    fetchBtn.addEventListener('click', async () => {
        const lat = latInput.value;
        const lon = lonInput.value;
        const start = startDate.value;
        const end = endDate.value;

        if (!lat || !lon) {
            alert("Veuillez sélectionner un lieu ou entrer Latitude/Longitude.");
            return;
        }

        const currents = Array.from(container.querySelectorAll('.var-current:checked')).map(cb => cb.value).join(',');
        const hourlies = Array.from(container.querySelectorAll('.var-hourly:checked')).map(cb => cb.value).join(',');
        const dailies = Array.from(container.querySelectorAll('.var-daily:checked')).map(cb => cb.value).join(',');

        let url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&start_date=${start}&end_date=${end}&timezone=auto`;
        if (currents) url += `&current=${currents}`;
        if (hourlies) url += `&hourly=${hourlies}`;
        if (dailies) url += `&daily=${dailies}`;

        jsonRaw.innerText = ">> Chargement en cours...";
        visualRender.innerHTML = "<p>Traitement des données...</p>";

        try {
            const res = await fetch(url);
            const data = await res.json();
            
            // Affichage du JSON brut pour le debug
            jsonRaw.innerText = JSON.stringify(data, null, 2);

            // --- CONSTRUCTION DYNAMIQUE DU HTML ---
            let html = `<h3>🌤 Résultats Météo</h3><hr>`;

            // Fonction utilitaire de formatage interne pour éviter la répétition
            const formatVal = (key, val, unit = "") => {
                if (val === null || val === undefined) return "-";
                if (key === 'weather_code') return getWeatherDesc(val);
                if (key === 'is_day') return val === 1 ? '☀️ Jour' : '🌙 Nuit';
                if (key.includes('duration')) return (val / 3600).toFixed(1) + " h"; // Secondes -> Heures
                if (key.includes('sunrise') || key.includes('sunset')) {
                    return typeof val === 'string' ? val.split('T')[1] : val;
                }
                return `${val} ${unit}`;
            };

            // 1. BLOC : ACTUEL
            if (data.current) {
                html += `<div class="render-block"><h4>📍 Actuellement</h4><ul style="list-style:none; padding:0; display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;">`;
                for (let key in data.current) {
                    if (key !== 'time' && key !== 'interval') {
                        const label = getLabel(key);
                        const displayVal = formatVal(key, data.current[key], data.current_units[key]);
                        html += `<li style="background:#096c6c; padding:8px; border-radius:5px;"><b>${label} :</b><br>${displayVal}</li>`;
                    }
                }
                html += `</ul></div>`;
            }

            // 2. BLOC : QUOTIDIEN
            if (data.daily) {
                const keys = Object.keys(data.daily).filter(k => k !== 'time');
                html += `<div class="render-block"><h4>📅 Prévisions Quotidiennes</h4>
                         <div style="overflow-x:auto;"><table border="1" style="width:100%; text-align:center; border-collapse:collapse; margin-bottom:20px;">
                         <thead style="background:#4a90e2; color:white;"><tr><th>Date</th>`;
                
                keys.forEach(k => {
                    html += `<th>${getLabel(k)}</th>`;
                });
                html += `</tr></thead><tbody>`;

                for (let i = 0; i < data.daily.time.length; i++) {
                    // Petit formatage de date plus sympa
                    const date = new Date(data.daily.time[i]).toLocaleDateString('fr-FR', {weekday: 'short', day: 'numeric', month: 'short'});
                    html += `<tr><td style="background:#555;"><b>${date}</b></td>`;
                    keys.forEach(k => {
                        const displayVal = formatVal(k, data.daily[k][i], data.daily_units[k]);
                        html += `<td>${displayVal}</td>`;
                    });
                    html += `</tr>`;
                }
                html += `</tbody></table></div></div>`;
            }

            // 3. BLOC : HORAIRE
            if (data.hourly) {
                const keys = Object.keys(data.hourly).filter(k => k !== 'time');
                html += `<div class="render-block"><h4>⏱️ Détails Horaires</h4>
                         <div style="overflow-x:auto; max-height:400px; border:1px solid #ccc; border-radius:8px;">
                         <table border="1" style="width:100%; text-align:center; border-collapse:collapse;">
                         <thead style="background:#555; color:white; position:sticky; top:0;"><tr><th>Heure</th>`;
                
                keys.forEach(k => {
                    html += `<th>${getLabel(k)}</th>`;
                });
                html += `</tr></thead><tbody>`;

                for (let i = 0; i < data.hourly.time.length; i++) {
                    const timeObj = new Date(data.hourly.time[i]);
                    const timeStr = timeObj.toLocaleString('fr-FR', {day:'2-digit', hour: '2-digit', minute:'2-digit'});
                    
                    // On grise un peu les lignes de nuit pour la lisibilité
                    const hour = timeObj.getHours();
                    const rowStyle = (hour < 6 || hour > 21) ? 'style="background:#f2f2f2; color:#888;"' : '';

                    html += `<tr ${rowStyle}><td><b>${timeStr}</b></td>`;
                    keys.forEach(k => {
                        const displayVal = formatVal(k, data.hourly[k][i], data.hourly_units[k]);
                        html += `<td>${displayVal}</td>`;
                    });
                    html += `</tr>`;
                }
                html += `</tbody></table></div></div>`;
            }

            visualRender.innerHTML = html;

        } catch (err) {
            console.error(err);
            jsonRaw.innerText = "ERREUR : " + err.message;
            visualRender.innerHTML = `<div style="color:red; padding:20px; border:1px solid red;">
                <b>⚠️ Erreur lors de la requête :</b><br>${err.message}
            </div>`;
        }
    });
}
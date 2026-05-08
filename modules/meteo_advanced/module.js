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
    const themeToggle = container.querySelector('#theme-toggle');
    const exportCsv = container.querySelector('#export-csv');
    const useFahrenheit = container.querySelector('#use-fahrenheit');
    const useMph = container.querySelector('#use-mph');
    let currentData = null;

    // Dictionnaire pour traduire les variables de l'API en français
const labels = {
    // === ACTUEL & HORAIRE ===
    // Températures
    temperature_2m: "Température (2m)",
    temperature_80m: "Température (80m)",
    temperature_120m: "Température (120m)",
    temperature_180m: "Température (180m)",
    apparent_temperature: "Ressenti",
    dew_point_2m: "Point de rosée",
    wet_bulb_temperature_2m: "Temp. thermomètre mouillé",
    surface_temperature: "Temp. surface",
    skin_temperature: "Temp. peau",
    freezing_level_height: "Altitude gel",
    
    // Humidité
    relative_humidity_2m: "Humidité (2m)",
    relative_humidity_80m: "Humidité (80m)",
    relative_humidity_120m: "Humidité (120m)",
    relative_humidity_180m: "Humidité (180m)",
    vapor_pressure_deficit: "Déficit pression vapeur",
    
    // Pression
    pressure_msl: "Pression (mer)",
    surface_pressure: "Pression (surface)",
    
    // Vent
    wind_speed_10m: "Vent (10m)",
    wind_speed_80m: "Vent (80m)",
    wind_speed_120m: "Vent (120m)",
    wind_speed_180m: "Vent (180m)",
    wind_direction_10m: "Direction (10m)",
    wind_direction_80m: "Direction (80m)",
    wind_direction_120m: "Direction (120m)",
    wind_direction_180m: "Direction (180m)",
    wind_gusts_10m: "Rafales (10m)",
    
    // Nuages
    cloud_cover: "Couverture nuageuse",
    cloud_cover_low: "Nuages bas",
    cloud_cover_mid: "Nuages moyens",
    cloud_cover_high: "Nuages hauts",
    cloud_base: "Base nuages",
    cloud_top: "Sommet nuages",
    ceiling: "Plafond",
    convective_cloud_base: "Base nuages convectifs",
    convective_cloud_top: "Sommet nuages convectifs",
    
    // Précipitations
    precipitation: "Précipitations",
    precipitation_probability: "Probabilité précipitations",
    rain: "Pluie",
    rain_probability: "Probabilité pluie",
    showers: "Averses",
    showers_probability: "Probabilité averses",
    snowfall: "Chutes de neige",
    snowfall_probability: "Probabilité neige",
    snow_depth: "Épaisseur neige",
    snow_depth_water_equivalent: "Équivalent eau neige",
    precipitation_rain: "Précipitations pluie",
    
    // Rayonnement solaire
    shortwave_radiation: "Rayonnement court",
    shortwave_radiation_instant: "Ray. court instantané",
    shortwave_radiation_clear_sky: "Ray. ciel dégagé",
    shortwave_radiation_clear_sky_instant: "Ray. ciel dég. instant",
    direct_radiation: "Rayonnement direct",
    direct_radiation_instant: "Ray. direct instantané",
    diffuse_radiation: "Rayonnement diffus",
    diffuse_radiation_instant: "Ray. diffus instantané",
    direct_normal_irradiance: "DNI",
    direct_normal_irradiance_instant: "DNI instantané",
    global_tilted_irradiance: "GTI",
    global_tilted_irradiance_instant: "GTI instantané",
    terrestrial_radiation: "Rayonnement terrestre",
    terrestrial_radiation_instant: "Ray. terrestre instant",
    
    // Rayonnement long
    longwave_radiation: "Rayonnement long",
    longwave_radiation_instant: "Ray. long instantané",
    longwave_radiation_clear_sky: "Ray. long ciel dégagé",
    
    // UV
    uv_index: "Indice UV",
    uv_index_clear_sky: "UV ciel dégagé",
    
    // Atmosphère
    cape: "CAPE",
    convective_inhibition: "CIN",
    lifted_index: "Lifted Index",
    equilibrium_level_pressure: "Pression niveau équilibre",
    lightning_potential: "Potentiel foudre",
    lightning_density: "Densité foudre",
    
    // Visibilité
    visibility: "Visibilité",
    is_day: "Jour/Nuit",
    weather_code: "Code météo",
    
    // Sol
    soil_temperature_0cm: "Temp. sol (0cm)",
    soil_temperature_6cm: "Temp. sol (6cm)",
    soil_temperature_18cm: "Temp. sol (18cm)",
    soil_temperature_54cm: "Temp. sol (54cm)",
    soil_moisture_0_to_1cm: "Humidité sol (0-1cm)",
    soil_moisture_1_to_3cm: "Humidité sol (1-3cm)",
    soil_moisture_3_to_9cm: "Humidité sol (3-9cm)",
    soil_moisture_9_to_27cm: "Humidité sol (9-27cm)",
    soil_moisture_27_to_81cm: "Humidité sol (27-81cm)",
    
    // Hydrologie
    runoff: "Ruissellement",
    evapotranspiration: "Évapotranspiration",
    et0_fao_evapotranspiration: "ET0 FAO",
    
    // Géopotentiel
    geopotential_height_1000hPa: "Hauteur géopot. 1000hPa",
    geopotential_height_800hPa: "Hauteur géopot. 800hPa",
    geopotential_height_500hPa: "Hauteur géopot. 500hPa",
    
    // === NIVEAUX DE PRESSION ===
    // Températures par niveau
    temperature_1000hPa: "Temp. 1000hPa",
    temperature_925hPa: "Temp. 925hPa",
    temperature_850hPa: "Temp. 850hPa",
    temperature_700hPa: "Temp. 700hPa",
    temperature_500hPa: "Temp. 500hPa",
    temperature_400hPa: "Temp. 400hPa",
    temperature_300hPa: "Temp. 300hPa",
    temperature_250hPa: "Temp. 250hPa",
    temperature_200hPa: "Temp. 200hPa",
    temperature_150hPa: "Temp. 150hPa",
    temperature_100hPa: "Temp. 100hPa",
    temperature_50hPa: "Temp. 50hPa",
    temperature_30hPa: "Temp. 30hPa",
    temperature_20hPa: "Temp. 20hPa",
    temperature_10hPa: "Temp. 10hPa",
    
    // Humidité par niveau
    relative_humidity_1000hPa: "Humidité 1000hPa",
    relative_humidity_925hPa: "Humidité 925hPa",
    relative_humidity_850hPa: "Humidité 850hPa",
    relative_humidity_700hPa: "Humidité 700hPa",
    relative_humidity_500hPa: "Humidité 500hPa",
    relative_humidity_400hPa: "Humidité 400hPa",
    relative_humidity_300hPa: "Humidité 300hPa",
    relative_humidity_250hPa: "Humidité 250hPa",
    relative_humidity_200hPa: "Humidité 200hPa",
    relative_humidity_150hPa: "Humidité 150hPa",
    relative_humidity_100hPa: "Humidité 100hPa",
    relative_humidity_50hPa: "Humidité 50hPa",
    relative_humidity_30hPa: "Humidité 30hPa",
    relative_humidity_20hPa: "Humidité 20hPa",
    relative_humidity_10hPa: "Humidité 10hPa",
    
    // Point de rosée par niveau
    dew_point_1000hPa: "Pt rosée 1000hPa",
    dew_point_925hPa: "Pt rosée 925hPa",
    dew_point_850hPa: "Pt rosée 850hPa",
    dew_point_700hPa: "Pt rosée 700hPa",
    dew_point_500hPa: "Pt rosée 500hPa",
    dew_point_400hPa: "Pt rosée 400hPa",
    dew_point_300hPa: "Pt rosée 300hPa",
    dew_point_250hPa: "Pt rosée 250hPa",
    dew_point_200hPa: "Pt rosée 200hPa",
    dew_point_150hPa: "Pt rosée 150hPa",
    dew_point_100hPa: "Pt rosée 100hPa",
    dew_point_50hPa: "Pt rosée 50hPa",
    dew_point_30hPa: "Pt rosée 30hPa",
    dew_point_20hPa: "Pt rosée 20hPa",
    dew_point_10hPa: "Pt rosée 10hPa",
    
    // Nuages par niveau
    cloud_cover_1000hPa: "Nuages 1000hPa",
    cloud_cover_925hPa: "Nuages 925hPa",
    cloud_cover_850hPa: "Nuages 850hPa",
    cloud_cover_700hPa: "Nuages 700hPa",
    cloud_cover_500hPa: "Nuages 500hPa",
    cloud_cover_400hPa: "Nuages 400hPa",
    cloud_cover_300hPa: "Nuages 300hPa",
    cloud_cover_250hPa: "Nuages 250hPa",
    cloud_cover_200hPa: "Nuages 200hPa",
    cloud_cover_150hPa: "Nuages 150hPa",
    cloud_cover_100hPa: "Nuages 100hPa",
    cloud_cover_50hPa: "Nuages 50hPa",
    cloud_cover_30hPa: "Nuages 30hPa",
    cloud_cover_20hPa: "Nuages 20hPa",
    cloud_cover_10hPa: "Nuages 10hPa",
    
    // Vent par niveau
    wind_speed_1000hPa: "Vent 1000hPa",
    wind_speed_925hPa: "Vent 925hPa",
    wind_speed_850hPa: "Vent 850hPa",
    wind_speed_700hPa: "Vent 700hPa",
    wind_speed_500hPa: "Vent 500hPa",
    wind_speed_400hPa: "Vent 400hPa",
    wind_speed_300hPa: "Vent 300hPa",
    wind_speed_250hPa: "Vent 250hPa",
    wind_speed_200hPa: "Vent 200hPa",
    wind_speed_150hPa: "Vent 150hPa",
    wind_speed_100hPa: "Vent 100hPa",
    wind_speed_50hPa: "Vent 50hPa",
    wind_speed_30hPa: "Vent 30hPa",
    wind_speed_20hPa: "Vent 20hPa",
    wind_speed_10hPa: "Vent 10hPa",
    wind_direction_1000hPa: "Direction 1000hPa",
    wind_direction_925hPa: "Direction 925hPa",
    wind_direction_850hPa: "Direction 850hPa",
    wind_direction_700hPa: "Direction 700hPa",
    wind_direction_500hPa: "Direction 500hPa",
    wind_direction_400hPa: "Direction 400hPa",
    wind_direction_300hPa: "Direction 300hPa",
    wind_direction_250hPa: "Direction 250hPa",
    wind_direction_200hPa: "Direction 200hPa",
    wind_direction_150hPa: "Direction 150hPa",
    wind_direction_100hPa: "Direction 100hPa",
    wind_direction_50hPa: "Direction 50hPa",
    wind_direction_30hPa: "Direction 30hPa",
    wind_direction_20hPa: "Direction 20hPa",
    wind_direction_10hPa: "Direction 10hPa",
    
    // === QUOTIDIEN ===
    // Températures
    temperature_2m_max: "Temp. Max (2m)",
    temperature_2m_min: "Temp. Min (2m)",
    temperature_2m_mean: "Temp. Moy (2m)",
    apparent_temperature_max: "Ressenti Max",
    apparent_temperature_min: "Ressenti Min",
    apparent_temperature_mean: "Ressenti Moy",
    
    // Soleil
    sunrise: "Lever soleil",
    sunset: "Coucher soleil",
    daylight_duration: "Durée jour",
    sunshine_duration: "Durée ensoleillement",
    uv_index_max: "UV Max",
    uv_index_clear_sky_max: "UV ciel dégagé Max",
    shortwave_radiation_sum: "Ray. court total",
    
    // Précipitations
    precipitation_sum: "Total précipitations",
    rain_sum: "Total pluie",
    showers_sum: "Total averses",
    snowfall_sum: "Total neige",
    precipitation_hours: "Heures de pluie",
    precipitation_probability_max: "Proba. max précipitations",
    
    // Vent
    wind_speed_10m_max: "Vent Max (10m)",
    wind_gusts_10m_max: "Rafales Max (10m)",
    wind_direction_10m_dominant: "Direction dominante (10m)",
    
    // Sol
    soil_moisture_0_to_10cm_mean: "Humidité sol (0-10cm)",
    soil_temperature_0_to_10cm_mean: "Temp. sol (0-10cm)"
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

    // --- 1.5 SAUVEGARDE DES PRÉFÉRENCES ---
    const loadPreferences = () => {
        const prefs = localStorage.getItem('meteo_prefs');
        if (prefs) {
            const data = JSON.parse(prefs);
            if (data.theme === 'light') {
                container.querySelector('.weather-builder').classList.add('light-mode');
                themeToggle.textContent = '☀️ Mode clair';
            }
            useFahrenheit.checked = data.useFahrenheit || false;
            useMph.checked = data.useMph || false;
        }
    };
    
    const savePreferences = () => {
        const prefs = {
            theme: container.querySelector('.weather-builder').classList.contains('light-mode') ? 'light' : 'dark',
            useFahrenheit: useFahrenheit.checked,
            useMph: useMph.checked
        };
        localStorage.setItem('meteo_prefs', JSON.stringify(prefs));
    };

    // Toggle theme
    themeToggle.addEventListener('click', () => {
        container.querySelector('.weather-builder').classList.toggle('light-mode');
        themeToggle.textContent = container.querySelector('.weather-builder').classList.contains('light-mode') ? '☀️ Mode clair' : '🌙 Mode sombre';
        savePreferences();
    });

    // Unit conversions
    useFahrenheit.addEventListener('change', savePreferences);
    useMph.addEventListener('change', savePreferences);

    // Load preferences on init
    loadPreferences();

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
                
                // Conversion unités
                let displayVal = val;
                let displayUnit = unit;
                
                if (useFahrenheit.checked && (key.includes('temperature') || key.includes('temp'))) {
                    displayVal = (val * 9/5 + 32).toFixed(1);
                    displayUnit = "°F";
                }
                
                if (useMph.checked && (key.includes('wind') || key.includes('speed'))) {
                    displayVal = (val * 0.621371).toFixed(1);
                    displayUnit = "mph";
                }
                
                return `${displayVal} ${displayUnit}`;
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
            
            // Store data for export
            currentData = data;
            
        } catch (err) {
            console.error(err);
            jsonRaw.innerText = "ERREUR : " + err.message;
            visualRender.innerHTML = `<div style="color:red; padding:20px; border:1px solid red;">
                <b>⚠️ Erreur lors de la requête :</b><br>${err.message}
            </div>`;
        }
    });

    // --- 5. EXPORT CSV ---
    exportCsv.addEventListener('click', () => {
        if (!currentData) {
            alert("Aucune donnée à exporter. Veuillez d'abord générer une requête.");
            return;
        }

        let csv = "Type,Date/Heure,Variable,Valeur,Unité\n";

        // Daily data
        if (currentData.daily) {
            for (let i = 0; i < currentData.daily.time.length; i++) {
                const date = currentData.daily.time[i];
                for (let key in currentData.daily) {
                    if (key !== 'time' && key !== 'interval') {
                        const val = currentData.daily[key][i];
                        const unit = currentData.daily_units[key] || '';
                        csv += `Daily,${date},${key},${val},${unit}\n`;
                    }
                }
            }
        }

        // Hourly data
        if (currentData.hourly) {
            for (let i = 0; i < currentData.hourly.time.length; i++) {
                const time = currentData.hourly.time[i];
                for (let key in currentData.hourly) {
                    if (key !== 'time' && key !== 'interval') {
                        const val = currentData.hourly[key][i];
                        const unit = currentData.hourly_units[key] || '';
                        csv += `Hourly,${time},${key},${val},${unit}\n`;
                    }
                }
            }
        }

        // Download
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `meteo_export_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    });

}
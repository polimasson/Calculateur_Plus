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
        temperature_2m: "Température",
        temperature_2m_max: "Temp Max",
        temperature_2m_min: "Temp Min",
        apparent_temperature: "Ressenti",
        relative_humidity_2m: "Humidité",
        wind_speed_10m: "Vent",
        wind_gusts_10m_max: "Rafales Max",
        precipitation_probability: "Proba. Pluie",
        precipitation_sum: "Total Pluie",
        cloud_cover: "Nuages",
        weather_code: "Code Météo",
        is_day: "Jour/Nuit",
        sunrise: "Lever soleil",
        sunset: "Coucher soleil"
    };

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
            jsonRaw.innerText = JSON.stringify(data, null, 2);

            // --- CONSTRUCTION DYNAMIQUE DU HTML ---
            let html = `<h3>🌤 Résultats Météo</h3><hr>`;

            // Bloc : Données Actuelles (Current)
            if (data.current) {
                html += `<div class="render-block"><h4>📍 Actuellement</h4><ul style="list-style:none; padding:0;">`;
                for (let key in data.current) {
                    if (key !== 'time' && key !== 'interval') {
                        let value = data.current[key];
                        // Remplacer 0/1 par Nuit/Jour pour "is_day"
                        if (key === 'is_day') value = value === 1 ? '☀️ Jour' : '🌙 Nuit';
                        
                        html += `<li><b>${getLabel(key)} :</b> ${value} ${data.current_units[key] || ''}</li>`;
                    }
                }
                html += `</ul></div>`;
            }

            // Bloc : Données Quotidiennes (Daily)
            if (data.daily) {
                const keys = Object.keys(data.daily).filter(k => k !== 'time');
                html += `<div class="render-block"><h4>📅 Quotidien</h4>
                         <div style="overflow-x:auto;"><table border="1" style="width:100%; text-align:center; border-collapse:collapse;">
                         <thead style="background:#eee;"><tr><th>Date</th>`;
                
                // En-têtes dynamiques
                keys.forEach(k => {
                    html += `<th>${getLabel(k)} (${data.daily_units[k]})</th>`;
                });
                html += `</tr></thead><tbody>`;

                // Lignes dynamiques
                for (let i = 0; i < data.daily.time.length; i++) {
                    html += `<tr><td><b>${data.daily.time[i]}</b></td>`;
                    keys.forEach(k => {
                        let val = data.daily[k][i];
                        // Formater les dates (comme sunrise/sunset) s'ils existent
                        if (val && typeof val === 'string' && val.includes('T')) {
                            val = val.split('T')[1]; // Garde juste l'heure
                        }
                        html += `<td>${val ?? '-'}</td>`;
                    });
                    html += `</tr>`;
                }
                html += `</tbody></table></div></div>`;
            }

            // Bloc : Données Horaires (Hourly)
            if (data.hourly) {
                const keys = Object.keys(data.hourly).filter(k => k !== 'time');
                html += `<div class="render-block"><h4>⏱️ Horaire</h4>
                         <div style="overflow-x:auto; max-height:300px; overflow-y:auto;">
                         <table border="1" style="width:100%; text-align:center; border-collapse:collapse;">
                         <thead style="background:#eee; position:sticky; top:0;"><tr><th>Heure</th>`;
                
                keys.forEach(k => {
                    html += `<th>${getLabel(k)} (${data.hourly_units[k]})</th>`;
                });
                html += `</tr></thead><tbody>`;

                for (let i = 0; i < data.hourly.time.length; i++) {
                    const timeObj = new Date(data.hourly.time[i]);
                    const timeStr = timeObj.toLocaleString('fr-FR', {day:'2-digit', month:'2-digit', hour: '2-digit', minute:'2-digit'});
                    
                    html += `<tr><td><b>${timeStr}</b></td>`;
                    keys.forEach(k => {
                        html += `<td>${data.hourly[k][i] ?? '-'}</td>`;
                    });
                    html += `</tr>`;
                }
                html += `</tbody></table></div></div>`;
            }

            visualRender.innerHTML = html;

        } catch (err) {
            jsonRaw.innerText = "ERREUR : " + err.message;
            visualRender.innerHTML = `<p style="color:red;">Une erreur est survenue lors de la récupération des données.</p>`;
        }
    });
}
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

    // --- 1. INITIALISATION DES DATES (Par défaut : Aujourd'hui -> +7 jours) ---
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    startDate.value = today.toISOString().split('T')[0];
    endDate.value = nextWeek.toISOString().split('T')[0];

    // --- 2. AUTO-COMPLÉTION DES VILLES (Avec Debounce pour ne pas spammer l'API) ---
    let timeoutId;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(timeoutId);
        const query = e.target.value.trim();
        
        if (query.length < 2) {
            suggestionsBox.classList.add('hidden');
            return;
        }

        // On attend 300ms après la dernière frappe avant de chercher
        timeoutId = setTimeout(async () => {
            try {
                const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=5&language=fr&format=json`);
                const data = await res.json();
                
                suggestionsBox.innerHTML = '';
                if (data.results) {
                    data.results.forEach(city => {
                        const div = document.createElement('div');
                        div.className = 'suggestion-item';
                        // Affiche : Paris, Île-de-France, France
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

    // Cacher les suggestions si on clique ailleurs
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

    // --- 4. RÉCUPÉRATION ET AFFICHAGE DES DONNÉES ---
    fetchBtn.addEventListener('click', async () => {
        const lat = latInput.value;
        const lon = lonInput.value;
        const start = startDate.value;
        const end = endDate.value;

        if (!lat || !lon) {
            alert("Veuillez sélectionner un lieu ou entrer Latitude/Longitude.");
            return;
        }

        // Récupérer dynamiquement toutes les checkboxes cochées !
        const currents = Array.from(container.querySelectorAll('.var-current:checked')).map(cb => cb.value).join(',');
        const hourlies = Array.from(container.querySelectorAll('.var-hourly:checked')).map(cb => cb.value).join(',');
        const dailies = Array.from(container.querySelectorAll('.var-daily:checked')).map(cb => cb.value).join(',');

        // Construction de l'URL selon ce qui a été coché
        let url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&start_date=${start}&end_date=${end}&timezone=auto`;
        if (currents) url += `&current=${currents}`;
        if (hourlies) url += `&hourly=${hourlies}`;
        if (dailies) url += `&daily=${dailies}`;

        jsonRaw.innerText = ">> Chargement en cours...";
        visualRender.innerHTML = "Traitement...";

        try {
            const res = await fetch(url);
            const data = await res.json();

            // Affichage Brut (Console JSON)
            jsonRaw.innerText = JSON.stringify(data, null, 2);

            // --- TON TERRAIN DE JEU POUR L'AFFICHAGE ---
            // C'est ici que tu pourras boucler et faire ton design plus tard.
            // Je t'ai mis une base propre pour parcourir ce qui a été trouvé.
            let html = `<h3>Résultats pour : ${lat}, ${lon}</h3>`;
            html += `<p>Période : ${start} au ${end}</p><hr>`;

            if (data.current) {
                html += `<h4>[ ACTUEL ]</h4>`;
                for (let key in data.current) {
                    if (key !== 'time' && key !== 'interval') {
                        html += `<div><b>${key} :</b> ${data.current[key]} ${data.current_units[key] || ''}</div>`;
                    }
                }
            }
            if (data.daily) {
                html += `<h4>[ QUOTIDIEN (${data.daily.time.length} jours) ]</h4>`;
                html += `<p><i>Les données sont dans le JSON à gauche. À toi de designer la boucle !</i></p>`;
            }

            visualRender.innerHTML = html;

        } catch (err) {
            jsonRaw.innerText = "ERREUR : " + err.message;
        }
    });
}
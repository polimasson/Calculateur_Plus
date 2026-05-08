export async function init(container) {
    setupKitchenConverter(container);
}

function setupKitchenConverter(container) {
    const tabBtns = container.querySelectorAll(".tab-btn");
    const tabContents = container.querySelectorAll(".tab-content");
    
    // Tab switching
    tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            tabBtns.forEach(b => b.classList.remove("active"));
            tabContents.forEach(c => c.classList.remove("active"));
            btn.classList.add("active");
            const tabId = btn.dataset.tab;
            container.querySelector(`#tab-${tabId}`).classList.add("active");
        });
    });
    
    // Volume conversion
    container.querySelector("#convertVolume").addEventListener("click", () => {
        convertVolume();
    });
    
    // Weight conversion
    container.querySelector("#convertWeight").addEventListener("click", () => {
        convertWeight();
    });
    
    // Temperature conversion
    container.querySelector("#convertTemp").addEventListener("click", () => {
        convertTemperature();
    });
    
    // Ingredient conversion
    container.querySelector("#convertIngredient").addEventListener("click", () => {
        convertIngredient();
    });
    
    // Generate oven temp table
    generateOvenTempTable();
    
    // Enter key support
    ["volumeInput", "weightInput", "tempInput", "ingredientInput"].forEach(id => {
        const el = container.querySelector(`#${id}`);
        if (el) {
            el.addEventListener("keypress", (e) => {
                if (e.key === "Enter") {
                    if (id === "volumeInput") convertVolume();
                    else if (id === "weightInput") convertWeight();
                    else if (id === "tempInput") convertTemperature();
                    else if (id === "ingredientInput") convertIngredient();
                }
            });
        }
    });
    
    function convertVolume() {
        const amount = parseFloat(container.querySelector("#volumeInput").value);
        const from = container.querySelector("#volumeFrom").value;
        const to = container.querySelector("#volumeTo").value;
        
        if (isNaN(amount)) {
            container.querySelector("#volumeResult").textContent = "Entrez une valeur";
            return;
        }
        
        // Convert to ml first
        const toMl = {
            ml: 1,
            cl: 10,
            dl: 100,
            l: 1000,
            tsp: 5,
            tbsp: 15,
            oz: 29.57,
            cup: 250,
            pt: 473,
            qt: 946,
            gal: 3785
        };
        
        const ml = amount * toMl[from];
        const result = ml / toMl[to];
        
        container.querySelector("#volumeResult").textContent = formatNumber(result);
    }
    
    function convertWeight() {
        const amount = parseFloat(container.querySelector("#weightInput").value);
        const from = container.querySelector("#weightFrom").value;
        const to = container.querySelector("#weightTo").value;
        
        if (isNaN(amount)) {
            container.querySelector("#weightResult").textContent = "Entrez une valeur";
            return;
        }
        
        // Convert to grams first
        const toGrams = {
            mg: 0.001,
            g: 1,
            kg: 1000,
            oz: 28.35,
            lb: 453.59
        };
        
        const grams = amount * toGrams[from];
        const result = grams / toGrams[to];
        
        container.querySelector("#weightResult").textContent = formatNumber(result);
    }
    
    function convertTemperature() {
        const amount = parseFloat(container.querySelector("#tempInput").value);
        const from = container.querySelector("#tempFrom").value;
        const to = container.querySelector("#tempTo").value;
        
        if (isNaN(amount)) {
            container.querySelector("#tempResult").textContent = "Entrez une valeur";
            return;
        }
        
        let result;
        let celsius;
        
        // Convert to Celsius first
        switch(from) {
            case "c": celsius = amount; break;
            case "f": celsius = (amount - 32) * 5/9; break;
            case "k": celsius = amount - 273.15; break;
            case "gas":
                // Gas mark to Celsius approximation
                const gasToC = {1: 135, 2: 150, 3: 170, 4: 180, 5: 190, 6: 200, 7: 220, 8: 230, 9: 240};
                celsius = gasToC[Math.round(amount)] || 180;
                break;
        }
        
        // Convert from Celsius to target
        switch(to) {
            case "c": result = celsius; break;
            case "f": result = (celsius * 9/5) + 32; break;
            case "k": result = celsius + 273.15; break;
            case "gas":
                const cToGas = [
                    [100, 1], [135, 2], [150, 3], [170, 4], [180, 5],
                    [190, 6], [200, 7], [220, 8], [230, 9], [250, 10]
                ];
                let closest;
                if (celsius <= 100) {
                    result = 1; // Minimum thermostat
                } else if (celsius >= 250) {
                    result = 10; // Maximum thermostat (plafonné à 250)
                } else {
                    closest = cToGas.reduce((prev, curr) => 
                        Math.abs(curr[0] - celsius) < Math.abs(prev[0] - celsius) ? curr : prev
                    );
                    result = closest[1];
                }
                break;
        }
        
        const suffix = to === "c" ? "°C" : to === "f" ? "°F" : to === "k" ? "K" : "";
        container.querySelector("#tempResult").textContent = formatNumber(result) + suffix;
    }
    
    function convertIngredient() {
        const ingredient = container.querySelector("#ingredientSelect").value;
        const amount = parseFloat(container.querySelector("#ingredientInput").value);
        const unit = container.querySelector("#ingredientUnit").value;
        
        if (isNaN(amount)) {
            container.querySelector("#ingredientResults").innerHTML = "<p>Entrez une valeur</p>";
            return;
        }
        
        // Densities (g per unit) - valeurs réelles
        const densities = {
            flour: { g: 1, cup: 120, tbsp: 7.5, tsp: 2.5, ml: 0.5 },
            sugar: { g: 1, cup: 200, tbsp: 12.5, tsp: 4.2, ml: 0.85 },
            butter: { g: 1, cup: 227, tbsp: 14.2, tsp: 4.7, ml: 0.91 },
            oil: { g: 1, cup: 218, tbsp: 14, tsp: 5, ml: 0.92 },
            milk: { g: 1, cup: 240, tbsp: 15, tsp: 5, ml: 1.03 },
            water: { g: 1, cup: 240, tbsp: 15, tsp: 5, ml: 1 },
            honey: { g: 1, cup: 340, tbsp: 21.2, tsp: 7.1, ml: 1.42 },
            salt: { g: 1, cup: 272, tbsp: 17.0, tsp: 5.7, ml: 2.17 },
            rice: { g: 1, cup: 185, tbsp: 12, tsp: 4, ml: 0.85 },
            oats: { g: 1, cup: 90, tbsp: 6, tsp: 2, ml: 0.34 },
            cocoa: { g: 1, cup: 100, tbsp: 6.2, tsp: 2.1, ml: 0.5 },
            yeast: { g: 1, cup: 160, tbsp: 10, tsp: 3, ml: 1 }
        };
        
        const ing = densities[ingredient];
        let grams;
        
        // Convert to grams first
        if (unit === "g") grams = amount;
        else if (unit === "kg") grams = amount * 1000;
        else grams = amount * ing[unit];
        
        // Calculate all conversions
        const conversions = [
            { unit: "g", value: grams },
            { unit: "kg", value: grams / 1000 },
            { unit: "cup", value: grams / ing.cup },
            { unit: "tbsp", value: grams / ing.tbsp },
            { unit: "tsp", value: grams / ing.tsp }
        ];
        
        const unitLabels = { g: "g", kg: "kg", cup: "tasses", tbsp: "c. à soupe", tsp: "c. à café" };
        
        container.querySelector("#ingredientResults").innerHTML = conversions.map(c => `
            <div class="ing-result-item">
                <span class="ing-value">${formatNumber(c.value)}</span>
                <span class="ing-unit">${unitLabels[c.unit]}</span>
            </div>
        `).join("");
    }
    
    function generateOvenTempTable() {
        const temps = [
            { c: 100, f: 212, desc: "Très bas" },
            { c: 135, f: 275, gas: 1, desc: "Bas" },
            { c: 150, f: 300, gas: 2, desc: "Bas" },
            { c: 160, f: 320, desc: "Modérément bas" },
            { c: 170, f: 325, gas: 3, desc: "Modéré" },
            { c: 180, f: 350, gas: 4, desc: "Modéré" },
            { c: 190, f: 375, gas: 5, desc: "Modérément chaud" },
            { c: 200, f: 400, gas: 6, desc: "Chaud" },
            { c: 220, f: 425, gas: 7, desc: "Chaud" },
            { c: 230, f: 450, gas: 8, desc: "Très chaud" },
            { c: 240, f: 475, gas: 9, desc: "Très chaud" }
        ];
        
        container.querySelector("#ovenTempTable").innerHTML = `
            <table class="oven-table">
                <tr><th>Celsius</th><th>Fahrenheit</th><th>Gas</th><th>Description</th></tr>
                ${temps.map(t => `
                    <tr>
                        <td>${t.c}°C</td>
                        <td>${t.f}°F</td>
                        <td>${t.gas || "-"}</td>
                        <td>${t.desc}</td>
                    </tr>
                `).join("")}
            </table>
        `;
    }
    
    function formatNumber(num) {
        if (num < 0.01) return num.toExponential(2);
        if (num < 1) return num.toFixed(2);
        if (num < 100) return num.toFixed(1);
        return Math.round(num).toString();
    }
}

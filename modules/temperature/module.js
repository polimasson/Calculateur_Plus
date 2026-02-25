/**
 * Module de conversion de température
 * Supporte la précision arbitraire via Decimal.js
 */

export async function init(container) {
    // 1. Vérifier ou charger Decimal.js
    if (typeof Decimal === "undefined") {
        await loadScript("dependencies/decimal.js");
    }

    setup(container);
}

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

function setup(container) {
    // On part du principe que main.js a déjà injecté module.html dans container
    
    const units = {
        C: "Celsius (°C)",
        F: "Fahrenheit (°F)",
        K: "Kelvin (K)",
        R: "Rankine (°R)",
        Ro: "Rømer (°Rø)",
        Re: "Réaumur (°Ré)",
        D: "Delisle (°D)",
        N: "Échelle de Newton (°N)"
    };

    const fromSelect = container.querySelector("#from");
    const toSelect = container.querySelector("#to");
    const btnConvert = container.querySelector("#btn-convert"); // Ajoute un ID ou sélectionne le bouton

    // Remplissage des sélecteurs
    const populate = (select) => {
        for (let key in units) {
            let option = document.createElement("option");
            option.value = key;
            option.textContent = units[key];
            select.appendChild(option);
        }
    };

    if(fromSelect && toSelect) {
        populate(fromSelect);
        populate(toSelect);
    }

    // Fonctions de calcul internes
    const toCelsius = (value, from) => {
        value = new Decimal(value);
        switch(from) {
            case "C": return value;
            case "F": return value.minus(32).mul(5).div(9);
            case "K": return value.minus(273.15);
            case "R": return value.mul(5).div(9).minus(273.15);
            case "Ro": return value.minus(7.5).mul(40).div(21);
            case "Re": return value.mul(5).div(4);
            case "D": return new Decimal(100).minus(value.mul(2).div(3));
            case "N": return value.mul(100).div(33);
            default: return value;
        }
    };

    const fromCelsius = (value, to) => {
        switch(to) {
            case "C": return value;
            case "F": return value.mul(9).div(5).plus(32);
            case "K": return value.plus(273.15);
            case "R": return value.plus(273.15).mul(9).div(5);
            case "Ro": return value.mul(21).div(40).plus(7.5);
            case "Re": return value.mul(4).div(5);
            case "D": return new Decimal(100).minus(value).mul(3).div(2);
            case "N": return value.mul(33).div(100);
            default: return value;
        }
    };

    // La fonction de conversion attachée à l'événement du bouton
    const performConversion = () => {
        const inputVal = container.querySelector("#input").value;
        if (!inputVal || isNaN(inputVal)) {
            container.querySelector("#result").innerText = "Erreur : valeur invalide";
            return;
        }

        const value = new Decimal(inputVal);
        const from = fromSelect.value;
        const to = toSelect.value;
        const precisionInput = container.querySelector("#precision-input");
        const precision = parseInt(precisionInput ? precisionInput.value : 2, 10);
        
        try {
            const valueInCelsius = toCelsius(value, from);
            const result = fromCelsius(valueInCelsius, to);
            
            // Formatage propre
            let resultStr = result.toFixed(precision);
            resultStr = resultStr.replace(/\.?0+$/, ''); // Supprime les zéros inutiles
            
            container.querySelector("#result").innerText = `Résultat : ${resultStr} ${to}`;
        } catch (error) {
            console.error(error);
            container.querySelector("#result").innerText = "Erreur de conversion";
        }
    };

    // On écoute le clic sur le bouton au lieu d'utiliser un onclick dans le HTML
    if (btnConvert) {
        btnConvert.addEventListener('click', performConversion);
    } else {
        // Fallback si tu préfères garder onclick="convert()" dans ton HTML :
        window.convert = performConversion;
    }
}
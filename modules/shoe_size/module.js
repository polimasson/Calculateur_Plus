export async function init(container) {
    setupShoeSizeModule(container);
}

function setupShoeSizeModule(container) {
    // Conversion button
    container.querySelector("#convertShoe").addEventListener("click", () => {
        convertShoeSize();
    });
    
    // Enter key support
    container.querySelector("#shoeSizeInput").addEventListener("keypress", (e) => {
        if (e.key === "Enter") convertShoeSize();
    });
    
    // Table tabs
    container.querySelectorAll(".table-tab").forEach(tab => {
        tab.addEventListener("click", () => {
            container.querySelectorAll(".table-tab").forEach(t => t.classList.remove("active"));
            container.querySelectorAll(".table-content").forEach(c => c.classList.remove("active"));
            tab.classList.add("active");
            container.querySelector(`#table-${tab.dataset.table}`).classList.add("active");
        });
    });
    
    // Generate tables on init
    generateSizeTables();
    
    function convertShoeSize() {
        const size = parseFloat(container.querySelector("#shoeSizeInput").value);
        const from = container.querySelector("#shoeSizeFrom").value;
        const type = container.querySelector("#shoeType").value;
        const gender = container.querySelector("#shoeGender").value;
        
        if (isNaN(size) || size <= 0) {
            alert("Veuillez entrer une pointure valide");
            return;
        }
        
        // Convert to CM first (standard base)
        let cm;
        switch(from) {
            case "eu":
                cm = euToCm(size, type);
                break;
            case "us":
                cm = usToCm(size, gender, type);
                break;
            case "uk":
                cm = ukToCm(size, type);
                break;
            case "cm":
                cm = size;
                break;
            case "in":
                cm = size * 2.54;
                break;
            case "mondo":
                cm = size / 10;
                break;
        }
        
        // Calculate all sizes from CM
        const eu = cmToEu(cm, type);
        const us = cmToUs(cm, gender, type);
        const uk = cmToUk(cm, type);
        
        // Display results
        container.querySelector("#resultEU").textContent = eu.toFixed(1);
        container.querySelector("#resultUS").textContent = us.toFixed(1);
        container.querySelector("#resultUK").textContent = uk.toFixed(1);
        container.querySelector("#resultCM").textContent = cm.toFixed(1);
        
        // Highlight result cards
        container.querySelectorAll(".result-card").forEach(card => {
            card.classList.remove("highlight");
        });
    }
    
    // Conversion formulas
    function euToCm(eu, type) {
        if (type === "baby") return (eu + 12) / 1.5;
        if (type === "child") return (eu + 12.5) / 1.5;
        return (eu * 2 / 3) + 0.5;
    }
    
    function usToCm(us, gender, type) {
        if (type === "baby") return (us + 7) * 0.84;
        if (type === "child") return (us + 7.5) * 0.84;
        if (gender === "women") return (us + 18) * 0.84;
        return (us + 17) * 0.84;
    }
    
    function ukToCm(uk, type) {
        if (type === "baby") return (uk + 6) * 0.84;
        if (type === "child") return (uk + 6.5) * 0.84;
        return (uk + 17) * 0.84;
    }
    
    function cmToEu(cm, type) {
        if (type === "baby") return (cm * 1.5) - 12;
        if (type === "child") return (cm * 1.5) - 12.5;
        return (cm - 0.5) * 1.5;
    }
    
    function cmToUs(cm, gender, type) {
        if (type === "baby") return (cm / 0.84) - 7;
        if (type === "child") return (cm / 0.84) - 7.5;
        if (gender === "women") return (cm / 0.84) - 18;
        return (cm / 0.84) - 17;
    }
    
    function cmToUk(cm, type) {
        if (type === "baby") return (cm / 0.84) - 6;
        if (type === "child") return (cm / 0.84) - 6.5;
        return (cm / 0.84) - 17;
    }
    
    function generateSizeTables() {
        // Adult table
        const adultData = [];
        for (let eu = 35; eu <= 50; eu += 0.5) {
            const cm = euToCm(eu, "adult");
            const usMen = cmToUs(cm, "men", "adult");
            const usWomen = cmToUs(cm, "women", "adult");
            const uk = cmToUk(cm, "adult");
            adultData.push({ eu, usWomen, usMen, uk, cm });
        }
        
        container.querySelector("#adultTableBody").innerHTML = adultData.map(row => `
            <tr>
                <td>${row.eu.toFixed(1)}</td>
                <td>${row.usWomen.toFixed(1)}</td>
                <td>${row.usMen.toFixed(1)}</td>
                <td>${row.uk.toFixed(1)}</td>
                <td>${row.cm.toFixed(1)}</td>
            </tr>
        `).join("");
        
        // Child table
        const childData = [];
        for (let eu = 24; eu <= 35; eu++) {
            const cm = euToCm(eu, "child");
            const us = cmToUs(cm, "unisex", "child");
            const uk = cmToUk(cm, "child");
            const age = Math.round((eu - 24) / 11 * 8 + 2);
            childData.push({ eu, us, uk, cm, age });
        }
        
        container.querySelector("#childTableBody").innerHTML = childData.map(row => `
            <tr>
                <td>${row.eu}</td>
                <td>${row.us.toFixed(1)}</td>
                <td>${row.uk.toFixed(1)}</td>
                <td>${row.cm.toFixed(1)}</td>
                <td>~${row.age} ans</td>
            </tr>
        `).join("");
        
        // Baby table
        const babyData = [
            { eu: "15", us: "0C", uk: "0", cm: "7.6", age: "0-3m" },
            { eu: "16", us: "1C", uk: "0.5", cm: "8.3", age: "3-6m" },
            { eu: "17", us: "2C", uk: "1.5", cm: "9.0", age: "6-9m" },
            { eu: "18", us: "3C", uk: "2.5", cm: "9.7", age: "9-12m" },
            { eu: "19", us: "4C", uk: "3.5", cm: "10.4", age: "12-18m" },
            { eu: "20", us: "5C", uk: "4.5", cm: "11.0", age: "18-24m" },
            { eu: "21", us: "6C", uk: "5.5", cm: "11.7", age: "2-3a" },
            { eu: "22", us: "7C", uk: "6.5", cm: "12.4", age: "3-4a" },
            { eu: "23", us: "8C", uk: "7.5", cm: "13.0", age: "4-5a" },
        ];
        
        container.querySelector("#babyTableBody").innerHTML = babyData.map(row => `
            <tr>
                <td>${row.eu}</td>
                <td>${row.us}</td>
                <td>${row.uk}</td>
                <td>${row.cm}</td>
                <td>${row.age}</td>
            </tr>
        `).join("");
    }
}

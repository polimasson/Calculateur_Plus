export async function init(container) {
    setupClothingSizeModule(container);
}

function setupClothingSizeModule(container) {
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
            updateSizeGuide(tabId);
        });
    });
    
    // Tops conversion
    container.querySelector("#convertTops").addEventListener("click", () => {
        convertTops();
    });
    
    // Bottoms conversion
    container.querySelector("#convertBottoms").addEventListener("click", () => {
        convertBottoms();
    });
    
    // Shirt conversion
    container.querySelector("#convertShirt").addEventListener("click", () => {
        convertShirt();
    });
    
    // Initial guide
    updateSizeGuide("tops");
    
    function convertTops() {
        const size = parseInt(container.querySelector("#topsSize").value);
        const from = container.querySelector("#topsFrom").value;
        const to = container.querySelector("#topsTo").value;
        const gender = container.querySelector("#topsGender").value;
        
        if (isNaN(size)) {
            showResult("topsResult", "Veuillez entrer une taille valide", true);
            return;
        }
        
        const result = convertSize(size, from, to, "tops", gender);
        showResult("topsResult", `Résultat : ${result}`, false);
    }
    
    function convertBottoms() {
        const size = parseInt(container.querySelector("#bottomsSize").value);
        const from = container.querySelector("#bottomsFrom").value;
        const to = container.querySelector("#bottomsTo").value;
        const gender = container.querySelector("#bottomsGender").value;
        
        if (isNaN(size)) {
            showResult("bottomsResult", "Veuillez entrer une taille valide", true);
            return;
        }
        
        const result = convertSize(size, from, to, "bottoms", gender);
        showResult("bottomsResult", `Résultat : ${result}`, false);
    }
    
    function convertShirt() {
        const collar = parseInt(container.querySelector("#shirtCollar").value);
        
        if (isNaN(collar) || collar < 30 || collar > 50) {
            alert("Veuillez entrer un tour de cou valide (30-50 cm)");
            return;
        }
        
        // Shirt collar size conversions
        const eu = collar;
        const usuk = Math.round(collar / 2.54);
        
        let intl = "-";
        if (collar < 35) intl = "XS";
        else if (collar < 37) intl = "S";
        else if (collar < 39) intl = "M";
        else if (collar < 41) intl = "L";
        else if (collar < 43) intl = "XL";
        else if (collar < 45) intl = "XXL";
        else intl = "XXXL";
        
        container.querySelector("#shirtEU").textContent = eu;
        container.querySelector("#shirtUS").textContent = `${usuk}'' (${usuk * 2.54} cm)`;
        container.querySelector("#shirtInt").textContent = intl;
    }
    
    function convertSize(size, from, to, type, gender) {
        // Convert to EU standard first
        let euSize;
        
        if (from === "eu") {
            euSize = size;
        } else if (from === "us") {
            euSize = size + ((gender === "women") ? 30 : 10);
        } else if (from === "uk") {
            euSize = size + ((gender === "women") ? 32 : 10);
        } else if (from === "fr") {
            euSize = size;
        } else if (from === "it") {
            euSize = size - 2;
        } else if (from === "waist") {
            euSize = waistToEU(size, gender);
        } else if (from === "hips") {
            euSize = hipsToEU(size, gender);
        }
        
        // Convert from EU to target
        if (to === "eu") return euSize;
        if (to === "us") return euSize - ((gender === "women") ? 30 : 10);
        if (to === "uk") return euSize - ((gender === "women") ? 32 : 10);
        if (to === "fr") return euSize;
        if (to === "it") return euSize + 2;
        if (to === "int") return euToInt(euSize, gender);
        
        return euSize;
    }
    
    function euToInt(euSize, gender) {
        let sizes;
        if (gender === "women") {
            sizes = [{eu: 34, int: "XS"}, {eu: 36, int: "S"}, {eu: 38, int: "M"}, 
                     {eu: 40, int: "L"}, {eu: 42, int: "XL"}, {eu: 44, int: "XXL"}];
        } else {
            sizes = [{eu: 44, int: "XS"}, {eu: 46, int: "S"}, {eu: 48, int: "M"}, 
                     {eu: 50, int: "L"}, {eu: 52, int: "XL"}, {eu: 54, int: "XXL"}];
        }
        
        const closest = sizes.reduce((prev, curr) => {
            return Math.abs(curr.eu - euSize) < Math.abs(prev.eu - euSize) ? curr : prev;
        });
        return closest.int;
    }
    
    function waistToEU(cm, gender) {
        if (gender === "women") {
            return Math.round(cm * 1.5);
        } else {
            return Math.round(cm * 1.2 + 20);
        }
    }
    
    function hipsToEU(cm, gender) {
        if (gender === "women") {
            return Math.round(cm * 0.6);
        } else {
            return Math.round(cm * 0.8);
        }
    }
    
    function showResult(elementId, message, isError) {
        const element = container.querySelector(`#${elementId}`);
        element.innerHTML = `<div class="result ${isError ? 'error' : 'success'}">${message}</div>`;
    }
    
    function updateSizeGuide(tab) {
        const guideContent = container.querySelector("#sizeGuideContent");
        
        if (tab === "tops") {
            guideContent.innerHTML = `
                <table class="guide-table">
                    <tr><th>EU</th><th>US</th><th>UK</th><th>Int</th></tr>
                    <tr><td>34-36</td><td>4-6</td><td>6-8</td><td>XS-S</td></tr>
                    <tr><td>38-40</td><td>8-10</td><td>10-12</td><td>M</td></tr>
                    <tr><td>42-44</td><td>12-14</td><td>14-16</td><td>L-XL</td></tr>
                </table>
            `;
        } else if (tab === "bottoms") {
            guideContent.innerHTML = `
                <table class="guide-table">
                    <tr><th>Tour taille (cm)</th><th>EU</th><th>US</th><th>UK</th></tr>
                    <tr><td>60-64</td><td>34</td><td>2</td><td>6</td></tr>
                    <tr><td>65-69</td><td>36</td><td>4</td><td>8</td></tr>
                    <tr><td>70-74</td><td>38</td><td>6</td><td>10</td></tr>
                    <tr><td>75-79</td><td>40</td><td>8</td><td>12</td></tr>
                    <tr><td>80-84</td><td>42</td><td>10</td><td>14</td></tr>
                </table>
            `;
        } else {
            guideContent.innerHTML = `
                <table class="guide-table">
                    <tr><th>Tour cou (cm)</th><th>EU</th><th>US/UK</th><th>Int</th></tr>
                    <tr><td>36-37</td><td>37</td><td>14.5''</td><td>S</td></tr>
                    <tr><td>38-39</td><td>39</td><td>15.5''</td><td>M</td></tr>
                    <tr><td>40-41</td><td>41</td><td>16''</td><td>L</td></tr>
                    <tr><td>42-43</td><td>43</td><td>17''</td><td>XL</td></tr>
                </table>
            `;
        }
    }
}

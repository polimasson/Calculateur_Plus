export async function init(container) {
    setupCalculator(container);
}

function setupCalculator(container) {
    const tabBtns = container.querySelectorAll(".tab-btn");
    const tabContents = container.querySelectorAll(".tab-content");

    // Tab switching
    tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            tabBtns.forEach(b => b.classList.remove("active"));
            tabContents.forEach(c => c.classList.remove("active"));
            btn.classList.add("active");
            container.querySelector(`#tab-${btn.dataset.tab}`).classList.add("active");
        });
    });

    // Format currency (using generic currency symbol ¤)
    const formatCurrency = (num) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(num) + ' ¤';
    };

    // Format number
    const formatNumber = (num, decimals = 2) => {
        return new Intl.NumberFormat('fr-FR', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(num);
    };

    // LOAN CALCULATION
    const calculateLoan = () => {
        const principal = parseFloat(container.querySelector("#loanAmount").value);
        const annualRate = parseFloat(container.querySelector("#loanRate").value);
        const years = parseInt(container.querySelector("#loanYears").value);

        if (!principal || !annualRate || !years) {
            alert("Veuillez remplir tous les champs");
            return;
        }

        const monthlyRate = annualRate / 100 / 12;
        const numPayments = years * 12;

        const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                              (Math.pow(1 + monthlyRate, numPayments) - 1);
        const totalPayment = monthlyPayment * numPayments;
        const totalInterest = totalPayment - principal;

        container.querySelector("#loanMonthly").textContent = formatCurrency(monthlyPayment);
        container.querySelector("#loanTotal").textContent = formatCurrency(totalPayment);
        container.querySelector("#loanInterest").textContent = formatCurrency(totalInterest);
        container.querySelector("#loanResult").classList.remove("hidden");

        // Générer le tableau d'amortissement
        generateAmortizationTable(principal, monthlyRate, numPayments, monthlyPayment);
        container.querySelector("#toggleAmortization").classList.remove("hidden");
        container.querySelector("#amortizationContainer").classList.add("hidden");
    };

    // Store all amortization data
    let fullAmortizationData = [];
    let isFullTableDisplayed = false;
    let currentNumPayments = 0;
    let currentMonthlyPayment = 0;

    // Generate amortization schedule
    const generateAmortizationTable = (principal, monthlyRate, numPayments, monthlyPayment, showFull = false) => {
        const tbody = container.querySelector("#amortizationTable tbody");
        tbody.innerHTML = "";
        
        let balance = principal;
        let year1Interest = 0;
        fullAmortizationData = [];
        currentNumPayments = numPayments;
        currentMonthlyPayment = monthlyPayment;
        isFullTableDisplayed = showFull;
        
        // Générer toutes les données
        for (let i = 1; i <= numPayments; i++) {
            const interestPayment = balance * monthlyRate;
            const principalPayment = monthlyPayment - interestPayment;
            balance = Math.max(0, balance - principalPayment);
            
            if (i <= 12) {
                year1Interest += interestPayment;
            }
            
            fullAmortizationData.push({
                month: i,
                balance: balance + principalPayment,
                payment: monthlyPayment,
                interest: interestPayment,
                principal: principalPayment,
                isLast: i === numPayments
            });
        }
        
        // Déterminer quelles lignes afficher
        const maxDisplayRows = 24;
        const shouldTruncate = numPayments > maxDisplayRows && !showFull;
        const loadAllBtn = container.querySelector("#loadAllBtn");
        
        // Afficher/masquer le bouton "Voir tout"
        if (numPayments > maxDisplayRows) {
            loadAllBtn.classList.remove("hidden");
            loadAllBtn.textContent = showFull ? "📋 Voir moins" : "📋 Voir tout";
        } else {
            loadAllBtn.classList.add("hidden");
        }
        
        // Générer les lignes HTML
        const rowsToRender = showFull ? fullAmortizationData : 
            fullAmortizationData.filter((row, index) => {
                return index < 12 || index === numPayments - 1 || (index >= 12 && index < 24);
            });
        
        rowsToRender.forEach(row => {
            const tr = document.createElement("tr");
            if (row.isLast) tr.classList.add("last-row");
            tr.innerHTML = `
                <td>${row.month}</td>
                <td>${formatCurrency(row.balance)}</td>
                <td>${formatCurrency(row.payment)}</td>
                <td>${formatCurrency(row.interest)}</td>
                <td>${formatCurrency(row.principal)}</td>
            `;
            tbody.appendChild(tr);
        });
        
        // Ajouter indicateur si tronqué
        if (shouldTruncate) {
            const tr = document.createElement("tr");
            tr.className = "ellipsis-row";
            tr.innerHTML = `<td colspan="5" class="ellipsis">··· ${numPayments - 24} mensualités masquées ···</td>`;
            tbody.appendChild(tr);
        }
        
        container.querySelector("#year1Interest").textContent = formatCurrency(year1Interest);
    };

    // Toggle amortization table visibility
    container.querySelector("#toggleAmortization").addEventListener("click", (e) => {
        const amortContainer = e.target.closest("#tab-loan").querySelector("#amortizationContainer");
        const isHidden = amortContainer.classList.contains("hidden");
        
        if (isHidden) {
            amortContainer.classList.remove("hidden");
            e.target.textContent = "📊 Masquer le tableau d'amortissement";
        } else {
            amortContainer.classList.add("hidden");
            e.target.textContent = "📊 Voir le tableau d'amortissement";
        }
    });

    // Toggle full/partial amortization table
    container.querySelector("#loadAllBtn").addEventListener("click", (e) => {
        isFullTableDisplayed = !isFullTableDisplayed;
        // Régénérer le tableau avec le nouvel état
        const principal = parseFloat(container.querySelector("#loanAmount").value);
        const annualRate = parseFloat(container.querySelector("#loanRate").value);
        const years = parseInt(container.querySelector("#loanYears").value);
        const monthlyRate = annualRate / 100 / 12;
        const numPayments = years * 12;
        const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                              (Math.pow(1 + monthlyRate, numPayments) - 1);
        generateAmortizationTable(principal, monthlyRate, numPayments, monthlyPayment, isFullTableDisplayed);
        
        // Scroll en haut du tableau
        container.querySelector(".amortization-table-wrapper").scrollTop = 0;
    });

    // COMPOUND INTEREST
    const calculateInterest = () => {
        const principal = parseFloat(container.querySelector("#interestPrincipal").value);
        const annualRate = parseFloat(container.querySelector("#interestRate").value);
        const years = parseInt(container.querySelector("#interestYears").value);
        const freq = parseInt(container.querySelector("#interestFreq").value);

        if (!principal || !annualRate || !years) {
            alert("Veuillez remplir tous les champs");
            return;
        }

        const ratePerPeriod = annualRate / 100 / freq;
        const numPeriods = years * freq;

        const finalAmount = principal * Math.pow(1 + ratePerPeriod, numPeriods);
        const interestEarned = finalAmount - principal;

        container.querySelector("#interestFinal").textContent = formatCurrency(finalAmount);
        container.querySelector("#interestEarned").textContent = formatCurrency(interestEarned);
        container.querySelector("#interestResult").classList.remove("hidden");
    };

    // INVESTMENT (with monthly contributions)
    const calculateInvestment = () => {
        const initial = parseFloat(container.querySelector("#invInitial").value) || 0;
        const monthly = parseFloat(container.querySelector("#invMonthly").value) || 0;
        const annualRate = parseFloat(container.querySelector("#invRate").value);
        const years = parseInt(container.querySelector("#invYears").value);

        if (!annualRate || !years) {
            alert("Veuillez remplir les champs obligatoires");
            return;
        }

        const monthlyRate = annualRate / 100 / 12;
        const numMonths = years * 12;

        // Future value of initial amount
        const fvInitial = initial * Math.pow(1 + monthlyRate, numMonths);

        // Future value of monthly contributions
        const fvMonthly = monthly * (Math.pow(1 + monthlyRate, numMonths) - 1) / monthlyRate;

        const finalValue = fvInitial + fvMonthly;
        const totalContributed = initial + (monthly * numMonths);
        const interestEarned = finalValue - totalContributed;

        container.querySelector("#invFinal").textContent = formatCurrency(finalValue);
        container.querySelector("#invContributed").textContent = formatCurrency(totalContributed);
        container.querySelector("#invInterest").textContent = formatCurrency(interestEarned);
        container.querySelector("#invResult").classList.remove("hidden");
    };

    // VAT CALCULATION
    const calculateVat = () => {
        const amount = parseFloat(container.querySelector("#vatAmount").value);
        let rate;
        
        const rateSelect = container.querySelector("#vatRate");
        if (rateSelect.value === "custom") {
            rate = parseFloat(container.querySelector("#vatCustomRate").value);
        } else {
            rate = parseFloat(rateSelect.value);
        }
        
        const direction = container.querySelector('input[name="vatDir"]:checked').value;

        if (!amount || isNaN(rate)) {
            alert("Veuillez entrer un montant et un taux valide");
            return;
        }

        let base, tax, total;

        if (direction === "add") {
            // HT to TTC
            base = amount;
            tax = base * rate / 100;
            total = base + tax;
            container.querySelector("#vatLabel1").textContent = "Montant HT:";
            container.querySelector("#vatLabel2").textContent = "Montant TTC:";
        } else {
            // TTC to HT
            total = amount;
            base = total / (1 + rate / 100);
            tax = total - base;
            container.querySelector("#vatLabel1").textContent = "Montant HT:";
            container.querySelector("#vatLabel2").textContent = "Montant TTC:";
        }

        container.querySelector("#vatBase").textContent = formatCurrency(base);
        container.querySelector("#vatTax").textContent = formatCurrency(tax);
        container.querySelector("#vatTotal").textContent = formatCurrency(total);
        container.querySelector("#vatResult").classList.remove("hidden");
    };

    // Bind calculator buttons
    container.querySelectorAll(".btn-calculate").forEach(btn => {
        btn.addEventListener("click", () => {
            const calcType = btn.dataset.calc;
            switch(calcType) {
                case "loan": calculateLoan(); break;
                case "interest": calculateInterest(); break;
                case "investment": calculateInvestment(); break;
                case "vat": calculateVat(); break;
            }
        });
    });

    // Handle custom VAT rate visibility
    const vatRateSelect = container.querySelector("#vatRate");
    const vatCustomInput = container.querySelector("#vatCustomRate");
    
    vatRateSelect.addEventListener("change", () => {
        if (vatRateSelect.value === "custom") {
            vatCustomInput.classList.remove("hidden");
            vatCustomInput.focus();
        } else {
            vatCustomInput.classList.add("hidden");
        }
    });

    // Auto-calculate on Enter key
    container.querySelectorAll("input, select").forEach(input => {
        input.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                const tab = input.closest(".tab-content");
                const btn = tab.querySelector(".btn-calculate");
                if (btn) btn.click();
            }
        });
    });
}

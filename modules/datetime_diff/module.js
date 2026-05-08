export async function init(container) {
    setupDateTimeDiff(container);
}

function setupDateTimeDiff(container) {
    const startDateInput = container.querySelector("#startDate");
    const endDateInput = container.querySelector("#endDate");
    const calculateBtn = container.querySelector("#calculateDiff");
    const swapBtn = container.querySelector("#swapDates");
    const resultContainer = container.querySelector("#resultContainer");
    const errorMessage = container.querySelector("#errorMessage");
    
    // Boutons "Maintenant"
    container.querySelectorAll(".btn-now").forEach(btn => {
        btn.addEventListener("click", () => {
            const targetId = btn.dataset.target;
            const input = container.querySelector(`#${targetId}`);
            const now = new Date();
            input.value = formatDateTimeLocal(now);
        });
    });
    
    // Calculer la différence
    calculateBtn.addEventListener("click", () => {
        calculateDifference();
    });
    
    // Inverser les dates
    swapBtn.addEventListener("click", () => {
        const temp = startDateInput.value;
        startDateInput.value = endDateInput.value;
        endDateInput.value = temp;
        if (startDateInput.value && endDateInput.value) {
            calculateDifference();
        }
    });
    
    // Calcul automatique si les deux dates sont remplies
    [startDateInput, endDateInput].forEach(input => {
        input.addEventListener("change", () => {
            if (startDateInput.value && endDateInput.value) {
                calculateDifference();
            }
        });
    });
    
    function formatDateTimeLocal(date) {
        const pad = (n) => n.toString().padStart(2, "0");
        const year = date.getFullYear();
        const month = pad(date.getMonth() + 1);
        const day = pad(date.getDate());
        const hour = pad(date.getHours());
        const minute = pad(date.getMinutes());
        const second = pad(date.getSeconds());
        return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
    }
    
    function calculateDifference() {
        const startValue = startDateInput.value;
        const endValue = endDateInput.value;
        
        if (!startValue || !endValue) {
            showError("Veuillez sélectionner les deux dates");
            return;
        }
        
        const startDate = new Date(startValue);
        const endDate = new Date(endValue);
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            showError("Dates invalides");
            return;
        }
        
        hideError();
        
        // Déterminer quelle date est la plus ancienne
        let earlier = startDate;
        let later = endDate;
        let direction = "future";
        
        if (startDate > endDate) {
            earlier = endDate;
            later = startDate;
            direction = "past";
        }
        
        // Calculer la différence
        const diff = calculateDateDiff(earlier, later);
        
        // Afficher les résultats
        displayResults(diff, direction, earlier, later);
    }
    
    function calculateDateDiff(start, end) {
        let years = end.getFullYear() - start.getFullYear();
        let months = end.getMonth() - start.getMonth();
        let days = end.getDate() - start.getDate();
        let hours = end.getHours() - start.getHours();
        let minutes = end.getMinutes() - start.getMinutes();
        let seconds = end.getSeconds() - start.getSeconds();
        
        // Ajuster les valeurs négatives
        if (seconds < 0) {
            seconds += 60;
            minutes--;
        }
        if (minutes < 0) {
            minutes += 60;
            hours--;
        }
        if (hours < 0) {
            hours += 24;
            days--;
        }
        if (days < 0) {
            // Jours dans le mois précédent
            const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
            days += prevMonth.getDate();
            months--;
        }
        if (months < 0) {
            months += 12;
            years--;
        }
        
        // Calcul des totaux
        const diffMs = end - start;
        const totalSeconds = Math.floor(diffMs / 1000);
        const totalMinutes = Math.floor(diffMs / (1000 * 60));
        const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
        const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        return {
            years,
            months,
            days,
            hours,
            minutes,
            seconds,
            totalDays,
            totalHours,
            totalMinutes,
            totalSeconds
        };
    }
    
    function displayResults(diff, direction, start, end) {
        const formatDate = (date) => {
            return date.toLocaleString("fr-FR", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            });
        };
        
        // Résumé
        const summaryEl = container.querySelector("#diffSummary");
        const startStr = formatDate(start);
        const endStr = formatDate(end);
        const directionText = direction === "future" ? "se sont écoulées" : "se sont écoulées";
        
        summaryEl.innerHTML = `
            <div class="summary-text">
                Entre <strong>${startStr}</strong> et <strong>${endStr}</strong><br>
                <span class="duration-text">${directionText} :</span>
            </div>
        `;
        
        // Valeurs détaillées
        container.querySelector("#yearsValue").textContent = diff.years;
        container.querySelector("#monthsValue").textContent = diff.months;
        container.querySelector("#daysValue").textContent = diff.days;
        container.querySelector("#hoursValue").textContent = diff.hours;
        container.querySelector("#minutesValue").textContent = diff.minutes;
        container.querySelector("#secondsValue").textContent = diff.seconds;
        
        // Totaux
        container.querySelector("#totalDays").textContent = diff.totalDays.toLocaleString("fr-FR");
        container.querySelector("#totalHours").textContent = diff.totalHours.toLocaleString("fr-FR");
        container.querySelector("#totalMinutes").textContent = diff.totalMinutes.toLocaleString("fr-FR");
        container.querySelector("#totalSeconds").textContent = diff.totalSeconds.toLocaleString("fr-FR");
        
        resultContainer.style.display = "block";
    }
    
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = "block";
        resultContainer.style.display = "none";
    }
    
    function hideError() {
        errorMessage.style.display = "none";
    }
}

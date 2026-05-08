export async function init(container) {
    setupCalculator(container);
}

function setupCalculator(container) {
    const weightInput = container.querySelector("#weightInput");
    const heightInput = container.querySelector("#heightInput");
    const calculateBtn = container.querySelector("#calculateBtn");
    const bmiResult = container.querySelector("#bmiResult");
    const bmiNumber = container.querySelector("#bmiNumber");
    const bmiCategory = container.querySelector("#bmiCategory");
    const bmiMessage = container.querySelector("#bmiMessage");
    const bmiIndicator = container.querySelector("#bmiIndicator");
    const scaleSections = container.querySelectorAll(".scale-section");

    const categories = [
        { min: 0, max: 18.5, name: "Maigreur", color: "#3498db", message: "Vous êtes en insuffisance pondérale. Pensez à consulter un professionnel de santé." },
        { min: 18.5, max: 25, name: "Corpulence normale", color: "#27ae60", message: "Votre poids est dans la fourchette normale. Continuez ainsi !" },
        { min: 25, max: 30, name: "Surpoids", color: "#f39c12", message: "Vous êtes en surpoids. Une alimentation équilibrée et de l'exercice peuvent aider." },
        { min: 30, max: 35, name: "Obésité modérée", color: "#e67e22", message: "Obésité de classe I. Consultez un professionnel de santé." },
        { min: 35, max: 40, name: "Obésité sévère", color: "#e74c3c", message: "Obésité de classe II. Un suivi médical est recommandé." },
        { min: 40, max: 100, name: "Obésité massive", color: "#c0392b", message: "Obésité de classe III. Consultez un médecin dès que possible." }
    ];

    function calculateBMI() {
        const weight = parseFloat(weightInput.value);
        const height = parseFloat(heightInput.value);

        if (!weight || !height || weight <= 0 || height <= 0) {
            alert("Veuillez entrer des valeurs valides");
            return;
        }

        const heightInMeters = height / 100;
        const bmi = weight / (heightInMeters * heightInMeters);
        const roundedBMI = Math.round(bmi * 10) / 10;

        displayResult(roundedBMI);
    }

    function displayResult(bmi) {
        const category = categories.find(c => bmi >= c.min && bmi < c.max) || categories[categories.length - 1];

        bmiNumber.textContent = bmi.toFixed(1);
        bmiCategory.textContent = category.name;
        bmiCategory.style.color = category.color;
        bmiMessage.textContent = category.message;

        bmiResult.classList.remove("hidden");

        // Positionner l'indicateur sur l'échelle
        // L'échelle va de 15 à 45 pour l'affichage
        const minDisplay = 15;
        const maxDisplay = 45;
        const percentage = Math.max(0, Math.min(100, ((bmi - minDisplay) / (maxDisplay - minDisplay)) * 100));
        bmiIndicator.style.left = percentage + "%";
        bmiIndicator.style.backgroundColor = category.color;

        // Animer l'apparition
        setTimeout(() => {
            bmiResult.classList.add("show");
        }, 10);
    }

    // Permettre le calcul avec Entrée
    weightInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") calculateBMI();
    });
    heightInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") calculateBMI();
    });

    calculateBtn.addEventListener("click", calculateBMI);

    // Calcul auto quand les deux champs sont remplis
    [weightInput, heightInput].forEach(input => {
        input.addEventListener("input", () => {
            if (weightInput.value && heightInput.value) {
                calculateBMI();
            }
        });
    });
}

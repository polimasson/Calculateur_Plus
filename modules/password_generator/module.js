export async function init(container) {
    setupGenerator(container);
}

function setupGenerator(container) {
    const passwordOutput = container.querySelector("#passwordOutput");
    const copyBtn = container.querySelector("#copyBtn");
    const lengthSlider = container.querySelector("#lengthSlider");
    const lengthValue = container.querySelector("#lengthValue");
    const uppercase = container.querySelector("#uppercase");
    const lowercase = container.querySelector("#lowercase");
    const numbers = container.querySelector("#numbers");
    const symbols = container.querySelector("#symbols");
    const generateBtn = container.querySelector("#generateBtn");
    const strengthBar = container.querySelector(".strength-bar");
    const strengthText = container.querySelector(".strength-text");
    const historyList = container.querySelector("#historyList");
    const clearHistoryBtn = container.querySelector("#clearHistoryBtn");

    const charSets = {
        uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        lowercase: "abcdefghijklmnopqrstuvwxyz",
        numbers: "0123456789",
        symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?"
    };

    let history = [];

    function generatePassword() {
        const length = parseInt(lengthSlider.value);
        let chars = "";
        let password = "";

        if (uppercase.checked) chars += charSets.uppercase;
        if (lowercase.checked) chars += charSets.lowercase;
        if (numbers.checked) chars += charSets.numbers;
        if (symbols.checked) chars += charSets.symbols;

        if (chars === "") {
            passwordOutput.value = "Sélectionnez au moins un type";
            return;
        }

        const array = new Uint32Array(length);
        crypto.getRandomValues(array);

        for (let i = 0; i < length; i++) {
            password += chars[array[i] % chars.length];
        }

        passwordOutput.value = password;
        updateStrength(password);
        addToHistory(password);
    }

    function updateStrength(password) {
        let score = 0;
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        const strength = score < 3 ? "faible" : score < 5 ? "moyen" : "fort";
        const colors = { faible: "#e74c3c", moyen: "#f39c12", fort: "#27ae60" };

        strengthBar.style.width = (score / 6 * 100) + "%";
        strengthBar.style.backgroundColor = colors[strength];
        strengthText.textContent = `Force: ${strength}`;
    }

    function addToHistory(password) {
        if (history.includes(password)) return;
        history.unshift(password);
        if (history.length > 5) history.pop();
        renderHistory();
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function renderHistory() {
        historyList.innerHTML = history.map((pwd, i) => `
            <div class="history-item">
                <span class="history-num">${i + 1}</span>
                <code class="history-pwd" title="${escapeHtml(pwd)}">${escapeHtml(pwd)}</code>
                <button class="btn-copy-history" data-pwd="${escapeHtml(pwd)}">📋</button>
            </div>
        `).join("");

        container.querySelectorAll(".btn-copy-history").forEach(btn => {
            btn.addEventListener("click", async (e) => {
                const pwd = e.target.dataset.pwd;
                try {
                    await navigator.clipboard.writeText(pwd);
                    e.target.textContent = "✓";
                    setTimeout(() => e.target.textContent = "📋", 1000);
                } catch (e) {}
            });
        });
    }

    async function copyPassword() {
        if (!passwordOutput.value || passwordOutput.value.includes("Sélectionnez")) return;
        try {
            await navigator.clipboard.writeText(passwordOutput.value);
            copyBtn.textContent = "✓";
            setTimeout(() => copyBtn.textContent = "📋", 1000);
        } catch (e) {}
    }

    function clearHistory() {
        history = [];
        historyList.innerHTML = "";
    }

    lengthSlider.addEventListener("input", () => {
        lengthValue.textContent = lengthSlider.value;
    });

    generateBtn.addEventListener("click", generatePassword);
    copyBtn.addEventListener("click", copyPassword);
    clearHistoryBtn.addEventListener("click", clearHistory);

    [uppercase, lowercase, numbers, symbols].forEach(cb => {
        cb.addEventListener("change", () => {
            if (passwordOutput.value) generatePassword();
        });
    });

    // Générer un mot de passe au démarrage
    generatePassword();
}

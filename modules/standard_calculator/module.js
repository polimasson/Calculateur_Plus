export async function init(container) {
    if (typeof Decimal === "undefined") {
        await new Promise(r => {
            const s = document.createElement("script");
            s.src = "dependencies/decimal.js";
            s.onload = r;
            document.head.appendChild(s);
        });
    }
    setupSimpleCalc(container);
}

function setupSimpleCalc(container) {
    let currentInput = "0";
    let previousInput = "";
    let operator = null;
    let shouldResetScreen = false;

    const display = container.querySelector("#calc-display");
    const history = container.querySelector("#calc-history");

    const updateScreen = () => {
        display.value = currentInput;
    };

    const calculate = () => {
        if (operator === null || shouldResetScreen) return;
        
        const a = new Decimal(previousInput);
        const b = new Decimal(currentInput);
        let result = 0;

        switch (operator) {
            case '+': result = a.plus(b); break;
            case '-': result = a.minus(b); break;
            case '*': result = a.times(b); break;
            case '/': 
                if (b.isZero()) { alert("Division par zéro !"); return; }
                result = a.div(b); 
                break;
        }

        currentInput = result.toString();
        operator = null;
        history.innerText = "";
        updateScreen();
    };

    container.addEventListener("click", (e) => {
        const btn = e.target;
        if (!btn.matches("button")) return;

        // Chiffres
        if (btn.classList.contains("btn-num")) {
            if (currentInput === "0" || shouldResetScreen) {
                currentInput = btn.innerText;
                shouldResetScreen = false;
            } else {
                if (btn.innerText === "." && currentInput.includes(".")) return;
                currentInput += btn.innerText;
            }
            updateScreen();
        }

        // Opérateurs
        if (btn.classList.contains("btn-op")) {
            operator = btn.dataset.op;
            previousInput = currentInput;
            history.innerText = `${previousInput} ${btn.innerText}`;
            shouldResetScreen = true;
        }

        // Actions
        if (btn.dataset.op === "clear") {
            currentInput = "0";
            previousInput = "";
            operator = null;
            history.innerText = "";
            updateScreen();
        }

        if (btn.dataset.op === "del") {
            currentInput = currentInput.length > 1 ? currentInput.slice(0, -1) : "0";
            updateScreen();
        }

        if (btn.id === "btn-equal") {
            calculate();
            shouldResetScreen = true;
        }
    });
}
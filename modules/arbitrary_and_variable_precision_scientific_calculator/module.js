export async function init(container) {
  // Vérifie si Decimal.js est déjà chargé
  if (typeof Decimal === "undefined") {
    await new Promise((resolve, reject) => {
      let script = document.createElement("script");
      script.src = "dependencies/decimal.js";

      script.onload = function () {
        console.log("decimal.js chargé");
        resolve();
      };

      script.onerror = function () {
        console.error("Erreur de chargement du script dependencies/decimal.js");
        reject(new Error("Impossible de charger Decimal.js"));
      };

      document.head.appendChild(script);
    });
  } else {
    console.log("decimal.js déjà chargé");
  }
  
  // Une fois qu'on est sûr que Decimal est là, on lance le setup
  setup(container);
}
function setup(container) {
  // Vérifier si Decimal est bien chargé avant de continuer
  if (typeof Decimal === "undefined") {
    console.error("Erreur : Decimal.js n'est pas chargé.");
    return;
  }
  Decimal.set({ precision: 1000 });
  let lastResult = "0";
  let variables = {};
  const expressionInput = container.querySelector("#expression");
  const resultDisplay = container.querySelector("#result");
  const precisionInput = container.querySelector("#precision");
  const formatSelect = container.querySelector("#format");
  const constants = {
    pi: Decimal.acos(-1),
    e: Decimal.exp(1)
  };


  formatSelect.addEventListener("change", function () {
    if (["---", "toFraction", "toBinary", "toHex"].includes(this.value)) {
      precisionInput.style.display = "none";
    } else {
      precisionInput.style.display = "block";
    }
  });

  function appendToExpression(value) {
    const cursorPos = expressionInput.selectionStart;
    const expression = expressionInput.value;
    expressionInput.value = expression.slice(0, cursorPos) + value + expression.slice(cursorPos);
    expressionInput.setSelectionRange(cursorPos + value.length, cursorPos + value.length);
  }

  function appendFunction(func) {
    const cursorPos = expressionInput.selectionStart;
    const insertion = func + "()";
    const expression = expressionInput.value;
    expressionInput.value = expression.slice(0, cursorPos) + insertion + expression.slice(cursorPos);
    const newCursorPos = cursorPos + func.length + 1;
    expressionInput.setSelectionRange(newCursorPos, newCursorPos);
    expressionInput.focus();
  }

  function moveCursor(direction) {
    const cursorPos = expressionInput.selectionStart;
    const newPos = cursorPos + direction;
    expressionInput.setSelectionRange(newPos, newPos);
    expressionInput.focus();
  }
  function moveCursorToStart() {
    expressionInput.setSelectionRange(0, 0);
    expressionInput.focus();
  }
  function moveCursorToEnd() {
    const length = expressionInput.value.length;
    expressionInput.setSelectionRange(length, length);
    expressionInput.focus();
  }
  function clearDisplay() {
    expressionInput.value = "";
    resultDisplay.innerHTML = "";
  }
  function delChar() {
    const cursorPos = expressionInput.selectionStart;
    const expression = expressionInput.value;
    if (cursorPos > 0) {
      expressionInput.value = expression.slice(0, cursorPos - 1) + expression.slice(cursorPos);
      expressionInput.setSelectionRange(cursorPos - 1, cursorPos - 1);
    }
  }

  // ---------------------------
  // Conversion d'un nombre en fraction
  // ---------------------------
  function decimalToFraction(x, epsilon = 1e-10) {
    let num = Number(x);
    if (isNaN(num)) return "NaN";
    const sign = num < 0 ? -1 : 1;
    num = Math.abs(num);
    if (Math.floor(num) === num) return (sign * num) + "/1";
    let lower_n = 0, lower_d = 1;
    let upper_n = 1, upper_d = 0;
    while (true) {
      const middle_n = lower_n + upper_n;
      const middle_d = lower_d + upper_d;
      if (middle_d * (num + epsilon) < middle_n) {
        upper_n = middle_n;
        upper_d = middle_d;
      } else if (middle_n < (num - epsilon) * middle_d) {
        lower_n = middle_n;
        lower_d = middle_d;
      } else {
        return (sign * middle_n) + "/" + middle_d;
      }
    }
  }

  // Définition des opérateurs
  const operators = {
    '+': { precedence: 2, associativity: 'Left' },
    '-': { precedence: 2, associativity: 'Left' },
    '*': { precedence: 3, associativity: 'Left' },
    '/': { precedence: 3, associativity: 'Left' },
    '^': { precedence: 4, associativity: 'Right' },
    'mod': { precedence: 3, associativity: 'Left' },
    // Nouveaux opérateurs de comparaison (priorité basse)
    '<': { precedence: 1, associativity: 'Left' },
    '<=': { precedence: 1, associativity: 'Left' },
    '==': { precedence: 1, associativity: 'Left' },
    '>=': { precedence: 1, associativity: 'Left' },
    '>': { precedence: 1, associativity: 'Left' }
  };

  // Liste des fonctions supportées (ajout des fonctions d'arrondi et random)
  const functionsList = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2', 'abs', 'sqrt', 'ln', 'log', 'logb', 'root', 'exp', 'sinh', 'cosh', 'tanh', 'asinh', 'acosh', 'atanh', 'fact', 'nCr', 'nPr',
    'round', 'floor', 'ceil', 'trunc', 'toNearest', 'decimalPlaces', 'random'];

  // ---------------------------
  // Tokenisation de l'expression
  // ---------------------------
  function tokenize(expr) {
    const tokens = [];
    let i = 0;
    while (i < expr.length) {
      let char = expr[i];

      if (char === ' ') {
        i++;
        continue;
      }

      // Nombre
      if (/\d|\./.test(char)) {
        let num = char;
        while (i + 1 < expr.length && /[\d\.]/.test(expr[i + 1])) {
          num += expr[++i];
        }
        tokens.push({ type: 'number', value: num });
      }

      // Opérateurs de comparaison doubles
      else if (char === '<' && expr[i + 1] === '=') {
        tokens.push({ type: 'operator', value: '<=' }); i++;
      } else if (char === '>' && expr[i + 1] === '=') {
        tokens.push({ type: 'operator', value: '>=' }); i++;
      } else if (char === '=' && expr[i + 1] === '=') {
        tokens.push({ type: 'operator', value: '==' }); i++;
      }

      // Opérateurs simples
      else if (char === '<') {
        tokens.push({ type: 'operator', value: '<' });
      } else if (char === '>') {
        tokens.push({ type: 'operator', value: '>' });
      } else if (char === '=') {
        tokens.push({ type: 'assign', value: '=' }); // affectation uniquement
      }

      // Virgule
      else if (char === ',') {
        tokens.push({ type: 'comma', value: char });
      }

      // Parenthèses
      else if (char === '(' || char === ')') {
        tokens.push({ type: 'paren', value: char });
      }

      // Pourcentage postfixé
      else if (char === '%') {
        if (tokens.length > 0 && tokens[tokens.length - 1].type === 'number') {
          const numToken = tokens.pop();
          tokens.push({ type: 'percentage', value: numToken.value });
        } else {
          throw new Error("Pourcentage mal placé");
        }
      }

      // Opérateur classique
      else if (operators[char]) {
        tokens.push({ type: 'operator', value: char });
      }

      // Factorielle "!"
      else if (char === '!') {
        tokens.push({ type: 'identifier', value: 'fact' });
      }

      // Identifiants / fonctions
      else if (/[a-zA-Z]/.test(char)) {
        let id = char;
        while (i + 1 < expr.length && /[a-zA-Z]/.test(expr[i + 1])) {
          id += expr[++i];
        }
        if (id === "mod") {
          tokens.push({ type: 'operator', value: 'mod' });
        } else {
          tokens.push({ type: 'identifier', value: id });
        }
      }

      else {
        throw new Error("Caractère inattendu : " + char);
      }

      i++;
    }

    return tokens;
  }


  // ---------------------------
  // Conversion de l'infixe en RPN (notation polonaise inversée)
  // ---------------------------
  function infixToRPN(tokens) {
    const outputQueue = [];
    const operatorStack = [];
    tokens.forEach(token => {
      if (token.type === 'number' || token.type === 'percentage') {
        outputQueue.push(token);
      } else if (token.type === 'identifier') {
        if (token.value === 'pi' || token.value === 'e' || token.value === 'ans') {
          outputQueue.push(token);
        } else if (functionsList.includes(token.value)) {
          operatorStack.push(token);
        } else {
          outputQueue.push(token);
        }
      } else if (token.type === 'operator') {
        while (operatorStack.length > 0) {
          const top = operatorStack[operatorStack.length - 1];
          if (top.type === 'operator' &&
            ((operators[token.value].associativity === 'Left' && operators[token.value].precedence <= operators[top.value].precedence) ||
              (operators[token.value].associativity === 'Right' && operators[token.value].precedence < operators[top.value].precedence))) {
            outputQueue.push(operatorStack.pop());
          } else {
            break;
          }
        }
        operatorStack.push(token);
      } else if (token.type === 'paren') {
        if (token.value === '(') {
          operatorStack.push(token);
        } else {
          while (operatorStack.length && operatorStack[operatorStack.length - 1].value !== '(') {
            outputQueue.push(operatorStack.pop());
          }
          if (!operatorStack.length) {
            throw new Error("Parenthèse non appariée");
          }
          operatorStack.pop();
          if (operatorStack.length && operatorStack[operatorStack.length - 1].type === 'identifier' && functionsList.includes(operatorStack[operatorStack.length - 1].value)) {
            outputQueue.push(operatorStack.pop());
          }
        }
      } else if (token.type === 'comma') {
        while (operatorStack.length && operatorStack[operatorStack.length - 1].value !== '(') {
          outputQueue.push(operatorStack.pop());
        }
        if (!operatorStack.length) {
          throw new Error("Virgule mal placée ou parenthèse manquante");
        }
      }
    });
    while (operatorStack.length) {
      const op = operatorStack.pop();
      if (op.value === '(' || op.value === ')') {
        throw new Error("Parenthèses non appariées");
      }
      outputQueue.push(op);
    }
    return outputQueue;
  }

  // ---------------------------
  // Fonctions auxiliaires pour la factorielle et combinatoire
  // ---------------------------
  function factorial(n) {
    if (!n.isInteger() || n.lt(0)) {
      throw new Error("fact: n doit être un entier non négatif");
    }
    let result = new Decimal(1);
    for (let i = new Decimal(1); i.lte(n); i = i.plus(1)) {
      result = result.times(i);
    }
    return result;
  }
  function nCr(n, r) {
    return factorial(n).div(factorial(r).times(factorial(n.minus(r))));
  }
  function nPr(n, r) {
    return factorial(n).div(factorial(n.minus(r)));
  }

  // ---------------------------
  // Évaluation de la RPN
  // ---------------------------
  function evaluateRPN(rpn) {
    const stack = [];
    function isPercentage(x) {
      return (typeof x === 'object' && x.isPercentage);
    }
    rpn.forEach(token => {
      if (token.type === 'number') {
        stack.push(new Decimal(token.value));
      } else if (token.type === 'percentage') {
        stack.push({ isPercentage: true, value: new Decimal(token.value) });
      } else if (token.type === 'identifier') {
        if (token.value === 'pi') {
          stack.push(constants.pi);
        } else if (token.value === 'e') {
          stack.push(constants.e);
        } else if (token.value === 'ans') {
          stack.push(new Decimal(lastResult));
        } else if (variables.hasOwnProperty(token.value)) {
          stack.push(variables[token.value]);
        } else if (functionsList.includes(token.value)) {
          // Fonctions à deux arguments
          if (['logb', 'root', 'atan2', 'nCr', 'nPr', 'toNearest', 'decimalPlaces'].includes(token.value)) {
            const arg2 = stack.pop();
            const arg1 = stack.pop();
            switch (token.value) {
              case 'logb':
                stack.push(arg1.ln().div(arg2.ln()));
                break;
              case 'root':
                stack.push(arg1.pow(new Decimal(1).div(arg2)));
                break;
              case 'atan2':
                stack.push(new Decimal(Math.atan2(arg1.toNumber(), arg2.toNumber())));
                break;
              case 'nCr':
                stack.push(factorial(arg1).div(factorial(arg2).times(factorial(arg1.minus(arg2)))));
                break;
              case 'nPr':
                stack.push(factorial(arg1).div(factorial(arg1.minus(arg2))));
                break;
              case 'toNearest':
                // Arrondit arg1 au multiple de arg2
                stack.push(new Decimal(Math.round(arg1.toNumber() / arg2.toNumber()) * arg2.toNumber()));
                break;
              case 'decimalPlaces':
                // Arrondir arg1 à arg2 décimales
                stack.push(arg1.toDecimalPlaces(parseInt(arg2.toString())));
                break;
            }
          } else {
            const arg = stack.pop();
            switch (token.value) {
              case 'sin': stack.push(new Decimal(Math.sin(arg.toNumber()))); break;
              case 'cos': stack.push(new Decimal(Math.cos(arg.toNumber()))); break;
              case 'tan': stack.push(new Decimal(Math.tan(arg.toNumber()))); break;
              case 'asin': stack.push(new Decimal(Math.asin(arg.toNumber()))); break;
              case 'acos': stack.push(new Decimal(Math.acos(arg.toNumber()))); break;
              case 'atan': stack.push(new Decimal(Math.atan(arg.toNumber()))); break;
              case 'abs': stack.push(arg.abs()); break;
              case 'sqrt': stack.push(arg.sqrt()); break;
              case 'ln': stack.push(arg.ln()); break;
              case 'log': stack.push(new Decimal(Math.log10(arg.toNumber()))); break;
              case 'exp': stack.push(Decimal.exp ? Decimal.exp(arg) : new Decimal(Math.exp(arg.toNumber()))); break;
              case 'sinh': stack.push(new Decimal(Math.sinh(arg.toNumber()))); break;
              case 'cosh': stack.push(new Decimal(Math.cosh(arg.toNumber()))); break;
              case 'tanh': stack.push(new Decimal(Math.tanh(arg.toNumber()))); break;
              case 'asinh': stack.push(new Decimal(Math.asinh(arg.toNumber()))); break;
              case 'acosh': stack.push(new Decimal(Math.acosh(arg.toNumber()))); break;
              case 'atanh': stack.push(new Decimal(Math.atanh(arg.toNumber()))); break;
              case 'fact': stack.push(factorial(arg)); break;
              case 'round': stack.push(new Decimal(Math.round(arg.toNumber()))); break;
              case 'floor': stack.push(arg.floor()); break;
              case 'ceil': stack.push(arg.ceil()); break;
              case 'trunc':
                stack.push(arg.isNegative() ? arg.ceil() : arg.floor());
                break;
              case 'random':
                // random(n): si un argument est fourni, renvoie un nombre aléatoire entre 0 et n
                stack.push(new Decimal(Math.random()).times(arg));
                break;
              default:
                throw new Error("Fonction non supportée: " + token.value);
            }
          }
        } else {
          throw new Error("Variable ou fonction inconnue: " + token.value);
        }
      } else if (token.type === 'operator') {
        const b = stack.pop();
        const a = stack.pop();
        switch (token.value) {
          case '+':
            if (isPercentage(b)) {
              stack.push(a.plus(a.times(b.value.div(100))));
            } else {
              stack.push(a.plus(b));
            }
            break;
          case '-':
            if (isPercentage(b)) {
              stack.push(a.minus(a.times(b.value.div(100))));
            } else {
              stack.push(a.minus(b));
            }
            break;
          case '*':
            if (isPercentage(b)) {
              stack.push(a.times(b.value.div(100)));
            } else {
              stack.push(a.times(b));
            }
            break;
          case '/':
            if (isPercentage(b)) {
              stack.push(a.div(b.value.div(100)));
            } else {
              stack.push(a.div(b));
            }
            break;
          case '^':
            if (isPercentage(b)) {
              stack.push(a.pow(b.value.div(100)));
            } else {
              stack.push(a.pow(b));
            }
            break;
          case 'mod':
            stack.push(a.mod(b));
            break;
          // Opérateurs de comparaison renvoyant "vrai" ou "faux"
          case '<':
            stack.push(a.lt(b) ? "Vrai" : "Faux");
            break;
          case '<=':
            stack.push(a.lte(b) ? "Vrai" : "Faux");
            break;
          case '==':
            stack.push(a.equals(b) ? "Vrai" : "Faux");
            break;
          case '>=':
            stack.push(a.gte(b) ? "Vrai" : "Faux");
            break;
          case '>':
            stack.push(a.gt(b) ? "Vrai" : "Faux");
            break;
          default:
            throw new Error("Opérateur non supporté: " + token.value);
        }
      }
    });
    if (stack.length !== 1) {
      throw new Error("Erreur lors de l'évaluation.");
    }
    return stack[0];
  }

  // ---------------------------
  // Évaluation complète de l'expression
  // ---------------------------
  function formatResult(result, precision) {
    switch (formatSelect.value) {
      case "toFixed":
        return result.toFixed(precision).replace(/\.?0+$/, '');
      case "toSignificantDigits":
        return result.toSignificantDigits(precision);
      case "toExponential":
        return result.toExponential(precision)
          .replace(/(\.\d*?[1-9])0+(e[+-]?\d+)/, '$1$2')
          .replace(/\.0+(e[+-]?\d+)/, '$1');
      case "toFraction":
        return decimalToFraction(result.toNumber());
      case "toBinary":
        return result.toNumber().toString(2);
      case "toHex":
        return result.toNumber().toString(16);
      case "toPercent":
        return result.times(100).toFixed(precision).replace(/\.?0+$/, '') + "%";
      default:
        return result.toString();
    }
  }
  function replaceVariablesInTokens(tokens) {
    tokens.forEach(token => {
      if (
        token.type === 'identifier' &&
        !['pi', 'e', 'ans'].includes(token.value) &&
        !functionsList.includes(token.value)
      ) {
        if (variables.hasOwnProperty(token.value)) {
          token.type = 'number';
          token.value = variables[token.value].toString();
        } else {
          throw new Error("Undefined variable: " + token.value);
        }
      }
    });
  }
  function evaluateExpression(expr) {
    try {
      expr = expr.replace(/\s+/g, '');

      const assignMatch = expr.match(/^([a-zA-Z]+)=([^=].*)$/);
      let precision = parseInt(precisionInput.value);
      if (isNaN(precision) || precision < 1 || precision > 999) precision = 10;

      if (assignMatch) {
        const varName = assignMatch[1];
        const valueExpr = assignMatch[2];
        const tokens = tokenize(valueExpr);
        replaceVariablesInTokens(tokens);

        const rpn = infixToRPN(tokens);
        let result = evaluateRPN(rpn);
        variables[varName] = result;

        result = formatResult(result, precision);
        lastResult = result;
        return result;
      }

      // Sinon, expression normale
      const tokens = tokenize(expr);
      replaceVariablesInTokens(tokens);

      const rpn = infixToRPN(tokens);
      let result = evaluateRPN(rpn);

      result = formatResult(result, precision);
      return result;

    } catch (e) {
      console.error("Erreur d'évaluation :", e);
      return "Erreur: " + e.message;
    }
  }

  function calculate() {
    const result = evaluateExpression(expressionInput.value);
    resultDisplay.innerHTML = result;
    if (typeof result === 'string' && !result.startsWith("Erreur")) {
      lastResult = result;
    }
  }

  function clearVariables() {
    variables = {};
    console.log("Toutes les variables ont été supprimées.");
  }

  expressionInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      calculate();
      event.preventDefault();
    } else if (event.key === "ArrowLeft") {
      moveCursor(-1);
      event.preventDefault();
    } else if (event.key === "ArrowRight") {
      moveCursor(1);
      event.preventDefault();
    }
  });
  // --- AJOUTE CECI À LA FIN DE TA FONCTION setup(container) ---

container.addEventListener("click", (event) => {
    const target = event.target;
    if (target.tagName !== "BUTTON") return;

    // On récupère le contenu du "onclick" pour savoir quelle fonction appeler
    const clickHandler = target.getAttribute("onclick");
    if (!clickHandler) return;

    // On empêche le comportement par défaut (l'erreur du navigateur)
    event.preventDefault();

    // Analyse de la fonction appelée dans le onclick
    if (clickHandler.includes("appendToExpression")) {
        const val = clickHandler.match(/'([^']+)'/)[1];
        appendToExpression(val);
    } 
    else if (clickHandler.includes("appendFunction")) {
        const func = clickHandler.match(/'([^']+)'/)[1];
        appendFunction(func);
    }
    else if (clickHandler.includes("calculate()")) {
        calculate();
    }
    else if (clickHandler.includes("clearDisplay()")) {
        clearDisplay();
    }
    else if (clickHandler.includes("delChar()")) {
        delChar();
    }
    else if (clickHandler.includes("clearVariables()")) {
        clearVariables();
    }
    else if (clickHandler.includes("moveCursor(")) {
        const dir = parseInt(clickHandler.match(/\(([^)]+)\)/)[1]);
        moveCursor(dir);
    }
    else if (clickHandler.includes("moveCursorToStart()")) {
        moveCursorToStart();
    }
    else if (clickHandler.includes("moveCursorToEnd()")) {
        moveCursorToEnd();
    }
});

// IMPORTANT : Supprime le Object.assign(window, {...}) à la fin !;
}
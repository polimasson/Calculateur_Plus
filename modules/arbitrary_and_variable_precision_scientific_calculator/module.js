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
  Decimal.set({ precision: 100 });
  let lastResult = "0";
  let variables = {};
  let currentPrecision = 100;
  const expressionInput = container.querySelector("#expression");
  const resultDisplay = container.querySelector("#result");
  const precisionInput = container.querySelector("#precision");
  const formatSelect = container.querySelector("#format");
  const angleMode = container.querySelector("#angle-mode");
  const constants = {
    pi: Decimal.acos(-1),
    e: Decimal.exp(1),
    tau: Decimal.acos(-1).times(2),
    phi: new Decimal(1).plus(new Decimal(5).sqrt()).div(2),
    ln2: new Decimal(2).ln(),
    ln10: new Decimal(10).ln(),
  };
  
  // Historique
  let history = [];
  let historyIndex = -1;
  
  function addToHistory(expr, result) {
    if (!expr.trim()) return;
    history.push({ expr, result });
    if (history.length > 50) history.shift();
    historyIndex = history.length;
  }
  
  function navigateHistory(direction) {
    if (history.length === 0) return;
    historyIndex += direction;
    if (historyIndex < 0) historyIndex = 0;
    if (historyIndex > history.length) historyIndex = history.length;
    if (historyIndex < history.length) {
      expressionInput.value = history[historyIndex].expr;
    } else {
      expressionInput.value = '';
    }
    expressionInput.focus();
  }


  formatSelect.addEventListener("change", function () {
    if (["---", "toFraction"].includes(this.value)) {
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
  // Conversion d'un nombre en fraction (précision arbitraire avec Decimal)
  // ---------------------------
  function decimalToFraction(x, epsilon = new Decimal('1e-10')) {
    const num = new Decimal(x);
    if (!num.isFinite()) return "NaN";
    const sign = num.isNegative() ? new Decimal(-1) : new Decimal(1);
    const absNum = num.abs();
    if (absNum.isInteger()) return sign.times(absNum).toString() + "/1";
    let lower_n = new Decimal(0), lower_d = new Decimal(1);
    let upper_n = new Decimal(1), upper_d = new Decimal(0);
    while (true) {
      const middle_n = lower_n.plus(upper_n);
      const middle_d = lower_d.plus(upper_d);
      if (middle_d.times(absNum.plus(epsilon)).lt(middle_n)) {
        upper_n = middle_n;
        upper_d = middle_d;
      } else if (middle_n.lt(absNum.minus(epsilon).times(middle_d))) {
        lower_n = middle_n;
        lower_d = middle_d;
      } else {
        return sign.times(middle_n).toString() + "/" + middle_d.toString();
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

  // Liste des fonctions supportées (fonctions decimal.js + utilitaires)
  const functionsList = [
    // Trigonométrie
    'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2',
    // Hyperbolique
    'sinh', 'cosh', 'tanh', 'asinh', 'acosh', 'atanh',
    // Math de base
    'abs', 'sqrt', 'cbrt', 'ln', 'log', 'logb', 'root', 'exp', 'pow',
    'neg', 'reciprocated', 'divToInt',
    // Combinatoire
    'fact', 'nCr', 'nPr',
    // Arrondi
    'round', 'floor', 'ceil', 'trunc', 'toNearest', 'decimalPlaces', 'toSD', 'toDP', 'clamp',
    // Tests
    'isFinite', 'isInt', 'isNaN', 'isNeg', 'isPos', 'isZero', 'cmp',
    // Divers
    'random', 'sd'
  ];

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

      // Nombre (ou nombre négatif en contexte unaire)
      if (/\d|\./.test(char) || (char === '-' && isUnaryContext(tokens))) {
        let num = '';
        let hasDecimal = false;
        
        // Signe négatif
        if (char === '-') {
          num = '-';
          i++; // avancer au prochain caractère
          if (i >= expr.length || !/[\d\.]/.test(expr[i])) {
            throw new Error("Signe '-' doit être suivi d'un nombre");
          }
          char = expr[i];
        }
        
        // Lire le nombre
        while (i < expr.length && /[\d\.]/.test(expr[i])) {
          if (expr[i] === '.') {
            if (hasDecimal) throw new Error("Nombre avec plusieurs points décimaux : " + num + expr[i]);
            hasDecimal = true;
          }
          num += expr[i];
          i++;
        }
        // Compenser le i++ de la boucle principale
        i--;
        
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

      // Opérateur classique (sauf '-' déjà traité comme unaire)
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
  
  function isUnaryContext(tokens) {
    if (tokens.length === 0) return true;
    const last = tokens[tokens.length - 1];
    return last.type === 'operator' ||
           (last.type === 'paren' && last.value === '(') ||
           last.type === 'comma';
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
        if (['pi', 'e', 'tau', 'phi', 'ln2', 'ln10', 'ans'].includes(token.value)) {
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

  // Conversion degrés/radians
  function degToRad(deg) {
    return deg.times(constants.pi).div(180);
  }
  function radToDeg(rad) {
    return rad.times(180).div(constants.pi);
  }
  function isDegMode() {
    return angleMode && angleMode.value === 'deg';
  }

  // ---------------------------
  // Calcul de π en précision arbitraire (algorithme de Gauss-Legendre)
  // ---------------------------
  function computePi(precision) {
    const one = new Decimal(1);
    const two = new Decimal(2);
    const four = new Decimal(4);
    
    let a = one;
    let b = one.div(two.sqrt());
    let t = one.div(4);
    let p = one;
    
    // Iterations: chaque itération double le nombre de chiffres corrects
    // Pour 10000 chiffres, ~15 itérations suffisent
    const iterations = Math.ceil(Math.log2(precision)) + 5;
    
    for (let i = 0; i < iterations; i++) {
      const aNext = a.plus(b).div(2);
      const bNext = a.times(b).sqrt();
      const tNext = t.minus(p.times(a.minus(aNext).pow(2)));
      const pNext = p.times(2);
      
      a = aNext;
      b = bNext;
      t = tNext;
      p = pNext;
    }
    
    return a.plus(b).pow(2).div(four.times(t));
  }

  // ---------------------------
  // Trigonométrie en précision arbitraire (séries de Taylor)
  // ---------------------------
  function decimalSin(x) {
    const twoPi = constants.pi.times(2);
    const piVal = constants.pi;
    const piHalf = constants.pi.dividedBy(2);
    
    // Réduction modulo 2π
    let y = x.mod(twoPi);
    if (y.lt(0)) y = y.plus(twoPi);
    
    // Réduction dans [-π, π]
    if (y.gt(piVal)) y = y.minus(twoPi);
    
    // Symétries pour réduire dans [-π/2, π/2]
    let sign = new Decimal(1);
    if (y.lt(0)) { y = y.neg(); sign = sign.neg(); }
    if (y.gt(piHalf)) { y = piVal.minus(y); }
    
    // Série de Taylor : sin(y) = y - y³/3! + y⁵/5! - y⁷/7! + ...
    const maxIter = Math.min(2000, Decimal.precision * 2 + 20);
    let result = new Decimal(y);
    let term = new Decimal(y);
    const ySq = y.times(y);
    for (let n = 1; n < maxIter; n++) {
      const k = n * 2;
      term = term.times(ySq.neg()).div(k * (k + 1));
      if (term.abs().lt(new Decimal('1e-' + (Decimal.precision + 5)))) break;
      result = result.plus(term);
    }
    return result.times(sign);
  }

  function decimalCos(x) {
    return decimalSin(x.plus(constants.pi.dividedBy(2)));
  }

  function decimalTan(x) {
    const s = decimalSin(x);
    const c = decimalCos(x);
    if (c.abs().lt(new Decimal('1e-' + Decimal.precision))) throw new Error("tan: argument proche de π/2 + kπ");
    return s.div(c);
  }

  function decimalAtan(x) {
    const one = new Decimal(1);
    if (x.lt(0)) return decimalAtan(x.neg()).neg();
    if (x.gt(one)) {
      return constants.pi.dividedBy(2).minus(decimalAtan(one.div(x)));
    }
    // Série : atan(x) = x - x³/3 + x⁵/5 - x⁷/7 + ... pour |x| ≤ 1
    const maxIter = Math.min(2000, Decimal.precision * 2 + 20);
    let result = new Decimal(x);
    let term = new Decimal(x);
    const xSq = x.times(x);
    for (let n = 1; n < maxIter; n++) {
      term = term.times(xSq.neg());
      const nextTerm = term.dividedBy(2 * n + 1);
      if (nextTerm.abs().lt(new Decimal('1e-' + (Decimal.precision + 5)))) break;
      result = result.plus(nextTerm);
    }
    return result;
  }

  function decimalAsin(x) {
    const one = new Decimal(1);
    if (x.lt(-1) || x.gt(1)) throw new Error("asin: argument hors de [-1, 1]");
    if (x.lt(0)) return decimalAsin(x.neg()).neg();
    if (x.eq(1)) return constants.pi.dividedBy(2);
    // asin(x) = atan(x / sqrt(1-x²))
    return decimalAtan(x.div(one.minus(x.times(x)).sqrt()));
  }

  function decimalAcos(x) {
    if (x.lt(-1) || x.gt(1)) throw new Error("acos: argument hors de [-1, 1]");
    return constants.pi.dividedBy(2).minus(decimalAsin(x));
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
        } else if (token.value === 'tau') {
          stack.push(constants.tau);
        } else if (token.value === 'phi') {
          stack.push(constants.phi);
        } else if (token.value === 'ln2') {
          stack.push(constants.ln2);
        } else if (token.value === 'ln10') {
          stack.push(constants.ln10);
        } else if (token.value === 'ans') {
          stack.push(new Decimal(lastResult));
        } else if (variables.hasOwnProperty(token.value)) {
          stack.push(variables[token.value]);
        } else if (functionsList.includes(token.value)) {
          // Fonctions à deux arguments
          if (['logb', 'root', 'pow', 'divToInt', 'clamp', 'atan2', 'nCr', 'nPr', 'toNearest', 'decimalPlaces', 'toDP', 'toSD'].includes(token.value)) {
            const arg2 = stack.pop();
            const arg1 = stack.pop();
            switch (token.value) {
              case 'logb':
                stack.push(arg1.ln().div(arg2.ln()));
                break;
              case 'root':
                stack.push(arg1.pow(new Decimal(1).div(arg2)));
                break;
              case 'pow':
                stack.push(arg1.pow(arg2));
                break;
              case 'divToInt':
                stack.push(arg1.divToInt(arg2));
                break;
              case 'clamp': {
                const val = new Decimal(stack.pop());
                const min = arg1;
                const max = arg2;
                if (val.lt(min)) stack.push(min);
                else if (val.gt(max)) stack.push(max);
                else stack.push(val);
                break;
              }
              case 'toNearest':
                // Arrondit arg1 au multiple de arg2 (précision arbitraire)
                stack.push(arg1.div(arg2).round().times(arg2));
                break;
              case 'decimalPlaces':
                // Arrondir arg1 à arg2 décimales
                stack.push(arg1.toDecimalPlaces(parseInt(arg2.toString())));
                break;
              case 'toDP':
                stack.push(arg1.toDP(parseInt(arg2.toString())));
                break;
              case 'toSD':
                stack.push(arg1.toSD(parseInt(arg2.toString())));
                break;
              case 'atan2': {
                const y = arg1, x = arg2;
                let res;
                const one = new Decimal(1);
                if (x.gt(0)) {
                  res = decimalAtan(y.div(x));
                } else if (x.lt(0)) {
                  res = decimalAtan(y.div(x)).plus(y.gte(0) ? constants.pi : constants.pi.neg());
                } else if (y.gt(0)) {
                  res = constants.pi.dividedBy(2);
                } else if (y.lt(0)) {
                  res = constants.pi.dividedBy(2).neg();
                } else {
                  res = new Decimal(0);
                }
                stack.push(isDegMode() ? radToDeg(res) : res);
                break;
              }
              case 'nCr':
                stack.push(factorial(arg1).div(factorial(arg2).times(factorial(arg1.minus(arg2)))));
                break;
              case 'nPr':
                stack.push(factorial(arg1).div(factorial(arg1.minus(arg2))));
                break;
            }
          } else {
            const arg = stack.pop();
            const isDeg = isDegMode();
            switch (token.value) {
              case 'sin': {
                const rad = isDeg ? degToRad(arg) : arg;
                stack.push(decimalSin(rad)); break;
              }
              case 'cos': {
                const rad = isDeg ? degToRad(arg) : arg;
                stack.push(decimalCos(rad)); break;
              }
              case 'tan': {
                const rad = isDeg ? degToRad(arg) : arg;
                stack.push(decimalTan(rad)); break;
              }
              case 'asin': {
                let res = decimalAsin(arg);
                stack.push(isDeg ? radToDeg(res) : res); break;
              }
              case 'acos': {
                let res = decimalAcos(arg);
                stack.push(isDeg ? radToDeg(res) : res); break;
              }
              case 'atan': {
                let res = decimalAtan(arg);
                stack.push(isDeg ? radToDeg(res) : res); break;
              }
              case 'abs': stack.push(arg.abs()); break;
              case 'sqrt': stack.push(arg.sqrt()); break;
              case 'ln': stack.push(arg.ln()); break;
              case 'log': stack.push(arg.ln().div(new Decimal(10).ln())); break;
              case 'exp': stack.push(Decimal.exp(arg)); break;
              case 'sinh': stack.push(Decimal.exp(arg).minus(Decimal.exp(arg.neg())).div(2)); break;
              case 'cosh': stack.push(Decimal.exp(arg).plus(Decimal.exp(arg.neg())).div(2)); break;
              case 'tanh': {
                const epx = Decimal.exp(arg), enx = Decimal.exp(arg.neg());
                stack.push(epx.minus(enx).div(epx.plus(enx))); break;
              }
              case 'asinh': stack.push(arg.plus(arg.times(arg).plus(1).sqrt()).ln()); break;
              case 'acosh': {
                if (arg.lt(1)) throw new Error("acosh: argument doit être ≥ 1");
                stack.push(arg.plus(arg.times(arg).minus(1).sqrt()).ln()); break;
              }
              case 'atanh': {
                if (arg.abs().gte(1)) throw new Error("atanh: |argument| doit être < 1");
                const one = new Decimal(1);
                stack.push(one.plus(arg).div(one.minus(arg)).ln().div(2)); break;
              }
              case 'fact': stack.push(factorial(arg)); break;
              case 'round': stack.push(arg.round()); break;
              case 'floor': stack.push(arg.floor()); break;
              case 'ceil': stack.push(arg.ceil()); break;
              case 'trunc':
                stack.push(arg.isNegative() ? arg.ceil() : arg.floor());
                break;
              case 'random': {
                // Génère un nombre décimal aléatoire entre 0 et arg avec précision arbitraire
                // On génère un string de chiffres aléatoires pour éviter la perte de précision de Math.random()
                let randStr = '0.';
                const digits = Math.min(Decimal.precision, 50);
                for (let i = 0; i < digits; i++) {
                  randStr += Math.floor(Math.random() * 10);
                }
                stack.push(new Decimal(randStr).times(arg));
                break;
              }
              case 'cbrt': stack.push(arg.cbrt()); break;
              case 'neg': stack.push(arg.neg()); break;
              case 'reciprocated': stack.push(new Decimal(1).div(arg)); break;
              case 'isFinite': stack.push(arg.isFinite() ? "Vrai" : "Faux"); break;
              case 'isInt': stack.push(arg.isInt() ? "Vrai" : "Faux"); break;
              case 'isNaN': stack.push(arg.isNaN() ? "Vrai" : "Faux"); break;
              case 'isNeg': stack.push(arg.isNeg() ? "Vrai" : "Faux"); break;
              case 'isPos': stack.push(arg.isPos() ? "Vrai" : "Faux"); break;
              case 'isZero': stack.push(arg.isZero() ? "Vrai" : "Faux"); break;
              case 'cmp': stack.push(arg.cmp(new Decimal(0))); break;
              case 'sd': stack.push(arg.sd()); break;
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
    // Si le résultat est déjà une string (Vrai/Faux, erreur, etc.), le renvoyer tel quel
    if (typeof result === 'string') {
      return result;
    }
    
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
        return result.toFraction().join('/');
      case "toBinary":
        return result.toBinary();
      case "toHex":
        return result.toHexadecimal();
      case "toOctal":
        return result.toOctal();
      case "toPrecision":
        return result.toPrecision(precision)
          .replace(/(\.\d*?[1-9])0+(e[+-]?\d+)/, '$1$2')
          .replace(/\.0+(e[+-]?\d+)/, '$1');
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
        !['pi', 'e', 'tau', 'phi', 'ln2', 'ln10', 'ans'].includes(token.value) &&
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
      if (isNaN(precision) || precision < 1 || precision > 1000000000) precision = 10;
      
      // Ne recalculer les constantes que si la précision a changé
      if (precision !== currentPrecision) {
        Decimal.set({ precision: precision });
        currentPrecision = precision;
        
        // Recalculer les constantes avec la nouvelle précision
        constants.pi = computePi(precision);
        constants.e = Decimal.exp(1);
        constants.tau = constants.pi.times(2);
        constants.phi = new Decimal(1).plus(new Decimal(5).sqrt()).div(2);
        constants.ln2 = new Decimal(2).ln();
        constants.ln10 = new Decimal(10).ln();
      }

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
      addToHistory(expressionInput.value, result);
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
    } else if (event.key === "ArrowUp") {
      navigateHistory(-1);
      event.preventDefault();
    } else if (event.key === "ArrowDown") {
      navigateHistory(1);
      event.preventDefault();
    }
  });
  // --- AJOUTE CECI À LA FIN DE TA FONCTION setup(container) ---

container.addEventListener("click", (event) => {
    const target = event.target;
    if (target.tagName !== "BUTTON") return;

    // On empêche le comportement par défaut
    event.preventDefault();

    // Récupération des attributs data-*
    const dataAction = target.getAttribute("data-action");
    const dataAppend = target.getAttribute("data-append");
    const dataFunction = target.getAttribute("data-function");
    const dataVar = target.getAttribute("data-var");
    const dataNav = target.getAttribute("data-nav");
    
    // Gestion par data-action
    if (dataAction === "calculate") {
        calculate();
        return;
    }
    if (dataAction === "clear") {
        clearDisplay();
        return;
    }
    if (dataAction === "delete") {
        delChar();
        return;
    }
    if (dataAction === "clearVars") {
        clearVariables();
        return;
    }
    
    // Gestion par data-append (chiffres, opérateurs, parenthèses)
    if (dataAppend) {
        appendToExpression(dataAppend);
        return;
    }
    
    // Gestion par data-function (fonctions mathématiques)
    if (dataFunction) {
        appendFunction(dataFunction);
        return;
    }
    
    // Gestion par data-var (constantes pi, e, etc.)
    if (dataVar) {
        appendToExpression(dataVar);
        return;
    }
    
    // Gestion par data-nav (navigation curseur)
    if (dataNav) {
        if (dataNav === "start") {
            moveCursorToStart();
        } else if (dataNav === "end") {
            moveCursorToEnd();
        } else {
            moveCursor(parseInt(dataNav));
        }
        return;
    }
});

// IMPORTANT : Supprime le Object.assign(window, {...}) à la fin !;
}
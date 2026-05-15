let activeGame = null;

export function init(container) {
    activeGame = new TetrisUltimate(container);
}

export function destroy() {
    if (activeGame) {
        activeGame.destroy();
        activeGame = null;
    }
}

const COLS = 10;
const ROWS = 20;
const BLOCK = 30;
const STORAGE_KEY = "tetrisUltimateBestScore";
const GAUGE_CIRCLE = 301.59;
const NEXT_PREVIEW_WIDTH = 150;
const NEXT_PREVIEW_SLOT_HEIGHT = 52;
const NEXT_PREVIEW_VERTICAL_PADDING = 16;

const PIECES = {
    I: { color: "#00d9ff", matrix: [[1, 1, 1, 1]] },
    O: { color: "#ffd93d", matrix: [[1, 1], [1, 1]] },
    T: { color: "#b56dff", matrix: [[0, 1, 0], [1, 1, 1]] },
    S: { color: "#4ee36a", matrix: [[0, 1, 1], [1, 1, 0]] },
    Z: { color: "#ff596f", matrix: [[1, 1, 0], [0, 1, 1]] },
    J: { color: "#4c7dff", matrix: [[1, 0, 0], [1, 1, 1]] },
    L: { color: "#ff9d38", matrix: [[0, 0, 1], [1, 1, 1]] }
};

const BAG_TYPES = Object.keys(PIECES);
const SCORE_TABLE = [0, 100, 300, 500, 800];

class TetrisUltimate {
    constructor(container) {
        this.container = container;
        this.canvas = container.querySelector("#gameCanvas");
        this.ctx = this.canvas.getContext("2d");
        this.nextCanvas = container.querySelector("#nextCanvas");
        this.nextCtx = this.nextCanvas.getContext("2d");
        this.holdCanvas = container.querySelector("#holdCanvas");
        this.holdCtx = this.holdCanvas.getContext("2d");

        this.scoreEl = container.querySelector("#score");
        this.linesEl = container.querySelector("#lines");
        this.levelEl = container.querySelector("#level");
        this.comboEl = container.querySelector("#combo");
        this.bestScoreEl = container.querySelector("#bestScore");
        this.stateEl = container.querySelector("#tetris-state");
        this.lineFlash = container.querySelector("#lineFlash");
        this.startBtn = container.querySelector("#startBtn");
        this.pauseBtn = container.querySelector("#pauseBtn");
        this.resetBtn = container.querySelector("#resetBtn");
        this.playAgainBtn = container.querySelector("#playAgainBtn");
        this.overlay = container.querySelector("#gameOverOverlay");
        this.finalScoreEl = container.querySelector("#finalScore");
        this.gaugeUseBtn = container.querySelector("#gaugeUseBtn");

        this.gaugeFillEl = container.querySelector("#gaugeFill");
        this.gaugeTextEl = container.querySelector("#gaugeText");
        this.gaugeHintEl = container.querySelector("#gaugeHint");
        this.gaugeModeLabel = container.querySelector("#gaugeModeLabel");

        this.configInputs = {
            hold: container.querySelector("#cfgHold"),
            ghost: container.querySelector("#cfgGhost"),
            mirror: container.querySelector("#cfgMirror"),
            trueRandom: container.querySelector("#cfgTrueRandom"),
            gaugeEnabled: container.querySelector("#cfgGaugeEnabled"),
            condition: container.querySelector("#cfgGaugeCondition"),
            activation: container.querySelector("#cfgGaugeActivation"),
            baseSpeedMultiplier: container.querySelector("#cfgBaseSpeedMultiplier"),
            levelProgression: container.querySelector("#cfgLevelProgression"),
            nextCount: container.querySelector("#cfgNextCount"),
            linesThreshold: container.querySelector("#cfgLinesThreshold"),
            scoreThreshold: container.querySelector("#cfgScoreThreshold"),
            comboTarget: container.querySelector("#cfgComboTarget"),
            comboTimes: container.querySelector("#cfgComboTimes"),
            multilineTarget: container.querySelector("#cfgMultilineTarget"),
            multilineTimes: container.querySelector("#cfgMultilineTimes"),
            monoTimes: container.querySelector("#cfgMonoTimes"),
            turnsThreshold: container.querySelector("#cfgTurnsThreshold"),
            timeThreshold: container.querySelector("#cfgTimeThreshold"),
            effect: container.querySelector("#cfgGaugeEffect"),
            x: container.querySelector("#cfgGaugeX"),
            speedEffectDuration: container.querySelector("#cfgSpeedEffectDuration"),
            speedEffectTurns: container.querySelector("#cfgSpeedEffectTurns"),
            featureTarget: container.querySelector("#cfgFeatureTarget")
        };

        this.bestScore = Number(localStorage.getItem(STORAGE_KEY) || 0);
        this.audio = null;
        this.destroyed = false;
        this.listeners = [];

        this.resetSettings();
        this.resetState();
        this.bindEvents();
        this.updateGaugeXInputMode();
        this.updateVisibleGaugeFields();
        this.updateFeatureTargetOptions();
        this.updateUi();
        this.draw();
        this.drawPreviews();
    }

    resetSettings() {
        this.settings = {
            holdEnabled: true,
            ghostEnabled: true,
            mirrorEnabled: true,
            trueRandom: false,
            baseSpeedMultiplier: 1,
            levelProgression: true,
            gaugeEnabled: true,
            condition: "score",
            activation: "manual",
            nextCount: 5,
            rules: {
                linesThreshold: 20,
                scoreThreshold: 400,
                comboTarget: 3,
                comboTimes: 2,
                multilineTarget: "2",
                multilineTimes: 2,
                monoTimes: 1,
                turnsThreshold: 12,
                timeThreshold: 30
            },
            effect: {
                type: "clear_bottom",
                x: 2,
                speedDuration: 5,
                speedTurns: 5,
                featureTargets: ["ghost"]
            }
        };
    }

    readSettingsFromUI() {
        this.updateFeatureTargetOptions();

        const getInt = (input, fallback, min, max) => {
            const raw = Number.parseInt(input.value, 10);
            if (Number.isNaN(raw)) return fallback;
            return clamp(raw, min, max);
        };
        const getFloat = (input, fallback, min, max) => {
            const raw = Number.parseFloat(input.value);
            if (Number.isNaN(raw)) return fallback;
            return clamp(raw, min, max);
        };

        this.settings.holdEnabled = !!this.configInputs.hold.checked;
        this.settings.ghostEnabled = !!this.configInputs.ghost.checked;
        this.settings.mirrorEnabled = !!this.configInputs.mirror.checked;
        this.settings.trueRandom = !!this.configInputs.trueRandom.checked;
        this.settings.baseSpeedMultiplier = getFloat(this.configInputs.baseSpeedMultiplier, 1, 0.1, 20);
        this.settings.levelProgression = !!this.configInputs.levelProgression.checked;
        this.level = this.settings.levelProgression ? this.getProgressionLevel() : 0;
        this.settings.gaugeEnabled = !!this.configInputs.gaugeEnabled.checked;
        this.settings.condition = this.configInputs.condition.value;
        this.settings.activation = this.configInputs.activation.value;
        this.settings.nextCount = getInt(this.configInputs.nextCount, 5, 1, 7);
        this.settings.rules.linesThreshold = getInt(this.configInputs.linesThreshold, 20, 1, 2000);
        this.settings.rules.scoreThreshold = getInt(this.configInputs.scoreThreshold, 400, 1, 1000000);
        this.settings.rules.comboTarget = getInt(this.configInputs.comboTarget, 3, 1, 200);
        this.settings.rules.comboTimes = getInt(this.configInputs.comboTimes, 2, 1, 200);
        this.settings.rules.multilineTarget = this.configInputs.multilineTarget.value;
        this.settings.rules.multilineTimes = getInt(this.configInputs.multilineTimes, 2, 1, 200);
        this.settings.rules.monoTimes = getInt(this.configInputs.monoTimes, 1, 1, 200);
        this.settings.rules.turnsThreshold = getInt(this.configInputs.turnsThreshold, 12, 1, 5000);
        this.settings.rules.timeThreshold = getInt(this.configInputs.timeThreshold, 30, 1, 3600);
        this.settings.effect.type = this.configInputs.effect.value;
        this.settings.effect.x = this.isSpeedEffect(this.settings.effect.type)
            ? getFloat(this.configInputs.x, 2, 0.1, 100000)
            : getInt(this.configInputs.x, 2, 1, 100000);
        this.settings.effect.speedDuration = getFloat(this.configInputs.speedEffectDuration, 5, 0.1, 3600);
        this.settings.effect.speedTurns = getInt(this.configInputs.speedEffectTurns, 5, 1, 500);
        this.settings.effect.featureTargets = parseFeatureTargets(this.configInputs.featureTarget.value);
        if (!this.gauge?.timedPenalty) this.speedMultiplier = this.settings.baseSpeedMultiplier;
    }

    resetState() {
        this.board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
        this.queue = [];
        this.hold = null;
        this.canHold = true;
        this.current = null;
        this.score = 0;
        this.lines = 0;
        this.level = this.settings.levelProgression ? 1 : 0;
        this.combo = -1;
        this.backToBack = false;
        this.running = false;
        this.paused = false;
        this.dropCounter = 0;
        this.lastTime = 0;
        this.rafId = null;
        this.lockDelay = 420;
        this.lockCounter = 0;
        this.invisibleUntil = 0;
        this.invisibleTurnsRemaining = 0;
        this.boardInvisibleUntil = 0;
        this.boardInvisibleTurnsRemaining = 0;
        this.pieceInvisibleUntil = 0;
        this.pieceInvisibleTurnsRemaining = 0;
        this.nextHiddenTurnsRemaining = 0;
        this.speedMultiplier = this.settings.baseSpeedMultiplier;
        this.turnCount = 0;
        this.blockedFeatureTurns = { hold: 0, ghost: 0, mirror: 0 };
        this.blockedFeatureMs = { hold: 0, ghost: 0, mirror: 0 };

        this.gauge = {
            max: 100,
            value: 0,
            ready: false,
            pendingNextClear: false,
            timedUnlock: null,
            turnUnlock: null,
            timedPenalty: null,
            progress: {
                lines: 0,
                score: 0,
                comboHits: 0,
                multilineHits: 0,
                monoHits: 0,
                turns: 0,
                elapsed_time: 0
            }
        };

        this.ensureQueue();
    }

    bindEvents() {
        this.on(this.startBtn, "click", () => this.start());
        this.on(this.pauseBtn, "click", () => this.togglePause());
        this.on(this.resetBtn, "click", () => this.reset());
        this.on(this.gaugeUseBtn, "click", () => this.activateGauge());
        this.on(this.configInputs.condition, "change", () => this.updateVisibleConditionFields());
        this.on(this.configInputs.gaugeEnabled, "change", () => this.updateVisibleGaugeFields());
        this.on(this.configInputs.nextCount, "input", () => this.updateNextPreviewCountFromUI());
        this.on(this.configInputs.nextCount, "change", () => this.updateNextPreviewCountFromUI());
        this.on(this.configInputs.trueRandom, "change", () => this.updateRandomizerFromUI());
        this.on(this.configInputs.baseSpeedMultiplier, "input", () => this.updateBaseSpeedFromUI());
        this.on(this.configInputs.baseSpeedMultiplier, "change", () => this.updateBaseSpeedFromUI());
        this.on(this.configInputs.levelProgression, "change", () => this.updateLevelProgressionFromUI());
        this.on(this.configInputs.effect, "change", () => {
            this.updateGaugeXInputMode();
            this.updateVisibleEffectFields();
            this.updateFeatureTargetOptions();
        });
        [this.configInputs.hold, this.configInputs.ghost, this.configInputs.mirror].forEach((input) => {
            this.on(input, "change", () => this.updateFeatureTargetOptions());
        });

        this.on(this.playAgainBtn, "click", () => {
            this.overlay.style.display = "none";
            this.reset();
            this.start();
        });

        this.on(document, "keydown", (event) => this.handleKey(event));
        this.container.querySelectorAll(".touch-controls button").forEach((button) => {
            this.on(button, "click", () => this.handleAction(button.dataset.action));
        });
    }

    updateGaugeXInputMode() {
        const speedEffect = this.isSpeedEffect(this.configInputs.effect.value);
        this.configInputs.x.min = speedEffect ? "0.1" : "1";
        this.configInputs.x.step = speedEffect ? "0.1" : "1";
        if (speedEffect) return;

        const raw = Number.parseFloat(this.configInputs.x.value);
        const normalized = Number.isNaN(raw) ? 1 : clamp(Math.round(raw), 1, 100000);
        this.configInputs.x.value = String(normalized);
    }

    updateNextPreviewCountFromUI() {
        const raw = Number.parseInt(this.configInputs.nextCount.value, 10);
        this.settings.nextCount = Number.isNaN(raw) ? 5 : clamp(raw, 1, 7);
        this.drawPreviews();
    }

    updateBaseSpeedFromUI() {
        const raw = Number.parseFloat(this.configInputs.baseSpeedMultiplier.value);
        this.settings.baseSpeedMultiplier = Number.isNaN(raw) ? 1 : clamp(raw, 0.1, 20);
        if (!this.running || this.gauge.timedPenalty?.type !== "speed_multiplier") {
            this.speedMultiplier = this.settings.baseSpeedMultiplier;
        }
    }

    updateLevelProgressionFromUI() {
        this.settings.levelProgression = !!this.configInputs.levelProgression.checked;
        this.level = this.settings.levelProgression ? this.getProgressionLevel() : 0;
        this.updateUi();
    }

    getProgressionLevel() {
        return Math.floor(this.lines / 10) + 1;
    }

    updateRandomizerFromUI() {
        if (this.running) return;
        this.settings.trueRandom = !!this.configInputs.trueRandom.checked;
        this.queue = [];
        this.ensureQueue();
        this.drawPreviews();
    }

    updateVisibleConditionFields() {
        const selected = this.configInputs.condition.value;
        const gaugeEnabled = this.configInputs.gaugeEnabled.checked;
        this.container.querySelectorAll("[data-condition-field]").forEach((field) => {
            field.classList.toggle("is-hidden", !gaugeEnabled || field.dataset.conditionField !== selected);
        });
    }

    updateVisibleEffectFields() {
        const selected = this.configInputs.effect.value;
        const gaugeEnabled = this.configInputs.gaugeEnabled.checked;
        const needsFeatureTarget = this.effectNeedsFeatureTarget(selected);
        this.container.querySelectorAll("[data-effect-field]").forEach((field) => {
            const fieldType = field.dataset.effectField;
            const visible =
                (fieldType === "feature-target" && needsFeatureTarget) ||
                (fieldType === "speed-duration" && selected === "speed_multiplier") ||
                (fieldType === "speed-turns" && selected === "speed_multiplier_turns");
            field.classList.toggle("is-hidden", !gaugeEnabled || !visible);
        });
    }

    updateVisibleGaugeFields() {
        const gaugeEnabled = this.configInputs.gaugeEnabled.checked;
        this.container.querySelectorAll(".gauge-field").forEach((field) => {
            field.classList.toggle("is-hidden", !gaugeEnabled);
        });
        this.updateVisibleConditionFields();
        this.updateVisibleEffectFields();
        this.updateFeatureTargetOptions();
    }

    updateFeatureTargetOptions() {
        const effectChanged = this.updateGaugeEffectOptions();
        let effect = this.configInputs.effect.value;
        const options = Array.from(this.configInputs.featureTarget.options);
        if (effectChanged) this.updateVisibleEffectFields();

        if (!this.effectNeedsFeatureTarget(effect)) {
            options.forEach((option) => {
                option.disabled = false;
            });
            return;
        }

        const applyDisabledState = (selectedEffect) => {
            options.forEach((option) => {
                const targets = parseFeatureTargets(option.value);
                option.disabled = this.isFeatureTargetInvalidForEffect(selectedEffect, targets);
            });
        };

        applyDisabledState(effect);

        const selectedOption = this.configInputs.featureTarget.selectedOptions[0];
        if (effectChanged || !selectedOption || selectedOption.disabled) {
            this.selectPreferredFeatureTarget(effect, options);
        }
    }

    updateGaugeEffectOptions() {
        const effectSelect = this.configInputs.effect;
        const options = Array.from(effectSelect.options);
        options.forEach((option) => {
            option.disabled = !this.isGaugeEffectSelectable(option.value);
        });

        const selectedOption = effectSelect.selectedOptions[0];
        if (selectedOption && !selectedOption.disabled) return false;

        const fallbackEffect = this.getFallbackFeatureEffect(effectSelect.value);
        const fallbackOption = options.find((option) => option.value === fallbackEffect && !option.disabled);
        const firstValid = options.find((option) => !option.disabled);
        const nextOption = fallbackOption || firstValid;
        if (!nextOption) return false;

        const changed = effectSelect.value !== nextOption.value;
        effectSelect.value = nextOption.value;
        return changed;
    }

    effectNeedsFeatureTarget(effect) {
        return effect === "timed_unlock" || effect === "timed_unlock_turns" || effect === "block_feature_turns" || effect === "block_feature_seconds";
    }

    isSpeedEffect(effect) {
        return effect === "speed_multiplier" || effect === "speed_multiplier_turns";
    }

    isGaugeEffectSelectable(effect) {
        if (!this.effectNeedsFeatureTarget(effect)) return true;
        return this.getValidFeatureTargetsForEffect(effect).length > 0;
    }

    isFeatureTargetInvalidForEffect(effect, targets) {
        const validTargets = this.getValidFeatureTargetsForEffect(effect);
        return targets.some((target) => !validTargets.includes(target));
    }

    getFallbackFeatureEffect(effect) {
        if (effect === "timed_unlock" || effect === "timed_unlock_turns") return "block_feature_turns";
        if (effect === "block_feature_turns" || effect === "block_feature_seconds") return "timed_unlock_turns";
        return effect;
    }

    getValidFeatureTargetsForEffect(effect) {
        const features = ["ghost", "hold", "mirror"];
        if (effect === "timed_unlock" || effect === "timed_unlock_turns") {
            return features.filter((feature) => !this.isFeatureBaseEnabledInForm(feature));
        }
        if (effect === "block_feature_turns" || effect === "block_feature_seconds") {
            return features.filter((feature) => this.isFeatureBaseEnabledInForm(feature));
        }
        return features;
    }

    selectPreferredFeatureTarget(effect, options) {
        const preferredValue = this.getValidFeatureTargetsForEffect(effect).join(",");
        const preferredOption = options.find((option) => option.value === preferredValue && !option.disabled);
        const firstValid = options.find((option) => !option.disabled);
        const nextOption = preferredOption || firstValid;
        if (nextOption) this.configInputs.featureTarget.value = nextOption.value;
    }

    isFeatureBaseEnabledInForm(feature) {
        if (feature === "hold") return this.configInputs.hold.checked;
        if (feature === "ghost") return this.configInputs.ghost.checked;
        if (feature === "mirror") return this.configInputs.mirror.checked;
        return false;
    }

    on(target, type, handler) {
        target.addEventListener(type, handler);
        this.listeners.push(() => target.removeEventListener(type, handler));
    }

    destroy() {
        this.destroyed = true;
        if (this.rafId) cancelAnimationFrame(this.rafId);
        this.listeners.forEach((off) => off());
        this.listeners = [];
    }

    start() {
        if (this.running) return;
        this.readSettingsFromUI();
        this.queue = [];
        this.ensureQueue();
        this.running = true;
        this.paused = false;
        this.current = this.takeFromQueue();
        if (this.collides(this.current)) {
            this.gameOver();
            return;
        }
        this.startBtn.disabled = true;
        this.pauseBtn.disabled = false;
        this.stateEl.textContent = "En jeu";
        const prelaunchPanel = this.container.querySelector("#prelaunchPanel");
        if (prelaunchPanel) prelaunchPanel.style.display = "none";
        this.lastTime = performance.now();
        this.loop(this.lastTime);
        this.playSound(220, 0.04);
        this.updateUi();
        this.drawPreviews();
    }

    reset() {
        if (this.rafId) cancelAnimationFrame(this.rafId);
        this.resetState();
        this.overlay.style.display = "none";
        const prelaunchPanel = this.container.querySelector("#prelaunchPanel");
        if (prelaunchPanel) prelaunchPanel.style.display = "";
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.pauseBtn.textContent = "Pause";
        this.stateEl.textContent = "Pret";
        this.updateUi();
        this.draw();
        this.drawPreviews();
    }

    togglePause() {
        if (!this.running) return;
        this.paused = !this.paused;
        this.pauseBtn.textContent = this.paused ? "Reprendre" : "Pause";
        this.stateEl.textContent = this.paused ? "Pause" : "En jeu";
        if (!this.paused) {
            this.lastTime = performance.now();
            this.loop(this.lastTime);
        }
    }

    loop(time) {
        if (!this.running || this.paused || this.destroyed) return;
        const delta = Math.min(48, time - this.lastTime);
        this.lastTime = time;
        this.dropCounter += delta;
        this.tickTimedGaugeUnlock(delta);
        this.tickTimedGaugePenalty(delta);
        this.tickTimedFeatureBlocks(delta);
        this.trackGaugeByElapsedTime(delta / 1000);

        if (this.dropCounter >= this.dropInterval()) {
            if (!this.move(0, 1)) {
                this.lockCounter += this.dropCounter;
                if (this.lockCounter >= this.lockDelay) this.lockPiece();
            } else {
                this.lockCounter = 0;
            }
            this.dropCounter = 0;
        }

        this.draw();
        this.rafId = requestAnimationFrame((nextTime) => this.loop(nextTime));
    }

    dropInterval() {
        const progressionLevel = this.settings.levelProgression ? this.level : 1;
        const baseInterval = Math.max(80, 980 - (progressionLevel - 1) * 75);
        return Math.max(30, baseInterval / this.speedMultiplier);
    }

    handleKey(event) {
        const keys = ["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", " ", "z", "Z", "c", "C", "Shift", "p", "P", "m", "M", "a", "A"];
        if (!keys.includes(event.key)) return;
        event.preventDefault();
        const actionMap = {
            ArrowLeft: "left",
            ArrowRight: "right",
            ArrowDown: "down",
            ArrowUp: "rotate",
            " ": "drop",
            z: "rotate-ccw",
            Z: "rotate-ccw",
            c: "hold",
            C: "hold",
            Shift: "hold",
            p: "pause",
            P: "pause",
            m: "mirror",
            M: "mirror",
            a: "activate-gauge",
            A: "activate-gauge"
        };
        this.handleAction(actionMap[event.key]);
    }

    handleAction(action) {
        if (action === "pause") {
            this.togglePause();
            return;
        }
        if (action === "activate-gauge") {
            this.activateGauge();
            return;
        }
        if (!this.running || this.paused || !this.current) return;
        action = this.getEffectiveAction(action);

        if (action === "left") this.move(-1, 0);
        if (action === "right") this.move(1, 0);
        if (action === "down" && this.move(0, 1)) {
            this.score += 1;
            this.dropCounter = 0;
            this.lockCounter = 0;
            this.trackGaugeByScore(1);
        }
        if (action === "rotate") this.rotateCurrent(1);
        if (action === "rotate-ccw") this.rotateCurrent(-1);
        if (action === "mirror") this.mirrorRotate();
        if (action === "drop") this.hardDrop();
        if (action === "hold") this.holdPiece();

        this.updateUi();
        this.draw();
        this.drawPreviews();
    }

    getEffectiveAction(action) {
        if (!this.areControlsInverted()) return action;
        const inverted = {
            left: "right",
            right: "left",
            down: "drop",
            drop: "down",
            rotate: "rotate-ccw",
            "rotate-ccw": "rotate",
            hold: "mirror",
            mirror: "hold"
        };
        return inverted[action] || action;
    }

    areControlsInverted() {
        return this.gauge.timedPenalty?.type === "invert_controls";
    }

    ensureQueue() {
        while (this.queue.length < 7) {
            if (this.settings.trueRandom) {
                this.queue.push(this.createPiece(randomPieceType()));
            } else {
                this.queue.push(...shuffle(BAG_TYPES).map((type) => this.createPiece(type)));
            }
        }
    }

    takeFromQueue() {
        this.ensureQueue();
        const piece = this.queue.shift();
        this.ensureQueue();
        piece.x = Math.floor((COLS - piece.matrix[0].length) / 2);
        piece.y = -this.topPadding(piece.matrix);
        piece.rotation = 0;
        this.canHold = true;
        if (this.running) this.onPieceSpawn();
        return piece;
    }

    onPieceSpawn() {
        this.turnCount += 1;
        this.tickTurnBasedEffects();
        this.trackGaugeByTurns(1);
        this.updateUi();
    }

    createPiece(type) {
        return {
            type,
            color: PIECES[type].color,
            matrix: cloneMatrix(PIECES[type].matrix),
            x: 0,
            y: 0,
            rotation: 0
        };
    }

    topPadding(matrix) {
        let emptyRows = 0;
        for (const row of matrix) {
            if (row.some(Boolean)) break;
            emptyRows++;
        }
        return emptyRows;
    }

    move(dx, dy) {
        const moved = { ...this.current, x: this.current.x + dx, y: this.current.y + dy };
        if (this.collides(moved)) return false;
        this.current.x = moved.x;
        this.current.y = moved.y;
        return true;
    }

    rotateCurrent(direction) {
        if (this.current.type === "O") return;
        const previous = clonePiece(this.current);
        const rotated = direction > 0 ? rotateMatrix(this.current.matrix) : rotateMatrixCounter(this.current.matrix);
        const kicks = [0, -1, 1, -2, 2];

        this.current.matrix = rotated;
        this.current.rotation = (this.current.rotation + direction + 4) % 4;

        for (const kick of kicks) {
            this.current.x = previous.x + kick;
            if (!this.collides(this.current)) {
                this.playSound(420, 0.025);
                return;
            }
        }
        Object.assign(this.current, previous);
    }

    mirrorRotate() {
        if (!this.isMirrorAllowed()) return;
        const previous = clonePiece(this.current);
        const mirrored = this.current.matrix.map((row) => [...row].reverse());
        const kicks = [0, -1, 1, -2, 2];
        this.current.matrix = mirrored;
        for (const kick of kicks) {
            this.current.x = previous.x + kick;
            if (!this.collides(this.current)) {
                this.playSound(360, 0.02);
                return;
            }
        }
        Object.assign(this.current, previous);
    }

    isFeatureBaseEnabled(feature) {
        if (feature === "hold") return this.settings.holdEnabled;
        if (feature === "ghost") return this.settings.ghostEnabled;
        if (feature === "mirror") return this.settings.mirrorEnabled;
        return false;
    }

    isFeatureBlocked(feature) {
        return (this.blockedFeatureTurns[feature] || 0) > 0 || (this.blockedFeatureMs[feature] || 0) > 0;
    }

    isHoldAllowed() {
        if (this.isFeatureBlocked("hold")) return false;
        if (this.isFeatureUnlocked("hold")) return true;
        return this.settings.holdEnabled;
    }

    isGhostAllowed() {
        if (this.isFeatureBlocked("ghost")) return false;
        if (this.isFeatureUnlocked("ghost")) return true;
        return this.settings.ghostEnabled;
    }

    isMirrorAllowed() {
        if (this.isFeatureBlocked("mirror")) return false;
        if (this.isFeatureUnlocked("mirror")) return true;
        return this.settings.mirrorEnabled;
    }

    isFeatureUnlocked(feature) {
        return !!(
            (this.gauge.timedUnlock && this.gauge.timedUnlock.features.includes(feature)) ||
            (this.gauge.turnUnlock && this.gauge.turnUnlock.features.includes(feature))
        );
    }

    tickTurnBasedEffects() {
        if (this.invisibleTurnsRemaining > 0) this.invisibleTurnsRemaining -= 1;
        if (this.boardInvisibleTurnsRemaining > 0) this.boardInvisibleTurnsRemaining -= 1;
        if (this.pieceInvisibleTurnsRemaining > 0) this.pieceInvisibleTurnsRemaining -= 1;
        if (this.nextHiddenTurnsRemaining > 0) this.nextHiddenTurnsRemaining -= 1;
        ["hold", "ghost", "mirror"].forEach((feature) => {
            if (this.blockedFeatureTurns[feature] > 0) this.blockedFeatureTurns[feature] -= 1;
        });
        if (this.gauge.turnUnlock) {
            this.gauge.turnUnlock.remainingTurns = Math.max(0, this.gauge.turnUnlock.remainingTurns - 1);
            this.gauge.value = Math.round((this.gauge.turnUnlock.remainingTurns / this.gauge.turnUnlock.totalTurns) * this.gauge.max);
            if (this.gauge.turnUnlock.remainingTurns <= 0) {
                this.gauge.turnUnlock = null;
                this.consumeGauge("Mode temporaire termine");
            }
        }
        if (this.gauge.timedPenalty?.type === "speed_multiplier_turns") {
            this.gauge.timedPenalty.remainingTurns = Math.max(0, this.gauge.timedPenalty.remainingTurns - 1);
            this.gauge.value = Math.round((this.gauge.timedPenalty.remainingTurns / this.gauge.timedPenalty.totalTurns) * this.gauge.max);
            if (this.gauge.timedPenalty.remainingTurns <= 0) this.endGaugePenalty();
        }
    }

    tickTimedFeatureBlocks(deltaMs) {
        let expired = false;
        ["hold", "ghost", "mirror"].forEach((feature) => {
            const previous = this.blockedFeatureMs[feature] || 0;
            if (previous <= 0) return;
            this.blockedFeatureMs[feature] = Math.max(0, previous - deltaMs);
            if (this.blockedFeatureMs[feature] === 0) expired = true;
        });
        if (expired) this.drawPreviews();
    }

    holdPiece() {
        if (!this.isHoldAllowed()) return;
        if (!this.canHold) return;
        const heldType = this.current.type;
        if (this.hold) {
            this.current = this.createPiece(this.hold);
            this.current.x = Math.floor((COLS - this.current.matrix[0].length) / 2);
            this.current.y = -this.topPadding(this.current.matrix);
        } else {
            this.current = this.takeFromQueue();
        }
        this.hold = heldType;
        this.canHold = false;
        if (this.collides(this.current)) {
            this.gameOver();
            return;
        }
        this.playSound(320, 0.035);
    }

    hardDrop() {
        let distance = 0;
        while (this.move(0, 1)) distance++;
        this.score += distance * 2;
        this.trackGaugeByScore(distance * 2);
        this.lockPiece();
    }

    lockPiece() {
        forEachBlock(this.current, (x, y) => {
            if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
                this.board[y][x] = { type: this.current.type, color: this.current.color };
            }
        });
        this.clearLines();
        this.current = this.takeFromQueue();
        if (this.collides(this.current)) {
            this.gameOver();
            return;
        }
        this.lockCounter = 0;
        this.dropCounter = 0;
        this.drawPreviews();
    }

    clearLines() {
        const fullRows = [];
        for (let y = 0; y < ROWS; y++) if (this.board[y].every(Boolean)) fullRows.push(y);

        if (!fullRows.length) {
            this.combo = -1;
            this.backToBack = false;
            return;
        }

        const clearedRows = fullRows.map((rowIndex) => this.board[rowIndex]);

        this.board = this.board.filter((row) => !row.every(Boolean));
        while (this.board.length < ROWS) this.board.unshift(Array(COLS).fill(null));

        if (this.gauge.pendingNextClear) {
            const extra = clamp(this.settings.effect.x, 1, ROWS / 2);
            for (let i = 0; i < extra; i++) {
                this.board.shift();
                this.board.pop();
                this.board.unshift(Array(COLS).fill(null));
                this.board.push(Array(COLS).fill(null));
            }
            this.consumeGauge("Boost applique au prochain clear");
            this.gauge.pendingNextClear = false;
        }

        const cleared = fullRows.length;
        this.combo++;
        this.lines += cleared;
        this.level = this.settings.levelProgression ? this.getProgressionLevel() : 0;
        const scoringLevel = Math.max(1, this.level);
        const difficult = cleared === 4;
        let gained = SCORE_TABLE[cleared] * scoringLevel;
        if (this.combo > 0) gained += this.combo * 50 * scoringLevel;
        if (difficult && this.backToBack) gained = Math.floor(gained * 1.5);
        this.backToBack = difficult;
        this.score += gained;

        this.trackGaugeByLines(cleared);
        this.trackGaugeByScore(gained);
        this.trackGaugeByCombo();
        this.trackGaugeByMultiline(cleared);
        this.trackGaugeByMonoColorLines(clearedRows);

        this.flashLines();
        this.playSound(cleared === 4 ? 740 : 540, 0.08);
        this.updateBestScore();
        this.updateUi();
    }

    collides(piece) {
        let hit = false;
        forEachBlock(piece, (x, y) => {
            if (x < 0 || x >= COLS || y >= ROWS) hit = true;
            if (y >= 0 && this.board[y]?.[x]) hit = true;
        });
        return hit;
    }

    ghostPiece() {
        const ghost = clonePiece(this.current);
        while (!this.collides({ ...ghost, y: ghost.y + 1 })) ghost.y++;
        return ghost;
    }

    updateBestScore() {
        if (this.score <= this.bestScore) return;
        this.bestScore = this.score;
        localStorage.setItem(STORAGE_KEY, String(this.bestScore));
    }

    gameOver() {
        this.running = false;
        this.pauseBtn.disabled = true;
        this.startBtn.disabled = false;
        this.gaugeUseBtn.disabled = true;
        this.stateEl.textContent = "Termine";
        this.finalScoreEl.textContent = formatNumber(this.score);
        this.overlay.style.display = "flex";
        const prelaunchPanel = this.container.querySelector("#prelaunchPanel");
        if (prelaunchPanel) prelaunchPanel.style.display = "";
        this.updateBestScore();
        this.playSound(120, 0.16);
    }

    trackGaugeByLines(clearedCount) {
        if (this.settings.condition !== "lines") return;
        this.addGaugeProgress(clearedCount);
    }

    trackGaugeByScore(points) {
        if (this.settings.condition !== "score") return;
        this.addGaugeProgress(points);
    }

    trackGaugeByCombo() {
        if (this.settings.condition !== "combo") return;
        if (!this.canChargeGauge()) return;
        if (this.combo + 1 >= this.settings.rules.comboTarget) {
            this.gauge.progress.comboHits++;
            this.updateGaugeProgress(`Combos: ${this.gauge.progress.comboHits}/${this.settings.rules.comboTimes}`);
        }
    }

    trackGaugeByMultiline(clearedCount) {
        if (this.settings.condition !== "multiline") return;
        if (!this.canChargeGauge()) return;
        if (!matchesMultilineTarget(clearedCount, this.settings.rules.multilineTarget)) return;
        this.gauge.progress.multilineHits++;
        this.updateGaugeProgress(`Multilignes: ${this.gauge.progress.multilineHits}/${this.settings.rules.multilineTimes}`);
    }

    trackGaugeByMonoColorLines(clearedRows) {
        if (this.settings.condition !== "mono_color") return;
        if (!this.canChargeGauge()) return;
        let monoFound = 0;
        clearedRows.forEach((row) => {
            const allTypes = new Set(row.map((cell) => cell?.type).filter(Boolean));
            if (allTypes.size === 1) monoFound++;
        });
        if (!monoFound) return;
        this.gauge.progress.monoHits += monoFound;
        this.updateGaugeProgress(`Mono-couleur: ${this.gauge.progress.monoHits}/${this.settings.rules.monoTimes}`);
    }

    trackGaugeByTurns(turns) {
        if (this.settings.condition !== "turns") return;
        this.addGaugeProgress(turns);
    }

    trackGaugeByElapsedTime(seconds) {
        if (this.settings.condition !== "elapsed_time") return;
        this.addGaugeProgress(seconds);
        this.updateUi();
    }

    addGaugeProgress(amount) {
        if (!this.canChargeGauge()) return;
        this.gauge.progress[this.settings.condition] += amount;
        this.updateGaugeProgress(this.describeGaugeProgress());
    }

    updateGaugeProgress(hint) {
        if (!this.canChargeGauge()) return;
        const threshold = this.getGaugeThreshold();
        const progress = this.getGaugeProgress();
        this.gauge.value = clamp((progress / threshold) * this.gauge.max, 0, this.gauge.max);
        if (this.gauge.value >= this.gauge.max) {
            this.gauge.ready = true;
            this.gauge.value = this.gauge.max;
            this.playSound(860, 0.06);
            if (this.settings.activation === "auto") {
                this.activateGauge();
            } else {
                this.gaugeHintEl.textContent = "Jauge pleine: active l'effet.";
            }
        } else {
            this.gaugeHintEl.textContent = hint;
        }
    }

    canChargeGauge() {
        return this.settings.gaugeEnabled && !this.gauge.ready && !this.gauge.pendingNextClear && !this.gauge.timedUnlock && !this.gauge.turnUnlock && !this.gauge.timedPenalty;
    }

    getGaugeProgress() {
        if (this.settings.condition === "score") return this.gauge.progress.score;
        if (this.settings.condition === "lines") return this.gauge.progress.lines;
        if (this.settings.condition === "combo") return this.gauge.progress.comboHits;
        if (this.settings.condition === "multiline") return this.gauge.progress.multilineHits;
        if (this.settings.condition === "mono_color") return this.gauge.progress.monoHits;
        if (this.settings.condition === "turns") return this.gauge.progress.turns;
        if (this.settings.condition === "elapsed_time") return this.gauge.progress.elapsed_time;
        return 0;
    }

    getGaugeThreshold() {
        if (this.settings.condition === "score") return this.settings.rules.scoreThreshold;
        if (this.settings.condition === "lines") return this.settings.rules.linesThreshold;
        if (this.settings.condition === "combo") return this.settings.rules.comboTimes;
        if (this.settings.condition === "multiline") return this.settings.rules.multilineTimes;
        if (this.settings.condition === "mono_color") return this.settings.rules.monoTimes;
        if (this.settings.condition === "turns") return this.settings.rules.turnsThreshold;
        if (this.settings.condition === "elapsed_time") return this.settings.rules.timeThreshold;
        return 1;
    }

    describeGaugeProgress() {
        const progress = Math.floor(this.getGaugeProgress());
        const threshold = this.getGaugeThreshold();
        if (this.settings.condition === "score") return `Score: ${progress}/${threshold}`;
        if (this.settings.condition === "lines") return `Lignes: ${progress}/${threshold}`;
        if (this.settings.condition === "combo") return `Combos: ${progress}/${threshold}`;
        if (this.settings.condition === "multiline") return `Multilignes ${formatMultilineTarget(this.settings.rules.multilineTarget)}: ${progress}/${threshold}`;
        if (this.settings.condition === "mono_color") return `Mono-couleur: ${progress}/${threshold}`;
        if (this.settings.condition === "turns") return `Tours: ${progress}/${threshold}`;
        if (this.settings.condition === "elapsed_time") return `Temps: ${progress}/${threshold}s`;
        return "Jauge en charge";
    }

    resetGaugeProgress() {
        this.gauge.progress.score = 0;
        this.gauge.progress.lines = 0;
        this.gauge.progress.comboHits = 0;
        this.gauge.progress.multilineHits = 0;
        this.gauge.progress.monoHits = 0;
        this.gauge.progress.turns = 0;
        this.gauge.progress.elapsed_time = 0;
    }

    consumeGauge(message) {
        this.resetGaugeProgress();
        this.gauge.value = 0;
        this.gauge.ready = false;
        this.gaugeHintEl.textContent = message;
    }

    activateGauge() {
        if (!this.running || !this.settings.gaugeEnabled) return;
        if (!this.gauge.ready) return;

        const effect = this.settings.effect.type;
        const x = clamp(this.settings.effect.x, 0.1, 100000);
        const intX = clamp(Math.round(x), 1, 100000);
        const targets = this.settings.effect.featureTargets;
        const targetLabel = formatFeatureList(targets);

        if (effect === "clear_bottom") {
            const linesToClear = clamp(intX, 1, ROWS);
            this.clearBottomLines(linesToClear);
            this.consumeGauge(`Boost: ${linesToClear} lignes du bas supprimees`);
        }

        if (effect === "clear_top_bottom_on_next_clear") {
            this.gauge.pendingNextClear = true;
            this.gauge.ready = false;
            this.gauge.value = this.gauge.max;
            this.gaugeHintEl.textContent = "Boost en attente: prochain clear amplifie.";
        }

        if (effect === "increase_score") {
            this.score += intX;
            this.updateBestScore();
            this.consumeGauge(`Boost: score augmente de ${formatNumber(intX)}`);
        }

        if (effect === "decrease_score") {
            this.score = Math.max(0, this.score - intX);
            this.consumeGauge(`Malus: score reduit de ${formatNumber(intX)}`);
        }

        if (effect === "add_random_blocks") {
            const blocksToAdd = clamp(intX, 1, 100);
            this.addRandomBlocks(blocksToAdd);
            this.consumeGauge(`Malus: ${blocksToAdd} blocs aleatoires ajoutes`);
        }

        if (effect === "invisible_seconds") {
            this.invisibleUntil = performance.now() + x * 1000;
            this.consumeGauge(`Malus: invisible pendant ${formatEffectValue(x)}s`);
        }

        if (effect === "invisible_turns") {
            this.invisibleTurnsRemaining = intX;
            this.consumeGauge(`Malus: invisible pendant ${intX} tours`);
        }

        if (effect === "board_invisible_seconds") {
            this.boardInvisibleUntil = performance.now() + x * 1000;
            this.consumeGauge(`Malus: plateau invisible pendant ${formatEffectValue(x)}s`);
        }

        if (effect === "board_invisible_turns") {
            this.boardInvisibleTurnsRemaining = intX;
            this.consumeGauge(`Malus: plateau invisible pendant ${intX} tours`);
        }

        if (effect === "piece_invisible_seconds") {
            this.pieceInvisibleUntil = performance.now() + x * 1000;
            this.consumeGauge(`Malus: piece invisible pendant ${formatEffectValue(x)}s`);
        }

        if (effect === "piece_invisible_turns") {
            this.pieceInvisibleTurnsRemaining = intX;
            this.consumeGauge(`Malus: piece invisible pendant ${intX} tours`);
        }

        if (effect === "hide_next_turns") {
            this.nextHiddenTurnsRemaining = intX;
            this.consumeGauge(`Malus: pieces suivantes masquees pendant ${intX} tours`);
        }

        if (effect === "invert_controls_seconds") {
            this.resetGaugeProgress();
            this.gauge.timedPenalty = {
                type: "invert_controls",
                totalMs: x * 1000,
                remainingMs: x * 1000
            };
            this.gauge.ready = false;
            this.gauge.value = this.gauge.max;
            this.gaugeHintEl.textContent = `Malus: commandes inversees (${formatEffectValue(x)}s)`;
        }

        if (effect === "speed_multiplier") {
            const duration = clamp(this.settings.effect.speedDuration, 0.1, 3600);
            this.resetGaugeProgress();
            this.speedMultiplier = clamp(x, 0.1, 20);
            this.gauge.timedPenalty = {
                type: "speed_multiplier",
                totalMs: duration * 1000,
                remainingMs: duration * 1000
            };
            this.gauge.ready = false;
            this.gauge.value = this.gauge.max;
            this.gaugeHintEl.textContent = `Vitesse x${formatEffectValue(this.speedMultiplier)} pendant ${formatEffectValue(duration)}s`;
        }

        if (effect === "speed_multiplier_turns") {
            const turns = clamp(Math.round(this.settings.effect.speedTurns), 1, 500);
            this.resetGaugeProgress();
            this.speedMultiplier = clamp(x, 0.1, 20);
            this.gauge.timedPenalty = {
                type: "speed_multiplier_turns",
                totalTurns: turns,
                remainingTurns: turns
            };
            this.gauge.ready = false;
            this.gauge.value = this.gauge.max;
            this.gaugeHintEl.textContent = `Vitesse x${formatEffectValue(this.speedMultiplier)} pendant ${turns} tours`;
        }

        if (effect === "timed_unlock") {
            const alreadyEnabled = targets.filter((target) => this.isFeatureBaseEnabled(target));
            if (alreadyEnabled.length) {
                this.gaugeHintEl.textContent = `Refus: deja actif h24 (${formatFeatureList(alreadyEnabled)}).`;
                this.updateUi();
                return;
            }
            this.resetGaugeProgress();
            this.gauge.timedUnlock = {
                features: targets,
                totalMs: x * 1000,
                remainingMs: x * 1000
            };
            this.gauge.ready = false;
            this.gauge.value = this.gauge.max;
            this.gaugeHintEl.textContent = `Mode temporaire: ${targetLabel} (${formatEffectValue(x)}s)`;
        }

        if (effect === "timed_unlock_turns") {
            const alreadyEnabled = targets.filter((target) => this.isFeatureBaseEnabled(target));
            if (alreadyEnabled.length) {
                this.gaugeHintEl.textContent = `Refus: deja actif h24 (${formatFeatureList(alreadyEnabled)}).`;
                this.updateUi();
                return;
            }
            this.resetGaugeProgress();
            this.gauge.turnUnlock = {
                features: targets,
                totalTurns: intX,
                remainingTurns: intX
            };
            this.gauge.ready = false;
            this.gauge.value = this.gauge.max;
            this.gaugeHintEl.textContent = `Mode temporaire: ${targetLabel} (${intX} tours)`;
        }

        if (effect === "block_feature_turns") {
            const alreadyDisabled = targets.filter((target) => !this.isFeatureBaseEnabled(target));
            if (alreadyDisabled.length) {
                this.gaugeHintEl.textContent = `Refus: deja inactif h24 (${formatFeatureList(alreadyDisabled)}).`;
                this.updateUi();
                return;
            }
            targets.forEach((target) => {
                this.blockedFeatureTurns[target] = intX;
            });
            this.consumeGauge(`Malus: ${targetLabel} bloque pendant ${intX} tours`);
        }

        if (effect === "block_feature_seconds") {
            const alreadyDisabled = targets.filter((target) => !this.isFeatureBaseEnabled(target));
            if (alreadyDisabled.length) {
                this.gaugeHintEl.textContent = `Refus: deja inactif h24 (${formatFeatureList(alreadyDisabled)}).`;
                this.updateUi();
                return;
            }
            targets.forEach((target) => {
                this.blockedFeatureMs[target] = x * 1000;
            });
            this.consumeGauge(`Malus: ${targetLabel} bloque pendant ${formatEffectValue(x)}s`);
        }

        this.updateUi();
        this.draw();
        this.drawPreviews();
    }

    tickTimedGaugeUnlock(deltaMs) {
        const mode = this.gauge.timedUnlock;
        if (!mode) return;
        mode.remainingMs = Math.max(0, mode.remainingMs - deltaMs);
        this.gauge.value = Math.round((mode.remainingMs / mode.totalMs) * this.gauge.max);
        if (mode.remainingMs <= 0) {
            this.gauge.timedUnlock = null;
            this.consumeGauge("Mode temporaire termine");
        }
        this.updateUi();
    }

    tickTimedGaugePenalty(deltaMs) {
        const mode = this.gauge.timedPenalty;
        if (!mode) return;
        if (mode.type === "speed_multiplier_turns") return;
        mode.remainingMs = Math.max(0, mode.remainingMs - deltaMs);
        this.gauge.value = Math.round((mode.remainingMs / mode.totalMs) * this.gauge.max);
        if (mode.remainingMs <= 0) this.endGaugePenalty();
        this.updateUi();
    }

    endGaugePenalty() {
        if (this.gauge.timedPenalty?.type === "speed_multiplier" || this.gauge.timedPenalty?.type === "speed_multiplier_turns") {
            this.speedMultiplier = this.settings.baseSpeedMultiplier;
        }
        this.gauge.timedPenalty = null;
        this.consumeGauge("Effet termine");
    }

    clearBottomLines(count) {
        const n = clamp(count, 1, ROWS);
        for (let i = 0; i < n; i++) {
            this.board.pop();
            this.board.unshift(Array(COLS).fill(null));
        }
        this.flashLines();
    }

    addRandomBlocks(count) {
        const n = clamp(count, 1, 100);
        for (let i = 0; i < n; i++) {
            const x = Math.floor(Math.random() * COLS);
            const y = Math.floor(Math.random() * ROWS);
            if (this.board[y][x]) continue;
            const randomType = BAG_TYPES[Math.floor(Math.random() * BAG_TYPES.length)];
            this.board[y][x] = { type: randomType, color: PIECES[randomType].color };
        }
    }

    updateUi() {
        this.scoreEl.textContent = formatNumber(this.score);
        this.linesEl.textContent = formatNumber(this.lines);
        this.levelEl.textContent = this.level;
        this.comboEl.textContent = Math.max(0, this.combo);
        this.bestScoreEl.textContent = formatNumber(this.bestScore);

        const effectRunning = this.gauge.pendingNextClear || this.gauge.timedUnlock || this.gauge.turnUnlock || this.gauge.timedPenalty;
        this.gaugeUseBtn.textContent = this.settings.activation === "auto" ? "Jauge auto" : "Activer jauge";
        if (effectRunning) this.gaugeUseBtn.textContent = "Effet actif";
        this.gaugeUseBtn.disabled = this.settings.activation === "auto" || !this.running || !this.settings.gaugeEnabled || !this.gauge.ready || !!effectRunning;
        this.gaugeModeLabel.textContent = this.settings.gaugeEnabled ? this.settings.activation : "Desactivee";
        this.gaugeTextEl.textContent = `${Math.round((this.gauge.value / this.gauge.max) * 100)}%`;
        this.gaugeFillEl.style.strokeDashoffset = `${GAUGE_CIRCLE * (1 - this.gauge.value / this.gauge.max)}`;

        if (!this.settings.gaugeEnabled) this.gaugeHintEl.textContent = "Jauge desactivee.";
        if (this.gauge.pendingNextClear) this.gaugeHintEl.textContent = "Effet en attente du prochain clear.";
        if (this.gauge.timedUnlock) {
            const sec = Math.ceil(this.gauge.timedUnlock.remainingMs / 1000);
            this.gaugeHintEl.textContent = `Mode ${formatFeatureList(this.gauge.timedUnlock.features)}: ${sec}s`;
        }
        if (this.gauge.turnUnlock) {
            this.gaugeHintEl.textContent = `Mode ${formatFeatureList(this.gauge.turnUnlock.features)}: ${this.gauge.turnUnlock.remainingTurns} tours`;
        }
        if (this.gauge.timedPenalty?.type === "invert_controls") {
            const sec = Math.ceil(this.gauge.timedPenalty.remainingMs / 1000);
            this.gaugeHintEl.textContent = `Commandes inversees: ${sec}s`;
        }
        if (this.gauge.timedPenalty?.type === "speed_multiplier") {
            const sec = Math.ceil(this.gauge.timedPenalty.remainingMs / 1000);
            this.gaugeHintEl.textContent = `Vitesse x${formatEffectValue(this.speedMultiplier)}: ${sec}s`;
        }
        if (this.gauge.timedPenalty?.type === "speed_multiplier_turns") {
            this.gaugeHintEl.textContent = `Vitesse x${formatEffectValue(this.speedMultiplier)}: ${this.gauge.timedPenalty.remainingTurns} tours`;
        }
    }

    flashLines() {
        this.lineFlash.classList.remove("active");
        void this.lineFlash.offsetWidth;
        this.lineFlash.classList.add("active");
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawBackground(this.ctx, this.canvas.width, this.canvas.height, BLOCK);

        const invisibleByTime = this.running && performance.now() < this.invisibleUntil;
        const invisibleByTurns = this.running && this.invisibleTurnsRemaining > 0;
        const invisible = invisibleByTime || invisibleByTurns;
        const boardInvisibleByTime = this.running && performance.now() < this.boardInvisibleUntil;
        const boardInvisibleByTurns = this.running && this.boardInvisibleTurnsRemaining > 0;
        const boardInvisible = boardInvisibleByTime || boardInvisibleByTurns;
        const pieceInvisibleByTime = this.running && performance.now() < this.pieceInvisibleUntil;
        const pieceInvisibleByTurns = this.running && this.pieceInvisibleTurnsRemaining > 0;
        const pieceInvisible = pieceInvisibleByTime || pieceInvisibleByTurns;
        if (!invisible) {
            if (!boardInvisible) {
                for (let y = 0; y < ROWS; y++) {
                    for (let x = 0; x < COLS; x++) {
                        if (this.board[y][x]) this.drawBlock(this.ctx, x, y, this.board[y][x].color, BLOCK);
                    }
                }
            }
            if (this.current && !boardInvisible && !pieceInvisible && this.isGhostAllowed()) this.drawPiece(this.ctx, this.ghostPiece(), BLOCK, 0.2);
            if (this.current && !pieceInvisible) this.drawPiece(this.ctx, this.current, BLOCK, 1);
        } else {
            this.ctx.fillStyle = "rgba(6,6,9,0.9)";
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = "#f5f7fb";
            this.ctx.font = "bold 18px Segoe UI";
            if (invisibleByTurns) {
                this.ctx.fillText(`Invisibilite: ${this.invisibleTurnsRemaining} tours`, 30, this.canvas.height / 2);
            } else {
                this.ctx.fillText("Invisibilite active", 56, this.canvas.height / 2);
            }
        }

        this.drawGrid(this.ctx, COLS, ROWS, BLOCK);
    }

    drawPreviews() {
        this.drawPreviewCanvas(this.holdCtx, this.holdCanvas, this.hold ? this.createPiece(this.hold) : null, this.isHoldAllowed());
        const count = clamp(this.settings.nextCount, 1, 7);
        this.resizeNextPreviewCanvas(count);
        this.nextCtx.clearRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        this.drawBackground(this.nextCtx, this.nextCanvas.width, this.nextCanvas.height, 30);
        const centerX = this.nextCanvas.width / 2;
        if (this.nextHiddenTurnsRemaining > 0) {
            this.nextCtx.fillStyle = "#aeb7c6";
            this.nextCtx.font = "bold 13px Segoe UI";
            this.nextCtx.textAlign = "center";
            this.nextCtx.fillText("Suivantes masquees", centerX, this.nextCanvas.height / 2 - 8);
            this.nextCtx.font = "12px Segoe UI";
            this.nextCtx.fillText(`${this.nextHiddenTurnsRemaining} tours`, centerX, this.nextCanvas.height / 2 + 14);
            this.nextCtx.textAlign = "start";
            return;
        }
        const firstCenterY = NEXT_PREVIEW_VERTICAL_PADDING + NEXT_PREVIEW_SLOT_HEIGHT / 2;
        this.queue.slice(0, count).forEach((piece, index) => {
            this.drawMiniPiece(this.nextCtx, piece, 22, centerX, firstCenterY + index * NEXT_PREVIEW_SLOT_HEIGHT);
        });
        if (count < 5) {
            this.nextCtx.fillStyle = "#aeb7c6";
            this.nextCtx.font = "12px Segoe UI";
            this.nextCtx.fillText(`Preview: ${count}`, 10, this.nextCanvas.height - 10);
        }
    }

    resizeNextPreviewCanvas(count) {
        const nextHeight = count * NEXT_PREVIEW_SLOT_HEIGHT + NEXT_PREVIEW_VERTICAL_PADDING * 2;
        if (this.nextCanvas.width !== NEXT_PREVIEW_WIDTH) this.nextCanvas.width = NEXT_PREVIEW_WIDTH;
        if (this.nextCanvas.height !== nextHeight) this.nextCanvas.height = nextHeight;
    }

    drawPreviewCanvas(ctx, canvas, piece, allowed = true) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.drawBackground(ctx, canvas.width, canvas.height, 30);
        if (piece && allowed) this.drawMiniPiece(ctx, piece, 24, canvas.width / 2, canvas.height / 2 - 5);
        if (!allowed) {
            ctx.fillStyle = "#aeb7c6";
            ctx.font = "12px Segoe UI";
            ctx.fillText("Hold OFF", 36, canvas.height / 2);
        }
    }

    drawMiniPiece(ctx, piece, size, centerX, centerY) {
        const matrix = piece.matrix;
        const width = matrix[0].length * size;
        const height = matrix.length * size;
        const startX = centerX - width / 2;
        const startY = centerY - height / 2;
        matrix.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (!cell) return;
                this.drawBlockAt(ctx, startX + x * size, startY + y * size, size, piece.color, 1);
            });
        });
    }

    drawPiece(ctx, piece, size, alpha) {
        forEachBlock(piece, (x, y) => {
            if (y >= 0) this.drawBlock(ctx, x, y, piece.color, size, alpha);
        });
    }

    drawBlock(ctx, x, y, color, size, alpha = 1) {
        this.drawBlockAt(ctx, x * size, y * size, size, color, alpha);
    }

    drawBlockAt(ctx, px, py, size, color, alpha) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.fillRect(px + 1, py + 1, size - 2, size - 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
        ctx.fillRect(px + 2, py + 2, size - 4, Math.max(3, size * 0.16));
        ctx.fillRect(px + 2, py + 2, Math.max(3, size * 0.16), size - 4);
        ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
        ctx.fillRect(px + 2, py + size - Math.max(5, size * 0.18), size - 4, Math.max(3, size * 0.14));
        ctx.restore();
    }

    drawBackground(ctx, width, height, size) {
        ctx.fillStyle = "#090a0d";
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = "rgba(255,255,255,0.045)";
        ctx.lineWidth = 1;
        for (let x = 0; x <= width; x += size) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        for (let y = 0; y <= height; y += size) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
    }

    drawGrid(ctx, cols, rows, size) {
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        for (let x = 0; x <= cols; x++) {
            ctx.beginPath();
            ctx.moveTo(x * size, 0);
            ctx.lineTo(x * size, rows * size);
            ctx.stroke();
        }
    }

    playSound(freq, duration) {
        try {
            this.audio ||= new AudioContext();
            const osc = this.audio.createOscillator();
            const gain = this.audio.createGain();
            osc.frequency.value = freq;
            osc.type = "triangle";
            gain.gain.value = 0.025;
            osc.connect(gain);
            gain.connect(this.audio.destination);
            osc.start();
            gain.gain.exponentialRampToValueAtTime(0.0001, this.audio.currentTime + duration);
            osc.stop(this.audio.currentTime + duration);
        } catch (error) {
            /* silent fallback */
        }
    }
}

function forEachBlock(piece, callback) {
    piece.matrix.forEach((row, y) => {
        row.forEach((cell, x) => {
            if (cell) callback(piece.x + x, piece.y + y);
        });
    });
}

function shuffle(values) {
    const copy = [...values];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

function randomPieceType() {
    return BAG_TYPES[Math.floor(Math.random() * BAG_TYPES.length)];
}

function rotateMatrix(matrix) {
    return matrix[0].map((_, index) => matrix.map((row) => row[index]).reverse());
}

function rotateMatrixCounter(matrix) {
    return matrix[0].map((_, index) => matrix.map((row) => row[row.length - 1 - index]));
}

function cloneMatrix(matrix) {
    return matrix.map((row) => [...row]);
}

function clonePiece(piece) {
    return { ...piece, matrix: cloneMatrix(piece.matrix) };
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function parseFeatureTargets(value) {
    return value.split(",").map((feature) => feature.trim()).filter(Boolean);
}

function matchesMultilineTarget(clearedCount, target) {
    const minimum = target.endsWith("+");
    const value = Number.parseInt(target, 10);
    if (Number.isNaN(value)) return false;
    return minimum ? clearedCount >= value : clearedCount === value;
}

function formatMultilineTarget(target) {
    if (target.endsWith("+")) return `${target.slice(0, -1)}+ lignes`;
    return `${target} lignes`;
}

function formatEffectValue(value) {
    return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, "");
}

function formatFeatureList(features) {
    const names = {
        ghost: "piece fantome",
        hold: "hold",
        mirror: "miroir"
    };
    return features.map((feature) => names[feature] || feature).join(" + ");
}

function formatNumber(value) {
    return new Intl.NumberFormat("fr-FR").format(value);
}

export async function init(container) {
    // Pas besoin de Decimal.js ici, Math suffit pour un chrono
    setup(container);
}

function setup(container) {
    const display = container.querySelector("#chrono-display");
    const startBtn = container.querySelector("#startBtn");
    const pauseBtn = container.querySelector("#pauseBtn");
    const resetBtn = container.querySelector("#resetBtn");
    const lapBtn = container.querySelector("#lapBtn");
    const clearLapsBtn = container.querySelector("#clearLapsBtn");
    const lapsList = container.querySelector("#laps-list");

    let startTime = 0;
    let elapsed = 0;
    let running = false;
    let requestID = null;
    let lapCount = 0;

    // Use performance.now() for better precision (microsecond instead of millisecond)
    const getTime = () => performance.now();

    function formatTime(ms) {
        let h = Math.floor(ms / 3600000);
        let m = Math.floor((ms % 3600000) / 60000);
        let s = Math.floor((ms % 60000) / 1000);
        let msec = ms % 1000;

        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}<span>.${String(msec).padStart(3, '0')}</span>`;
    }

    function update() {
        if (!running) return;
        
        elapsed = Math.round(getTime() - startTime);
        display.innerHTML = formatTime(elapsed);
        requestID = requestAnimationFrame(update);
    }

    function start() {
        if (running) return;

        running = true;
        startTime = getTime() - elapsed;
        requestID = requestAnimationFrame(update);

        startBtn.disabled = true;
        pauseBtn.disabled = false;
        lapBtn.disabled = false;
    }

    function pause() {
        running = false;
        cancelAnimationFrame(requestID);

        startBtn.disabled = false;
        pauseBtn.disabled = true;
        lapBtn.disabled = true;
    }

    function reset() {
        pause();
        elapsed = 0;
        display.innerHTML = "00:00:00<span>.000</span>";

        startBtn.disabled = false;
        pauseBtn.disabled = true;
        lapBtn.disabled = true;
    }

    function addLap() {
        if (!running) return;

        lapCount++;
        const lapTime = formatTime(elapsed);
        const lapItem = document.createElement("div");
        lapItem.className = "lap-item";
        lapItem.innerHTML = `<span class="lap-num">Tour ${lapCount}</span><span class="lap-time">${lapTime}</span>`;

        lapsList.insertBefore(lapItem, lapsList.firstChild);
        clearLapsBtn.disabled = false;
    }

    function clearLaps() {
        lapsList.innerHTML = "";
        lapCount = 0;
        clearLapsBtn.disabled = true;
    }

    // Initialisation
    startBtn.addEventListener("click", start);
    pauseBtn.addEventListener("click", pause);
    resetBtn.addEventListener("click", reset);
    lapBtn.addEventListener("click", addLap);
    clearLapsBtn.addEventListener("click", clearLaps);

    // État initial des boutons
    pauseBtn.disabled = true;
    lapBtn.disabled = true;
    clearLapsBtn.disabled = true;
}
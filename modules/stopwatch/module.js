export async function init(container) {
    // Pas besoin de Decimal.js ici, Math suffit pour un chrono
    setup(container);
}

function setup(container) {
    const display = container.querySelector("#chrono-display");
    const startBtn = container.querySelector("#startBtn");
    const pauseBtn = container.querySelector("#pauseBtn");
    const resetBtn = container.querySelector("#resetBtn");

    let startTime = 0;
    let elapsed = 0;
    let running = false;
    let requestID = null;

    function formatTime(ms) {
        let h = Math.floor(ms / 3600000);
        let m = Math.floor((ms % 3600000) / 60000);
        let s = Math.floor((ms % 60000) / 1000);
        let msec = ms % 1000;

        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}<span>.${String(msec).padStart(3, '0')}</span>`;
    }

    function update() {
        if (!running) return;
        
        elapsed = Date.now() - startTime;
        display.innerHTML = formatTime(elapsed);
        requestID = requestAnimationFrame(update);
    }

    function start() {
        if (running) return;
        
        running = true;
        startTime = Date.now() - elapsed;
        requestID = requestAnimationFrame(update);
        
        startBtn.disabled = true;
        pauseBtn.disabled = false;
    }

    function pause() {
        running = false;
        cancelAnimationFrame(requestID);
        
        startBtn.disabled = false;
        pauseBtn.disabled = true;
    }

    function reset() {
        pause();
        elapsed = 0;
        display.innerHTML = "00:00:00<span>.000</span>";
        
        startBtn.disabled = false;
        pauseBtn.disabled = true;
    }

    // Initialisation
    startBtn.addEventListener("click", start);
    pauseBtn.addEventListener("click", pause);
    resetBtn.addEventListener("click", reset);
    
    // État initial des boutons
    pauseBtn.disabled = true;
}
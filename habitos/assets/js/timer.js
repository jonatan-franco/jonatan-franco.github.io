let timerInterval = null, timerSeconds = 0, timerMode = 'stopwatch', initialCountdownSeconds = 0, isTimerRunning = false;

window.onTimerConfigChange = function() {
    timerConfig.stopwatchStartMin = parseInt(document.getElementById('input-min-stopwatch').value, 10) || 0;
    timerConfig.countdownMin = parseInt(document.getElementById('input-min-countdown').value, 10) || 30;
    timerConfig.pomodoroMin = parseInt(document.getElementById('input-min-pomodoro').value, 10) || 25;
    timerConfig.deepworkMin = parseInt(document.getElementById('input-min-deepwork').value, 10) || 50;
    saveData();
    if (!isTimerRunning) selectTimerMode(timerMode);
};

window.selectTimerMode = function(mode) {
    if (isTimerRunning) toggleTimer();
    timerMode = mode;
    ['stopwatch', 'countdown', 'pomodoro', 'deepwork'].forEach(m => {
        const card = document.getElementById('card-tmode-' + m);
        if (card) {
            card.className = m === mode
                ? "cursor-pointer p-3.5 rounded-2xl border-2 border-purple-300 bg-[#ede9fe] transition flex flex-col items-center text-center"
                : "cursor-pointer p-3.5 rounded-2xl border border-zinc-200 bg-zinc-100/80 transition flex flex-col items-center text-center";
        }
    });

    const progContainer = document.getElementById('countdown-progress-container');
    if (mode === 'stopwatch') {
        timerSeconds = (parseInt(document.getElementById('input-min-stopwatch').value, 10) || 0) * 60;
        initialCountdownSeconds = timerSeconds;
        document.getElementById('timer-mode-badge').textContent = "MODO: CRONÔMETRO";
        progContainer.classList.add('hidden');
    } else if (mode === 'countdown') {
        timerSeconds = (parseInt(document.getElementById('input-min-countdown').value, 10) || 30) * 60;
        initialCountdownSeconds = timerSeconds;
        document.getElementById('timer-mode-badge').textContent = `MODO: REGRESSIVO (${timerSeconds / 60}M)`;
        progContainer.classList.remove('hidden');
    } else if (mode === 'pomodoro') {
        timerSeconds = (parseInt(document.getElementById('input-min-pomodoro').value, 10) || 25) * 60;
        initialCountdownSeconds = timerSeconds;
        document.getElementById('timer-mode-badge').textContent = `MODO: POMODORO (${timerSeconds / 60}M)`;
        progContainer.classList.remove('hidden');
    } else {
        timerSeconds = (parseInt(document.getElementById('input-min-deepwork').value, 10) || 50) * 60;
        initialCountdownSeconds = timerSeconds;
        document.getElementById('timer-mode-badge').textContent = `MODO: DEEP WORK (${timerSeconds / 60}M)`;
        progContainer.classList.remove('hidden');
    }
    updateTimerDisplay();
};

window.adjustTimerMinutes = function(deltaMin) {
    const deltaSec = deltaMin * 60;
    timerSeconds = Math.max(0, timerSeconds + deltaSec);
    if (timerMode !== 'stopwatch') initialCountdownSeconds = Math.max(timerSeconds, initialCountdownSeconds + deltaSec);
    updateTimerDisplay();
};

function updateTimerDisplay() {
    const hrs = Math.floor(timerSeconds / 3600), mins = Math.floor((timerSeconds % 3600) / 60), secs = timerSeconds % 60;
    const str = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    document.getElementById('timer-display').textContent = str;
    document.getElementById('mini-timer-text').textContent = str;

    if (timerMode !== 'stopwatch' && initialCountdownSeconds > 0) {
        const pct = Math.max(0, Math.min(100, (timerSeconds / initialCountdownSeconds) * 100));
        const bar = document.getElementById('countdown-progress-bar');
        if (bar) bar.style.width = `${pct}%`;
    }
}

window.toggleTimer = function() {
    const btn = document.getElementById('btn-timer-toggle'), pill = document.getElementById('mini-timer-pill');
    if (isTimerRunning) {
        clearInterval(timerInterval);
        isTimerRunning = false;
        pill.classList.add('hidden'); pill.classList.remove('flex');
        btn.textContent = '▷ Iniciar';
    } else {
        isTimerRunning = true;
        pill.classList.remove('hidden'); pill.classList.add('flex');
        btn.textContent = '⏸ Pausar';
        timerInterval = setInterval(() => {
            if (timerMode === 'stopwatch') timerSeconds++;
            else if (timerSeconds > 0) timerSeconds--;
            else { clearInterval(timerInterval); isTimerRunning = false; finishAndLogSession(true); }
            updateTimerDisplay();
        }, 1000);
    }
};

window.finishAndLogSession = function(autoTriggered = false) {
    if (habits.length === 0) return;
    if (isTimerRunning) toggleTimer();
    let elapsedSec = timerMode === 'stopwatch' ? timerSeconds : (initialCountdownSeconds - timerSeconds);
    if (elapsedSec < 30 && !autoTriggered) {
        const m = prompt("Quantos minutos deseja registrar nesta atividade?", "30");
        if (m && !isNaN(m)) elapsedSec = parseFloat(m) * 60; else return;
    }
    const hIdx = parseInt(document.getElementById('timer-habit-select').value, 10) || 0;
    const dIdx = parseInt(document.getElementById('timer-day-select').value, 10) || 0;
    if (habits[hIdx]) {
        habits[hIdx].dailyHours[dIdx] = parseFloat(((habits[hIdx].dailyHours[dIdx] || 0) + (elapsedSec / 3600)).toFixed(2));
        if (document.getElementById('timer-auto-check').checked) habits[hIdx].checks[dIdx] = true;
        saveData();
        selectTimerMode(timerMode);
    }
};
// FIM DE timer.js
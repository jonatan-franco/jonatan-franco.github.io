// ============================================================================
// TIMER (CRONÔMETRO & REGRESSIVO — ESTILO RELÓGIO SAMSUNG A34 / ONE UI)
// ============================================================================

let activeTimerSlide = 'stopwatch'; // 'stopwatch' | 'countdown'

// Estado do Cronômetro (precisão em milissegundos)
let swInterval = null;
let swRunning = false;
let swElapsedMs = 0;
let swLastStartTs = 0;
let swLaps = []; // [{ lapNum, lapMs, totalMs }]

// Estado do Temporizador Regressivo
let cdInterval = null;
let cdRunning = false;
let cdTotalSeconds = 30 * 60;
let cdRemainingSeconds = 30 * 60;

const RING_CIRCUMFERENCE = 678.58; // 2 * PI * 108

function formatHMS(totalSeconds) {
    const s = Math.max(0, Math.floor(totalSeconds));
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function formatCentiseconds(ms) {
    const cs = Math.floor((Math.max(0, ms) % 1000) / 10);
    return `.${String(cs).padStart(2, '0')}`;
}

function updateMiniTimerPill() {
    const pill = document.getElementById('mini-timer-pill');
    const text = document.getElementById('mini-timer-text');
    if (!pill || !text) return;

    if (swRunning) {
        pill.classList.remove('hidden');
        pill.classList.add('flex');
        text.textContent = formatHMS(Math.floor(swElapsedMs / 1000));
    } else if (cdRunning) {
        pill.classList.remove('hidden');
        pill.classList.add('flex');
        text.textContent = formatHMS(cdRemainingSeconds);
    } else {
        pill.classList.add('hidden');
        pill.classList.remove('flex');
    }
}

// ----------------------------------------------------------------------------
// Navegação entre as 2 telas (Cronômetro <-> Regressivo) arrastando para o lado
// ----------------------------------------------------------------------------
function updateTimerTabButtons(mode) {
    activeTimerSlide = mode === 'countdown' ? 'countdown' : 'stopwatch';
    const tabSw = document.getElementById('tab-timer-stopwatch');
    const tabCd = document.getElementById('tab-timer-countdown');
    const activeCls = "px-5 py-2 rounded-full bg-black text-white text-xs sm:text-sm font-bold shadow-xs transition";
    const inactiveCls = "px-5 py-2 rounded-full text-zinc-600 hover:text-black text-xs sm:text-sm font-bold transition";

    if (tabSw) tabSw.className = activeTimerSlide === 'stopwatch' ? activeCls : inactiveCls;
    if (tabCd) tabCd.className = activeTimerSlide === 'countdown' ? activeCls : inactiveCls;
}

window.scrollToTimerSlide = function(mode) {
    const target = mode === 'countdown' ? 'countdown' : 'stopwatch';
    updateTimerTabButtons(target);
    const track = document.getElementById('timer-carousel-track');
    const slide = document.getElementById('timer-slide-' + target);
    if (track && slide) {
        const targetLeft = target === 'countdown' ? slide.offsetLeft : 0;
        track.scrollTo({ left: targetLeft, behavior: 'smooth' });
    }
};

window.onTimerCarouselScroll = function(trackEl) {
    if (!trackEl) return;
    const scrollLeft = trackEl.scrollLeft;
    const width = trackEl.clientWidth || 1;
    const idx = Math.round(scrollLeft / width);
    updateTimerTabButtons(idx >= 1 ? 'countdown' : 'stopwatch');
};

// ----------------------------------------------------------------------------
// TELA 1: CRONÔMETRO (ESTILO SAMSUNG CLOCK)
// ----------------------------------------------------------------------------
function updateStopwatchDisplay() {
    const mainEl = document.getElementById('sw-main-display');
    const msEl = document.getElementById('sw-ms-display');
    if (mainEl) mainEl.textContent = formatHMS(Math.floor(swElapsedMs / 1000));
    if (msEl) msEl.textContent = formatCentiseconds(swElapsedMs);
    updateMiniTimerPill();
}

function renderStopwatchLaps() {
    const container = document.getElementById('sw-laps-container');
    if (!container) return;
    if (swLaps.length === 0) {
        container.classList.add('hidden');
        container.innerHTML = '';
        return;
    }
    container.classList.remove('hidden');
    container.innerHTML = swLaps.slice().reverse().map(lap => `
        <div class="flex items-center justify-between py-2 px-2">
            <span class="text-zinc-400 font-bold">Volta ${String(lap.lapNum).padStart(2, '0')}</span>
            <span class="text-indigo-300">+${formatHMS(Math.floor(lap.lapMs / 1000))}${formatCentiseconds(lap.lapMs)}</span>
            <span class="text-white font-semibold">${formatHMS(Math.floor(lap.totalMs / 1000))}${formatCentiseconds(lap.totalMs)}</span>
        </div>
    `).join('');
}

function syncStopwatchButtons() {
    const toggleBtn = document.getElementById('btn-sw-toggle');
    const lapResetBtn = document.getElementById('btn-sw-lap-reset');
    const badge = document.getElementById('sw-status-badge');

    if (swRunning) {
        if (toggleBtn) {
            toggleBtn.textContent = 'Pausar';
            toggleBtn.className = "w-36 sm:w-44 py-4 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm sm:text-base transition shadow-lg";
        }
        if (lapResetBtn) lapResetBtn.textContent = 'Volta';
        if (badge) {
            badge.textContent = 'Em andamento';
            badge.className = "px-3 py-1 rounded-full bg-indigo-950/90 border border-indigo-700 text-[11px] font-mono text-indigo-300";
        }
    } else {
        if (toggleBtn) {
            toggleBtn.textContent = swElapsedMs > 0 ? 'Continuar' : 'Iniciar';
            toggleBtn.className = "w-36 sm:w-44 py-4 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm sm:text-base transition shadow-lg";
        }
        if (lapResetBtn) lapResetBtn.textContent = 'Restaurar';
        if (badge) {
            badge.textContent = swElapsedMs > 0 ? 'Pausado' : 'Pronto';
            badge.className = "px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-400";
        }
    }
}

window.toggleStopwatch = function() {
    if (swRunning) {
        clearInterval(swInterval);
        swElapsedMs += Date.now() - swLastStartTs;
        swRunning = false;
    } else {
        swLastStartTs = Date.now();
        swRunning = true;
        swInterval = setInterval(() => {
            const now = Date.now();
            swElapsedMs += (now - swLastStartTs);
            swLastStartTs = now;
            updateStopwatchDisplay();
        }, 40);
    }
    syncStopwatchButtons();
    updateStopwatchDisplay();
};

window.lapOrResetStopwatch = function() {
    if (swRunning) {
        const prevTotal = swLaps.length > 0 ? swLaps[swLaps.length - 1].totalMs : 0;
        const lapMs = Math.max(0, swElapsedMs - prevTotal);
        swLaps.push({
            lapNum: swLaps.length + 1,
            lapMs,
            totalMs: swElapsedMs
        });
        renderStopwatchLaps();
    } else {
        swElapsedMs = 0;
        swLaps = [];
        renderStopwatchLaps();
        syncStopwatchButtons();
        updateStopwatchDisplay();
    }
};

// ----------------------------------------------------------------------------
// TELA 2: TEMPORIZADOR REGRESSIVO (ESTILO SAMSUNG CLOCK)
// ----------------------------------------------------------------------------
function updateCountdownDisplay() {
    const mainEl = document.getElementById('cd-main-display');
    if (mainEl) {
        const formatted = formatHMS(cdRemainingSeconds);
        if ('value' in mainEl) {
            if (document.activeElement !== mainEl) {
                mainEl.value = formatted;
            }
        } else {
            mainEl.textContent = formatted;
        }
    }

    const ring = document.getElementById('cd-ring-progress');
    if (ring) {
        const ratio = cdTotalSeconds > 0 ? Math.max(0, Math.min(1, cdRemainingSeconds / cdTotalSeconds)) : 0;
        const offset = RING_CIRCUMFERENCE * (1 - ratio);
        ring.style.strokeDashoffset = String(offset.toFixed(2));
    }

    const badge = document.getElementById('cd-status-badge');
    if (badge && !cdRunning) {
        const mins = Math.max(1, Math.round(cdTotalSeconds / 60));
        badge.textContent = `${mins} min`;
    }
    updateMiniTimerPill();
}

window.onCountdownDirectFocus = function(el) {
    if (!el) return;
    if (cdRunning) {
        clearInterval(cdInterval);
        cdRunning = false;
        syncCountdownButtons();
    }
    setTimeout(() => {
        try { el.select(); } catch (e) {}
    }, 10);
};

window.onCountdownDirectInput = function(el) {
    if (!el) return;
    const rawDigits = el.value.replace(/\D/g, '').slice(-6);
    const padded = rawDigits.padStart(6, '0');
    const hh = parseInt(padded.slice(0, 2), 10) || 0;
    const mm = parseInt(padded.slice(2, 4), 10) || 0;
    const ss = parseInt(padded.slice(4, 6), 10) || 0;
    el.value = `${padded.slice(0, 2)}:${padded.slice(2, 4)}:${padded.slice(4, 6)}`;
    try {
        el.setSelectionRange(el.value.length, el.value.length);
    } catch (e) {}

    const totalSecs = hh * 3600 + mm * 60 + ss;
    if (totalSecs > 0) {
        cdTotalSeconds = totalSecs;
        cdRemainingSeconds = totalSecs;
        const inputEl = document.getElementById('input-min-countdown');
        const approxMin = Math.max(1, Math.round(totalSecs / 60));
        if (inputEl) inputEl.value = approxMin;
        if (timerConfig) timerConfig.countdownMin = approxMin;
    }
    const ring = document.getElementById('cd-ring-progress');
    if (ring) ring.style.strokeDashoffset = '0';
    const badge = document.getElementById('cd-status-badge');
    if (badge) badge.textContent = formatHMS(totalSecs > 0 ? totalSecs : cdTotalSeconds);
};

window.onCountdownDirectBlur = function(el) {
    if (!el) return;
    const rawDigits = el.value.replace(/\D/g, '').slice(-6);
    const padded = rawDigits.padStart(6, '0');
    const hh = parseInt(padded.slice(0, 2), 10) || 0;
    const mm = parseInt(padded.slice(2, 4), 10) || 0;
    const ss = parseInt(padded.slice(4, 6), 10) || 0;
    const totalSecs = hh * 3600 + mm * 60 + ss;
    if (totalSecs > 0) {
        cdTotalSeconds = totalSecs;
        cdRemainingSeconds = totalSecs;
        const approxMin = Math.max(1, Math.round(totalSecs / 60));
        const inputEl = document.getElementById('input-min-countdown');
        if (inputEl) inputEl.value = approxMin;
        if (timerConfig) timerConfig.countdownMin = approxMin;
        saveData(false, true);
    }
    el.value = formatHMS(cdRemainingSeconds);
    syncCountdownButtons();
    updateCountdownDisplay();
};

window.onCountdownDirectKeydown = function(el, ev) {
    if (ev && ev.key === 'Enter') {
        ev.preventDefault();
        el.blur();
    }
};

function syncCountdownButtons() {
    const toggleBtn = document.getElementById('btn-cd-toggle');
    const subLabel = document.getElementById('cd-sub-label');
    const badge = document.getElementById('cd-status-badge');

    if (cdRunning) {
        if (toggleBtn) {
            toggleBtn.textContent = 'Pausar';
            toggleBtn.className = "w-36 sm:w-44 py-4 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm sm:text-base transition shadow-lg";
        }
        if (subLabel) subLabel.textContent = 'Contagem regressiva em andamento...';
        if (badge) {
            badge.textContent = 'Ativo';
            badge.className = "px-3 py-1 rounded-full bg-emerald-950/90 border border-emerald-700 text-[11px] font-mono text-emerald-300";
        }
    } else {
        const isPausedMidway = cdRemainingSeconds > 0 && cdRemainingSeconds < cdTotalSeconds;
        if (toggleBtn) {
            toggleBtn.textContent = isPausedMidway ? 'Continuar' : 'Iniciar';
            toggleBtn.className = "w-36 sm:w-44 py-4 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm sm:text-base transition shadow-lg";
        }
        if (subLabel) {
            subLabel.textContent = isPausedMidway ? 'Temporizador pausado' : 'Toque no tempo acima para digitar ou use os atalhos';
        }
        if (badge) {
            badge.textContent = `${Math.max(1, Math.round(cdTotalSeconds / 60))} min`;
            badge.className = "px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-400";
        }
    }
}

window.setCountdownPresetMinutes = function(mins) {
    const cleanMin = Math.max(1, Math.min(360, parseInt(mins, 10) || 30));
    if (cdRunning) {
        clearInterval(cdInterval);
        cdRunning = false;
    }
    const inputEl = document.getElementById('input-min-countdown');
    if (inputEl) inputEl.value = cleanMin;
    timerConfig.countdownMin = cleanMin;
    cdTotalSeconds = cleanMin * 60;
    cdRemainingSeconds = cdTotalSeconds;
    saveData(false, true);
    syncCountdownButtons();
    updateCountdownDisplay();
};

window.adjustCountdownSeconds = function(deltaSec) {
    cdRemainingSeconds = Math.max(0, cdRemainingSeconds + deltaSec);
    if (cdRemainingSeconds > cdTotalSeconds) {
        cdTotalSeconds = cdRemainingSeconds;
    } else if (!cdRunning) {
        cdTotalSeconds = Math.max(15, cdRemainingSeconds);
    }
    const inputEl = document.getElementById('input-min-countdown');
    if (inputEl && cdTotalSeconds >= 60) {
        inputEl.value = Math.max(1, Math.round(cdTotalSeconds / 60));
    }
    syncCountdownButtons();
    updateCountdownDisplay();
};

window.onTimerConfigChange = function() {
    const inputEl = document.getElementById('input-min-countdown');
    const mins = Math.max(1, Math.min(360, parseInt(inputEl ? inputEl.value : 30, 10) || 30));
    timerConfig.countdownMin = mins;
    if (!cdRunning) {
        cdTotalSeconds = mins * 60;
        cdRemainingSeconds = cdTotalSeconds;
    }
    saveData(false, true);
    syncCountdownButtons();
    updateCountdownDisplay();
};

window.resetCountdown = function() {
    if (cdRunning) {
        clearInterval(cdInterval);
        cdRunning = false;
    }
    const inputEl = document.getElementById('input-min-countdown');
    const mins = Math.max(1, parseInt(inputEl ? inputEl.value : (timerConfig.countdownMin || 30), 10) || 30);
    cdTotalSeconds = mins * 60;
    cdRemainingSeconds = cdTotalSeconds;
    syncCountdownButtons();
    updateCountdownDisplay();
};

window.toggleCountdown = function() {
    if (cdRunning) {
        clearInterval(cdInterval);
        cdRunning = false;
        syncCountdownButtons();
        updateCountdownDisplay();
        return;
    }

    if (cdRemainingSeconds <= 0) {
        const inputEl = document.getElementById('input-min-countdown');
        const mins = Math.max(1, parseInt(inputEl ? inputEl.value : (timerConfig.countdownMin || 30), 10) || 30);
        cdTotalSeconds = mins * 60;
        cdRemainingSeconds = cdTotalSeconds;
    }

    cdRunning = true;
    syncCountdownButtons();
    updateCountdownDisplay();

    cdInterval = setInterval(() => {
        if (cdRemainingSeconds > 0) {
            cdRemainingSeconds--;
            updateCountdownDisplay();
        } else {
            clearInterval(cdInterval);
            cdRunning = false;
            syncCountdownButtons();
            updateCountdownDisplay();
            const subLabel = document.getElementById('cd-sub-label');
            if (subLabel) subLabel.textContent = '⏰ Tempo esgotado!';
        }
    }, 1000);
};

// Compatibilidade com a chamada no boot de app.js
window.selectTimerMode = function(mode) {
    const savedMin = (timerConfig && timerConfig.countdownMin) ? timerConfig.countdownMin : 30;
    const inputEl = document.getElementById('input-min-countdown');
    if (inputEl) inputEl.value = savedMin;
    cdTotalSeconds = savedMin * 60;
    cdRemainingSeconds = cdTotalSeconds;

    updateStopwatchDisplay();
    syncStopwatchButtons();
    updateCountdownDisplay();
    syncCountdownButtons();
    updateTimerTabButtons(mode === 'countdown' ? 'countdown' : 'stopwatch');
};
// FIM DE timer.js
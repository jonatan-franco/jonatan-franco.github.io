// ============================================================================
// TIMER (CRONÔMETRO & REGRESSIVO — ESTILO RELÓGIO SAMSUNG A34 / ONE UI)
// + SEGUNDO PLANO (ABA DO NOTEBOOK & NOTIFICAÇÃO MOBILE) + CONFIGURAÇÕES DO SITE
// ============================================================================

const SITE_SETTINGS_KEY = 'hq_site_settings_v1';
const DEFAULT_DOC_TITLE = 'HaQt — Análise de Hábitos';

let siteSettings = {
    theme: 'light',          // 'light' | 'dark' | 'auto'
    accentColor: 'default',  // 'default' | 'indigo' | 'emerald' | 'rose' | 'cyan' | 'amber'
    timerTabTitle: true,
    timerMobileNotif: true,
    timerAlertNotif: true,
    timerAlertSound: true,
    timerAlertVibrate: true,
    alarmTone: 'classic'     // 'classic' | 'pulse' | 'soft'
};

let activeTimerSlide = 'stopwatch'; // 'stopwatch' | 'countdown'
let swModality = 'Corrida';         // 'Corrida' | 'Caminhada' | 'Bike / Ciclismo' | 'Livre'

// Estado do Cronômetro (precisão em milissegundos e resistente a 2º plano)
let swInterval = null;
let swRunning = false;
let swElapsedMs = 0;
let swLastStartTs = 0;
let swLaps = []; // [{ lapNum, lapMs, totalMs }]

// Estado do Temporizador Regressivo (ancorado em timestamp real para rodar fora do navegador)
let cdInterval = null;
let cdRunning = false;
let cdTotalSeconds = 30 * 60;
let cdRemainingSeconds = 30 * 60;
let cdTargetEndTs = 0;

let lastMobileNotifUpdateTs = 0;
let activeLiveNotification = null;

const RING_CIRCUMFERENCE = 678.58; // 2 * PI * 108

// ----------------------------------------------------------------------------
// CONFIGURAÇÕES DO SITE (TEMA, CORES E ALERTAS DO TIMER)
// ----------------------------------------------------------------------------
function loadSiteSettings() {
    try {
        const raw = typeof SafeStorage !== 'undefined' ? SafeStorage.getItem(SITE_SETTINGS_KEY) : null;
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') {
                siteSettings = { ...siteSettings, ...parsed };
            }
        }
    } catch (e) {}
    applySiteSettingsToDOM();
}

function saveSiteSettings() {
    try {
        if (typeof SafeStorage !== 'undefined') {
            SafeStorage.setItem(SITE_SETTINGS_KEY, JSON.stringify(siteSettings));
        }
    } catch (e) {}
}

function applySiteSettingsToDOM() {
    const root = document.documentElement;
    if (!root) return;

    let effectiveTheme = siteSettings.theme || 'light';
    if (effectiveTheme === 'auto') {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        effectiveTheme = prefersDark ? 'dark' : 'light';
    }
    root.setAttribute('data-theme', effectiveTheme);
    root.setAttribute('data-accent', siteSettings.accentColor || 'default');

    // Sincroniza controles do modal de configurações se estiverem no DOM
    ['light', 'dark', 'auto'].forEach(t => {
        const btn = document.getElementById('btn-theme-' + t);
        if (btn) {
            btn.className = (siteSettings.theme === t)
                ? "py-2.5 px-3 rounded-2xl border-2 border-black bg-zinc-900 text-white text-xs font-bold transition"
                : "py-2.5 px-3 rounded-2xl border border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-700 transition";
        }
    });

    ['default', 'indigo', 'emerald', 'rose', 'cyan', 'amber'].forEach(acc => {
        const btn = document.getElementById('btn-accent-' + acc);
        if (btn) {
            if (siteSettings.accentColor === acc) {
                btn.classList.add('ring-2', 'ring-offset-2', 'ring-black', 'scale-105');
            } else {
                btn.classList.remove('ring-2', 'ring-offset-2', 'ring-black', 'scale-105');
            }
        }
    });

    const chkTab = document.getElementById('chk-setting-tab-title');
    if (chkTab) chkTab.checked = !!siteSettings.timerTabTitle;

    const chkMob = document.getElementById('chk-setting-mobile-notif');
    if (chkMob) chkMob.checked = !!siteSettings.timerMobileNotif;

    const chkAlertNotif = document.getElementById('chk-setting-alert-notif');
    if (chkAlertNotif) chkAlertNotif.checked = !!siteSettings.timerAlertNotif;

    const chkAlertVib = document.getElementById('chk-setting-alert-vibrate');
    if (chkAlertVib) chkAlertVib.checked = !!siteSettings.timerAlertVibrate;

    const chkAlertSound = document.getElementById('chk-setting-alert-sound');
    if (chkAlertSound) chkAlertSound.checked = !!siteSettings.timerAlertSound;

    const selTone = document.getElementById('sel-setting-alarm-tone');
    if (selTone) selTone.value = siteSettings.alarmTone || 'classic';

    updateNotificationPermButtonState();
}

function updateNotificationPermButtonState() {
    const btn = document.getElementById('btn-req-notif-perm');
    if (!btn) return;
    if (!('Notification' in window)) {
        btn.textContent = '🔕 Navegador sem suporte';
        btn.disabled = true;
        return;
    }
    if (Notification.permission === 'granted') {
        btn.textContent = '✅ Notificações Ativas';
        btn.className = "px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold";
    } else if (Notification.permission === 'denied') {
        btn.textContent = '⚠️ Bloqueado no Navegador';
        btn.className = "px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-semibold";
    } else {
        btn.textContent = '🔔 Permitir Notificações';
        btn.className = "px-3 py-1 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-semibold transition";
    }
}

window.requestTimerNotificationPermission = async function() {
    if (!('Notification' in window)) {
        alert('Este navegador não suporta notificações nativas.');
        return false;
    }
    try {
        const perm = await Notification.requestPermission();
        updateNotificationPermButtonState();
        return perm === 'granted';
    } catch (e) {
        return false;
    }
};

window.updateSiteSetting = function(key, val) {
    siteSettings[key] = val;
    saveSiteSettings();
    applySiteSettingsToDOM();
    if (key === 'timerMobileNotif' && val && ('Notification' in window) && Notification.permission === 'default') {
        window.requestTimerNotificationPermission();
    }
    syncAllExternalTimerDisplays();
};

window.openSiteSettingsModal = function() {
    loadSiteSettings();
    const modal = document.getElementById('settings-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
};

window.closeSiteSettingsModal = function() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
};

// ----------------------------------------------------------------------------
// SOM DE ALARME (WEB AUDIO API) + VIBRAÇÃO + NOTIFICAÇÕES DE SEGUNDO PLANO
// ----------------------------------------------------------------------------
window.playTimerAlarmSound = function(toneOverride) {
    const tone = toneOverride || siteSettings.alarmTone || 'classic';
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const now = ctx.currentTime;

        const playBeep = (freq, startOffset, duration, type = 'sine', gainVal = 0.28) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, now + startOffset);
            gain.gain.setValueAtTime(0.001, now + startOffset);
            gain.gain.exponentialRampToValueAtTime(gainVal, now + startOffset + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + startOffset + duration);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + startOffset);
            osc.stop(now + startOffset + duration + 0.02);
        };

        if (tone === 'pulse') {
            [0, 0.18, 0.36, 0.7, 0.88, 1.06].forEach(offset => {
                playBeep(880, offset, 0.13, 'square', 0.22);
            });
        } else if (tone === 'soft') {
            playBeep(523.25, 0.0, 0.28, 'sine', 0.3);
            playBeep(659.25, 0.25, 0.28, 'sine', 0.3);
            playBeep(783.99, 0.50, 0.35, 'sine', 0.3);
            playBeep(1046.50, 0.80, 0.55, 'sine', 0.32);
        } else {
            // classic
            [0, 0.24, 0.48, 0.9, 1.14, 1.38].forEach(offset => {
                playBeep(784, offset, 0.16, 'triangle', 0.3);
            });
        }
    } catch (e) {}
};

function triggerCountdownFinishedAlerts() {
    if (siteSettings.timerTabTitle) {
        document.title = '⏰ 00:00:00 — Tempo Esgotado! • HaQt';
    }
    if (siteSettings.timerAlertSound) {
        window.playTimerAlarmSound(siteSettings.alarmTone);
    }
    if (siteSettings.timerAlertVibrate && navigator.vibrate) {
        try { navigator.vibrate([350, 150, 350, 150, 500]); } catch (e) {}
    }
    if (siteSettings.timerAlertNotif && ('Notification' in window) && Notification.permission === 'granted') {
        try {
            if (activeLiveNotification && typeof activeLiveNotification.close === 'function') {
                activeLiveNotification.close();
            }
            new Notification('⏰ Temporizador Concluído — HaQt', {
                body: 'Sua contagem regressiva chegou a 00:00:00!',
                tag: 'haqt-timer-finished',
                renotify: true
            });
        } catch (e) {}
    }
}

window.syncAllExternalTimerDisplays = function(forceMobileNotif = false) {
    // Verifica se há cronômetro aeróbico da tela Atividade Física rodando
    const aeroState = (typeof window.getAtvAerobicTimerState === 'function')
        ? window.getAtvAerobicTimerState()
        : null;

    const isAnyRunning = swRunning || cdRunning || (aeroState && aeroState.running);

    if (!isAnyRunning) {
        if (document.title !== DEFAULT_DOC_TITLE && !document.title.startsWith('⏰')) {
            document.title = DEFAULT_DOC_TITLE;
        }
        if (activeLiveNotification && typeof activeLiveNotification.close === 'function') {
            try { activeLiveNotification.close(); } catch (e) {}
            activeLiveNotification = null;
        }
        return;
    }

    let timeStr = '00:00:00';
    let modeTitle = 'Timer';
    let icon = '⏱️';

    if (cdRunning) {
        timeStr = formatHMS(cdRemainingSeconds);
        modeTitle = 'Regressivo';
        icon = '⏳';
    } else if (aeroState && aeroState.running) {
        timeStr = formatHMS(Math.floor(aeroState.elapsedMs / 1000));
        modeTitle = aeroState.modality || 'Aeróbico';
        icon = '🏃';
    } else if (swRunning) {
        timeStr = formatHMS(Math.floor(swElapsedMs / 1000));
        modeTitle = swModality !== 'Livre' ? swModality : 'Cronômetro';
        icon = swModality === 'Corrida' ? '🏃' : (swModality === 'Caminhada' ? '🚶' : '⏱️');
    }

    // 1. Atualiza o título da guia do notebook/navegador
    if (siteSettings.timerTabTitle) {
        document.title = `${icon} ${timeStr} — ${modeTitle} • HaQt`;
    } else {
        document.title = DEFAULT_DOC_TITLE;
    }

    // 2. Atualiza MediaSession + Notificação na barra do celular
    if (siteSettings.timerMobileNotif) {
        if ('mediaSession' in navigator && typeof MediaMetadata !== 'undefined') {
            try {
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: `${icon} ${timeStr} — ${modeTitle}`,
                    artist: 'HaQt • Rastreador de Hábitos',
                    album: 'Timer em andamento'
                });
            } catch (e) {}
        }

        const now = Date.now();
        const shouldPushNotif = forceMobileNotif || (document.hidden && (now - lastMobileNotifUpdateTs >= 4000));
        if (shouldPushNotif && ('Notification' in window) && Notification.permission === 'granted') {
            lastMobileNotifUpdateTs = now;
            try {
                activeLiveNotification = new Notification(`${icon} ${timeStr} • ${modeTitle}`, {
                    body: cdRunning ? 'Contagem regressiva em andamento no HaQt' : `Cronômetro ativo (${modeTitle})`,
                    tag: 'haqt-timer-live',
                    silent: true,
                    renotify: false
                });
            } catch (e) {}
        }
    }
};

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
    const aeroState = (typeof window.getAtvAerobicTimerState === 'function')
        ? window.getAtvAerobicTimerState()
        : null;

    if (pill && text) {
        if (swRunning) {
            pill.classList.remove('hidden');
            pill.classList.add('flex');
            text.textContent = formatHMS(Math.floor(swElapsedMs / 1000));
        } else if (cdRunning) {
            pill.classList.remove('hidden');
            pill.classList.add('flex');
            text.textContent = formatHMS(cdRemainingSeconds);
        } else if (aeroState && aeroState.running) {
            pill.classList.remove('hidden');
            pill.classList.add('flex');
            text.textContent = formatHMS(Math.floor(aeroState.elapsedMs / 1000));
        } else {
            pill.classList.add('hidden');
            pill.classList.remove('flex');
        }
    }
    syncAllExternalTimerDisplays(false);
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
// TELA 1: CRONÔMETRO (ESTILO SAMSUNG CLOCK) + MODALIDADE CORRIDA / CAMINHADA
// ----------------------------------------------------------------------------
window.setStopwatchModality = function(mod) {
    swModality = mod || 'Corrida';
    document.querySelectorAll('.sw-mod-btn').forEach(btn => {
        const isMatch = btn.getAttribute('data-sw-mod') === swModality;
        btn.className = isMatch
            ? "sw-mod-btn px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-semibold transition"
            : "sw-mod-btn px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold transition";
    });
    syncAllExternalTimerDisplays(false);
};

window.getActiveStopwatchElapsedMs = function() {
    if (swRunning) {
        return swElapsedMs + (Date.now() - swLastStartTs);
    }
    return swElapsedMs || 0;
};

window.finishAndLogStopwatchAtv = function() {
    let totalMs = swElapsedMs;
    if (swRunning) {
        clearInterval(swInterval);
        totalMs += (Date.now() - swLastStartTs);
        swElapsedMs = totalMs;
        swRunning = false;
        syncStopwatchButtons();
        updateStopwatchDisplay();
    }

    let durationMin = totalMs / 60000;
    const elapsedSeconds = Math.floor(totalMs / 1000);
    if (durationMin < 0.5) {
        const manualMin = prompt(`Informe a duração de ${swModality} em minutos:`, '20');
        if (manualMin === null) return;
        durationMin = parseFloat(String(manualMin).replace(',', '.')) || 0;
    }
    if (durationMin <= 0) return;

    const speedInput = document.getElementById('sw-speed-kmh');
    const speedKmh = speedInput && typeof getWeightNumericValue === 'function'
        ? getWeightNumericValue(speedInput.value)
        : (parseFloat(String(speedInput?.value || '0').replace(',', '.')) || 0);

    if (typeof window.recordAerobicSessionFromTimer === 'function') {
        window.recordAerobicSessionFromTimer({
            modality: swModality === 'Livre' ? 'Cardio / Aeróbico' : swModality,
            durationMin,
            elapsedSeconds: elapsedSeconds >= 30 ? elapsedSeconds : Math.round(durationMin * 60),
            speedKmh,
            notes: ''
        });
    }

    swElapsedMs = 0;
    swLaps = [];
    if (speedInput) speedInput.value = '';
    renderStopwatchLaps();
    syncStopwatchButtons();
    updateStopwatchDisplay();
    alert(`✅ ${swModality} (${Math.round(durationMin)} min${speedKmh > 0 ? ` • ${speedKmh.toFixed(2).replace('.', ',')} km/h` : ''}) registrado na linha de Sistema Cardiovascular em Atividade Física!`);
};

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
        if (siteSettings.timerMobileNotif && ('Notification' in window) && Notification.permission === 'default') {
            window.requestTimerNotificationPermission();
        }
        swLastStartTs = Date.now();
        swRunning = true;
        swInterval = setInterval(() => {
            const now = Date.now();
            swElapsedMs += (now - swLastStartTs);
            swLastStartTs = now;
            updateStopwatchDisplay();
        }, 80);
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
    if (cdRunning) {
        cdTargetEndTs = Date.now() + cdRemainingSeconds * 1000;
    }
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

function tickCountdownFromTimestamp() {
    if (!cdRunning) return;
    const diffMs = cdTargetEndTs - Date.now();
    if (diffMs > 0) {
        cdRemainingSeconds = Math.ceil(diffMs / 1000);
        updateCountdownDisplay();
    } else {
        cdRemainingSeconds = 0;
        clearInterval(cdInterval);
        cdRunning = false;
        syncCountdownButtons();
        updateCountdownDisplay();
        const subLabel = document.getElementById('cd-sub-label');
        if (subLabel) subLabel.textContent = '⏰ Tempo esgotado!';
        triggerCountdownFinishedAlerts();
    }
}

window.toggleCountdown = function() {
    if (cdRunning) {
        tickCountdownFromTimestamp();
        clearInterval(cdInterval);
        cdRunning = false;
        syncCountdownButtons();
        updateCountdownDisplay();
        return;
    }

    if ((siteSettings.timerMobileNotif || siteSettings.timerAlertNotif) && ('Notification' in window) && Notification.permission === 'default') {
        window.requestTimerNotificationPermission();
    }

    if (cdRemainingSeconds <= 0) {
        const inputEl = document.getElementById('input-min-countdown');
        const mins = Math.max(1, parseInt(inputEl ? inputEl.value : (timerConfig.countdownMin || 30), 10) || 30);
        cdTotalSeconds = mins * 60;
        cdRemainingSeconds = cdTotalSeconds;
    }

    cdTargetEndTs = Date.now() + cdRemainingSeconds * 1000;
    cdRunning = true;
    syncCountdownButtons();
    updateCountdownDisplay();

    cdInterval = setInterval(tickCountdownFromTimestamp, 500);
};

// Sincroniza quando o usuário sai/volta do navegador ou bloqueia a tela do celular
document.addEventListener('visibilitychange', () => {
    if (cdRunning) tickCountdownFromTimestamp();
    if (swRunning) {
        const now = Date.now();
        swElapsedMs += (now - swLastStartTs);
        swLastStartTs = now;
        updateStopwatchDisplay();
    }
    if (document.hidden) {
        syncAllExternalTimerDisplays(true);
    }
});

// Compatibilidade com a chamada no boot de app.js
window.selectTimerMode = function(mode) {
    loadSiteSettings();
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

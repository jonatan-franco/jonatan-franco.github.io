const SafeStorage = {
    mem: {},
    getItem(k) { try { return localStorage.getItem(k); } catch(e) { return this.mem[k] || null; } },
    setItem(k, v) { try { localStorage.setItem(k, v); } catch(e) { this.mem[k] = v; } },
    removeItem(k) { try { localStorage.removeItem(k); } catch(e) { delete this.mem[k]; } }
};

const CATEGORIES = {
    atv_fisica: { label: 'Atividade Física', emoji: '🏋️', cardBg: 'bg-[#fce7f3]', pillBg: 'bg-[#f9a8d4]', hex: '#ec4899' },
    sono:       { label: 'Sono',             emoji: '🌙', cardBg: 'bg-[#e0e7ff]', pillBg: 'bg-[#a5b4fc]', hex: '#6366f1' }
};

const PALETTE = ['#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#06b6d4', '#6366f1'];

function getCurrentWeekDays() {
    const today = new Date();
    const dow = today.getDay();
    const diffToMonday = dow === 0 ? -6 : 1 - dow;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);
    const shortNames = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return {
            index: i,
            shortName: shortNames[i],
            dateNum: String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0'),
            iso: d.toISOString().split('T')[0],
            isToday: d.toDateString() === today.toDateString(),
            rawDate: d
        };
    });
}

const weekDays = getCurrentWeekDays();
const todayIndex = weekDays.findIndex(d => d.isToday);
const STORAGE_KEY = 'habit_quant_pro_v10_sync';

const defaultHabits = [
    { id: 'h3', name: 'Sono', category: 'sono', targetHours: 56.0, checks: [true, true, true, true, true, true, true], dailyHours: [8.0, 7.5, 8.0, 7.8, 8.2, 8.5, 8.0], bedtimeHours: [8.5, 8.0, 8.5, 8.2, 8.8, 9.0, 8.5] }
];

/* Sem eventos de exemplo: os treinos do WORKOUT_PLAN são agendados pelo usuário na Agenda. */
const defaultEvents = [];

/* Treinos de exemplo de versões anteriores — removidos pela migração abaixo. */
const LEGACY_HABIT_IDS = ['h1', 'h2'];
const LEGACY_HABIT_NAMES = ['Treino Upper (Força & Hipertrofia)', 'Treino Lower + Cardio Z2'];

function applyDataMigrations() {
    const before = habits.length;
    habits = habits.filter(h => !LEGACY_HABIT_IDS.includes(h.id) && !LEGACY_HABIT_NAMES.includes(h.name));
    habits.forEach(h => {
        if (h.category === 'sono') h.name = 'Sono';
    });
    if (habits.length !== before) {
        const validIds = new Set(habits.map(h => h.id));
        calendarEvents = calendarEvents.filter(ev => validIds.has(ev.habitId));
    }
}

let habits = [];
let calendarEvents = [];
let timerConfig = { stopwatchStartMin: 0, countdownMin: 30, pomodoroMin: 25, deepworkMin: 50 };
let sleepJournal = {};
let syncTimeout = null;

function loadData() {
    const raw = SafeStorage.getItem(STORAGE_KEY);
    if (raw) {
        try {
            const parsed = JSON.parse(raw);
            habits = Array.isArray(parsed.habits) && parsed.habits.length > 0 ? parsed.habits : JSON.parse(JSON.stringify(defaultHabits));
            calendarEvents = Array.isArray(parsed.calendarEvents) ? parsed.calendarEvents : JSON.parse(JSON.stringify(defaultEvents));
            if (parsed.timerConfig) timerConfig = { ...timerConfig, ...parsed.timerConfig };
            if (parsed.sleepJournal) sleepJournal = parsed.sleepJournal;
        } catch (e) {
            habits = JSON.parse(JSON.stringify(defaultHabits));
            calendarEvents = JSON.parse(JSON.stringify(defaultEvents));
            sleepJournal = {};
        }
    } else {
        habits = JSON.parse(JSON.stringify(defaultHabits));
        calendarEvents = JSON.parse(JSON.stringify(defaultEvents));
        sleepJournal = {};
    }
    applyDataMigrations();
}

function saveData(skipCloud = false) {
    SafeStorage.setItem(STORAGE_KEY, JSON.stringify({ habits, calendarEvents, timerConfig, sleepJournal }));
    if (typeof renderAll === 'function') renderAll();

    if (!skipCloud && SafeStorage.getItem('hq_gist_token') && SafeStorage.getItem('hq_gist_id')) {
        updateCloudBadge('⏳ Salvando...');
        clearTimeout(syncTimeout);
        syncTimeout = setTimeout(autoPushToGist, 1000);
    }
}

function updateCloudBadge(text) {
    const pill = document.getElementById('cloud-status-pill');
    if (pill) pill.textContent = text;
}

async function autoPushToGist() {
    const token = SafeStorage.getItem('hq_gist_token');
    const gistId = SafeStorage.getItem('hq_gist_id');
    if (!token || !gistId) return;
    try {
        const res = await fetch(`https://api.github.com/gists/${gistId}`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github+json' },
            body: JSON.stringify({ files: { "habitquant_data.json": { content: JSON.stringify({ updatedAt: Date.now(), habits, calendarEvents, timerConfig, sleepJournal }) } } })
        });
        if (res.ok) updateCloudBadge('✅ Sync Ativo');
    } catch (e) { updateCloudBadge('⚠️ Offline'); }
}

async function autoPullFromGist() {
    const token = SafeStorage.getItem('hq_gist_token');
    const gistId = SafeStorage.getItem('hq_gist_id');
    if (!token || !gistId) return;
    try {
        const res = await fetch(`https://api.github.com/gists/${gistId}?t=${Date.now()}`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github+json' },
            cache: 'no-store'
        });
        const data = await res.json();
        if (res.ok && data.files && data.files["habitquant_data.json"]) {
            const content = JSON.parse(data.files["habitquant_data.json"].content);
            habits = Array.isArray(content.habits) ? content.habits : habits;
            calendarEvents = Array.isArray(content.calendarEvents) ? content.calendarEvents : calendarEvents;
            timerConfig = content.timerConfig || timerConfig;
            if (content.sleepJournal) sleepJournal = content.sleepJournal;
            applyDataMigrations();
            saveData(true);
            updateCloudBadge('✅ Sync Ativo');
        }
    } catch (e) {}
}

const SafeStorage = {
    mem: {},
    getItem(k) { try { return localStorage.getItem(k); } catch(e) { return this.mem[k] || null; } },
    setItem(k, v) { try { localStorage.setItem(k, v); } catch(e) { this.mem[k] = v; } },
    removeItem(k) { try { localStorage.removeItem(k); } catch(e) { delete this.mem[k]; } }
};

const CATEGORIES = {
    academia: { label: 'Academia', emoji: '🏋️', cardBg: 'bg-[#fce7f3]', pillBg: 'bg-[#f9a8d4]', hex: '#ec4899' },
    estudos:  { label: 'Estudos',  emoji: '📚', cardBg: 'bg-[#ede9fe]', pillBg: 'bg-[#c4b5fd]', hex: '#8b5cf6' },
    saude:    { label: 'Saúde',    emoji: '❤️', cardBg: 'bg-[#b9f6ca]', pillBg: 'bg-[#6ee7b7]', hex: '#10b981' }
};

const PALETTE = ['#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#06b6d4', '#6366f1'];

function getCurrentWeekDays() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
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
const STORAGE_KEY = 'habit_quant_pro_v6_modular';

const defaultHabits = [
    { id: 'h1', name: 'Treino de Força (Upper/Lower)', category: 'academia', targetHours: 4.5, checks: [true, true, false, true, true, false, false], dailyHours: [1.0, 1.2, 0.0, 1.1, 1.0, 0.0, 0.0] },
    { id: 'h2', name: 'Cardio Zona 2 & Mobilidade', category: 'saude', targetHours: 3.0, checks: [false, true, true, false, true, true, false], dailyHours: [0.0, 0.7, 0.8, 0.0, 0.7, 0.8, 0.0] },
    { id: 'h3', name: 'Matemática Aplicada & Psicometria', category: 'estudos', targetHours: 8.0, checks: [true, true, true, true, true, false, false], dailyHours: [1.5, 2.0, 1.5, 1.5, 2.0, 0.0, 0.0] },
    { id: 'h4', name: 'Leitura Científica (Inglês/Espanhol)', category: 'estudos', targetHours: 4.0, checks: [true, false, true, false, true, false, false], dailyHours: [1.0, 0.0, 1.2, 0.0, 1.0, 0.0, 0.0] },
    { id: 'h5', name: 'Higiene do Sono & Hidratação', category: 'saude', targetHours: 7.0, checks: [true, true, true, true, true, true, false], dailyHours: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.0] }
];

const defaultEvents = [
    { id: 'ev1', habitId: 'h1', dayIndex: 0, startHour: 7, duration: 1.0 },
    { id: 'ev2', habitId: 'h3', dayIndex: 0, startHour: 14, duration: 2.0 },
    { id: 'ev3', habitId: 'h1', dayIndex: 1, startHour: 7, duration: 1.2 }
];

let habits = [];
let calendarEvents = [];
let timerConfig = { stopwatchStartMin: 0, countdownMin: 30, pomodoroMin: 25, deepworkMin: 50 };
let syncTimeout = null;

function loadData() {
    const raw = SafeStorage.getItem(STORAGE_KEY);
    if (raw) {
        try {
            const parsed = JSON.parse(raw);
            habits = Array.isArray(parsed.habits) && parsed.habits.length > 0 ? parsed.habits : JSON.parse(JSON.stringify(defaultHabits));
            calendarEvents = Array.isArray(parsed.calendarEvents) ? parsed.calendarEvents : JSON.parse(JSON.stringify(defaultEvents));
            if (parsed.timerConfig) timerConfig = { ...timerConfig, ...parsed.timerConfig };
        } catch (e) {
            habits = JSON.parse(JSON.stringify(defaultHabits));
            calendarEvents = JSON.parse(JSON.stringify(defaultEvents));
        }
    } else {
        habits = JSON.parse(JSON.stringify(defaultHabits));
        calendarEvents = JSON.parse(JSON.stringify(defaultEvents));
    }
}

function saveData(skipCloud = false) {
    SafeStorage.setItem(STORAGE_KEY, JSON.stringify({ habits, calendarEvents, timerConfig }));
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
            body: JSON.stringify({ files: { "habitquant_data.json": { content: JSON.stringify({ updatedAt: Date.now(), habits, calendarEvents, timerConfig }) } } })
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
            habits = content.habits || habits;
            calendarEvents = content.calendarEvents || calendarEvents;
            timerConfig = content.timerConfig || timerConfig;
            saveData(true);
            updateCloudBadge('✅ Sync Ativo');
        }
    } catch (e) {}
}
// FIM DE storage.js
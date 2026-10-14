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
const STORAGE_KEY = 'habit_quant_pro_v7_clean';

// Padrão 100% zerado: sem atividades e sem eventos iniciais
const defaultHabits = [];
const defaultEvents = [];

let habits = [];
let calendarEvents = [];
let timerConfig = { stopwatchStartMin: 0, countdownMin: 30, pomodoroMin: 25, deepworkMin: 50 };
let syncTimeout = null;

function loadData() {
    const raw = SafeStorage.getItem(STORAGE_KEY);
    if (raw) {
        try {
            const parsed = JSON.parse(raw);
            // Permite que a lista de hábitos seja vazia ([]) sem forçar recarregamento
            habits = Array.isArray(parsed.habits) ? parsed.habits : [];
            calendarEvents = Array.isArray(parsed.calendarEvents) ? parsed.calendarEvents : [];
            if (parsed.timerConfig) timerConfig = { ...timerConfig, ...parsed.timerConfig };
        } catch (e) {
            habits = [];
            calendarEvents = [];
        }
    } else {
        habits = [];
        calendarEvents = [];
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
            habits = Array.isArray(content.habits) ? content.habits : [];
            calendarEvents = Array.isArray(content.calendarEvents) ? content.calendarEvents : [];
            timerConfig = content.timerConfig || timerConfig;
            saveData(true);
            updateCloudBadge('✅ Sync Ativo');
        }
    } catch (e) {}
}
// FIM DE storage.js
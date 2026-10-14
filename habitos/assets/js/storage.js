const SafeStorage = {
    mem: {},
    getItem(k) { try { return localStorage.getItem(k); } catch(e) { return this.mem[k] || null; } },
    setItem(k, v) { try { localStorage.setItem(k, v); } catch(e) { this.mem[k] = v; } },
    removeItem(k) { try { localStorage.removeItem(k); } catch(e) { delete this.mem[k]; } }
};

const CATEGORIES = {
    academia: { label: 'Academia', emoji: '🏋️', cardBg: 'bg-[#fce7f3]', pillBg: 'bg-[#f9a8d4]', hex: '#ec4899' },
    estudos:  { label: 'Estudos',  emoji: '📚', cardBg: 'bg-[#ede9fe]', pillBg: 'bg-[#c4b5fd]', hex: '#8b5cf6' },
    saude:    { label: 'Saúde',    emoji: '❤️', cardBg: 'bg-[#b9f6ca]', pillBg: 'bg-[#6ee7b7]', hex: '#10b981' },
    sono:     { label: 'Sono',     emoji: '🌙', cardBg: 'bg-[#e0e7ff]', pillBg: 'bg-[#a5b4fc]', hex: '#6366f1' }
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
const STORAGE_KEY = 'habit_quant_pro_v7_clean';

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
            habits = Array.isArray(parsed.habits) ? parsed.habits : [];
            calendarEvents = Array.isArray(parsed.calendarEvents) ? parsed.calendarEvents : [];
            if (parsed.timerConfig) timerConfig = { ...timerConfig, ...parsed.timerConfig };
            habits.forEach(h => {
                if (h.category === 'sono' && !Array.isArray(h.bedtimeHours)) {
                    h.bedtimeHours = [0, 0, 0, 0, 0, 0, 0];
                }
            });
        } catch (e) {
            habits = []; calendarEvents = [];
        }
    } else {
        habits = []; calendarEvents = [];
    }
}

function saveData(skipCloud = false) {
    SafeStorage.setItem(STORAGE_KEY, JSON.stringify({ habits, calendarEvents, timerConfig }));
    if (typeof renderAll === 'function') renderAll();

    if (!skipCloud && SafeStorage.getItem('hq_gist_token') && SafeStorage.getItem('

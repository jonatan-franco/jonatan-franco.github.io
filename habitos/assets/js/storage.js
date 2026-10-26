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

const PALETTE = [
    '#e11d48', // 1. Vermelho Carmesim
    '#1d4ed8', // 2. Azul Royal
    '#15803d', // 3. Verde Floresta
    '#f97316', // 4. Laranja Vibrante
    '#7e22ce', // 5. Roxo Violeta
    '#eab308', // 6. Amarelo Ouro
    '#ec4899', // 7. Rosa Pink
    '#18181b', // 8. Preto Grafite
    '#84cc16', // 9. Verde Lima Claro
    '#78350f', // 10. Marrom Café
    '#0d9488', // 11. Verde Petróleo (Teal)
    '#c026d3', // 12. Fúcsia
    '#991b1b', // 13. Bordô Escuro
    '#6366f1', // 14. Índigo
    '#b45309', // 15. Âmbar Queimado
    '#06b6d4', // 16. Turquesa Claro
    '#4d7c0f', // 17. Verde Oliva
    '#4c1d95', // 18. Roxo Noite
    '#fb7185', // 19. Coral Salmão
    '#0369a1'  // 20. Azul Petróleo
];

function formatLocalISO(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getCurrentWeekDays() {
    const today = new Date();
    const todayStr = formatLocalISO(today);
    const base = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0, 0);
    const dow = base.getDay();
    const diffToMonday = dow === 0 ? -6 : 1 - dow;
    const monday = new Date(base);
    monday.setDate(base.getDate() + diffToMonday);
    const shortNames = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const iso = formatLocalISO(d);
        return {
            index: i,
            shortName: shortNames[i],
            dateNum: String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0'),
            iso,
            isToday: iso === todayStr,
            rawDate: d
        };
    });
}

const weekDays = getCurrentWeekDays();
const todayIndex = weekDays.findIndex(d => d.isToday);
const STORAGE_KEY = 'habit_quant_pro_v10_sync';

const defaultHabits = [
    { id: 'h3', name: 'Sono', category: 'sono', targetHours: 48.0, checks: [false, false, false, false, false, false, false], dailyHours: [0, 0, 0, 0, 0, 0, 0], bedtimeHours: [0, 0, 0, 0, 0, 0, 0] }
];

/* Sem eventos de exemplo: os treinos do WORKOUT_PLAN são agendados pelo usuário na Agenda. */
const defaultEvents = [];

/* Treinos de exemplo de versões anteriores — removidos pela migração abaixo. */
const LEGACY_HABIT_IDS = ['h1', 'h2'];
const LEGACY_HABIT_NAMES = ['Treino Upper (Força & Hipertrofia)', 'Treino Lower + Cardio Z2'];

window.hasCloudSyncConfigured = function() {
    const token = (SafeStorage.getItem('hq_gist_token') || '').trim();
    const gistId = (SafeStorage.getItem('hq_gist_id') || '').trim();
    return !!(token && gistId);
};

window.isRegisteredSyncUser = function() {
    if (!window.hasCloudSyncConfigured()) return false;
    if (typeof window.hasProfile === 'function' && window.hasProfile()) return true;
    try {
        const rawProf = SafeStorage.getItem('hq_profile_v1');
        if (rawProf) {
            const p = JSON.parse(rawProf);
            if (p && p.name && p.name !== 'HaQt') return true;
        }
    } catch (e) {}
    return false;
};

function applyDataMigrations() {
    const before = habits.length;
    habits = habits.filter(h => !LEGACY_HABIT_IDS.includes(h.id) && !LEGACY_HABIT_NAMES.includes(h.name));
    habits.forEach(h => {
        if (h.category === 'sono') {
            h.name = 'Sono';
            // Limpa valores de exemplo antigos caso não haja diário do sono correspondente
            const isOldDemoArray = Array.isArray(h.dailyHours) &&
                h.dailyHours.length === 7 &&
                h.dailyHours[0] === 8.0 && h.dailyHours[1] === 7.5 && h.dailyHours[3] === 7.8 && h.dailyHours[4] === 8.2;
            if (isOldDemoArray) {
                h.dailyHours = [0, 0, 0, 0, 0, 0, 0];
                h.bedtimeHours = [0, 0, 0, 0, 0, 0, 0];
                h.checks = [false, false, false, false, false, false, false];
            }
        }
    });
    // Preserva hábitos cadastrados e semeados localmente
    // Corrige eventual registro de sono salvo com data do dia seguinte devido ao antigo toISOString() UTC após 21h
    if (sleepJournal && typeof sleepJournal === 'object') {
        const todayStr = formatLocalISO(new Date());
        const sortedKeys = Object.keys(sleepJournal).sort();
        sortedKeys.forEach(k => {
            if (k > todayStr && sleepJournal[k]) {
                const [y, m, d] = k.split('-').map(Number);
                const prevDate = new Date(y, m - 1, d, 12, 0, 0, 0);
                prevDate.setDate(prevDate.getDate() - 1);
                const prevIso = formatLocalISO(prevDate);
                if (!sleepJournal[prevIso]) {
                    sleepJournal[prevIso] = sleepJournal[k];
                }
                delete sleepJournal[k];
            }
        });
    }
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
    if (!window.isRegisteredSyncUser() && !window.hasCloudSyncConfigured()) {
        habits = JSON.parse(JSON.stringify(defaultHabits));
        calendarEvents = [];
        sleepJournal = {};
        SafeStorage.removeItem('hq_atv_logs_v1');
        SafeStorage.removeItem('hq_plan_seeded_v1');
        SafeStorage.setItem(STORAGE_KEY, JSON.stringify({ habits, calendarEvents, timerConfig, sleepJournal }));
        return;
    }
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

let isPendingCloudPush = false;

function saveData(skipCloud = false, skipRender = false) {
    if (!skipCloud) {
        SafeStorage.setItem('hq_last_mutation_at', String(Date.now()));
    }
    SafeStorage.setItem(STORAGE_KEY, JSON.stringify({ habits, calendarEvents, timerConfig, sleepJournal }));
    if (!skipRender && typeof renderAll === 'function') renderAll();

    if (!skipCloud && SafeStorage.getItem('hq_gist_token') && SafeStorage.getItem('hq_gist_id')) {
        isPendingCloudPush = true;
        updateCloudBadge('⏳ Salvando...');
        clearTimeout(syncTimeout);
        syncTimeout = setTimeout(autoPushToGist, 800);
    }
}

function updateCloudBadge(text) {
    const pill = document.getElementById('cloud-status-pill');
    if (pill) pill.textContent = text;
}

function buildGistPayload() {
    let atvLogsData = {};
    try {
        const rawAtv = SafeStorage.getItem('hq_atv_logs_v1');
        if (rawAtv) atvLogsData = JSON.parse(rawAtv);
    } catch (e) { atvLogsData = {}; }

    let profileData = null;
    try {
        const rawProf = SafeStorage.getItem('hq_profile_v1');
        if (rawProf) profileData = JSON.parse(rawProf);
    } catch (e) { profileData = null; }

    const mutationTs = Number(SafeStorage.getItem('hq_last_mutation_at')) || Date.now();
    return {
        updatedAt: mutationTs,
        habits,
        calendarEvents,
        timerConfig,
        sleepJournal,
        atvLogs: atvLogsData,
        profile: profileData
    };
}

async function autoPushToGist() {
    const token = SafeStorage.getItem('hq_gist_token');
    const gistId = SafeStorage.getItem('hq_gist_id');
    if (!token || !gistId) {
        isPendingCloudPush = false;
        return false;
    }
    try {
        const res = await fetch(`https://api.github.com/gists/${gistId}`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github+json' },
            body: JSON.stringify({ files: { "habitquant_data.json": { content: JSON.stringify(buildGistPayload()) } } })
        });
        if (res.ok) {
            isPendingCloudPush = false;
            updateCloudBadge('✅ Sync Ativo');
            return true;
        }
    } catch (e) { updateCloudBadge('⚠️ Offline'); }
    isPendingCloudPush = false;
    return false;
}

async function autoPullFromGist(forceManual = false) {
    const isForced = forceManual === true;
    const token = SafeStorage.getItem('hq_gist_token');
    const gistId = SafeStorage.getItem('hq_gist_id');
    if (!token || !gistId) return false;

    const lastLocalMutation = Number(SafeStorage.getItem('hq_last_mutation_at') || 0);
    if (!isForced && (isPendingCloudPush || (Date.now() - lastLocalMutation < 4000))) {
        return false;
    }

    try {
        const res = await fetch(`https://api.github.com/gists/${gistId}?t=${Date.now()}`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github+json' },
            cache: 'no-store'
        });
        const data = await res.json();
        if (res.ok && data.files && data.files["habitquant_data.json"]) {
            const fileObj = data.files["habitquant_data.json"];
            let rawContent = fileObj.content;
            if (fileObj.truncated && fileObj.raw_url) {
                const rawRes = await fetch(fileObj.raw_url, { cache: 'no-store' });
                if (rawRes.ok) rawContent = await rawRes.text();
            }
            const content = JSON.parse(rawContent);

            // Se houve alteração local mais recente que o Gist e não é um pull manual, envia o local em vez de sobrescrever
            const currentLocalMutation = Number(SafeStorage.getItem('hq_last_mutation_at') || 0);
            if (!isForced && (isPendingCloudPush || (content.updatedAt && currentLocalMutation > content.updatedAt))) {
                autoPushToGist();
                return true;
            }

            habits = Array.isArray(content.habits) ? content.habits : habits;
            calendarEvents = Array.isArray(content.calendarEvents) ? content.calendarEvents : calendarEvents;
            timerConfig = content.timerConfig || timerConfig;
            if (content.sleepJournal && typeof content.sleepJournal === 'object') {
                if (isForced || Object.keys(content.sleepJournal).length > 0) {
                    sleepJournal = content.sleepJournal;
                }
            }
            if (content.atvLogs && typeof content.atvLogs === 'object') {
                if (isForced || Object.keys(content.atvLogs).length > 0) {
                    SafeStorage.setItem('hq_atv_logs_v1', JSON.stringify(content.atvLogs));
                    if (typeof loadAtvLogs === 'function') loadAtvLogs();
                }
            }
            if (content.profile && typeof content.profile === 'object') {
                SafeStorage.setItem('hq_profile_v1', JSON.stringify(content.profile));
                if (typeof window.loadProfile === 'function') window.loadProfile();
            }
            if (content.updatedAt) {
                SafeStorage.setItem('hq_last_mutation_at', String(content.updatedAt));
            }
            applyDataMigrations();
            saveData(true);
            updateCloudBadge('✅ Sync Ativo');
            return true;
        }
    } catch (e) {}
    return false;
}



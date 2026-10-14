// ============================================================================
// assets/js/app.js — Controlador Principal SPA, Treino Interativo & Diário do Sono
// ============================================================================

let currentRoute = 'dashboard';
let currentWeekOffset = 0;
let workoutSubTab = 'log'; // 'log' | 'plan'

const DAYS_SHORT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const DAYS_FULL = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];

const GROUPS_META = {
    atv_fisica: { label: 'Atividade Física', badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
    sono: { label: 'Sono & Recuperação', badge: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' },
    academico: { label: 'Acadêmico / USP', badge: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20' },
    consultoria: { label: 'Consultoria Estatística', badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' }
};

// ============================================================================
// ROTEAMENTO SPA & NAVEGAÇÃO
// ============================================================================

function navigateTo(route) {
    window.location.hash = route;
    applyRoute(route);
}

function applyRoute(route) {
    const validRoutes = ['dashboard', 'timer', 'metrics', 'calendar', 'atv_fisica', 'sono'];
    const targetRoute = validRoutes.includes(route) ? route : 'dashboard';
    currentRoute = targetRoute;

    document.querySelectorAll('.view-section').forEach(sec => sec.classList.add('hidden'));
    const activeSection = document.getElementById(`view-${targetRoute}`);
    if (activeSection) activeSection.classList.remove('hidden');

    document.querySelectorAll('.nav-btn').forEach(btn => {
        const isCurrent = btn.getAttribute('data-route') === targetRoute;
        if (isCurrent) {
            btn.className = 'nav-btn w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white shadow-sm shadow-indigo-500/20 transition-all';
        } else {
            btn.className = 'nav-btn w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all';
        }
    });

    // Fecha drawer mobile se estiver aberto
    const mobileSidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (window.innerWidth < 1024 && mobileSidebar && !mobileSidebar.classList.contains('-translate-x-full')) {
        mobileSidebar.classList.add('-translate-x-full');
        if (backdrop) backdrop.classList.add('hidden');
    }

    renderAll();
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (!sidebar) return;

    if (window.innerWidth < 1024) {
        sidebar.classList.toggle('-translate-x-full');
        if (backdrop) backdrop.classList.toggle('hidden');
    } else {
        sidebar.classList.toggle('w-64');
        sidebar.classList.toggle('w-20');
        document.querySelectorAll('.sidebar-label').forEach(el => el.classList.toggle('hidden'));
    }
}

function toggleDarkMode() {
    const html = document.documentElement;
    html.classList.toggle('dark');
    const isDark = html.classList.contains('dark');
    SafeStorage.setItem('hq_theme', isDark ? 'dark' : 'light');
    if (typeof renderMetricsView === 'function' && currentRoute === 'metrics') {
        renderMetricsView();
    }
}

// ============================================================================
// UTILITÁRIOS DE DATA (SEMANA ATUAL)
// ============================================================================

function getWeekDates(offset = 0) {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Dom, 1 = Seg...
    const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek + (offset * 7);
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);

    const dates = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const iso = d.toISOString().split('T')[0];
        const br = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
        dates.push({ iso, br, dayName: DAYS_SHORT[i], fullDayName: DAYS_FULL[i] });
    }
    return dates;
}

function changeWeek(delta) {
    currentWeekOffset += delta;
    renderAll();
}

// ============================================================================
// MÓDULO: PLANILHA INTERATIVA DE TREINO & ADESÃO (view-atv_fisica)
// ============================================================================

function calculateExerciseVolume(sets, repsStr, load, isCardio = false) {
    if (isCardio) return 0;
    const s = parseFloat(sets) || 0;
    const l = parseFloat(String(load).replace(',', '.')) || 0;
    if (s <= 0 || l <= 0) return 0;

    const cleanReps = String(repsStr || '').trim();
    if (cleanReps.includes('min') || cleanReps === '-') return 0;

    const match = cleanReps.match(/^(\d+(\.\d+)?)/);
    const r = match ? parseFloat(match[1]) : 0;
    return Number((s * r * l).toFixed(2));
}

function formatBRNumber(num) {
    return Number(num || 0).toLocaleString('pt-BR', { maximumFractionDigits: 4 });
}

function formatDateBR(isoDate) {
    if (!isoDate) return '-';
    const parts = isoDate.split('-');
    if (parts.length !== 3) return isoDate;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function getSplitBadgeStyle(split) {
    const styles = {
        'Upper A': 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
        'Lower A': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        'Upper B': 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
        'Lower B': 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        'Descanso': 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20'
    };
    return styles[split] || styles['Upper A'];
}

function switchWorkoutSubTab(tab) {
    workoutSubTab = tab;
    renderDedicatedAtvFisicaView();
}

function updateWorkoutField(id, field, value) {
    if (!workoutData || !Array.isArray(workoutData.logs)) return;
    const item = workoutData.logs.find(r => r.id === id);
    if (!item) return;

    if (field === 'completed') {
        item.completed = Boolean(value);
    } else if (field === 'sets' || field === 'load') {
        item[field] = parseFloat(String(value).replace(',', '.')) || 0;
    } else {
        item[field] = value;
    }

    if (['sets', 'reps', 'load'].includes(field)) {
        item.volume = calculateExerciseVolume(item.sets, item.reps, item.load, item.isCardio);
    }

    saveData();
    renderDedicatedAtvFisicaView();
}

function toggleWorkoutSessionDone(date, split, nextState) {
    if (!workoutData || !Array.isArray(workoutData.logs)) return;
    workoutData.logs.forEach(r => {
        if (r.date === date && r.split === split) {
            r.completed = nextState;
        }
    });
    saveData();
    renderDedicatedAtvFisicaView();
}

function addWorkoutExerciseRow(date, split) {
    if (!workoutData || !Array.isArray(workoutData.logs)) return;
    workoutData.logs.push({
        id: 'w-' + Date.now(),
        month: date.slice(0, 7),
        date,
        split,
        exercise: 'Novo Exercício',
        muscle: 'Grupamento Alvo',
        substitutes: '-',
        sets: 3,
        reps: '8-12',
        rest: '90s',
        load: 0,
        rir: '',
        volume: 0,
        completed: false,
        notes: ''
    });
    saveData();
    renderDedicatedAtvFisicaView();
}

function deleteWorkoutExerciseRow(id) {
    if (!workoutData || !Array.isArray(workoutData.logs)) return;
    workoutData.logs = workoutData.logs.filter(r => r.id !== id);
    saveData();
    renderDedicatedAtvFisicaView();
}

function deleteEntireWorkoutSession(date, split) {
    if (!confirm(`Remover todos os exercícios da sessão ${split} (${formatDateBR(date)})?`)) return;
    workoutData.logs = workoutData.logs.filter(r => !(r.date === date && r.split === split));
    saveData();
    renderDedicatedAtvFisicaView();
}

function openNewWorkoutSessionModal() {
    const modal = document.getElementById('workout-session-modal');
    const dateInput = document.getElementById('new-workout-date');
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
    if (modal) modal.classList.remove('hidden');
}

function closeNewWorkoutSessionModal() {
    const modal = document.getElementById('workout-session-modal');
    if (modal) modal.classList.add('hidden');
}

function createWorkoutSessionFromTemplate() {
    const dateEl = document.getElementById('new-workout-date');
    const splitEl = document.getElementById('new-workout-split');
    if (!dateEl || !splitEl || !dateEl.value) return;

    const date = dateEl.value;
    const split = splitEl.value;
    const month = date.slice(0, 7);
    const tplList = (workoutData.templates && workoutData.templates[split]) ? workoutData.templates[split] : [];

    tplList.forEach((tpl, i) => {
        const vol = calculateExerciseVolume(tpl.sets, tpl.reps, tpl.defaultLoad, tpl.isCardio);
        workoutData.logs.push({
            id: `w-${Date.now()}-${i}`,
            month,
            date,
            split,
            exercise: tpl.exercise,
            muscle: tpl.muscle,
            substitutes: tpl.substitutes,
            sets: tpl.sets,
            reps: tpl.reps,
            rest: tpl.rest,
            load: tpl.defaultLoad || 0,
            rir: '',
            volume: vol,
            completed: false,
            notes: '',
            isCardio: Boolean(tpl.isCardio)
        });
    });

    saveData();
    closeNewWorkoutSessionModal();
    renderDedicatedAtvFisicaView();
}

function exportWorkoutCSV() {
    if (!workoutData || !Array.isArray(workoutData.logs)) return;
    const headers = ["Data", "Divisão", "Exercício", "Músculo Alvo", "Substitutos", "Séries", "Repetições", "Descanso", "Carga (kg)", "RIR", "Volume (kg)", "Concluído", "Observações"];
    const rows = workoutData.logs.map(r => [
        formatDateBR(r.date),
        r.split,
        `"${(r.exercise || '').replace(/"/g, '""')}"`,
        `"${(r.muscle || '').replace(/"/g, '""')}"`,
        `"${(r.substitutes || '').replace(/"/g, '""')}"`,
        r.sets,
        `"${r.reps}"`,
        r.rest,
        String(r.load).replace('.', ','),
        r.rir || '',
        String(r.volume).replace('.', ','),
        r.completed ? 'TRUE' : 'FALSE',
        `"${(r.notes || '').replace(/"/g, '""')}"`
    ]);

    const csv = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', `HaQt_Treino_UpperLower_${new Date().toISO

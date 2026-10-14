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
    link.setAttribute('download', `HaQt_Treino_UpperLower_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function renderDedicatedAtvFisicaView() {
    if (!workoutData || !Array.isArray(workoutData.logs)) {
        workoutData = getDefaultWorkoutData();
    }

    const monthFilter = document.getElementById('workout-month-filter')?.value || '2026-10';
    const splitFilter = document.getElementById('workout-split-filter')?.value || 'ALL';

    const filteredLogs = workoutData.logs.filter(r => {
        const matchMonth = monthFilter === 'ALL' || r.month === monthFilter;
        const matchSplit = splitFilter === 'ALL' || r.split === splitFilter;
        return matchMonth && matchSplit;
    });

    // KPIs da Planilha de Treino
    const totalVolKg = filteredLogs.reduce((acc, r) => acc + (Number(r.volume) || 0), 0);
    const totalVolTon = totalVolKg / 1000;
    const totalItems = filteredLogs.length;
    const completedItems = filteredLogs.filter(r => r.completed).length;
    const adherencePct = totalItems > 0 ? ((completedItems / totalItems) * 100).toFixed(1) : '0.0';
    const uniqueSessions = new Set(filteredLogs.map(r => `${r.date}_${r.split}`));

    const elVolKg = document.getElementById('kpi-workout-vol-kg');
    const elVolTon = document.getElementById('kpi-workout-vol-ton');
    const elAdh = document.getElementById('kpi-workout-adherence');
    const elAdhCount = document.getElementById('kpi-workout-completed-count');
    const elAdhBar = document.getElementById('kpi-workout-adherence-bar');
    const elSessions = document.getElementById('kpi-workout-sessions');

    if (elVolKg) elVolKg.textContent = `${formatBRNumber(totalVolKg)} kg`;
    if (elVolTon) elVolTon.textContent = `${formatBRNumber(totalVolTon)} Ton`;
    if (elAdh) elAdh.textContent = `${adherencePct.replace('.', ',')}%`;
    if (elAdhCount) elAdhCount.textContent = `${completedItems}/${totalItems} concluídos`;
    if (elAdhBar) elAdhBar.style.width = `${adherencePct}%`;
    if (elSessions) elSessions.textContent = uniqueSessions.size;

    // Controle de Sub-Abas (Planilha Interativa vs. Planejamento Semanal)
    const logContainer = document.getElementById('workout-subtab-log');
    const planContainer = document.getElementById('workout-subtab-plan');
    const btnLog = document.getElementById('subtab-btn-log');
    const btnPlan = document.getElementById('subtab-btn-plan');

    if (logContainer && planContainer && btnLog && btnPlan) {
        if (workoutSubTab === 'log') {
            logContainer.classList.remove('hidden');
            planContainer.classList.add('hidden');
            btnLog.className = 'px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white shadow-sm transition-all';
            btnPlan.className = 'px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all';
        } else {
            logContainer.classList.add('hidden');
            planContainer.classList.remove('hidden');
            btnPlan.className = 'px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white shadow-sm transition-all';
            btnLog.className = 'px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all';
        }
    }

    // Popula Protocolo Rolling Split e Tabela de Planejamento Semanal
    const protoEl = document.getElementById('workout-rolling-protocol');
    if (protoEl) protoEl.textContent = workoutData.rollingSplitProtocol || '';

    const planBody = document.getElementById('workout-weekly-plan-body');
    if (planBody && Array.isArray(workoutData.weeklyPlan)) {
        planBody.innerHTML = workoutData.weeklyPlan.map(item => `
            <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                <td class="py-3 px-4 font-semibold text-slate-900 dark:text-white">${item.day}</td>
                <td class="py-3 px-4 font-mono text-xs text-slate-500 dark:text-slate-400">${item.window}</td>
                <td class="py-3 px-4">
                    <span class="px-2.5 py-1 text-xs font-bold rounded-lg border ${getSplitBadgeStyle(item.split)}">
                        ${item.split}
                    </span>
                </td>
                <td class="py-3 px-4 text-slate-700 dark:text-slate-300 text-xs">${item.target}</td>
                <td class="py-3 px-4 text-xs font-medium text-slate-600 dark:text-slate-400">${item.cardio}</td>
                <td class="py-3 px-4 text-xs font-semibold text-indigo-600 dark:text-indigo-400">${item.focus}</td>
            </tr>
        `).join('');
    }

    // Popula Sessões da Planilha Interativa
    const sessionsContainer = document.getElementById('workout-sessions-container');
    if (!sessionsContainer) return;

    if (filteredLogs.length === 0) {
        sessionsContainer.innerHTML = `
            <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center">
                <p class="text-sm text-slate-500 dark:text-slate-400">Nenhuma sessão registrada para este filtro. Clique em <strong>+ Nova Sessão</strong> para gerar um treino a partir do template.</p>
            </div>
        `;
    } else {
        const grouped = {};
        filteredLogs.forEach(r => {
            const key = `${r.date}__${r.split}`;
            if (!grouped[key]) grouped[key] = { date: r.date, split: r.split, items: [] };
            grouped[key].items.push(r);
        });

        const sessions = Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));

        sessionsContainer.innerHTML = sessions.map(session => {
            const sessionVol = session.items.reduce((acc, i) => acc + (Number(i.volume) || 0), 0);
            const doneCount = session.items.filter(i => i.completed).length;
            const allDone = doneCount === session.items.length;

            return `
            <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
                <!-- Cabeçalho da Sessão -->
                <div class="px-5 py-3.5 bg-slate-50/90 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                    <div class="flex items-center gap-3">
                        <span class="font-mono text-xs font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                            📅 ${formatDateBR(session.date)}
                        </span>
                        <span class="px-3 py-1 text-xs font-bold rounded-lg border ${getSplitBadgeStyle(session.split)}">
                            ${session.split}
                        </span>
                        <span class="text-xs text-slate-500 dark:text-slate-400 font-mono">
                            ${doneCount}/${session.items.length} concluídos
                        </span>
                    </div>

                    <div class="flex flex-wrap items-center gap-2.5">
                        <span class="text-xs font-mono font-semibold text-slate-600 dark:text-slate-300">
                            Volume do Dia: <strong class="text-indigo-600 dark:text-indigo-400">${formatBRNumber(sessionVol)} kg</strong>
                        </span>
                        <button onclick="toggleWorkoutSessionDone('${session.date}', '${session.split}', ${!allDone})"
                            class="text-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer">
                            ${allDone ? 'Desmarcar Sessão' : '✓ Concluir Sessão'}
                        </button>
                        <button onclick="addWorkoutExerciseRow('${session.date}', '${session.split}')"
                            class="text-xs px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 font-semibold transition-colors cursor-pointer">
                            + Exercício
                        </button>
                        <button onclick="deleteEntireWorkoutSession('${session.date}', '${session.split}')" title="Excluir sessão inteira"
                            class="text-xs px-2 py-1 rounded-lg text-slate-400 hover:text-rose-500 transition-colors cursor-pointer">
                            🗑
                        </button>
                    </div>
                </div>

                <!-- Tabela Interativa -->
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="border-b border-slate-200/70 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-slate-50/30 dark:bg-slate-900/40">
                                <th class="py-2.5 px-3 text-center w-10">OK</th>
                                <th class="py-2.5 px-3 min-w-[200px]">Exercício & Músculo Alvo</th>
                                <th class="py-2.5 px-3 min-w-[180px]">Variações / Substitutos</th>
                                <th class="py-2.5 px-2 text-center w-16">Séries</th>
                                <th class="py-2.5 px-2 text-center w-24">Reps</th>
                                <th class="py-2.5 px-2 text-center w-20">Descanso</th>
                                <th class="py-2.5 px-2 text-center w-24">Carga (kg)</th>
                                <th class="py-2.5 px-2 text-center w-16">RIR</th>
                                <th class="py-2.5 px-3 text-right w-24">Volume (kg)</th>
                                <th class="py-2.5 px-3 min-w-[220px]">Observações / Ajuste se Faltou</th>
                                <th class="py-2.5 px-2 w-8"></th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-200/50 dark:divide-slate-800/70 text-sm">
                            ${session.items.map(row => `
                                <tr class="${row.completed ? 'bg-emerald-500/[0.03] dark:bg-emerald-500/[0.05]' : ''} hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                                    <td class="py-2.5 px-3 text-center">
                                        <input type="checkbox" ${row.completed ? 'checked' : ''}
                                            onchange="updateWorkoutField('${row.id}', 'completed', this.checked)"
                                            class="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500 cursor-pointer">
                                    </td>
                                    <td class="py-2.5 px-3">
                                        <input type="text" value="${row.exercise}"
                                            onchange="updateWorkoutField('${row.id}', 'exercise', this.value)"
                                            class="w-full font-semibold text-slate-900 dark:text-white bg-transparent border-b border-transparent focus:border-indigo-500 outline-none text-xs sm:text-sm">
                                        <div class="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">${row.muscle || ''}</div>
                                    </td>
                                    <td class="py-2.5 px-3 text-xs text-slate-500 dark:text-slate-400 leading-snug">
                                        ${row.substitutes || '-'}
                                    </td>
                                    <td class="py-2.5 px-2 text-center">
                                        <input type="number" step="1" min="0" value="${row.sets}"
                                            onchange="updateWorkoutField('${row.id}', 'sets', this.value)"
                                            class="w-14 text-center font-mono text-xs py-1 rounded-lg bg-slate-100/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-indigo-500">
                                    </td>
                                    <td class="py-2.5 px-2 text-center">
                                        <input type="text" value="${row.reps}"
                                            onchange="updateWorkoutField('${row.id}', 'reps', this.value)"
                                            class="w-20 text-center font-mono text-xs py-1 rounded-lg bg-slate-100/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-indigo-500">
                                    </td>
                                    <td class="py-2.5 px-2 text-center font-mono text-xs text-slate-500 dark:text-slate-400">
                                        ${row.rest || '-'}
                                    </td>
                                    <td class="py-2.5 px-2 text-center">
                                        ${row.isCardio ? '<span class="text-xs text-slate-400">-</span>' : `
                                        <input type="number" step="0.5" min="0" value="${row.load}"
                                            onchange="updateWorkoutField('${row.id}', 'load', this.value)"
                                            class="w-20 text-center font-mono font-semibold text-xs py-1 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 outline-none focus:ring-2 focus:ring-indigo-500">
                                        `}
                                    </td>
                                    <td class="py-2.5 px-2 text-center">
                                        <input type="text" placeholder="-" value="${row.rir || ''}"
                                            onchange="updateWorkoutField('${row.id}', 'rir', this.value)"
                                            class="w-12 text-center font-mono text-xs py-1 rounded-lg bg-slate-100/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 outline-none focus:ring-1 focus:ring-indigo-500">
                                    </td>
                                    <td class="py-2.5 px-3 text-right font-mono font-bold text-xs ${row.volume > 0 ? 'text-slate-900 dark:text-white' : 'text-slate-400'}">
                                        ${row.isCardio ? '-' : formatBRNumber(row.volume)}
                                    </td>
                                    <td class="py-2.5 px-3">
                                        <input type="text" placeholder="Notas de carga/RIR..." value="${row.notes || ''}"
                                            onchange="updateWorkoutField('${row.id}', 'notes', this.value)"
                                            class="w-full text-xs px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-indigo-500 text-slate-700 dark:text-slate-300 outline-none">
                                    </td>
                                    <td class="py-2.5 px-2 text-center">
                                        <button onclick="deleteWorkoutExerciseRow('${row.id}')" title="Remover linha"
                                            class="text-slate-300 hover:text-rose-500 dark:text-slate-600 dark:hover:text-rose-400 transition-colors cursor-pointer">
                                            ✕
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            `;
        }).join('');
    }
}

// ============================================================================
// MÓDULO: DIÁRIO DO SONO (view-sono)
// ============================================================================

function computeSleepMetrics(entry) {
    if (!entry || !entry.bedTime || !entry.sleepTime || !entry.wakeTime || !entry.upTime) return null;

    const toMin = (t) => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
    };

    const diffMin = (start, end) => {
        let s = toMin(start);
        let e = toMin(end);
        if (e <= s) e += 24 * 60;
        return e - s;
    };

    const tibMin = diffMin(entry.bedTime, entry.upTime); // Tempo na Cama (TIB)
    const tstMin = diffMin(entry.sleepTime, entry.wakeTime); // Tempo Total de Sono (TST)
    if (tibMin <= 0) return null;

    const eff = Math.min(100, Math.max(0, (tstMin / tibMin) * 100));
    return {
        tibHours: (tibMin / 60).toFixed(2),
        tstHours: (tstMin / 60).toFixed(2),
        efficiency: eff.toFixed(1)
    };
}

function openSleepJournalModal(isoDate = '') {
    const modal = document.getElementById('sleep-journal-modal');
    const dateInput = document.getElementById('sleep-date-input');
    const targetDate = isoDate || new Date().toISOString().split('T')[0];

    if (dateInput) dateInput.value = targetDate;
    const existing = sleepJournal[targetDate] || { bedTime: '23:30', sleepTime: '23:50', wakeTime: '07:10', upTime: '07:30', quality: '4', notes: '' };

    document.getElementById('sleep-bedtime-input').value = existing.bedTime || '23:30';
    document.getElementById('sleep-sleeptime-input').value = existing.sleepTime || '23:50';
    document.getElementById('sleep-waketime-input').value = existing.wakeTime || '07:10';
    document.getElementById('sleep-uptime-input').value = existing.upTime || '07:30';
    document.getElementById('sleep-quality-input').value = existing.quality || '4';
    document.getElementById('sleep-notes-input').value = existing.notes || '';

    if (modal) modal.classList.remove('hidden');
}

function closeSleepJournalModal() {
    const modal = document.getElementById('sleep-journal-modal');
    if (modal) modal.classList.add('hidden');
}

function saveSleepJournalEntry(e) {
    if (e) e.preventDefault();
    const date = document.getElementById('sleep-date-input').value;
    if (!date) return;

    sleepJournal[date] = {
        bedTime: document.getElementById('sleep-bedtime-input').value,
        sleepTime: document.getElementById('sleep-sleeptime-input').value,
        wakeTime: document.getElementById('sleep-waketime-input').value,
        upTime: document.getElementById('sleep-uptime-input').value,
        quality: document.getElementById('sleep-quality-input').value,
        notes: document.getElementById('sleep-notes-input').value
    };

    saveData();
    closeSleepJournalModal();
    renderAll();
}

function renderSleepJournalView() {
    const tbody = document.getElementById('sleep-journal-tbody');
    if (!tbody) return;

    const weekDates = getWeekDates(currentWeekOffset);
    let sumEff = 0, sumTst = 0, sumTib = 0, count = 0;

    tbody.innerHTML = weekDates.map(d => {
        const entry = sleepJournal[d.iso];
        const m = computeSleepMetrics(entry);
        if (m) {
            sumEff += parseFloat(m.efficiency);
            sumTst += parseFloat(m.tstHours);
            sumTib += parseFloat(m.tibHours);
            count++;
        }

        const effBadge = m
            ? (parseFloat(m.efficiency) >= 85
                ? `<span class="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">${m.efficiency}%</span>`
                : `<span class="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">${m.efficiency}%</span>`)
            : '<span class="text-xs text-slate-400">-</span>';

        return `
            <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                <td class="py-3 px-4 font-medium text-slate-900 dark:text-white">
                    ${d.fullDayName} <span class="text-xs font-mono text-slate-400 ml-1">${d.br}</span>
                </td>
                <td class="py-3 px-3 text-center font-mono text-xs text-slate-600 dark:text-slate-300">${entry?.bedTime || '-'}</td>
                <td class="py-3 px-3 text-center font-mono text-xs text-slate-600 dark:text-slate-300">${entry?.sleepTime || '-'}</td>
                <td class="py-3 px-3 text-center font-mono text-xs text-slate-600 dark:text-slate-300">${entry?.wakeTime || '-'}</td>
                <td class="py-3 px-3 text-center font-mono text-xs text-slate-600 dark:text-slate-300">${entry?.upTime || '-'}</td>
                <td class="py-3 px-3 text-center font-mono text-xs font-semibold text-slate-700 dark:text-slate-200">${m ? m.tibHours + 'h' : '-'}</td>
                <td class="py-3 px-3 text-center font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">${m ? m.tstHours + 'h' : '-'}</td>
                <td class="py-3 px-3 text-center">${effBadge}</td>
                <td class="py-3 px-4 text-right">
                    <button onclick="openSleepJournalModal('${d.iso}')"
                        class="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
                        ${entry ? 'Editar' : '+ Registrar'}
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    const elAvgEff = document.getElementById('sleep-kpi-efficiency');
    const elAvgTst = document.getElementById('sleep-kpi-tst');
    const elAvgTib = document.getElementById('sleep-kpi-tib');
    if (elAvgEff) elAvgEff.textContent = count > 0 ? `${(sumEff / count).toFixed(1)}%` : '--%';
    if (elAvgTst) elAvgTst.textContent = count > 0 ? `${(sumTst / count).toFixed(1)}h` : '--h';
    if (elAvgTib) elAvgTib.textContent = count > 0 ? `${(sumTib / count).toFixed(1)}h` : '--h';
}

// ============================================================================
// MÓDULO: DASHBOARD GERAL & HÁBITOS
// ============================================================================

function openHabitModal() {
    const modal = document.getElementById('habit-modal');
    if (modal) modal.classList.remove('hidden');
}

function closeHabitModal() {
    const modal = document.getElementById('habit-modal');
    if (modal) modal.classList.add('hidden');
}

function saveNewHabit(e) {
    if (e) e.preventDefault();
    const name = document.getElementById('habit-name-input').value.trim();
    const group = document.getElementById('habit-group-input').value;
    const target = parseFloat(document.getElementById('habit-target-input').value) || 5;
    if (!name) return;

    habits.push({
        id: 'h-' + Date.now(),
        name,
        group,
        weeklyTarget: target,
        logs: {}
    });

    saveData();
    closeHabitModal();
    document.getElementById('habit-name-input').value = '';
    renderAll();
}

function updateHabitDailyLog(habitId, isoDate, val) {
    const h = habits.find(item => item.id === habitId);
    if (!h) return;
    if (!h.logs) h.logs = {};
    h.logs[isoDate] = parseFloat(val) || 0;
    saveData();
    renderAll();
}

function deleteHabit(habitId) {
    if (!confirm('Excluir esta atividade da matriz?')) return;
    habits = habits.filter(h => h.id !== habitId);
    saveData();
    renderAll();
}

function renderDashboard() {
    const weekDates = getWeekDates(currentWeekOffset);
    const labelEl = document.getElementById('current-week-label');
    if (labelEl) {
        labelEl.textContent = `${weekDates[0].br} — ${weekDates[6].br}`;
    }

    const headRow = document.getElementById('matrix-header-row');
    if (headRow) {
        headRow.innerHTML = `
            <th class="py-3 px-4 text-left">Atividade / Grupo</th>
            <th class="py-3 px-2 text-center">Meta Sem.</th>
            ${weekDates.map(d => `<th class="py-3 px-2 text-center font-mono">${d.dayName}<br><span class="text-[10px] text-slate-400">${d.br}</span></th>`).join('')}
            <th class="py-3 px-3 text-right">Realizado</th>
            <th class="py-3 px-2 w-8"></th>
        `;
    }

    const tbody = document.getElementById('matrix-tbody');
    if (!tbody) return;

    if (habits.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="11" class="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    Nenhuma atividade geral cadastrada na matriz. Seus treinos completos já estão ativos na aba <strong class="text-indigo-500 cursor-pointer" onclick="navigateTo('atv_fisica')">Treino & Adesão</strong>.
                </td>
            </tr>
        `;
    } else {
        tbody.innerHTML = habits.map(h => {
            const grp = GROUPS_META[h.group] || GROUPS_META.academico;
            let weekSum = 0;
            const cells = weekDates.map(d => {
                const v = (h.logs && h.logs[d.iso]) ? Number(h.logs[d.iso]) : 0;
                weekSum += v;
                return `
                    <td class="py-2.5 px-1.5 text-center">
                        <input type="number" step="0.5" min="0" value="${v || ''}" placeholder="-"
                            onchange="updateHabitDailyLog('${h.id}', '${d.iso}', this.value)"
                            class="w-14 text-center font-mono text-xs py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-indigo-500">
                    </td>
                `;
            }).join('');

            const pct = h.weeklyTarget > 0 ? Math.min(100, Math.round((weekSum / h.weeklyTarget) * 100)) : 0;

            return `
                <tr class="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                    <td class="py-3 px-4">
                        <div class="font-semibold text-slate-900 dark:text-white text-sm">${h.name}</div>
                        <span class="inline-block mt-0.5 px-2 py-0.5 text-[10px] font-bold rounded border ${grp.badge}">${grp.label}</span>
                    </td>
                    <td class="py-3 px-2 text-center font-mono text-xs text-slate-500">${h.weeklyTarget}h</td>
                    ${cells}
                    <td class="py-3 px-3 text-right font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        ${weekSum.toFixed(1)}h <span class="text-[10px] text-slate-400">(${pct}%)</span>
                    </td>
                    <td class="py-3 px-2 text-center">
                        <button onclick="deleteHabit('${h.id}')" class="text-slate-300 hover:text-rose-500">✕</button>
                    </td>
                </tr>
            `;
        }).join('');
    }
}

// ============================================================================
// ORQUESTRADOR GLOBAL DE RENDERIZAÇÃO
// ============================================================================

function renderAll() {
    renderDashboard();
    renderDedicatedAtvFisicaView();
    renderSleepJournalView();

    if (typeof renderMetricsView === 'function' && currentRoute === 'metrics') {
        renderMetricsView();
    }
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = SafeStorage.getItem('hq_theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    }

    loadData();

    const initialHash = window.location.hash.replace('#', '') || 'dashboard';
    applyRoute(initialHash);

    window.addEventListener('hashchange', () => {
        const h = window.location.hash.replace('#', '') || 'dashboard';
        applyRoute(h);
    });

    // Sincroniza silenciosamente com o GitHub Gist ao abrir
    autoPullFromGist(() => renderAll());
});

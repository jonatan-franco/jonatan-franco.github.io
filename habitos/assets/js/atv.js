/* ===================================================================
 * atv.js — Tabela Interativa de Atividade Física (Carga e Observações)
 * =================================================================== */

/* ------------------------------------------------------------------
 * Plano de treino pré-cadastrado (planilha do cliente):
 * Upper A, Lower A, Upper B e Lower B.
 * Para cadastrar um treino novo, adicione um item em WORKOUT_PLAN:
 * ele é semeado uma única vez por dispositivo (chave hq_plan_seeded_v1).
 * `load` (carga de referência) é opcional em cada exercício.
 * ------------------------------------------------------------------ */
const WORKOUT_PLAN = [
    {
        planId: 'upper_a',
        name: 'Upper A',
        targetHours: 3.0,
        exercises: [
            { name: 'Supino Inclinado Halteres', muscle: 'Peitoral (ênfase clavicular/superior)', variations: ['Supino Inclinado Smith', 'Máquina articulada inclinada'], sets: 3, reps: '8-12', rest: '90-120s', load: 30.00 },
            { name: 'Remada Peito Apoiado', muscle: 'Costas (Dorsais / Romboide)', variations: ['Remada baixa no cabo (pegada neutra)', 'Remada unilateral com halter (serrote)'], sets: 3, reps: '8-12', rest: '90-120s', load: 35.00 },
            { name: 'Elevação Lateral', muscle: 'Deltoide Lateral', variations: ['Elevação lateral na polia/cabo', 'Elevação lateral máquina'], sets: 3, reps: '10-15', rest: '60-90s', load: 5.00 },
            { name: 'Tríceps Corda', muscle: 'Tríceps braquial', variations: ['Tríceps testa com halteres', 'Tríceps francês na polia'], sets: 3, reps: '10-15', rest: '60-90s' },
            { name: 'Bíceps Martelo', muscle: 'Bíceps e Braquiorradial', variations: ['Rosca martelo na corda (polia)', 'Rosca Scott máquina/barra W'], sets: 3, reps: '10-15', rest: '60-90s' },
            { name: 'Cardio Zona 2 (Esteira inclinada / Bike)', muscle: 'Sistema Cardiovascular / Resistência', variations: ['Transport / Remo ergômetro'], sets: 1, reps: '15-20 min', rest: '-' }
        ]
    },
    {
        planId: 'lower_a',
        name: 'Lower A',
        targetHours: 3.0,
        exercises: [
            { name: 'Goblet Squat', muscle: 'Quadríceps e Glúteos', variations: ['Agachamento no Smith', 'Hack Squat'], sets: 3, reps: '8-12', rest: '2 min' },
            { name: 'RDL', muscle: 'Isquiotibiais e Glúteos', variations: ['Stiff com barra', 'Mesa flexora (foco em isquiotibiais)'], sets: 3, reps: '8-12', rest: '2 min' },
            { name: 'Panturrilha em Pé', muscle: 'Panturrilha (Gastrocnêmio)', variations: ['Panturrilha no Leg Press', 'Panturrilha unilateral com halter'], sets: 3, reps: '12-15', rest: '60-90s' },
            { name: 'Cadeira Extensora', muscle: 'Quadríceps (ênfase reto femoral)', variations: ['Afundo com halteres', 'Sissy squat'], sets: 3, reps: '12-15', rest: '60-90s' },
            { name: 'Abdominal na Polia Alta (Cable Crunch)', muscle: 'Reto Abdominal (ênfase superior e média)', variations: ['Crunch no solo com carga', 'Abdominal na máquina'], sets: 3, reps: '12-15', rest: '60-90s' }
        ]
    },
    {
        planId: 'upper_b',
        name: 'Upper B',
        targetHours: 3.0,
        exercises: [
            { name: 'Puxada Alta', muscle: 'Costas (Dorsal - largura)', variations: ['Puxada triângulo', 'Barra fixa assistida (Graviton)'], sets: 3, reps: '8-12', rest: '90-120s' },
            { name: 'Desenvolvimento Halteres', muscle: 'Deltoide Anterior e Tríceps', variations: ['Desenvolvimento máquina articulada', 'Desenvolvimento no Smith'], sets: 3, reps: '8-12', rest: '90-120s' },
            { name: 'Remada Baixa', muscle: 'Costas (Espessura / Meio das costas)', variations: ['Remada curvada com pegada pronada', 'Remada articulada'], sets: 3, reps: '8-12', rest: '90-120s' },
            { name: 'Elevação Lateral', muscle: 'Deltoide Lateral', variations: ['Elevação lateral na polia/cabo', 'Elevação lateral máquina'], sets: 3, reps: '10-15', rest: '60-90s' },
            { name: 'Cardio Zona 2 (Esteira / Bike ergométrica)', muscle: 'Sistema Cardiovascular / Resistência', variations: ['Caminhada ao ar livre', 'Escada'], sets: 1, reps: '20 min', rest: '-' }
        ]
    },
    {
        planId: 'lower_b',
        name: 'Lower B',
        targetHours: 3.0,
        exercises: [
            { name: 'Leg Press 45°', muscle: 'Quadríceps e Glúteos', variations: ['Agachamento livre', 'Hack machine'], sets: 3, reps: '8-12', rest: '2 min' },
            { name: 'Cadeira Flexora', muscle: 'Isquiotibiais (flexores de joelho)', variations: ['Mesa flexora deitada', 'Flexora unilateral em pé'], sets: 3, reps: '10-15', rest: '60-90s' },
            { name: 'Agachamento Búlgaro', muscle: 'Quadríceps e Glúteo Máximo', variations: ['Passada/Avanço com halteres', 'Afundo no Smith'], sets: 3, reps: '8-12', rest: '2 min' },
            { name: 'Panturrilha', muscle: 'Panturrilha', variations: ['Panturrilha sentado (Sóleo)', 'Panturrilha no Smith'], sets: 3, reps: '12-15', rest: '60-90s' },
            { name: 'Elevação de Pernas na Barra Fixa / Paralelas (Hanging Leg Raise)', muscle: 'Reto Abdominal (ênfase infra-umbilical)', variations: ['Elevação de pernas no solo com elevação pélvica', 'Abdominal canivete'], sets: 3, reps: '12-15', rest: '60-90s' }
        ]
    }
];
const PLAN_SEED_KEY = 'hq_plan_seeded_v1';

let atvLogs = {}; // { "YYYY-MM-DD": [ { id, habitId, exerciseName, weight, notes }, ... ] }

/* Data local no formato YYYY-MM-DD (evita o deslocamento de UTC do toISOString). */
function getLocalISODate(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

let selectedAtvDate = getLocalISODate();

/* Pré-cadastra os treinos do plano que ainda não existem neste dispositivo. */
function ensureWorkoutPlanHabits() {
    let seeded = [];
    try { seeded = JSON.parse(SafeStorage.getItem(PLAN_SEED_KEY) || '[]') || []; } catch (e) { seeded = []; }
    let changed = false;
    WORKOUT_PLAN.forEach(workout => {
        if (seeded.includes(workout.planId)) return;
        const alreadyExists = habits.some(h => h.planId === workout.planId || h.name === workout.name);
        if (!alreadyExists) {
            habits.push({
                id: 'h_' + workout.planId,
                planId: workout.planId,
                name: workout.name,
                category: 'atv_fisica',
                targetHours: workout.targetHours,
                checks: [false, false, false, false, false, false, false],
                dailyHours: [0, 0, 0, 0, 0, 0, 0],
                exercises: JSON.parse(JSON.stringify(workout.exercises))
            });
            changed = true;
        }
        seeded.push(workout.planId);
    });
    SafeStorage.setItem(PLAN_SEED_KEY, JSON.stringify(seeded));
    if (changed) saveData();
}

/* Opções do select de exercícios: exercício principal + variações equivalentes. */
function buildExerciseOptionsHTML(habit) {
    if (!habit || !Array.isArray(habit.exercises)) return '';
    let html = '';
    habit.exercises.forEach((ex, exIdx) => {
        html += `<option value="${ex.name}" data-ex-index="${exIdx}">${ex.name}</option>`;
        (ex.variations || []).forEach(variation => {
            html += `<option value="${variation}" data-ex-index="${exIdx}">↳ ${variation}</option>`;
        });
    });
    return html;
}

function exerciseInfoText(ex, selectedName) {
    if (!ex) return '';
    const prefix = selectedName && selectedName !== ex.name ? `🔁 Variação de ${ex.name} • ` : '🎯 ';
    const repsTxt = /min/i.test(String(ex.reps)) ? `${ex.sets}× ${ex.reps}` : `${ex.sets}×${ex.reps} reps`;
    const loadTxt = (ex.load !== undefined && ex.load !== null) ? ` • carga ref. ${Number(ex.load).toFixed(2)} kg` : '';
    return `${prefix}${ex.muscle} • ${repsTxt} • descanso ${ex.rest}${loadTxt}`;
}

function loadAtvLogs() {
    const raw = SafeStorage.getItem('hq_atv_logs_v1');
    if (raw) {
        try { atvLogs = JSON.parse(raw); } catch (e) { atvLogs = {}; }
    }
}

function saveAtvLogs() {
    SafeStorage.setItem('hq_atv_logs_v1', JSON.stringify(atvLogs));
}

window.setAtvDate = function(dateStr) {
    selectedAtvDate = dateStr;
    renderAtvFisicaInteractiveView();
};

window.setTodayAtvDate = function() {
    selectedAtvDate = getLocalISODate();
    const dateInput = document.getElementById('atv-log-date');
    if (dateInput) dateInput.value = selectedAtvDate;
    renderAtvFisicaInteractiveView();
};

window.addAtvLogEntry = function(event) {
    event.preventDefault();
    const habitId = document.getElementById('atv-log-habit').value;
    const exerciseName = document.getElementById('atv-log-exercise').value.trim();
    const weight = parseFloat(document.getElementById('atv-log-weight').value) || 0;
    const notes = document.getElementById('atv-log-notes').value.trim();
    const dateVal = document.getElementById('atv-log-date').value || selectedAtvDate;

    if (!exerciseName) return;

    if (!atvLogs[dateVal]) atvLogs[dateVal] = [];
    atvLogs[dateVal].push({
        id: 'log_' + Date.now(),
        habitId,
        exerciseName,
        weight: parseFloat(weight.toFixed(2)),
        notes
    });

    saveAtvLogs();
    document.getElementById('atv-log-exercise').value = '';
    document.getElementById('atv-log-weight').value = '';
    document.getElementById('atv-log-notes').value = '';
    renderAtvFisicaInteractiveView();
};

window.deleteAtvLogEntry = function(dateStr, logId) {
    if (!atvLogs[dateStr]) return;
    atvLogs[dateStr] = atvLogs[dateStr].filter(item => item.id !== logId);
    saveAtvLogs();
    renderAtvFisicaInteractiveView();
};

/* Reconstroi o campo Exercício ao trocar a atividade: lista do plano ou texto livre. */
window.onAtvHabitChange = function() {
    const habitSelect = document.getElementById('atv-log-habit');
    const field = document.getElementById('atv-exercise-field');
    if (!habitSelect || !field) return;
    const habit = habits.find(h => h.id === habitSelect.value);
    const exercises = (habit && Array.isArray(habit.exercises)) ? habit.exercises : [];
    if (exercises.length > 0) {
        field.innerHTML = `<select id="atv-log-exercise" onchange="onAtvExerciseChange()" class="w-full bg-white border border-zinc-300 rounded-xl px-3 py-1.5 text-xs text-zinc-900">${buildExerciseOptionsHTML(habit)}</select>`;
        onAtvExerciseChange();
    } else {
        field.innerHTML = `<input type="text" id="atv-log-exercise" required placeholder="Ex: Supino Reto" class="w-full bg-white border border-zinc-300 rounded-xl px-3 py-1.5 text-xs text-zinc-900">`;
        const info = document.getElementById('atv-exercise-info');
        if (info) info.textContent = '';
    }
};

/* Atualiza alvo/séries/descanso exibidos e sugere a carga de referência. */
window.onAtvExerciseChange = function() {
    const exerciseSelect = document.getElementById('atv-log-exercise');
    const habitSelect = document.getElementById('atv-log-habit');
    if (!exerciseSelect || !habitSelect || !exerciseSelect.selectedOptions) return;
    const selectedOption = exerciseSelect.selectedOptions[0];
    const exIdx = selectedOption ? parseInt(selectedOption.dataset.exIndex, 10) : NaN;
    const habit = habits.find(h => h.id === habitSelect.value);
    const exercises = (habit && Array.isArray(habit.exercises)) ? habit.exercises : [];
    const ex = exercises[exIdx];
    if (!ex) return;
    const info = document.getElementById('atv-exercise-info');
    if (info) info.textContent = exerciseInfoText(ex, exerciseSelect.value);
    const weightInput = document.getElementById('atv-log-weight');
    if (weightInput && ex.load !== undefined && ex.load !== null) weightInput.value = Number(ex.load).toFixed(2);
};

function renderAtvFisicaInteractiveView() {
    const container = document.getElementById('atv-fisica-cards-grid');
    if (!container) return;

    loadAtvLogs();
    const atvHabits = habits.filter(h => h.category === 'atv_fisica');

    // Filtro "dependendo do dia": usa a Agenda do app para o dia da data selecionada.
    const dow = new Date(selectedAtvDate + 'T12:00:00').getDay(); // 0=Dom ... 6=Sáb
    const dayIndex = (dow + 6) % 7; // 0=Seg ... 6=Dom
    const dayRef = weekDays[dayIndex] || weekDays[0];
    const scheduledIds = new Set(calendarEvents.filter(ev => ev.dayIndex === dayIndex).map(ev => ev.habitId));
    let formHabits = atvHabits.filter(h => scheduledIds.has(h.id));
    const usingAgendaFilter = formHabits.length > 0;
    if (!usingAgendaFilter) formHabits = atvHabits;

    const agendaHintHTML = usingAgendaFilter
        ? `📅 Treino de ${dayRef.shortName}: <strong>${formHabits.map(h => h.name).join(', ')}</strong>`
        : `📅 Nenhum treino agendado para ${dayRef.shortName} — mostrando todas as atividades.`;

    const habitOptionsHTML = formHabits.length === 0
        ? `<option value="">Cadastre uma Atividade Física primeiro</option>`
        : formHabits.map(h => `<option value="${h.id}">${h.name}</option>`).join('');

    const selectedHabit = formHabits[0] || null;
    const selectedExercises = (selectedHabit && Array.isArray(selectedHabit.exercises)) ? selectedHabit.exercises : [];
    const exerciseFieldHTML = selectedExercises.length > 0
        ? `<select id="atv-log-exercise" onchange="onAtvExerciseChange()" class="w-full bg-white border border-zinc-300 rounded-xl px-3 py-1.5 text-xs text-zinc-900">${buildExerciseOptionsHTML(selectedHabit)}</select>`
        : `<input type="text" id="atv-log-exercise" required placeholder="Ex: Supino Reto" class="w-full bg-white border border-zinc-300 rounded-xl px-3 py-1.5 text-xs text-zinc-900">`;
    const exerciseInfoHTML = selectedExercises.length > 0 ? exerciseInfoText(selectedExercises[0], selectedExercises[0].name) : '';
    const suggestedLoadValue = (selectedExercises.length > 0 && selectedExercises[0].load !== undefined && selectedExercises[0].load !== null)
        ? Number(selectedExercises[0].load).toFixed(2)
        : '';

    const currentLogs = atvLogs[selectedAtvDate] || [];

    let logsTableHTML = '';
    if (currentLogs.length === 0) {
        logsTableHTML = `<tr><td colspan="5" class="py-6 text-center text-zinc-400 text-xs">Nenhum registro para esta data. Adicione abaixo.</td></tr>`;
    } else {
        currentLogs.forEach(log => {
            const hObj = habits.find(h => h.id === log.habitId);
            const hName = hObj ? hObj.name : 'Atividade';
            logsTableHTML += `
                <tr class="hover:bg-zinc-50 transition">
                    <td class="py-2.5 px-3 font-medium text-zinc-900">${hName}</td>
                    <td class="py-2.5 px-3 text-zinc-700">${log.exerciseName}</td>
                    <td class="py-2.5 px-3 text-center font-mono font-bold text-rose-600">${log.weight.toFixed(2)} kg</td>
                    <td class="py-2.5 px-3 text-zinc-500 italic">${log.notes || '—'}</td>
                    <td class="py-2.5 px-3 text-right"><button type="button" onclick="deleteAtvLogEntry('${selectedAtvDate}', '${log.id}')" class="text-rose-500 hover:text-rose-700">🗑️</button></td>
                </tr>`;
        });
    }

    // Renderiza o painel principal com carrossel adaptado para celular
    container.innerHTML = `
        <div class="col-span-full space-y-6">
            <!-- Seletor de Data Facilitado -->
            <div class="bg-zinc-50 p-4 rounded-2xl border border-zinc-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div class="flex items-center gap-2">
                    <span class="text-xs font-semibold text-zinc-700 uppercase">📅 Selecionar Dia:</span>
                    <input type="date" id="atv-date-picker" value="${selectedAtvDate}" onchange="setAtvDate(this.value)" class="bg-white border border-zinc-300 rounded-xl px-3 py-1.5 text-xs font-mono text-zinc-900">
                    <button type="button" onclick="setTodayAtvDate()" class="px-3 py-1.5 bg-black text-white rounded-xl text-xs font-semibold">Hoje</button>
                </div>
                <div class="text-xs text-zinc-500 font-mono">Exibindo registros para: <strong>${selectedAtvDate}</strong></div>
            </div>

            <!-- CARROSSEL PARA CELULAR (1 atividade por vez, arrastando para o lado) / GRID NO NOTEBOOK -->
            <div class="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin">
                ${atvHabits.length === 0 ? `<div class="text-xs text-zinc-400 p-4">Nenhuma atividade física configurada.</div>` : ''}
                ${atvHabits.map((habit, idx) => {
                    const m = calcHabitMetrics(habit);
                    const cat = CATEGORIES[habit.category];
                    return `
                        <div class="${cat.cardBg} p-5 rounded-3xl flex flex-col justify-between space-y-4 shadow-xs shrink-0 md:shrink min-w-[280px] sm:min-w-[320px] md:min-w-0 snap-center">
                            <div class="flex justify-between items-start">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-full bg-white/70 flex items-center justify-center text-lg">${cat.emoji}</div>
                                    <div>
                                        <h3 class="font-bold text-zinc-900 text-sm leading-snug">${habit.name}</h3>
                                        <span class="text-[11px] font-mono text-zinc-600">Meta: ${habit.targetHours}h/sem</span>
                                    </div>
                                </div>
                                <button type="button" onclick="openHabitModal(${habits.indexOf(habit)})" class="p-1">✏️</button>
                            </div>
                            <div class="font-mono"><span class="text-2xl font-bold text-zinc-950">${m.totalHours.toFixed(1)}h</span> <span class="text-xs text-zinc-600">/ ${habit.targetHours}h</span></div>
                        </div>`;
                }).join('')}
            </div>

            <!-- TABELA INTERATIVA DO DIA SELECIONADO -->
            <div class="bg-white border border-zinc-200 rounded-2xl p-5 space-y-4 shadow-sm">
                <h3 class="text-sm font-bold text-zinc-900">📝 Registro de Exercícios, Carga e Observações (${selectedAtvDate})</h3>
                <p class="text-[11px] font-mono text-zinc-500">${agendaHintHTML}</p>

                <form onsubmit="addAtvLogEntry(event)" class="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end bg-zinc-50 p-3.5 rounded-2xl border border-zinc-200">
                    <input type="hidden" id="atv-log-date" value="${selectedAtvDate}">
                    <div class="sm:col-span-3">
                        <label class="block text-[10px] uppercase text-zinc-500 mb-1 font-semibold">Atividade</label>
                        <select id="atv-log-habit" onchange="onAtvHabitChange()" class="w-full bg-white border border-zinc-300 rounded-xl px-3 py-1.5 text-xs text-zinc-900">${habitOptionsHTML}</select>
                    </div>
                    <div class="sm:col-span-3">
                        <label class="block text-[10px] uppercase text-zinc-500 mb-1 font-semibold">Exercício / Movimento</label>
                        <div id="atv-exercise-field">${exerciseFieldHTML}</div>
                    </div>
                    <div class="sm:col-span-2">
                        <label class="block text-[10px] uppercase text-zinc-500 mb-1 font-semibold">Carga (kg)</label>
                        <input type="number" id="atv-log-weight" step="0.01" min="0" value="${suggestedLoadValue}" placeholder="0.00" class="w-full bg-white border border-zinc-300 rounded-xl px-3 py-1.5 text-xs font-mono text-zinc-900">
                    </div>
                    <div class="sm:col-span-3">
                        <label class="block text-[10px] uppercase text-zinc-500 mb-1 font-semibold">Observações</label>
                        <input type="text" id="atv-log-notes" placeholder="Ex: 3x10 RPE 8" class="w-full bg-white border border-zinc-300 rounded-xl px-3 py-1.5 text-xs text-zinc-900">
                    </div>
                    <div class="sm:col-span-1">
                        <button type="submit" class="w-full py-1.5 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-bold">+</button>
                    </div>
                    <div id="atv-exercise-info" class="sm:col-span-12 text-[10px] font-mono text-zinc-500">${exerciseInfoHTML}</div>
                </form>

                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr class="border-b border-zinc-200 text-zinc-400 font-mono uppercase text-[10px]">
                                <th class="py-2.5 px-3">Atividade</th>
                                <th class="py-2.5 px-3">Exercício</th>
                                <th class="py-2.5 px-3 text-center">Carga (2 casas)</th>
                                <th class="py-2.5 px-3">Observações</th>
                                <th class="py-2.5 px-3 text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-zinc-100">${logsTableHTML}</tbody>
                    </table>
                </div>
            </div>
        </div>`;
}

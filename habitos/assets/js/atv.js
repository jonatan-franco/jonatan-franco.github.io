/* ===================================================================
 * atv.js — Módulo de Atividade Física (Carrossel, Cargas e Registro)
 * =================================================================== */

/* ------------------------------------------------------------------
 * Banco de dados do plano de treino pré-cadastrado:
 * Upper A, Lower A, Upper B e Lower B com variações equivalentes.
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

let atvLogs = {}; // { "YYYY-MM-DD": [ { id, habitId, planId, exerciseName, muscle, sets, reps, rest, weight, notes }, ... ] }

/* Data local no formato YYYY-MM-DD (evita deslocamento de fuso horário) */
function getLocalISODate(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

let selectedAtvDate = getLocalISODate();
let selectedWorkoutPlanId = 'upper_a';

/* Emoji representativo por grupo muscular */
function getMuscleEmoji(muscle) {
    if (!muscle) return '🏋️';
    const m = muscle.toLowerCase();
    if (m.includes('peitor') || m.includes('peito')) return '🥋';
    if (m.includes('costa') || m.includes('dorsal') || m.includes('romboide')) return '🦅';
    if (m.includes('deltoide') || m.includes('ombro')) return '🎯';
    if (m.includes('tríceps') || m.includes('triceps')) return '⚡';
    if (m.includes('bíceps') || m.includes('biceps') || m.includes('braquio')) return '💪';
    if (m.includes('quadríceps') || m.includes('quadriceps') || m.includes('agacha') || m.includes('leg') || m.includes('squat') || m.includes('extensora')) return '🦵';
    if (m.includes('isquio') || m.includes('flexor') || m.includes('stiff') || m.includes('rdl')) return '🏃';
    if (m.includes('glúteo') || m.includes('gluteo') || m.includes('búlgaro')) return '🍑';
    if (m.includes('panturrilha') || m.includes('sóleo')) return '🦶';
    if (m.includes('abdom') || m.includes('crunch') || m.includes('canivete')) return '🍫';
    if (m.includes('cardio') || m.includes('esteira') || m.includes('bike') || m.includes('aerób') || m.includes('remo') || m.includes('transport')) return '❤️';
    return '🏋️';
}

/* ------------------------------------------------------------------
 * Máscara de carga (Truncamento em até 5 dígitos totais com vírgula decimal automática)
 * Ex: Digitar 3000 -> 30,00 | Digitar 500 -> 5,00 | Digitar 12550 -> 125,50
 * ------------------------------------------------------------------ */
window.handleWeightInputMask = function(el) {
    if (!el) return;
    let digits = el.value.replace(/\D/g, '');
    if (digits.length > 5) digits = digits.slice(0, 5);
    if (!digits) {
        el.value = '';
        return;
    }
    if (digits.length === 1) {
        el.value = '0,0' + digits;
    } else if (digits.length === 2) {
        el.value = '0,' + digits;
    } else {
        const intPart = digits.slice(0, -2).replace(/^0+/, '') || '0';
        const decPart = digits.slice(-2);
        el.value = `${intPart},${decPart}`;
    }
};

function formatWeightNumber(num) {
    if (num === undefined || num === null || num === '' || isNaN(num) || Number(num) <= 0) return '';
    return Number(num).toFixed(2).replace('.', ',');
}

function getWeightNumericValue(str) {
    if (!str) return 0;
    const clean = String(str).replace(/\./g, '').replace(',', '.');
    const n = parseFloat(clean);
    return isNaN(n) ? 0 : n;
}

/* Semeia os hábitos do plano de treino uma única vez por dispositivo */
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

function loadAtvLogs() {
    const raw = SafeStorage.getItem('hq_atv_logs_v1');
    if (raw) {
        try { atvLogs = JSON.parse(raw) || {}; } catch (e) { atvLogs = {}; }
    }
    // Corrige registros antigos sem planId ou vinculados por engano ao hábito de sono (h3)
    let migrated = false;
    const validPlans = ['upper_a', 'lower_a', 'upper_b', 'lower_b'];
    Object.keys(atvLogs).forEach(dateKey => {
        const list = atvLogs[dateKey];
        if (!Array.isArray(list)) return;
        list.forEach(item => {
            if (!item) return;
            const hasValidPlan = item.planId && validPlans.includes(item.planId);
            const isWrongHabit = !item.habitId || item.habitId === 'h3';
            if (!hasValidPlan || isWrongHabit) {
                const resolvedPlan = (typeof resolveLogGroupPlanId === 'function')
                    ? resolveLogGroupPlanId(item)
                    : 'upper_a';
                if (item.planId !== resolvedPlan) {
                    item.planId = resolvedPlan;
                    migrated = true;
                }
                if (isWrongHabit) {
                    item.habitId = 'h_' + resolvedPlan;
                    migrated = true;
                }
            }
        });
    });
    if (migrated) {
        saveAtvLogs();
    }
}

function saveAtvLogs() {
    SafeStorage.setItem('hq_atv_logs_v1', JSON.stringify(atvLogs));
}

/* Navegação e seleção de data */
window.setAtvDate = function(dateStr) {
    selectedAtvDate = dateStr;
    renderAtvFisicaInteractiveView();
};

window.setTodayAtvDate = function() {
    selectedAtvDate = getLocalISODate();
    renderAtvFisicaInteractiveView();
};

window.setYesterdayAtvDate = function() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    selectedAtvDate = getLocalISODate(d);
    renderAtvFisicaInteractiveView();
};

/* Seleção do treino no topo */
window.selectAtvWorkoutPlan = function(planId) {
    selectedWorkoutPlanId = planId;
    renderAtvFisicaInteractiveView();
};

/* Controle de deslizamento do carrossel */
window.scrollAtvCarousel = function(direction) {
    const track = document.getElementById('atv-carousel-track');
    if (track) {
        const scrollAmount = (track.clientWidth * 0.75) * direction;
        track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
};

/* Registro rápido direto do card no carrossel */
window.submitAtvCardLog = function(cardIndex) {
    const workout = WORKOUT_PLAN.find(w => w.planId === selectedWorkoutPlanId) || WORKOUT_PLAN[0];
    const ex = workout.exercises[cardIndex];
    if (!ex) return;

    const exSelect = document.getElementById(`atv-card-ex-${cardIndex}`);
    const chosenName = exSelect ? exSelect.value.trim() : ex.name;

    const weightInput = document.getElementById(`atv-card-weight-${cardIndex}`);
    const weightVal = weightInput ? getWeightNumericValue(weightInput.value) : 0;

    const notesInput = document.getElementById(`atv-card-notes-${cardIndex}`);
    const notesVal = notesInput ? notesInput.value.trim() : '';

    const habit = habits.find(h => h.planId === selectedWorkoutPlanId || h.name === workout.name);

    if (!atvLogs[selectedAtvDate]) atvLogs[selectedAtvDate] = [];
    atvLogs[selectedAtvDate].push({
        id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        habitId: habit ? habit.id : ('h_' + selectedWorkoutPlanId),
        planId: selectedWorkoutPlanId,
        exerciseName: chosenName,
        muscle: ex.muscle,
        sets: ex.sets || 3,
        reps: ex.reps || '10',
        rest: ex.rest || '-',
        weight: parseFloat(weightVal.toFixed(2)),
        notes: notesVal
    });

    saveAtvLogs();
    saveData();
    renderAtvFisicaInteractiveView();
};

/* Registro de exercício personalizado */
window.submitCustomAtvLog = function(event) {
    if (event) event.preventDefault();
    const nameEl = document.getElementById('atv-custom-name');
    const exName = nameEl ? nameEl.value.trim() : '';
    if (!exName) return;

    const muscleEl = document.getElementById('atv-custom-muscle');
    const muscle = muscleEl ? muscleEl.value.trim() : 'Geral';

    const setsEl = document.getElementById('atv-custom-sets');
    const sets = setsEl ? (parseInt(setsEl.value, 10) || 3) : 3;

    const repsEl = document.getElementById('atv-custom-reps');
    const reps = repsEl ? (repsEl.value.trim() || '10') : '10';

    const restEl = document.getElementById('atv-custom-rest');
    const rest = restEl ? (restEl.value.trim() || '-') : '-';

    const weightEl = document.getElementById('atv-custom-weight');
    const weightVal = weightEl ? getWeightNumericValue(weightEl.value) : 0;

    const notesEl = document.getElementById('atv-custom-notes');
    const notes = notesEl ? notesEl.value.trim() : '';

    if (!atvLogs[selectedAtvDate]) atvLogs[selectedAtvDate] = [];
    atvLogs[selectedAtvDate].push({
        id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        habitId: 'h_' + selectedWorkoutPlanId,
        planId: selectedWorkoutPlanId,
        exerciseName: exName,
        muscle,
        sets,
        reps,
        rest,
        weight: parseFloat(weightVal.toFixed(2)),
        notes
    });

    saveAtvLogs();
    saveData();
    renderAtvFisicaInteractiveView();
};

/* ------------------------------------------------------------------
 * Edição de Registro de Exercício
 * ------------------------------------------------------------------ */
window.openEditAtvLog = function(dateStr, logId) {
    const list = atvLogs[dateStr] || [];
    const log = list.find(item => item.id === logId);
    if (!log) return;

    const modal = document.getElementById('atv-edit-log-modal');
    if (!modal) return;

    const dateField = document.getElementById('atv-edit-date');
    if (dateField) dateField.value = dateStr;

    const idField = document.getElementById('atv-edit-log-id');
    if (idField) idField.value = logId;

    const weightField = document.getElementById('atv-edit-weight');
    if (weightField) weightField.value = formatWeightNumber(log.weight);

    const setsField = document.getElementById('atv-edit-sets');
    if (setsField) setsField.value = log.sets || 3;

    const repsField = document.getElementById('atv-edit-reps');
    if (repsField) repsField.value = log.reps || '10';

    const notesField = document.getElementById('atv-edit-notes');
    if (notesField) notesField.value = log.notes || '';

    const container = document.getElementById('atv-edit-exercise-container');
    if (container) {
        const exMap = new Map();
        WORKOUT_PLAN.forEach(w => {
            w.exercises.forEach(e => {
                exMap.set(e.name, { name: e.name, muscle: e.muscle, isVar: false });
                (e.variations || []).forEach(v => {
                    exMap.set(v, { name: v, muscle: e.muscle, isVar: true });
                });
            });
        });

        let optsHtml = '';
        let foundCurrent = false;
        exMap.forEach((meta, name) => {
            const isSel = name === log.exerciseName;
            if (isSel) foundCurrent = true;
            optsHtml += `<option value="${name}" ${isSel ? 'selected' : ''}>${meta.isVar ? '↳ ' + name : name} (${meta.muscle})</option>`;
        });
        if (!foundCurrent && log.exerciseName) {
            optsHtml = `<option value="${log.exerciseName}" selected>${log.exerciseName}</option>` + optsHtml;
        }
        container.innerHTML = `<select id="atv-edit-exercise" class="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-900 focus:bg-white">${optsHtml}</select>`;
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
};

window.closeAtvEditModal = function() {
    const modal = document.getElementById('atv-edit-log-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
};

window.saveEditedAtvLog = function(event) {
    if (event) event.preventDefault();
    const dateField = document.getElementById('atv-edit-date');
    const idField = document.getElementById('atv-edit-log-id');
    if (!dateField || !idField) return;

    const dateStr = dateField.value;
    const logId = idField.value;
    const list = atvLogs[dateStr] || [];
    const log = list.find(item => item.id === logId);
    if (!log) return;

    const exInput = document.getElementById('atv-edit-exercise');
    if (exInput) {
        log.exerciseName = exInput.value.trim();
        const meta = findExerciseMeta(log.exerciseName, log.habitId);
        if (meta && meta.muscle) log.muscle = meta.muscle;
    }

    const weightInput = document.getElementById('atv-edit-weight');
    if (weightInput) log.weight = getWeightNumericValue(weightInput.value);

    const setsInput = document.getElementById('atv-edit-sets');
    if (setsInput) log.sets = parseInt(setsInput.value, 10) || 3;

    const repsInput = document.getElementById('atv-edit-reps');
    if (repsInput) log.reps = repsInput.value.trim() || '10';

    const notesInput = document.getElementById('atv-edit-notes');
    if (notesInput) log.notes = notesInput.value.trim();

    saveAtvLogs();
    saveData();
    closeAtvEditModal();
    renderAtvFisicaInteractiveView();
};

window.deleteAtvLogEntry = function(dateStr, logId) {
    if (!atvLogs[dateStr]) return;
    if (confirm('Remover este registro de exercício?')) {
        atvLogs[dateStr] = atvLogs[dateStr].filter(item => item.id !== logId);
        saveAtvLogs();
        saveData();
        renderAtvFisicaInteractiveView();
    }
};

/* ------------------------------------------------------------------
 * Renderizador Principal da View de Atividade Física
 * ------------------------------------------------------------------ */
function renderAtvFisicaInteractiveView() {
    const container = document.getElementById('atv-fisica-cards-grid');
    if (!container) return;

    loadAtvLogs();

    // Identificação do dia da semana a partir da data selecionada
    const dow = new Date(selectedAtvDate + 'T12:00:00').getDay(); // 0=Dom..6=Sáb
    const dayIndex = (dow + 6) % 7; // 0=Seg..6=Dom
    const dayRef = weekDays[dayIndex] || weekDays[0];

    // Verifica se há treino agendado na Agenda para este dia
    const scheduledEvents = Array.isArray(calendarEvents) ? calendarEvents.filter(ev => ev.dayIndex === dayIndex) : [];
    let scheduledPlanName = '';
    if (scheduledEvents.length > 0) {
        const evHabit = habits.find(h => h.id === scheduledEvents[0].habitId);
        if (evHabit) scheduledPlanName = evHabit.name;
    }

    const agendaHintHTML = scheduledPlanName
        ? `📅 Agenda de ${dayRef.shortName}: <strong class="text-zinc-900">${scheduledPlanName}</strong>`
        : `📅 Nenhum treino específico agendado para ${dayRef.shortName}.`;

    // Treinos pré-cadastrados disponíveis
    const workoutOptions = [
        { id: 'upper_a', label: 'Upper A', tag: 'Superiores A' },
        { id: 'lower_a', label: 'Lower A', tag: 'Inferiores A' },
        { id: 'upper_b', label: 'Upper B', tag: 'Superiores B' },
        { id: 'lower_b', label: 'Lower B', tag: 'Inferiores B' }
    ];

    const currentWorkout = WORKOUT_PLAN.find(w => w.planId === selectedWorkoutPlanId) || WORKOUT_PLAN[0];
    const currentLogs = atvLogs[selectedAtvDate] || [];

    // Monta botões seletores de treino no topo
    const workoutSelectorButtonsHTML = workoutOptions.map(wo => {
        const isActive = wo.id === selectedWorkoutPlanId;
        const btnCls = isActive
            ? "px-4 py-2 rounded-2xl bg-black text-white font-bold text-xs shadow-sm transition"
            : "px-4 py-2 rounded-2xl bg-zinc-100 text-zinc-600 hover:text-black hover:bg-zinc-200 text-xs font-semibold transition";
        return `<button type="button" onclick="selectAtvWorkoutPlan('${wo.id}')" class="${btnCls}">
            <span>${wo.label}</span>
            <span class="text-[10px] block opacity-80 font-normal">${wo.tag}</span>
        </button>`;
    }).join('');

    // Monta os cards do carrossel para o treino selecionado
    const carouselCardsHTML = currentWorkout.exercises.map((ex, idx) => {
        const muscleEmoji = getMuscleEmoji(ex.muscle);
        const dayLoggedCount = currentLogs.filter(l => l.exerciseName === ex.name || (ex.variations && ex.variations.includes(l.exerciseName))).length;
        const suggestedLoad = (ex.load !== undefined && ex.load !== null) ? formatWeightNumber(ex.load) : '';

        // Dropdown com exercício principal e variações equivalentes (↳)
        const selectOptionsHTML = [
            `<option value="${ex.name}">${ex.name}</option>`,
            ...(ex.variations || []).map(v => `<option value="${v}">↳ ${v}</option>`)
        ].join('');

        return `
            <div class="w-[300px] sm:w-[330px] shrink-0 snap-center bg-white border border-zinc-200/90 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-zinc-300 transition">
                <div class="space-y-3">
                    <div class="flex items-start gap-3">
                        <div class="w-11 h-11 rounded-2xl bg-zinc-100 flex items-center justify-center text-xl shrink-0">
                            ${muscleEmoji}
                        </div>
                        <div class="min-w-0 flex-1">
                            <span class="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold block truncate" title="${ex.muscle}">${ex.muscle}</span>
                            <h4 class="text-sm font-bold text-zinc-900 truncate" title="${ex.name}">${ex.name}</h4>
                        </div>
                    </div>

                    <div class="flex flex-wrap gap-1.5 text-[11px] font-mono">
                        <span class="px-2.5 py-1 rounded-xl bg-zinc-100 text-zinc-800 font-semibold">🎯 ${ex.sets}× ${ex.reps}</span>
                        <span class="px-2.5 py-1 rounded-xl bg-zinc-100 text-zinc-700">⏱️ ${ex.rest}</span>
                        ${suggestedLoad ? `<span class="px-2.5 py-1 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 font-bold">ref: ${suggestedLoad} kg</span>` : ''}
                    </div>

                    <div>
                        <label class="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Exercício / Variação</label>
                        <select id="atv-card-ex-${idx}" class="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-900 focus:bg-white focus:border-black transition">
                            ${selectOptionsHTML}
                        </select>
                    </div>

                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Carga (kg)</label>
                            <input type="text" id="atv-card-weight-${idx}" inputmode="numeric" oninput="handleWeightInputMask(this)" value="${suggestedLoad}" placeholder="0,00" class="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-sm font-mono font-bold text-rose-600 text-center focus:bg-white focus:border-rose-500 transition">
                        </div>
                        <div>
                            <label class="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Observações</label>
                            <input type="text" id="atv-card-notes-${idx}" placeholder="Ex: RPE 8" class="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-800 focus:bg-white transition">
                        </div>
                    </div>
                </div>

                <div class="pt-2 border-t border-zinc-100 space-y-1.5">
                    <button type="button" onclick="submitAtvCardLog(${idx})" class="w-full py-2.5 bg-black hover:bg-zinc-800 text-white rounded-2xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5">
                        <span>+ Registrar Exercício</span>
                    </button>
                    ${dayLoggedCount > 0 ? `<div class="text-[10px] text-center font-mono text-emerald-600 font-semibold">✓ ${dayLoggedCount} registro(s) nesta data</div>` : ''}
                </div>
            </div>`;
    }).join('');

    // Card extra para registrar outro exercício livre se desejar
    const customExerciseCardHTML = `
        <div class="w-[300px] sm:w-[330px] shrink-0 snap-center bg-zinc-50/80 border border-dashed border-zinc-300 rounded-3xl p-5 flex flex-col justify-between space-y-4">
            <form onsubmit="submitCustomAtvLog(event)" class="space-y-3">
                <div class="flex items-center gap-3">
                    <div class="w-11 h-11 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center text-xl shrink-0">
                        ➕
                    </div>
                    <div>
                        <span class="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold block">PERSONALIZADO</span>
                        <h4 class="text-sm font-bold text-zinc-900">Outro Exercício</h4>
                    </div>
                </div>
                <div>
                    <label class="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Nome do Movimento</label>
                    <input type="text" id="atv-custom-name" required placeholder="Ex: Barra Fixa" class="w-full bg-white border border-zinc-200 rounded-xl px-3 py-1.5 text-xs text-zinc-900">
                </div>
                <div class="grid grid-cols-2 gap-2">
                    <div>
                        <label class="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Grupo Muscular</label>
                        <input type="text" id="atv-custom-muscle" placeholder="Ex: Costas" class="w-full bg-white border border-zinc-200 rounded-xl px-2 py-1.5 text-xs text-zinc-900">
                    </div>
                    <div>
                        <label class="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Carga (kg)</label>
                        <input type="text" id="atv-custom-weight" inputmode="numeric" oninput="handleWeightInputMask(this)" placeholder="0,00" class="w-full bg-white border border-zinc-200 rounded-xl px-2 py-1.5 text-xs font-mono font-bold text-rose-600 text-center">
                    </div>
                </div>
                <div class="grid grid-cols-3 gap-1.5">
                    <div>
                        <label class="block text-[9px] uppercase font-bold text-zinc-400 mb-0.5">Séries</label>
                        <input type="number" id="atv-custom-sets" value="3" min="1" max="20" class="w-full bg-white border border-zinc-200 rounded-xl px-2 py-1 text-xs font-mono text-center">
                    </div>
                    <div>
                        <label class="block text-[9px] uppercase font-bold text-zinc-400 mb-0.5">Reps</label>
                        <input type="text" id="atv-custom-reps" value="10" class="w-full bg-white border border-zinc-200 rounded-xl px-2 py-1 text-xs font-mono text-center">
                    </div>
                    <div>
                        <label class="block text-[9px] uppercase font-bold text-zinc-400 mb-0.5">Descanso</label>
                        <input type="text" id="atv-custom-rest" value="90s" class="w-full bg-white border border-zinc-200 rounded-xl px-2 py-1 text-xs font-mono text-center">
                    </div>
                </div>
                <div>
                    <label class="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Observações</label>
                    <input type="text" id="atv-custom-notes" placeholder="Opcional" class="w-full bg-white border border-zinc-200 rounded-xl px-3 py-1.5 text-xs text-zinc-800">
                </div>
                <button type="submit" class="w-full py-2 bg-zinc-900 hover:bg-black text-white rounded-2xl text-xs font-bold transition">
                    + Salvar Personalizado
                </button>
            </form>
        </div>
    `;

    // Tabela de Histórico da data selecionada
    let logsTableHTML = '';
    let totalDayVolume = 0;

    if (currentLogs.length === 0) {
        logsTableHTML = `<tr><td colspan="8" class="py-8 text-center text-zinc-400 text-xs">Nenhum exercício registrado nesta data.<br>Utilize os cards acima para registrar suas cargas.</td></tr>`;
    } else {
        currentLogs.forEach(log => {
            const resolvedPlanId = (typeof resolveLogGroupPlanId === 'function') ? resolveLogGroupPlanId(log) : (log.planId || 'upper_a');
            const planObj = WORKOUT_PLAN.find(w => w.planId === resolvedPlanId);
            const hObj = habits.find(h => h.category === 'atv_fisica' && ((log.habitId && h.id === log.habitId) || (resolvedPlanId && h.planId === resolvedPlanId)));
            const wName = planObj ? planObj.name : (hObj ? hObj.name : (resolvedPlanId ? resolvedPlanId.replace('_', ' ').toUpperCase() : 'Treino'));
            const volumeItem = calcLogEntryVolume(log);
            totalDayVolume += volumeItem;

            const muscleStr = log.muscle || (findExerciseMeta(log.exerciseName, log.habitId) || {}).muscle || 'Geral';
            const muscleEmoji = getMuscleEmoji(muscleStr);
            const setsRepsTxt = `${log.sets || 3}× ${log.reps || '10'} ${log.rest ? `(${log.rest})` : ''}`;

            logsTableHTML += `
                <tr class="hover:bg-zinc-50 transition border-b border-zinc-100">
                    <td class="py-3 px-3 font-semibold text-zinc-900 whitespace-nowrap">${wName}</td>
                    <td class="py-3 px-3 whitespace-nowrap"><span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-100 text-[11px] font-medium text-zinc-800"><span>${muscleEmoji}</span><span class="truncate max-w-[150px]">${muscleStr}</span></span></td>
                    <td class="py-3 px-3 font-medium text-zinc-800">${log.exerciseName}</td>
                    <td class="py-3 px-3 font-mono text-center text-xs text-zinc-600">${setsRepsTxt}</td>
                    <td class="py-3 px-3 text-center font-mono font-bold text-rose-600">${log.weight.toFixed(2).replace('.', ',')} kg</td>
                    <td class="py-3 px-3 text-center font-mono font-bold text-zinc-900">${volumeItem.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg</td>
                    <td class="py-3 px-3 text-zinc-500 text-xs italic">${log.notes || '—'}</td>
                    <td class="py-3 px-3 text-right whitespace-nowrap">
                        <button type="button" onclick="openEditAtvLog('${selectedAtvDate}', '${log.id}')" title="Editar exercício" class="p-1 text-zinc-600 hover:text-black transition">✏️</button>
                        <button type="button" onclick="deleteAtvLogEntry('${selectedAtvDate}', '${log.id}')" title="Remover" class="p-1 text-rose-500 hover:text-rose-700 transition">🗑️</button>
                    </td>
                </tr>`;
        });
    }

    container.innerHTML = `
        <div class="space-y-6">
            <!-- 1. BARRA DE CONTROLE: SELETOR DE DATA E AGENDA -->
            <div class="bg-zinc-50 p-4 rounded-3xl border border-zinc-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div class="flex flex-wrap items-center gap-2">
                    <span class="text-xs font-bold text-zinc-700 uppercase font-mono">Data:</span>
                    <input type="date" id="atv-date-picker" value="${selectedAtvDate}" onchange="setAtvDate(this.value)" class="bg-white border border-zinc-300 rounded-xl px-3 py-1.5 text-xs font-mono font-semibold text-zinc-900 shadow-xs">
                    <button type="button" onclick="setTodayAtvDate()" class="px-3 py-1.5 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold shadow-xs transition">Hoje</button>
                    <button type="button" onclick="setYesterdayAtvDate()" class="px-3 py-1.5 bg-white border border-zinc-200 text-zinc-700 hover:text-black rounded-xl text-xs font-semibold shadow-xs transition">Ontem</button>
                </div>
                <div class="text-xs font-mono text-zinc-500">
                    ${agendaHintHTML}
                </div>
            </div>

            <!-- 2. SELETOR DE ATIVIDADE (UPPER / LOWER A / B) FORA DO CARD NO TOPO -->
            <div class="bg-white border border-zinc-200 rounded-3xl p-5 shadow-sm space-y-4">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                        <span class="text-[10px] font-mono uppercase tracking-widest text-rose-600 font-bold">PLANO DE TREINO</span>
                        <h3 class="text-lg font-bold text-zinc-900">Selecione o Treino do Dia</h3>
                    </div>
                    <div class="flex flex-wrap gap-2">
                        ${workoutSelectorButtonsHTML}
                    </div>
                </div>

                <!-- 3. CARROSSEL DE EXERCÍCIOS (SLIDER E SWIPEABLE CARDS) -->
                <div class="pt-2">
                    <div class="flex justify-between items-center mb-3">
                        <div class="flex items-center gap-2">
                            <span class="text-xs font-bold uppercase tracking-wider text-zinc-700">Exercícios • ${currentWorkout.name}</span>
                            <span class="text-[11px] font-mono text-zinc-400">(${currentWorkout.exercises.length} movimentos)</span>
                        </div>
                        <div class="flex items-center gap-1.5">
                            <button type="button" onclick="scrollAtvCarousel(-1)" class="w-8 h-8 rounded-full border border-zinc-200 bg-white hover:bg-zinc-100 flex items-center justify-center text-zinc-700 text-sm font-bold shadow-xs transition" title="Rolar para a esquerda">‹</button>
                            <button type="button" onclick="scrollAtvCarousel(1)" class="w-8 h-8 rounded-full border border-zinc-200 bg-white hover:bg-zinc-100 flex items-center justify-center text-zinc-700 text-sm font-bold shadow-xs transition" title="Rolar para a direita">›</button>
                        </div>
                    </div>

                    <div id="atv-carousel-track" class="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scroll-smooth scrollbar-thin px-1">
                        ${carouselCardsHTML}
                        ${customExerciseCardHTML}
                    </div>
                </div>
            </div>

            <!-- 4. HISTÓRICO DE EXERCÍCIOS REGISTRADOS PARA ESTA DATA -->
            <div class="bg-white border border-zinc-200 rounded-3xl p-5 shadow-sm space-y-4">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-zinc-100 pb-4">
                    <div>
                        <span class="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold">HISTÓRICO DO DIA</span>
                        <h3 class="text-base font-bold text-zinc-900">Exercícios Registrados (${selectedAtvDate})</h3>
                    </div>
                    ${currentLogs.length > 0 ? `
                        <div class="flex items-center gap-2">
                            <span class="text-xs font-mono text-zinc-500">Volume Total da Sessão:</span>
                            <span class="px-3 py-1 rounded-xl bg-amber-100 text-amber-950 font-mono font-bold text-xs">${totalDayVolume.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg</span>
                        </div>` : ''}
                </div>

                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr class="border-b border-zinc-200 text-zinc-400 font-mono uppercase text-[10px]">
                                <th class="py-2.5 px-3">Atividade</th>
                                <th class="py-2.5 px-3">Grupo Muscular</th>
                                <th class="py-2.5 px-3">Exercício</th>
                                <th class="py-2.5 px-3 text-center">Séries × Reps</th>
                                <th class="py-2.5 px-3 text-center">Carga (kg)</th>
                                <th class="py-2.5 px-3 text-center">Volume Total</th>
                                <th class="py-2.5 px-3">Observações</th>
                                <th class="py-2.5 px-3 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>${logsTableHTML}</tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    refreshIcons();
}

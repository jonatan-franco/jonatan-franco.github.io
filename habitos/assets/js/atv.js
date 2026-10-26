/* ===================================================================
 * atv.js — Módulo de Atividade Física (Força & Aeróbico, Carrossel,
 * Cadastro de Exercícios Principal/Substituto, Cargas/km/h e Histórico)
 * =================================================================== */

/* ------------------------------------------------------------------
 * Banco de dados do plano de treino pré-cadastrado:
 * Upper A, Lower A, Upper B e Lower B com variações equivalentes.
 * ------------------------------------------------------------------ */
const CARDIO_Z2_PLAN_ID = 'cardio_z2';
const CARDIO_Z2_HABIT_ID = 'h_cardio_z2';
const CARDIO_Z2_NAME = 'Cardio Zona 2';

const DEFAULT_CARDIO_Z2_EXERCISE = {
    name: 'Cardio Zona 2',
    muscle: 'Sistema Cardiovascular / Resistência',
    variations: ['Corrida', 'Caminhada', 'Misto (Caminhada + Corrida)', 'Bike / Ciclismo', 'Esteira Inclinada', 'Escada / Elíptico', 'Transport / Remo ergômetro'],
    sets: 1,
    reps: '20 min',
    rest: '-'
};

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
            { ...DEFAULT_CARDIO_Z2_EXERCISE, variations: [...DEFAULT_CARDIO_Z2_EXERCISE.variations] }
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
            { name: 'Abdominal na Polia Alta (Cable Crunch)', muscle: 'Reto Abdominal (ênfase superior e média)', variations: ['Crunch no solo com carga', 'Abdominal na máquina'], sets: 3, reps: '12-15', rest: '60-90s' },
            { ...DEFAULT_CARDIO_Z2_EXERCISE, variations: [...DEFAULT_CARDIO_Z2_EXERCISE.variations] }
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
            { ...DEFAULT_CARDIO_Z2_EXERCISE, variations: [...DEFAULT_CARDIO_Z2_EXERCISE.variations] }
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
            { name: 'Elevação de Pernas na Barra Fixa / Paralelas (Hanging Leg Raise)', muscle: 'Reto Abdominal (ênfase infra-umbilical)', variations: ['Elevação de pernas no solo com elevação pélvica', 'Abdominal canivete'], sets: 3, reps: '12-15', rest: '60-90s' },
            { ...DEFAULT_CARDIO_Z2_EXERCISE, variations: [...DEFAULT_CARDIO_Z2_EXERCISE.variations] }
        ]
    }
];

const PLAN_SEED_KEY = 'hq_plan_seeded_v1';
const ATV_UI_STATE_KEY = 'hq_atv_ui_state_v2';
const WORKOUT_CATALOG_KEY = 'hq_workout_catalog_v1';

let atvLogs = {}; // { "YYYY-MM-DD": [ { id, habitId, planId, exerciseName, muscle, sets, reps, rest, weight, unit, notes }, ... ] }

// Estado Independente de Timer (Cronômetro & Regressivo) para cada Exercício Aeróbico
const AERO_MODALITIES_LIST = [
    'Corrida',
    'Caminhada',
    'Misto (Caminhada + Corrida)',
    'Bike / Ciclismo',
    'Esteira Inclinada',
    'Escada / Elíptico'
];

let aeroSelectedModality = 'Corrida';
const aeroTimersByModality = {};

function createDefaultAeroModalityTimerState(mod) {
    return {
        modality: mod,
        timerType: 'stopwatch',       // 'stopwatch' (Cronômetro) | 'countdown' (Regressivo)
        running: false,
        intervalId: null,
        // Cronômetro (progressivo)
        elapsedMs: 0,
        lastStartTs: 0,
        // Regressivo (countdown)
        cdTotalSec: 20 * 60,          // padrão 20:00
        cdRemainingMs: 20 * 60 * 1000,
        cdTargetEndTs: 0,
        // Fase do treino Misto (Corrida <-> Caminhada)
        mixedPhase: 'run',            // 'run' | 'walk'
        runElapsedMs: 0,
        walkElapsedMs: 0,
        // Última duração concluída via botão "Concluir" do timer
        concludedDurationStr: '',
        concludedElapsedSec: 0
    };
}

function getAeroModalityTimerState(mod) {
    const key = mod || aeroSelectedModality || 'Corrida';
    if (!aeroTimersByModality[key]) {
        aeroTimersByModality[key] = createDefaultAeroModalityTimerState(key);
    }
    return aeroTimersByModality[key];
}

function getActiveOrConcludedAeroDurationMs(mod) {
    const st = getAeroModalityTimerState(mod || aeroSelectedModality);
    if (st.concludedElapsedSec > 0) return st.concludedElapsedSec * 1000;
    if (st.timerType === 'countdown') {
        const usedMs = Math.max(0, (st.cdTotalSec * 1000) - st.cdRemainingMs);
        return usedMs;
    }
    return st.elapsedMs > 0 ? st.elapsedMs : 0;
}

window.getAtvAerobicTimerState = function() {
    const cur = getAeroModalityTimerState(aeroSelectedModality);
    if (cur && cur.running) {
        const displayMs = cur.timerType === 'countdown' ? cur.cdRemainingMs : cur.elapsedMs;
        return {
            running: true,
            elapsedMs: displayMs,
            modality: cur.timerType === 'countdown' ? `${cur.modality} (Regressivo)` : cur.modality
        };
    }
    for (const mod of AERO_MODALITIES_LIST) {
        const st = aeroTimersByModality[mod];
        if (st && st.running) {
            const displayMs = st.timerType === 'countdown' ? st.cdRemainingMs : st.elapsedMs;
            return {
                running: true,
                elapsedMs: displayMs,
                modality: st.timerType === 'countdown' ? `${st.modality} (Regressivo)` : st.modality
            };
        }
    }
    const fallbackDisplayMs = cur.timerType === 'countdown' ? cur.cdRemainingMs : cur.elapsedMs;
    return {
        running: false,
        elapsedMs: fallbackDisplayMs,
        modality: aeroSelectedModality
    };
};

/* Identifica se um exercício ou card é aeróbico/cardio (usa km/h em vez de kg) */
function isCardioExercise(exName, muscle) {
    const combined = `${exName || ''} ${muscle || ''}`.toLowerCase();
    return (
        combined.includes('cardio') ||
        combined.includes('esteira') ||
        combined.includes('bike') ||
        combined.includes('ciclismo') ||
        combined.includes('corrida') ||
        combined.includes('caminhada') ||
        combined.includes('misto') ||
        combined.includes('aerób') ||
        combined.includes('aerob') ||
        combined.includes('transport') ||
        combined.includes('elíptico') ||
        combined.includes('eliptico') ||
        combined.includes('remo ergômetro') ||
        combined.includes('escada')
    );
}

/* Carrega e salva customizações do catálogo de exercícios (principais e substitutos/variações) */
let isWorkoutCatalogLoaded = false;
function loadWorkoutCatalogCustomizations() {
    if (isWorkoutCatalogLoaded) return;
    isWorkoutCatalogLoaded = true;
    try {
        const raw = SafeStorage.getItem(WORKOUT_CATALOG_KEY);
        if (!raw) return;
    
        const savedCatalog = JSON.parse(raw);
        if (!savedCatalog || typeof savedCatalog !== 'object') return;
        let catMigrated = false;
        WORKOUT_PLAN.forEach(w => {
            if (Array.isArray(savedCatalog[w.planId]) && savedCatalog[w.planId].length > 0) {
                w.exercises = savedCatalog[w.planId];
            }
            let hasCardio = false;
            w.exercises.forEach(ex => {
                if (isCardioExercise(ex.name, ex.muscle)) {
                    hasCardio = true;
                    if (ex.name.startsWith('Cardio Zona 2 (')) {
                        ex.name = CARDIO_Z2_NAME;
                        catMigrated = true;
                    }
                    if (!Array.isArray(ex.variations)) ex.variations = [];
                    DEFAULT_CARDIO_Z2_EXERCISE.variations.forEach(v => {
                        if (!ex.variations.some(ev => ev.toLowerCase() === v.toLowerCase())) {
                            ex.variations.push(v);
                            catMigrated = true;
                        }
                    });
                }
            });
            if (!hasCardio) {
                w.exercises.push({ ...DEFAULT_CARDIO_Z2_EXERCISE, variations: [...DEFAULT_CARDIO_Z2_EXERCISE.variations] });
                catMigrated = true;
            }
        });
        if (catMigrated) saveWorkoutCatalogCustomizations();
    } catch (e) {}
}

function saveWorkoutCatalogCustomizations() {
    try {
        const payload = {};
        WORKOUT_PLAN.forEach(w => {
            payload[w.planId] = w.exercises;
            // Sincroniza também no objeto habit correspondente
            if (typeof habits !== 'undefined' && Array.isArray(habits)) {
                const h = habits.find(hb => hb.planId === w.planId || hb.name === w.name);
                if (h) h.exercises = JSON.parse(JSON.stringify(w.exercises));
            }
        });
        SafeStorage.setItem(WORKOUT_CATALOG_KEY, JSON.stringify(payload));
    } catch (e) {}
}

/* Data local no formato YYYY-MM-DD (evita deslocamento de fuso horário) */
function getLocalISODate(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getYesterdayISODate() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return getLocalISODate(d);
}

/* Formata YYYY-MM-DD para DD-MM-AAAA */
function formatDateDDMMYYYY(isoStr) {
    if (!isoStr || typeof isoStr !== 'string') return '';
    const parts = isoStr.split('-');
    if (parts.length !== 3) return isoStr;
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

let selectedAtvDate = getLocalISODate();
let selectedWorkoutPlanId = 'upper_a';
let atvSubMode = 'strength'; // 'strength' | 'aerobic'
let atvUiState = {
    selectedAtvDate: '',
    selectedWorkoutPlanId: 'upper_a',
    atvSubMode: 'strength',
    hidePreviousWorkouts: false,
    carouselScrollLeft: 0,
    cardInputs: {},
    customInputs: {
        name: '',
        slotIndex: '0',
        role: 'variation', // 'main' | 'variation'
        sets: '',
        reps: '',
        rest: '',
        duration: ''
    },
    aerobicInputs: {
        speedKmh: '',
        manualMin: '',
        notes: ''
    }
};
let isAtvUiStateLoaded = false;

function loadAtvUiState() {
    loadWorkoutCatalogCustomizations();
    if (isAtvUiStateLoaded) return;
    isAtvUiStateLoaded = true;
    try {
        const raw = SafeStorage.getItem(ATV_UI_STATE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') {
                if (parsed.selectedAtvDate) selectedAtvDate = parsed.selectedAtvDate;
                if (parsed.selectedWorkoutPlanId) selectedWorkoutPlanId = parsed.selectedWorkoutPlanId;
                if (parsed.atvSubMode === 'aerobic' || parsed.atvSubMode === 'strength') {
                    atvSubMode = parsed.atvSubMode;
                }
                const cleanCardInputs = {};
                if (parsed.cardInputs && typeof parsed.cardInputs === 'object') {
                    Object.keys(parsed.cardInputs).forEach(k => {
                        if (/^\d{4}-\d{2}-\d{2}_/.test(k)) {
                            cleanCardInputs[k] = parsed.cardInputs[k];
                        }
                    });
                }
                atvUiState = {
                    selectedAtvDate,
                    selectedWorkoutPlanId,
                    atvSubMode,
                    hidePreviousWorkouts: !!parsed.hidePreviousWorkouts,
                    carouselScrollLeft: Number(parsed.carouselScrollLeft) || 0,
                    cardInputs: cleanCardInputs,
                    customInputs: {
                        name: '',
                        slotIndex: (parsed.customInputs && parsed.customInputs.slotIndex) ? String(parsed.customInputs.slotIndex) : '0',
                        role: (parsed.customInputs && parsed.customInputs.role === 'main') ? 'main' : 'variation',
                        sets: '',
                        reps: '',
                        rest: '',
                        duration: ''
                    },
                    aerobicInputs: {
                        speedKmh: '',
                        manualMin: '',
                        notes: '',
                        ...(parsed.aerobicInputs || {})
                    },
                    aerobicInputsByModality: (parsed.aerobicInputsByModality && typeof parsed.aerobicInputsByModality === 'object')
                        ? parsed.aerobicInputsByModality
                        : {}
                };
            }
        }
    } catch (e) {}
}

function saveAtvUiState() {
    atvUiState.selectedAtvDate = selectedAtvDate;
    atvUiState.selectedWorkoutPlanId = selectedWorkoutPlanId;
    atvUiState.atvSubMode = atvSubMode;
    SafeStorage.setItem(ATV_UI_STATE_KEY, JSON.stringify(atvUiState));
}

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
    if (m.includes('cardio') || m.includes('esteira') || m.includes('bike') || m.includes('aerób') || m.includes('remo') || m.includes('transport') || m.includes('corrida') || m.includes('caminhada')) return '❤️';
    return '🏋️';
}

/* ------------------------------------------------------------------
 * Máscara de carga/velocidade (Truncamento em até 5 dígitos totais com vírgula decimal automática)
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

/* Extrai o número de repetições de uma string (ex: "8-12" -> 10, "12" -> 12) */
function parseRepsNumber(repsStr) {
    if (repsStr === undefined || repsStr === null) return 10;
    const str = String(repsStr);
    const matchRange = str.match(/(\d+)\s*[-–]\s*(\d+)/);
    if (matchRange) {
        return (parseFloat(matchRange[1]) + parseFloat(matchRange[2])) / 2;
    }
    const matchSingle = str.match(/(\d+)/);
    return matchSingle ? parseFloat(matchSingle[1]) : 10;
}

/* ------------------------------------------------------------------
 * Cálculo do peso/velocidade média de referência dos últimos treinos para um exercício,
 * dando peso maior (fator 2.5x vs 1.0x) para cargas feitas com > 2 repetições.
 * ------------------------------------------------------------------ */
function calcWeightedExerciseRefLoad(exerciseNames, fallbackLoad) {
    const namesSet = new Set(
        (Array.isArray(exerciseNames) ? exerciseNames : [exerciseNames])
            .filter(Boolean)
            .map(n => String(n).trim().toLowerCase())
    );

    const matchedEntries = [];
    const sortedDates = Object.keys(atvLogs || {}).sort();
    sortedDates.forEach(dateKey => {
        const list = atvLogs[dateKey];
        if (!Array.isArray(list)) return;
        list.forEach(item => {
            if (!item || !item.exerciseName) return;
            const w = parseFloat(item.weight) || 0;
            if (w <= 0) return;
            if (namesSet.has(String(item.exerciseName).trim().toLowerCase())) {
                matchedEntries.push(item);
            }
        });
    });

    const recentEntries = matchedEntries.slice(-12);
    if (recentEntries.length > 0) {
        let weightedSum = 0;
        let totalFactor = 0;
        recentEntries.forEach(item => {
            const reps = parseRepsNumber(item.reps);
            const factor = reps > 2 ? 2.5 : 1.0;
            weightedSum += (parseFloat(item.weight) || 0) * factor;
            totalFactor += factor;
        });
        if (totalFactor > 0) {
            return parseFloat((weightedSum / totalFactor).toFixed(2));
        }
    }

    if (fallbackLoad !== undefined && fallbackLoad !== null && !isNaN(fallbackLoad) && Number(fallbackLoad) > 0) {
        return parseFloat(Number(fallbackLoad).toFixed(2));
    }
    return null;
}

/* Verifica quantos cards do treino ativo foram concluídos na data selecionada */
function getWorkoutDayCompletionStatus(workout, dateIso) {
    if (!workout || !Array.isArray(workout.exercises) || workout.exercises.length === 0) {
        return { completedCards: 0, totalCards: 0, is100Percent: false };
    }
    const strengthExercises = workout.exercises.filter(ex => !isCardioExercise(ex.name, ex.muscle));
    const dayLogs = atvLogs[dateIso] || [];
    let completedCards = 0;
    strengthExercises.forEach(ex => {
        const isDone = dayLogs.some(l => {
            if (!l) return false;
            if (l.exerciseName === ex.name || (Array.isArray(ex.variations) && ex.variations.includes(l.exerciseName))) {
                return true;
            }
            return false;
        });
        if (isDone) completedCards++;
    });
    const totalCards = strengthExercises.length;
    return {
        completedCards,
        totalCards,
        is100Percent: totalCards > 0 && completedCards >= totalCards
    };
}

function buildCompletionBallHTML(workout, dateIso) {
    const status = getWorkoutDayCompletionStatus(workout, dateIso);
    if (status.is100Percent) {
        return `
            <div class="w-16 h-16 rounded-full bg-emerald-500 text-white shadow-lg border-4 border-emerald-200 flex flex-col items-center justify-center text-center leading-tight shrink-0 animate-green-ball" title="Todos os exercícios do treino foram registrados hoje!">
                <span class="text-xs font-extrabold font-mono">100%</span>
                <span class="text-[9px] uppercase font-bold tracking-tight">Completo</span>
            </div>
        `;
    }
    const pct = status.totalCards > 0 ? Math.round((status.completedCards / status.totalCards) * 100) : 0;
    return `
        <div class="w-14 h-14 rounded-full bg-zinc-100 border-2 border-zinc-200 text-zinc-700 flex flex-col items-center justify-center text-center leading-tight shrink-0" title="${status.completedCards} de ${status.totalCards} exercícios registrados nesta data">
            <span class="text-xs font-bold font-mono">${status.completedCards}/${status.totalCards}</span>
            <span class="text-[9px] text-zinc-400 font-mono">${pct}%</span>
        </div>
    `;
}

function trigger100PercentCelebrationBall() {
    let existing = document.getElementById('atv-100pct-toast-ball');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'atv-100pct-toast-ball';
    overlay.className = 'fixed inset-0 pointer-events-none flex items-center justify-center z-50';
    overlay.innerHTML = `
        <div class="w-36 h-36 rounded-full bg-emerald-500 text-white shadow-2xl border-8 border-emerald-200 flex flex-col items-center justify-center text-center p-4 animate-green-ball">
            <span class="text-2xl font-extrabold font-mono leading-none">100%</span>
            <span class="text-xs font-extrabold uppercase tracking-wider mt-1">Completo!</span>
            <span class="text-[10px] opacity-90 mt-0.5">Treino Concluído ✓</span>
        </div>
    `;
    document.body.appendChild(overlay);
    setTimeout(() => {
        if (overlay && overlay.parentNode) overlay.remove();
    }, 2600);
}

/* Semeia os hábitos do plano de treino uma única vez por dispositivo (apenas para usuário com identificação e Git Sync ativos) */
function ensureWorkoutPlanHabits() {
    loadWorkoutCatalogCustomizations();
    if (typeof window.isRegisteredSyncUser === 'function' && !window.isRegisteredSyncUser()) return;
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
    // Semeia a atividade aeróbica independente 'Cardio Zona 2' para permitir agendamento em qualquer dia (inclusive junto com Upper/Lower)
    if (!seeded.includes(CARDIO_Z2_PLAN_ID)) {
        const cardioExists = habits.some(h => h.planId === CARDIO_Z2_PLAN_ID || h.id === CARDIO_Z2_HABIT_ID || h.name === CARDIO_Z2_NAME);
        if (!cardioExists) {
            habits.push({
                id: CARDIO_Z2_HABIT_ID,
                planId: CARDIO_Z2_PLAN_ID,
                name: CARDIO_Z2_NAME,
                category: 'atv_fisica',
                targetHours: 2.5,
                checks: [false, false, false, false, false, false, false],
                dailyHours: [0, 0, 0, 0, 0, 0, 0],
                exercises: [{ ...DEFAULT_CARDIO_Z2_EXERCISE, variations: [...DEFAULT_CARDIO_Z2_EXERCISE.variations] }]
            });
            changed = true;
        }
        seeded.push(CARDIO_Z2_PLAN_ID);
    }
    SafeStorage.setItem(PLAN_SEED_KEY, JSON.stringify(seeded));
    if (changed) saveData();
}

function loadAtvLogs() {
    loadAtvUiState();
    const raw = SafeStorage.getItem('hq_atv_logs_v1');
    if (raw) {
        try { atvLogs = JSON.parse(raw) || {}; } catch (e) { atvLogs = {}; }
    } else {
        atvLogs = {};
    }
    let migrated = false;
    const validPlans = ['upper_a', 'lower_a', 'upper_b', 'lower_b', 'cardio_z2', 'custom'];
    Object.keys(atvLogs).forEach(dateKey => {
        const list = atvLogs[dateKey];
        if (!Array.isArray(list)) return;
        list.forEach(item => {
            if (!item) return;
            const isCardio = item.unit === 'km/h' || isCardioExercise(item.exerciseName, item.muscle);
            if (isCardio) {
                if (item.planId !== CARDIO_Z2_PLAN_ID) {
                    item.planId = CARDIO_Z2_PLAN_ID;
                    migrated = true;
                }
                if (item.habitId !== CARDIO_Z2_HABIT_ID) {
                    item.habitId = CARDIO_Z2_HABIT_ID;
                    migrated = true;
                }
                if (item.exerciseName && item.exerciseName.startsWith('Cardio Zona 2 (')) {
                    const cpIdx = item.exerciseName.indexOf(')'); item.exerciseName = cpIdx !== -1 ? (CARDIO_Z2_NAME + item.exerciseName.slice(cpIdx + 1)) : CARDIO_Z2_NAME;
                    migrated = true;
                }
                if (item.cardExerciseName && item.cardExerciseName.startsWith('Cardio Zona 2 (')) {
                    item.cardExerciseName = CARDIO_Z2_NAME;
                    migrated = true;
                }
                return;
            }
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
    SafeStorage.setItem('hq_last_mutation_at', String(Date.now()));
    SafeStorage.setItem('hq_atv_logs_v1', JSON.stringify(atvLogs));
}

/* Persistência dos inputs dos cards e scroll do carrossel */
window.onAtvCarouselScroll = function(trackEl) {
    if (!trackEl) return;
    atvUiState.carouselScrollLeft = trackEl.scrollLeft;
    saveAtvUiState();
};

window.onAtvCardFieldChange = function(cardIndex, exerciseChanged = false) {
    const key = `${selectedAtvDate}_${selectedWorkoutPlanId}_${cardIndex}`;
    const exEl = document.getElementById(`atv-card-ex-${cardIndex}`);
    const weightEl = document.getElementById(`atv-card-weight-${cardIndex}`);
    const notesEl = document.getElementById(`atv-card-notes-${cardIndex}`);

    const workout = WORKOUT_PLAN.find(w => w.planId === selectedWorkoutPlanId) || WORKOUT_PLAN[0];
    const ex = workout && workout.exercises ? workout.exercises[cardIndex] : null;
    const chosenName = exEl ? exEl.value : (ex ? ex.name : '');

    if (ex) {
        const isCardio = isCardioExercise(chosenName, ex.muscle);
        const unitShort = isCardio ? 'km/h' : 'kg';
        const refVal = calcWeightedExerciseRefLoad([chosenName, ex.name], ex.load);
        const refFormatted = refVal !== null ? formatWeightNumber(refVal) : '';

        if (exerciseChanged) {
            // A ref da carga fica oculta no dropdown e aparece só no título (e badge) quando selecionado
            const titleEl = document.getElementById(`atv-card-title-${cardIndex}`);
            if (titleEl) {
                const baseCardTitle = isCardio
                    ? (chosenName === CARDIO_Z2_NAME ? CARDIO_Z2_NAME : `${CARDIO_Z2_NAME} - ${chosenName}`)
                    : `${workout.name} - ${chosenName}`;
                titleEl.textContent = `${baseCardTitle}${refFormatted ? ` (ref. ${refFormatted} ${unitShort})` : ''}`;
                titleEl.title = titleEl.textContent;
            }
            const refBadgeEl = document.getElementById(`atv-card-ref-badge-${cardIndex}`);
            if (refBadgeEl) {
                if (isCardio) {
                    refBadgeEl.textContent = refFormatted ? `🏃 ref: ${refFormatted} km/h` : '🏃 km/h';
                    refBadgeEl.classList.remove('hidden');
                } else if (refFormatted) {
                    refBadgeEl.textContent = `ref: ${refFormatted} ${unitShort}`;
                    refBadgeEl.classList.remove('hidden');
                } else {
                    refBadgeEl.classList.add('hidden');
                }
            }
            const weightLabelEl = document.getElementById(`atv-card-weight-label-${cardIndex}`);
            if (weightLabelEl) {
                weightLabelEl.textContent = isCardio ? 'Velocidade (km/h)' : 'Carga (kg)';
            }
        }
    }

    atvUiState.cardInputs[key] = {
        exercise: chosenName,
        weight: weightEl ? weightEl.value : '',
        notes: notesEl ? notesEl.value : ''
    };
    saveAtvUiState();
};

window.setAtvCustomRole = function(role) {
    atvUiState.customInputs.role = role === 'main' ? 'main' : 'variation';
    const btnMain = document.getElementById('btn-custom-role-main');
    const btnVar = document.getElementById('btn-custom-role-variation');
    if (btnMain && btnVar) {
        btnMain.className = atvUiState.customInputs.role === 'main'
            ? "flex-1 py-2 px-2 rounded-xl bg-black text-white text-[11px] font-bold transition shadow-xs"
            : "flex-1 py-2 px-2 rounded-xl bg-white border border-zinc-200 text-zinc-600 hover:text-black text-[11px] font-semibold transition";
        btnVar.className = atvUiState.customInputs.role === 'variation'
            ? "flex-1 py-2 px-2 rounded-xl bg-black text-white text-[11px] font-bold transition shadow-xs"
            : "flex-1 py-2 px-2 rounded-xl bg-white border border-zinc-200 text-zinc-600 hover:text-black text-[11px] font-semibold transition";
    }
    const roleHint = document.getElementById('atv-custom-role-hint');
    if (roleHint) {
        roleHint.textContent = atvUiState.customInputs.role === 'main'
            ? '⭐ Será o novo exercício principal do card; o antigo principal virará substituto/variação.'
            : '🔄 Será adicionado como substituto/variação na lista do card do grupo muscular.';
    }
    saveAtvUiState();
};

function isSelectedCustomSlotCardio(slotVal) {
    if (slotVal === 'cardio') return true;
    const workout = WORKOUT_PLAN.find(w => w.planId === selectedWorkoutPlanId) || WORKOUT_PLAN[0];
    if (!workout || !Array.isArray(workout.exercises)) return false;
    const idx = parseInt(slotVal, 10);
    const targetCard = (!isNaN(idx) && workout.exercises[idx]) ? workout.exercises[idx] : null;
    if (!targetCard) return false;
    return isCardioExercise(targetCard.name, targetCard.muscle);
}

window.onAtvCustomFieldChange = function(slotChanged = false) {
    const slotVal = document.getElementById('atv-custom-muscle-slot')?.value || '0';
    atvUiState.customInputs = {
        ...atvUiState.customInputs,
        name: document.getElementById('atv-custom-name')?.value || '',
        slotIndex: slotVal,
        sets: document.getElementById('atv-custom-sets')?.value || '',
        reps: document.getElementById('atv-custom-reps')?.value || '',
        rest: document.getElementById('atv-custom-rest')?.value || '',
        duration: document.getElementById('atv-custom-duration')?.value || ''
    };

    if (slotChanged) {
        const isCardioSlot = isSelectedCustomSlotCardio(slotVal);
        const strengthFields = document.getElementById('atv-custom-strength-fields');
        const cardioFields = document.getElementById('atv-custom-cardio-fields');
        const nameInput = document.getElementById('atv-custom-name');
        if (strengthFields && cardioFields) {
            if (isCardioSlot) {
                strengthFields.classList.add('hidden');
                cardioFields.classList.remove('hidden');
            } else {
                strengthFields.classList.remove('hidden');
                cardioFields.classList.add('hidden');
            }
        }
        if (nameInput) {
            nameInput.placeholder = isCardioSlot ? 'Ex: Corrida na Esteira / Caminhada' : 'Ex: Supino Reto Barra';
        }
    }

    saveAtvUiState();
};

/* Alternar entre Força e Aeróbico dentro de Atividade Física */
window.setAtvSubMode = function(mode) {
    atvSubMode = mode === 'aerobic' ? 'aerobic' : 'strength';
    saveAtvUiState();
    renderAtvFisicaInteractiveView();
};

/* Ocultar / Mostrar últimos treinos no Histórico */
window.toggleAtvHidePreviousWorkouts = function() {
    atvUiState.hidePreviousWorkouts = !atvUiState.hidePreviousWorkouts;
    saveAtvUiState();
    const historyContainer = document.getElementById('atv-history-section');
    if (historyContainer) {
        historyContainer.innerHTML = buildAtvHistorySectionInnerHTML();
    }
};

/* Navegação e seleção de data */
window.setAtvDate = function(dateStr) {
    selectedAtvDate = dateStr;
    saveAtvUiState();
    renderAtvFisicaInteractiveView();
};

window.setTodayAtvDate = function() {
    selectedAtvDate = getLocalISODate();
    saveAtvUiState();
    renderAtvFisicaInteractiveView();
};

window.setYesterdayAtvDate = function() {
    selectedAtvDate = getYesterdayISODate();
    saveAtvUiState();
    renderAtvFisicaInteractiveView();
};

/* Seleção do treino no topo */
window.selectAtvWorkoutPlan = function(planId) {
    selectedWorkoutPlanId = planId;
    atvUiState.carouselScrollLeft = 0;
    atvUiState.customInputs.slotIndex = '0';
    saveAtvUiState();
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

window.scrollAtvCarouselToEdge = function(edge) {
    const track = document.getElementById('atv-carousel-track');
    if (!track) return;
    const targetLeft = edge === 'start' ? 0 : track.scrollWidth;
    track.scrollTo({ left: targetLeft, behavior: 'smooth' });
    atvUiState.carouselScrollLeft = targetLeft;
    saveAtvUiState();
};

/* Localiza linha de registro cardiovascular já existente na data para unificar km/h + tempo do timer */
function findExistingCardioLogForDate(dateIso) {
    const list = atvLogs[dateIso];
    if (!Array.isArray(list)) return null;
    for (let i = list.length - 1; i >= 0; i--) {
        const item = list[i];
        if (item && (item.unit === 'km/h' || isCardioExercise(item.exerciseName, item.muscle))) {
            return item;
        }
    }
    return null;
}

function formatTimerCountedDuration(durationMin, elapsedSeconds) {
    const cleanMin = Math.max(1, Math.round(parseFloat(durationMin) || 0));
    if (elapsedSeconds && elapsedSeconds > 0 && typeof formatHMS === 'function') {
        return `${cleanMin} min (${formatHMS(elapsedSeconds)})`;
    }
    return `${cleanMin} min`;
}

function buildCardioNotesString(speedKmh, durationMin, timerDurationStr, userNotes) {
    const parts = [];
    if (timerDurationStr) {
        parts.push(`⏱️ Timer: ${timerDurationStr}`);
    }
    const cleanSpeed = parseFloat(speedKmh) || 0;
    const cleanMin = parseFloat(durationMin) || 0;
    if (cleanSpeed > 0 && cleanMin > 0) {
        const distKm = (cleanSpeed * cleanMin) / 60;
        if (distKm > 0) {
            parts.push(`Distância: ${distKm.toFixed(2).replace('.', ',')} km`);
        }
    }
    if (userNotes) {
        // Evita duplicar notas idênticas de Timer/Distância
        const cleanUser = String(userNotes)
            .split('•')
            .map(s => s.trim())
            .filter(s => s && !s.startsWith('⏱️ Timer:') && !s.startsWith('Distância:'))
            .join(' • ');
        if (cleanUser) parts.push(cleanUser);
    }
    return parts.join(' • ');
}

/* Atualiza apenas o histórico e os badges dos cards sem recriar o carrossel */
function refreshAtvHistoryAndCardBadges() {
    const historyContainer = document.getElementById('atv-history-section');
    if (historyContainer) {
        historyContainer.innerHTML = buildAtvHistorySectionInnerHTML();
    }

    const workout = WORKOUT_PLAN.find(w => w.planId === selectedWorkoutPlanId) || WORKOUT_PLAN[0];
    const currentLogs = atvLogs[selectedAtvDate] || [];

    const ballContainer = document.getElementById('atv-completion-ball-container');
    if (ballContainer && workout) {
        ballContainer.innerHTML = buildCompletionBallHTML(workout, selectedAtvDate);
    }

    if (workout && Array.isArray(workout.exercises)) {
        workout.exercises.forEach((ex, idx) => {
            const isCardio = isCardioExercise(ex.name, ex.muscle);
            const dayLoggedCount = currentLogs.filter(l => {
                if (!l) return false;
                if (l.exerciseName === ex.name || (ex.variations && ex.variations.includes(l.exerciseName))) return true;
                if (isCardio && (l.unit === 'km/h' || isCardioExercise(l.exerciseName, l.muscle))) return true;
                return false;
            }).length;

            const badgeContainer = document.getElementById(`atv-card-logged-badge-${idx}`);
            if (badgeContainer) {
                badgeContainer.innerHTML = dayLoggedCount > 0
                    ? `<div class="text-[10px] text-center font-mono text-emerald-600 font-semibold">✓ ${dayLoggedCount} registro(s) nesta data</div>`
                    : '';
            }
            const exSelect = document.getElementById(`atv-card-ex-${idx}`);
            const chosenName = exSelect ? exSelect.value : ex.name;
            const chosenIsCardio = isCardioExercise(chosenName, ex.muscle);
            const unitShort = chosenIsCardio ? 'km/h' : 'kg';
            const refVal = calcWeightedExerciseRefLoad([chosenName, ex.name, ...(ex.variations || [])], ex.load);
            const refFormatted = refVal !== null ? formatWeightNumber(refVal) : '';
            const titleEl = document.getElementById(`atv-card-title-${idx}`);
            if (titleEl) {
                const baseCardTitle = chosenIsCardio
                    ? (chosenName === CARDIO_Z2_NAME ? CARDIO_Z2_NAME : `${CARDIO_Z2_NAME} - ${chosenName}`)
                    : `${workout.name} - ${chosenName}`;
                titleEl.textContent = `${baseCardTitle}${refFormatted ? ` (ref. ${refFormatted} ${unitShort})` : ''}`;
            }
            const refBadgeEl = document.getElementById(`atv-card-ref-badge-${idx}`);
            if (refBadgeEl) {
                if (chosenIsCardio) {
                    refBadgeEl.textContent = refFormatted ? `🏃 ref: ${refFormatted} km/h` : '🏃 km/h';
                    refBadgeEl.classList.remove('hidden');
                } else if (refFormatted) {
                    refBadgeEl.textContent = `ref: ${refFormatted} ${unitShort}`;
                    refBadgeEl.classList.remove('hidden');
                } else {
                    refBadgeEl.classList.add('hidden');
                }
            }
        });
    }

    if (typeof renderDashboardView === 'function') renderDashboardView();
    if (typeof populateDashLoadChartSelect === 'function') populateDashLoadChartSelect();
}

/* Registro rápido direto do card no carrossel */
window.submitAtvCardLog = function(cardIndex) {
    const workout = WORKOUT_PLAN.find(w => w.planId === selectedWorkoutPlanId) || WORKOUT_PLAN[0];
    const ex = workout.exercises[cardIndex];
    if (!ex) return;

    const was100Before = getWorkoutDayCompletionStatus(workout, selectedAtvDate).is100Percent;

    const exSelect = document.getElementById(`atv-card-ex-${cardIndex}`);
    const chosenName = exSelect ? exSelect.value.trim() : ex.name;

    const weightInput = document.getElementById(`atv-card-weight-${cardIndex}`);
    const weightVal = weightInput ? getWeightNumericValue(weightInput.value) : 0;

    const notesInput = document.getElementById(`atv-card-notes-${cardIndex}`);
    const notesVal = notesInput ? notesInput.value.trim() : '';

    const isCardio = isCardioExercise(chosenName, ex.muscle);
    const habit = habits.find(h => h.planId === selectedWorkoutPlanId || h.name === workout.name);

    if (!atvLogs[selectedAtvDate]) atvLogs[selectedAtvDate] = [];

    if (isCardio) {
        // Verifica se há tempo ativo no cronômetro aeróbico ou principal para já incorporar caso ainda não registrado
        let activeTimerMs = getActiveOrConcludedAeroDurationMs(aeroSelectedModality);
        if (activeTimerMs <= 0 && typeof window.getActiveStopwatchElapsedMs === 'function') {
            activeTimerMs = window.getActiveStopwatchElapsedMs();
        }
        const activeTimerSec = Math.floor(activeTimerMs / 1000);
        const activeTimerMin = activeTimerSec >= 30 ? Math.max(1, Math.round(activeTimerSec / 60)) : 0;

        const existingCardio = findExistingCardioLogForDate(selectedAtvDate);
        if (existingCardio) {
            // Unifica na mesma linha do histórico com o registro vindo do Timer (sempre associado a Cardio Zona 2, independente de Upper/Lower)
            existingCardio.habitId = CARDIO_Z2_HABIT_ID;
            existingCardio.planId = CARDIO_Z2_PLAN_ID;
            existingCardio.muscle = ex.muscle || 'Sistema Cardiovascular / Resistência';
            existingCardio.cardExerciseName = CARDIO_Z2_NAME;
            existingCardio.fromCardioCard = true;
            existingCardio.unit = 'km/h';
            existingCardio.sets = 1;

            if (existingCardio.timerModality && !chosenName.toLowerCase().includes(existingCardio.timerModality.toLowerCase())) {
                existingCardio.exerciseName = chosenName === CARDIO_Z2_NAME
                    ? `${CARDIO_Z2_NAME} • ${existingCardio.timerModality}`
                    : `${chosenName} • ${existingCardio.timerModality}`;
            } else {
                existingCardio.exerciseName = chosenName;
            }

            if (weightVal > 0) {
                existingCardio.weight = parseFloat(weightVal.toFixed(2));
            }
            if (!existingCardio.timerDuration && activeTimerMin > 0) {
                existingCardio.durationMin = activeTimerMin;
                existingCardio.timerDuration = formatTimerCountedDuration(activeTimerMin, activeTimerSec);
            }
            existingCardio.reps = existingCardio.timerDuration || existingCardio.reps || ex.reps || '20 min';
            existingCardio.notes = buildCardioNotesString(
                existingCardio.weight,
                existingCardio.durationMin || parseRepsNumber(existingCardio.reps),
                existingCardio.timerDuration,
                notesVal || existingCardio.notes
            );
        } else {
            const timerDurStr = activeTimerMin > 0 ? formatTimerCountedDuration(activeTimerMin, activeTimerSec) : '';
            const repDuration = timerDurStr || ex.reps || '20 min';
            const durMin = activeTimerMin > 0 ? activeTimerMin : parseRepsNumber(repDuration);
            atvLogs[selectedAtvDate].push({
                id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
                habitId: CARDIO_Z2_HABIT_ID,
                planId: CARDIO_Z2_PLAN_ID,
                exerciseName: chosenName,
                cardExerciseName: CARDIO_Z2_NAME,
                fromCardioCard: true,
                muscle: ex.muscle || 'Sistema Cardiovascular / Resistência',
                sets: 1,
                reps: repDuration,
                timerDuration: timerDurStr || '',
                durationMin: durMin,
                rest: '-',
                weight: parseFloat(weightVal.toFixed(2)),
                unit: 'km/h',
                notes: buildCardioNotesString(weightVal, durMin, timerDurStr, notesVal)
            });
        }
    } else {
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
            unit: 'kg',
            notes: notesVal
        });
    }

    if (weightInput) weightInput.value = '';
    if (notesInput) notesInput.value = '';

    const track = document.getElementById('atv-carousel-track');
    if (track) atvUiState.carouselScrollLeft = track.scrollLeft;
    window.onAtvCardFieldChange(cardIndex, false);

    saveAtvLogs();
    saveData(false, true);
    refreshAtvHistoryAndCardBadges();

    const is100Now = getWorkoutDayCompletionStatus(workout, selectedAtvDate).is100Percent;
    if (!was100Before && is100Now) {
        trigger100PercentCelebrationBall();
    }
};

/* Sincroniza exercícios já registrados no histórico quando o sistema do card é atualizado */
function syncRegisteredLogsWithCardUpdate(targetCard, oldMainName) {
    if (!targetCard) return;
    const isCardio = isCardioExercise(targetCard.name, targetCard.muscle);
    const validNames = new Set(
        [targetCard.name, oldMainName, ...(targetCard.variations || [])]
            .filter(Boolean)
            .map(n => String(n).trim().toLowerCase())
    );

    Object.keys(atvLogs || {}).forEach(dateKey => {
        const list = atvLogs[dateKey];
        if (!Array.isArray(list)) return;
        list.forEach(log => {
            if (!log || !log.exerciseName) return;
            const logNameLower = String(log.exerciseName).trim().toLowerCase();
            if (validNames.has(logNameLower) || (isCardio && (log.unit === 'km/h' || isCardioExercise(log.exerciseName, log.muscle)))) {
                log.muscle = targetCard.muscle;
                log.unit = isCardio ? 'km/h' : 'kg';
                if (isCardio) {
                    log.sets = 1;
                    log.rest = '-';
                    if (!log.timerDuration) {
                        log.reps = targetCard.reps || '20 min';
                    }
                } else {
                    log.sets = targetCard.sets || log.sets || 3;
                    log.reps = targetCard.reps || log.reps || '8-12';
                    log.rest = targetCard.rest || log.rest || '90-120s';
                }
            }
        });
    });
}

/* ------------------------------------------------------------------
 * Cadastro de Exercício no Card do Grupo Muscular (Principal ou Substituto/Variação)
 * ------------------------------------------------------------------ */
window.submitCustomAtvLog = function(event) {
    if (event) event.preventDefault();
    const nameEl = document.getElementById('atv-custom-name');
    const exName = nameEl ? nameEl.value.trim() : '';
    if (!exName) return;

    const slotEl = document.getElementById('atv-custom-muscle-slot');
    const slotRaw = slotEl ? slotEl.value : '0';

    const workout = WORKOUT_PLAN.find(w => w.planId === selectedWorkoutPlanId) || WORKOUT_PLAN[0];
    if (!workout || !Array.isArray(workout.exercises)) return;

    let validSlotIdx = 0;
    if (slotRaw === 'cardio') {
        let existingCardioIdx = workout.exercises.findIndex(e => isCardioExercise(e.name, e.muscle));
        if (existingCardioIdx === -1) {
            workout.exercises.push({
                name: exName,
                muscle: 'Sistema Cardiovascular / Resistência',
                variations: [],
                sets: 1,
                reps: '20 min',
                rest: '-'
            });
            existingCardioIdx = workout.exercises.length - 1;
        }
        validSlotIdx = existingCardioIdx;
    } else {
        const parsedIdx = parseInt(slotRaw, 10);
        validSlotIdx = (!isNaN(parsedIdx) && parsedIdx >= 0 && parsedIdx < workout.exercises.length) ? parsedIdx : 0;
    }

    const targetCard = workout.exercises[validSlotIdx];
    if (!targetCard) return;

    const isCardioSlot = isCardioExercise(targetCard.name, targetCard.muscle);
    const durationEl = document.getElementById('atv-custom-duration');
    const durationVal = durationEl ? durationEl.value.trim() : '';

    const setsEl = document.getElementById('atv-custom-sets');
    const setsRaw = setsEl ? setsEl.value.trim() : '';
    const sets = isCardioSlot ? 1 : (parseInt(setsRaw, 10) || targetCard.sets || 3);

    const repsEl = document.getElementById('atv-custom-reps');
    const repsRaw = repsEl ? repsEl.value.trim() : '';
    const reps = isCardioSlot
        ? (durationVal || targetCard.reps || '20 min')
        : (repsRaw || targetCard.reps || '8-12');

    const restEl = document.getElementById('atv-custom-rest');
    const restRaw = restEl ? restEl.value.trim() : '';
    const rest = isCardioSlot ? '-' : (restRaw || targetCard.rest || '90-120s');

    const role = atvUiState.customInputs.role === 'main' ? 'main' : 'variation';

    if (!Array.isArray(targetCard.variations)) targetCard.variations = [];
    const oldMain = targetCard.name;

    if (role === 'main') {
        // Remove o novo nome das variações caso já existisse lá
        targetCard.variations = targetCard.variations.filter(v => v.toLowerCase() !== exName.toLowerCase());
        // O antigo principal se torna substituto/variação no topo da lista
        if (oldMain && oldMain.toLowerCase() !== exName.toLowerCase()) {
            targetCard.variations = [oldMain, ...targetCard.variations.filter(v => v.toLowerCase() !== oldMain.toLowerCase())];
        }
        targetCard.name = exName;
        targetCard.sets = sets;
        targetCard.reps = reps;
        targetCard.rest = rest;
    } else {
        // Substituto / Variação: adiciona na lista de variações do card daquele grupo muscular
        const existsAsMain = targetCard.name.toLowerCase() === exName.toLowerCase();
        const existsAsVar = targetCard.variations.some(v => v.toLowerCase() === exName.toLowerCase());
        if (!existsAsMain && !existsAsVar) {
            targetCard.variations.push(exName);
        }
        targetCard.sets = sets;
        targetCard.reps = reps;
        targetCard.rest = rest;
    }

    // Atualiza também registros existentes para refletirem as atualizações do card
    syncRegisteredLogsWithCardUpdate(targetCard, oldMain);

    // Seleciona automaticamente o exercício recém-cadastrado no card daquele grupo muscular
    const cardStateKey = `${selectedAtvDate}_${workout.planId}_${validSlotIdx}`;
    atvUiState.cardInputs[cardStateKey] = {
        ...(atvUiState.cardInputs[cardStateKey] || {}),
        exercise: exName
    };

    // Mantém todos os campos do card de registro vazios para novo preenchimento
    atvUiState.customInputs = {
        ...atvUiState.customInputs,
        name: '',
        sets: '',
        reps: '',
        rest: '',
        duration: ''
    };

    saveWorkoutCatalogCustomizations();
    saveAtvLogs();
    saveAtvUiState();
    saveData(false, true);
    renderAtvFisicaInteractiveView();

    // Desliza o carrossel suavemente até o card do grupo muscular onde o exercício foi cadastrado
    setTimeout(() => {
        const track = document.getElementById('atv-carousel-track');
        if (track && track.children[validSlotIdx]) {
            const cardEl = track.children[validSlotIdx];
            track.scrollTo({ left: Math.max(0, cardEl.offsetLeft - 16), behavior: 'smooth' });
        }
    }, 60);
};

/* ------------------------------------------------------------------
 * CÁLCULO MATEMÁTICO DE VOLUME AERÓBICO (QUILOMETRAGEM ESTIMADA POR PACE E INTERVALO)
 * E CORREÇÃO FISIOLÓGICA/CINÉTICA PARA TREINO "MISTO (CAMINHADA + CORRIDA)"
 * ------------------------------------------------------------------ */

/* Converte velocidade v (km/h) para Pace em min/km no formato M'SS"/km */
function formatPaceMinPerKm(speedKmh) {
    const v = parseFloat(speedKmh) || 0;
    if (v <= 0) return '—';
    const paceMinFloat = 60 / v;
    const totalSec = Math.round(paceMinFloat * 60);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}'${String(secs).padStart(2, '0')}"/km`;
}

/* Extrai duração (única ou intervalo [min, max]) a partir de strings como:
 * "20 min (00:20:30)", "15-20 min", "20-30", "25 min" */
function parseCardioDurationInterval(durationStr, fallbackMin) {
    const raw = String(durationStr || '').trim();
    // 1. Verifica se há tempo exato do cronômetro no formato (HH:MM:SS)
    const hmsMatch = raw.match(/\((\d{2}):(\d{2}):(\d{2})\)/);
    if (hmsMatch) {
        const hh = parseInt(hmsMatch[1], 10) || 0;
        const mm = parseInt(hmsMatch[2], 10) || 0;
        const ss = parseInt(hmsMatch[3], 10) || 0;
        const exactMin = hh * 60 + mm + (ss / 60);
        if (exactMin > 0) {
            return { minMin: exactMin, maxMin: exactMin, avgMin: exactMin, isInterval: false };
        }
    }

    // 2. Verifica se é um intervalo (ex: "15-20 min" ou "20 a 30 min")
    const rangeMatch = raw.match(/(\d+(?:[.,]\d+)?)\s*(?:[-–]|a)\s*(\d+(?:[.,]\d+)?)/i);
    if (rangeMatch) {
        const t1 = parseFloat(rangeMatch[1].replace(',', '.')) || 0;
        const t2 = parseFloat(rangeMatch[2].replace(',', '.')) || 0;
        if (t1 > 0 && t2 > 0) {
            const minMin = Math.min(t1, t2);
            const maxMin = Math.max(t1, t2);
            const avgMin = (minMin + maxMin) / 2;
            return { minMin, maxMin, avgMin, isInterval: Math.abs(maxMin - minMin) > 0.01 };
        }
    }

    // 3. Valor único em minutos
    const singleMatch = raw.match(/(\d+(?:[.,]\d+)?)/);
    if (singleMatch) {
        const val = parseFloat(singleMatch[1].replace(',', '.')) || 0;
        if (val > 0) {
            return { minMin: val, maxMin: val, avgMin: val, isInterval: false };
        }
    }

    const fb = parseFloat(fallbackMin) > 0 ? parseFloat(fallbackMin) : 20;
    return { minMin: fb, maxMin: fb, avgMin: fb, isInterval: false };
}

/* Modelo Matemático para Treino "Misto (Caminhada + Corrida)" (Método Intervalado Galloway):
 * v_efetiva = eta_transicao * [ alpha * v_corrida + (1 - alpha) * v_caminhada ]
 * Onde:
 * - alpha (runRatio): fração do tempo em corrida (ex: 0.60 = 60% corrida / 40% caminhada)
 * - v_corrida: velocidade de corrida (km/h)
 * - v_caminhada: velocidade de caminhada (km/h, padrão 55% de v_corrida se não informada)
 * - eta_transicao = 0.96: fator de correção de transição cinética (-4% pelas acelerações/desacelerações entre blocos)
 */
const MIXED_TRANSITION_FACTOR = 0.96;

function calcMixedCardioEffectiveSpeed(runSpeedKmh, walkSpeedKmh, runRatio) {
    const vRun = parseFloat(runSpeedKmh) || 0;
    if (vRun <= 0) return 0;
    const vWalk = (parseFloat(walkSpeedKmh) || 0) > 0 ? parseFloat(walkSpeedKmh) : (vRun * 0.55);
    const alpha = (parseFloat(runRatio) > 0 && parseFloat(runRatio) < 1) ? parseFloat(runRatio) : 0.60;
    const weightedSpeed = (alpha * vRun) + ((1 - alpha) * vWalk);
    return parseFloat((MIXED_TRANSITION_FACTOR * weightedSpeed).toFixed(2));
}

/* Calcula o Volume (Quilometragem estimada em km) e o Pace para qualquer registro cardiovascular */
function calcCardioEntryVolumeKm(log) {
    if (!log) {
        return { avgKm: 0, minKm: 0, maxKm: 0, isInterval: false, effectiveSpeedKmh: 0, paceStr: '—', isMixed: false, volumeText: '0,00 km' };
    }
    const isMixed = Boolean(log.isMixed) || String(log.exerciseName || '').toLowerCase().includes('misto') || String(log.timerModality || '').toLowerCase().includes('misto');
    const rawSpeed = parseFloat(log.weight) || 0;

    let effectiveSpeedKmh = rawSpeed;
    if (isMixed && log.runSpeedKmh > 0) {
        effectiveSpeedKmh = calcMixedCardioEffectiveSpeed(log.runSpeedKmh, log.walkSpeedKmh, log.runRatio);
    } else if (isMixed && rawSpeed > 0 && !log.runSpeedKmh) {
        // Caso o usuário tenha lançado apenas uma velocidade no Misto sem separar corrida/caminhada:
        // aplica a correção ponderada padrão (60% na velocidade informada + 40% em caminhada a 55% da vel) * 0.96
        effectiveSpeedKmh = calcMixedCardioEffectiveSpeed(rawSpeed, rawSpeed * 0.55, log.runRatio || 0.60);
    }

    const durObj = parseCardioDurationInterval(log.timerDuration || log.reps, log.durationMin || 20);
    const minKm = effectiveSpeedKmh > 0 ? (effectiveSpeedKmh * durObj.minMin) / 60 : 0;
    const maxKm = effectiveSpeedKmh > 0 ? (effectiveSpeedKmh * durObj.maxMin) / 60 : 0;
    const avgKm = effectiveSpeedKmh > 0 ? (effectiveSpeedKmh * durObj.avgMin) / 60 : 0;
    const paceStr = formatPaceMinPerKm(effectiveSpeedKmh);

    let volumeText = '0,00 km';
    if (avgKm > 0) {
        const avgFmt = avgKm.toFixed(2).replace('.', ',');
        if (durObj.isInterval) {
            const minFmt = minKm.toFixed(2).replace('.', ',');
            const maxFmt = maxKm.toFixed(2).replace('.', ',');
            volumeText = `${minFmt}–${maxFmt} km (${avgFmt} km)`;
        } else {
            volumeText = `${avgFmt} km`;
        }
    }

    return {
        avgKm,
        minKm,
        maxKm,
        isInterval: durObj.isInterval,
        effectiveSpeedKmh,
        paceStr,
        isMixed,
        volumeText
    };
}

/* ------------------------------------------------------------------
 * ABA AERÓBICO (CORRIDA, CAMINHADA, MISTO, BIKE, ESTEIRA) + CRONÔMETRO INTEGRADO
 * ------------------------------------------------------------------ */
function getAeroModalityInputs(mod) {
    const key = mod || aeroSelectedModality || 'Corrida';
    if (!atvUiState.aerobicInputsByModality || typeof atvUiState.aerobicInputsByModality !== 'object') {
        atvUiState.aerobicInputsByModality = {};
    }
    if (!atvUiState.aerobicInputsByModality[key]) {
        atvUiState.aerobicInputsByModality[key] = {
            speedKmh: '',
            walkSpeedKmh: '',
            mixRunRatio: '0.60',
            manualMin: '',
            notes: ''
        };
    }
    return atvUiState.aerobicInputsByModality[key];
}

function formatAeroConcludedDurationString(totalSeconds) {
    const cleanSec = Math.max(1, Math.round(totalSeconds));
    const hms = (typeof formatHMS === 'function') ? formatHMS(cleanSec) : '00:00:00';
    if (cleanSec >= 60) {
        const minsRounded = Math.round((cleanSec / 60) * 10) / 10;
        const minsStr = String(minsRounded).replace('.', ',');
        return `${minsStr} min (${hms})`;
    }
    const minsDec = (cleanSec / 60).toFixed(2).replace('.', ',');
    return `${minsDec} min (${hms})`;
}

function triggerAeroCountdownFinishedAlerts(mod) {
    if (typeof window.playTimerAlarmSound === 'function') {
        window.playTimerAlarmSound();
    }
    if (navigator.vibrate) {
        try { navigator.vibrate([350, 150, 350, 150, 500]); } catch (e) {}
    }
    if (('Notification' in window) && Notification.permission === 'granted') {
        try {
            new Notification(`⏰ Tempo Concluído — ${mod}`, {
                body: `O temporizador regressivo de ${mod} chegou a 00:00:00! A duração foi enviada automaticamente.`,
                tag: 'haqt-aero-timer-done',
                renotify: true
            });
        } catch (e) {}
    }
}

window.selectAtvAerobicModality = function(mod) {
    aeroSelectedModality = mod || 'Corrida';
    getAeroModalityTimerState(aeroSelectedModality);
    getAeroModalityInputs(aeroSelectedModality);
    renderAtvFisicaInteractiveView();
    if (typeof window.syncAllExternalTimerDisplays === 'function') {
        window.syncAllExternalTimerDisplays(false);
    }
};

window.setAtvAerobicTimerType = function(type) {
    const st = getAeroModalityTimerState(aeroSelectedModality);
    const nextType = type === 'countdown' ? 'countdown' : 'stopwatch';
    if (st.timerType === nextType) return;
    if (st.running) {
        clearInterval(st.intervalId);
        st.running = false;
    }
    st.timerType = nextType;
    if (nextType === 'countdown' && st.cdRemainingMs <= 0) {
        st.cdRemainingMs = st.cdTotalSec * 1000;
    }
    renderAtvFisicaInteractiveView();
    if (typeof updateMiniTimerPill === 'function') updateMiniTimerPill();
};

window.setAtvAerobicCountdownPreset = function(minutes) {
    const st = getAeroModalityTimerState(aeroSelectedModality);
    if (st.running) {
        clearInterval(st.intervalId);
        st.running = false;
    }
    const totalSec = Math.max(60, Math.round((parseFloat(minutes) || 20) * 60));
    st.timerType = 'countdown';
    st.cdTotalSec = totalSec;
    st.cdRemainingMs = totalSec * 1000;
    st.concludedDurationStr = '';
    st.concludedElapsedSec = 0;
    renderAtvFisicaInteractiveView();
};

window.onAtvAerobicCountdownDirectInput = function(inputEl) {
    if (!inputEl) return;
    const st = getAeroModalityTimerState(aeroSelectedModality);
    if (st.running) return;
    const rawDigits = inputEl.value.replace(/\D/g, '').slice(-6);
    const padded = rawDigits.padStart(6, '0');
    const hh = parseInt(padded.slice(0, 2), 10) || 0;
    const mm = parseInt(padded.slice(2, 4), 10) || 0;
    const ss = parseInt(padded.slice(4, 6), 10) || 0;
    inputEl.value = `${padded.slice(0, 2)}:${padded.slice(2, 4)}:${padded.slice(4, 6)}`;
    try {
        inputEl.setSelectionRange(inputEl.value.length, inputEl.value.length);
    } catch (e) {}

    const totalSec = hh * 3600 + mm * 60 + ss;
    if (totalSec > 0) {
        st.cdTotalSec = Math.min(Math.max(1, totalSec), 43200);

        st.cdRemainingMs = st.cdTotalSec * 1000;
        st.concludedDurationStr = '';
        st.concludedElapsedSec = 0;
    }
};

window.onAtvAerobicCountdownDirectBlur = function(inputEl) {
    if (!inputEl) return;
    const st = getAeroModalityTimerState(aeroSelectedModality);
    inputEl.value = (typeof formatHMS === 'function') ? formatHMS(st.cdTotalSec) : '00:20:00';
};
const _unusedLegacyCdHandler = function(inputEl, totalSec = 0) { /*
    if (!inputEl) return;
    const st = getAeroModalityTimerState(aeroSelectedModality);
    if (st.running) return;



*/ }; const _noop = () => {







    }
    if (totalSec > 0) {

        st.cdRemainingMs = st.cdTotalSec * 1000;

    } else {

    }
};

window.toggleAtvAeroMixedPhase = function(targetPhase) {
    const st = getAeroModalityTimerState(aeroSelectedModality);
    const now = Date.now();
    if (st.running && st.lastStartTs > 0) {
        const delta = Math.max(0, now - st.lastStartTs);
        if (st.timerType === 'stopwatch') {
            st.elapsedMs += delta;
        }
        if (st.mixedPhase === 'walk') {
            st.walkElapsedMs += delta;
        } else {
            st.runElapsedMs += delta;
        }
        st.lastStartTs = now;
    }
    if (targetPhase === 'run' || targetPhase === 'walk') {
        st.mixedPhase = targetPhase;
    } else {
        st.mixedPhase = st.mixedPhase === 'run' ? 'walk' : 'run';
    }
    renderAtvFisicaInteractiveView();
};

window.onAtvAerobicInputChange = function() {
    const inp = getAeroModalityInputs(aeroSelectedModality);
    inp.speedKmh = document.getElementById('atv-aero-speed')?.value || '';
    inp.walkSpeedKmh = document.getElementById('atv-aero-walk-speed')?.value || '';
    inp.mixRunRatio = document.getElementById('atv-aero-mix-ratio')?.value || '0.60';
    inp.manualMin = document.getElementById('atv-aero-minutes')?.value || '';
    inp.notes = document.getElementById('atv-aero-notes')?.value || '';
    saveAtvUiState();
    updateAtvAerobicDistancePreview();
};

function updateAtvAerobicDistancePreview() {
    const distEl = document.getElementById('atv-aero-distance-preview');
    if (!distEl) return;
    const isMixed = aeroSelectedModality.toLowerCase().includes('misto');
    const speedVal = getWeightNumericValue(document.getElementById('atv-aero-speed')?.value || '');
    const walkSpeedVal = getWeightNumericValue(document.getElementById('atv-aero-walk-speed')?.value || '');
    const mixRatioVal = parseFloat(document.getElementById('atv-aero-mix-ratio')?.value || '0.60') || 0.60;
    const manualRaw = document.getElementById('atv-aero-minutes')?.value || '';

    const durObj = parseCardioDurationInterval(manualRaw, 0);
    const hasTime = String(manualRaw).trim().length > 0 && durObj.avgMin > 0;

    const effSpeed = isMixed
        ? calcMixedCardioEffectiveSpeed(speedVal, walkSpeedVal, mixRatioVal)
        : speedVal;

    if (effSpeed > 0 && hasTime) {
        const paceStr = formatPaceMinPerKm(effSpeed);
        const avgKm = (effSpeed * durObj.avgMin) / 60;
        if (durObj.isInterval) {
            const minKm = (effSpeed * durObj.minMin) / 60;
            const maxKm = (effSpeed * durObj.maxMin) / 60;
            distEl.textContent = `${minKm.toFixed(2).replace('.', ',')}–${maxKm.toFixed(2).replace('.', ',')} km • Pace ${paceStr}`;
        } else {
            distEl.textContent = `${avgKm.toFixed(2).replace('.', ',')} km (${isMixed ? `Vel. ef. ${effSpeed.toFixed(2).replace('.', ',')} km/h • ` : ''}Pace ${paceStr})`;
        }
    } else if (effSpeed > 0) {
        distEl.textContent = `Pace ${formatPaceMinPerKm(effSpeed)} • Conclua o timer ou informe o tempo`;
    } else if (hasTime) {
        distEl.textContent = `Duração: ${manualRaw} • Informe a velocidade (km/h)`;
    } else {
        distEl.textContent = 'Informe km/h + tempo (ou Conclua o Timer) p/ calcular km e pace';
    }
}

function updateAtvAerobicTimerDOM(mod) {
    const targetMod = mod || aeroSelectedModality;
    const st = getAeroModalityTimerState(targetMod);
    if (targetMod === aeroSelectedModality) {
        const mainEl = document.getElementById('atv-aero-timer-display');
        const msEl = document.getElementById('atv-aero-timer-ms');
        const displayMs = st.timerType === 'countdown' ? st.cdRemainingMs : st.elapsedMs;
        if (mainEl && typeof formatHMS === 'function') {
            if (mainEl.tagName === 'INPUT') {
                if (document.activeElement !== mainEl) {
                    mainEl.value = formatHMS(Math.ceil(displayMs / 1000));
                }
            } else {
                mainEl.textContent = formatHMS(Math.floor(displayMs / 1000));
            }
        }
        if (msEl && typeof formatCentiseconds === 'function') {
            msEl.textContent = formatCentiseconds(displayMs);
        }
        const runPhaseTimeEl = document.getElementById('atv-aero-mixed-run-time');
        const walkPhaseTimeEl = document.getElementById('atv-aero-mixed-walk-time');
        if (runPhaseTimeEl && typeof formatHMS === 'function') {
            runPhaseTimeEl.textContent = formatHMS(Math.floor(st.runElapsedMs / 1000)).slice(3);
        }
        if (walkPhaseTimeEl && typeof formatHMS === 'function') {
            walkPhaseTimeEl.textContent = formatHMS(Math.floor(st.walkElapsedMs / 1000)).slice(3);
        }
    }
    if (typeof updateMiniTimerPill === 'function') updateMiniTimerPill();
}

window.toggleAtvAerobicStopwatch = function() {
    const mod = aeroSelectedModality;
    const st = getAeroModalityTimerState(mod);
    const isMixed = mod.toLowerCase().includes('misto');

    if (st.running) {
        clearInterval(st.intervalId);
        const now = Date.now();
        const delta = Math.max(0, now - st.lastStartTs);
        if (st.timerType === 'stopwatch') {
            st.elapsedMs += delta;
        } else {
            st.cdRemainingMs = Math.max(0, st.cdTargetEndTs - now);
        }
        if (isMixed) {
            if (st.mixedPhase === 'walk') st.walkElapsedMs += delta;
            else st.runElapsedMs += delta;
        }
        st.running = false;
    } else {
        st.concludedDurationStr = '';
        if (st.timerType === 'countdown' && st.cdRemainingMs <= 0) {
            st.cdRemainingMs = st.cdTotalSec * 1000;
        }
        const now = Date.now();
        st.lastStartTs = now;
        if (st.timerType === 'countdown') {
            st.cdTargetEndTs = now + st.cdRemainingMs;
        }
        st.running = true;
        st.intervalId = setInterval(() => {
            const tickNow = Date.now();
            const delta = Math.max(0, tickNow - st.lastStartTs);
            st.lastStartTs = tickNow;

            if (isMixed) {
                if (st.mixedPhase === 'walk') st.walkElapsedMs += delta;
                else st.runElapsedMs += delta;
            }

            if (st.timerType === 'stopwatch') {
                st.elapsedMs += delta;
                updateAtvAerobicTimerDOM(mod);
            } else {
                const rem = Math.max(0, st.cdTargetEndTs - tickNow);
                st.cdRemainingMs = rem;
                updateAtvAerobicTimerDOM(mod);
                if (rem <= 0) {
                    clearInterval(st.intervalId);
                    st.running = false;
                    triggerAeroCountdownFinishedAlerts(mod);
                    window.concludeAtvAerobicTimer(mod, true);
                }
            }
        }, 80);
    }
    renderAtvFisicaInteractiveView();
};

window.resetAtvAerobicStopwatch = function() {
    const st = getAeroModalityTimerState(aeroSelectedModality);
    if (st.running) {
        clearInterval(st.intervalId);
        st.running = false;
    }
    st.elapsedMs = 0;
    st.cdRemainingMs = st.cdTotalSec * 1000;
    st.runElapsedMs = 0;
    st.walkElapsedMs = 0;
    st.concludedDurationStr = '';
    st.concludedElapsedSec = 0;
    renderAtvFisicaInteractiveView();
    if (typeof updateMiniTimerPill === 'function') updateMiniTimerPill();
};

/* Botão "Concluir" do Timer Aeróbico:
 * Finaliza a contagem do exercício atual e preenche AUTOMATICAMENTE o campo Duração (#atv-aero-minutes) */
window.concludeAtvAerobicTimer = function(modOverride, fromCountdownZero = false) {
    const mod = modOverride || aeroSelectedModality;
    const st = getAeroModalityTimerState(mod);
    const inp = getAeroModalityInputs(mod);
    const isMixed = mod.toLowerCase().includes('misto');

    if (st.running) {
        clearInterval(st.intervalId);
        const now = Date.now();
        const delta = Math.max(0, now - st.lastStartTs);
        if (st.timerType === 'stopwatch') {
            st.elapsedMs += delta;
        } else {
            st.cdRemainingMs = Math.max(0, st.cdTargetEndTs - now);
        }
        if (isMixed) {
            if (st.mixedPhase === 'walk') st.walkElapsedMs += delta;
            else st.runElapsedMs += delta;
        }
        st.running = false;
    }

    let countedMs = 0;
    if (st.timerType === 'countdown') {
        if (fromCountdownZero || st.cdRemainingMs <= 0) {
            countedMs = st.cdTotalSec * 1000;
        } else {
            const elapsedInCd = (st.cdTotalSec * 1000) - st.cdRemainingMs;
            countedMs = elapsedInCd > 0 ? elapsedInCd : (st.cdTotalSec * 1000);
        }
    } else {
        countedMs = st.elapsedMs;
    }

    if (countedMs <= 0) {
        alert('Inicie o timer antes de clicar em Concluir para enviar o tempo automaticamente ao campo de Duração.');
        return;
    }

    const totalSec = Math.max(1, Math.round(countedMs / 1000));
    const formattedDuration = formatAeroConcludedDurationString(totalSec);

    // Preenche automaticamente o estado e o campo Duração do exercício atual
    inp.manualMin = formattedDuration;
    st.concludedDurationStr = formattedDuration;
    st.concludedElapsedSec = totalSec;

    // Se for Misto e houve medição nas duas fases (Corrida + Caminhada), calcula a proporção real alpha automaticamente
    const totalPhaseMs = st.runElapsedMs + st.walkElapsedMs;
    if (isMixed && totalPhaseMs >= 2000 && st.runElapsedMs > 0 && st.walkElapsedMs > 0) {
        const measuredRatio = Math.min(0.95, Math.max(0.05, parseFloat((st.runElapsedMs / totalPhaseMs).toFixed(2))));
        inp.mixRunRatio = String(measuredRatio);
    }

    // Reinicia os contadores ativos após concluir para deixar pronto
    st.elapsedMs = 0;
    st.cdRemainingMs = st.cdTotalSec * 1000;
    st.runElapsedMs = 0;
    st.walkElapsedMs = 0;

    saveAtvUiState();
    renderAtvFisicaInteractiveView();
    if (typeof updateMiniTimerPill === 'function') updateMiniTimerPill();

    // Destaca visualmente o campo de Duração preenchido automaticamente
    setTimeout(() => {
        const minInput = document.getElementById('atv-aero-minutes');
        if (minInput) {
            minInput.value = formattedDuration;
            minInput.classList.add('ring-2', 'ring-emerald-500', 'bg-emerald-50');
            setTimeout(() => {
                minInput.classList.remove('ring-2', 'ring-emerald-500', 'bg-emerald-50');
            }, 1800);
        }
        updateAtvAerobicDistancePreview();
    }, 30);
};

/* Registra sessão aeróbica vinda do Timer e consolida na mesma linha do histórico do card de Sistema Cardiovascular */
window.recordAerobicSessionFromTimer = function({ modality, durationMin, durationRawStr, elapsedSeconds, speedKmh, walkSpeedKmh, runRatio, notes, dateIso }) {
    const targetDate = dateIso || selectedAtvDate || getLocalISODate();
    const durObj = parseCardioDurationInterval(durationRawStr || `${durationMin || 20} min`, durationMin || 20);
    const cleanMin = Math.max(0.1, parseFloat((durObj.avgMin || parseFloat(durationMin) || 20).toFixed(2)));
    const modName = modality || 'Corrida';
    const isMixed = modName.toLowerCase().includes('misto');

    const rawRunSpeed = parseFloat(speedKmh) || 0;
    const rawWalkSpeed = parseFloat(walkSpeedKmh) || 0;
    const cleanRatio = (parseFloat(runRatio) > 0 && parseFloat(runRatio) < 1) ? parseFloat(runRatio) : 0.60;

    const effectiveSpeed = isMixed
        ? calcMixedCardioEffectiveSpeed(rawRunSpeed, rawWalkSpeed, cleanRatio)
        : rawRunSpeed;

    let timerDurationStr = '';
    if (durationRawStr && String(durationRawStr).trim()) {
        const rawTrim = String(durationRawStr).trim();
        timerDurationStr = /min/i.test(rawTrim) ? rawTrim : `${rawTrim} min`;
    } else if (durObj.isInterval) {
        timerDurationStr = `${durObj.minMin}-${durObj.maxMin} min`;
    } else {
        timerDurationStr = formatTimerCountedDuration(cleanMin, elapsedSeconds);
    }

    const workout = WORKOUT_PLAN.find(w => w.planId === selectedWorkoutPlanId) || WORKOUT_PLAN[0];
    const was100Before = workout ? getWorkoutDayCompletionStatus(workout, targetDate).is100Percent : false;

    if (!atvLogs[targetDate]) atvLogs[targetDate] = [];

    let mixedExtraNote = '';
    if (isMixed && rawRunSpeed > 0) {
        const walkUsed = rawWalkSpeed > 0 ? rawWalkSpeed : (rawRunSpeed * 0.55);
        const pctRun = Math.round(cleanRatio * 100);
        mixedExtraNote = `Misto ${pctRun}% Corrida (${rawRunSpeed.toFixed(1).replace('.', ',')} km/h) / ${100 - pctRun}% Caminhada (${walkUsed.toFixed(1).replace('.', ',')} km/h)`;
    }
    const combinedUserNotes = [mixedExtraNote, notes].filter(Boolean).join(' • ');

    const existingCardio = findExistingCardioLogForDate(targetDate);
    if (existingCardio) {
        // Atualiza na MESMA linha do registro feito utilizando o card de Cardio Zona 2!
        existingCardio.habitId = CARDIO_Z2_HABIT_ID;
        existingCardio.planId = CARDIO_Z2_PLAN_ID;
        existingCardio.timerModality = modName;
        existingCardio.isMixed = isMixed;
        if (isMixed) {
            existingCardio.runSpeedKmh = rawRunSpeed;
            existingCardio.walkSpeedKmh = rawWalkSpeed > 0 ? rawWalkSpeed : parseFloat((rawRunSpeed * 0.55).toFixed(2));
            existingCardio.runRatio = cleanRatio;
        }
        existingCardio.durationMin = durObj.avgMin;
        existingCardio.timerDuration = timerDurationStr;
        existingCardio.reps = timerDurationStr;
        existingCardio.sets = 1;
        existingCardio.rest = '-';
        existingCardio.unit = 'km/h';
        existingCardio.muscle = existingCardio.muscle || 'Sistema Cardiovascular / Resistência';
        existingCardio.cardExerciseName = CARDIO_Z2_NAME;

        existingCardio.exerciseName = `${CARDIO_Z2_NAME} • ${modName}`;

        if (effectiveSpeed > 0) {
            existingCardio.weight = parseFloat(effectiveSpeed.toFixed(2));
        }

        existingCardio.notes = buildCardioNotesString(
            existingCardio.weight,
            durObj.avgMin,
            timerDurationStr,
            combinedUserNotes || existingCardio.notes
        );
    } else {
        const cardMuscle = 'Sistema Cardiovascular / Resistência';
        const baseName = `${CARDIO_Z2_NAME} • ${modName}`;

        atvLogs[targetDate].push({
            id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            habitId: CARDIO_Z2_HABIT_ID,
            planId: CARDIO_Z2_PLAN_ID,
            exerciseName: baseName,
            cardExerciseName: CARDIO_Z2_NAME,
            timerModality: modName,
            isMixed,
            runSpeedKmh: isMixed ? rawRunSpeed : undefined,
            walkSpeedKmh: isMixed ? (rawWalkSpeed > 0 ? rawWalkSpeed : parseFloat((rawRunSpeed * 0.55).toFixed(2))) : undefined,
            runRatio: isMixed ? cleanRatio : undefined,
            muscle: cardMuscle,
            sets: 1,
            reps: timerDurationStr,
            timerDuration: timerDurationStr,
            durationMin: durObj.avgMin,
            rest: '-',
            weight: parseFloat(effectiveSpeed.toFixed(2)),
            unit: 'km/h',
            notes: buildCardioNotesString(effectiveSpeed, durObj.avgMin, timerDurationStr, combinedUserNotes)
        });
    }

    // Soma as horas realizadas no hábito de Atividade Física caso a data pertença à semana atual
    if (typeof weekDays !== 'undefined' && Array.isArray(weekDays)) {
        const dIdx = weekDays.findIndex(d => d.iso === targetDate);
        if (dIdx !== -1 && Array.isArray(habits)) {
            const atvHabit = habits.find(h => h.planId === CARDIO_Z2_PLAN_ID || h.id === CARDIO_Z2_HABIT_ID || h.name === CARDIO_Z2_NAME) || habits.find(h => h.category === 'atv_fisica');
            if (atvHabit) {
                const addHours = parseFloat((durObj.avgMin / 60).toFixed(2));
                atvHabit.dailyHours[dIdx] = parseFloat(((atvHabit.dailyHours[dIdx] || 0) + addHours).toFixed(2));
                atvHabit.checks[dIdx] = true;
            }
        }
    }

    saveAtvLogs();
    saveData(false, true);

    if (workout) {
        const is100Now = getWorkoutDayCompletionStatus(workout, targetDate).is100Percent;
        if (!was100Before && is100Now) {
            trigger100PercentCelebrationBall();
        }
    }
};

window.submitAtvAerobicSession = function(event) {
    if (event) event.preventDefault();
    const st = getAeroModalityTimerState(aeroSelectedModality);
    const inp = getAeroModalityInputs(aeroSelectedModality);

    // Se o timer ainda estava rodando e o campo Duração estiver vazio, conclui o timer primeiro para preencher a duração
    const currentMinFieldVal = (document.getElementById('atv-aero-minutes')?.value || '').trim();
    if (!currentMinFieldVal && (st.running || st.elapsedMs > 0 || (st.timerType === 'countdown' && st.cdRemainingMs < st.cdTotalSec * 1000))) {
        window.concludeAtvAerobicTimer(aeroSelectedModality, false);
    }

    const speedVal = getWeightNumericValue(document.getElementById('atv-aero-speed')?.value || inp.speedKmh || '');
    const walkSpeedVal = getWeightNumericValue(document.getElementById('atv-aero-walk-speed')?.value || inp.walkSpeedKmh || '');
    const mixRatioVal = parseFloat(document.getElementById('atv-aero-mix-ratio')?.value || inp.mixRunRatio || '0.60') || 0.60;
    const manualRaw = (document.getElementById('atv-aero-minutes')?.value || inp.manualMin || '').trim();
    const durObj = parseCardioDurationInterval(manualRaw, 0);
    const hasManualDuration = manualRaw.length > 0 && durObj.avgMin > 0;

    if (!hasManualDuration && speedVal <= 0) {
        alert('Conclua o timer para enviar a duração automaticamente ou informe a Duração (min) e Velocidade (km/h).');
        return;
    }

    const finalMin = hasManualDuration ? durObj.avgMin : 20;
    const notesVal = document.getElementById('atv-aero-notes')?.value.trim() || '';

    window.recordAerobicSessionFromTimer({
        modality: aeroSelectedModality,
        durationMin: finalMin,
        durationRawStr: manualRaw,
        elapsedSeconds: st.concludedElapsedSec > 0 ? st.concludedElapsedSec : (durObj.isInterval ? 0 : Math.round(finalMin * 60)),
        speedKmh: speedVal,
        walkSpeedKmh: walkSpeedVal,
        runRatio: mixRatioVal,
        notes: notesVal,
        dateIso: selectedAtvDate
    });

    st.concludedDurationStr = '';
    st.concludedElapsedSec = 0;
    atvUiState.aerobicInputsByModality[aeroSelectedModality] = {
        speedKmh: '',
        walkSpeedKmh: '',
        mixRunRatio: '0.60',
        manualMin: '',
        notes: ''
    };
    saveAtvUiState();
    renderAtvFisicaInteractiveView();
};

/* ------------------------------------------------------------------
 * Edição de Registro de Exercício (No formato do novo sistema de Cards:
 * Grupo Muscular Associado, Dropdown do Card, Principal vs Substituto)
 * ------------------------------------------------------------------ */
let editModalSelectedRole = 'variation'; // 'main' | 'variation'

function findExerciseMeta(exName, habitId) {
    if (!exName) return null;
    const target = String(exName).trim().toLowerCase();
    for (const w of WORKOUT_PLAN) {
        for (const e of w.exercises) {
            if (e.name.toLowerCase() === target) return e;
            if (Array.isArray(e.variations) && e.variations.some(v => v.toLowerCase() === target)) return e;
        }
    }
    if (isCardioExercise(exName, '')) {
        for (const w of WORKOUT_PLAN) {
            const cardioCard = w.exercises.find(e => isCardioExercise(e.name, e.muscle));
            if (cardioCard) return cardioCard;
        }
    }
    return null;
}

/* Localiza o par { planId, slotIdx, card } correspondente a um registro (mesmo se vindo do sistema antigo) */
function findWorkoutSlotForLog(log) {
    if (!log) return { planId: selectedWorkoutPlanId || 'upper_a', slotIdx: 0, card: WORKOUT_PLAN[0].exercises[0] };
    const exNameLower = String(log.exerciseName || '').trim().toLowerCase();
    const muscleLower = String(log.muscle || '').trim().toLowerCase();
    const isCardio = log.unit === 'km/h' || isCardioExercise(log.exerciseName, log.muscle);

    // 1. Busca por correspondência exata do nome principal ou variação
    for (const w of WORKOUT_PLAN) {
        for (let i = 0; i < w.exercises.length; i++) {
            const e = w.exercises[i];
            if (e.name.toLowerCase() === exNameLower) {
                return { planId: w.planId, slotIdx: i, card: e };
            }
            if (Array.isArray(e.variations) && e.variations.some(v => v.toLowerCase() === exNameLower)) {
                return { planId: w.planId, slotIdx: i, card: e };
            }
        }
    }

    // 2. Se for cardio, vincula ao card de Sistema Cardiovascular
    if (isCardio) {
        for (const w of WORKOUT_PLAN) {
            const cIdx = w.exercises.findIndex(e => isCardioExercise(e.name, e.muscle));
            if (cIdx !== -1) {
                return { planId: w.planId, slotIdx: cIdx, card: w.exercises[cIdx] };
            }
        }
    }

    // 3. Busca por correspondência de grupo muscular (para exercícios antigos personalizados)
    if (muscleLower) {
        for (const w of WORKOUT_PLAN) {
            const mIdx = w.exercises.findIndex(e => e.muscle.toLowerCase() === muscleLower || e.muscle.toLowerCase().includes(muscleLower) || muscleLower.includes(e.muscle.toLowerCase()));
            if (mIdx !== -1) {
                return { planId: w.planId, slotIdx: mIdx, card: w.exercises[mIdx] };
            }
        }
    }

    // 4. Fallback para o primeiro card do treino associado
    const fallbackPlanId = (log.planId && WORKOUT_PLAN.some(w => w.planId === log.planId)) ? log.planId : (selectedWorkoutPlanId || 'upper_a');
    const fallbackW = WORKOUT_PLAN.find(w => w.planId === fallbackPlanId) || WORKOUT_PLAN[0];
    return { planId: fallbackW.planId, slotIdx: 0, card: fallbackW.exercises[0] };
}

window.setEditAtvRole = function(role) {
    editModalSelectedRole = role === 'main' ? 'main' : 'variation';
    const btnMain = document.getElementById('btn-edit-role-main');
    const btnVar = document.getElementById('btn-edit-role-variation');
    if (btnMain && btnVar) {
        btnMain.className = editModalSelectedRole === 'main'
            ? "flex-1 py-2 px-2 rounded-xl bg-black text-white text-[11px] font-bold transition shadow-xs"
            : "flex-1 py-2 px-2 rounded-xl bg-white border border-zinc-200 text-zinc-600 hover:text-black text-[11px] font-semibold transition";
        btnVar.className = editModalSelectedRole === 'variation'
            ? "flex-1 py-2 px-2 rounded-xl bg-black text-white text-[11px] font-bold transition shadow-xs"
            : "flex-1 py-2 px-2 rounded-xl bg-white border border-zinc-200 text-zinc-600 hover:text-black text-[11px] font-semibold transition";
    }
    const hintEl = document.getElementById('atv-edit-role-hint');
    if (hintEl) {
        hintEl.textContent = editModalSelectedRole === 'main'
            ? '⭐ Será definido como exercício PRINCIPAL deste card; o antigo principal virará substituto/variação.'
            : '🔄 Será mantido/adicionado como SUBSTITUTO/VARIAÇÃO na lista deste card.';
    }
};

function getSelectedEditCardSlot() {
    const slotSelect = document.getElementById('atv-edit-muscle-slot');
    const val = slotSelect ? slotSelect.value : 'upper_a__0';
    const [planId, idxStr] = String(val).split('__');
    const workout = WORKOUT_PLAN.find(w => w.planId === planId) || WORKOUT_PLAN[0];
    const slotIdx = parseInt(idxStr, 10) || 0;
    const card = (workout && workout.exercises[slotIdx]) ? workout.exercises[slotIdx] : workout.exercises[0];
    return { workout, planId: workout.planId, slotIdx, card };
}

function populateEditExerciseDropdownForSlot(card, currentExerciseName) {
    const container = document.getElementById('atv-edit-exercise-container');
    if (!container || !card) return;

    const cleanCurrent = String(currentExerciseName || card.name || '').trim();
    const allCardNames = [card.name, ...(card.variations || [])];
    const isCardio = isCardioExercise(card.name, card.muscle);
    if (isCardio) {
        ['Corrida', 'Caminhada', 'Misto (Caminhada + Corrida)', 'Bike / Ciclismo', 'Esteira Inclinada', 'Escada / Elíptico'].forEach(mod => {
            if (!allCardNames.some(n => n.toLowerCase() === mod.toLowerCase())) {
                allCardNames.push(mod);
            }
        });
    }

    const existsInList = allCardNames.some(n => n.toLowerCase() === cleanCurrent.toLowerCase());
    let optionsHtml = '';
    if (!existsInList && cleanCurrent) {
        optionsHtml += `<option value="${cleanCurrent.replace(/"/g, '&quot;')}" selected>📌 ${cleanCurrent} (Cadastrar no card)</option>`;
    }
    allCardNames.forEach((name, idx) => {
        const isSel = name.toLowerCase() === cleanCurrent.toLowerCase();
        const prefix = idx === 0 ? '⭐ ' : '↳ ';
        optionsHtml += `<option value="${name.replace(/"/g, '&quot;')}" ${isSel ? 'selected' : ''}>${prefix}${name}</option>`;
    });

    container.innerHTML = `
        <select id="atv-edit-exercise-select" onchange="onEditAtvExerciseSelectChange()" class="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-900 focus:bg-white">
            ${optionsHtml}
        </select>
        <input type="text" id="atv-edit-exercise" oninput="onEditAtvExerciseNameInput()" value="${cleanCurrent.replace(/"/g, '&quot;')}" placeholder="Ou digite/edite o nome do exercício" class="w-full bg-white border border-zinc-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-zinc-900">
    `;
}

function syncEditModalFieldsForSlotAndExercise(card, exerciseName, logObj, isSwitch = false) {
    if (!card) return;
    const isCardio = isCardioExercise(exerciseName, card.muscle);

    const exerciseSection = document.getElementById('atv-edit-exercise-section');
    const roleSection = document.getElementById('atv-edit-role-section');
    const cardioTypeSection = document.getElementById('atv-edit-cardio-type-section');
    const strengthParams = document.getElementById('atv-edit-strength-params');
    const cardioParams = document.getElementById('atv-edit-cardio-params');
    const sysInfoEl = document.getElementById('atv-edit-system-info');

    if (isCardio) {
        if (exerciseSection) exerciseSection.classList.add('hidden');
        if (roleSection) roleSection.classList.add('hidden');
        if (strengthParams) strengthParams.classList.add('hidden');
        if (cardioTypeSection) cardioTypeSection.classList.remove('hidden');
        if (cardioParams) cardioParams.classList.remove('hidden');

        if (sysInfoEl) {
            sysInfoEl.textContent = '❤️ Treino Aeróbico • Somente Duração, Velocidade (km/h) e Pace';
        }

        const selMod = document.getElementById('atv-edit-cardio-modality');
        if (selMod) {
            let targetMod = 'Corrida';
            if (logObj && logObj.timerModality) {
                targetMod = logObj.timerModality;
            } else if (exerciseName) {
                const exLower = exerciseName.toLowerCase();
                if (exLower.includes('misto')) targetMod = 'Misto (Caminhada + Corrida)';
                else if (exLower.includes('caminhada')) targetMod = 'Caminhada';
                else if (exLower.includes('bike') || exLower.includes('ciclismo')) targetMod = 'Bike / Ciclismo';
                else if (exLower.includes('esteira')) targetMod = 'Esteira Inclinada';
                else if (exLower.includes('escada') || exLower.includes('elíptico')) targetMod = 'Escada / Elíptico';
                else targetMod = 'Corrida';
            }
            selMod.value = targetMod;
        }

        const curMod = selMod ? selMod.value : 'Corrida';
        const isMixed = curMod.toLowerCase().includes('misto') || (logObj && logObj.isMixed);
        const simpleFields = document.getElementById('atv-edit-cardio-simple-fields');
        const mixedFields = document.getElementById('atv-edit-cardio-mixed-fields');

        if (isMixed) {
            if (simpleFields) simpleFields.classList.add('hidden');
            if (mixedFields) mixedFields.classList.remove('hidden');

            const spRunEl = document.getElementById('atv-edit-mixed-speed');
            const spWalkEl = document.getElementById('atv-edit-mixed-walk-speed');
            const ratioEl = document.getElementById('atv-edit-mixed-ratio');
            const durEl = document.getElementById('atv-edit-mixed-duration');

            if (logObj && logObj.runSpeedKmh) {
                if (spRunEl) spRunEl.value = formatWeightNumber(logObj.runSpeedKmh);
                if (spWalkEl) spWalkEl.value = formatWeightNumber(logObj.walkSpeedKmh || (logObj.runSpeedKmh * 0.55));
                if (ratioEl) ratioEl.value = logObj.runRatio ? String(logObj.runRatio) : '0.60';
                if (durEl) durEl.value = logObj.timerDuration || logObj.reps || '25 min';
            } else {
                if (spRunEl) spRunEl.value = logObj ? formatWeightNumber(logObj.weight || 10) : '10,00';
                if (spWalkEl) spWalkEl.value = logObj ? formatWeightNumber(parseFloat(logObj.weight || 10) * 0.55) : '5,50';
                if (ratioEl) ratioEl.value = '0.60';
                if (durEl) durEl.value = (logObj && (logObj.timerDuration || logObj.reps)) ? (logObj.timerDuration || logObj.reps) : '25 min';
            }
        } else {
            if (simpleFields) simpleFields.classList.remove('hidden');
            if (mixedFields) mixedFields.classList.add('hidden');

            const spEl = document.getElementById('atv-edit-cardio-speed');
            const durEl = document.getElementById('atv-edit-cardio-duration');
            if (spEl) spEl.value = logObj ? formatWeightNumber(logObj.weight || 0) : '9,00';
            if (durEl) durEl.value = (logObj && (logObj.timerDuration || logObj.reps)) ? (logObj.timerDuration || logObj.reps) : '20 min';
        }
        window.onEditAtvCardioInputChange();
    } else {
        if (exerciseSection) exerciseSection.classList.remove('hidden');
        if (roleSection) roleSection.classList.remove('hidden');
        if (strengthParams) strengthParams.classList.remove('hidden');
        if (cardioTypeSection) cardioTypeSection.classList.add('hidden');
        if (cardioParams) cardioParams.classList.add('hidden');

        if (sysInfoEl) {
            sysInfoEl.textContent = `🏋️ ${card.muscle} • Alvo atual do card: ${card.sets || 3}× ${card.reps || '8-12'} (${card.rest || '90s'})`;
        }

        const setsField = document.getElementById('atv-edit-sets');
        const repsField = document.getElementById('atv-edit-reps');
        const restField = document.getElementById('atv-edit-rest');
        const weightField = document.getElementById('atv-edit-weight');

        if (isSwitch) {
            if (setsField) setsField.value = card.sets || 3;
            if (repsField) repsField.value = card.reps || '8-12';
            if (restField) restField.value = card.rest || '90-120s';
            const suggested = calcWeightedExerciseRefLoad([exerciseName, card.name, ...(card.variations || [])], card.load);
            if (weightField && suggested !== null) weightField.value = formatWeightNumber(suggested);
        } else if (logObj) {
            if (setsField) setsField.value = logObj.sets || card.sets || 3;
            if (repsField) repsField.value = logObj.reps || card.reps || '8-12';
            if (restField) restField.value = (logObj.rest && logObj.rest !== '-') ? logObj.rest : (card.rest || '90-120s');
            if (weightField) weightField.value = formatWeightNumber(logObj.weight || 0);
        }

        const isMain = String(card.name || '').trim().toLowerCase() === String(exerciseName || '').trim().toLowerCase();
        window.setEditAtvRole(isMain ? 'main' : 'variation');
    }
}

window.onEditAtvCardioModalityChange = function() {
    const selMod = document.getElementById('atv-edit-cardio-modality')?.value || 'Corrida';
    const isMixed = selMod.toLowerCase().includes('misto');
    const simpleFields = document.getElementById('atv-edit-cardio-simple-fields');
    const mixedFields = document.getElementById('atv-edit-cardio-mixed-fields');

    if (isMixed) {
        if (simpleFields) simpleFields.classList.add('hidden');
        if (mixedFields) mixedFields.classList.remove('hidden');
    } else {
        if (simpleFields) simpleFields.classList.remove('hidden');
        if (mixedFields) mixedFields.classList.add('hidden');
    }
    window.onEditAtvCardioInputChange();
};

window.onEditAtvCardioInputChange = function() {
    const previewEl = document.getElementById('atv-edit-cardio-preview');
    if (!previewEl) return;
    const selMod = document.getElementById('atv-edit-cardio-modality')?.value || 'Corrida';
    const isMixed = selMod.toLowerCase().includes('misto');

    let effSpeed = 0;
    let durStr = '';
    if (isMixed) {
        const runSp = getWeightNumericValue(document.getElementById('atv-edit-mixed-speed')?.value || '0');
        const walkSp = getWeightNumericValue(document.getElementById('atv-edit-mixed-walk-speed')?.value || '0');
        const ratio = parseFloat(document.getElementById('atv-edit-mixed-ratio')?.value || '0.60') || 0.60;
        durStr = document.getElementById('atv-edit-mixed-duration')?.value || '25 min';
        effSpeed = calcMixedCardioEffectiveSpeed(runSp, walkSp, ratio);
    } else {
        effSpeed = getWeightNumericValue(document.getElementById('atv-edit-cardio-speed')?.value || '0');
        durStr = document.getElementById('atv-edit-cardio-duration')?.value || '20 min';
    }

    const durObj = parseCardioDurationInterval(durStr, 20);
    if (effSpeed > 0 && durObj.avgMin > 0) {
        const km = (effSpeed * durObj.avgMin) / 60;
        const pace = formatPaceMinPerKm(effSpeed);
        previewEl.innerHTML = `🏃 Distância: <b class="text-zinc-900">${km.toFixed(2).replace('.', ',')} km</b> • Pace: <b class="text-zinc-900">${pace}</b>${isMixed ? ' • Misto (η=0,96)' : ''}`;
    } else {
        };
const _unusedLegacySyncHead = function(card, exerciseName) {
    if (!card) return;
    const isCardio = isCardioExercise(exerciseName, card.muscle);

    const sysInfoEl = document.getElementById('atv-edit-system-info');
    if (sysInfoEl) {
        if (isCardio) {
            sysInfoEl.textContent = `❤️ ${card.muscle} • Somente Duração + Velocidade (km/h)`;
        } else {
            sysInfoEl.textContent = `🏋️ ${card.muscle} • Alvo atual do card: ${card.sets || 3}× ${card.reps || '8-12'} (${card.rest || '90s'})`;
        }
    }

    const weightLabel = document.getElementById('atv-edit-weight-label');
    if (weightLabel) {
        weightLabel.textContent = isCardio ? 'Velocidade (km/h)' : 'Carga (kg)';
    }

}; const _unusedLegacySyncModal = function() {
    const cardioGroup = document.getElementById('atv-edit-cardio-group');
    const setsField = document.getElementById('atv-edit-sets');
    const repsField = document.getElementById('atv-edit-reps');
    const restField = document.getElementById('atv-edit-rest');
    const durationField = document.getElementById('atv-edit-duration');

    if (isCardio) {
        if (strengthGroup) strengthGroup.classList.add('hidden');
        if (cardioGroup) cardioGroup.classList.remove('hidden');
        if (durationField) {
            if (isSwitch) {
                durationField.value = card.reps || '20 min';
            } else if (logObj) {
                durationField.value = logObj.timerDuration || logObj.reps || card.reps || '20 min';
            }
        }
    } else {
        if (strengthGroup) strengthGroup.classList.remove('hidden');
        if (cardioGroup) cardioGroup.classList.add('hidden');
        if (isSwitch) {
            if (setsField) setsField.value = card.sets || 3;
            if (repsField) repsField.value = card.reps || '8-12';
            if (restField) restField.value = card.rest || '90-120s';
        } else if (logObj) {
            if (setsField) setsField.value = logObj.sets || card.sets || 3;
            if (repsField) repsField.value = logObj.reps || card.reps || '8-12';
            if (restField) restField.value = (logObj.rest && logObj.rest !== '-') ? logObj.rest : (card.rest || '90-120s');
        }
    }

    // Define se é Principal ou Substituto neste card
    const isMain = String(card.name || '').trim().toLowerCase() === String(exerciseName || '').trim().toLowerCase();
    window.setEditAtvRole(isMain ? 'main' : 'variation');
}

window.onEditAtvMuscleSlotChange = function() {
    const { card } = getSelectedEditCardSlot();
    if (!card) return;
    const dateStr = document.getElementById('atv-edit-date')?.value || '';
    const logId = document.getElementById('atv-edit-log-id')?.value || '';
    const list = atvLogs[dateStr] || [];
    const log = list.find(item => item.id === logId) || null;

    populateEditExerciseDropdownForSlot(card, card.name);
    syncEditModalFieldsForSlotAndExercise(card, card.name, log, true);
};

window.onEditAtvExerciseSelectChange = function() {
    const sel = document.getElementById('atv-edit-exercise-select');
    const txt = document.getElementById('atv-edit-exercise');
    const chosen = sel ? sel.value : '';
    if (txt && chosen) txt.value = chosen;

    const { card } = getSelectedEditCardSlot();
    const dateStr = document.getElementById('atv-edit-date')?.value || '';
    const logId = document.getElementById('atv-edit-log-id')?.value || '';
    const list = atvLogs[dateStr] || [];
    const log = list.find(item => item.id === logId) || null;
    syncEditModalFieldsForSlotAndExercise(card, chosen, log, true);
};

window.onEditAtvExerciseNameInput = function() {
    const txt = document.getElementById('atv-edit-exercise');
    const chosen = txt ? txt.value.trim() : '';
    const { card } = getSelectedEditCardSlot();
    if (!card) return;
    const isMain = String(card.name || '').trim().toLowerCase() === chosen.toLowerCase();
    window.setEditAtvRole(isMain ? 'main' : 'variation');
};

window.openEditAtvLog = function(dateStr, logId) {
    loadWorkoutCatalogCustomizations();
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

    const notesField = document.getElementById('atv-edit-notes');
    if (notesField) notesField.value = log.notes || '';

    // 1. Popula o select de Grupo Muscular Associado (Card) com todos os cards do plano
    const matched = findWorkoutSlotForLog(log);
    const slotSelect = document.getElementById('atv-edit-muscle-slot');
    if (slotSelect) {
        let slotOpts = '';
        let cardioSlotAdded = false;
        WORKOUT_PLAN.forEach(w => {
            w.exercises.forEach((ex, idx) => {
                const isCardioEx = isCardioExercise(ex.name, ex.muscle);
                if (isCardioEx) {
                    if (cardioSlotAdded) return;
                    cardioSlotAdded = true;
                    const val = `${w.planId}__${idx}`;
                    const isSel = isCardioExercise(log.exerciseName, log.muscle) || (w.planId === matched.planId && idx === matched.slotIdx);
                    slotOpts += `<option value="${val}" ${isSel ? 'selected' : ''}>${CARDIO_Z2_NAME} • ${ex.muscle}</option>`;
                    return;
                }
                const val = `${w.planId}__${idx}`;
                const isSel = w.planId === matched.planId && idx === matched.slotIdx;
                slotOpts += `<option value="${val}" ${isSel ? 'selected' : ''}>${w.name} • ${ex.muscle} (Principal: ${ex.name})</option>`;
            });
        });
        slotSelect.innerHTML = slotOpts;
    }

    // 2. Popula a lista de Exercícios / Variações do card selecionado + input editável
    populateEditExerciseDropdownForSlot(matched.card, log.exerciseName);

    // 3. Sincroniza os campos (Principal vs Substituto, Séries/REPS/Descanso vs Duração)
    syncEditModalFieldsForSlotAndExercise(matched.card, log.exerciseName, log, false);

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

    const { workout, planId, slotIdx, card } = getSelectedEditCardSlot();
    const exInput = document.getElementById('atv-edit-exercise');
    const exSelect = document.getElementById('atv-edit-exercise-select');
    const chosenName = (exInput && exInput.value.trim()) ? exInput.value.trim() : (exSelect ? exSelect.value.trim() : log.exerciseName);

    log.exerciseName = chosenName;
    if (card) {
        log.muscle = card.muscle;
        log.planId = planId;
        log.habitId = 'h_' + planId;
    }

    const isCardio = isCardioExercise(log.exerciseName, log.muscle) ||
        (card && isCardioExercise(card.name, card.muscle)) ||
        (document.getElementById('atv-edit-cardio-type-section') && !document.getElementById('atv-edit-cardio-type-section').classList.contains('hidden'));
    log.unit = isCardio ? 'km/h' : 'kg';
    if (isCardio) {
        log.planId = CARDIO_Z2_PLAN_ID;
        log.habitId = CARDIO_Z2_HABIT_ID;
    }

    const weightInput = document.getElementById('atv-edit-weight');
    if (weightInput) log.weight = getWeightNumericValue(weightInput.value);

    if (isCardio) {
        const selMod = document.getElementById('atv-edit-cardio-modality')?.value || 'Corrida';
        const isMixed = selMod.toLowerCase().includes('misto');
        log.timerModality = selMod;
        log.isMixed = isMixed;
        let effSpeed = 0;
        let durVal = '20 min';

        if (isMixed) {
            const runSp = getWeightNumericValue(document.getElementById('atv-edit-mixed-speed')?.value || '0');
            const walkSp = getWeightNumericValue(document.getElementById('atv-edit-mixed-walk-speed')?.value || '0');
            const ratio = parseFloat(document.getElementById('atv-edit-mixed-ratio')?.value || '0.60') || 0.60;
            durVal = document.getElementById('atv-edit-mixed-duration')?.value.trim() || '25 min';
            effSpeed = calcMixedCardioEffectiveSpeed(runSp, walkSp, ratio);
            log.runSpeedKmh = runSp;
            log.walkSpeedKmh = walkSp > 0 ? walkSp : parseFloat((runSp * 0.55).toFixed(2));
            log.runRatio = ratio;
        } else {
            effSpeed = getWeightNumericValue(document.getElementById('atv-edit-cardio-speed')?.value || '0');
            durVal = document.getElementById('atv-edit-cardio-duration')?.value.trim() || '20 min';
            log.runSpeedKmh = undefined;
            log.walkSpeedKmh = undefined;
            log.runRatio = undefined;
        }

        const durObj = parseCardioDurationInterval(durVal, 20);
        log.weight = parseFloat(effSpeed.toFixed(2));
        log.sets = 1;
        log.reps = durVal;
        log.timerDuration = durVal;
        log.durationMin = durObj.avgMin;

        log.rest = '-';
        log.unit = 'km/h';
        log.planId = CARDIO_Z2_PLAN_ID;
        log.habitId = CARDIO_Z2_HABIT_ID;
        log.muscle = 'Sistema Cardiovascular / Resistência';
        log.exerciseName = `${CARDIO_Z2_NAME} • ${selMod}`;
        log.cardExerciseName = CARDIO_Z2_NAME;

        log.sets = 1;




        log.rest = '-';
    } else {
        const setsInput = document.getElementById('atv-edit-sets');
        if (setsInput) log.sets = parseInt(setsInput.value, 10) || 3;

        const repsInput = document.getElementById('atv-edit-reps');
        if (repsInput) log.reps = repsInput.value.trim() || '8-12';

        const restInput = document.getElementById('atv-edit-rest');
        if (restInput) log.rest = restInput.value.trim() || '90-120s';
    }

    const notesInput = document.getElementById('atv-edit-notes');
    if (notesInput) log.notes = notesInput.value.trim();

    // Atualiza também o catálogo do Card selecionado (Principal ou Substituto/Variação) no novo formato
    if (!isCardio && card && chosenName) {
        if (!Array.isArray(card.variations)) card.variations = [];
        const oldMain = card.name;
        if (editModalSelectedRole === 'main') {
            card.variations = card.variations.filter(v => v.toLowerCase() !== chosenName.toLowerCase());
            if (oldMain && oldMain.toLowerCase() !== chosenName.toLowerCase()) {
                card.variations = [oldMain, ...card.variations.filter(v => v.toLowerCase() !== oldMain.toLowerCase())];
            }
            card.name = chosenName;
        } else {
            const existsAsMain = card.name.toLowerCase() === chosenName.toLowerCase();
            const existsAsVar = card.variations.some(v => v && v.toLowerCase() === chosenName.toLowerCase());
            /* apply strength target params */
            card.sets = log.sets;
            card.reps = log.reps;
            card.rest = log.rest;
            if (!existsAsMain && !existsAsVar) {
                card.variations.push(chosenName);
            }
        }
        const _unusedBrackets = () => { if (true) {
            }
        }
        if (isCardio) {
            card.sets = log.sets;
            card.reps = log.reps;
            card.rest = log.rest;
        } else {
            if (isCardio) {
            card.reps = log.reps;
            card.rest = log.rest;
        }
        }
        const cardStateKey = `${selectedAtvDate}_${planId}_${slotIdx}`;
        atvUiState.cardInputs[cardStateKey] = {
            ...(atvUiState.cardInputs[cardStateKey] || {}),
            exercise: chosenName
        };
        saveWorkoutCatalogCustomizations();
    }

    saveAtvLogs();
    saveAtvUiState();
    saveData(false, true);
    closeAtvEditModal();
    renderAtvFisicaInteractiveView();
};

window.deleteAtvLogEntry = function(dateStr, logId) {
    if (!atvLogs[dateStr]) return;
    if (confirm('Remover este registro de exercício?')) {
        atvLogs[dateStr] = atvLogs[dateStr].filter(item => item.id !== logId);
        if (atvLogs[dateStr].length === 0) {
            delete atvLogs[dateStr];
        }
        saveAtvLogs();
        saveData(false, true);
        refreshAtvHistoryAndCardBadges();
    }
};

/* Monta uma linha <tr> da tabela de histórico */
function buildAtvLogRowHTML(dateStr, log) {
    let wName = 'Personalizado';
    if (log.planId !== 'custom') {
        const resolvedPlanId = (typeof resolveLogGroupPlanId === 'function') ? resolveLogGroupPlanId(log) : (log.planId || 'upper_a');
        const planObj = WORKOUT_PLAN.find(w => w.planId === resolvedPlanId);
        const hObj = habits.find(h => h.category === 'atv_fisica' && ((log.habitId && h.id === log.habitId) || (resolvedPlanId && h.planId === resolvedPlanId)));
        wName = planObj ? planObj.name : (hObj ? hObj.name : (resolvedPlanId ? resolvedPlanId.replace('_', ' ').toUpperCase() : 'Personalizado'));
    }
    const meta = findExerciseMeta(log.exerciseName, log.habitId);
    const muscleStr = log.muscle || (meta ? meta.muscle : '') || 'Geral';
    const isCardio = log.unit === 'km/h' || log.planId === CARDIO_Z2_PLAN_ID || isCardioExercise(log.exerciseName, muscleStr);
    if (isCardio) {
        wName = CARDIO_Z2_NAME;
    }
    const unitLabel = isCardio ? 'km/h' : 'kg';
    const volumeItem = isCardio ? 0 : calcLogEntryVolume(log);
    const cardioMetrics = isCardio ? calcCardioEntryVolumeKm(log) : null;
    const muscleEmoji = getMuscleEmoji(muscleStr);
    const cardioDurationTxt = log.timerDuration || log.reps || '20 min';
    const setsRepsTxt = isCardio
        ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">⏱️ ${cardioDurationTxt}</span>`
        : `${log.sets || 3}× ${log.reps || '10'} ${log.rest && log.rest !== '-' ? `(${log.rest})` : ''}`;
    const formattedDate = formatDateDDMMYYYY(dateStr);
    const displaySpeedOrWeight = isCardio ? (cardioMetrics.effectiveSpeedKmh || parseFloat(log.weight) || 0) : (parseFloat(log.weight) || 0);
    const weightFormatted = displaySpeedOrWeight.toFixed(2).replace('.', ',');

    const speedOrLoadCellHTML = isCardio
        ? `<div>${weightFormatted} km/h</div><div class="text-[10px] text-zinc-400 font-normal">Pace ${cardioMetrics.paceStr}</div>`
        : `${weightFormatted} ${unitLabel}`;

    const volumeCellHTML = isCardio
        ? `<span class="inline-flex flex-col items-center">
               <span class="text-emerald-700 font-bold">🏃 ${cardioMetrics.volumeText}</span>
               ${cardioMetrics.isMixed ? `<span class="text-[9px] text-emerald-600 font-normal">Misto corrigido (η=0,96)</span>` : ''}
           </span>`
        : `${volumeItem.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg`;

    return `
        <tr class="hover:bg-zinc-50 transition border-b border-zinc-100">
            <td class="py-3 px-3 font-mono text-[11px] text-zinc-500 whitespace-nowrap">${formattedDate}</td>
            <td class="py-3 px-3 font-semibold text-zinc-900 whitespace-nowrap">${wName}</td>
            <td class="py-3 px-3 whitespace-nowrap"><span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-100 text-[11px] font-medium text-zinc-800"><span>${muscleEmoji}</span><span class="truncate max-w-[150px]">${muscleStr}</span></span></td>
            <td class="py-3 px-3 font-medium text-zinc-800">${log.exerciseName}</td>
            <td class="py-3 px-3 font-mono text-center text-xs text-zinc-600">${setsRepsTxt}</td>
            <td class="py-3 px-3 text-center font-mono font-bold text-rose-600">${speedOrLoadCellHTML}</td>
            <td class="py-3 px-3 text-center font-mono font-bold text-zinc-900">${volumeCellHTML}</td>
            <td class="py-3 px-3 text-zinc-500 text-xs italic">${log.notes || '—'}</td>
            <td class="py-3 px-3 text-right whitespace-nowrap">
                <button type="button" onclick="openEditAtvLog('${dateStr}', '${log.id}')" title="Editar exercício" class="p-1.5 text-zinc-600 hover:text-black transition">✏️</button>
                <button type="button" onclick="deleteAtvLogEntry('${dateStr}', '${log.id}')" title="Remover" class="p-1.5 text-rose-500 hover:text-rose-700 transition">🗑️</button>
            </td>
        </tr>`;
}

/* Monta o conteúdo interno da seção de Histórico (#atv-history-section)
 * Item 2: Na tela de Aeróbico (atvSubMode === 'aerobic'), o histórico mostra APENAS os exercícios aeróbicos. */
function buildAtvHistorySectionInnerHTML() {
    const isSyncUser = typeof window.isRegisteredSyncUser === 'function' && window.isRegisteredSyncUser();
    const isAeroOnly = atvSubMode === 'aerobic';
    const rawCurrentLogs = atvLogs[selectedAtvDate] || [];
    const currentLogs = isAeroOnly
        ? rawCurrentLogs.filter(log => log && (log.unit === 'km/h' || isCardioExercise(log.exerciseName, log.muscle)))
        : rawCurrentLogs;
    const hidePrev = !!atvUiState.hidePreviousWorkouts;

    let logsTableHTML = '';
    let totalDayVolumeKg = 0;
    let totalDayAeroKm = 0;

    currentLogs.forEach(log => {
        const isCardio = log.unit === 'km/h' || isCardioExercise(log.exerciseName, log.muscle);
        if (isCardio) {
            totalDayAeroKm += calcCardioEntryVolumeKm(log).avgKm;
        } else {
            totalDayVolumeKg += calcLogEntryVolume(log);
        }
        logsTableHTML += buildAtvLogRowHTML(selectedAtvDate, log);
    });

    // Busca apenas os primeiros 3 exercícios do último treino anterior (respeitando filtro aeróbico quando na aba Aeróbico)
    let recentPreviousRowsHTML = '';
    let lastWorkoutDateFormatted = '';
    const previousDates = Object.keys(atvLogs || {})
        .filter(d => {
            if (d >= selectedAtvDate || !Array.isArray(atvLogs[d]) || atvLogs[d].length === 0) return false;
            if (isAeroOnly) {
                return atvLogs[d].some(l => l && (l.unit === 'km/h' || isCardioExercise(l.exerciseName, l.muscle)));
            }
            return true;
        })
        .sort((a, b) => b.localeCompare(a));

    const hasPreviousWorkout = previousDates.length > 0;
    if (hasPreviousWorkout && !hidePrev) {
        const lastDate = previousDates[0];
        lastWorkoutDateFormatted = formatDateDDMMYYYY(lastDate);
        const dayList = isAeroOnly
            ? (atvLogs[lastDate] || []).filter(l => l && (l.unit === 'km/h' || isCardioExercise(l.exerciseName, l.muscle)))
            : (atvLogs[lastDate] || []);
        const firstThreeExercises = dayList.slice(0, 3);
        firstThreeExercises.forEach(log => {
            recentPreviousRowsHTML += buildAtvLogRowHTML(lastDate, log);
        });
    }

    const emptyLabel = isAeroOnly
        ? 'Nenhum exercício aeróbico registrado nesta data.<br>Utilize o painel aeróbico acima para registrar sua corrida, caminhada ou treino misto.'
        : `Nenhum exercício registrado nesta data.<br>Utilize ${isSyncUser ? 'os cards acima' : 'o card acima'} para registrar suas cargas ou velocidades.`;

    const prevHeaderLabel = isAeroOnly
        ? `🕒 Primeiros 3 Exercícios Aeróbicos do Último Treino (${lastWorkoutDateFormatted})`
        : `🕒 Primeiros 3 Exercícios do Último Treino (${lastWorkoutDateFormatted})`;

    if (currentLogs.length === 0 && !recentPreviousRowsHTML) {
        logsTableHTML = `<tr><td colspan="9" class="py-8 text-center text-zinc-400 text-xs">${emptyLabel}</td></tr>`;
    } else if (currentLogs.length === 0 && recentPreviousRowsHTML) {
        logsTableHTML = `
            <tr><td colspan="9" class="py-4 text-center text-zinc-400 text-xs border-b border-zinc-100">Nenhum registro ${isAeroOnly ? 'aeróbico ' : ''}em ${formatDateDDMMYYYY(selectedAtvDate)}. Abaixo estão os registros do último treino (${lastWorkoutDateFormatted}):</td></tr>
            <tr class="bg-zinc-50/90 border-b border-zinc-200">
                <td colspan="9" class="py-2 px-3 text-[10px] font-mono uppercase tracking-wider font-bold text-zinc-500">${prevHeaderLabel}</td>
            </tr>
            ${recentPreviousRowsHTML}`;
    } else if (recentPreviousRowsHTML) {
        logsTableHTML += `
            <tr class="bg-zinc-50/90 border-b border-zinc-200">
                <td colspan="9" class="py-2 px-3 text-[10px] font-mono uppercase tracking-wider font-bold text-zinc-500">${prevHeaderLabel}</td>
            </tr>
            ${recentPreviousRowsHTML}`;
    }

    const formattedSelectedDate = formatDateDDMMYYYY(selectedAtvDate);

    return `
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-zinc-100 pb-4">
            <div>
                <span class="text-[10px] font-mono uppercase tracking-widest ${isAeroOnly ? 'text-emerald-600' : 'text-zinc-400'} font-bold">${isAeroOnly ? 'HISTÓRICO AERÓBICO DO DIA' : 'HISTÓRICO DO DIA'}</span>
                <h3 class="text-base font-bold text-zinc-900">${isAeroOnly ? `Exercícios Aeróbicos Registrados (${formattedSelectedDate})` : `Exercícios Registrados (${formattedSelectedDate})`}</h3>
            </div>
            <div class="flex flex-wrap items-center gap-2">
                ${hasPreviousWorkout ? `
                    <button type="button" onclick="toggleAtvHidePreviousWorkouts()" class="px-3 py-1.5 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 text-xs font-semibold transition">
                        ${hidePrev ? '👁️ Mostrar último treino (3 exerc.)' : '🙈 Ocultar últimos treinos'}
                    </button>
                ` : ''}
                ${currentLogs.length > 0 && !isAeroOnly && totalDayVolumeKg > 0 ? `
                    <div class="flex items-center gap-2">
                        <span class="text-xs font-mono text-zinc-500">Volume Força:</span>
                        <span class="px-3 py-1 rounded-xl bg-amber-100 text-amber-950 font-mono font-bold text-xs">${totalDayVolumeKg.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg</span>
                    </div>` : ''}
                ${currentLogs.length > 0 && totalDayAeroKm > 0 ? `
                    <div class="flex items-center gap-2">
                        <span class="text-xs font-mono text-zinc-500">Volume Cardio:</span>
                        <span class="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-950 font-mono font-bold text-xs">🏃 ${totalDayAeroKm.toFixed(2).replace('.', ',')} km</span>
                    </div>` : ''}
            </div>
        </div>

        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
                <thead>
                    <tr class="border-b border-zinc-200 text-zinc-400 font-mono uppercase text-[10px]">
                        <th class="py-2.5 px-3">Data</th>
                        <th class="py-2.5 px-3">Atividade</th>
                        <th class="py-2.5 px-3">Grupo Muscular</th>
                        <th class="py-2.5 px-3">Exercício</th>
                        <th class="py-2.5 px-3 text-center">${isAeroOnly ? 'Duração / Intervalo' : 'Séries × REPS / Duração'}</th>
                        <th class="py-2.5 px-3 text-center">${isAeroOnly ? 'Velocidade & Pace' : 'Carga / km/h & Pace'}</th>
                        <th class="py-2.5 px-3 text-center">${isAeroOnly ? 'Volume Estimado (km)' : 'Volume Total (kg / km)'}</th>
                        <th class="py-2.5 px-3">Observações</th>
                        <th class="py-2.5 px-3 text-right">Ações</th>
                    </tr>
                </thead>
                <tbody>${logsTableHTML}</tbody>
            </table>
        </div>
    `;
}

/* Monta a tela dedicada de Aeróbico (Corrida / Caminhada / Misto / Bike / Esteira) dentro de Atividade Física */
function buildAtvAerobicPanelHTML() {
    const modalities = [
        { id: 'Corrida', icon: '🏃', sub: 'Rua ou Pista' },
        { id: 'Caminhada', icon: '🚶', sub: 'Ritmo Leve / Moderado' },
        { id: 'Misto (Caminhada + Corrida)', icon: '🔄', sub: 'Caminhada + Corrida' },
        { id: 'Bike / Ciclismo', icon: '🚴', sub: 'Ergométrica ou Rua' },
        { id: 'Esteira Inclinada', icon: '⚡', sub: 'Cardio Zona 2' },
        { id: 'Escada / Elíptico', icon: '🪜', sub: 'Alta Intensidade' }
    ];

    const modButtonsHTML = modalities.map(m => {
        const active = aeroSelectedModality === m.id;
        const mSt = getAeroModalityTimerState(m.id);
        const hasPausedTime = !mSt.running && (
            (mSt.timerType === 'stopwatch' && mSt.elapsedMs > 0) ||
            (mSt.timerType === 'countdown' && mSt.cdRemainingMs < mSt.cdTotalSec * 1000 && mSt.cdRemainingMs > 0)
        );
        const statusBadge = mSt.running
            ? `<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-mono bg-emerald-500 text-white">● Ativo</span>`
            : (hasPausedTime
                ? `<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-mono bg-amber-500/20 text-amber-500 border border-amber-400/40">⏸ Pausado</span>`
                : '');
        const cls = active
            ? "p-3.5 rounded-2xl bg-black text-white shadow-sm border-2 border-black text-left transition relative"
            : "p-3.5 rounded-2xl bg-zinc-50 hover:bg-zinc-100 text-zinc-800 border border-zinc-200 text-left transition relative";
        return `
            <button type="button" onclick="selectAtvAerobicModality('${m.id}')" class="${cls}">
                <div class="flex items-center justify-between mb-1">
                    <span class="text-xl">${m.icon}</span>
                    ${statusBadge}
                </div>
                <div class="text-xs font-bold leading-snug">${m.id}</div>
                <div class="text-[10px] opacity-75 font-mono mt-0.5">${m.sub}</div>
            </button>
        `;
    }).join('');

    const st = getAeroModalityTimerState(aeroSelectedModality);
    const ai = getAeroModalityInputs(aeroSelectedModality);
    const isMixed = aeroSelectedModality.toLowerCase().includes('misto');
    const isCountdown = st.timerType === 'countdown';
    const curMixRatio = String(ai.mixRunRatio || '0.60');

    const displayMs = isCountdown ? st.cdRemainingMs : st.elapsedMs;
    const timeFormatted = (typeof formatHMS === 'function')
        ? formatHMS(isCountdown && !st.running ? Math.ceil(displayMs / 1000) : Math.floor(displayMs / 1000))
        : '00:00:00';
    const msFormatted = (typeof formatCentiseconds === 'function')
        ? formatCentiseconds(displayMs)
        : '.00';

    const presetRatios = ['0.50', '0.60', '0.75', '0.40', '0.80'];
    const customRatioOption = !presetRatios.includes(curMixRatio)
        ? `<option value="${curMixRatio}" selected>⚡ Medido no Timer: ${Math.round(parseFloat(curMixRatio) * 100)}% Corrida / ${100 - Math.round(parseFloat(curMixRatio) * 100)}% Caminhada</option>`
        : '';

    const mixedFieldsHTML = isMixed ? `
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3 rounded-2xl border border-emerald-200/80">
            <div>
                <label class="block text-[10px] uppercase font-bold text-emerald-700 mb-1">🏃 Vel. Corrida (km/h)</label>
                <input type="text" id="atv-aero-speed" inputmode="numeric" oninput="handleWeightInputMask(this); onAtvAerobicInputChange()" value="${(ai.speedKmh || '').replace(/"/g, '&quot;')}" placeholder="Ex: 10,50" class="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-sm font-mono font-bold text-rose-600 text-center">
            </div>
            <div>
                <label class="block text-[10px] uppercase font-bold text-emerald-700 mb-1">🚶 Vel. Caminhada (km/h)</label>
                <input type="text" id="atv-aero-walk-speed" inputmode="numeric" oninput="handleWeightInputMask(this); onAtvAerobicInputChange()" value="${(ai.walkSpeedKmh || '').replace(/"/g, '&quot;')}" placeholder="Ex: 5,50" class="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-sm font-mono font-bold text-indigo-600 text-center">
            </div>
            <div class="sm:col-span-2">
                <label class="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Proporção do Intervalo (Corrida / Caminhada • Fator η = 0,96)</label>
                <select id="atv-aero-mix-ratio" onchange="onAtvAerobicInputChange()" class="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-mono font-semibold text-zinc-900">
                    ${customRatioOption}
                    <option value="0.50" ${curMixRatio === '0.50' ? 'selected' : ''}>50% Corrida / 50% Caminhada (Ex: 2 min : 2 min)</option>
                    <option value="0.60" ${curMixRatio === '0.60' ? 'selected' : ''}>60% Corrida / 40% Caminhada (Ex: 3 min : 2 min)</option>
                    <option value="0.75" ${curMixRatio === '0.75' ? 'selected' : ''}>75% Corrida / 25% Caminhada (Ex: 3 min : 1 min)</option>
                    <option value="0.40" ${curMixRatio === '0.40' ? 'selected' : ''}>40% Corrida / 60% Caminhada (Ex: 2 min : 3 min)</option>
                    <option value="0.80" ${curMixRatio === '0.80' ? 'selected' : ''}>80% Corrida / 20% Caminhada (Ex: 4 min : 1 min)</option>
                </select>
            </div>
        </div>
        <div>
            <label class="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Duração ou Intervalo de Tempo (min)</label>
            <input type="text" id="atv-aero-minutes" oninput="onAtvAerobicInputChange()" value="${(ai.manualMin || '').replace(/"/g, '&quot;')}" placeholder="Clique em '✓ Concluir' no timer ou digite (Ex: 25 ou 20-30)" class="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-sm font-mono font-bold text-zinc-900 text-center transition">
        </div>
    ` : `
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
                <label class="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Velocidade Média (km/h)</label>
                <input type="text" id="atv-aero-speed" inputmode="numeric" oninput="handleWeightInputMask(this); onAtvAerobicInputChange()" value="${(ai.speedKmh || '').replace(/"/g, '&quot;')}" placeholder="Ex: 9,50" class="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-sm font-mono font-bold text-rose-600 text-center">
            </div>
            <div>
                <label class="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Duração / Intervalo (min)</label>
                <input type="text" id="atv-aero-minutes" oninput="onAtvAerobicInputChange()" value="${(ai.manualMin || '').replace(/"/g, '&quot;')}" placeholder="Conclua o timer ou Ex: 15-20" class="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-sm font-mono font-bold text-zinc-900 text-center transition">
            </div>
        </div>
    `;

    // Seletor de Fase (Corrida <-> Caminhada) exclusivo para o Timer do Misto
    const runTimeStr = (typeof formatHMS === 'function') ? formatHMS(Math.floor(st.runElapsedMs / 1000)).slice(3) : '00:00';
    const walkTimeStr = (typeof formatHMS === 'function') ? formatHMS(Math.floor(st.walkElapsedMs / 1000)).slice(3) : '00:00';
    const mixedTimerPhaseBarHTML = isMixed ? `
        <div class="w-full bg-zinc-900/90 border border-zinc-800 rounded-2xl p-2.5 flex flex-col gap-2">
            <div class="flex items-center justify-between text-[10px] font-mono text-zinc-400 px-1">
                <span>RITMO ATUAL NO TIMER MISTO:</span>
                <span>🏃 <b id="atv-aero-mixed-run-time" class="text-emerald-400">${runTimeStr}</b> • 🚶 <b id="atv-aero-mixed-walk-time" class="text-indigo-400">${walkTimeStr}</b></span>
            </div>
            <div class="grid grid-cols-2 gap-2">
                <button type="button" onclick="toggleAtvAeroMixedPhase('run')" class="py-1.5 px-3 rounded-xl text-xs font-bold transition ${st.mixedPhase === 'run' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-zinc-800 text-zinc-400 hover:text-white'}">
                    🏃 Correndo ${st.mixedPhase === 'run' ? '●' : ''}
                </button>
                <button type="button" onclick="toggleAtvAeroMixedPhase('walk')" class="py-1.5 px-3 rounded-xl text-xs font-bold transition ${st.mixedPhase === 'walk' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-zinc-800 text-zinc-400 hover:text-white'}">
                    🚶 Caminhando ${st.mixedPhase === 'walk' ? '●' : ''}
                </button>
            </div>
        </div>
    ` : '';

    // Atalhos de tempo para o modo Regressivo
    const countdownPresetsHTML = isCountdown ? `
        <div class="flex flex-wrap items-center justify-center gap-1.5 w-full">
            ${[10, 15, 20, 30, 45, 60].map(m => {
                const isSel = Math.round(st.cdTotalSec / 60) === m;
                return `<button type="button" onclick="setAtvAerobicCountdownPreset(${m})" class="px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold transition ${isSel ? 'bg-emerald-500 text-black' : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'}">${m} min</button>`;
            }).join('')}
        </div>
    ` : '';

    const hasAnyProgress = st.running ||
        (st.timerType === 'stopwatch' && st.elapsedMs > 0) ||
        (st.timerType === 'countdown' && st.cdRemainingMs < st.cdTotalSec * 1000);

    return `
        <div class="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm space-y-6">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-zinc-100 pb-4">
                <div>
                    <span class="text-[10px] font-mono uppercase tracking-widest text-emerald-600 font-bold">TREINO AERÓBICO &amp; CARDIO (TIMERS INDEPENDENTES)</span>
                    <h3 class="text-lg font-bold text-zinc-900">Selecione a Modalidade e Contabilize o Tempo</h3>
                    <p class="text-xs text-zinc-500 mt-0.5">Cada exercício possui seu próprio <b>Cronômetro</b> e <b>Regressivo</b> independente. Clique em <b>✓ Concluir</b> no timer para enviar o tempo automaticamente ao campo de Duração.</p>
                </div>
                <span class="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-mono font-semibold">
                    Modalidade: ${aeroSelectedModality}
                </span>
            </div>

            <!-- 1. Escolha da Modalidade Aeróbica (cada uma com seu próprio timer independente) -->
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                ${modButtonsHTML}
            </div>

            <!-- 2. Timer Independente (Cronômetro | Regressivo) + Campos de Velocidade (km/h), Pace e Duração -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                <div class="bg-zinc-950 text-white rounded-3xl p-6 flex flex-col items-center justify-between space-y-4 border border-zinc-800 shadow-lg">
                    <!-- Cabeçalho + Seletor Cronômetro vs Regressivo -->
                    <div class="w-full flex flex-col sm:flex-row items-center justify-between gap-2">
                        <div class="inline-flex bg-zinc-900 p-1 rounded-2xl border border-zinc-800 w-full sm:w-auto">
                            <button type="button" onclick="setAtvAerobicTimerType('stopwatch')" class="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-bold transition ${!isCountdown ? 'bg-emerald-500 text-black shadow-xs' : 'text-zinc-400 hover:text-white'}">
                                ⏱️ Cronômetro
                            </button>
                            <button type="button" onclick="setAtvAerobicTimerType('countdown')" class="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-bold transition ${isCountdown ? 'bg-emerald-500 text-black shadow-xs' : 'text-zinc-400 hover:text-white'}">
                                ⏳ Regressivo
                            </button>
                        </div>
                        <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono ${st.running ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'}">
                            ${st.running ? 'Contando...' : (hasAnyProgress ? 'Pausado' : `Pronto • ${aeroSelectedModality}`)}
                        </span>
                    </div>

                    <!-- Visor do Timer (editável direto no modo Regressivo quando pausado) -->
                    <div class="py-2 flex flex-col items-center justify-center w-full">
                        <div class="flex items-baseline justify-center select-none">
                            ${isCountdown && !st.running ? `
                                <input id="atv-aero-timer-display" type="text" value="${timeFormatted}"
                                    inputmode="numeric"
                                    onfocus="this.select()"
                                    oninput="onAtvAerobicCountdownDirectInput(this)"
                                    onblur="onAtvAerobicCountdownDirectBlur(this)"
                                    onkeydown="if (event.key === 'Enter') { event.preventDefault(); this.blur(); }"

                                    title="Clique para digitar o tempo regressivo (HH:MM:SS ou MM:SS)"
                                    class="w-56 sm:w-64 bg-transparent text-center text-4xl sm:text-5xl font-mono font-extrabold tracking-tight text-white border-b border-dashed border-zinc-700 focus:border-emerald-400 focus:outline-none">
                            ` : `
                                <span id="atv-aero-timer-display" class="text-4xl sm:text-5xl font-mono font-extrabold tracking-tight">${timeFormatted}</span>
                                <span id="atv-aero-timer-ms" class="text-lg sm:text-xl font-mono font-bold text-emerald-400 ml-1">${msFormatted}</span>
                            `}
                        </div>
                        ${isCountdown && !st.running ? `<span class="text-[10px] font-mono text-zinc-400 mt-1">Toque nos números para digitar ou escolha abaixo</span>` : ''}
                    </div>

                    ${countdownPresetsHTML}
                    ${mixedTimerPhaseBarHTML}

                    ${st.concludedDurationStr ? `
                        <div class="w-full px-3 py-2 rounded-xl bg-emerald-950/80 border border-emerald-700/80 text-emerald-300 text-[11px] font-mono text-center">
                            ✓ Tempo concluído (<b>${st.concludedDurationStr}</b>) preenchido automaticamente em Duração!
                        </div>
                    ` : ''}

                    <!-- Botões do Timer: Zerar | Começar/Pausar | ✓ Concluir (envia para o campo Duração) -->
                    <div class="grid grid-cols-3 gap-2.5 w-full pt-1">
                        <button type="button" onclick="resetAtvAerobicStopwatch()" class="py-3 px-2 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition">
                            Zerar
                        </button>
                        <button type="button" onclick="toggleAtvAerobicStopwatch()" class="py-3 px-2 rounded-2xl ${st.running ? 'bg-amber-600 hover:bg-amber-500' : 'bg-emerald-600 hover:bg-emerald-500'} text-white text-xs font-bold transition shadow-md">
                            ${st.running ? '⏸ Pausar' : (hasAnyProgress ? '▶ Continuar' : '▶ Começar')}
                        </button>
                        <button type="button" onclick="concludeAtvAerobicTimer()" class="py-3 px-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md" title="Finaliza a contagem e preenche automaticamente o campo Duração">
                            ✓ Concluir
                        </button>
                    </div>
                </div>

                <form onsubmit="submitAtvAerobicSession(event)" class="bg-zinc-50 border border-zinc-200 rounded-3xl p-5 flex flex-col justify-between space-y-4">
                    <div class="space-y-4">
                        <div class="flex flex-wrap items-center justify-between gap-2">
                            <h4 class="text-sm font-bold text-zinc-900">Dados da Sessão (${aeroSelectedModality})</h4>
                            <span id="atv-aero-distance-preview" class="text-[11px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">Informe km/h + tempo</span>
                        </div>

                        ${mixedFieldsHTML}

                        <div>
                            <label class="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Observações (Inclinação, FC, Zona)</label>
                            <input type="text" id="atv-aero-notes" oninput="onAtvAerobicInputChange()" value="${(ai.notes || '').replace(/"/g, '&quot;')}" placeholder="Ex: Inclinação 4%, FC 135 bpm" class="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-800">
                        </div>
                    </div>

                    <button type="submit" class="w-full py-3 bg-black hover:bg-zinc-800 text-white rounded-2xl text-xs font-bold transition shadow-sm">
                        💾 Registrar ${aeroSelectedModality} no Histórico
                    </button>
                </form>
            </div>
        </div>
    `;
}

/* ------------------------------------------------------------------
 * Renderizador Principal da View de Atividade Física
 * ------------------------------------------------------------------ */
function renderAtvFisicaInteractiveView() {
    const container = document.getElementById('atv-fisica-cards-grid');
    if (!container) return;

    loadAtvLogs();

    const isSyncUser = typeof window.isRegisteredSyncUser === 'function' && window.isRegisteredSyncUser();
    const todayIso = getLocalISODate();
    const yesterdayIso = getYesterdayISODate();
    const isTodaySelected = selectedAtvDate === todayIso;
    const isYesterdaySelected = selectedAtvDate === yesterdayIso;

    const dow = new Date(selectedAtvDate + 'T12:00:00').getDay();
    const dayIndex = (dow + 6) % 7;
    const dayRef = weekDays[dayIndex] || weekDays[0];

    const scheduledEvents = Array.isArray(calendarEvents) ? calendarEvents.filter(ev => ev.dayIndex === dayIndex) : [];
    const scheduledNames = [];
    scheduledEvents.forEach(ev => {
        const evHabit = habits.find(h => h.id === ev.habitId && h.category === 'atv_fisica');
        if (evHabit && !scheduledNames.includes(evHabit.name)) {
            scheduledNames.push(evHabit.name);
        }
    });
    const scheduledPlanName = scheduledNames.join(' + ');

    const agendaHintHTML = scheduledPlanName
        ? `📅 Agenda de ${dayRef.shortName}: <strong class="text-zinc-900">${scheduledPlanName}</strong>`
        : `📅 Nenhum treino específico agendado para ${dayRef.shortName}.`;

    const workoutOptions = [
        { id: 'upper_a', label: 'Upper A', tag: 'Superiores A' },
        { id: 'lower_a', label: 'Lower A', tag: 'Inferiores A' },
        { id: 'upper_b', label: 'Upper B', tag: 'Superiores B' },
        { id: 'lower_b', label: 'Lower B', tag: 'Inferiores B' }
    ];

    const currentWorkout = WORKOUT_PLAN.find(w => w.planId === selectedWorkoutPlanId) || WORKOUT_PLAN[0];
    const currentLogs = atvLogs[selectedAtvDate] || [];

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
        const cardIsCardio = isCardioExercise(ex.name, ex.muscle);
        const dayLoggedCount = currentLogs.filter(l => {
            if (!l) return false;
            if (l.exerciseName === ex.name || (ex.variations && ex.variations.includes(l.exerciseName))) return true;
            if (cardIsCardio && (l.unit === 'km/h' || isCardioExercise(l.exerciseName, l.muscle))) return true;
            return false;
        }).length;

        const savedCardState = atvUiState.cardInputs[`${selectedAtvDate}_${currentWorkout.planId}_${idx}`] || {};
        const selectedExName = savedCardState.exercise && (savedCardState.exercise === ex.name || (ex.variations && ex.variations.includes(savedCardState.exercise)))
            ? savedCardState.exercise
            : ex.name;

        const isCardio = isCardioExercise(selectedExName, ex.muscle);
        const unitShort = isCardio ? 'km/h' : 'kg';
        const inputLabelText = isCardio ? 'Velocidade (km/h)' : 'Carga (kg)';

        const weightedRef = calcWeightedExerciseRefLoad([selectedExName, ex.name, ...(ex.variations || [])], ex.load);
        const suggestedLoad = weightedRef !== null ? formatWeightNumber(weightedRef) : '';

        const weightValueToUse = savedCardState.weight || '';
        const notesValueToUse = savedCardState.notes || '';

        // Na lista do dropdown do exercício, a ref da carga fica OCULTA e aparece só no título do exercício quando selecionado
        // Para o card de Cardio Zona 2, desassocia de Upper/Lower e mostra simplesmente 'Cardio Zona 2'
        const mainOptionLabel = cardIsCardio ? CARDIO_Z2_NAME : `${currentWorkout.name} - ${ex.name}`;
        const selectOptionsHTML = [
            `<option value="${ex.name}" ${selectedExName === ex.name ? 'selected' : ''}>${mainOptionLabel}</option>`,
            ...(ex.variations || []).map(v => {
                return `<option value="${v}" ${selectedExName === v ? 'selected' : ''}>↳ ${v}</option>`;
            })
        ].join('');

        const baseCardTitle = isCardio
            ? (selectedExName === CARDIO_Z2_NAME ? CARDIO_Z2_NAME : `${CARDIO_Z2_NAME} - ${selectedExName}`)
            : `${currentWorkout.name} - ${selectedExName}`;
        const cardTitleText = `${baseCardTitle}${suggestedLoad ? ` (ref. ${suggestedLoad} ${unitShort})` : ''}`;

        // Item 6: No card do sistema cardiovascular, retirar o ícone de alvo REPS e deixar apenas o ícone de tempo e algum que indique km/h
        const cardBadgesHTML = isCardio
            ? `
                <span class="px-2.5 py-1 rounded-xl bg-zinc-100 text-zinc-800 font-semibold">⏱️ ${ex.reps || '15-20 min'}</span>
                <span id="atv-card-ref-badge-${idx}" class="px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold">🏃 ${suggestedLoad ? `ref: ${suggestedLoad} km/h` : 'km/h'}</span>
            `
            : `
                <span class="px-2.5 py-1 rounded-xl bg-zinc-100 text-zinc-800 font-semibold">🎯 ${ex.sets}× ${ex.reps}</span>
                <span class="px-2.5 py-1 rounded-xl bg-zinc-100 text-zinc-700">⏱️ ${ex.rest}</span>
                <span id="atv-card-ref-badge-${idx}" class="${suggestedLoad ? '' : 'hidden '}px-2.5 py-1 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 font-bold">ref: ${suggestedLoad} ${unitShort}</span>
            `;

        return `
            <div class="w-[300px] sm:w-[335px] shrink-0 snap-center bg-white border border-zinc-200/90 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-zinc-300 transition">
                <div class="space-y-3">
                    <div class="flex items-start gap-3">
                        <div class="w-11 h-11 rounded-2xl bg-zinc-100 flex items-center justify-center text-xl shrink-0">
                            ${muscleEmoji}
                        </div>
                        <div class="min-w-0 flex-1">
                            <span class="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold block truncate" title="${ex.muscle}">${ex.muscle}</span>
                            <h4 id="atv-card-title-${idx}" class="text-xs sm:text-sm font-bold text-zinc-900 line-clamp-2 leading-snug" title="${cardTitleText}">${cardTitleText}</h4>
                        </div>
                    </div>

                    <div class="flex flex-wrap gap-1.5 text-[11px] font-mono">
                        ${cardBadgesHTML}
                    </div>

                    <div>
                        <label class="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Exercício / Variação</label>
                        <select id="atv-card-ex-${idx}" onchange="onAtvCardFieldChange(${idx}, true)" class="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-900 focus:bg-white focus:border-black transition">
                            ${selectOptionsHTML}
                        </select>
                    </div>

                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label id="atv-card-weight-label-${idx}" class="block text-[10px] uppercase font-bold text-zinc-400 mb-1">${inputLabelText}</label>
                            <input type="text" id="atv-card-weight-${idx}" inputmode="numeric" oninput="handleWeightInputMask(this); onAtvCardFieldChange(${idx}, false)" value="${weightValueToUse}" placeholder="0,00" class="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-sm font-mono font-bold text-rose-600 text-center focus:bg-white focus:border-rose-500 transition">
                        </div>
                        <div>
                            <label class="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Observações</label>
                            <input type="text" id="atv-card-notes-${idx}" oninput="onAtvCardFieldChange(${idx}, false)" value="${notesValueToUse.replace(/"/g, '&quot;')}" placeholder="Ex: RPE 8" class="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-800 focus:bg-white transition">
                        </div>
                    </div>
                </div>

                <div class="pt-2 border-t border-zinc-100 space-y-1.5">
                    <button type="button" onclick="submitAtvCardLog(${idx})" class="w-full py-2.5 bg-black hover:bg-zinc-800 text-white rounded-2xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5">
                        <span>+ Registrar Exercício</span>
                    </button>
                    <div id="atv-card-logged-badge-${idx}">
                        ${dayLoggedCount > 0 ? `<div class="text-[10px] text-center font-mono text-emerald-600 font-semibold">✓ ${dayLoggedCount} registro(s) nesta data</div>` : ''}
                    </div>
                </div>
            </div>`;
    }).join('');

    const ci = atvUiState.customInputs || {};
    const curRole = ci.role === 'main' ? 'main' : 'variation';
    const hasCardioSlotInWorkout = currentWorkout.exercises.some(ex => isCardioExercise(ex.name, ex.muscle));
    let muscleSlotOptionsHTML = currentWorkout.exercises.map((ex, sIdx) => {
        const isSel = String(ci.slotIndex || '0') === String(sIdx);
        return `<option value="${sIdx}" ${isSel ? 'selected' : ''}>${ex.muscle} (Atual: ${ex.name})</option>`;
    }).join('');
    if (!hasCardioSlotInWorkout) {
        const isCardioSel = String(ci.slotIndex) === 'cardio';
        muscleSlotOptionsHTML += `<option value="cardio" ${isCardioSel ? 'selected' : ''}>Sistema Cardiovascular / Resistência (Cardio)</option>`;
    }

    const isCustomCardioSelected = isSelectedCustomSlotCardio(ci.slotIndex || '0');

    // Card de Cadastro de Exercício associado ao Grupo Muscular (Principal ou Substituto/Variação)
    // Item 1: 'REPS' apenas
    // Item 2: se for selecionado cardiovascular, aparecer somente Duração, sem REPS e nem Séries
    // Item 3: campos vazios para preenchimento
    const customExerciseCardHTML = `
        <div class="${isSyncUser ? 'w-[315px] sm:w-[350px] shrink-0 snap-center bg-zinc-50/90 border-2 border-dashed border-zinc-300' : 'w-full max-w-md bg-white border border-zinc-200 shadow-xs'} rounded-3xl p-5 flex flex-col justify-between space-y-3">
            <form onsubmit="submitCustomAtvLog(event)" class="space-y-3">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-lg shrink-0">
                        ➕
                    </div>
                    <div>
                        <span class="text-[10px] font-mono uppercase tracking-wider text-rose-600 font-bold block">CADASTRAR NO GRUPO MUSCULAR</span>
                        <h4 class="text-sm font-bold text-zinc-900">Novo Exercício (${currentWorkout.name})</h4>
                    </div>
                </div>

                <div>
                    <label class="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Nome do Exercício</label>
                    <input type="text" id="atv-custom-name" oninput="onAtvCustomFieldChange(false)" value="${(ci.name || '').replace(/"/g, '&quot;')}" required placeholder="${isCustomCardioSelected ? 'Ex: Corrida na Esteira / Caminhada' : 'Ex: Supino Reto Barra'}" class="w-full bg-white border border-zinc-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-zinc-900">
                </div>

                <div>
                    <label class="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Grupo Muscular Associado (Card)</label>
                    <select id="atv-custom-muscle-slot" onchange="onAtvCustomFieldChange(true)" class="w-full bg-white border border-zinc-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-zinc-900">
                        ${muscleSlotOptionsHTML}
                    </select>
                </div>

                <!-- Campos para grupos musculares de Força (Séries, REPS, Descanso) - vazios para preenchimento -->
                <div id="atv-custom-strength-fields" class="${isCustomCardioSelected ? 'hidden ' : ''}grid grid-cols-3 gap-1.5">
                    <div>
                        <label class="block text-[9px] uppercase font-bold text-zinc-500 mb-0.5">Séries</label>
                        <input type="number" id="atv-custom-sets" oninput="onAtvCustomFieldChange(false)" value="${(ci.sets || '').replace(/"/g, '&quot;')}" min="1" max="20" placeholder="Ex: 3" class="w-full bg-white border border-zinc-200 rounded-xl px-2 py-1.5 text-xs font-mono text-center font-bold">
                    </div>
                    <div>
                        <label class="block text-[9px] uppercase font-bold text-zinc-500 mb-0.5">REPS</label>
                        <input type="text" id="atv-custom-reps" oninput="onAtvCustomFieldChange(false)" value="${(ci.reps || '').replace(/"/g, '&quot;')}" placeholder="Ex: 8-12" class="w-full bg-white border border-zinc-200 rounded-xl px-1.5 py-1.5 text-xs font-mono text-center font-semibold">
                    </div>
                    <div>
                        <label class="block text-[9px] uppercase font-bold text-zinc-500 mb-0.5">Descanso</label>
                        <input type="text" id="atv-custom-rest" oninput="onAtvCustomFieldChange(false)" value="${(ci.rest || '').replace(/"/g, '&quot;')}" placeholder="Ex: 90s" class="w-full bg-white border border-zinc-200 rounded-xl px-1.5 py-1.5 text-xs font-mono text-center font-semibold">
                    </div>
                </div>

                <!-- Campo exclusivo quando selecionado Cardiovascular: somente Duração (sem REPS e nem Séries) -->
                <div id="atv-custom-cardio-fields" class="${isCustomCardioSelected ? '' : 'hidden '}">
                    <label class="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Duração</label>
                    <input type="text" id="atv-custom-duration" oninput="onAtvCustomFieldChange(false)" value="${(ci.duration || '').replace(/"/g, '&quot;')}" placeholder="Ex: 20 min" class="w-full bg-white border border-zinc-200 rounded-xl px-3 py-1.5 text-xs font-mono text-center font-semibold text-zinc-900">
                </div>

                <div>
                    <label class="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Classificação no Card</label>
                    <div class="flex gap-1.5">
                        <button type="button" id="btn-custom-role-main" onclick="setAtvCustomRole('main')" class="${curRole === 'main' ? 'flex-1 py-2 px-2 rounded-xl bg-black text-white text-[11px] font-bold transition shadow-xs' : 'flex-1 py-2 px-2 rounded-xl bg-white border border-zinc-200 text-zinc-600 hover:text-black text-[11px] font-semibold transition'}">
                            ⭐ Principal
                        </button>
                        <button type="button" id="btn-custom-role-variation" onclick="setAtvCustomRole('variation')" class="${curRole === 'variation' ? 'flex-1 py-2 px-2 rounded-xl bg-black text-white text-[11px] font-bold transition shadow-xs' : 'flex-1 py-2 px-2 rounded-xl bg-white border border-zinc-200 text-zinc-600 hover:text-black text-[11px] font-semibold transition'}">
                            🔄 Substituto
                        </button>
                    </div>
                    <p id="atv-custom-role-hint" class="text-[10px] text-zinc-500 mt-1 leading-snug">
                        ${curRole === 'main'
                            ? '⭐ Será o novo exercício principal do card; o antigo principal virará substituto/variação.'
                            : '🔄 Será adicionado como substituto/variação na lista do card do grupo muscular.'}
                    </p>
                </div>

                <button type="submit" class="w-full py-2.5 bg-zinc-900 hover:bg-black text-white rounded-2xl text-xs font-bold transition shadow-xs">
                    + Cadastrar no Card do Grupo Muscular
                </button>
            </form>
        </div>
    `;

    const completionBallHTML = buildCompletionBallHTML(currentWorkout, selectedAtvDate);

    const strengthSectionHTML = isSyncUser ? `
            <!-- 2. SELETOR DE ATIVIDADE (UPPER / LOWER A / B) + BOLA VERDE 100% COMPLETO -->
            <div class="bg-white border border-zinc-200 rounded-3xl p-5 shadow-sm space-y-4">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div class="flex items-center gap-3.5">
                        <div id="atv-completion-ball-container">
                            ${completionBallHTML}
                        </div>
                        <div>
                            <span class="text-[10px] font-mono uppercase tracking-widest text-rose-600 font-bold">PLANO DE TREINO (FORÇA)</span>
                            <h3 class="text-lg font-bold text-zinc-900">Selecione o Treino do Dia</h3>
                        </div>
                    </div>
                    <div class="flex flex-wrap gap-2">
                        ${workoutSelectorButtonsHTML}
                    </div>
                </div>

                <!-- 3. CARROSSEL DE EXERCÍCIOS (SLIDER E SWIPEABLE CARDS) -->
                <div class="pt-2">
                    <div class="flex flex-wrap justify-between items-center gap-2 mb-3">
                        <div class="flex items-center gap-2">
                            <span class="text-xs font-bold uppercase tracking-wider text-zinc-700">Exercícios • ${currentWorkout.name}</span>
                            <span class="text-[11px] font-mono text-zinc-400">(${currentWorkout.exercises.length} grupos musculares)</span>
                        </div>
                        <div class="flex items-center gap-1.5">
                            <button type="button" onclick="scrollAtvCarouselToEdge('start')" class="px-2.5 h-8 rounded-full border border-zinc-200 bg-white hover:bg-zinc-100 flex items-center justify-center text-zinc-700 text-[11px] font-mono font-bold shadow-xs transition" title="Ir para o primeiro card">« Primeiro</button>
                            <button type="button" onclick="scrollAtvCarousel(-1)" class="w-8 h-8 rounded-full border border-zinc-200 bg-white hover:bg-zinc-100 flex items-center justify-center text-zinc-700 text-sm font-bold shadow-xs transition" title="Card anterior">‹</button>
                            <button type="button" onclick="scrollAtvCarousel(1)" class="w-8 h-8 rounded-full border border-zinc-200 bg-white hover:bg-zinc-100 flex items-center justify-center text-zinc-700 text-sm font-bold shadow-xs transition" title="Próximo card">›</button>
                            <button type="button" onclick="scrollAtvCarouselToEdge('end')" class="px-2.5 h-8 rounded-full border border-zinc-200 bg-white hover:bg-zinc-100 flex items-center justify-center text-zinc-700 text-[11px] font-mono font-bold shadow-xs transition" title="Ir para o card de cadastro">+ Cadastrar »</button>
                        </div>
                    </div>

                    <div id="atv-carousel-track" onscroll="onAtvCarouselScroll(this)" class="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scroll-smooth scrollbar-thin px-1">
                        ${carouselCardsHTML}
                        ${customExerciseCardHTML}
                    </div>
                </div>
            </div>
    ` : `
            <div class="bg-zinc-50/70 border border-zinc-200 rounded-3xl p-5 shadow-sm flex flex-col items-center">
                ${customExerciseCardHTML}
            </div>
    `;

    const activeSectionHTML = atvSubMode === 'aerobic'
        ? buildAtvAerobicPanelHTML()
        : strengthSectionHTML;

    const todayBtnClass = isTodaySelected
        ? "px-3 py-1.5 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold shadow-xs transition"
        : "px-3 py-1.5 bg-white border border-zinc-200 text-zinc-700 hover:text-black rounded-xl text-xs font-semibold shadow-xs transition";

    const yesterdayBtnClass = isYesterdaySelected
        ? "px-3 py-1.5 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold shadow-xs transition"
        : "px-3 py-1.5 bg-white border border-zinc-200 text-zinc-700 hover:text-black rounded-xl text-xs font-semibold shadow-xs transition";

    const strengthTabCls = atvSubMode === 'strength'
        ? "px-4 py-2 rounded-full bg-black text-white text-xs font-bold shadow-xs transition"
        : "px-4 py-2 rounded-full text-zinc-600 hover:text-black text-xs font-semibold transition";
    const aerobicTabCls = atvSubMode === 'aerobic'
        ? "px-4 py-2 rounded-full bg-black text-white text-xs font-bold shadow-xs transition"
        : "px-4 py-2 rounded-full text-zinc-600 hover:text-black text-xs font-semibold transition";

    container.innerHTML = `
        <div class="space-y-6">
            <!-- 1. BARRA DE CONTROLE: DATA + SELETOR FORÇA vs AERÓBICO + AGENDA -->
            <div class="bg-zinc-50 p-4 rounded-3xl border border-zinc-200 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div class="flex flex-wrap items-center gap-2">
                    <span class="text-xs font-bold text-zinc-700 uppercase font-mono">Data:</span>
                    <input type="date" id="atv-date-picker" value="${selectedAtvDate}" onchange="setAtvDate(this.value)" class="bg-white border border-zinc-300 rounded-xl px-3 py-1.5 text-xs font-mono font-semibold text-zinc-900 shadow-xs">
                    <button type="button" onclick="setTodayAtvDate()" class="${todayBtnClass}">Hoje</button>
                    <button type="button" onclick="setYesterdayAtvDate()" class="${yesterdayBtnClass}">Ontem</button>
                </div>

                <!-- Seletor de Modalidade: Força | Aeróbico -->
                <div class="inline-flex bg-white p-1 rounded-full border border-zinc-200 shadow-2xs">
                    <button type="button" onclick="setAtvSubMode('strength')" class="${strengthTabCls}">🏋️ Força</button>
                    <button type="button" onclick="setAtvSubMode('aerobic')" class="${aerobicTabCls}">🏃 Aeróbico</button>
                </div>

                <div class="text-xs font-mono text-zinc-500">
                    ${agendaHintHTML}
                </div>
            </div>

            ${activeSectionHTML}

            <!-- 4. HISTÓRICO DE EXERCÍCIOS REGISTRADOS PARA ESTA DATA -->
            <div id="atv-history-section" class="bg-white border border-zinc-200 rounded-3xl p-5 shadow-sm space-y-4">
                ${buildAtvHistorySectionInnerHTML()}
            </div>
        </div>
    `;

    const newTrack = document.getElementById('atv-carousel-track');
    if (newTrack && atvUiState.carouselScrollLeft > 0) {
        newTrack.style.scrollBehavior = 'auto';
        newTrack.scrollLeft = atvUiState.carouselScrollLeft;
        requestAnimationFrame(() => {
            if (newTrack) newTrack.style.scrollBehavior = '';
        });
    }

    refreshIcons();
}

// ============================================================================
// assets/js/storage.js — Persistência Local (SafeStorage) + Sync GitHub Gist
// ============================================================================

const STORAGE_KEY = 'habit_quant_pro_v9_clean';
const GIST_TOKEN_KEY = 'hq_gist_token';
const GIST_ID_KEY = 'hq_gist_id';
const GIST_FILENAME = 'habitquant_data.json';

// Wrapper resiliente contra bloqueios de localStorage em WebViews/Iframes
const SafeStorage = {
    _memoryFallback: {},
    getItem(key) {
        try {
            return window.localStorage.getItem(key);
        } catch (e) {
            return this._memoryFallback[key] || null;
        }
    },
    setItem(key, value) {
        try {
            window.localStorage.setItem(key, value);
        } catch (e) {
            this._memoryFallback[key] = String(value);
        }
    },
    removeItem(key) {
        try {
            window.localStorage.removeItem(key);
        } catch (e) {
            delete this._memoryFallback[key];
        }
    }
};

// Dados originais extraídos da sua planilha do Google Drive:
// "Planejamento de Treino e Adesão - Upper/Lower"
function getDefaultWorkoutData() {
    return {
        weeklyPlan: [
            { day: "Segunda-feira", window: "15h30–17h00", split: "Upper A", target: "Peitoral, Costas, Deltóide Lateral, Tríceps/Bíceps", cardio: "-", focus: "Hipertrofia" },
            { day: "Terça-feira", window: "16h00–17h30", split: "Lower A", target: "Quadríceps, Glúteos, Isquiotibiais, Panturrilhas", cardio: "15-20 min zona 2", focus: "Hipertrofia + Cardio" },
            { day: "Quarta-feira", window: "-", split: "Descanso", target: "-", cardio: "Caminhada livre", focus: "Recuperação ativa" },
            { day: "Quinta-feira", window: "16h00–17h30", split: "Upper B", target: "Costas, Deltóide ant/médio, Peitoral, Bíceps/Tríceps", cardio: "-", focus: "Hipertrofia" },
            { day: "Sexta-feira", window: "-", split: "Descanso", target: "-", cardio: "-", focus: "Recuperação" },
            { day: "Sábado", window: "15h00–16h30", split: "Lower B", target: "Quadríceps, Posterior de Coxa, Glúteos, Panturrilha", cardio: "20 min zona 2", focus: "Hipertrofia + Cardio" },
            { day: "Domingo", window: "-", split: "Descanso", target: "-", cardio: "-", focus: "Recuperação" }
        ],
        rollingSplitProtocol: "Se perder um dia de treino, não pule. Apenas faça o treino perdido no próximo dia disponível e empurre os outros para frente. Exemplo: Faltou no Upper B na quinta? Faça na sexta ou sábado. Mantenha a sequência.",
        templates: {
            "Upper A": [
                { exercise: "Supino Inclinado Halteres", muscle: "Peitoral (ênfase clavicular/superior)", substitutes: "Supino Inclinado Smith ou Máquina articulada inclinada", sets: 3, reps: "8-12", rest: "90-120s", defaultLoad: 30 },
                { exercise: "Remada Peito Apoiado", muscle: "Costas (Dorsais / Romboides)", substitutes: "Remada baixa no cabo (pegada neutra) ou Remada unilateral com halter (serrote)", sets: 3, reps: "8-12", rest: "90-120s", defaultLoad: 35 },
                { exercise: "Elevação Lateral", muscle: "Deltóide Lateral", substitutes: "Elevação lateral na polia/cabo ou Elevação lateral máquina", sets: 3, reps: "10-15", rest: "60-90s", defaultLoad: 5 },
                { exercise: "Tríceps corda", muscle: "Tríceps braquial", substitutes: "Tríceps testa com halteres ou Tríceps francês na polia", sets: 3, reps: "10-15", rest: "60-90s", defaultLoad: 25 },
                { exercise: "Bíceps martelo", muscle: "Bíceps e Braquiorradial", substitutes: "Rosca martelo na corda (polia) ou Rosca Scott máquina/barra W", sets: 3, reps: "10-15", rest: "60-90s", defaultLoad: 0 },
                { exercise: "Cardio Zona 2 (Esteira inclinada / Bike)", muscle: "Sistema Cardiovascular / Resistência", substitutes: "Transport / Remo ergômetro", sets: 1, reps: "15-20 min", rest: "-", defaultLoad: 0, isCardio: true }
            ],
            "Lower A": [
                { exercise: "Goblet Squat", muscle: "Quadríceps e Glúteos", substitutes: "Agachamento no Smith ou Hack Squat", sets: 3, reps: "8-12", rest: "2 min", defaultLoad: 12 },
                { exercise: "RDL", muscle: "Isquiotibiais e Glúteos", substitutes: "Stiff com barra ou Mesa flexora (foco em isquiotibiais)", sets: 3, reps: "8-12", rest: "2 min", defaultLoad: 26 },
                { exercise: "Panturrilha em Pé", muscle: "Panturrilha (Gastrocnêmio)", substitutes: "Panturrilha no Leg Press ou Panturrilha unilateral com halter", sets: 3, reps: "12-15", rest: "60-90s", defaultLoad: 10 },
                { exercise: "Cadeira Extensora", muscle: "Quadríceps (ênfase reto femoral)", substitutes: "Afundo com halteres ou Sissy squat", sets: 3, reps: "12-15", rest: "60-90s", defaultLoad: 22 },
                { exercise: "Abdominal na Polia Alta (Cable Crunch)", muscle: "Reto Abdominal (ênfase superior e média)", substitutes: "Crunch no Solo com Carga / Abdominal na Máquina", sets: 3, reps: "12-15", rest: "60-90s", defaultLoad: 35 }
            ],
            "Upper B": [
                { exercise: "Puxada Alta", muscle: "Costas (Dorsal - largura)", substitutes: "Puxada triângulo ou Barra fixa assistida (Graviton)", sets: 3, reps: "8-12", rest: "90-120s", defaultLoad: 37.5 },
                { exercise: "Desenvolvimento Halteres", muscle: "Deltóide Anterior e Tríceps", substitutes: "Desenvolvimento máquina articulada ou Desenvolvimento no Smith", sets: 3, reps: "8-12", rest: "90-120s", defaultLoad: 7 },
                { exercise: "Remada Baixa", muscle: "Costas (Espessura / Meio das costas)", substitutes: "Remada curvada com pegada pronada ou Remada articulada", sets: 3, reps: "8-12", rest: "90-120s", defaultLoad: 30 },
                { exercise: "Elevação Lateral", muscle: "Deltóide Lateral", substitutes: "Elevação lateral na polia/cabo ou Elevação lateral máquina", sets: 3, reps: "10-15", rest: "60-90s", defaultLoad: 6.81 },
                { exercise: "Cardio Zona 2 (Esteira / Bike ergométrica)", muscle: "Sistema Cardiovascular / Resistência", substitutes: "Caminhada ao ar livre / Escada", sets: 3, reps: "20 min", rest: "-", defaultLoad: 0, isCardio: true }
            ],
            "Lower B": [
                { exercise: "Leg Press 45°", muscle: "Quadríceps e Glúteos", substitutes: "Agachamento livre ou Hack machine", sets: 3, reps: "8-12", rest: "2 min", defaultLoad: 20 },
                { exercise: "Cadeira Flexora", muscle: "Isquiotibiais (flexores de joelho)", substitutes: "Mesa flexora deitada ou Flexora unilateral em pé", sets: 3, reps: "10-15", rest: "60-90s", defaultLoad: 0 },
                { exercise: "Agachamento Búlgaro", muscle: "Quadríceps e Glúteo Máximo", substitutes: "Passada/Avanço com halteres ou Afundo no Smith", sets: 3, reps: "8-12", rest: "2 min", defaultLoad: 0 },
                { exercise: "Panturrilha", muscle: "Panturrilha", substitutes: "Panturrilha sentado (Sóleo) ou Panturrilha no Smith", sets: 3, reps: "12-15", rest: "60-90s", defaultLoad: 0 },
                { exercise: "Elevação de Pernas na Barra Fixa / Paralelas (Hanging Leg Raise)", muscle: "Reto Abdominal (ênfase infra-umbilical)", substitutes: "Elevação de Pernas no Solo com Elevação Pélvica / Abdominal Canivete", sets: 3, reps: "12-15", rest: "60-90s", defaultLoad: 0 }
            ]
        },
        logs: [
            // 06/10/2026 - Upper A
            { id: "w-101", month: "2026-10", date: "2026-10-06", split: "Upper A", exercise: "Supino Inclinado Halteres", muscle: "Peitoral (ênfase clavicular/superior)", substitutes: "Supino Inclinado Smith ou Máquina articulada inclinada", sets: 3, reps: "8-12", rest: "90-120s", load: 30, rir: "2", volume: 720, completed: true, notes: "fiz 1 com 22.5kg e 2 com 30kg" },
            { id: "w-102", month: "2026-10", date: "2026-10-06", split: "Upper A", exercise: "Remada Peito Apoiado", muscle: "Costas (Dorsais / Romboides)", substitutes: "Remada baixa no cabo (pegada neutra) ou Remada unilateral com halter (serrote)", sets: 3, reps: "8-12", rest: "90-120s", load: 35, rir: "", volume: 840, completed: true, notes: "" },
            { id: "w-103", month: "2026-10", date: "2026-10-06", split: "Upper A", exercise: "Elevação Lateral", muscle: "Deltóide Lateral", substitutes: "Elevação lateral na polia/cabo ou Elevação lateral máquina", sets: 3, reps: "10-15", rest: "60-90s", load: 5, rir: "", volume: 150, completed: true, notes: "" },
            { id: "w-104", month: "2026-10", date: "2026-10-06", split: "Upper A", exercise: "Tríceps corda", muscle: "Tríceps braquial", substitutes: "Tríceps testa com halteres ou Tríceps francês na polia", sets: 3, reps: "10-15", rest: "60-90s", load: 25, rir: "", volume: 750, completed: true, notes: "preciso fazer com 10reps ou menos pra conseguir as 3 séries completas com 25kg" },
            { id: "w-105", month: "2026-10", date: "2026-10-06", split: "Upper A", exercise: "Bíceps martelo", muscle: "Bíceps e Braquiorradial", substitutes: "Rosca martelo na corda (polia) ou Rosca Scott máquina/barra W", sets: 3, reps: "10-15", rest: "60-90s", load: 0, rir: "", volume: 0, completed: true, notes: "preciso descansar uns 2min nesses exercícios mais pesados pra conseguir 10 reps" },
            { id: "w-106", month: "2026-10", date: "2026-10-06", split: "Upper A", exercise: "Cardio Zona 2 (Esteira inclinada / Bike)", muscle: "Sistema Cardiovascular / Resistência", substitutes: "Transport / Remo ergômetro", sets: 1, reps: "15-20 min", rest: "-", load: 0, rir: "", volume: 0, completed: false, notes: "Frequência Cardíaca na Zona 2 (60-70% FCR).", isCardio: true },

            // 08/10/2026 - Lower A
            { id: "w-107", month: "2026-10", date: "2026-10-08", split: "Lower A", exercise: "Goblet Squat", muscle: "Quadríceps e Glúteos", substitutes: "Agachamento no Smith ou Hack Squat", sets: 3, reps: "8-12", rest: "2 min", load: 12, rir: "", volume: 288, completed: true, notes: "" },
            { id: "w-108", month: "2026-10", date: "2026-10-08", split: "Lower A", exercise: "RDL", muscle: "Isquiotibiais e Glúteos", substitutes: "Stiff com barra ou Mesa flexora (foco em isquiotibiais)", sets: 3, reps: "8-12", rest: "2 min", load: 26, rir: "", volume: 624, completed: true, notes: "" },
            { id: "w-109", month: "2026-10", date: "2026-10-08", split: "Lower A", exercise: "Panturrilha em Pé", muscle: "Panturrilha (Gastrocnêmio)", substitutes: "Panturrilha no Leg Press ou Panturrilha unilateral com halter", sets: 3, reps: "12-15", rest: "60-90s", load: 10, rir: "", volume: 360, completed: true, notes: "no leg press 45, 10kg cada lado" },
            { id: "w-110", month: "2026-10", date: "2026-10-08", split: "Lower A", exercise: "Cadeira Extensora", muscle: "Quadríceps (ênfase reto femoral)", substitutes: "Afundo com halteres ou Sissy squat", sets: 3, reps: "12-15", rest: "60-90s", load: 22, rir: "", volume: 792, completed: true, notes: "a essa altura eu já estou me tremendo todo com 12 reps e 22kg" },
            { id: "w-111", month: "2026-10", date: "2026-10-08", split: "Lower A", exercise: "Abdominal na Polia Alta (Cable Crunch)", muscle: "Reto Abdominal (ênfase superior e média)", substitutes: "Crunch no Solo com Carga / Abdominal na Máquina", sets: 3, reps: "12-15", rest: "60-90s", load: 35, rir: "", volume: 1260, completed: true, notes: "fui progredindo começando de 25, acho que posso fazer 3 de 43 de boa" },

            // 10/10/2026 - Upper B
            { id: "w-112", month: "2026-10", date: "2026-10-10", split: "Upper B", exercise: "Puxada Alta", muscle: "Costas (Dorsal - largura)", substitutes: "Puxada triângulo ou Barra fixa assistida (Graviton)", sets: 3, reps: "8-12", rest: "90-120s", load: 37.5, rir: "", volume: 900, completed: true, notes: "faço 30kg para aquecer" },
            { id: "w-113", month: "2026-10", date: "2026-10-10", split: "Upper B", exercise: "Desenvolvimento Halteres", muscle: "Deltóide Anterior e Tríceps", substitutes: "Desenvolvimento máquina articulada ou Desenvolvimento no Smith", sets: 3, reps: "8-12", rest: "90-120s", load: 7, rir: "", volume: 168, completed: true, notes: "" },
            { id: "w-114", month: "2026-10", date: "2026-10-10", split: "Upper B", exercise: "Remada Baixa", muscle: "Costas (Espessura / Meio das costas)", substitutes: "Remada curvada com pegada pronada ou Remada articulada", sets: 3, reps: "8-12", rest: "90-120s", load: 30, rir: "", volume: 720, completed: true, notes: "" },
            { id: "w-115", month: "2026-10", date: "2026-10-10", split: "Upper B", exercise: "Elevação Lateral", muscle: "Deltóide Lateral", substitutes: "Elevação lateral na polia/cabo ou Elevação lateral máquina", sets: 3, reps: "10-15", rest: "60-90s", load: 6.81, rir: "", volume: 204.3, completed: true, notes: "" },
            { id: "w-116", month: "2026-10", date: "2026-10-10", split: "Upper B", exercise: "Cardio Zona 2 (Esteira / Bike ergométrica)", muscle: "Sistema Cardiovascular / Resistência", substitutes: "Caminhada ao ar livre / Escada", sets: 3, reps: "20 min", rest: "-", load: 0, rir: "", volume: 0, completed: false, notes: "Manter ritmo conversacional contínuo / sem comer num rola não, tem q comer antes", isCardio: true },

            // 14/10/2026 - Lower B
            { id: "w-117", month: "2026-10", date: "2026-10-14", split: "Lower B", exercise: "Leg Press 45°", muscle: "Quadríceps e Glúteos", substitutes: "Agachamento livre ou Hack machine", sets: 3, reps: "8-12", rest: "2 min", load: 20, rir: "", volume: 480, completed: false, notes: "" },
            { id: "w-118", month: "2026-10", date: "2026-10-14", split: "Lower B", exercise: "Cadeira Flexora", muscle: "Isquiotibiais (flexores de joelho)", substitutes: "Mesa flexora deitada ou Flexora unilateral em pé", sets: 3, reps: "10-15", rest: "60-90s", load: 0, rir: "", volume: 0, completed: false, notes: "" },
            { id: "w-119", month: "2026-10", date: "2026-10-14", split: "Lower B", exercise: "Agachamento Búlgaro", muscle: "Quadríceps e Glúteo Máximo", substitutes: "Passada/Avanço com halteres ou Afundo no Smith", sets: 3, reps: "8-12", rest: "2 min", load: 0, rir: "", volume: 0, completed: false, notes: "" },
            { id: "w-120", month: "2026-10", date: "2026-10-14", split: "Lower B", exercise: "Panturrilha", muscle: "Panturrilha", substitutes: "Panturrilha sentado (Sóleo) ou Panturrilha no Smith", sets: 3, reps: "12-15", rest: "60-90s", load: 0, rir: "", volume: 0, completed: false, notes: "" },
            { id: "w-121", month: "2026-10", date: "2026-10-14", split: "Lower B", exercise: "Elevação de Pernas na Barra Fixa / Paralelas (Hanging Leg Raise)", muscle: "Reto Abdominal (ênfase infra-umbilical)", substitutes: "Elevação de Pernas no Solo com Elevação Pélvica / Abdominal Canivete", sets: 3, reps: "12-15", rest: "60-90s", load: 0, rir: "", volume: 0, completed: false, notes: "" }
        ]
    };
}

// Estado global da aplicação
let habits = [];
let calendarEvents = [];
let sleepJournal = {};
let workoutData = getDefaultWorkoutData();
let timerConfig = {
    pomodoroWork: 25,
    pomodoroBreak: 5,
    deepWorkTarget: 90,
    countdownMinutes: 45
};

let syncTimeout = null;

// Carrega os dados do SafeStorage
function loadData() {
    const raw = SafeStorage.getItem(STORAGE_KEY);
    if (raw) {
        try {
            const parsed = JSON.parse(raw);
            habits = Array.isArray(parsed.habits) ? parsed.habits : [];
            calendarEvents = Array.isArray(parsed.calendarEvents) ? parsed.calendarEvents : [];
            sleepJournal = (parsed.sleepJournal && typeof parsed.sleepJournal === 'object') ? parsed.sleepJournal : {};
            if (parsed.timerConfig) {
                timerConfig = { ...timerConfig, ...parsed.timerConfig };
            }
            if (parsed.workoutData && Array.isArray(parsed.workoutData.logs) && parsed.workoutData.logs.length > 0) {
                workoutData = parsed.workoutData;
            } else {
                workoutData = getDefaultWorkoutData();
            }
        } catch (err) {
            console.error('Erro ao ler dados locais:', err);
            workoutData = getDefaultWorkoutData();
        }
    } else {
        workoutData = getDefaultWorkoutData();
        saveData(true);
    }
}

// Salva no SafeStorage e agenda Push para o GitHub Gist
function saveData(skipCloud = false) {
    const payload = {
        habits,
        calendarEvents,
        sleepJournal,
        workoutData,
        timerConfig,
        updatedAt: new Date().toISOString()
    };
    SafeStorage.setItem(STORAGE_KEY, JSON.stringify(payload));

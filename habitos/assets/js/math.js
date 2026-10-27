/* Razão da Variabilidade de Sono (RVS = ρ) e Coeficiente Beta de Vigília (β_W):
 * Modelo:
 *   TST = TIB - W   onde   W = SOL + WASO + TASAFA = TIB - TST
 *   Var(TST) = Var(TIB) + Var(W) - 2*Cov(TIB, W)
 *   β_W = Cov(TIB, W) / Var(TIB) (coeficiente angular da regressão W ~ TIB: taxa de vigília por expansão do leito)
 *   β_TST = 1 - β_W = Cov(TIB, TST) / Var(TIB) (fração que vira sono efetivo)
 *   RVS² = Var(TST) / Var(TIB) = 1 + Var(W)/Var(TIB) - 2*β_W
 *   RVS (ρ) = sqrt(Var(TST) / Var(TIB))
 */
function calcSleepRVS(sleepArr, bedArr) {
    const pairs = [];
    const len = Math.min(
        Array.isArray(sleepArr) ? sleepArr.length : 0,
        Array.isArray(bedArr) ? bedArr.length : 0
    );
    for (let i = 0; i < len; i++) {
        const tst = parseFloat(sleepArr[i]) || 0;
        const tib = parseFloat(bedArr[i]) || 0;
        if (tst > 0 && tib > 0) {
            const w = Math.max(0, tib - tst);
            pairs.push({ tst, tib, w });
        }
    }
    const n = pairs.length;
    if (n < 2) {
        return {
            valid: false,
            n,
            rvs: null,
            rvsSquared: null,
            betaW: null,
            betaTST: null,
            varTIB: 0,
            varTST: 0,
            varW: 0,
            covTIBW: 0
        };
    }

    const meanTST = pairs.reduce((a, p) => a + p.tst, 0) / n;
    const meanTIB = pairs.reduce((a, p) => a + p.tib, 0) / n;
    const meanW = pairs.reduce((a, p) => a + p.w, 0) / n;

    let sqTIB = 0, sqTST = 0, sqW = 0, spTIBW = 0;
    pairs.forEach(p => {
        const dTIB = p.tib - meanTIB;
        const dTST = p.tst - meanTST;
        const dW = p.w - meanW;
        sqTIB += dTIB * dTIB;
        sqTST += dTST * dTST;
        sqW += dW * dW;
        spTIBW += dTIB * dW;
    });

    const df = n - 1;
    const varTIB = sqTIB / df;
    const varTST = sqTST / df;
    const varW = sqW / df;
    const covTIBW = spTIBW / df;

    if (varTIB <= 1e-9) {
        return {
            valid: false,
            n,
            rvs: null,
            rvsSquared: null,
            betaW: null,
            betaTST: null,
            varTIB,
            varTST,
            varW,
            covTIBW
        };
    }

    const betaW = varTIB > 1e-9 ? (covTIBW / varTIB) : null;
    const betaTST = 1 - betaW;
    const rvs = varTIB > 1e-9 ? Math.sqrt(Math.max(0, varTST / varTIB)) : 0; const rvsSquared = rvs * rvs;
    // rvs = sqrt(varTST / varTIB)

    return {
        valid: true,
        n,
        rvs,
        rvsSquared,
        betaW,
        betaTST,
        varTIB,
        varTST,
        varW,
        covTIBW
    };
}

function calcHabitMetrics(habit) {
    const n = 7;
    const daysCompleted = habit.checks.filter(Boolean).length;
    const freqRatio = daysCompleted / n;
    const freqPct = freqRatio * 100;

    const totalHours = habit.dailyHours.reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
    const meanHours = totalHours / n;
    const sdHours = Math.sqrt(habit.dailyHours.reduce((acc, val) => acc + Math.pow((parseFloat(val) || 0) - meanHours, 2), 0) / n);

    const targetH = habit.targetHours > 0 ? habit.targetHours : 1;
    const hoursRatio = totalHours / targetH;
    const hoursPct = hoursRatio * 100;

    const sensitivityDerivative = (100 / targetH) * (0.5 + 0.5 * freqRatio);

    let rvs = null;
    let betaW = null;
    if (habit.category === 'sono' && Array.isArray(habit.bedtimeHours)) {
        const rvsObj = calcSleepRVS(
            habit.dailyHours.map(v => parseFloat(v) || 0),
            habit.bedtimeHours.map(v => parseFloat(v) || 0)
        );
        rvs = rvsObj.rvs;
        betaW = rvsObj.betaW;
    }

    let maxStreak = 0, cur = 0;
    habit.checks.forEach(c => {
        if (c) { cur++; if (cur > maxStreak) maxStreak = cur; }
        else { cur = 0; }
    });

    const elapsed = todayIndex !== -1 ? todayIndex + 1 : 7;
    const checksElapsed = habit.checks.slice(0, elapsed).filter(Boolean).length;
    const freqPctElapsed = (checksElapsed / elapsed) * 100;

    return {
        daysCompleted, freqRatio, freqPct, freqPctElapsed,
        totalHours, meanHours, sdHours, targetH,
        hoursRatio, hoursPct, sensitivityDerivative, rvs, betaW, streak: maxStreak
    };
}

function calcSleepAggregates(habit) {
    if (!habit || !Array.isArray(habit.bedtimeHours)) {
        return { meanBed: 0, meanSlept: 0, efficiency: 0, activeDays: 0 };
    }
    let sumBed = 0, sumSlept = 0, activeDays = 0;
    for (let i = 0; i < 7; i++) {
        const b = parseFloat(habit.bedtimeHours[i]) || 0;
        const s = parseFloat(habit.dailyHours[i]) || 0;
        if (b > 0) { sumBed += b; sumSlept += s; activeDays++; }
    }
    const meanBed = activeDays > 0 ? sumBed / activeDays : 0;
    const meanSlept = activeDays > 0 ? sumSlept / activeDays : 0;
    const efficiency = meanBed > 0 ? (meanSlept / meanBed) * 100 : 0;
    return { meanBed, meanSlept, efficiency, activeDays };
}

/* Dias da semana já decorridos (inclui hoje). Fora da semana atual considera 7. */
function getElapsedDays() {
    return todayIndex !== -1 ? todayIndex + 1 : 7;
}

function isFutureDay(dIdx) {
    return todayIndex !== -1 && dIdx > todayIndex;
}

function calcWeeklyGlobalMetrics() {
    const elapsedDays = getElapsedDays();
    if (habits.length === 0) {
        return {
            avgFreqPct: 0, totalChecks: 0, possibleChecks: 0, elapsedDays,
            globalElasticity: 0, avgSensitivity: 0,
            sumTotalHours: 0, sumTargetHours: 0,
            dailyTotalMeanHours: 0, dailyTotalSdHours: 0,
            dailyTotals: [0, 0, 0, 0, 0, 0, 0], dailyEngagementPct: [0, 0, 0, 0, 0, 0, 0],
            bestStreak: 0, leaderName: '-', leaderIndex: -1, todayDone: 0
        };
    }
    const metrics = habits.map(h => calcHabitMetrics(h));
    const k = metrics.length;

    /* Engajamento sobre os dias decorridos: não penaliza a semana em andamento */
    let totalChecks = 0;
    const dailyChecks = [0, 0, 0, 0, 0, 0, 0];
    habits.forEach(h => h.checks.forEach((c, i) => {
        if (c) { dailyChecks[i]++; if (i < elapsedDays) totalChecks++; }
    }));
    const possibleChecks = k * elapsedDays;
    const avgFreqPct = possibleChecks > 0 ? (totalChecks / possibleChecks) * 100 : 0;
    const dailyEngagementPct = dailyChecks.map(c => (c / k) * 100);

    const dailyTotals = [0, 0, 0, 0, 0, 0, 0];
    habits.forEach(h => h.dailyHours.forEach((hr, i) => dailyTotals[i] += (parseFloat(hr) || 0)));

    const sumTotalHours = dailyTotals.reduce((a, b) => a + b, 0);
    const sumTargetHours = habits.reduce((a, h) => a + h.targetHours, 0);
    const dailyTotalMeanHours = sumTotalHours / 7;
    const dailyTotalSdHours = Math.sqrt(dailyTotals.reduce((acc, v) => acc + Math.pow(v - dailyTotalMeanHours, 2), 0) / 7);

    const globalHoursRatio = sumTargetHours > 0 ? (sumTotalHours / sumTargetHours) : 0;
    const globalElasticity = globalHoursRatio * Math.exp(-Math.abs((avgFreqPct / 100) - Math.min(1, globalHoursRatio)) * 0.35);
    const avgSensitivity = metrics.reduce((a, m) => a + m.sensitivityDerivative, 0) / k;

    let bestStreak = 0, leaderName = 'Nenhum', leaderIndex = -1;
    metrics.forEach((m, i) => {
        if (m.streak > bestStreak) { bestStreak = m.streak; leaderName = habits[i].name; leaderIndex = i; }
    });

    const tIdx = todayIndex !== -1 ? todayIndex : 0;
    const todayDone = habits.filter(h => h.checks[tIdx]).length;

    return {
        avgFreqPct, totalChecks, possibleChecks, elapsedDays,
        globalElasticity, avgSensitivity,
        sumTotalHours, sumTargetHours,
        dailyTotalMeanHours, dailyTotalSdHours,
        dailyTotals, dailyEngagementPct,
        bestStreak, leaderName, leaderIndex, todayDone
    };
}

/* ===== Diário do Sono ===== */
function hhmmToMinutes(str) {
    if (!str || str === '—') return null;
    const [h, m] = String(str).split(':').map(Number);
    if (isNaN(h)) return null;
    const normH = Math.min(24, Math.max(0, h)) % 24;
    const normM = Math.min(59, Math.max(0, m || 0));
    return normH * 60 + normM;
}

/* Converte um registro { bed, slept, wake, getup } em horas de cama, horas dormidas e eficiência */
function calcSleepJournalEntry(entry) {
    if (!entry) return { bedH: 0, sleptH: 0, eff: 0 };
    const bed = hhmmToMinutes(entry.bed);
    const slept = hhmmToMinutes(entry.slept);
    const wake = hhmmToMinutes(entry.wake);
    const span = (start, end) => {
        if (start === null || end === null) return 0;
        let e = end;
        if (e < start) e += 24 * 60;
        return (e - start) / 60;
    };
    const bedH = span(bed, wake);
    const sleptH = span(slept, wake);
    const eff = bedH > 0 ? (sleptH / bedH) * 100 : 0;
    return { bedH, sleptH, eff };
}

/* Obtém as últimas entradas registradas de sono (até maxCount dias, padrão 7) */
function getRecentRegisteredSleepEntries(maxCount = 7) {
    const validEntries = [];
    if (typeof sleepJournal === 'object' && sleepJournal !== null) {
        const sortedDates = Object.keys(sleepJournal).sort();
        sortedDates.forEach(dateIso => {
            const entry = calcSleepJournalEntry(sleepJournal[dateIso]);
            if (entry.bedH > 0 && entry.sleptH > 0) {
                validEntries.push({ date: dateIso, bedH: entry.bedH, sleptH: entry.sleptH });
            }
        });
    }
    return validEntries.slice(-maxCount);
}

/* Séries semanais de sono baseadas no Diário do Sono. */
function calcSleepWeekSeries() {
    const journal = weekDays.map(d => calcSleepJournalEntry(sleepJournal[d.iso]));
    let bed = [0, 0, 0, 0, 0, 0, 0], slept = [0, 0, 0, 0, 0, 0, 0], source = 'none';

    if (journal.some(e => e.bedH > 0)) {
        bed = journal.map(e => e.bedH);
        slept = journal.map(e => e.sleptH);
        source = 'journal';
    }

    const eff = bed.map((b, i) => b > 0 ? (slept[i] / b) * 100 : 0);

    // Estatísticas exclusivas da semana analisada (usadas no gráfico de Análise de Sono da semana)
    const weekValidEntries = journal.filter(e => e.bedH > 0 && e.sleptH > 0);
    const weekActiveDays = weekValidEntries.length;
    let weekSumBed = 0, weekSumSlept = 0, weekSumEff = 0;
    weekValidEntries.forEach(e => {
        weekSumBed += e.bedH;
        weekSumSlept += e.sleptH;
        weekSumEff += (e.sleptH / e.bedH) * 100;
    });
    const weekMeanBed = weekActiveDays > 0 ? weekSumBed / weekActiveDays : 0;
    const weekMeanSlept = weekActiveDays > 0 ? weekSumSlept / weekActiveDays : 0;
    const weekMeanEff = weekActiveDays > 0 ? weekSumEff / weekActiveDays : 0;

    let weekVarSlept = 0, weekVarBed = 0, weekVarEff = 0;
    if (weekActiveDays > 0) {
        weekValidEntries.forEach(e => {
            weekVarSlept += Math.pow(e.sleptH - weekMeanSlept, 2);
            weekVarBed += Math.pow(e.bedH - weekMeanBed, 2);
            const effVal = (e.sleptH / e.bedH) * 100;
            weekVarEff += Math.pow(effVal - weekMeanEff, 2);
        });
        weekVarSlept /= weekActiveDays;
        weekVarBed /= weekActiveDays;
        weekVarEff /= weekActiveDays;
    }
    const weekSdSlept = Math.sqrt(weekVarSlept);
    const weekSdBed = Math.sqrt(weekVarBed);
    const weekSdEff = Math.sqrt(weekVarEff);

    // Média e agregados dos últimos 7 dias registrados
    const recent = getRecentRegisteredSleepEntries(7);
    const activeDays = recent.length;
    let sumBed = 0, sumSlept = 0, sumDailyEff = 0, validEffDays = 0;
    recent.forEach(r => {
        sumBed += r.bedH;
        sumSlept += r.sleptH;
        if (r.bedH > 0) {
            sumDailyEff += (r.sleptH / r.bedH) * 100;
            validEffDays++;
        }
    });

    const meanBed = activeDays > 0 ? sumBed / activeDays : 0;
    const meanSlept = activeDays > 0 ? sumSlept / activeDays : 0;
    // Razão agregada: sum(slept) / sum(bed) * 100
    const efficiency = meanBed > 0 ? (meanSlept / meanBed) * 100 : 0;
    // Média aritmética das eficiências diárias
    const meanDailyEfficiency = validEffDays > 0 ? sumDailyEff / validEffDays : 0;

    let varianceSlept = 0, varianceBed = 0, varianceDailyEff = 0;
    if (activeDays > 0) {
        recent.forEach(r => {
            varianceSlept += Math.pow(r.sleptH - meanSlept, 2);
            varianceBed += Math.pow(r.bedH - meanBed, 2);
            if (r.bedH > 0 && validEffDays > 0) {
                const effVal = (r.sleptH / r.bedH) * 100;
                varianceDailyEff += Math.pow(effVal - meanDailyEfficiency, 2);
            }
        });
        varianceSlept = varianceSlept / activeDays;
        varianceBed = varianceBed / activeDays;
        varianceDailyEff = validEffDays > 0 ? varianceDailyEff / validEffDays : 0;
    }
    const sdSlept = Math.sqrt(varianceSlept);
    const sdBed = Math.sqrt(varianceBed);
    const sdDailyEff = Math.sqrt(varianceDailyEff);

    const rvsData = recent.length >= 2
        ? calcSleepRVS(recent.map(r => r.sleptH), recent.map(r => r.bedH))
        : calcSleepRVS(slept, bed);

    return {
        bed, slept, eff,
        meanBed, meanSlept, sdSlept, sdBed, efficiency, meanDailyEfficiency, sdDailyEff, activeDays,
        weekActiveDays, weekMeanBed, weekMeanSlept, weekMeanEff, weekSdSlept, weekSdBed, weekSdEff,
        rvs: rvsData.rvs,
        rvsSquared: rvsData.rvsSquared,
        betaW: rvsData.betaW,
        betaTST: rvsData.betaTST,
        rvsData,
        source
    };
}

/* Formata horas decimais para [Valor_Horas][hminutos] com duas casas de minutos (ex: 7h30, 8h05) */
function formatSleepDuration(hours) {
    if (hours === null || hours === undefined || isNaN(hours) || hours <= 0) return '—';
    const totalMinutes = Math.round(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}h${String(m).padStart(2, '0')}`;
}

/* Localiza os metadados de um exercício em WORKOUT_PLAN ou nos hábitos */
function findExerciseMeta(exerciseName, habitId) {
    if (!exerciseName) return null;
    const target = String(exerciseName).trim().toLowerCase();

    if (typeof WORKOUT_PLAN !== 'undefined' && Array.isArray(WORKOUT_PLAN)) {
        for (const workout of WORKOUT_PLAN) {
            if (habitId && workout.planId !== habitId && ('h_' + workout.planId) !== habitId) continue;
            for (const ex of workout.exercises) {
                if (ex.name.toLowerCase() === target) return ex;
                if (Array.isArray(ex.variations) && ex.variations.some(v => v.toLowerCase() === target)) return ex;
            }
        }
        for (const workout of WORKOUT_PLAN) {
            for (const ex of workout.exercises) {
                if (ex.name.toLowerCase() === target) return ex;
                if (Array.isArray(ex.variations) && ex.variations.some(v => v.toLowerCase() === target)) return ex;
            }
        }
    }

    if (typeof habits !== 'undefined' && Array.isArray(habits)) {
        for (const h of habits) {
            if (Array.isArray(h.exercises)) {
                for (const ex of h.exercises) {
                    if (ex.name && ex.name.toLowerCase() === target) return ex;
                    if (Array.isArray(ex.variations) && ex.variations.some(v => v.toLowerCase() === target)) return ex;
                }
            }
        }
    }

    return null;
}

/* Calcula o volume total de um item de log: (séries * repetições) * carga */
function isMathItemCardio(item) {
    if (!item) return false;
    if (item.unit === 'km/h' || item.planId === 'cardio_z2' || item.habitId === 'h_cardio_z2') return true;
    if (typeof isCardioExercise === 'function' && isCardioExercise(item.exerciseName, item.muscle)) return true;
    return false;
}

function calcLogEntryVolume(item) {
    if (!item || isMathItemCardio(item)) return 0;
    const weight = parseFloat(item.weight) || 0;
    if (weight <= 0) return 0;

    let sets = parseInt(item.sets, 10);
    const exMeta = findExerciseMeta(item.exerciseName, item.habitId);
    if (isNaN(sets) || sets <= 0) {
        sets = exMeta && exMeta.sets ? parseInt(exMeta.sets, 10) : 3;
    }
    if (isNaN(sets) || sets <= 0) sets = 3;

    let reps = parseFloat(item.reps);
    if (isNaN(reps) || reps <= 0) {
        if (exMeta && exMeta.reps) {
            const str = String(exMeta.reps);
            const matchRange = str.match(/(\d+)\s*[-–]\s*(\d+)/);
            if (matchRange) {
                reps = (parseFloat(matchRange[1]) + parseFloat(matchRange[2])) / 2;
            } else {
                const matchSingle = str.match(/(\d+)/);
                reps = matchSingle ? parseFloat(matchSingle[1]) : 10;
            }
        } else {
            reps = 10;
        }
    }
    if (isNaN(reps) || reps <= 0) reps = 10;

    return sets * reps * weight;
}

/* Retorna os últimos N registros diários de carga em atvLogs */
function getRecentRegisteredLoadEntries(limit = 7) {
    let logs = {};
    try {
        const raw = typeof SafeStorage !== 'undefined' ? SafeStorage.getItem('hq_atv_logs_v1') : null;
        if (raw) logs = JSON.parse(raw) || {};
        else if (typeof atvLogs !== 'undefined') logs = atvLogs || {};
    } catch (e) {
        logs = {};
    }

    const validDates = Object.keys(logs).filter(dateKey => {
        const list = logs[dateKey];
        if (!Array.isArray(list) || list.length === 0) return false;
        return list.some(item => item && !isMathItemCardio(item) && calcLogEntryVolume(item) > 0);
    }).sort(); // cronológico crescente

    const recentDates = validDates.slice(-limit);
    return recentDates.map(dateKey => {
        const list = (logs[dateKey] || []).filter(item => item && !isMathItemCardio(item));
        const dayVolume = list.reduce((acc, item) => acc + calcLogEntryVolume(item), 0);
        return { date: dateKey, load: dayVolume, count: list.length };
    });
}

/* Volume de Carga dos últimos 7 dias registrados (baseado em atvLogs / hq_atv_logs_v1) */
function calcWeeklyLoadMetrics() {
    const recent = getRecentRegisteredLoadEntries(7);
    const activeDays = recent.length;
    const totalLoad = recent.reduce((acc, r) => acc + r.load, 0);
    const meanDailyLoad = activeDays > 0 ? totalLoad / activeDays : 0;

    return {
        totalLoad,
        meanDailyLoad,
        activeDays,
        recent
    };
}

/* Verifica se em uma data ISO o usuário cumpriu 100% das atividades registradas */
function isDay100Percent(dateIso, dayOfWeekIdx) {
    // 1. Sono: deve ter registro no Diário do Sono com sono > 0
    const sleepEntry = (typeof sleepJournal === 'object' && sleepJournal !== null) ? sleepJournal[dateIso] : null;
    const entry = calcSleepJournalEntry(sleepEntry);
    const hasSleep = entry.sleptH > 0;

    // 2. Atividade Física:
    let logs = {};
    try {
        const raw = typeof SafeStorage !== 'undefined' ? SafeStorage.getItem('hq_atv_logs_v1') : null;
        if (raw) logs = JSON.parse(raw) || {};
        else if (typeof atvLogs !== 'undefined') logs = atvLogs || {};
    } catch (e) { logs = {}; }

    let dowIdx = dayOfWeekIdx;
    if (dowIdx === undefined) {
        const d = new Date(dateIso + 'T12:00:00');
        dowIdx = (d.getDay() + 6) % 7;
    }

    const hasWorkoutLog = Array.isArray(logs[dateIso]) && logs[dateIso].length > 0;
    const hasHabitCheck = typeof habits !== 'undefined' && Array.isArray(habits) && habits.some(h =>
        h && h.category === 'atv_fisica' && Array.isArray(h.checks) && h.checks[dowIdx] === true &&
        (typeof weekDays !== 'undefined' && weekDays[dowIdx] && weekDays[dowIdx].iso === dateIso)
    );

    const hasWorkout = hasWorkoutLog || hasHabitCheck;

    // Um dia só é 100% completo se cumprir ambas as atividades monitoradas (Sono e Atividade Física)
    return hasSleep && hasWorkout;
}

/* Calcula o streak de dias consecutivos com 100% das atividades */
function calcConsecutiveFullDaysStreak() {
    // 1. Status dos 7 dias da semana corrente (para os dots)
    const weekStatus = weekDays.map((d, i) => {
        if (isFutureDay(i)) return null;
        return isDay100Percent(d.iso, i);
    });

    const fullDaysThisWeek = weekStatus.filter(v => v === true).length;

    // 2. Histórico completo para o Maior Streak
    const allDatesSet = new Set();
    if (typeof sleepJournal === 'object' && sleepJournal !== null) {
        Object.keys(sleepJournal).forEach(k => allDatesSet.add(k));
    }
    let logs = {};
    try {
        const raw = typeof SafeStorage !== 'undefined' ? SafeStorage.getItem('hq_atv_logs_v1') : null;
        if (raw) logs = JSON.parse(raw) || {};
    } catch(e) {}
    Object.keys(logs).forEach(k => allDatesSet.add(k));
    weekDays.forEach(d => { if (!isFutureDay(d.index)) allDatesSet.add(d.iso); });

    const sortedDates = Array.from(allDatesSet).sort();
    let maxStreak = 0;
    let runningStreak = 0;
    let prevDateObj = null;

    sortedDates.forEach(dateStr => {
        const [y, m, d] = dateStr.split('-').map(Number);
        const curDateObj = new Date(y, m - 1, d, 12, 0, 0);
        const is100 = isDay100Percent(dateStr);

        if (prevDateObj) {
            const diffDays = Math.round((curDateObj - prevDateObj) / 86400000);
            if (diffDays > 1) {
                runningStreak = 0; // Se houve salto entre datas no histórico, o streak é quebrado
            }
        }

        if (is100) {
            runningStreak++;
            if (runningStreak > maxStreak) maxStreak = runningStreak;
        } else {
            runningStreak = 0;
        }
        prevDateObj = curDateObj;
    });

    // Streak atual terminando no dia de hoje (ou ontem se hoje ainda não foi registrado)
    const todayIso = weekDays[todayIndex !== -1 ? todayIndex : 0].iso;
    const [ty, tm, td] = todayIso.split('-').map(Number);
    let checkDate = new Date(ty, tm - 1, td, 12, 0, 0);
    let curCheck = 0;

    const today100 = isDay100Percent(todayIso, todayIndex !== -1 ? todayIndex : undefined);
    if (!today100) {
        // Se hoje ainda não atingiu 100%, verifica o streak consecutivo que vinha até ontem
        checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
        const checkIso = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
        if (isDay100Percent(checkIso)) {
            curCheck++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }
    const currentStreak = curCheck;

    return {
        maxStreak: Math.max(maxStreak, currentStreak),
        currentStreak,
        fullDaysThisWeek,
        weekStatus
    };
}

/* Identifica o grupo (upper_a, lower_a, upper_b, lower_b) de um item de log de atividade física */
function resolveLogGroupPlanId(item) {
    if (!item) return 'upper_a';
    if (isMathItemCardio(item)) return 'cardio_z2';
    const validPlans = ['upper_a', 'lower_a', 'upper_b', 'lower_b'];
    if (item.planId && validPlans.includes(item.planId)) return item.planId;
    if (item.habitId) {
        const stripped = String(item.habitId).replace(/^h_/, '');
        if (validPlans.includes(stripped)) return stripped;
        if (typeof habits !== 'undefined' && Array.isArray(habits)) {
            const h = habits.find(hb => hb.id === item.habitId);
            if (h && h.planId && validPlans.includes(h.planId)) return h.planId;
        }
    }
    if (item.exerciseName && typeof WORKOUT_PLAN !== 'undefined' && Array.isArray(WORKOUT_PLAN)) {
        const target = String(item.exerciseName).trim().toLowerCase();
        for (const workout of WORKOUT_PLAN) {
            for (const ex of workout.exercises) {
                if (ex.name.toLowerCase() === target) return workout.planId;
                if (Array.isArray(ex.variations) && ex.variations.some(v => v.toLowerCase() === target)) return workout.planId;
            }
        }
    }
    return 'upper_a';
}

/* Calcula as séries de evolução de volume de carga dos últimos 30 dias (por grupo e por exercício) */
function calcLoadEvolution30d() {
    const days = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const label = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
        days.push({ iso, label });
    }

    let logs = {};
    try {
        const raw = typeof SafeStorage !== 'undefined' ? SafeStorage.getItem('hq_atv_logs_v1') : null;
        if (raw) logs = JSON.parse(raw) || {};
        else if (typeof atvLogs !== 'undefined') logs = atvLogs || {};
    } catch (e) { logs = {}; }

    const groups = {
        total_all: { id: 'total_all', label: 'Volume Total (Geral)', color: '#18181b', volumeSeries: Array(30).fill(null), weightSeries: Array(30).fill(null) },
        upper_a:   { id: 'upper_a',   label: 'Upper A',              color: '#e11d48', volumeSeries: Array(30).fill(null), weightSeries: Array(30).fill(null) },
        lower_a:   { id: 'lower_a',   label: 'Lower A',              color: '#1d4ed8', volumeSeries: Array(30).fill(null), weightSeries: Array(30).fill(null) },
        upper_b:   { id: 'upper_b',   label: 'Upper B',              color: '#f97316', volumeSeries: Array(30).fill(null), weightSeries: Array(30).fill(null) },
        lower_b:   { id: 'lower_b',   label: 'Lower B',              color: '#15803d', volumeSeries: Array(30).fill(null), weightSeries: Array(30).fill(null) }
    };

    const exercisesMap = new Map();
    // Descobre apenas os exercícios de FORÇA já registrados pelo usuário (Aeróbico/Cardio Zona 2 não entra no gráfico de carga e volume)
    Object.keys(logs).sort().forEach(dateKey => {
        const list = logs[dateKey];
        if (!Array.isArray(list)) return;
        list.forEach(item => {
            if (!item || !item.exerciseName || isMathItemCardio(item)) return;
            const exName = String(item.exerciseName).trim();
            if (!exercisesMap.has(exName)) {
                exercisesMap.set(exName, {
                    name: exName,
                    planId: resolveLogGroupPlanId(item),
                    volumeSeries: Array(30).fill(null),
                    weightSeries: Array(30).fill(null)
                });
            }
        });
    });

    let hasAnyLog = false;

    days.forEach((dayObj, dayIdx) => {
        const list = logs[dayObj.iso];
        if (!Array.isArray(list) || list.length === 0) return;

        list.forEach(item => {
            if (!item || isMathItemCardio(item)) return;
            const vol = calcLogEntryVolume(item);
            const w = parseFloat(item.weight) || 0;
            if (vol <= 0 && w <= 0) return;

            hasAnyLog = true;
            const planId = resolveLogGroupPlanId(item);
            const grp = groups[planId] || groups.upper_a;
            grp.volumeSeries[dayIdx] = (grp.volumeSeries[dayIdx] || 0) + vol;
            grp.weightSeries[dayIdx] = Math.max(grp.weightSeries[dayIdx] || 0, w);

            groups.total_all.volumeSeries[dayIdx] = (groups.total_all.volumeSeries[dayIdx] || 0) + vol;
            groups.total_all.weightSeries[dayIdx] = Math.max(groups.total_all.weightSeries[dayIdx] || 0, w);

            const exName = item.exerciseName ? String(item.exerciseName).trim() : '';
            if (exName) {
                if (!exercisesMap.has(exName)) {
                    exercisesMap.set(exName, {
                        name: exName,
                        planId,
                        volumeSeries: Array(30).fill(null),
                        weightSeries: Array(30).fill(null)
                    });
                }
                const exObj = exercisesMap.get(exName);
                exObj.volumeSeries[dayIdx] = (exObj.volumeSeries[dayIdx] || 0) + vol;
                exObj.weightSeries[dayIdx] = Math.max(exObj.weightSeries[dayIdx] || 0, w);
            }
        });
    });

    return {
        days,
        groups,
        exercises: Array.from(exercisesMap.values()),
        hasAnyLog
    };
}

/* Categoriza o texto de músculo em um dos grupamentos anatômicos principais */
function categorizeMuscleGroup(rawMuscle, exName) {
    const txt = `${rawMuscle || ''} ${exName || ''}`.toLowerCase();
    if (txt.includes('peito') || txt.includes('peitor') || txt.includes('supino')) return 'Peitoral';
    if (txt.includes('costa') || txt.includes('dorsal') || txt.includes('romboide') || txt.includes('remada') || txt.includes('puxada') || txt.includes('barra fixa')) return 'Costas';
    if (txt.includes('quadr') || txt.includes('squat') || txt.includes('agacha') || txt.includes('leg press') || txt.includes('extensora')) return 'Quadríceps';
    if (txt.includes('isquio') || txt.includes('flexora') || txt.includes('rdl') || txt.includes('stiff') || txt.includes('glúteo') || txt.includes('gluteo')) return 'Posterior / Glúteos';
    if (txt.includes('deltoide') || txt.includes('ombro') || txt.includes('elevação lateral') || txt.includes('desenvolvimento')) return 'Ombros';
    if (txt.includes('bíceps') || txt.includes('biceps') || txt.includes('rosca') || txt.includes('martelo')) return 'Bíceps';
    if (txt.includes('tríceps') || txt.includes('triceps')) return 'Tríceps';
    if (txt.includes('panturrilha') || txt.includes('sóleo') || txt.includes('gastrocnêmio')) return 'Panturrilhas';
    if (txt.includes('abdom') || txt.includes('crunch') || txt.includes('infra')) return 'Abdômen';
    if (txt.includes('cardio') || txt.includes('esteira') || txt.includes('bike')) return 'Cardio';
    return 'Outros';
}

/* Calcula as métricas avançadas da aba Métricas (Opção B: PRs, 1RM Epley, Equilíbrio Muscular, Correlação Sono×Treino e Regularidade Circadiana) */
function calcAdvancedAnalytics() {
    let logs = {};
    try {
        const raw = typeof SafeStorage !== 'undefined' ? SafeStorage.getItem('hq_atv_logs_v1') : null;
        if (raw) logs = JSON.parse(raw) || {};
        else if (typeof atvLogs !== 'undefined') logs = atvLogs || {};
    } catch (e) { logs = {}; }

    const today = new Date();
    const cutoff30dDate = new Date(today);
    cutoff30dDate.setDate(today.getDate() - 29);
    const cutoff30dIso = `${cutoff30dDate.getFullYear()}-${String(cutoff30dDate.getMonth() + 1).padStart(2, '0')}-${String(cutoff30dDate.getDate()).padStart(2, '0')}`;

    // 1. PRs, 1RM Estimado (Epley) e Progressão por Exercício
    const prMap = new Map();
    const muscleBalanceObj = {
        'Costas': { sets: 0, volume: 0, sessions: 0 },
        'Peitoral': { sets: 0, volume: 0, sessions: 0 },
        'Quadríceps': { sets: 0, volume: 0, sessions: 0 },
        'Posterior / Glúteos': { sets: 0, volume: 0, sessions: 0 },
        'Ombros': { sets: 0, volume: 0, sessions: 0 },
        'Bíceps': { sets: 0, volume: 0, sessions: 0 },
        'Tríceps': { sets: 0, volume: 0, sessions: 0 },
        'Panturrilhas': { sets: 0, volume: 0, sessions: 0 },
        'Abdômen': { sets: 0, volume: 0, sessions: 0 },
        'Cardio': { sets: 0, volume: 0, sessions: 0 }
    };

    const dailyWorkoutSummary = {}; // { 'YYYY-MM-DD': { volume, maxWeight } }

    const sortedLogDates = Object.keys(logs).sort();
    sortedLogDates.forEach(dateIso => {
        const list = logs[dateIso];
        if (!Array.isArray(list) || list.length === 0) return;

        let dayVol = 0;
        let dayMaxW = 0;
        list.forEach(item => {
            if (!item || !item.exerciseName) return;
            const exName = String(item.exerciseName).trim();
            const isCardio = item.unit === 'km/h' || (typeof isCardioExercise === 'function' && isCardioExercise(exName, item.muscle));
            const w = parseFloat(item.weight) || 0;
            const vol = isCardio ? 0 : calcLogEntryVolume(item);
            dayVol += vol;
            if (!isCardio && w > dayMaxW) dayMaxW = w;

            const meta = findExerciseMeta(exName, item.habitId);
            const sets = isCardio ? 1 : (parseInt(item.sets, 10) || (meta && meta.sets ? parseInt(meta.sets, 10) : 3) || 3);
            let reps = 10;
            const repsStr = String(item.reps || (meta && meta.reps) || '10');
            const mRange = repsStr.match(/(\d+)\s*[-–]\s*(\d+)/);
            if (mRange) reps = (parseFloat(mRange[1]) + parseFloat(mRange[2])) / 2;
            else {
                const mSingle = repsStr.match(/(\d+)/);
                if (mSingle) reps = parseFloat(mSingle[1]);
            }

            const muscleCat = categorizeMuscleGroup(item.muscle || (meta && meta.muscle), exName);
            if (dateIso >= cutoff30dIso && muscleBalanceObj[muscleCat]) {
                muscleBalanceObj[muscleCat].sets += sets;
                muscleBalanceObj[muscleCat].volume += vol;
                muscleBalanceObj[muscleCat].sessions += 1;
            }

            if (w <= 0 || isCardio) return;
            // Fórmula de Epley para 1RM: w * (1 + reps / 30)
            const epley1RM = w * (1 + Math.min(reps, 20) / 30);

            if (!prMap.has(exName)) {
                prMap.set(exName, {
                    name: exName,
                    muscleCategory: muscleCat,
                    muscleGroup: muscleCat,
                    sessions: 0,
                    sessionsCount: 0,
                    firstDate: dateIso,
                    firstWeight: w,
                    lastDate: dateIso,
                    lastWeight: w,
                    currentWeight: w,
                    maxWeight: w,
                    maxWeightDate: dateIso,
                    best1RM: epley1RM,
                    maxSessionVolume: vol,
                    maxVolume: vol,
                    maxVolumeDate: dateIso
                });
            }

            const rec = prMap.get(exName);
            rec.sessions += 1;
            rec.sessionsCount = rec.sessions;
            rec.lastDate = dateIso;
            rec.lastWeight = w;
            rec.currentWeight = w;
            if (w >= rec.maxWeight) {
                rec.maxWeight = w;
                rec.maxWeightDate = dateIso;
            }
            if (epley1RM > rec.best1RM) {
                rec.best1RM = epley1RM;
            }
            if (vol >= rec.maxSessionVolume) {
                rec.maxSessionVolume = vol;
                rec.maxVolume = vol;
                rec.maxVolumeDate = dateIso;
            }
        });

        if (dayVol > 0) {
            dailyWorkoutSummary[dateIso] = { volume: dayVol, maxWeight: dayMaxW };
        }
    });

    const exercisePRs = Array.from(prMap.values()).map(r => {
        const progressionPct = r.firstWeight > 0 ? ((r.lastWeight - r.firstWeight) / r.firstWeight) * 100 : 0;
        return { ...r, progressionPct };
    }).sort((a, b) => b.best1RM - a.best1RM);

    // Converte muscleBalanceObj em array ordenado de grupos com séries > 0
    const muscleBalance = Object.keys(muscleBalanceObj)
        .map(muscle => ({
            muscle,
            sets: muscleBalanceObj[muscle].sets,
            volume: parseFloat(muscleBalanceObj[muscle].volume.toFixed(1)),
            sessions: muscleBalanceObj[muscle].sessions
        }))
        .filter(item => item.sets > 0 || item.volume > 0)
        .sort((a, b) => b.sets - a.sets || b.volume - a.volume);

    // 2. Correlação Sono × Performance de Treino (Scatter + Regressão Linear de Pearson)
    const correlationPoints = [];
    Object.keys(dailyWorkoutSummary).sort().forEach(dateIso => {
        const { volume: vol, maxWeight } = dailyWorkoutSummary[dateIso];
        let sleepEntry = (typeof sleepJournal === 'object' && sleepJournal !== null) ? sleepJournal[dateIso] : null;

        // Caso não haja sono registrado no próprio dia ISO, verifica a noite imediatamente anterior (dateIso - 1 dia)
        if (!sleepEntry || !sleepEntry.bed || sleepEntry.bed === '—') {
            const [y, m, d] = dateIso.split('-').map(Number);
            if (y && m && d) {
                const prevDt = new Date(y, m - 1, d, 12, 0, 0);
                prevDt.setDate(prevDt.getDate() - 1);
                const prevIso = `${prevDt.getFullYear()}-${String(prevDt.getMonth() + 1).padStart(2, '0')}-${String(prevDt.getDate()).padStart(2, '0')}`;
                if (sleepJournal && sleepJournal[prevIso] && sleepJournal[prevIso].bed && sleepJournal[prevIso].bed !== '—') {
                    sleepEntry = sleepJournal[prevIso];
                }
            }
        }

        let sleptH = 0;
        let eff = 0;
        if (sleepEntry && sleepEntry.bed && sleepEntry.bed !== '—') {
            const parsed = calcSleepJournalEntry(sleepEntry);
            sleptH = parsed.sleptH;
            eff = parsed.eff;
        }

        if (sleptH > 0) {
            const parts = dateIso.split('-');
            const label = parts.length === 3 ? `${parts[2]}/${parts[1]}` : dateIso;
            correlationPoints.push({
                date: dateIso,
                dateIso,
                label,
                sleptH: parseFloat(sleptH.toFixed(2)),
                volume: parseFloat(vol.toFixed(2)),
                maxWeight: parseFloat(maxWeight.toFixed(2)),
                eff: Math.round(eff)
            });
        }
    });

    let pearsonR = null;
    let regSlope = null;
    let regIntercept = null;
    if (correlationPoints.length >= 2) {
        const n = correlationPoints.length;
        const meanX = correlationPoints.reduce((a, p) => a + p.sleptH, 0) / n;
        const meanY = correlationPoints.reduce((a, p) => a + p.volume, 0) / n;
        let num = 0, denX = 0, denY = 0;
        correlationPoints.forEach(p => {
            const dx = p.sleptH - meanX;
            const dy = p.volume - meanY;
            num += dx * dy;
            denX += dx * dx;
            denY += dy * dy;
        });
        if (denX > 0 && denY > 0) {
            pearsonR = num / Math.sqrt(denX * denY);
            regSlope = num / denX;
            regIntercept = meanY - regSlope * meanX;
        }
    }

    // 3. Regularidade Circadiana (Consistência de Horário de Dormir e Acordar)
    const circadianSeries = [];
    const sleepDatesSorted = Object.keys(sleepJournal || {}).sort().slice(-30);
    sleepDatesSorted.forEach(dateIso => {
        const e = sleepJournal[dateIso];
        if (!e || !e.bed || e.bed === '—') return;
        const sleptMinRaw = hhmmToMinutes(e.slept);
        const wakeMinRaw = hhmmToMinutes(e.wake);
        const { sleptH, eff } = calcSleepJournalEntry(e);
        if (sleptMinRaw === null || wakeMinRaw === null || sleptH <= 0) return;

        // Normaliza horário de dormir em escala contínua (ex: 23:30 = 23.5h / 1410m, 01:00 = 25.0h / 1500m)
        let sleptHourCont = sleptMinRaw / 60;
        if (sleptHourCont < 14) sleptHourCont += 24;
        const sleptMinCont = Math.round(sleptHourCont * 60);
        const wakeHour = wakeMinRaw / 60;

        const parts = dateIso.split('-');
        const label = parts.length === 3 ? `${parts[2]}/${parts[1]}` : dateIso;
        circadianSeries.push({
            dateIso,
            label,
            rawSlept: e.slept,
            rawWake: e.wake,
            sleptStr: e.slept,
            wakeStr: e.wake,
            sleptMin: sleptMinCont,
            wakeMin: wakeMinRaw,
            sleptHourCont: parseFloat(sleptHourCont.toFixed(2)),
            wakeHour: parseFloat(wakeHour.toFixed(2)),
            sleptH: parseFloat(sleptH.toFixed(2)),
            eff: Math.round(eff)
        });
    });

    let bedtimeSdMinutes = null;
    let wakeSdMinutes = null;
    let avgSleptClock = null;
    let avgWakeClock = null;

    function formatContHourToHHMM(contH) {
        let hNorm = contH % 24;
        if (hNorm < 0) hNorm += 24;
        const totalMin = Math.round(hNorm * 60);
        const hh = Math.floor(totalMin / 60) % 24;
        const mm = totalMin % 60;
        return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
    }

    if (circadianSeries.length >= 1) {
        const n = circadianSeries.length;
        const meanSleptCont = circadianSeries.reduce((a, c) => a + c.sleptHourCont, 0) / n;
        const meanWake = circadianSeries.reduce((a, c) => a + c.wakeHour, 0) / n;
        avgSleptClock = formatContHourToHHMM(meanSleptCont);
        avgWakeClock = formatContHourToHHMM(meanWake);

        if (n >= 2) {
            const varSlept = circadianSeries.reduce((a, c) => a + Math.pow((c.sleptHourCont - meanSleptCont) * 60, 2), 0) / n;
            const varWake = circadianSeries.reduce((a, c) => a + Math.pow((c.wakeHour - meanWake) * 60, 2), 0) / n;
            bedtimeSdMinutes = Math.round(Math.sqrt(varSlept));
            wakeSdMinutes = Math.round(Math.sqrt(varWake));
        }
    }

    return {
        exercisePRs,
        muscleBalance,
        correlationPoints,
        pearsonR,
        regSlope,
        regIntercept,
        circadianSeries,
        bedtimeSdMinutes,
        wakeSdMinutes,
        avgSleptClock,
        avgWakeClock
    };
}

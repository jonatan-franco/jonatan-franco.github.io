function calcSleepElasticity(sleepArr, bedArr) {
    const pairs = [];
    for (let i = 0; i < 7; i++) {
        const s = parseFloat(sleepArr[i]) || 0;
        const b = parseFloat(bedArr[i]) || 0;
        if (s > 0 && b > 0) pairs.push({ s, b });
    }
    if (pairs.length < 2) return 0;

    const meanS = pairs.reduce((a, p) => a + p.s, 0) / pairs.length;
    const meanB = pairs.reduce((a, p) => a + p.b, 0) / pairs.length;

    let cov = 0, varB = 0;
    pairs.forEach(p => {
        cov  += (p.b - meanB) * (p.s - meanS);
        varB += Math.pow(p.b - meanB, 2);
    });
    if (varB === 0) return 0;
    const slope = cov / varB;
    return slope * (meanB / (meanS || 1));
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

    let elasticity;
    if (habit.category === 'sono' && Array.isArray(habit.bedtimeHours)) {
        elasticity = calcSleepElasticity(
            habit.dailyHours.map(v => parseFloat(v) || 0),
            habit.bedtimeHours.map(v => parseFloat(v) || 0)
        );
    } else {
        const syncFactor = Math.exp(-Math.abs(freqRatio - Math.min(1, hoursRatio)) * 0.35);
        elasticity = hoursRatio * syncFactor;
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
        hoursRatio, hoursPct, sensitivityDerivative, elasticity, streak: maxStreak
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
    return h * 60 + (m || 0);
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

    if (validEntries.length > 0) {
        return validEntries.slice(-maxCount);
    }

    const sleepHabit = habits.find(h => h.category === 'sono' && Array.isArray(h.bedtimeHours));
    if (sleepHabit) {
        weekDays.forEach((d, i) => {
            const b = parseFloat(sleepHabit.bedtimeHours[i]) || 0;
            const s = parseFloat(sleepHabit.dailyHours[i]) || 0;
            if (b > 0 && s > 0) {
                validEntries.push({ date: d.iso, bedH: b, sleptH: s });
            }
        });
        return validEntries.slice(-maxCount);
    }

    return [];
}

/* Séries semanais de sono. Fonte principal: Diário do Sono; fallback: atividade da categoria "sono". */
function calcSleepWeekSeries() {
    const journal = weekDays.map(d => calcSleepJournalEntry(sleepJournal[d.iso]));
    let bed = [0, 0, 0, 0, 0, 0, 0], slept = [0, 0, 0, 0, 0, 0, 0], source = 'none';

    if (journal.some(e => e.bedH > 0)) {
        bed = journal.map(e => e.bedH);
        slept = journal.map(e => e.sleptH);
        source = 'journal';
    } else {
        const sleepHabit = habits.find(h => h.category === 'sono' && Array.isArray(h.bedtimeHours));
        if (sleepHabit && sleepHabit.bedtimeHours.some(v => (parseFloat(v) || 0) > 0)) {
            bed = sleepHabit.bedtimeHours.map(v => parseFloat(v) || 0);
            slept = sleepHabit.dailyHours.map(v => parseFloat(v) || 0);
            source = 'habit';
        }
    }

    const eff = bed.map((b, i) => b > 0 ? (slept[i] / b) * 100 : 0);

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

    let varianceSlept = 0;
    if (activeDays > 0) {
        recent.forEach(r => {
            varianceSlept += Math.pow(r.sleptH - meanSlept, 2);
        });
        varianceSlept = varianceSlept / activeDays;
    }
    const sdSlept = Math.sqrt(varianceSlept);

    // Razão agregada: sum(slept) / sum(bed) * 100
    const efficiency = meanBed > 0 ? (meanSlept / meanBed) * 100 : 0;
    // Média aritmética das eficiências diárias
    const meanDailyEfficiency = validEffDays > 0 ? sumDailyEff / validEffDays : 0;

    const elasticity = recent.length >= 2 
        ? calcSleepElasticity(recent.map(r => r.sleptH), recent.map(r => r.bedH))
        : calcSleepElasticity(slept, bed);

    return { bed, slept, eff, meanBed, meanSlept, sdSlept, efficiency, meanDailyEfficiency, activeDays, elasticity, source };
}

/* Formata horas decimais para [Valor_Horas][hminutos] com duas casas de minutos (ex: 7h30, 8h05) */
function formatSleepDuration(hours) {
    if (hours === null || hours === undefined || isNaN(hours) || hours <= 0) return '—';
    const totalMinutes = Math.round(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}h${String(m).padStart(2, '0')}`;
}

/* Volume de Carga dos últimos 7 dias (baseado em atvLogs / hq_atv_logs_v1) */
function calcWeeklyLoadMetrics() {
    let logs = {};
    try {
        const raw = typeof SafeStorage !== 'undefined' ? SafeStorage.getItem('hq_atv_logs_v1') : null;
        if (raw) logs = JSON.parse(raw) || {};
        else if (typeof atvLogs !== 'undefined') logs = atvLogs || {};
    } catch (e) {
        logs = {};
    }

    const dailyLoads = weekDays.map(d => {
        const list = Array.isArray(logs[d.iso]) ? logs[d.iso] : [];
        return list.reduce((acc, item) => acc + (parseFloat(item.weight) || 0), 0);
    });

    const totalLoad = dailyLoads.reduce((a, b) => a + b, 0);
    const meanDailyLoad = totalLoad / 7;
    const activeDays = dailyLoads.filter(v => v > 0).length;
    const meanSessionLoad = activeDays > 0 ? totalLoad / activeDays : 0;
    const variance = dailyLoads.reduce((acc, v) => acc + Math.pow(v - meanDailyLoad, 2), 0) / 7;
    const sdDailyLoad = Math.sqrt(variance);

    let maxSingleLoad = 0;
    weekDays.forEach(d => {
        const list = Array.isArray(logs[d.iso]) ? logs[d.iso] : [];
        list.forEach(item => {
            const w = parseFloat(item.weight) || 0;
            if (w > maxSingleLoad) maxSingleLoad = w;
        });
    });

    return {
        dailyLoads,
        totalLoad,
        meanDailyLoad,
        meanSessionLoad,
        sdDailyLoad,
        activeDays,
        maxSingleLoad
    };
}


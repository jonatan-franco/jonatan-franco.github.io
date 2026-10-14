/* Sensibilidade Comportamental do Sono:
   Elasticidade do tempo dormido em relação ao tempo de cama.
   Regressão linear simples: sono = a + b·cama
   ε = b · (média_cama / média_sono) */
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

    /* Se não há variação no tempo de cama, não há como medir sensibilidade */
    if (varB === 0) return 0;

    const slope = cov / varB; /* Δsono / Δcama (h de sono por h de cama) */
    return slope * (meanB / (meanS || 1)); /* elasticidade no ponto médio */
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
    let isSleep = false;
    if (habit.category === 'sono' && Array.isArray(habit.bedtimeHours)) {
        elasticity = calcSleepElasticity(
            habit.dailyHours.map(v => parseFloat(v) || 0),
            habit.bedtimeHours.map(v => parseFloat(v) || 0)
        );
        isSleep = true;
    } else {
        const syncFactor = Math.exp(-Math.abs(freqRatio - Math.min(1, hoursRatio)) * 0.35);
        elasticity = hoursRatio * syncFactor;
    }

    let maxStreak = 0, cur = 0;
    habit.checks.forEach(c => {
        if (c) { cur++; if (cur > maxStreak) maxStreak = cur; }
        else { cur = 0; }
    });

    return {
        daysCompleted, freqRatio, freqPct,
        totalHours, meanHours, sdHours, targetH,
        hoursRatio, hoursPct, sensitivityDerivative,
        elasticity, streak: maxStreak, isSleep
    };
}

/* Métricas de sono agregadas (tempo de cama, tempo dormido, eficiência) */
function calcSleepAggregates(habit) {
    if (!habit || !Array.isArray(habit.bedtimeHours)) {
        return { meanBed: 0, meanSlept: 0, efficiency: 0, activeDays: 0 };
    }
    let sumBed = 0, sumSlept = 0, activeDays = 0;
    for (let i = 0; i < 7; i++) {
        const b = parseFloat(habit.bedtimeHours[i]) || 0;
        const s = parseFloat(habit.dailyHours[i]) || 0;
        if (b > 0) {
            sumBed += b;
            sumSlept += s;
            activeDays++;
        }
    }
    const meanBed = activeDays > 0 ? sumBed / activeDays : 0;
    const meanSlept = activeDays > 0 ? sumSlept / activeDays : 0;
    const efficiency = meanBed > 0 ? (meanSlept / meanBed) * 100 : 0;
    return { meanBed, meanSlept, efficiency, activeDays };
}

function calcWeeklyGlobalMetrics() {
    if (habits.length === 0) {
        return {
            avgFreqPct: 0, totalChecks: 0, possibleChecks: 0,
            avgSensitivity: 0,
            sumTotalHours: 0, sumTargetHours: 0,
            dailyTotalMeanHours: 0, dailyTotalSdHours: 0,
            bestStreak: 0, leaderName: '-', todayDone: 0
        };
    }
    const metrics = habits.map(h => calcHabitMetrics(h));
    const k = metrics.length;
    const avgFreqPct = metrics.reduce((a, m) => a + m.freqPct, 0) / k;
    const totalChecks = metrics.reduce((a, m) => a + m.daysCompleted, 0);

    const dailyTotals = [0, 0, 0, 0, 0, 0, 0];
    habits.forEach(h => h.dailyHours.forEach((hr, i) => dailyTotals[i] += (parseFloat(hr) || 0)));

    const sumTotalHours = dailyTotals.reduce((a, b) => a + b, 0);
    const sumTargetHours = habits.reduce((a, h) => a + h.targetHours, 0);
    const dailyTotalMeanHours = sumTotalHours / 7;
    const dailyTotalSdHours = Math.sqrt(dailyTotals.reduce((acc, v) => acc + Math.pow(v - dailyTotalMeanHours, 2), 0) / 7);

    const avgSensitivity = metrics.reduce((a, m) => a + m.sensitivityDerivative, 0) / k;

    let bestStreak = 0, leaderName = 'Nenhum';
    metrics.forEach((m, i) => {
        if (m.streak > bestStreak) {
            bestStreak = m.streak;
            leaderName = habits[i].name;
        }
    });

    const tIdx = todayIndex !== -1 ? todayIndex : 0;
    const todayDone = habits.filter(h => h.checks[tIdx]).length;

    return {
        avgFreqPct, totalChecks, possibleChecks: k * 7,
        avgSensitivity,
        sumTotalHours, sumTargetHours,
        dailyTotalMeanHours, dailyTotalSdHours,
        bestStreak, leaderName, todayDone
    };
}

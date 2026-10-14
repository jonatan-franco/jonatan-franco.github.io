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
    const syncFactor = Math.exp(-Math.abs(freqRatio - Math.min(1, hoursRatio)) * 0.35);
    const elasticity = hoursRatio * syncFactor;

    let maxStreak = 0, cur = 0;
    habit.checks.forEach(c => {
        if (c) { cur++; if (cur > maxStreak) maxStreak = cur; }
        else { cur = 0; }
    });

    return {
        daysCompleted, freqRatio, freqPct,
        totalHours, meanHours, sdHours, targetH,
        hoursRatio, hoursPct, sensitivityDerivative, elasticity, streak: maxStreak
    };
}

function calcWeeklyGlobalMetrics() {
    if (habits.length === 0) {
        return {
            avgFreqPct: 0, totalChecks: 0, possibleChecks: 0,
            globalElasticity: 0, avgSensitivity: 0,
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

    const globalHoursRatio = sumTargetHours > 0 ? (sumTotalHours / sumTargetHours) : 0;
    const globalElasticity = globalHoursRatio * Math.exp(-Math.abs((avgFreqPct / 100) - Math.min(1, globalHoursRatio)) * 0.35);
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
        globalElasticity, avgSensitivity,
        sumTotalHours, sumTargetHours,
        dailyTotalMeanHours, dailyTotalSdHours,
        bestStreak, leaderName, todayDone
    };
}
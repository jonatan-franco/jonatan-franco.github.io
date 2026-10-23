let activityChartScope = 'molecular';
let groupViewMode = 'total';
let totalChartInstance = null;
let activityChartInstance = null;

function hexToRgba(hex, alpha) {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16) || 139;
    const g = parseInt(clean.substring(2, 4), 16) || 92;
    const b = parseInt(clean.substring(4, 6), 16) || 246;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

window.setActivityChartScope = function(scope) {
    activityChartScope = scope;
    document.getElementById('btn-scope-molecular').className = scope === 'molecular'
        ? "px-3 py-1 rounded-full bg-black text-white font-semibold transition"
        : "px-3 py-1 rounded-full text-zinc-600 hover:text-black transition";
    document.getElementById('btn-scope-group').className = scope === 'group'
        ? "px-3 py-1 rounded-full bg-black text-white font-semibold transition"
        : "px-3 py-1 rounded-full text-zinc-600 hover:text-black transition";

    const modeBar = document.getElementById('group-view-mode-bar');
    if (modeBar) {
        modeBar.classList.toggle('hidden', scope !== 'group');
        modeBar.classList.toggle('flex', scope === 'group');
    }

    populateActivityChartTargetSelect();
    renderMetricsView();
};

window.setGroupViewMode = function(mode) {
    groupViewMode = mode;
    const btnT = document.getElementById('btn-group-total');
    const btnP = document.getElementById('btn-group-particular');
    if (btnT && btnP) {
        btnT.className = mode === 'total'
            ? "px-3 py-1 rounded-full bg-purple-600 text-white font-semibold transition"
            : "px-3 py-1 rounded-full text-zinc-600 hover:text-black transition";
        btnP.className = mode === 'particular'
            ? "px-3 py-1 rounded-full bg-purple-600 text-white font-semibold transition"
            : "px-3 py-1 rounded-full text-zinc-600 hover:text-black transition";
    }
    populateActivityChartTargetSelect();
    renderMetricsView();
};

function populateActivityChartTargetSelect() {
    const sel = document.getElementById('activity-chart-target');
    if (!sel) return;
    const prev = sel.value;
    sel.innerHTML = '';

    if (activityChartScope === 'molecular') {
        habits.forEach((h, idx) => {
            const cat = CATEGORIES[h.category] || CATEGORIES.atv_fisica;
            sel.innerHTML += `<option value="${idx}">${cat.emoji} ${h.name} (c/ ±DP)</option>`;
        });
        sel.innerHTML += `<option value="all">📊 Todas as Moleculares</option>`;
    } else {
        Object.keys(CATEGORIES).forEach(key => {
            const cat = CATEGORIES[key];
            sel.innerHTML += `<option value="${key}">${cat.emoji} Grupo: ${cat.label} (c/ ±DP)</option>`;
        });
        sel.innerHTML += `<option value="all">📊 Todos os Grupos</option>`;
    }
    if (prev && Array.from(sel.options).some(o => o.value === prev)) sel.value = prev;
}

function buildLineWithSdDatasets(label, series, colorHex, showBand) {
    const n = series.length || 1;
    const mean = series.reduce((a, b) => a + b, 0) / n;
    const sd = Math.sqrt(series.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / n);

    const datasets = [{
        label: `${label} (μ=${mean.toFixed(2)}h, σ=${sd.toFixed(2)}h)`,
        data: series.map(v => parseFloat(v.toFixed(2))),
        borderColor: colorHex,
        backgroundColor: colorHex,
        borderWidth: 2.5,
        pointRadius: 4,
        tension: 0.35,
        fill: false
    }];

    if (showBand) {
        datasets.push(
            {
                label: `+1 DP (+${sd.toFixed(2)}h)`,
                data: series.map(v => parseFloat((v + sd).toFixed(2))),
                borderColor: hexToRgba(colorHex, 0.4),
                borderWidth: 1,
                borderDash: [4, 4],
                pointRadius: 0,
                tension: 0.35,
                fill: false
            },
            {
                label: `Banda ±DP (±${sd.toFixed(2)}h)`,
                data: series.map(v => parseFloat(Math.max(0, v - sd).toFixed(2))),
                borderColor: hexToRgba(colorHex, 0.4),
                backgroundColor: hexToRgba(colorHex, 0.15),
                borderWidth: 1,
                borderDash: [4, 4],
                pointRadius: 0,
                tension: 0.35,
                fill: '-1'
            }
        );
    }
    return datasets;
}

function renderMetricsView() {
    if (typeof Chart === 'undefined') return;
    const sel = document.getElementById('activity-chart-target');
    if (sel && sel.options.length === 0) populateActivityChartTargetSelect();

    const xLabels = weekDays.map(d => d.shortName);

    const ctxTotal = document.getElementById('totalPanelChart').getContext('2d');
    if (totalChartInstance) totalChartInstance.destroy();

    const dailyHoursSum = [0, 0, 0, 0, 0, 0, 0];
    const dailyChecksSum = [0, 0, 0, 0, 0, 0, 0];
    habits.forEach(h => {
        h.dailyHours.forEach((hr, i) => dailyHoursSum[i] += (parseFloat(hr) || 0));
        h.checks.forEach((c, i) => { if (c) dailyChecksSum[i]++; });
    });

    totalChartInstance = new Chart(ctxTotal, {
        type: 'bar',
        data: {
            labels: xLabels,
            datasets: [
                { label: 'Horas (h)', data: dailyHoursSum.map(v => parseFloat(v.toFixed(2))), backgroundColor: '#fde68a', borderRadius: 8, yAxisID: 'y' },
                { label: 'Conclusão (%)', data: dailyChecksSum.map(c => habits.length > 0 ? Math.round((c / habits.length) * 100) : 0), backgroundColor: '#6ee7b7', borderRadius: 8, yAxisID: 'y1' }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            plugins: { legend: { position: 'bottom' } },
            scales: {
                y: { position: 'left', min: 0, grid: { color: '#f4f4f5' } },
                y1: { position: 'right', min: 0, max: 100, grid: { drawOnChartArea: false } }
            }
        }
    });

    const ctxAct = document.getElementById('activityPanelChart').getContext('2d');
    if (activityChartInstance) activityChartInstance.destroy();

    const targetVal = sel ? sel.value : '0';
    let datasets = [];

    if (activityChartScope === 'molecular') {
        if (targetVal === 'all') {
            habits.forEach((h, idx) => {
                datasets.push(...buildLineWithSdDatasets(h.name, h.dailyHours.map(v => parseFloat(v) || 0), PALETTE[idx % PALETTE.length], false));
            });
        } else {
            const h = habits[parseInt(targetVal, 10) || 0] || habits[0];
            if (h) datasets.push(...buildLineWithSdDatasets(h.name, h.dailyHours.map(v => parseFloat(v) || 0), (CATEGORIES[h.category] || CATEGORIES.atv_fisica).hex, true));
        }
    } else {
        if (targetVal === 'all' || groupViewMode === 'total') {
            Object.keys(CATEGORIES).forEach(key => {
                const cat = CATEGORIES[key];
                const series = [0, 0, 0, 0, 0, 0, 0];
                habits.filter(h => h.category === key).forEach(h => h.dailyHours.forEach((hr, d) => series[d] += (parseFloat(hr) || 0)));
                datasets.push(...buildLineWithSdDatasets(cat.label, series, cat.hex, false));
            });
        } else {
            const cat = CATEGORIES[targetVal] || CATEGORIES.atv_fisica;
            const series = [0, 0, 0, 0, 0, 0, 0];
            habits.filter(h => h.category === targetVal).forEach(h => h.dailyHours.forEach((hr, d) => series[d] += (parseFloat(hr) || 0)));
            datasets.push(...buildLineWithSdDatasets(`Grupo ${cat.label}`, series, cat.hex, true));
        }
    }

    activityChartInstance = new Chart(ctxAct, {
        type: 'line',
        data: { labels: xLabels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            interaction: { mode: 'index', intersect: false },
            plugins: { legend: { position: 'bottom', labels: { font: { size: 10 } } } },
            scales: {
                x: { title: { display: true, text: 'Dias da Semana' }, grid: { color: '#f4f4f5' } },
                y: { min: 0, title: { display: true, text: 'Horas de Atividade (h)' }, grid: { color: '#f4f4f5' } }
            }
        }
    });
}

/* ===== Dashboard (somente leitura) ===== */
let dashSleepChartInstance = null;
let dashSleepChartMode = 'all'; // 'all' | 'slept' | 'bed' | 'eff'

window.setDashSleepChartMode = function(mode) {
    dashSleepChartMode = mode;
    ['all', 'slept', 'bed', 'eff'].forEach(m => {
        const btn = document.getElementById('sleep-mode-btn-' + m);
        if (btn) {
            btn.className = m === mode
                ? "px-3 py-1.5 rounded-full bg-black text-white font-semibold shadow-xs transition"
                : "px-3 py-1.5 rounded-full text-zinc-600 hover:text-black transition";
        }
    });
    renderDashboardCharts();
};

function renderDashboardCharts() {
    if (typeof Chart === 'undefined') return;
    const xLabels = weekDays.map(d => d.shortName);

    const sleepCanvas = document.getElementById('dashSleepChart');
    if (!sleepCanvas) return;

    const s = calcSleepWeekSeries();
    const weekActive = typeof s.weekActiveDays === 'number' ? s.weekActiveDays : s.activeDays;
    const wMeanSlept = typeof s.weekMeanSlept === 'number' ? s.weekMeanSlept : s.meanSlept;
    const wSdSlept = typeof s.weekSdSlept === 'number' ? s.weekSdSlept : s.sdSlept;
    const wMeanBed = typeof s.weekMeanBed === 'number' ? s.weekMeanBed : s.meanBed;
    const wSdBed = typeof s.weekSdBed === 'number' ? s.weekSdBed : s.sdBed;
    const wMeanEff = typeof s.weekMeanEff === 'number' ? s.weekMeanEff : s.meanDailyEfficiency;
    const wSdEff = typeof s.weekSdEff === 'number' ? s.weekSdEff : s.sdDailyEff;

    const empty = document.getElementById('dash-sleep-empty');
    if (empty) {
        empty.classList.toggle('hidden', weekActive > 0);
        empty.classList.toggle('flex', weekActive === 0);
    }

    const src = document.getElementById('dash-sleep-source');
    if (src) {
        src.textContent = s.source === 'journal' ? 'Horas por noite e eficiência (%) — fonte: Diário do Sono.'
            : s.source === 'habit' ? 'Horas por noite e eficiência (%) — fonte: atividade "Sono".'
            : 'Horas por noite e eficiência (%).';
    }

    const toNull = arr => arr.map(v => v > 0 ? parseFloat(v.toFixed(2)) : null);

    if (dashSleepChartInstance) {
        dashSleepChartInstance.destroy();
        dashSleepChartInstance = null;
    }

    if (weekActive === 0) {
        if (typeof renderDashLoadEvolutionChart === 'function') renderDashLoadEvolutionChart();
        return;
    }

    let datasets = [];
    let scales = {};
    // O desvio-padrão do gráfico de análise de sono é calculado com base na semana analisada (weekDays)
    const hasSleepSdBand = weekActive >= 2 && wSdSlept > 0;

    if (dashSleepChartMode === 'slept') {
        const meanLine = Array(7).fill(weekActive > 0 ? parseFloat(wMeanSlept.toFixed(2)) : null);
        const meanLabel = hasSleepSdBand
            ? `Média (μ=${wMeanSlept.toFixed(1)}h, σ=±${wSdSlept.toFixed(2)}h)`
            : `Média (μ=${wMeanSlept.toFixed(1)}h)`;

        datasets = [
            { type: 'bar', label: `Tempo Dormido (h)`, data: toNull(s.slept), backgroundColor: '#6366f1', borderRadius: 8, order: 2 },
            { type: 'line', label: meanLabel, data: meanLine, borderColor: '#312e81', borderWidth: 2, borderDash: [6, 4], pointRadius: 0, fill: false, order: 0 }
        ];

        if (hasSleepSdBand) {
            const plusSdLine = Array(7).fill(parseFloat((wMeanSlept + wSdSlept).toFixed(2)));
            const minusSdLine = Array(7).fill(parseFloat(Math.max(0, wMeanSlept - wSdSlept).toFixed(2)));
            datasets.push(
                { type: 'line', label: `+1 DP (+${wSdSlept.toFixed(2)}h)`, data: plusSdLine, borderColor: 'rgba(99, 102, 241, 0.45)', borderWidth: 1, borderDash: [3, 3], pointRadius: 0, fill: false, order: 1 },
                { type: 'line', label: `Faixa ±DP (±${wSdSlept.toFixed(2)}h)`, data: minusSdLine, borderColor: 'rgba(99, 102, 241, 0.45)', borderWidth: 1, borderDash: [3, 3], pointRadius: 0, fill: '-1', backgroundColor: 'rgba(99, 102, 241, 0.14)', order: 1 }
            );
        }

        scales = {
            x: { grid: { display: false } },
            y: { min: 0, suggestedMax: Math.max(10, wMeanSlept + wSdSlept + 1), grid: { color: '#f4f4f5' }, title: { display: true, text: 'Horas dormidas (h)' } }
        };
    } else if (dashSleepChartMode === 'bed') {
        const hasBedSdBand = weekActive >= 2 && wSdBed > 0;
        const meanLine = Array(7).fill(weekActive > 0 ? parseFloat(wMeanBed.toFixed(2)) : null);
        const meanLabel = hasBedSdBand
            ? `Média Cama (μ=${wMeanBed.toFixed(1)}h, σ=±${wSdBed.toFixed(2)}h)`
            : `Média Cama (μ=${wMeanBed.toFixed(1)}h)`;

        datasets = [
            { type: 'bar', label: `Tempo de Cama (h)`, data: toNull(s.bed), backgroundColor: '#818cf8', borderRadius: 8, order: 2 },
            { type: 'line', label: meanLabel, data: meanLine, borderColor: '#312e81', borderWidth: 2, borderDash: [6, 4], pointRadius: 0, fill: false, order: 0 }
        ];

        if (hasBedSdBand) {
            const plusSdLine = Array(7).fill(parseFloat((wMeanBed + wSdBed).toFixed(2)));
            const minusSdLine = Array(7).fill(parseFloat(Math.max(0, wMeanBed - wSdBed).toFixed(2)));
            datasets.push(
                { type: 'line', label: `+1 DP (+${wSdBed.toFixed(2)}h)`, data: plusSdLine, borderColor: 'rgba(129, 140, 248, 0.45)', borderWidth: 1, borderDash: [3, 3], pointRadius: 0, fill: false, order: 1 },
                { type: 'line', label: `Faixa ±DP (±${wSdBed.toFixed(2)}h)`, data: minusSdLine, borderColor: 'rgba(129, 140, 248, 0.45)', borderWidth: 1, borderDash: [3, 3], pointRadius: 0, fill: '-1', backgroundColor: 'rgba(129, 140, 248, 0.14)', order: 1 }
            );
        }

        scales = {
            x: { grid: { display: false } },
            y: { min: 0, suggestedMax: Math.max(10, wMeanBed + wSdBed + 1), grid: { color: '#f4f4f5' }, title: { display: true, text: 'Tempo de cama (h)' } }
        };
    } else if (dashSleepChartMode === 'eff') {
        const hasEffSdBand = weekActive >= 2 && wSdEff > 0;
        const meanLine = Array(7).fill(weekActive > 0 ? parseFloat(wMeanEff.toFixed(1)) : null);
        const meanLabel = hasEffSdBand
            ? `μ(E) = ${wMeanEff.toFixed(1)}% (σ=±${wSdEff.toFixed(1)}%)`
            : `μ(E) = ${wMeanEff.toFixed(1)}%`;

        datasets = [
            { type: 'bar', label: `Eficiência (%)`, data: toNull(s.eff).map(v => v === null ? null : Math.round(v)), backgroundColor: '#a855f7', borderRadius: 8, order: 2 },
            { type: 'line', label: meanLabel, data: meanLine, borderColor: '#6b21a8', borderWidth: 2, borderDash: [6, 4], pointRadius: 0, fill: false, order: 0 }
        ];

        if (hasEffSdBand) {
            const plusSdLine = Array(7).fill(parseFloat(Math.min(100, wMeanEff + wSdEff).toFixed(1)));
            const minusSdLine = Array(7).fill(parseFloat(Math.max(0, wMeanEff - wSdEff).toFixed(1)));
            datasets.push(
                { type: 'line', label: `+1 DP (+${wSdEff.toFixed(1)}%)`, data: plusSdLine, borderColor: 'rgba(168, 85, 247, 0.45)', borderWidth: 1, borderDash: [3, 3], pointRadius: 0, fill: false, order: 1 },
                { type: 'line', label: `Faixa ±DP (±${wSdEff.toFixed(1)}%)`, data: minusSdLine, borderColor: 'rgba(168, 85, 247, 0.45)', borderWidth: 1, borderDash: [3, 3], pointRadius: 0, fill: '-1', backgroundColor: 'rgba(168, 85, 247, 0.14)', order: 1 }
            );
        }

        scales = {
            x: { grid: { display: false } },
            y: { min: 0, max: 100, grid: { color: '#f4f4f5' }, title: { display: true, text: 'Eficiência (%)' }, ticks: { callback: v => v + '%' } }
        };
    } else {
        // Modo 'all': Cama vs Dormido com Eficiência e faixa ±DP baseada na semana analisada
        const meanLine = Array(7).fill(weekActive > 0 ? parseFloat(wMeanSlept.toFixed(2)) : null);
        const meanLabel = hasSleepSdBand
            ? `Média Sono (μ=${wMeanSlept.toFixed(1)}h, σ=±${wSdSlept.toFixed(2)}h)`
            : `Média Sono (μ=${wMeanSlept.toFixed(1)}h)`;

        datasets = [
            { type: 'line', label: 'Eficiência (%)', data: toNull(s.eff).map(v => v === null ? null : Math.round(v)), borderColor: '#a855f7', backgroundColor: '#a855f7', borderWidth: 2.5, pointRadius: 4, tension: 0.35, spanGaps: true, yAxisID: 'y1', order: 0 },
            { type: 'line', label: meanLabel, data: meanLine, borderColor: '#312e81', borderWidth: 2, borderDash: [6, 4], pointRadius: 0, fill: false, yAxisID: 'y', order: 1 }
        ];

        if (hasSleepSdBand) {
            const plusSdLine = Array(7).fill(parseFloat((wMeanSlept + wSdSlept).toFixed(2)));
            const minusSdLine = Array(7).fill(parseFloat(Math.max(0, wMeanSlept - wSdSlept).toFixed(2)));
            datasets.push(
                { type: 'line', label: `+1 DP (+${wSdSlept.toFixed(2)}h)`, data: plusSdLine, borderColor: 'rgba(99, 102, 241, 0.45)', borderWidth: 1, borderDash: [3, 3], pointRadius: 0, fill: false, yAxisID: 'y', order: 1 },
                { type: 'line', label: `Faixa ±DP (±${wSdSlept.toFixed(2)}h)`, data: minusSdLine, borderColor: 'rgba(99, 102, 241, 0.45)', borderWidth: 1, borderDash: [3, 3], pointRadius: 0, fill: '-1', backgroundColor: 'rgba(99, 102, 241, 0.14)', yAxisID: 'y', order: 1 }
            );
        }

        datasets.push(
            { type: 'bar', label: 'Tempo de cama (h)', data: toNull(s.bed), backgroundColor: '#c7d2fe', borderRadius: 6, yAxisID: 'y', order: 2 },
            { type: 'bar', label: 'Tempo dormido (h)', data: toNull(s.slept), backgroundColor: '#6366f1', borderRadius: 6, yAxisID: 'y', order: 2 }
        );

        scales = {
            x: { grid: { display: false } },
            y: { position: 'left', min: 0, suggestedMax: Math.max(10, wMeanBed + 1), grid: { color: '#f4f4f5' }, title: { display: true, text: 'Horas (h)' } },
            y1: { position: 'right', min: 0, max: 100, grid: { drawOnChartArea: false }, title: { display: true, text: 'Eficiência (%)' }, ticks: { callback: v => v + '%' } }
        };
    }

    const config = {
        type: 'bar',
        data: { labels: xLabels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            animations: { colors: false, x: false, y: false },
            transitions: { active: { animation: { duration: 0 } } },
            interaction: { mode: 'index', intersect: false },
            plugins: { legend: { position: 'bottom', labels: { font: { size: 11 } } } },
            scales
        }
    };

    dashSleepChartInstance = new Chart(sleepCanvas.getContext('2d'), config);

    renderDashLoadEvolutionChart();
}

/* ===== Gráfico de Evolução de Volume de Carga (Últimos 30 dias) ===== */
let dashLoadChartInstance = null;
let dashLoadZoomChartInstance = null;
let dashLoadChartScope = 'group'; // 'group' | 'exercise'

function getDistinctExerciseColor(idx) {
    if (Array.isArray(PALETTE) && idx >= 0 && idx < PALETTE.length) {
        return PALETTE[idx];
    }
    // Gera cores fortes e distintas por ângulo áureo caso ultrapasse o tamanho da paleta
    const hue = Math.round((idx * 137.508) % 360);
    const sat = 78;
    const light = 45;
    const s = sat / 100;
    const l = light / 100;
    const k = n => (n + hue / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    const toHex = x => Math.round(255 * x).toString(16).padStart(2, '0');
    return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

function syncLoadScopeButtons(scope) {
    ['btn-load-scope-group', 'btn-load-zoom-scope-group'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.className = scope === 'group'
                ? "px-3 py-1.5 rounded-full bg-black text-white font-semibold shadow-xs transition"
                : "px-3 py-1.5 rounded-full text-zinc-600 hover:text-black transition";
        }
    });
    ['btn-load-scope-exercise', 'btn-load-zoom-scope-exercise'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.className = scope === 'exercise'
                ? "px-3 py-1.5 rounded-full bg-black text-white font-semibold shadow-xs transition"
                : "px-3 py-1.5 rounded-full text-zinc-600 hover:text-black transition";
        }
    });
}

window.setDashLoadChartScope = function(scope) {
    dashLoadChartScope = scope;
    syncLoadScopeButtons(scope);
    const evo = calcLoadEvolution30d();
    populateDashLoadChartSelect(evo, true);
    renderDashLoadEvolutionChart(evo);
    renderDashLoadZoomChart(evo);
};

window.setDashLoadZoomScope = function(scope) {
    window.setDashLoadChartScope(scope);
};

window.onDashLoadZoomTargetChange = function(val) {
    const mainSel = document.getElementById('dash-load-chart-target');
    if (mainSel) mainSel.value = val;
    const evo = calcLoadEvolution30d();
    renderDashLoadEvolutionChart(evo);
    renderDashLoadZoomChart(evo);
};

function populateDashLoadChartSelect(evoData, forceReset) {
    const evo = evoData || calcLoadEvolution30d();
    ['dash-load-chart-target', 'dash-load-zoom-target'].forEach(selId => {
        const sel = document.getElementById(selId);
        if (!sel) return;
        const prev = forceReset ? '' : sel.value;
        sel.innerHTML = '';

        if (dashLoadChartScope === 'group') {
            sel.innerHTML += `<option value="all">📊 Todos os Grupos (Upper / Lower)</option>`;
            sel.innerHTML += `<option value="total_all">📈 Volume Total (Geral)</option>`;
            sel.innerHTML += `<option value="upper_a">🏋️ Upper A</option>`;
            sel.innerHTML += `<option value="lower_a">🦵 Lower A</option>`;
            sel.innerHTML += `<option value="upper_b">🏋️ Upper B</option>`;
            sel.innerHTML += `<option value="lower_b">🦵 Lower B</option>`;
        } else {
            if (evo.exercises.length === 0) {
                sel.innerHTML += `<option value="none">Sem exercícios registrados</option>`;
            } else {
                sel.innerHTML += `<option value="all">📊 Todos os Exercícios Registrados (${evo.exercises.length})</option>`;
                evo.exercises.forEach(ex => {
                    sel.innerHTML += `<option value="${ex.name}">💪 ${ex.name}</option>`;
                });
            }
        }

        if (prev && Array.from(sel.options).some(o => o.value === prev)) {
            sel.value = prev;
        }
    });
}

function buildLoadDatasetItem(label, seriesObj, color, isSingleView) {
    const synIdx = typeof seriesObj.syntheticZeroIdx === 'number' ? seriesObj.syntheticZeroIdx : -1;
    const baseRadius = isSingleView ? 5.5 : 4.5;
    const hoverRadius = isSingleView ? 7.5 : 6.5;
    return {
        type: 'line',
        label,
        data: seriesObj.volumeSeries.map(v => v !== null ? parseFloat(v.toFixed(2)) : null),
        borderColor: color,
        backgroundColor: isSingleView ? hexToRgba(color, 0.16) : color,
        pointBackgroundColor: color,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 1.5,
        borderWidth: isSingleView ? 3 : 2.5,
        pointRadius: ctx => ctx.dataIndex === synIdx ? 0 : baseRadius,
        pointHoverRadius: ctx => ctx.dataIndex === synIdx ? 0 : hoverRadius,
        pointHitRadius: ctx => ctx.dataIndex === synIdx ? 0 : 4,
        showLine: true,
        tension: 0.25,
        spanGaps: true,
        fill: isSingleView,
        _weightSeries: seriesObj.weightSeries,
        _syntheticZeroIdx: synIdx
    };
}

function buildLoadEvolutionChartConfig(evo, targetVal) {
    const xLabels = evo.days.map(d => d.label);
    const datasets = [];

    if (dashLoadChartScope === 'group') {
        const groupKeys = ['total_all', 'upper_a', 'lower_a', 'upper_b', 'lower_b'];
        if (targetVal === 'all' || !evo.groups[targetVal]) {
            groupKeys.forEach(gk => {
                const g = evo.groups[gk];
                if (!g) return;
                const hasData = g.volumeSeries.some((v, idx) => v !== null && idx !== g.syntheticZeroIdx);
                if (!hasData && gk !== 'upper_a' && gk !== 'lower_a') return;
                datasets.push(buildLoadDatasetItem(g.label, g, g.color, false));
            });
        } else {
            const g = evo.groups[targetVal];
            if (g) {
                datasets.push(buildLoadDatasetItem(`${g.label} — Volume (kg)`, g, g.color, true));
            }
        }
    } else {
        if (targetVal === 'all') {
            evo.exercises.forEach((ex, idx) => {
                const color = getDistinctExerciseColor(idx);
                datasets.push(buildLoadDatasetItem(ex.name, ex, color, false));
            });
        } else {
            const exIdx = evo.exercises.findIndex(e => e.name === targetVal);
            const ex = exIdx >= 0 ? evo.exercises[exIdx] : evo.exercises[0];
            if (ex) {
                const color = getDistinctExerciseColor(exIdx >= 0 ? exIdx : 0);
                datasets.push(buildLoadDatasetItem(`${ex.name} — Volume (kg)`, ex, color, true));
            }
        }
    }

    return {
        type: 'line',
        data: { labels: xLabels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            animations: { colors: false, x: false, y: false },
            transitions: { active: { animation: { duration: 0 } } },
            interaction: { mode: 'nearest', axis: 'xy', intersect: true },
            hover: { mode: 'nearest', axis: 'xy', intersect: true },
            plugins: {
                legend: { position: 'bottom', labels: { font: { size: 11 }, usePointStyle: true, pointStyle: 'circle' } },
                tooltip: {
                    // Garante que apenas o único ponto real sob o mouse seja exibido (sem mostrar outros exercícios nem o ponto de origem 0)
                    filter(tooltipItem, index) {
                        if (tooltipItem.dataset && tooltipItem.dataIndex === tooltipItem.dataset._syntheticZeroIdx) {
                            return false;
                        }
                        return index === 0;
                    },
                    callbacks: {
                        label(context) {
                            if (context.dataset && context.dataIndex === context.dataset._syntheticZeroIdx) return '';
                            const vol = context.parsed.y;
                            if (vol === null || vol === undefined) return '';
                            const ws = context.dataset._weightSeries;
                            const w = ws ? ws[context.dataIndex] : null;
                            const volFmt = vol.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                            if (w !== null && w !== undefined && w > 0) {
                                const wFmt = w.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                return `${context.dataset.label}: ${volFmt} kg (Carga: ${wFmt} kg)`;
                            }
                            return `${context.dataset.label}: ${volFmt} kg`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { maxRotation: 45, minRotation: 0, font: { size: 10 } },
                    title: { display: true, text: 'Últimos 30 dias' }
                },
                y: {
                    min: 0,
                    grid: { color: '#f4f4f5' },
                    title: { display: true, text: 'Volume de Carga (kg)' },
                    ticks: { callback: v => v.toLocaleString('pt-BR') + ' kg' }
                }
            }
        }
    };
}

window.renderDashLoadEvolutionChart = function(evoData) {
    if (typeof Chart === 'undefined') return;
    const canvas = document.getElementById('dashLoadEvolutionChart');
    if (!canvas) return;

    const evo = evoData || calcLoadEvolution30d();
    const sel = document.getElementById('dash-load-chart-target');
    if (sel && sel.options.length === 0) {
        populateDashLoadChartSelect(evo, false);
    }

    const zoomSel = document.getElementById('dash-load-zoom-target');
    if (sel && zoomSel && zoomSel.options.length > 0) {
        zoomSel.value = sel.value;
    }

    const empty = document.getElementById('dash-load-empty');
    if (empty) {
        empty.classList.toggle('hidden', evo.hasAnyLog);
        empty.classList.toggle('flex', !evo.hasAnyLog);
    }

    if (dashLoadChartInstance) {
        dashLoadChartInstance.destroy();
        dashLoadChartInstance = null;
    }

    if (!evo.hasAnyLog) return;

    const targetVal = sel ? sel.value : 'all';
    dashLoadChartInstance = new Chart(canvas.getContext('2d'), buildLoadEvolutionChartConfig(evo, targetVal));
};

function renderDashLoadZoomChart(evoData) {
    if (typeof Chart === 'undefined') return;
    const modal = document.getElementById('dash-load-zoom-modal');
    if (!modal || modal.classList.contains('hidden')) return;
    const canvas = document.getElementById('dashLoadZoomChart');
    if (!canvas) return;

    const evo = evoData || calcLoadEvolution30d();
    if (dashLoadZoomChartInstance) {
        dashLoadZoomChartInstance.destroy();
        dashLoadZoomChartInstance = null;
    }
    if (!evo.hasAnyLog) return;

    const sel = document.getElementById('dash-load-zoom-target') || document.getElementById('dash-load-chart-target');
    const targetVal = sel ? sel.value : 'all';
    dashLoadZoomChartInstance = new Chart(canvas.getContext('2d'), buildLoadEvolutionChartConfig(evo, targetVal));
}

window.openLoadChartZoomModal = function() {
    const modal = document.getElementById('dash-load-zoom-modal');
    if (!modal) return;
    const evo = calcLoadEvolution30d();
    populateDashLoadChartSelect(evo, false);
    const mainSel = document.getElementById('dash-load-chart-target');
    const zoomSel = document.getElementById('dash-load-zoom-target');
    if (mainSel && zoomSel) zoomSel.value = mainSel.value;
    syncLoadScopeButtons(dashLoadChartScope);

    const zoomBtn = document.getElementById('btn-load-chart-zoom');
    if (zoomBtn) {
        zoomBtn.classList.remove('bg-white', 'text-zinc-900', 'border-zinc-200');
        zoomBtn.classList.add('bg-black', 'text-white', 'border-black');
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    renderDashLoadZoomChart(evo);
};

window.closeLoadChartZoomModal = function() {
    const modal = document.getElementById('dash-load-zoom-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');

    const zoomBtn = document.getElementById('btn-load-chart-zoom');
    if (zoomBtn) {
        zoomBtn.classList.remove('bg-black', 'text-white', 'border-black');
        zoomBtn.classList.add('bg-white', 'text-zinc-900', 'border-zinc-200');
    }

    if (dashLoadZoomChartInstance) {
        dashLoadZoomChartInstance.destroy();
        dashLoadZoomChartInstance = null;
    }
};
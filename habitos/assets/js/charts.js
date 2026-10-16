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

const sleepErrorWhiskerPlugin = {
    id: 'sleepErrorWhiskerPlugin',
    afterDatasetsDraw(chart) {
        const ctx = chart.ctx;
        if (!ctx || !chart.data || !Array.isArray(chart.data.datasets)) return;

        ctx.save();
        ctx.strokeStyle = '#1e1b4b';
        ctx.lineWidth = 1.5;

        chart.data.datasets.forEach((ds, dsIdx) => {
            const sd = ds._sd;
            if (!sd || sd <= 0) return;

            const meta = chart.getDatasetMeta(dsIdx);
            if (!meta || meta.hidden || !meta.data) return;

            const axisId = ds.yAxisID || 'y';
            const yScale = chart.scales[axisId] || chart.scales.y;
            if (!yScale) return;

            meta.data.forEach((bar, index) => {
                const val = ds.data[index];
                if (val === null || val === undefined || isNaN(val) || val <= 0) return;

                const x = bar.x;
                const yTop = yScale.getPixelForValue(val + sd);
                const yBottom = yScale.getPixelForValue(Math.max(0, val - sd));
                const capWidth = 5;

                // Linha vertical de desvio padrão
                ctx.beginPath();
                ctx.moveTo(x, yTop);
                ctx.lineTo(x, yBottom);
                ctx.stroke();

                // Cap superior
                ctx.beginPath();
                ctx.moveTo(x - capWidth, yTop);
                ctx.lineTo(x + capWidth, yTop);
                ctx.stroke();

                // Cap inferior
                ctx.beginPath();
                ctx.moveTo(x - capWidth, yBottom);
                ctx.lineTo(x + capWidth, yBottom);
                ctx.stroke();
            });
        });

        ctx.restore();
    }
};

function renderDashboardCharts() {
    if (typeof Chart === 'undefined') return;
    const xLabels = weekDays.map(d => d.shortName);

    const sleepCanvas = document.getElementById('dashSleepChart');
    if (!sleepCanvas) return;

    const s = calcSleepWeekSeries();
    const empty = document.getElementById('dash-sleep-empty');
    if (empty) {
        empty.classList.toggle('hidden', s.activeDays > 0);
        empty.classList.toggle('flex', s.activeDays === 0);
    }

    const src = document.getElementById('dash-sleep-source');
    if (src) {
        src.textContent = s.source === 'journal' ? 'Horas por noite e eficiência (%) — fonte: Diário do Sono.'
            : s.source === 'habit' ? 'Horas por noite e eficiência (%) — fonte: atividade "Sono".'
            : 'Horas por noite e eficiência (%).';
    }

    const toNull = arr => arr.map(v => v > 0 ? parseFloat(v.toFixed(2)) : null);

    if (dashSleepChartInstance) dashSleepChartInstance.destroy();

    let datasets = [];
    let scales = {};

    if (dashSleepChartMode === 'slept') {
        // Apenas Sono: barra com ±DP
        const meanLine = Array(7).fill(s.activeDays > 0 ? parseFloat(s.meanSlept.toFixed(2)) : null);
        const plusSdLine = Array(7).fill(s.activeDays > 0 ? parseFloat((s.meanSlept + s.sdSlept).toFixed(2)) : null);
        const minusSdLine = Array(7).fill(s.activeDays > 0 ? parseFloat(Math.max(0, s.meanSlept - s.sdSlept).toFixed(2)) : null);

        datasets = [
            { type: 'bar', label: `Tempo Dormido (h)`, data: toNull(s.slept), backgroundColor: '#6366f1', borderRadius: 8, order: 2, _sd: s.sdSlept },
            { type: 'line', label: `Média (μ=${s.meanSlept.toFixed(1)}h, σ=±${s.sdSlept.toFixed(2)}h)`, data: meanLine, borderColor: '#312e81', borderWidth: 2, borderDash: [6, 4], pointRadius: 0, fill: false, order: 0 },
            { type: 'line', label: `+1 DP (+${s.sdSlept.toFixed(2)}h)`, data: plusSdLine, borderColor: 'rgba(99, 102, 241, 0.4)', borderWidth: 1, borderDash: [3, 3], pointRadius: 0, fill: false, order: 1 },
            { type: 'line', label: `Banda ±DP`, data: minusSdLine, borderColor: 'rgba(99, 102, 241, 0.4)', borderWidth: 1, borderDash: [3, 3], pointRadius: 0, fill: '-1', backgroundColor: 'rgba(99, 102, 241, 0.08)', order: 1 }
        ];

        scales = {
            x: { grid: { display: false } },
            y: { min: 0, suggestedMax: Math.max(10, s.meanSlept + s.sdSlept + 1), grid: { color: '#f4f4f5' }, title: { display: true, text: 'Horas dormidas (h)' } }
        };
    } else if (dashSleepChartMode === 'bed') {
        // Apenas Cama: barra com ±DP
        const meanLine = Array(7).fill(s.activeDays > 0 ? parseFloat(s.meanBed.toFixed(2)) : null);
        const plusSdLine = Array(7).fill(s.activeDays > 0 ? parseFloat((s.meanBed + s.sdBed).toFixed(2)) : null);
        const minusSdLine = Array(7).fill(s.activeDays > 0 ? parseFloat(Math.max(0, s.meanBed - s.sdBed).toFixed(2)) : null);

        datasets = [
            { type: 'bar', label: `Tempo de Cama (h)`, data: toNull(s.bed), backgroundColor: '#818cf8', borderRadius: 8, order: 2, _sd: s.sdBed },
            { type: 'line', label: `Média Cama (μ=${s.meanBed.toFixed(1)}h, σ=±${s.sdBed.toFixed(2)}h)`, data: meanLine, borderColor: '#312e81', borderWidth: 2, borderDash: [6, 4], pointRadius: 0, fill: false, order: 0 },
            { type: 'line', label: `+1 DP (+${s.sdBed.toFixed(2)}h)`, data: plusSdLine, borderColor: 'rgba(129, 140, 248, 0.4)', borderWidth: 1, borderDash: [3, 3], pointRadius: 0, fill: false, order: 1 },
            { type: 'line', label: `Banda ±DP`, data: minusSdLine, borderColor: 'rgba(129, 140, 248, 0.4)', borderWidth: 1, borderDash: [3, 3], pointRadius: 0, fill: '-1', backgroundColor: 'rgba(129, 140, 248, 0.08)', order: 1 }
        ];

        scales = {
            x: { grid: { display: false } },
            y: { min: 0, suggestedMax: Math.max(10, s.meanBed + s.sdBed + 1), grid: { color: '#f4f4f5' }, title: { display: true, text: 'Tempo de cama (h)' } }
        };
    } else if (dashSleepChartMode === 'eff') {
        // Eficiência: barra com ±DP
        const meanLine = Array(7).fill(s.activeDays > 0 ? parseFloat(s.meanDailyEfficiency.toFixed(1)) : null);
        const plusSdLine = Array(7).fill(s.activeDays > 0 ? parseFloat(Math.min(100, s.meanDailyEfficiency + s.sdDailyEff).toFixed(1)) : null);
        const minusSdLine = Array(7).fill(s.activeDays > 0 ? parseFloat(Math.max(0, s.meanDailyEfficiency - s.sdDailyEff).toFixed(1)) : null);

        datasets = [
            { type: 'bar', label: `Eficiência (%)`, data: toNull(s.eff).map(v => v === null ? null : Math.round(v)), backgroundColor: '#a855f7', borderRadius: 8, order: 2, _sd: s.sdDailyEff },
            { type: 'line', label: `μ(E) = ${s.meanDailyEfficiency.toFixed(1)}% (σ=±${s.sdDailyEff.toFixed(1)}%)`, data: meanLine, borderColor: '#6b21a8', borderWidth: 2, borderDash: [6, 4], pointRadius: 0, fill: false, order: 0 },
            { type: 'line', label: `+1 DP`, data: plusSdLine, borderColor: 'rgba(168, 85, 247, 0.4)', borderWidth: 1, borderDash: [3, 3], pointRadius: 0, fill: false, order: 1 },
            { type: 'line', label: `Banda ±DP`, data: minusSdLine, borderColor: 'rgba(168, 85, 247, 0.4)', borderWidth: 1, borderDash: [3, 3], pointRadius: 0, fill: '-1', backgroundColor: 'rgba(168, 85, 247, 0.08)', order: 1 }
        ];

        scales = {
            x: { grid: { display: false } },
            y: { min: 0, max: 100, grid: { color: '#f4f4f5' }, title: { display: true, text: 'Eficiência (%)' }, ticks: { callback: v => v + '%' } }
        };
    } else {
        // Modo 'all': Cama vs Dormido com Eficiência e ±DP
        const meanLine = Array(7).fill(s.activeDays > 0 ? parseFloat(s.meanSlept.toFixed(2)) : null);

        datasets = [
            { type: 'line', label: 'Eficiência (%)', data: toNull(s.eff).map(v => v === null ? null : Math.round(v)), borderColor: '#a855f7', backgroundColor: '#a855f7', borderWidth: 2.5, pointRadius: 4, tension: 0.35, spanGaps: true, yAxisID: 'y1', order: 0 },
            { type: 'line', label: `Média Sono (μ=${s.meanSlept.toFixed(1)}h, σ=±${s.sdSlept.toFixed(2)}h)`, data: meanLine, borderColor: '#312e81', borderWidth: 2, borderDash: [6, 4], pointRadius: 0, fill: false, yAxisID: 'y', order: 1 },
            { type: 'bar', label: 'Tempo de cama (h)', data: toNull(s.bed), backgroundColor: '#c7d2fe', borderRadius: 6, yAxisID: 'y', order: 2, _sd: s.sdBed },
            { type: 'bar', label: 'Tempo dormido (h)', data: toNull(s.slept), backgroundColor: '#6366f1', borderRadius: 6, yAxisID: 'y', order: 2, _sd: s.sdSlept }
        ];

        scales = {
            x: { grid: { display: false } },
            y: { position: 'left', min: 0, suggestedMax: Math.max(10, s.meanBed + 1), grid: { color: '#f4f4f5' }, title: { display: true, text: 'Horas (h)' } },
            y1: { position: 'right', min: 0, max: 100, grid: { drawOnChartArea: false }, title: { display: true, text: 'Eficiência (%)' }, ticks: { callback: v => v + '%' } }
        };
    }

    const config = {
        type: 'bar',
        data: { labels: xLabels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: { legend: { position: 'bottom', labels: { font: { size: 11 } } } },
            scales
        },
        plugins: [sleepErrorWhiskerPlugin]
    };

    dashSleepChartInstance = new Chart(sleepCanvas.getContext('2d'), config);
}
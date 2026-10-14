let activityChartScope = 'molecular';
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
            const cat = CATEGORIES[h.category] || CATEGORIES.estudos;
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
            if (h) datasets.push(...buildLineWithSdDatasets(h.name, h.dailyHours.map(v => parseFloat(v) || 0), (CATEGORIES[h.category] || CATEGORIES.estudos).hex, true));
        }
    } else {
        if (targetVal === 'all') {
            Object.keys(CATEGORIES).forEach(key => {
                const cat = CATEGORIES[key];
                const series = [0, 0, 0, 0, 0, 0, 0];
                habits.filter(h => h.category === key).forEach(h => h.dailyHours.forEach((hr, d) => series[d] += (parseFloat(hr) || 0)));
                datasets.push(...buildLineWithSdDatasets(cat.label, series, cat.hex, false));
            });
        } else {
            const cat = CATEGORIES[targetVal] || CATEGORIES.estudos;
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
// FIM DE charts.js
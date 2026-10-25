let metricsMuscleChartInstance = null;
let metricsCorrChartInstance = null;
let metricsCircadianChartInstance = null;
let metricsMuscleMode = 'sets'; // 'sets' | 'volume'

function hexToRgba(hex, alpha) {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16) || 139;
    const g = parseInt(clean.substring(2, 4), 16) || 92;
    const b = parseInt(clean.substring(4, 6), 16) || 246;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function populateActivityChartTargetSelect() {
    // Mantido por compatibilidade com chamadas legadas em renderAll()
}

window.setMetricsMuscleMode = function(mode) {
    metricsMuscleMode = mode === 'volume' ? 'volume' : 'sets';
    const btnSets = document.getElementById('btn-muscle-mode-sets');
    const btnVol = document.getElementById('btn-muscle-mode-volume');
    if (btnSets) {
        btnSets.className = metricsMuscleMode === 'sets'
            ? "px-3 py-1 rounded-full bg-black text-white font-semibold transition"
            : "px-3 py-1 rounded-full text-zinc-600 hover:text-black transition";
    }
    if (btnVol) {
        btnVol.className = metricsMuscleMode === 'volume'
            ? "px-3 py-1 rounded-full bg-black text-white font-semibold transition"
            : "px-3 py-1 rounded-full text-zinc-600 hover:text-black transition";
    }
    renderMetricsView();
};

function formatDateBrShort(isoStr) {
    if (!isoStr || typeof isoStr !== 'string') return '—';
    const p = isoStr.split('-');
    if (p.length !== 3) return isoStr;
    return `${p[2]}/${p[1]}`;
}

function formatCircadianAxisHour(val) {
    let h = ((val % 24) + 24) % 24;
    const hh = Math.floor(h);
    const mm = Math.round((h - hh) * 60);
    return `${String(hh).padStart(2, '0')}:${String(mm === 60 ? 0 : mm).padStart(2, '0')}`;
}

function renderMetricsView() {
    if (typeof Chart === 'undefined' || typeof calcAdvancedAnalytics !== 'function') return;
    const data = calcAdvancedAnalytics();

    // 1. KPIs Superiores
    const kpi1rm = document.getElementById('metrics-kpi-1rm');
    const kpi1rmSub = document.getElementById('metrics-kpi-1rm-sub');
    if (kpi1rm && kpi1rmSub) {
        if (data.exercisePRs.length > 0) {
            const top = data.exercisePRs[0];
            kpi1rm.textContent = `${top.best1RM.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg`;
            kpi1rmSub.textContent = `${top.name} (PR Carga: ${top.maxWeight.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg)`;
        } else {
            kpi1rm.textContent = 'N/A';
            kpi1rmSub.textContent = 'Registre exercícios para estimar 1RM';
        }
    }

    const kpiMuscle = document.getElementById('metrics-kpi-muscle');
    const kpiMuscleSub = document.getElementById('metrics-kpi-muscle-sub');
    if (kpiMuscle && kpiMuscleSub) {
        if (data.muscleBalance.length > 0) {
            const topM = data.muscleBalance[0];
            kpiMuscle.textContent = topM.muscle;
            kpiMuscleSub.textContent = `${topM.sets} séries • ${topM.volume.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kg em 30d`;
        } else {
            kpiMuscle.textContent = 'N/A';
            kpiMuscleSub.textContent = 'Sem séries registradas nos últimos 30d';
        }
    }

    const kpiCorr = document.getElementById('metrics-kpi-corr');
    const kpiCorrSub = document.getElementById('metrics-kpi-corr-sub');
    const corrBadge = document.getElementById('metrics-corr-badge');
    if (kpiCorr && kpiCorrSub) {
        if (data.pearsonR !== null) {
            const rStr = (data.pearsonR >= 0 ? '+' : '') + data.pearsonR.toFixed(2);
            kpiCorr.textContent = `r = ${rStr}`;
            const absR = Math.abs(data.pearsonR);
            const strength = absR >= 0.6 ? 'Forte' : absR >= 0.3 ? 'Moderada' : 'Fraca / Neutra';
            const dir = data.pearsonR > 0.1 ? 'positiva' : data.pearsonR < -0.1 ? 'inversa' : 'estável';
            kpiCorrSub.textContent = `Relação ${strength.toLowerCase()} ${dir} (${data.correlationPoints.length} dias c/ treino + sono)`;
            if (corrBadge) corrBadge.textContent = `r = ${rStr} (${strength})`;
        } else {
            kpiCorr.textContent = 'N/A';
            kpiCorrSub.textContent = data.correlationPoints.length === 1
                ? '1 dia combinado (mín. 2 dias p/ correlação)'
                : 'Registre sono e treino nas mesmas datas';
            if (corrBadge) corrBadge.textContent = 'r = N/A';
        }
    }

    const kpiCirc = document.getElementById('metrics-kpi-circadian');
    const kpiCircSub = document.getElementById('metrics-kpi-circadian-sub');
    if (kpiCirc && kpiCircSub) {
        if (data.bedtimeSdMinutes !== null) {
            kpiCirc.textContent = `±${data.bedtimeSdMinutes} min`;
            const status = data.bedtimeSdMinutes <= 30 ? 'Alta consistência circadiana'
                : data.bedtimeSdMinutes <= 60 ? 'Oscilação moderada de horário'
                : 'Social Jetlag elevado (horários irregulares)';
            kpiCircSub.textContent = `${status} (Acordar: ±${data.wakeSdMinutes || 0} min)`;
        } else {
            kpiCirc.textContent = 'N/A';
            kpiCircSub.textContent = data.circadianSeries.length === 1
                ? 'Mínimo de 2 noites no Diário para calcular ±DP'
                : 'Registre horários no Diário do Sono';
        }
    }

    // 2. Gráfico 1: Equilíbrio Muscular (Últimos 30d)
    const muscleCanvas = document.getElementById('metricsMuscleChart');
    const muscleEmpty = document.getElementById('metrics-muscle-empty');
    if (metricsMuscleChartInstance) {
        metricsMuscleChartInstance.destroy();
        metricsMuscleChartInstance = null;
    }
    if (muscleCanvas) {
        const hasMuscle = data.muscleBalance.length > 0;
        if (muscleEmpty) {
            muscleEmpty.classList.toggle('hidden', hasMuscle);
            muscleEmpty.classList.toggle('flex', !hasMuscle);
        }
        if (hasMuscle) {
            const labels = data.muscleBalance.map(m => m.muscle);
            const values = data.muscleBalance.map(m => metricsMuscleMode === 'volume' ? m.volume : m.sets);
            const colors = data.muscleBalance.map((_, idx) => getDistinctExerciseColor(idx));

            metricsMuscleChartInstance = new Chart(muscleCanvas.getContext('2d'), {
                type: 'bar',
                data: {
                    labels,
                    datasets: [{
                        label: metricsMuscleMode === 'volume' ? 'Volume Acumulado (kg)' : 'Séries Totais (30d)',
                        data: values,
                        backgroundColor: colors,
                        borderRadius: 8,
                        barThickness: 22
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label(ctx) {
                                    const item = data.muscleBalance[ctx.dataIndex];
                                    if (!item) return '';
                                    const volFmt = item.volume.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
                                    return `${item.sets} séries • ${volFmt} kg (${item.sessions} sessões)`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            min: 0,
                            grid: { color: '#f4f4f5' },
                            title: {
                                display: true,
                                text: metricsMuscleMode === 'volume' ? 'Volume Total (kg)' : 'Total de Séries Trabalhadas'
                            }
                        },
                        y: {
                            grid: { display: false }
                        }
                    }
                }
            });
        }
    }

    // 3. Gráfico 2: Correlação Sono x Performance (Scatter + Linha de Tendência)
    const corrCanvas = document.getElementById('metricsSleepLoadCorrChart');
    const corrEmpty = document.getElementById('metrics-corr-empty');
    if (metricsCorrChartInstance) {
        metricsCorrChartInstance.destroy();
        metricsCorrChartInstance = null;
    }
    if (corrCanvas) {
        const pts = data.correlationPoints;
        const hasCorr = pts.length > 0;
        if (corrEmpty) {
            corrEmpty.classList.toggle('hidden', hasCorr);
            corrEmpty.classList.toggle('flex', !hasCorr);
        }
        if (hasCorr) {
            const scatterData = pts.map(p => ({ x: p.sleptH, y: p.volume, date: p.date, maxWeight: p.maxWeight }));
            const datasets = [{
                type: 'scatter',
                label: 'Sessão (Sono × Volume)',
                data: scatterData,
                backgroundColor: '#4f46e5',
                borderColor: '#ffffff',
                borderWidth: 1.5,
                pointRadius: 6,
                pointHoverRadius: 8
            }];

            if (pts.length >= 2 && data.regSlope !== null && data.regIntercept !== null) {
                const xs = pts.map(p => p.sleptH);
                const minX = Math.min(...xs);
                const maxX = Math.max(...xs);
                if (maxX > minX) {
                    const y1 = Math.max(0, data.regIntercept + data.regSlope * minX);
                    const y2 = Math.max(0, data.regIntercept + data.regSlope * maxX);
                    datasets.push({
                        type: 'line',
                        label: 'Tendência Linear',
                        data: [
                            { x: parseFloat(minX.toFixed(2)), y: parseFloat(y1.toFixed(2)) },
                            { x: parseFloat(maxX.toFixed(2)), y: parseFloat(y2.toFixed(2)) }
                        ],
                        borderColor: '#e11d48',
                        borderWidth: 2,
                        borderDash: [6, 4],
                        pointRadius: 0,
                        pointHoverRadius: 0,
                        fill: false,
                        tension: 0
                    });
                }
            }

            metricsCorrChartInstance = new Chart(corrCanvas.getContext('2d'), {
                type: 'scatter',
                data: { datasets },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: false,
                    plugins: {
                        legend: { position: 'bottom', labels: { font: { size: 11 } } },
                        tooltip: {
                            filter(item) {
                                return item.datasetIndex === 0;
                            },
                            callbacks: {
                                label(ctx) {
                                    const raw = ctx.raw;
                                    if (!raw) return '';
                                    const dStr = formatDateBrShort(raw.date);
                                    const volFmt = (raw.y || 0).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
                                    return `Data ${dStr}: ${raw.x.toFixed(1)}h dormidas → Volume: ${volFmt} kg`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            type: 'linear',
                            position: 'bottom',
                            suggestedMin: 4,
                            suggestedMax: 10,
                            grid: { color: '#f4f4f5' },
                            title: { display: true, text: 'Horas Dormidas na Noite (h)' },
                            ticks: { callback: v => v + 'h' }
                        },
                        y: {
                            min: 0,
                            grid: { color: '#f4f4f5' },
                            title: { display: true, text: 'Volume Total de Carga no Dia (kg)' },
                            ticks: { callback: v => v.toLocaleString('pt-BR') + ' kg' }
                        }
                    }
                }
            });
        }
    }

    // 4. Gráfico 3: Regularidade Circadiana
    const circCanvas = document.getElementById('metricsCircadianChart');
    const circEmpty = document.getElementById('metrics-circadian-empty');
    const sleptAvgBadge = document.getElementById('metrics-circadian-slept-avg');
    const wakeAvgBadge = document.getElementById('metrics-circadian-wake-avg');

    if (sleptAvgBadge) {
        sleptAvgBadge.textContent = data.avgSleptClock
            ? `Dormir médio: ${data.avgSleptClock}${data.bedtimeSdMinutes !== null ? ` (±${data.bedtimeSdMinutes}m)` : ''}`
            : 'Dormir: —';
    }
    if (wakeAvgBadge) {
        wakeAvgBadge.textContent = data.avgWakeClock
            ? `Acordar médio: ${data.avgWakeClock}${data.wakeSdMinutes !== null ? ` (±${data.wakeSdMinutes}m)` : ''}`
            : 'Acordar: —';
    }

    if (metricsCircadianChartInstance) {
        metricsCircadianChartInstance.destroy();
        metricsCircadianChartInstance = null;
    }
    if (circCanvas) {
        const cs = data.circadianSeries;
        const hasCirc = cs.length > 0;
        if (circEmpty) {
            circEmpty.classList.toggle('hidden', hasCirc);
            circEmpty.classList.toggle('flex', !hasCirc);
        }
        if (hasCirc) {
            const xLabels = cs.map(c => c.label);
            const sleptHours = cs.map(c => c.sleptMin !== null ? parseFloat((c.sleptMin / 60).toFixed(2)) : null);
            const wakeHours = cs.map(c => c.wakeMin !== null ? parseFloat((c.wakeMin / 60).toFixed(2)) : null);
            const sleptCount = sleptHours.filter(v => v !== null).length;
            const wakeCount = wakeHours.filter(v => v !== null).length;

            metricsCircadianChartInstance = new Chart(circCanvas.getContext('2d'), {
                type: 'line',
                data: {
                    labels: xLabels,
                    datasets: [
                        {
                            label: 'Horário de Dormir',
                            data: sleptHours,
                            borderColor: '#4f46e5',
                            backgroundColor: '#4f46e5',
                            borderWidth: 2.5,
                            pointRadius: 4.5,
                            showLine: sleptCount > 1,
                            spanGaps: true,
                            tension: 0.25,
                            _rawClock: cs.map(c => c.rawSlept || '—')
                        },
                        {
                            label: 'Horário de Acordar',
                            data: wakeHours,
                            borderColor: '#9333ea',
                            backgroundColor: '#9333ea',
                            borderWidth: 2.5,
                            pointRadius: 4.5,
                            showLine: wakeCount > 1,
                            spanGaps: true,
                            tension: 0.25,
                            _rawClock: cs.map(c => c.rawWake || '—')
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: {
                        legend: { position: 'bottom', labels: { font: { size: 11 } } },
                        tooltip: {
                            callbacks: {
                                label(ctx) {
                                    const rawArr = ctx.dataset._rawClock;
                                    const clockStr = rawArr ? rawArr[ctx.dataIndex] : formatCircadianAxisHour(ctx.parsed.y);
                                    return `${ctx.dataset.label}: ${clockStr}`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: { grid: { display: false } },
                        y: {
                            grid: { color: '#f4f4f5' },
                            title: { display: true, text: 'Horário do Relógio (HH:MM)' },
                            ticks: {
                                callback: v => formatCircadianAxisHour(v)
                            }
                        }
                    }
                }
            });
        }
    }

    // 5. Tabela de Recordes Pessoais (PRs), 1RM Estimado e Progressão
    const tbody = document.getElementById('metrics-prs-tbody');
    const countBadge = document.getElementById('metrics-prs-count-badge');
    if (countBadge) {
        countBadge.textContent = `${data.exercisePRs.length} ${data.exercisePRs.length === 1 ? 'exercício' : 'exercícios'}`;
    }
    if (tbody) {
        tbody.innerHTML = '';
        if (data.exercisePRs.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="py-10 px-6 text-center text-xs text-zinc-400">
                        Nenhum exercício registrado ainda. Marque seus treinos na aba <strong>Atividade Física</strong> para acompanhar seus Recordes Pessoais (PRs) e 1RM Estimado.
                    </td>
                </tr>
            `;
        } else {
            data.exercisePRs.forEach(ex => {
                const firstFmt = ex.firstWeight.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                const currFmt = ex.currentWeight.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                const maxWFmt = ex.maxWeight.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                const rmFmt = ex.best1RM.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
                const volFmt = ex.maxVolume.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

                let progBadge = `<span class="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-zinc-100 text-zinc-600">0.0%</span>`;
                if (ex.sessionsCount > 1) {
                    if (ex.progressionPct > 0.05) {
                        progBadge = `<span class="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">+${ex.progressionPct.toFixed(1)}%</span>`;
                    } else if (ex.progressionPct < -0.05) {
                        progBadge = `<span class="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">${ex.progressionPct.toFixed(1)}%</span>`;
                    }
                } else {
                    progBadge = `<span class="px-2.5 py-0.5 rounded-full text-[11px] font-mono text-zinc-400 bg-zinc-50 border border-zinc-200">1ª sessão</span>`;
                }

                tbody.innerHTML += `
                    <tr class="hover:bg-zinc-50/80 transition">
                        <td class="py-3.5 px-5 font-semibold text-zinc-900">${ex.name}</td>
                        <td class="py-3.5 px-3 text-center">
                            <span class="px-2.5 py-1 rounded-full text-[11px] font-medium bg-zinc-100 text-zinc-700">${ex.muscleGroup}</span>
                        </td>
                        <td class="py-3.5 px-3 text-center font-mono text-xs text-zinc-600">${ex.sessionsCount}</td>
                        <td class="py-3.5 px-3 text-center font-mono text-xs text-zinc-700">
                            ${firstFmt} kg <span class="text-zinc-400 mx-1">→</span> <strong>${currFmt} kg</strong>
                        </td>
                        <td class="py-3.5 px-3 text-center">${progBadge}</td>
                        <td class="py-3.5 px-3 text-center font-mono font-bold text-zinc-900">
                            ${maxWFmt} kg
                            <span class="block text-[10px] font-normal text-zinc-400">${formatDateBrShort(ex.maxWeightDate)}</span>
                        </td>
                        <td class="py-3.5 px-3 text-center font-mono font-bold text-amber-700 bg-amber-50/40">
                            ${rmFmt} kg
                        </td>
                        <td class="py-3.5 px-5 text-right font-mono text-xs font-semibold text-zinc-800">
                            ${volFmt} kg
                            <span class="block text-[10px] font-normal text-zinc-400">${formatDateBrShort(ex.maxVolumeDate)}</span>
                        </td>
                    </tr>
                `;
            });
        }
    }

    if (typeof refreshIcons === 'function') refreshIcons();
}

/* ===== Dashboard (somente leitura) ===== */
let dashSleepChartInstance = null;
let dashSleepChartMode = 'all'; // 'all' | 'slept' | 'bed' | 'eff'

// Modo de interação customizado para o gráfico de sono:
// Dispara o tooltip de Média e Faixa ±DP sempre que o cursor passar em cima da faixa (mesmo entre barras),
// e mostra as barras/pontos apenas quando o cursor estiver sobre eles.
if (typeof Chart !== 'undefined' && Chart.Interaction && Chart.Interaction.modes) {
    Chart.Interaction.modes.sleepBandMode = function(chart, e, options, useFinalPosition) {
        const area = chart.chartArea;
        if (!area || e.x < area.left || e.x > area.right || e.y < area.top || e.y > area.bottom) {
            return [];
        }

        // 1. Verifica barras ou pontos de eficiência diretamente sob o cursor
        const directHits = Chart.Interaction.modes.nearest(
            chart,
            e,
            { intersect: true, axis: 'xy' },
            useFinalPosition
        ).filter(item => {
            const ds = chart.data.datasets[item.datasetIndex];
            return ds && !ds._isMeanLine && !ds._isBandLine && !ds._hideFromLegend;
        });

        // 2. Verifica se o cursor está passando em cima da faixa ±DP ou da linha tracejada de média
        const bandMeta = chart.$sleepBandMeta;
        const yScale = chart.scales && chart.scales.y;
        const xScale = chart.scales && chart.scales.x;
        const bandHits = [];

        if (bandMeta && yScale && xScale && bandMeta.mean > 0) {
            const yMeanPx = yScale.getPixelForValue(bandMeta.mean);
            let isOverBand = false;
            if (bandMeta.hasBand && bandMeta.sd > 0) {
                const yUpperPx = yScale.getPixelForValue(bandMeta.upper);
                const yLowerPx = yScale.getPixelForValue(bandMeta.lower);
                const topPx = Math.min(yUpperPx, yLowerPx) - 6;
                const botPx = Math.max(yUpperPx, yLowerPx) + 6;
                isOverBand = (e.y >= topPx && e.y <= botPx);
            } else {
                isOverBand = Math.abs(e.y - yMeanPx) <= 10;
            }

            if (isOverBand) {
                let xIdx = xScale.getValueForPixel(e.x);
                if (typeof xIdx !== 'number' || isNaN(xIdx)) xIdx = 0;
                xIdx = Math.max(0, Math.min((chart.data.labels?.length || 7) - 1, Math.round(xIdx)));

                chart.data.datasets.forEach((ds, dIdx) => {
                    if (ds._isMeanLine || ds._isBandLine) {
                        const meta = chart.getDatasetMeta(dIdx);
                        const el = meta && meta.data ? meta.data[xIdx] : null;
                        if (el) {
                            bandHits.push({ element: el, datasetIndex: dIdx, index: xIdx });
                        }
                    }
                });
            }
        }

        return [...directHits, ...bandHits];
    };
}

// Plugin para desenhar apenas a linha tracejada na legenda da Média (sem retângulo ao redor)
const sleepLegendDashPlugin = {
    id: 'sleepLegendDashPlugin',
    afterDraw(chart) {
        const legend = chart.legend;
        if (!legend || !Array.isArray(legend.legendItems) || !Array.isArray(legend.legendHitBoxes)) return;
        const ctx = chart.ctx;
        const boxWidth = (chart.options?.plugins?.legend?.labels?.boxWidth) || 36;

        legend.legendItems.forEach((item, idx) => {
            if (!item || !item._isMeanDashLegend) return;
            const hitBox = legend.legendHitBoxes[idx];
            if (!hitBox) return;

            ctx.save();
            ctx.beginPath();
            ctx.strokeStyle = item._dashColor || '#312e81';
            ctx.lineWidth = 2.5;
            ctx.setLineDash([6, 4]);
            if (item.hidden) ctx.globalAlpha = 0.4;
            const yCenter = hitBox.top + hitBox.height / 2;
            ctx.moveTo(hitBox.left + 2, yCenter);
            ctx.lineTo(hitBox.left + boxWidth - 2, yCenter);
            ctx.stroke();
            ctx.restore();
        });
    }
};

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
    let bandMeta = null;
    // O desvio-padrão do gráfico de análise de sono é calculado com base na semana analisada (weekDays)
    const hasSleepSdBand = weekActive >= 2 && wSdSlept > 0;

    if (dashSleepChartMode === 'slept') {
        const meanLine = Array(7).fill(weekActive > 0 ? parseFloat(wMeanSlept.toFixed(2)) : null);
        const meanLabel = `Média (μ=${wMeanSlept.toFixed(1)}h)`;
        const upperVal = parseFloat((wMeanSlept + wSdSlept).toFixed(2));
        const lowerVal = parseFloat(Math.max(0, wMeanSlept - wSdSlept).toFixed(2));
        bandMeta = { mean: wMeanSlept, sd: wSdSlept, upper: upperVal, lower: lowerVal, hasBand: hasSleepSdBand, unit: 'h' };

        datasets = [
            { type: 'bar', label: `Tempo Dormido (h)`, data: toNull(s.slept), backgroundColor: '#6366f1', borderRadius: 8, order: 2 },
            { type: 'line', label: meanLabel, data: meanLine, borderColor: '#312e81', borderWidth: 2, borderDash: [6, 4], pointRadius: 0, pointHoverRadius: 0, fill: false, order: 0, _isMeanLine: true, _meanColor: '#312e81', _meanText: `${wMeanSlept.toFixed(1)}h` }
        ];

        if (hasSleepSdBand) {
            const plusSdLine = Array(7).fill(upperVal);
            const minusSdLine = Array(7).fill(lowerVal);
            datasets.push(
                { type: 'line', label: `_upper_dp`, data: plusSdLine, borderColor: 'rgba(99, 102, 241, 0.45)', borderWidth: 1, borderDash: [3, 3], pointRadius: 0, pointHoverRadius: 0, fill: false, order: 1, _hideFromLegend: true },
                { type: 'line', label: `Faixa ±DP (±${wSdSlept.toFixed(2)}h)`, data: minusSdLine, borderColor: 'rgba(99, 102, 241, 0.45)', borderWidth: 1, borderDash: [3, 3], pointRadius: 0, pointHoverRadius: 0, fill: '-1', backgroundColor: 'rgba(99, 102, 241, 0.14)', order: 1, _isBandLine: true, _bandTooltip: `Faixa ±DP: ±${wSdSlept.toFixed(2)}h (${lowerVal.toFixed(2)}h a ${upperVal.toFixed(2)}h)` }
            );
        }

        scales = {
            x: { grid: { display: false } },
            y: { min: 0, suggestedMax: Math.max(10, wMeanSlept + wSdSlept + 1), grid: { color: '#f4f4f5' }, title: { display: true, text: 'Horas dormidas (h)' } }
        };
    } else if (dashSleepChartMode === 'bed') {
        const hasBedSdBand = weekActive >= 2 && wSdBed > 0;
        const meanLine = Array(7).fill(weekActive > 0 ? parseFloat(wMeanBed.toFixed(2)) : null);
        const meanLabel = `Média Cama (μ=${wMeanBed.toFixed(1)}h)`;
        const upperVal = parseFloat((wMeanBed + wSdBed).toFixed(2));
        const lowerVal = parseFloat(Math.max(0, wMeanBed - wSdBed).toFixed(2));
        bandMeta = { mean: wMeanBed, sd: wSdBed, upper: upperVal, lower: lowerVal, hasBand: hasBedSdBand, unit: 'h' };

        datasets = [
            { type: 'bar', label: `Tempo de Cama (h)`, data: toNull(s.bed), backgroundColor: '#818cf8', borderRadius: 8, order: 2 },
            { type: 'line', label: meanLabel, data: meanLine, borderColor: '#312e81', borderWidth: 2, borderDash: [6, 4], pointRadius: 0, pointHoverRadius: 0, fill: false, order: 0, _isMeanLine: true, _meanColor: '#312e81', _meanText: `${wMeanBed.toFixed(1)}h` }
        ];

        if (hasBedSdBand) {
            const plusSdLine = Array(7).fill(upperVal);
            const minusSdLine = Array(7).fill(lowerVal);
            datasets.push(
                { type: 'line', label: `_upper_dp`, data: plusSdLine, borderColor: 'rgba(129, 140, 248, 0.45)', borderWidth: 1, borderDash: [3, 3], pointRadius: 0, pointHoverRadius: 0, fill: false, order: 1, _hideFromLegend: true },
                { type: 'line', label: `Faixa ±DP (±${wSdBed.toFixed(2)}h)`, data: minusSdLine, borderColor: 'rgba(129, 140, 248, 0.45)', borderWidth: 1, borderDash: [3, 3], pointRadius: 0, pointHoverRadius: 0, fill: '-1', backgroundColor: 'rgba(129, 140, 248, 0.14)', order: 1, _isBandLine: true, _bandTooltip: `Faixa ±DP: ±${wSdBed.toFixed(2)}h (${lowerVal.toFixed(2)}h a ${upperVal.toFixed(2)}h)` }
            );
        }

        scales = {
            x: { grid: { display: false } },
            y: { min: 0, suggestedMax: Math.max(10, wMeanBed + wSdBed + 1), grid: { color: '#f4f4f5' }, title: { display: true, text: 'Tempo de cama (h)' } }
        };
    } else if (dashSleepChartMode === 'eff') {
        const hasEffSdBand = weekActive >= 2 && wSdEff > 0;
        const meanLine = Array(7).fill(weekActive > 0 ? parseFloat(wMeanEff.toFixed(1)) : null);
        const meanLabel = `Média Eficiência (μ=${wMeanEff.toFixed(1)}%)`;
        const upperVal = parseFloat(Math.min(100, wMeanEff + wSdEff).toFixed(1));
        const lowerVal = parseFloat(Math.max(0, wMeanEff - wSdEff).toFixed(1));
        bandMeta = { mean: wMeanEff, sd: wSdEff, upper: upperVal, lower: lowerVal, hasBand: hasEffSdBand, unit: '%' };

        datasets = [
            { type: 'bar', label: `Eficiência (%)`, data: toNull(s.eff).map(v => v === null ? null : Math.round(v)), backgroundColor: '#a855f7', borderRadius: 8, order: 2 },
            { type: 'line', label: meanLabel, data: meanLine, borderColor: '#6b21a8', borderWidth: 2, borderDash: [6, 4], pointRadius: 0, pointHoverRadius: 0, fill: false, order: 0, _isMeanLine: true, _meanColor: '#6b21a8', _meanText: `${wMeanEff.toFixed(1)}%` }
        ];

        if (hasEffSdBand) {
            const plusSdLine = Array(7).fill(upperVal);
            const minusSdLine = Array(7).fill(lowerVal);
            datasets.push(
                { type: 'line', label: `_upper_dp`, data: plusSdLine, borderColor: 'rgba(168, 85, 247, 0.45)', borderWidth: 1, borderDash: [3, 3], pointRadius: 0, pointHoverRadius: 0, fill: false, order: 1, _hideFromLegend: true },
                { type: 'line', label: `Faixa ±DP (±${wSdEff.toFixed(1)}%)`, data: minusSdLine, borderColor: 'rgba(168, 85, 247, 0.45)', borderWidth: 1, borderDash: [3, 3], pointRadius: 0, pointHoverRadius: 0, fill: '-1', backgroundColor: 'rgba(168, 85, 247, 0.14)', order: 1, _isBandLine: true, _bandTooltip: `Faixa ±DP: ±${wSdEff.toFixed(1)}% (${lowerVal.toFixed(1)}% a ${upperVal.toFixed(1)}%)` }
            );
        }

        scales = {
            x: { grid: { display: false } },
            y: { min: 0, max: 100, grid: { color: '#f4f4f5' }, title: { display: true, text: 'Eficiência (%)' }, ticks: { callback: v => v + '%' } }
        };
    } else {
        // Modo 'all': Cama vs Dormido com Eficiência e faixa ±DP baseada na semana analisada
        const meanLine = Array(7).fill(weekActive > 0 ? parseFloat(wMeanSlept.toFixed(2)) : null);
        const meanLabel = `Média Sono (μ=${wMeanSlept.toFixed(1)}h)`;
        const upperVal = parseFloat((wMeanSlept + wSdSlept).toFixed(2));
        const lowerVal = parseFloat(Math.max(0, wMeanSlept - wSdSlept).toFixed(2));
        bandMeta = { mean: wMeanSlept, sd: wSdSlept, upper: upperVal, lower: lowerVal, hasBand: hasSleepSdBand, unit: 'h' };

        datasets = [
            { type: 'line', label: 'Eficiência (%)', data: toNull(s.eff).map(v => v === null ? null : Math.round(v)), borderColor: '#a855f7', backgroundColor: '#a855f7', borderWidth: 2.5, pointRadius: 4, tension: 0.35, spanGaps: true, yAxisID: 'y1', order: 0 },
            { type: 'line', label: meanLabel, data: meanLine, borderColor: '#312e81', borderWidth: 2, borderDash: [6, 4], pointRadius: 0, pointHoverRadius: 0, fill: false, yAxisID: 'y', order: 1, _isMeanLine: true, _meanColor: '#312e81', _meanText: `${wMeanSlept.toFixed(1)}h` }
        ];

        if (hasSleepSdBand) {
            const plusSdLine = Array(7).fill(upperVal);
            const minusSdLine = Array(7).fill(lowerVal);
            datasets.push(
                { type: 'line', label: `_upper_dp`, data: plusSdLine, borderColor: 'rgba(99, 102, 241, 0.45)', borderWidth: 1, borderDash: [3, 3], pointRadius: 0, pointHoverRadius: 0, fill: false, yAxisID: 'y', order: 1, _hideFromLegend: true },
                { type: 'line', label: `Faixa ±DP (±${wSdSlept.toFixed(2)}h)`, data: minusSdLine, borderColor: 'rgba(99, 102, 241, 0.45)', borderWidth: 1, borderDash: [3, 3], pointRadius: 0, pointHoverRadius: 0, fill: '-1', backgroundColor: 'rgba(99, 102, 241, 0.14)', yAxisID: 'y', order: 1, _isBandLine: true, _bandTooltip: `Faixa ±DP: ±${wSdSlept.toFixed(2)}h (${lowerVal.toFixed(2)}h a ${upperVal.toFixed(2)}h)` }
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

    const interactionMode = (Chart.Interaction && Chart.Interaction.modes && Chart.Interaction.modes.sleepBandMode)
        ? 'sleepBandMode'
        : 'index';

    const config = {
        type: 'bar',
        data: { labels: xLabels, datasets },
        plugins: [sleepLegendDashPlugin],
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            animations: { colors: false, x: false, y: false },
            transitions: { active: { animation: { duration: 0 } } },
            interaction: { mode: interactionMode, intersect: false },
            hover: { mode: interactionMode, intersect: false },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { size: 11 },
                        boxWidth: 36,
                        generateLabels(chart) {
                            const baseLabels = Chart.defaults.plugins.legend.labels.generateLabels(chart);
                            return baseLabels
                                .filter(item => {
                                    const ds = chart.data.datasets[item.datasetIndex];
                                    return ds && !ds._hideFromLegend;
                                })
                                .map(item => {
                                    const ds = chart.data.datasets[item.datasetIndex];
                                    if (ds && ds._isMeanLine) {
                                        // Retira o retângulo e deixa apenas o tracejado desenhado pelo sleepLegendDashPlugin
                                        return {
                                            ...item,
                                            fillStyle: 'rgba(0,0,0,0)',
                                            strokeStyle: 'rgba(0,0,0,0)',
                                            lineWidth: 0,
                                            _isMeanDashLegend: true,
                                            _dashColor: ds._meanColor || ds.borderColor || '#312e81'
                                        };
                                    }
                                    if (ds && ds._isBandLine) {
                                        return {
                                            ...item,
                                            fillStyle: ds.backgroundColor || 'rgba(99, 102, 241, 0.22)',
                                            strokeStyle: ds.borderColor || 'rgba(99, 102, 241, 0.55)',
                                            lineWidth: 1,
                                            lineDash: [3, 3]
                                        };
                                    }
                                    return item;
                                });
                        }
                    }
                },
                tooltip: {
                    filter(tooltipItem) {
                        const ds = tooltipItem.dataset;
                        return ds && !ds._hideFromLegend;
                    },
                    callbacks: {
                        label(context) {
                            const ds = context.dataset;
                            if (!ds) return '';
                            if (ds._isMeanLine) {
                                return `${ds.label}`;
                            }
                            if (ds._isBandLine) {
                                return ds._bandTooltip || ds.label;
                            }
                            const val = context.parsed.y;
                            if (val === null || val === undefined) return '';
                            if (ds.label && ds.label.includes('%')) {
                                return `${ds.label}: ${val}%`;
                            }
                            return `${ds.label}: ${val}h`;
                        }
                    }
                }
            },
            scales
        }
    };

    dashSleepChartInstance = new Chart(sleepCanvas.getContext('2d'), config);
    dashSleepChartInstance.$sleepBandMeta = bandMeta;

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

function buildLoadDatasetItem(label, seriesObj, color, isSingleView, extraOpts = {}) {
    const dataArr = seriesObj.volumeSeries.map(v => v !== null && v !== undefined ? parseFloat(v.toFixed(2)) : null);
    const nonNullCount = dataArr.filter(v => v !== null).length;
    const baseRadius = extraOpts.pointRadius !== undefined ? extraOpts.pointRadius : (isSingleView ? 5.5 : 5);
    const hoverRadius = extraOpts.pointHoverRadius !== undefined ? extraOpts.pointHoverRadius : (isSingleView ? 7.5 : 7);
    return {
        type: 'line',
        label,
        data: dataArr,
        borderColor: color,
        backgroundColor: isSingleView ? hexToRgba(color, 0.16) : color,
        pointBackgroundColor: color,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 1.5,
        borderWidth: extraOpts.borderWidth !== undefined ? extraOpts.borderWidth : (isSingleView ? 3 : 2.5),
        borderDash: extraOpts.borderDash || [],
        pointRadius: baseRadius,
        pointHoverRadius: hoverRadius,
        pointHitRadius: 5,
        showLine: nonNullCount > 1,
        tension: 0.25,
        spanGaps: true,
        fill: isSingleView && nonNullCount > 1,
        order: extraOpts.order !== undefined ? extraOpts.order : 1,
        _weightSeries: seriesObj.weightSeries,
        _groupId: seriesObj.id || null
    };
}

function buildLoadEvolutionChartConfig(evo, targetVal) {
    const xLabels = evo.days.map(d => d.label);
    const datasets = [];

    if (dashLoadChartScope === 'group') {
        if (targetVal === 'all' || !evo.groups[targetVal]) {
            // Exibe apenas os 4 grupos de treino (Upper A, Lower A, Upper B, Lower B), sem Volume Total (pois não é grupo)
            const specificGroups = ['upper_a', 'lower_a', 'upper_b', 'lower_b'];
            specificGroups.forEach(gk => {
                const g = evo.groups[gk];
                if (!g) return;
                datasets.push(buildLoadDatasetItem(g.label, g, g.color, false, {
                    order: 1,
                    pointRadius: 5.5,
                    pointHoverRadius: 7.5
                }));
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
                    // Garante que apenas o único ponto real sob o mouse seja exibido (priorizando o grupo específico sobre o total_all)
                    filter(tooltipItem, index) {
                        return index === 0;
                    },
                    callbacks: {
                        label(context) {
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
let activeCategoryFilter = 'atv_fisica';
let isSidebarCollapsed = false;

function refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        try { window.lucide.createIcons(); } catch (e) {}
    }
}

window.toggleDesktopSidebar = function() {
    const sb = document.getElementById('desktop-sidebar');
    const toggleBtn = document.getElementById('sidebar-toggle-btn');
    if (!sb) return;
    isSidebarCollapsed = !isSidebarCollapsed;
    sb.classList.toggle('sidebar-expanded', !isSidebarCollapsed);
    sb.classList.toggle('sidebar-collapsed', isSidebarCollapsed);
    if (toggleBtn) {
        const iconName = isSidebarCollapsed ? 'panel-left-open' : 'panel-left-close';
        toggleBtn.innerHTML = `<i data-lucide="${iconName}" id="sidebar-toggle-icon" class="w-4 h-4"></i>`;
    }
    refreshIcons();
};

window.toggleMobileDrawer = function() {
    document.getElementById('mobile-drawer').classList.toggle('hidden');
};

const ROUTE_CONFIG = {
    dashboard:  { eyebrow: 'DASHBOARD' },
    atv_fisica: { eyebrow: 'GRUPO',     title: 'Atividade Física' },
    sono:       { eyebrow: 'GRUPO',     title: 'Gestão do Sono' },
    timer:      { eyebrow: 'TIMER',     title: 'Timer' },
    metrics:    { eyebrow: 'ANÁLISE',   title: 'Métricas' },
    calendar:   { eyebrow: 'AGENDA',    title: 'Calendário Semanal' }
};

window.navigateTo = function(route) {
    if (window.location.hash !== '#' + route) history.pushState(null, null, '#' + route);
    applyRoute(route);
};

function applyRoute(routeParam) {
    const hashRoute = (window.location.hash || '#dashboard').replace('#', '').trim();
    const activeRoute = ROUTE_CONFIG[routeParam] ? routeParam : (ROUTE_CONFIG[hashRoute] ? hashRoute : 'dashboard');

    Object.keys(ROUTE_CONFIG).forEach(r => {
        const sec = document.getElementById('view-' + r);
        if (sec) sec.classList.toggle('hidden', r !== activeRoute);

        const btn = document.querySelector(`[data-route="${r}"]`);
        if (btn) {
            btn.className = r === activeRoute
                ? "nav-item flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold bg-white text-black transition w-full shadow-sm"
                : "nav-item flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition w-full";
        }

        const mBtn = document.querySelector(`[data-mobile-route="${r}"]`);
        if (mBtn) {
            mBtn.className = r === activeRoute
                ? "mobile-nav-item flex flex-col items-center py-1.5 px-3 rounded-full text-[11px] font-semibold bg-white text-black"
                : "mobile-nav-item flex flex-col items-center py-1.5 px-3 rounded-full text-[11px] font-medium text-zinc-400";
        }
    });

    const cfg = ROUTE_CONFIG[activeRoute];
    document.getElementById('header-eyebrow').innerText = cfg.eyebrow;

    let titleText = cfg.title;
    if (activeRoute === 'dashboard' && typeof window.getUserGreeting === 'function') {
        titleText = window.getUserGreeting();
    }
    document.getElementById('view-title').innerText = titleText;

    renderAll(activeRoute);
}

window.refreshHeaderTitle = function () {
    const hashRoute = (window.location.hash || '#dashboard').replace('#', '').trim();
    const activeRoute = ROUTE_CONFIG[hashRoute] ? hashRoute : 'dashboard';
    if (activeRoute === 'dashboard' && typeof window.getUserGreeting === 'function') {
        const el = document.getElementById('view-title');
        if (el) el.innerText = window.getUserGreeting();
    }
};

window.addEventListener('hashchange', () => applyRoute());

window.setCategoryFilter = function(cat) {
    activeCategoryFilter = cat;
    ['atv_fisica', 'sono'].forEach(c => {
        const btn = document.getElementById('cat-btn-' + c);
        if (btn) btn.className = c === cat ? "px-3.5 py-1.5 rounded-full bg-black text-white font-semibold shadow-xs" : "px-3.5 py-1.5 rounded-full text-zinc-600 hover:text-black";
    });
    renderDashboardView();
};

window.toggleHabitDay = function(hIdx, dIdx) {
    const habit = habits[hIdx];
    const state = !habit.checks[dIdx];
    habit.checks[dIdx] = state;
    if (state && (!habit.dailyHours[dIdx] || habit.dailyHours[dIdx] === 0)) {
        habit.dailyHours[dIdx] = habit.category === 'sono' ? 8 : parseFloat((habit.targetHours / 5).toFixed(1));
    } else if (!state) {
        habit.dailyHours[dIdx] = 0;
    }
    saveData();
};

window.deleteHabitByIdx = function(hIdx) {
    if (confirm(`Remover "${habits[hIdx].name}"?`)) { habits.splice(hIdx, 1); saveData(); }
};

/* Máscara progressiva de horário (HH:MM) — Horas 00..24, Minutos 00..59.
 * Deleta 1 dígito por vez até as horas sem travar no separador ':'. */
window.handleSleepTimeMask = function(el) {
    if (!el) return;
    const digits = el.value.replace(/\D/g, '').slice(0, 4);
    if (digits.length === 0) {
        el.value = '';
        return;
    }
    if (digits.length === 1) {
        el.value = digits;
        return;
    }
    let hh = parseInt(digits.slice(0, 2), 10);
    if (hh > 24) hh = 24;
    const hhStr = String(hh).padStart(2, '0');

    if (digits.length === 2) {
        el.value = hhStr;
        return;
    }
    if (digits.length === 3) {
        let m1 = parseInt(digits.slice(2, 3), 10);
        if (m1 > 5) m1 = 5;
        el.value = `${hhStr}:${m1}`;
        return;
    }
    let mm = parseInt(digits.slice(2, 4), 10);
    if (mm > 59) mm = 59;
    const mmStr = String(mm).padStart(2, '0');
    el.value = `${hhStr}:${mmStr}`;
};

function normalizeSleepTimeValue(val) {
    const digits = String(val || '').replace(/\D/g, '').slice(0, 4);
    if (!digits) return '';
    let hh = 0, mm = 0;
    if (digits.length === 1 || digits.length === 2) {
        hh = parseInt(digits, 10);
    } else if (digits.length === 3) {
        hh = parseInt(digits.slice(0, 2), 10);
        mm = parseInt(digits.slice(2, 3), 10) * 10;
    } else {
        hh = parseInt(digits.slice(0, 2), 10);
        mm = parseInt(digits.slice(2, 4), 10);
    }
    if (isNaN(hh)) hh = 0;
    if (isNaN(mm)) mm = 0;
    if (hh > 24) hh = 24;
    if (mm > 59) mm = 59;
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

window.handleSleepTimeBlur = function(el) {
    if (!el) return;
    const norm = normalizeSleepTimeValue(el.value);
    if (norm) el.value = norm;
};

function buildSleepTableRowsHTML(rowPaddingClass) {
    let html = '';
    weekDays.forEach(d => {
        const hasRecord = Boolean(sleepJournal[d.iso] && sleepJournal[d.iso].bed && sleepJournal[d.iso].bed !== '—');
        const entry = sleepJournal[d.iso] || { bed: '—', slept: '—', wake: '—', getup: '—' };
        const { bedH, sleptH, eff } = calcSleepJournalEntry(sleepJournal[d.iso]);

        const delBtnHTML = hasRecord
            ? `<button type="button" onclick="deleteSleepJournalEntry('${d.iso}')" title="Excluir registro" class="p-1.5 text-rose-500 hover:text-rose-700 transition">🗑️</button>`
            : `<button type="button" disabled title="Sem registro para excluir" class="p-1.5 text-zinc-300 cursor-not-allowed">🗑️</button>`;

        html += `
            <tr class="hover:bg-zinc-50 transition">
                <td class="${rowPaddingClass} px-3 font-medium text-zinc-900 whitespace-nowrap">${d.shortName} (${d.dateNum})</td>
                <td class="${rowPaddingClass} px-3 text-center font-mono">${entry.bed}</td>
                <td class="${rowPaddingClass} px-3 text-center font-mono">${entry.slept}</td>
                <td class="${rowPaddingClass} px-3 text-center font-mono">${entry.wake}</td>
                <td class="${rowPaddingClass} px-3 text-center font-mono">${entry.getup}</td>
                <td class="${rowPaddingClass} px-3 text-center font-mono font-bold text-indigo-600">${bedH > 0 ? bedH.toFixed(1) + 'h' : '—'}</td>
                <td class="${rowPaddingClass} px-3 text-center font-mono font-bold text-emerald-600">${sleptH > 0 ? sleptH.toFixed(1) + 'h' : '—'}</td>
                <td class="${rowPaddingClass} px-3 text-center font-mono font-bold text-purple-600">${eff > 0 ? eff.toFixed(0) + '%' : '—'}</td>
                <td class="${rowPaddingClass} px-3 text-right whitespace-nowrap">
                    <button type="button" onclick="openSleepJournalModal('${d.iso}')" title="Editar / Registrar horário" class="p-1.5 text-zinc-600 hover:text-black transition">✏️</button>
                    ${delBtnHTML}
                </td>
            </tr>`;
    });
    return html;
}

function renderSleepJournalView() {
    const tbody = document.getElementById('sleep-journal-tbody');
    if (!tbody) return;
    tbody.innerHTML = buildSleepTableRowsHTML('py-2.5');
}

function renderDedicatedSleepView() {
    const tbody = document.getElementById('dedicated-sleep-tbody');
    if (!tbody) return;
    tbody.innerHTML = buildSleepTableRowsHTML('py-3');
}

window.onSleepJournalDayChange = function(iso) {
    const existing = sleepJournal[iso];
    const bedEl = document.getElementById('sleep-journal-bed');
    const sleptEl = document.getElementById('sleep-journal-slept');
    const wakeEl = document.getElementById('sleep-journal-wake');
    const getupEl = document.getElementById('sleep-journal-getup');
    const titleEl = document.getElementById('sleep-journal-modal-title');

    if (existing && existing.bed && existing.bed !== '—') {
        if (bedEl) bedEl.value = existing.bed;
        if (sleptEl) sleptEl.value = existing.slept || '23:30';
        if (wakeEl) wakeEl.value = existing.wake || '07:00';
        if (getupEl) getupEl.value = existing.getup || '07:30';
        if (titleEl) titleEl.textContent = 'Editar Registro do Sono';
    } else {
        if (bedEl) bedEl.value = '23:00';
        if (sleptEl) sleptEl.value = '23:30';
        if (wakeEl) wakeEl.value = '07:00';
        if (getupEl) getupEl.value = '07:30';
        if (titleEl) titleEl.textContent = 'Registrar Diário do Sono';
    }
};

window.openSleepJournalModal = function(targetIso) {
    const sel = document.getElementById('sleep-journal-day');
    const defaultIso = targetIso || (weekDays[todayIndex !== -1 ? todayIndex : 0] || weekDays[0]).iso;
    if (sel) {
        sel.innerHTML = '';
        weekDays.forEach((d) => {
            const isSel = d.iso === defaultIso ? 'selected' : '';
            sel.innerHTML += `<option value="${d.iso}" ${isSel}>${d.shortName} (${d.dateNum})</option>`;
        });
        sel.value = defaultIso;
    }
    window.onSleepJournalDayChange(defaultIso);
    const m = document.getElementById('sleep-journal-modal');
    if (m) { m.classList.remove('hidden'); m.classList.add('flex'); }
};

window.deleteSleepJournalEntry = function(iso) {
    if (!iso || !sleepJournal[iso]) return;
    if (confirm('Deseja excluir o registro de sono deste dia?')) {
        delete sleepJournal[iso];
        const dayIdx = weekDays.findIndex(d => d.iso === iso);
        const sleepHabit = habits.find(h => h.category === 'sono');
        if (sleepHabit && dayIdx !== -1) {
            if (Array.isArray(sleepHabit.dailyHours)) sleepHabit.dailyHours[dayIdx] = 0;
            if (Array.isArray(sleepHabit.checks)) sleepHabit.checks[dayIdx] = false;
            if (Array.isArray(sleepHabit.bedtimeHours)) sleepHabit.bedtimeHours[dayIdx] = 0;
        }
        saveData();
    }
};

window.closeSleepJournalModal = function() {
    const m = document.getElementById('sleep-journal-modal');
    if (m) { m.classList.add('hidden'); m.classList.remove('flex'); }
};

/* Mini gráfico de barras (7 dias) usado nos KPIs */
function renderSparkBars(elId, values, formatter) {
    const el = document.getElementById(elId);
    if (!el) return;
    const max = Math.max(...values, 0.0001);
    el.innerHTML = values.map((v, i) => {
        const day = weekDays[i];
        if (isFutureDay(i)) {
            return `<div class="flex-1 h-[12%] rounded-sm bg-black/5" title="${day.shortName}: —"></div>`;
        }
        const h = v > 0 ? Math.max(12, Math.round((v / max) * 100)) : 6;
        const color = day.isToday ? 'bg-zinc-900' : (v > 0 ? 'bg-black/30' : 'bg-black/10');
        return `<div class="flex-1 rounded-sm ${color}" style="height:${h}%" title="${day.shortName}: ${formatter(v)}"></div>`;
    }).join('');
}

function renderDashboardView() {
    const g = calcWeeklyGlobalMetrics();

    /* 1. KPI: Sono (Últimos 7 dias - Média, DP, Eficiência, Elasticidade) - sem barra, formato [Valor_Horas][hminutos com 2 casas] */
    const s = calcSleepWeekSeries();
    const sleepMeanEl = document.getElementById('kpi-sleep-mean');
    const sleepSdEl = document.getElementById('kpi-sleep-sd');
    const sleepBedEl = document.getElementById('kpi-sleep-bed');
    const sleepEffAggrEl = document.getElementById('kpi-sleep-eff-aggr');
    const sleepEffMeanEl = document.getElementById('kpi-sleep-eff-mean');
    const sleepSensEl = document.getElementById('kpi-sleep-sens');

    if (sleepMeanEl) {
        if (s.activeDays > 0) {
            sleepMeanEl.textContent = formatSleepDuration(s.meanSlept);
            if (sleepSdEl) sleepSdEl.textContent = `± ${formatSleepDuration(s.sdSlept)}`;
            if (sleepBedEl) sleepBedEl.textContent = `Tempo de cama: ${formatSleepDuration(s.meanBed)} (${s.activeDays}d reg.)`;
            if (sleepEffAggrEl) sleepEffAggrEl.textContent = `Ef. Média: ${s.efficiency.toFixed(0)}%`;
            if (sleepEffMeanEl) sleepEffMeanEl.textContent = `μ(E): ${s.meanDailyEfficiency.toFixed(0)}%`;
            if (sleepSensEl) sleepSensEl.textContent = `ε ${s.elasticity.toFixed(2)}`;
        } else {
            sleepMeanEl.textContent = '—';
            if (sleepSdEl) sleepSdEl.textContent = '± —';
            if (sleepBedEl) sleepBedEl.textContent = 'Tempo de cama: —';
            if (sleepEffAggrEl) sleepEffAggrEl.textContent = 'Ef. Média: —';
            if (sleepEffMeanEl) sleepEffMeanEl.textContent = 'μ(E): —';
            if (sleepSensEl) sleepSensEl.textContent = 'ε —';
        }
    }

    /* 2. KPI: Média de Volume de Carga dos últimos 7d registrados */
    const loadM = calcWeeklyLoadMetrics();
    const loadMeanEl = document.getElementById('kpi-load-mean');
    const loadUnitEl = document.getElementById('kpi-load-unit');
    const loadRegDaysEl = document.getElementById('kpi-load-reg-days');

    if (loadMeanEl) {
        if (loadM.activeDays > 0) {
            loadMeanEl.textContent = `${loadM.meanDailyLoad.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg`;
            if (loadUnitEl) loadUnitEl.textContent = '/dia';
            if (loadRegDaysEl) loadRegDaysEl.textContent = `(${loadM.activeDays}d reg.)`;
        } else {
            loadMeanEl.textContent = '—';
            if (loadUnitEl) loadUnitEl.textContent = '';
            if (loadRegDaysEl) loadRegDaysEl.textContent = '—';
        }
    }

    /* 3. KPI: Maior Streak (100% das atividades) */
    const hasAnyData = s.activeDays > 0 || loadM.activeDays > 0;
    const streakData = calcConsecutiveFullDaysStreak();
    const streakEl = document.getElementById('kpi-streak');
    const streakLeaderEl = document.getElementById('kpi-streak-leader');
    const streakLabelEl = document.getElementById('kpi-streak-label');
    const streakDotsEl = document.getElementById('kpi-streak-dots');

    if (!hasAnyData) {
        if (streakEl) streakEl.textContent = '—';
        if (streakLeaderEl) streakLeaderEl.textContent = '—';
        if (streakLabelEl) streakLabelEl.textContent = '100% de atividades:';
        if (streakDotsEl) {
            streakDotsEl.innerHTML = weekDays.map(d =>
                `<div class="h-6 rounded-md flex items-center justify-center text-[9px] font-mono bg-white/40 text-zinc-400" title="${d.shortName}: —">${d.shortName.charAt(0)}</div>`
            ).join('');
        }
    } else {
        if (streakEl) streakEl.textContent = `🔥 ${streakData.maxStreak}d`;
        if (streakLeaderEl) streakLeaderEl.textContent = `${streakData.fullDaysThisWeek}/7d na semana`;
        if (streakLabelEl) streakLabelEl.textContent = '100% de atividades:';
        if (streakDotsEl) {
            streakDotsEl.innerHTML = weekDays.map((d, i) => {
                if (isFutureDay(i)) {
                    return `<div class="h-6 rounded-md flex items-center justify-center text-[9px] font-mono bg-black/5 text-transparent" title="${d.shortName}: —">${d.shortName.charAt(0)}</div>`;
                }
                const done = streakData.weekStatus[i] === true;
                const cls = done ? 'bg-zinc-900 text-white font-bold' : 'bg-white/60 text-zinc-500';
                return `<div class="h-6 rounded-md flex items-center justify-center text-[9px] font-mono ${cls}" title="${d.shortName}: ${done ? '100% de atividades concluídas ✓' : 'Incompleto'}">${d.shortName.charAt(0)}</div>`;
            }).join('');
        }
    }

    renderHeatmap(s, loadM);
    renderProgressList(s, loadM);
    renderHighlights(g, s, loadM);
}

/* A) Mapa de calor da semana por atividade */
function renderHeatmap(sData, loadData) {
    const head = document.getElementById('heatmap-head');
    const body = document.getElementById('heatmap-body');
    if (!head || !body) return;

    const s = sData || calcSleepWeekSeries();
    const loadM = loadData || calcWeeklyLoadMetrics();

    head.innerHTML = `<th class="py-2 px-2 font-semibold min-w-[160px]">Atividade</th>` +
        weekDays.map(d => `<th class="py-1 text-center min-w-[52px] ${d.isToday ? 'text-zinc-900 font-bold' : ''}"><div>${d.shortName}</div><div class="text-[9px] font-mono">${d.dateNum}</div></th>`).join('') +
        `<th class="py-2 px-2 text-center">Total</th>`;

    let logs = {};
    try {
        const raw = typeof SafeStorage !== 'undefined' ? SafeStorage.getItem('hq_atv_logs_v1') : null;
        if (raw) logs = JSON.parse(raw) || {};
        else if (typeof atvLogs !== 'undefined') logs = atvLogs || {};
    } catch (e) { logs = {}; }

    const captionEl = document.getElementById('heatmap-caption');
    if (captionEl) {
        captionEl.innerHTML = activeCategoryFilter === 'atv_fisica'
            ? `Atividade Física baseada no registro de treinos • <span class="font-mono">··</span> = dia ainda não chegou`
            : `Sono baseado nas horas dormidas registradas • <span class="font-mono">··</span> = dia ainda não chegou`;
    }

    if (activeCategoryFilter === 'atv_fisica') {
        const completedDaysCount = weekDays.filter(d => Array.isArray(logs[d.iso]) && logs[d.iso].length > 0).length;
        if (loadM.activeDays === 0 && completedDaysCount === 0) {
            body.innerHTML = `<tr><td colspan="9" class="py-6 text-center text-zinc-400 text-xs">Sem registros de atividade física.</td></tr>`;
            return;
        }

        let completedDays = 0;
        const cells = weekDays.map((d, i) => {
            if (isFutureDay(i)) {
                return `<td class="text-center rounded-lg bg-zinc-50 text-zinc-300 font-mono h-10">··</td>`;
            }
            const dayLogs = Array.isArray(logs[d.iso]) ? logs[d.iso] : [];
            const done = dayLogs.length > 0;
            if (done) completedDays++;

            const bg = done ? 'rgba(236, 72, 153, 0.22)' : '#f4f4f5';
            const ring = done ? 'box-shadow: inset 0 0 0 2px #ec4899;' : '';
            const txt = done ? 'text-pink-700 font-bold' : 'text-zinc-400 font-mono';
            const label = done ? '✓' : '·';
            const title = done ? `${d.shortName}: Treino concluído (${dayLogs.length} reg.)` : `${d.shortName}: Sem treino registrado`;
            return `<td class="text-center rounded-lg text-xs h-10 ${txt}" style="background:${bg};${ring}" title="${title}">${label}</td>`;
        }).join('');

        body.innerHTML = `<tr>
            <td class="py-2 px-2 font-medium text-zinc-900 whitespace-nowrap">🏋️ Atividade Física</td>
            ${cells}
            <td class="text-center font-mono font-bold text-zinc-900">${completedDays} treinos</td>
        </tr>`;
    } else {
        // Sono: horas dormidas por dia e total de horas dormidas (somente registros reais do Diário do Sono)
        const dailyHours = weekDays.map(d => {
            const entry = calcSleepJournalEntry(sleepJournal[d.iso]);
            return entry.sleptH > 0 ? entry.sleptH : 0;
        });
        const hasWeekSleep = dailyHours.some(h => h > 0);

        if (s.activeDays === 0 && !hasWeekSleep) {
            body.innerHTML = `<tr><td colspan="9" class="py-6 text-center text-zinc-400 text-xs">Sem registros de sono.</td></tr>`;
            return;
        }

        let totalSleptH = 0;
        const maxSlept = Math.max(...dailyHours, 0.1);

        const cells = weekDays.map((d, i) => {
            if (isFutureDay(i)) {
                return `<td class="text-center rounded-lg bg-zinc-50 text-zinc-300 font-mono h-10">··</td>`;
            }
            const hrs = dailyHours[i];
            if (hrs > 0) totalSleptH += hrs;

            const alpha = hrs > 0 ? Math.min(1, 0.2 + 0.75 * (hrs / maxSlept)) : 0;
            const bg = hrs > 0 ? hexToRgba('#6366f1', alpha) : '#f4f4f5';
            const txt = alpha > 0.55 ? 'text-white' : (hrs > 0 ? 'text-indigo-900' : 'text-zinc-400 font-mono');
            const ring = hrs >= 8 ? 'box-shadow: inset 0 0 0 2px #6366f1;' : '';
            const title = hrs > 0 ? `${d.shortName}: ${formatSleepDuration(hrs)} dormidas` : `${d.shortName}: Sem registro`;

            return `<td class="text-center rounded-lg font-mono text-[11px] h-10 ${txt}" style="background:${bg};${ring}" title="${title}">${hrs > 0 ? hrs.toFixed(1) + 'h' : '·'}</td>`;
        }).join('');

        body.innerHTML = `<tr>
            <td class="py-2 px-2 font-medium text-zinc-900 whitespace-nowrap">🌙 Sono</td>
            ${cells}
            <td class="text-center font-mono font-bold text-indigo-700">${totalSleptH.toFixed(1)}h</td>
        </tr>`;
    }
}

/* D) Progresso por atividade (Meta semanal: Atividade Física 4d + Sono 48h Seg-Sáb) */
function renderProgressList(sData, loadData) {
    const list = document.getElementById('dash-progress-list');
    if (!list) return;

    const s = sData || calcSleepWeekSeries();
    const loadM = loadData || calcWeeklyLoadMetrics();

    let logs = {};
    try {
        const raw = SafeStorage.getItem('hq_atv_logs_v1');
        if (raw) logs = JSON.parse(raw) || {};
        else if (typeof atvLogs !== 'undefined') logs = atvLogs || {};
    } catch (e) { logs = {}; }

    // 1. Atividade Física (meta 4d)
    const completedDays = weekDays.filter(d => Array.isArray(logs[d.iso]) && logs[d.iso].length > 0).length;
    const targetDays = 4;
    const atvPct = Math.min(100, Math.round((completedDays / targetDays) * 100));
    const hasAtv = loadM.activeDays > 0 || completedDays > 0;

    // 2. Sono: meta de 8h/dia, restrito a seg a sab (6 dias * 8h = 48.0h)
    const sleepTargetHours = 48.0;
    let totalSleptMonSat = 0;
    weekDays.slice(0, 6).forEach(d => {
        const entry = calcSleepJournalEntry(sleepJournal[d.iso]);
        if (entry.sleptH > 0) totalSleptMonSat += entry.sleptH;
    });
    const sleepPct = Math.min(100, Math.round((totalSleptMonSat / sleepTargetHours) * 100));
    const hasSleep = s.activeDays > 0 || totalSleptMonSat > 0;

    if (!hasAtv && !hasSleep) {
        list.innerHTML = `<div class="py-6 text-center text-zinc-400 text-xs">Sem registros de atividade física ou sono.</div>`;
        return;
    }

    let html = '';
    if (hasAtv) {
        html += `
            <div class="space-y-1.5">
                <div class="flex justify-between items-baseline gap-2 text-sm">
                    <span class="font-semibold text-zinc-900 truncate">🏋️ Atividade Física</span>
                    <span class="font-mono text-xs text-zinc-600 shrink-0"><strong class="text-zinc-900">${completedDays}d</strong> / ${targetDays}d · ${atvPct}%</span>
                </div>
                <div class="w-full bg-zinc-100 h-2 rounded-full overflow-hidden"><div class="h-full rounded-full bg-pink-500 transition-all" style="width:${atvPct}%"></div></div>
                <div class="flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-mono text-zinc-500">
                    <span>Meta semanal: <strong>4 dias</strong></span>
                    <span>Cumpridos: <strong class="text-pink-600">${completedDays} dias</strong></span>
                </div>
            </div>`;
    }
    if (hasSleep) {
        html += `
            <div class="space-y-1.5 ${hasAtv ? 'pt-3 border-t border-zinc-100' : ''}">
                <div class="flex justify-between items-baseline gap-2 text-sm">
                    <span class="font-semibold text-zinc-900 truncate">🌙 Sono</span>
                    <span class="font-mono text-xs text-zinc-600 shrink-0"><strong class="text-zinc-900">${totalSleptMonSat.toFixed(1)}h</strong> / ${sleepTargetHours.toFixed(1)}h · ${sleepPct}%</span>
                </div>
                <div class="w-full bg-zinc-100 h-2 rounded-full overflow-hidden"><div class="h-full rounded-full bg-indigo-500 transition-all" style="width:${sleepPct}%"></div></div>
                <div class="flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-mono text-zinc-500">
                    <span>Meta semanal (Seg–Sáb): <strong>48.0h (8h/d)</strong></span>
                    <span>Dormido: <strong class="text-indigo-600">${totalSleptMonSat.toFixed(1)}h</strong></span>
                </div>
            </div>`;
    }

    list.innerHTML = html;
}

/* Calcula o intervalo Seg-Dom (DD/MM-DD/MM) a partir de uma data ISO YYYY-MM-DD */
function getWeekRangeFromIsoDate(isoStr) {
    const [y, m, d] = String(isoStr).split('-').map(Number);
    const dt = new Date(y, (m || 1) - 1, d || 1, 12, 0, 0, 0);
    const dow = dt.getDay();
    const diffToMonday = dow === 0 ? -6 : 1 - dow;
    const mon = new Date(dt);
    mon.setDate(dt.getDate() + diffToMonday);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    const pad = n => String(n).padStart(2, '0');
    const weekKey = `${mon.getFullYear()}-${pad(mon.getMonth() + 1)}-${pad(mon.getDate())}`;
    const rangeLabel = `${pad(mon.getDate())}/${pad(mon.getMonth() + 1)}-${pad(sun.getDate())}/${pad(sun.getMonth() + 1)}`;
    return { weekKey, rangeLabel };
}

/* E) Destaques calculados da semana */
function renderHighlights(g, sData, loadData) {
    const ul = document.getElementById('dash-highlights');
    if (!ul) return;

    const s = sData || calcSleepWeekSeries();
    const loadM = loadData || calcWeeklyLoadMetrics();

    let logs = {};
    try {
        const raw = SafeStorage.getItem('hq_atv_logs_v1');
        if (raw) logs = JSON.parse(raw) || {};
        else if (typeof atvLogs !== 'undefined') logs = atvLogs || {};
    } catch (e) { logs = {}; }

    const weekWorkoutDays = weekDays.filter(d => Array.isArray(logs[d.iso]) && logs[d.iso].length > 0).length;
    const hasAtv = loadM.activeDays > 0 || weekWorkoutDays > 0;

    const recentSleep = getRecentRegisteredSleepEntries(7);
    let weekSleepTotal = 0;
    weekDays.forEach(d => {
        const entry = calcSleepJournalEntry(sleepJournal[d.iso]);
        if (entry.sleptH > 0) weekSleepTotal += entry.sleptH;
    });
    const hasSleep = recentSleep.length > 0 || weekSleepTotal > 0;

    if (!hasAtv && !hasSleep) {
        ul.innerHTML = `<li class="py-6 text-center text-zinc-400 text-xs">Sem registros de atividade física ou sono.</li>`;
        return;
    }

    const items = [];

    if (hasSleep) {
        const nights8h = recentSleep.filter(r => r.sleptH >= 8.0);
        if (nights8h.length > 0) {
            const bestNight = [...nights8h].sort((a, b) => b.sleptH - a.sleptH)[0];
            const [y, m, d] = bestNight.date.split('-');
            const dateFormatted = `${d}/${m}`;
            items.push(['🌙', 'Melhor noite', `${dateFormatted} (${formatSleepDuration(bestNight.sleptH)})`]);
        } else {
            items.push(['🌙', 'Melhor noite', 'Nenhum dia ≥ 8h nos últimos 7d']);
        }
    }

    if (hasAtv) {
        // Agrupa os registros de atividade física por semana (Seg-Dom) para encontrar a melhor semana (critério: >= 4 dias de treino, consecutivos ou não)
        const weeksMap = new Map();
        Object.keys(logs).forEach(dateIso => {
            const dayList = logs[dateIso];
            if (!Array.isArray(dayList) || dayList.length === 0) return;
            const { weekKey, rangeLabel } = getWeekRangeFromIsoDate(dateIso);
            if (!weeksMap.has(weekKey)) {
                weeksMap.set(weekKey, { weekKey, rangeLabel, daysCount: 0, totalVolume: 0 });
            }
            const wObj = weeksMap.get(weekKey);
            wObj.daysCount += 1;
            wObj.totalVolume += dayList.reduce((acc, item) => acc + calcLogEntryVolume(item), 0);
        });

        const allWeeks = Array.from(weeksMap.values());
        const qualifiedWeeks = allWeeks.filter(w => w.daysCount >= 4).sort((a, b) => {
            if (b.daysCount !== a.daysCount) return b.daysCount - a.daysCount;
            if (b.totalVolume !== a.totalVolume) return b.totalVolume - a.totalVolume;
            return b.weekKey.localeCompare(a.weekKey);
        });

        if (qualifiedWeeks.length > 0) {
            const bestWeek = qualifiedWeeks[0];
            items.push(['🏋️', 'Melhor semana em Atv Física', `${bestWeek.rangeLabel} (${bestWeek.daysCount}/4 dias)`]);
        } else {
            items.push(['🏋️', 'Melhor semana em Atv Física', 'N/A']);
        }
    }

    const sleepHabit = habits.find(h => h.category === 'sono');
    const sleepTarget = (sleepHabit && sleepHabit.targetHours > 0) ? sleepHabit.targetHours : 48;

    const sleepRatioPct = hasSleep ? (weekSleepTotal / sleepTarget) * 100 : 0;
    const workoutRatioPct = hasAtv ? (weekWorkoutDays / 4) * 100 : 0;

    const candidates = [];
    if (hasSleep && sleepRatioPct >= 30) {
        candidates.push({ name: 'Sono', pct: sleepRatioPct, detail: `${weekSleepTotal.toFixed(1)}h / ${sleepTarget}h` });
    }
    if (hasAtv && workoutRatioPct >= 30) {
        candidates.push({ name: 'Atividade Física', pct: workoutRatioPct, detail: `${weekWorkoutDays}/4 dias` });
    }

    candidates.sort((a, b) => b.pct - a.pct);

    if (candidates.length > 0) {
        const lead = candidates[0];
        items.push(['🏆', 'Mais perto da meta', `${lead.name} (${Math.round(lead.pct)}%)`]);
    }

    ul.innerHTML = items.map(([icon, label, value]) =>
        `<li class="flex gap-3 items-start"><span class="text-base leading-5">${icon}</span><div><div class="text-[11px] font-mono uppercase tracking-wider text-zinc-400">${label}</div><div class="font-semibold">${value}</div></div></li>`
    ).join('');
}



function populateSelects() {
    ['timer-habit-select', 'manual-habit-select', 'event-habit-select'].forEach(id => {
        const sel = document.getElementById(id);
        if (!sel) return;
        const cur = sel.value;
        sel.innerHTML = '';
        if (habits.length === 0) {
            sel.innerHTML = `<option value="">Sem atividades cadastradas</option>`;
        } else {
            habits.forEach((h, idx) => {
                const cat = CATEGORIES[h.category] || CATEGORIES.atv_fisica;
                sel.innerHTML += `<option value="${idx}">${cat.emoji} ${h.name}</option>`;
            });
            if (cur !== '' && cur < habits.length) sel.value = cur;
        }
    });
    ['timer-day-select', 'manual-day-select', 'event-day-select'].forEach(id => {
        const sel = document.getElementById(id);
        if (!sel) return;
        const cur = sel.value;
        sel.innerHTML = '';
        weekDays.forEach((d, idx) => {
            sel.innerHTML += `<option value="${idx}">${d.shortName} (${d.dateNum})${d.isToday ? ' - Hoje' : ''}</option>`;
        });
        sel.value = cur !== '' ? cur : (todayIndex !== -1 ? todayIndex : 0);
    });
    const catSummary = document.getElementById('category-hours-summary');
    if (catSummary) {
        catSummary.innerHTML = '';
        Object.keys(CATEGORIES).forEach(key => {
            const cat = CATEGORIES[key];
            const catHabits = habits.filter(h => h.category === key);
            const doneH = catHabits.reduce((acc, h) => acc + calcHabitMetrics(h).totalHours, 0);
            const targH = catHabits.reduce((acc, h) => acc + h.targetHours, 0);
            const pct = targH > 0 ? Math.min(Math.round((doneH / targH) * 100), 100) : 0;
            catSummary.innerHTML += `<div class="space-y-1"><div class="flex justify-between text-xs"><span class="font-semibold text-zinc-800">${cat.emoji} ${cat.label}</span><span class="font-mono text-zinc-600">${doneH.toFixed(1)}h / ${targH.toFixed(1)}h</span></div><div class="w-full bg-white/80 h-2 rounded-full overflow-hidden"><div class="h-full rounded-full" style="width:${pct}%; background-color:${cat.hex}"></div></div></div>`;
        });
    }
}

window.deleteCalEvent = function(evId) {
    if (confirm('Remover bloco da agenda?')) { calendarEvents = calendarEvents.filter(e => e.id !== evId); saveData(); }
};

function renderCalendarView() {
    const headerGrid = document.getElementById('calendar-header-grid');
    let hHTML = `<div class="p-3 text-center text-[10px] font-mono text-zinc-400 border-r border-zinc-200">GMT-3</div>`;
    weekDays.forEach(d => {
        hHTML += `<div class="p-3 text-center border-r border-zinc-200 ${d.isToday ? 'bg-[#b9f6ca] text-zinc-950 font-bold' : 'text-zinc-600'}"><div class="text-xs uppercase">${d.shortName}</div><div class="text-[11px] font-mono opacity-75">${d.dateNum}</div></div>`;
    });
    headerGrid.innerHTML = hHTML;

    const hoursGrid = document.getElementById('calendar-hours-grid');
    hoursGrid.innerHTML = '';
    for (let hour = 6; hour <= 22; hour++) {
        let rowHTML = `<div class="calendar-grid min-h-[52px]"><div class="p-2 text-right pr-3 text-[11px] font-mono text-zinc-400 border-r border-zinc-200">${String(hour).padStart(2, '0')}:00</div>`;
        for (let dIdx = 0; dIdx < 7; dIdx++) {
            const evs = calendarEvents.filter(e => e.dayIndex === dIdx && Math.floor(e.startHour) === hour);
            let cellContent = '';
            evs.forEach(ev => {
                const habit = habits.find(h => h.id === ev.habitId) || habits[0];
                if (habit) {
                    const cat = CATEGORIES[habit.category] || CATEGORIES.atv_fisica;
                    cellContent += `<div onclick="event.stopPropagation(); openEventModalForEdit('${ev.id}')" class="p-2 rounded-2xl text-[11px] ${cat.cardBg} text-zinc-900 font-medium cursor-pointer mb-1 shadow-xs hover:ring-2 hover:ring-black/30 transition"><div class="font-bold truncate">${cat.emoji} ${habit.name}</div><div class="font-mono text-[10px] opacity-75">${hour}:00 (${ev.duration}h)</div></div>`;
                }
            });
            rowHTML += `<div onclick="openEventModal(${dIdx}, ${hour}, null)" class="p-1 border-r border-zinc-100 ${weekDays[dIdx].isToday ? 'bg-[#b9f6ca]/15' : ''} hover:bg-zinc-50 cursor-pointer">${cellContent}</div>`;
        }
        hoursGrid.innerHTML += rowHTML + `</div>`;
    }
}

window.onHabitCategoryChange = function() {
    const cat = document.getElementById('modal-habit-category').value;
    const sec = document.getElementById('modal-bedtime-section');
    if (sec) sec.classList.toggle('hidden', cat !== 'sono');
};

function renderBedtimeInputs(existingHours) {
    const container = document.getElementById('modal-bedtime-inputs');
    if (!container) return;
    container.innerHTML = '';
    const arr = Array.isArray(existingHours) ? existingHours : [0,0,0,0,0,0,0];
    weekDays.forEach((d, dIdx) => {
        const totalMin = Math.round((parseFloat(arr[dIdx]) || 0) * 60);
        const h = Math.floor(totalMin / 60);
        const m = totalMin % 60;
        container.innerHTML += `
            <div class="text-center">
                <label class="block text-[10px] text-indigo-900 font-semibold mb-1">${d.shortName}</label>
                <div class="flex gap-0.5">
                    <input type="number" id="modal-bed-h-${dIdx}" min="0" max="24" value="${h}" class="w-full bg-white border border-indigo-200 rounded-lg px-0.5 py-1 text-[10px] font-mono text-center">
                    <input type="number" id="modal-bed-m-${dIdx}" min="0" max="59" value="${m}" class="w-full bg-white border border-indigo-200 rounded-lg px-0.5 py-1 text-[10px] font-mono text-center">
                </div>
            </div>`;
    });
}

window.openHabitModal = function(index = -1) {
    document.getElementById('modal-habit-index').value = index;
    const container = document.getElementById('modal-daily-hours-inputs');
    container.innerHTML = '';
    const h = index >= 0 && habits[index] ? habits[index] : null;
    document.getElementById('modal-habit-name').value = h ? h.name : '';
    document.getElementById('modal-habit-category').value = h ? h.category : 'atv_fisica';
    document.getElementById('modal-habit-target-hours').value = h ? h.targetHours : 5.0;
    weekDays.forEach((d, dIdx) => {
        container.innerHTML += `<div class="text-center"><label class="block text-[10px] text-zinc-500 mb-1">${d.shortName}</label><input type="number" id="modal-day-hr-${dIdx}" step="0.1" min="0" max="24" value="${h ? (h.dailyHours[dIdx] || 0) : 0}" class="w-full bg-white border border-zinc-200 rounded-lg px-1 py-1 text-xs font-mono text-center"></div>`;
    });
    renderBedtimeInputs(h ? h.bedtimeHours : null);
    window.onHabitCategoryChange();
    const m = document.getElementById('habit-modal');
    m.classList.remove('hidden'); m.classList.add('flex');
};

window.closeHabitModal = function() {
    const m = document.getElementById('habit-modal');
    m.classList.add('hidden'); m.classList.remove('flex');
};

window.openEventModal = function(dayIndex = 0, startHour = 9, eventId = null) {
    if (habits.length === 0) { alert('Crie pelo menos uma atividade antes de agendar.'); return; }
    populateSelects();
    document.getElementById('event-modal-id').value = eventId || '';
    const titleEl = document.getElementById('event-modal-title');
    const deleteBtn = document.getElementById('btn-delete-event');

    if (eventId) {
        const ev = calendarEvents.find(e => e.id === eventId);
        if (ev) {
            if (titleEl) titleEl.textContent = 'Editar Bloco na Agenda';
            if (deleteBtn) deleteBtn.classList.remove('hidden');
            document.getElementById('event-day-select').value = ev.dayIndex;
            document.getElementById('event-start-hour').value = ev.startHour;
            document.getElementById('event-duration').value = ev.duration;
            const hIdx = habits.findIndex(h => h.id === ev.habitId);
            if (hIdx >= 0) document.getElementById('event-habit-select').value = hIdx;
        }
    } else {
        if (titleEl) titleEl.textContent = 'Agendar Bloco Semanal';
        if (deleteBtn) deleteBtn.classList.add('hidden');
        document.getElementById('event-day-select').value = dayIndex;
        document.getElementById('event-start-hour').value = startHour;
        document.getElementById('event-duration').value = 1.5;
    }

    const m = document.getElementById('event-modal');
    m.classList.remove('hidden'); m.classList.add('flex');
};

window.openEventModalForEdit = function(evId) {
    window.openEventModal(0, 9, evId);
};

window.closeEventModal = function() {
    const m = document.getElementById('event-modal');
    m.classList.add('hidden'); m.classList.remove('flex');
};

function saveEventFromModal() {
    const evId = document.getElementById('event-modal-id').value;
    const hIdx = parseInt(document.getElementById('event-habit-select').value, 10) || 0;
    const dIdx = parseInt(document.getElementById('event-day-select').value, 10) || 0;
    const startHour = parseInt(document.getElementById('event-start-hour').value, 10) || 9;
    const duration = parseFloat(document.getElementById('event-duration').value) || 1.0;
    const habit = habits[hIdx];
    if (!habit) return null;

    if (evId) {
        const ev = calendarEvents.find(e => e.id === evId);
        if (ev) {
            ev.habitId = habit.id;
            ev.dayIndex = dIdx;
            ev.startHour = startHour;
            ev.duration = duration;
        }
    } else {
        const newEv = { id: 'ev_' + Date.now(), habitId: habit.id, dayIndex: dIdx, startHour, duration };
        calendarEvents.push(newEv);
    }
    saveData();
    return { habit };
}

window.saveAndOpenGoogleCal = function() {
    const saved = saveEventFromModal();
    if (!saved || !saved.habit) return;
    const dIdx = parseInt(document.getElementById('event-day-select').value, 10) || 0;
    const startHour = parseInt(document.getElementById('event-start-hour').value, 10) || 9;
    const duration = parseFloat(document.getElementById('event-duration').value) || 1.0;

    const day = weekDays[dIdx];
    if (day && day.rawDate) {
        const startDate = new Date(day.rawDate);
        startDate.setHours(startHour, 0, 0, 0);
        const endDate = new Date(startDate.getTime() + duration * 3600000);

        const pad = n => String(n).padStart(2, '0');
        const formatGCalDate = d => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
        const datesParam = `${formatGCalDate(startDate)}/${formatGCalDate(endDate)}`;
        const title = encodeURIComponent(saved.habit.name);
        const details = encodeURIComponent(`Treino/Hábito agendado no HaQt (${saved.habit.name})`);
        const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${datesParam}&details=${details}`;
        window.open(gcalUrl, '_blank');
    }
    closeEventModal();
};

window.deleteCurrentEditingEvent = function() {
    const evId = document.getElementById('event-modal-id').value;
    if (!evId) return;
    if (confirm('Deseja excluir este bloco da agenda?')) {
        calendarEvents = calendarEvents.filter(e => e.id !== evId);
        saveData();
        closeEventModal();
    }
};

window.openCloudModal = function() {
    document.getElementById('gist-token-input').value = SafeStorage.getItem('hq_gist_token') || '';
    document.getElementById('gist-id-input').value = SafeStorage.getItem('hq_gist_id') || '';
    const m = document.getElementById('cloud-modal');
    m.classList.remove('hidden'); m.classList.add('flex');
};

window.closeCloudModal = function() {
    const m = document.getElementById('cloud-modal');
    m.classList.add('hidden'); m.classList.remove('flex');
};

window.pushToGist = async function() {
    const token = document.getElementById('gist-token-input').value.trim();
    const gistId = document.getElementById('gist-id-input').value.trim();
    const status = document.getElementById('cloud-status-msg');
    if (!token) { status.textContent = "Informe o Token."; return; }
    SafeStorage.setItem('hq_gist_token', token);
    if (gistId) SafeStorage.setItem('hq_gist_id', gistId);
    status.textContent = "Enviando...";
    try {
        const payload = typeof buildGistPayload === 'function'
            ? buildGistPayload()
            : { updatedAt: Date.now(), habits, calendarEvents, timerConfig, sleepJournal };
        const res = await fetch(gistId ? `https://api.github.com/gists/${gistId}` : `https://api.github.com/gists`, {
            method: gistId ? 'PATCH' : 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github+json' },
            body: JSON.stringify({ description: "HabitQuant Pro Cloud Sync", public: false, files: { "habitquant_data.json": { content: JSON.stringify(payload) } } })
        });
        const data = await res.json();
        if (res.ok && data.id) {
            SafeStorage.setItem('hq_gist_id', data.id);
            document.getElementById('gist-id-input').value = data.id;
            status.textContent = `✅ Sincronizado! ID: ${data.id}`;
            updateCloudBadge('✅ Sync Ativo');
            if (typeof ensureWorkoutPlanHabits === 'function') ensureWorkoutPlanHabits();
            renderAll();
        } else {
            status.textContent = "❌ Falha ao enviar. Verifique o Token/ID.";
        }
    } catch (e) { status.textContent = "❌ Erro de rede."; }
};

window.pullFromGist = async function() {
    const token = document.getElementById('gist-token-input').value.trim();
    const gistId = document.getElementById('gist-id-input').value.trim();
    const status = document.getElementById('cloud-status-msg');
    if (!token || !gistId) { status.textContent = "Informe Token e ID."; return; }
    SafeStorage.setItem('hq_gist_token', token);
    SafeStorage.setItem('hq_gist_id', gistId);
    status.textContent = "Baixando...";
    const ok = await autoPullFromGist(true);
    if (ok && typeof ensureWorkoutPlanHabits === 'function') ensureWorkoutPlanHabits();
    if (ok) renderAll();
    status.textContent = ok ? "✅ Sincronizado!" : "❌ Falha ao baixar. Verifique o Token e o ID.";
};

window.exportToCSV = function() {
    let csv = "data:text/csv;charset=utf-8,habit_id,habit_name,category,target_hours_week,total_hours_week,mean_hours_day,sd_hours_week,freq_pct,sensitivity_deriv,elasticity,day_of_week,date_iso,completed,hours_day\n";
    habits.forEach(h => {
        const m = calcHabitMetrics(h), cleanName = `"${h.name.replace(/"/g, '""')}"`;
        weekDays.forEach((day, dIdx) => {
            csv += `${h.id},${cleanName},${h.category},${h.targetHours},${m.totalHours.toFixed(2)},${m.meanHours.toFixed(2)},${m.sdHours.toFixed(2)},${m.freqPct.toFixed(1)},${m.sensitivityDerivative.toFixed(2)},${m.elasticity.toFixed(3)},${day.shortName},${day.iso},${h.checks[dIdx] ? 1 : 0},${h.dailyHours[dIdx] || 0}\n`;
        });
    });
    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = `habitquant_${weekDays[0].iso}.csv`;
    link.click();
};

window.exportCalendarICS = function() {
    let ics = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//HabitQuant Pro//PT-BR\n";
    const fmt = d => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    calendarEvents.forEach(ev => {
        const habit = habits.find(h => h.id === ev.habitId);
        if (!habit) return;
        const start = new Date(weekDays[ev.dayIndex].rawDate);
        start.setHours(ev.startHour, 0, 0, 0);
        const end = new Date(start.getTime() + ev.duration * 3600 * 1000);
        ics += `BEGIN:VEVENT\nSUMMARY:${CATEGORIES[habit.category].emoji} ${habit.name}\nDTSTART:${fmt(start)}\nDTEND:${fmt(end)}\nEND:VEVENT\n`;
    });
    ics += "END:VCALENDAR";
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
    link.download = `agenda_habitos_${weekDays[0].iso}.ics`;
    link.click();
};

window.resetAllData = function() {
    if (confirm('Deseja zerar todos os dados?')) {
        habits = [];
        calendarEvents = [];
        sleepJournal = {};
        atvLogs = {};
        SafeStorage.removeItem('hq_atv_logs_v1');
        SafeStorage.removeItem('hq_plan_seeded_v1');
        if (typeof ensureWorkoutPlanHabits === 'function') {
            ensureWorkoutPlanHabits();
        }
        saveData();
    }
};

function renderAll(activeRoute) {
    document.getElementById('week-range-badge').textContent = `${weekDays[0].dateNum} a ${weekDays[6].dateNum}`;
    populateSelects();
    populateActivityChartTargetSelect();
    if (typeof populateDashLoadChartSelect === 'function') populateDashLoadChartSelect();
    renderDashboardView();
    const current = activeRoute || (window.location.hash || '#dashboard').replace('#', '').trim();
    if (current === 'dashboard' || current === '') renderDashboardCharts();
    if (current === 'metrics') {
        renderMetricsView();
        renderSleepJournalView();
    }
    if (current === 'sono') {
        renderDedicatedSleepView();
    }
    if (current === 'atv_fisica') {
        if (typeof renderAtvFisicaInteractiveView === 'function') renderAtvFisicaInteractiveView();
    }
    if (current === 'calendar') renderCalendarView();
    refreshIcons();
}

window.addEventListener('DOMContentLoaded', () => {
    if (typeof window.loadProfile === 'function') window.loadProfile();
    loadData();
    if (typeof ensureWorkoutPlanHabits === 'function') ensureWorkoutPlanHabits();
    if (typeof loadAtvLogs === 'function') loadAtvLogs();

    const manualForm = document.getElementById('manual-hours-form');
    if (manualForm) {
        manualForm.addEventListener('submit', e => {
            e.preventDefault();
            const hIdx = parseInt(document.getElementById('manual-habit-select').value, 10);
            const dIdx = parseInt(document.getElementById('manual-day-select').value, 10);
            const hrs = parseFloat(document.getElementById('manual-hours-input').value) || 0;
            if (habits[hIdx] && hrs > 0) {
                habits[hIdx].dailyHours[dIdx] = parseFloat(((habits[hIdx].dailyHours[dIdx] || 0) + hrs).toFixed(2));
                habits[hIdx].checks[dIdx] = true;
                saveData();
            }
        });
    }

    document.getElementById('habit-modal-form').addEventListener('submit', e => {
        e.preventDefault();
        const idx = parseInt(document.getElementById('modal-habit-index').value, 10);
        const name = document.getElementById('modal-habit-name').value.trim();
        const category = document.getElementById('modal-habit-category').value;
        const targetHours = parseFloat(document.getElementById('modal-habit-target-hours').value) || 1;
        const dailyHours = weekDays.map((_, dIdx) => parseFloat(document.getElementById('modal-day-hr-' + dIdx).value) || 0);

        let bedtimeHours = null;
        if (category === 'sono') {
            bedtimeHours = weekDays.map((_, dIdx) => {
                const hh = parseFloat(document.getElementById('modal-bed-h-' + dIdx).value) || 0;
                const mm = parseFloat(document.getElementById('modal-bed-m-' + dIdx).value) || 0;
                return parseFloat((hh + mm / 60).toFixed(2));
            });
        }

        if (!name) return;
        if (idx >= 0 && habits[idx]) {
            Object.assign(habits[idx], { name, category, targetHours, dailyHours });
            if (bedtimeHours) habits[idx].bedtimeHours = bedtimeHours;
            else delete habits[idx].bedtimeHours;
            dailyHours.forEach((hr, i) => { if (hr > 0) habits[idx].checks[i] = true; });
        } else {
            const newHabit = {
                id: 'h_' + Date.now(), name, category, targetHours,
                checks: dailyHours.map(hr => hr > 0), dailyHours
            };
            if (bedtimeHours) newHabit.bedtimeHours = bedtimeHours;
            habits.push(newHabit);
        }
        closeHabitModal();
        saveData();
    });

    document.getElementById('event-modal-form').addEventListener('submit', e => {
        e.preventDefault();
        saveEventFromModal();
        closeEventModal();
    });

    const profileForm = document.getElementById('profile-modal-form');
    if (profileForm) {
        profileForm.addEventListener('submit', e => {
            e.preventDefault();
            const name = document.getElementById('profile-name-input').value.trim();
            const gender = document.getElementById('profile-gender-input').value;
            if (!name) return;
            const draft = (typeof window.getAvatarDraft === 'function') ? window.getAvatarDraft() : {};
            window.saveProfile({ name, gender, role: draft.role, skinTone: draft.skinTone });
            if (typeof window.markFirstRunDone === 'function') window.markFirstRunDone();
            window.closeProfileModal();
            if (typeof ensureWorkoutPlanHabits === 'function') ensureWorkoutPlanHabits();
            renderAll();
        });
    }

    const sleepForm = document.getElementById('sleep-journal-form');
    if (sleepForm) {
        sleepForm.addEventListener('submit', e => {
            e.preventDefault();
            const iso = document.getElementById('sleep-journal-day').value;
            const bed = normalizeSleepTimeValue(document.getElementById('sleep-journal-bed').value);
            const slept = normalizeSleepTimeValue(document.getElementById('sleep-journal-slept').value);
            const wake = normalizeSleepTimeValue(document.getElementById('sleep-journal-wake').value);
            const getup = normalizeSleepTimeValue(document.getElementById('sleep-journal-getup').value);

            if (!bed || !slept || !wake || !getup) return;

            sleepJournal[iso] = { bed, slept, wake, getup };
            saveData();
            closeSleepJournalModal();
        });
    }

    selectTimerMode('stopwatch');
    applyRoute();

    if (typeof window.hasProfile === 'function' && !window.hasProfile()) {
        if (typeof window.openProfileModal === 'function') {
            window.openProfileModal({ firstRun: true });
        }
    }

    refreshIcons();
    setTimeout(refreshIcons, 300);
    setTimeout(refreshIcons, 1000);

    autoPullFromGist(false);
    window.addEventListener('focus', () => autoPullFromGist(false));
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') autoPullFromGist(false);
    });
});

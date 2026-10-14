let activeCategoryFilter = 'all';
let isSidebarCollapsed = false;

window.toggleDesktopSidebar = function() {
    const sb = document.getElementById('desktop-sidebar');
    const icon = document.getElementById('sidebar-toggle-icon');
    if (!sb) return;
    isSidebarCollapsed = !isSidebarCollapsed;
    sb.classList.toggle('sidebar-expanded', !isSidebarCollapsed);
    sb.classList.toggle('sidebar-collapsed', isSidebarCollapsed);
    if (icon) icon.setAttribute('data-lucide', isSidebarCollapsed ? 'panel-left-open' : 'panel-left-close');
    if (window.lucide) lucide.createIcons();
};

window.toggleMobileDrawer = function() {
    document.getElementById('mobile-drawer').classList.toggle('hidden');
};

/* Títulos originais — sem greeting dinâmico */
const ROUTE_CONFIG = {
    dashboard: { eyebrow: 'DASHBOARD', title: 'Bom dia, Semana Corrente' },
    timer:     { eyebrow: 'TIMER',     title: 'Cronômetro & Pomodoro' },
    metrics:   { eyebrow: 'ANÁLISE',   title: 'Métricas' },
    calendar:  { eyebrow: 'AGENDA',    title: 'Calendário Semanal' }
};

window.navigateTo = function(route) {
    if (window.location.hash !== '#' + route) history.pushState(null, null, '#' + route);
    applyRoute(route);
};

function applyRoute(routeParam) {
    const hashRoute = (window.location.hash || '#dashboard').replace('#', '').trim();
    const activeRoute = ROUTE_CONFIG[routeParam] ? routeParam : (ROUTE_CONFIG[hashRoute] ? hashRoute : 'dashboard');

    ['dashboard', 'timer', 'metrics', 'calendar'].forEach(r => {
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
                ? "mobile-nav-item flex flex-col items-center py-1.5 px-4 rounded-full text-[11px] font-semibold bg-white text-black"
                : "mobile-nav-item flex flex-col items-center py-1.5 px-4 rounded-full text-[11px] font-medium text-zinc-400";
        }
    });

    const cfg = ROUTE_CONFIG[activeRoute];
    document.getElementById('header-eyebrow').innerText = cfg.eyebrow;
    document.getElementById('view-title').innerText = cfg.title;

    renderAll(activeRoute);
}

/* No-op — o título é estático via ROUTE_CONFIG.
   Mantida para compatibilidade com profile.js. */
window.refreshHeaderTitle = function () {};

window.addEventListener('hashchange', () => applyRoute());

window.setCategoryFilter = function(cat) {
    activeCategoryFilter = cat;
    ['all', 'academia', 'estudos', 'saude', 'sono'].forEach(c => {
        const btn = document.getElementById('cat-btn-' + c);
        if (btn) btn.className = c === cat ? "px-3.5 py-1.5 rounded-full bg-black text-white font-semibold" : "px-3.5 py-1.5 rounded-full text-zinc-600 hover:text-black";
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

/* KPI de Sono (substitui a antiga elasticidade global) */
function renderSleepKPI() {
    const sleepHabit = habits.find(h => h.category === 'sono');
    const bedEl = document.getElementById('kpi-sleep-bed');
    const sleptEl = document.getElementById('kpi-sleep-slept');
    const sensEl = document.getElementById('kpi-sleep-sens');
    const effEl = document.getElementById('kpi-sleep-eff');
    if (!bedEl) return;

    if (!sleepHabit) {
        bedEl.textContent = '—';
        sleptEl.textContent = '→ —';
        sensEl.textContent = 'Sensib.: ε —';
        effEl.textContent = 'Eficiência: —';
        return;
    }

    const agg = calcSleepAggregates(sleepHabit);
    const m = calcHabitMetrics(sleepHabit);

    if (agg.activeDays === 0) {
        bedEl.textContent = '—';
        sleptEl.textContent = '→ —';
        sensEl.textContent = 'Sensib.: ε —';
        effEl.textContent = 'Eficiência: —';
        return;
    }

    bedEl.textContent = agg.meanBed.toFixed(1) + 'h';
    sleptEl.textContent = '→ ' + agg.meanSlept.toFixed(1) + 'h';
    sensEl.textContent = 'Sensib.: ε ' + m.elasticity.toFixed(2);
    effEl.textContent = 'Eficiência: ' + agg.efficiency.toFixed(0) + '%';
}

function renderDashboardView() {
    const g = calcWeeklyGlobalMetrics();
    document.getElementById('kpi-freq-mean').textContent = `${g.avgFreqPct.toFixed(1)}%`;
    document.getElementById('kpi-freq-checks').textContent = `(${g.totalChecks}/${g.possibleChecks}d)`;
    document.getElementById('kpi-today-progress').textContent = `Hoje: ${g.todayDone}/${habits.length}`;
    document.getElementById('kpi-hours-total').textContent = `${g.sumTotalHours.toFixed(1)}h`;
    document.getElementById('kpi-hours-target').textContent = `/ ${g.sumTargetHours.toFixed(1)}h`;
    document.getElementById('kpi-hours-mean-sd').textContent = `${g.dailyTotalMeanHours.toFixed(1)}h/d ± ${g.dailyTotalSdHours.toFixed(2)}h`;
    document.getElementById('kpi-streak').textContent = `🔥 ${g.bestStreak}d`;
    document.getElementById('kpi-streak-leader').textContent = g.leaderName;

    renderSleepKPI();

    const cardsGrid = document.getElementById('activity-cards-grid');
    cardsGrid.innerHTML = '';

    const filtered = habits.map((h, i) => ({ habit: h, index: i }))
        .filter(item => activeCategoryFilter === 'all' || item.habit.category === activeCategoryFilter);

    const trHead = document.getElementById('table-header-days');
    let headHTML = `<th class="py-3 px-2 font-semibold min-w-[200px]">ATIVIDADE</th>`;
    weekDays.forEach(day => {
        headHTML += `<th class="py-2 px-1 text-center ${day.isToday ? 'text-black font-bold underline' : ''}"><div class="text-[11px]">${day.shortName}</div><div class="text-[9px] font-mono">${day.dateNum}</div></th>`;
    });
    headHTML += `<th class="py-2 px-2 text-center">HORAS (H/H*)</th><th class="py-2 px-2 text-center">ENGAJAMENTO</th><th class="py-2 px-2 text-center">SENSIB. (ε)</th><th class="py-2 px-2 text-right">AÇÕES</th>`;
    trHead.innerHTML = headHTML;

    const tbody = document.getElementById('habits-tbody');
    tbody.innerHTML = '';

    if (filtered.length === 0) {
        cardsGrid.innerHTML = `
            <div class="col-span-full bg-white border border-dashed border-zinc-300 rounded-3xl p-10 text-center space-y-3">
                <div class="text-2xl">🌱</div>
                <div class="text-sm font-semibold text-zinc-800">Nenhuma atividade cadastrada</div>
                <p class="text-xs text-zinc-500 max-w-sm mx-auto">O painel está zerado. Clique no botão <strong>+ Nova Atividade</strong> no canto superior direito para criar sua primeira meta semanal.</p>
            </div>`;
        tbody.innerHTML = `<tr><td colspan="12" class="py-8 text-center text-zinc-400 text-xs">Sem dados registrados na semana.</td></tr>`;
        return;
    }

    filtered.forEach(({ habit, index: hIndex }) => {
        const m = calcHabitMetrics(habit);
        const cat = CATEGORIES[habit.category] || CATEGORIES.estudos;
        const pctBar = Math.min(100, Math.round(m.hoursPct));

        let daysPillsHTML = '';
        weekDays.forEach((day, dIdx) => {
            const done = habit.checks[dIdx];
            const hrs = habit.dailyHours[dIdx] || 0;
            const bedH = (habit.bedtimeHours && habit.bedtimeHours[dIdx]) || 0;
            const todayBorder = day.isToday ? 'ring-2 ring-black/20 bg-white' : 'bg-white/50';
            const bedLine = (habit.category === 'sono' && bedH > 0)
                ? `<span class="text-[8px] font-mono text-indigo-600 mt-0.5">🛏 ${bedH.toFixed(1)}h</span>`
                : '';
            daysPillsHTML += `
                <div onclick="toggleHabitDay(${hIndex}, ${dIdx})" class="cursor-pointer flex flex-col items-center py-2 px-1 rounded-2xl ${todayBorder} transition hover:scale-105">
                    <span class="text-[10px] text-zinc-600 font-medium mb-1">${day.shortName}</span>
                    <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs ${done ? 'bg-black text-white' : 'border border-zinc-300 text-transparent'}">✓</div>
                    <span class="text-[9px] font-mono text-zinc-600 mt-1">${hrs.toFixed(1)}h</span>
                    ${bedLine}
                </div>`;
        });

        /* Sono: só Streak, Média e Sensib. (sem frequência) */
        const footerHTML = habit.category === 'sono'
            ? `<div class="pt-2 border-t border-black/5 flex justify-between text-[11px] text-zinc-700 font-medium">
                   <span>Streak: 🔥 <strong>${m.streak}d</strong></span>
                   <span>Média: <strong>${m.meanHours.toFixed(1)}h/d</strong></span>
                   <span>Sensib.: <strong>ε ${m.elasticity.toFixed(2)}</strong></span>
               </div>`
            : `<div class="pt-2 border-t border-black/5 flex justify-between text-[11px] text-zinc-700 font-medium">
                   <span>Engajamento: <strong>${m.freqPct.toFixed(0)}%</strong></span>
                   <span>Streak: 🔥 <strong>${m.streak}d</strong></span>
                   <span>Média: <strong>${m.meanHours.toFixed(1)}h/d</strong></span>
               </div>`;

        cardsGrid.innerHTML += `
            <div class="${cat.cardBg} p-5 rounded-3xl flex flex-col justify-between space-y-4 shadow-xs">
                <div class="flex justify-between items-start gap-2">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-white/70 flex items-center justify-center text-lg shrink-0">${cat.emoji}</div>
                        <div>
                            <h3 class="font-bold text-zinc-900 text-sm leading-snug">${habit.name}</h3>
                            <span class="text-[11px] font-mono text-zinc-600">${cat.label} • Meta: ${habit.targetHours}h/sem</span>
                        </div>
                    </div>
                    <div class="flex items-center gap-1 text-zinc-600">
                        <button type="button" onclick="openHabitModal(${hIndex})" class="p-1 hover:text-black">✏️</button>
                        <button type="button" onclick="deleteHabitByIdx(${hIndex})" class="p-1 hover:text-rose-600">🗑️</button>
                    </div>
                </div>
                <div>
                    <div class="flex justify-between items-baseline mb-1.5">
                        <div class="font-mono"><span class="text-2xl font-bold text-zinc-950">${m.totalHours.toFixed(1)}h</span> <span class="text-xs text-zinc-600">/ ${habit.targetHours}h</span></div>
                        <span class="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#fef3c7] text-amber-900">Sensib. ε ${m.elasticity.toFixed(2)}</span>
                    </div>
                    <div class="w-full bg-white/60 h-2 rounded-full overflow-hidden">
                        <div class="bg-zinc-800 h-full rounded-full transition-all" style="width: ${pctBar}%"></div>
                    </div>
                </div>
                <div class="grid grid-cols-7 gap-1">${daysPillsHTML}</div>
                ${footerHTML}
            </div>`;

        /* Engajamento oculto para sono */
        const engajCell = habit.category === 'sono' ? '—' : `${m.freqPct.toFixed(1)}%`;
        let row = `<tr class="hover:bg-zinc-50 transition"><td class="py-3 px-2 font-medium text-zinc-900">${cat.emoji} ${habit.name}</td>`;
        weekDays.forEach((day, dIndex) => {
            const checked = habit.checks[dIndex] ? 'checked' : '';
            const dayHrs = habit.dailyHours[dIndex] || 0;
            row += `<td class="py-2 px-1 text-center"><div class="flex flex-col items-center gap-0.5"><label class="inline-flex items-center justify-center cursor-pointer"><input type="checkbox" class="sr-only habit-check" onchange="toggleHabitDay(${hIndex}, ${dIndex})" ${checked}><div class="w-5 h-5 rounded-full border border-zinc-300 bg-white flex items-center justify-center"><svg class="w-3 h-3 text-white opacity-0 transform scale-50 transition-all pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg></div></label><span class="text-[9px] font-mono text-zinc-500">${dayHrs.toFixed(1)}h</span></div></td>`;
        });
        row += `<td class="py-2.5 px-2 text-center font-mono text-xs"><strong>${m.totalHours.toFixed(1)}h</strong> / ${m.targetH}h <div class="text-[10px] text-purple-600">${m.meanHours.toFixed(1)}h ± ${m.sdHours.toFixed(2)}h</div></td><td class="py-2.5 px-2 text-center font-mono text-xs font-bold text-emerald-600">${engajCell}</td><td class="py-2.5 px-2 text-center font-mono text-xs font-bold">${m.elasticity.toFixed(2)}</td><td class="py-2.5 px-2 text-right"><button type="button" onclick="openHabitModal(${hIndex})" class="p-1">✏️</button><button type="button" onclick="deleteHabitByIdx(${hIndex})" class="p-1">🗑️</button></td></tr>`;
        tbody.innerHTML += row;
    });
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
                const cat = CATEGORIES[h.category] || CATEGORIES.estudos;
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
                    const cat = CATEGORIES[habit.category] || CATEGORIES.estudos;
                    cellContent += `<div onclick="event.stopPropagation(); deleteCalEvent('${ev.id}')" class="p-2 rounded-2xl text-[11px] ${cat.cardBg} text-zinc-900 font-medium cursor-pointer mb-1 shadow-xs"><div class="font-bold truncate">${cat.emoji} ${habit.name}</div><div class="font-mono text-[10px] opacity-75">${hour}:00 (${ev.duration}h)</div></div>`;
                }
            });
            rowHTML += `<div onclick="openEventModal(${dIdx}, ${hour})" class="p-1 border-r border-zinc-100 ${weekDays[dIdx].isToday ? 'bg-[#b9f6ca]/15' : ''} hover:bg-zinc-50 cursor-pointer">${cellContent}</div>`;
        }
        hoursGrid.innerHTML += rowHTML + `</div>`;
    }
}

/* Modal de Atividade: exibe/oculta Tempo de Cama */
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
                <div class="text-[8px] text-indigo-500 mt-0.5">h / m</div>
            </div>`;
    });
}

window.openHabitModal = function(index = -1) {
    document.getElementById('modal-habit-index').value = index;
    const container = document.getElementById('modal-daily-hours-inputs');
    container.innerHTML = '';
    const h = index >= 0 && habits[index] ? habits[index] : null;
    document.getElementById('modal-habit-name').value = h ? h.name : '';
    document.getElementById('modal-habit-category').value = h ? h.category : 'estudos';
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

window.openEventModal = function(dayIndex = 0, startHour = 9) {
    if (habits.length === 0) {
        alert('Crie pelo menos uma atividade antes de agendar no calendário.');
        return;
    }
    populateSelects();
    document.getElementById('event-day-select').value = dayIndex;
    document.getElementById('event-start-hour').value = startHour;
    const m = document.getElementById('event-modal');
    m.classList.remove('hidden'); m.classList.add('flex');
};

window.closeEventModal = function() {
    const m = document.getElementById('event-modal');
    m.classList.add('hidden'); m.classList.remove('flex');
};

function saveEventFromModal() {
    const hIdx = parseInt(document.getElementById('event-habit-select').value, 10) || 0;
    const dIdx = parseInt(document.getElementById('event-day-select').value, 10) || 0;
    const startHour = parseInt(document.getElementById('event-start-hour').value, 10) || 9;
    const duration = parseFloat(document.getElementById('event-duration').value) || 1.0;
    const habit = habits[hIdx];
    if (!habit) return null;
    const newEv = { id: 'ev_' + Date.now(), habitId: habit.id, dayIndex: dIdx, startHour, duration };
    calendarEvents.push(newEv);
    saveData();
    return { newEv, habit };
}

window.saveAndOpenGoogleCal = function() {
    const res = saveEventFromModal();
    if (!res) return;
    const { newEv, habit } = res;
    const cat = CATEGORIES[habit.category] || CATEGORIES.estudos;
    const start = new Date(weekDays[newEv.dayIndex].rawDate);
    start.setHours(newEv.startHour, 0, 0, 0);
    const end = new Date(start.getTime() + newEv.duration * 3600 * 1000);
    const fmt = d => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(cat.emoji + ' ' + habit.name)}&dates=${fmt(start)}/${fmt(end)}`, '_blank');
    closeEventModal();
};

window.deleteCurrentEditingEvent = function () {
    const id = document.getElementById('event-modal-id').value;
    if (!id) return;
    if (confirm('Excluir este bloco?')) {
        calendarEvents = calendarEvents.filter(e => e.id !== id);
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
        const res = await fetch(gistId ? `https://api.github.com/gists/${gistId}` : `https://api.github.com/gists`, {
            method: gistId ? 'PATCH' : 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github+json' },
            body: JSON.stringify({ description: "HabitQuant Pro Cloud Sync", public: false, files: { "habitquant_data.json": { content: JSON.stringify({ updatedAt: Date.now(), habits, calendarEvents, timerConfig }) } } })
        });
        const data = await res.json();
        if (res.ok && data.id) {
            SafeStorage.setItem('hq_gist_id', data.id);
            document.getElementById('gist-id-input').value = data.id;
            status.textContent = `✅ Sincronizado! ID: ${data.id}`;
            updateCloudBadge('✅ Sync Ativo');
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
    await autoPullFromGist();
    status.textContent = "✅ Sincronizado!";
};

window.exportToCSV = function() {
    let csv = "data:text/csv;charset=utf-8,habit_id,habit_name,category,target_hours_week,total_hours_week,mean_hours_day,sd_hours_week,freq_pct,sensitivity_deriv,elasticity,bedtime_hours_day,day_of_week,date_iso,completed,hours_day\n";
    habits.forEach(h => {
        const m = calcHabitMetrics(h), cleanName = `"${h.name.replace(/"/g, '""')}"`;
        weekDays.forEach((day, dIdx) => {
            const bed = (h.bedtimeHours && h.bedtimeHours[dIdx]) || 0;
            csv += `${h.id},${cleanName},${h.category},${h.targetHours},${m.totalHours.toFixed(2)},${m.meanHours.toFixed(2)},${m.sdHours.toFixed(2)},${m.freqPct.toFixed(1)},${m.sensitivityDerivative.toFixed(2)},${m.elasticity.toFixed(3)},${bed},${day.shortName},${day.iso},${h.checks[dIdx] ? 1 : 0},${h.dailyHours[dIdx] || 0}\n`;
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
    if (confirm('Deseja zerar todos os dados e deixar o painel sem atividades?')) {
        habits = [];
        calendarEvents = [];
        saveData();
    }
};

function renderAll(activeRoute) {
    document.getElementById('week-range-badge').textContent = `${weekDays[0].dateNum} a ${weekDays[6].dateNum}`;
    populateSelects();
    populateActivityChartTargetSelect();
    renderDashboardView();
    const current = activeRoute || (window.location.hash || '#dashboard').replace('#', '');
    if (current === 'metrics') renderMetricsView();
    if (current === 'calendar') renderCalendarView();
    if (window.lucide) lucide.createIcons();
}

window.addEventListener('DOMContentLoaded', () => {
    loadData();
    if (typeof window.loadProfile === 'function') window.loadProfile();

    document.getElementById('manual-hours-form').addEventListener('submit', e => {
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
                const h = parseFloat(document.getElementById('modal-bed-h-' + dIdx).value) || 0;
                const m = parseFloat(document.getElementById('modal-bed-m-' + dIdx).value) || 0;
                return parseFloat((h + m / 60).toFixed(2));
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
                id: 'h_' + Date.now(),
                name, category, targetHours,
                checks: dailyHours.map(hr => hr > 0),
                dailyHours
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
            window.closeProfileModal();
        });
    }

    selectTimerMode('stopwatch');
    applyRoute();

    if (typeof window.hasProfile === 'function' && !window.hasProfile()) {
        if (typeof window.openProfileModal === 'function') {
            window.openProfileModal({ firstRun: true });
        }
    }

    autoPullFromGist();
    window.addEventListener('focus', autoPullFromGist);
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') autoPullFromGist();
    });
});

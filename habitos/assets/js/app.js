// ============================================================================
// assets/js/app.js — Controlador Original Restaurado (Painel de Hábitos)
// ============================================================================

let activeCategoryFilter = 'all';
let isSidebarCollapsed = false;
const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

const ROUTE_CONFIG = {
    dashboard:  { eyebrow: 'PAINEL LONGITUDINAL', title: 'Visão Geral & Matriz Semanal' },
    atv_fisica: { eyebrow: 'GRUPO: ATIVIDADE FÍSICA', title: 'Treinamento Upper/Lower & Adesão' },
    sono:       { eyebrow: 'GRUPO: SONO & RECUPERAÇÃO', title: 'Diário Clínico & Eficiência do Sono' },
    timer:      { eyebrow: 'CRONOMETRIA & FOCO', title: 'Timer & Registro de Sessões' },
    metrics:    { eyebrow: 'PSICOMETRIA & SÉRIES TEMPORAIS', title: 'Elasticidade (ε) & Bandas de Desvio-Padrão' },
    calendar:   { eyebrow: 'PLANEJAMENTO DE BLOCOS', title: 'Agenda Semanal & Google Calendar' }
};

function refreshIcons() {
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    }
}

function toggleDesktopSidebar() {
    const sb = document.getElementById('desktop-sidebar');
    if (!sb) return;
    isSidebarCollapsed = !isSidebarCollapsed;
    sb.classList.toggle('w-64', !isSidebarCollapsed);
    sb.classList.toggle('w-20', isSidebarCollapsed);
    document.querySelectorAll('.sidebar-text').forEach(el => {
        el.classList.toggle('hidden', isSidebarCollapsed);
    });
}

function toggleMobileDrawer() {
    const drawer = document.getElementById('mobile-drawer');
    if (drawer) drawer.classList.toggle('hidden');
}

function refreshHeaderTitle(route) {
    const cfg = ROUTE_CONFIG[route] || ROUTE_CONFIG.dashboard;
    const eyebrowEl = document.getElementById('view-eyebrow');
    const titleEl = document.getElementById('view-title');
    if (eyebrowEl) eyebrowEl.textContent = cfg.eyebrow;
    if (titleEl) {
        if (route === 'dashboard' && typeof buildDynamicGreeting === 'function') {
            titleEl.textContent = buildDynamicGreeting();
        } else {
            titleEl.textContent = cfg.title;
        }
    }
}

function navigateTo(route) {
    window.location.hash = route;
    applyRoute(route);
}

function applyRoute(route) {
    const cleanRoute = ROUTE_CONFIG[route] ? route : 'dashboard';
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.add('hidden'));
    const targetSec = document.getElementById(`view-${cleanRoute}`);
    if (targetSec) targetSec.classList.remove('hidden');

    document.querySelectorAll('.nav-btn').forEach(btn => {
        const isAct = btn.getAttribute('data-route') === cleanRoute;
        btn.className = isAct
            ? 'nav-btn w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white shadow-sm shadow-indigo-500/20 transition-all'
            : 'nav-btn w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all';
    });

    refreshHeaderTitle(cleanRoute);
    renderAll();
}

function setCategoryFilter(cat) {
    activeCategoryFilter = cat;
    ['all', 'atv_fisica', 'sono'].forEach(c => {
        const btn = document.getElementById(`cat-btn-${c}`);
        if (btn) {
            btn.className = (c === cat)
                ? 'px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white'
                : 'px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700';
        }
    });
    renderDashboardView();
}

function toggleHabitDay(habitIdx, dayIdx) {
    const h = habits[habitIdx];
    if (!h) return;
    if (!Array.isArray(h.days)) h.days = [false, false, false, false, false, false, false];
    if (!Array.isArray(h.hoursPerDay)) h.hoursPerDay = [0, 0, 0, 0, 0, 0, 0];

    h.days[dayIdx] = !h.days[dayIdx];
    if (h.days[dayIdx] && (!h.hoursPerDay[dayIdx] || h.hoursPerDay[dayIdx] === 0)) {
        const defaultDaily = Number(((h.targetHours || 5) / 5).toFixed(2));
        h.hoursPerDay[dayIdx] = defaultDaily;
    } else if (!h.days[dayIdx]) {
        h.hoursPerDay[dayIdx] = 0;
    }

    saveData();
    renderAll();
}

function deleteHabitByIdx(idx) {
    if (!confirm('Remover esta atividade permanentemente?')) return;
    habits.splice(idx, 1);
    saveData();
    renderAll();
}

function renderDashboardView() {
    const globalMetrics = (typeof calcWeeklyGlobalMetrics === 'function')
        ? calcWeeklyGlobalMetrics()
        : { meanFreq: 0, todayDone: 0, todayTotal: habits.length, meanElasticity: 0, totalHours: 0, maxStreak: 0 };

    const elFreq = document.getElementById('kpi-freq-mean');
    const elToday = document.getElementById('kpi-today-progress');
    const elElast = document.getElementById('kpi-elasticity');
    const elHours = document.getElementById('kpi-hours-total');
    const elStreak = document.getElementById('kpi-streak');

    if (elFreq) elFreq.textContent = `${Math.round(globalMetrics.meanFreq || 0)}%`;
    if (elToday) elToday.textContent = `${globalMetrics.todayDone || 0}/${globalMetrics.todayTotal || habits.length}`;
    if (elElast) elElast.textContent = Number(globalMetrics.meanElasticity || 0).toFixed(2);
    if (elHours) elHours.textContent = `${Number(globalMetrics.totalHours || 0).toFixed(1)}h`;
    if (elStreak) elStreak.textContent = `${globalMetrics.maxStreak || 0} dias`;

    const headerRow = document.getElementById('matrix-header-row');
    if (headerRow) {
        headerRow.innerHTML = `
            <th class="py-3 px-4">Atividade</th>
            ${weekDays.map(d => `<th class="py-3 px-2 text-center font-mono">${d}</th>`).join('')}
            <th class="py-3 px-3 text-right">Horas / Meta</th>
            <th class="py-3 px-3 text-right">Elasticidade (ε)</th>
            <th class="py-3 px-3 text-center">Ações</th>
        `;
    }

    const filtered = habits
        .map((h, idx) => ({ ...h, _idx: idx }))
        .filter(h => activeCategoryFilter === 'all' || h.category === activeCategoryFilter);

    // Cards Grid
    const cardsGrid = document.getElementById('activity-cards-grid');
    if (cardsGrid) {
        if (filtered.length === 0) {
            cardsGrid.innerHTML = `
                <div class="col-span-full bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-400">
                    Nenhuma atividade cadastrada neste filtro. Clique em <strong>+ Nova Atividade</strong> ou acesse <strong class="text-indigo-400 cursor-pointer" onclick="navigateTo('atv_fisica')">Atividade Física</strong>.
                </div>
            `;
        } else {
            cardsGrid.innerHTML = filtered.map(h => {
                const m = (typeof calcHabitMetrics === 'function') ? calcHabitMetrics(h) : { totalHours: 0, rate: 0, elasticity: 0 };
                return `
                    <div class="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-3">
                        <div class="flex items-start justify-between">
                            <div>
                                <span class="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">${h.category || 'geral'}</span>
                                <h3 class="text-sm font-bold text-white mt-1">${h.name}</h3>
                            </div>
                            <button onclick="openHabitModal(null, ${h._idx})" class="text-xs text-slate-400 hover:text-white">Editar</button>
                        </div>
                        <div class="flex items-baseline justify-between text-xs font-mono">
                            <span class="text-slate-400">Volume: <strong class="text-white">${Number(m.totalHours || 0).toFixed(1)}h</strong> / ${h.targetHours || 5}h</span>
                            <span class="text-emerald-400 font-bold">${Math.round(m.rate || 0)}%</span>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    // Matrix Tbody
    const tbody = document.getElementById('habits-tbody');
    if (tbody) {
        tbody.innerHTML = filtered.map(h => {
            const m = (typeof calcHabitMetrics === 'function') ? calcHabitMetrics(h) : { totalHours: 0, rate: 0, elasticity: 0 };
            const daysArr = Array.isArray(h.days) ? h.days : [false, false, false, false, false, false, false];
            const hoursArr = Array.isArray(h.hoursPerDay) ? h.hoursPerDay : [0, 0, 0, 0, 0, 0, 0];

            return `
                <tr class="hover:bg-slate-800/40 transition-colors">
                    <td class="py-3 px-4 font-semibold text-white">${h.name}</td>
                    ${daysArr.map((done, dIdx) => `
                        <td class="py-2.5 px-1.5 text-center">
                            <button onclick="toggleHabitDay(${h._idx},${dIdx})"
                                class="w-9 h-9 rounded-xl font-mono text-xs font-bold transition-all ${done ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800/60 text-slate-500 hover:bg-slate-800'}">
                                ${hoursArr[dIdx] ? Number(hoursArr[dIdx]).toFixed(1) : (done ? '✓' : '·')}
                            </button>
                        </td>
                    `).join('')}
                    <td class="py-3 px-3 text-right font-mono text-xs text-slate-300">${Number(m.totalHours || 0).toFixed(1)}h / ${h.targetHours || 5}h</td>
                    <td class="py-3 px-3 text-right font-mono text-xs font-bold text-indigo-400">${Number(m.elasticity || 0).toFixed(2)}</td>
                    <td class="py-3 px-3 text-center space-x-2">
                        <button onclick="openHabitModal(null, ${h._idx})" class="text-xs text-indigo-400 hover:underline">Editar</button>
                        <button onclick="deleteHabitByIdx(${h._idx})" class="text-xs text-rose-400 hover:underline">✕</button>
                    </td>
                </tr>
            `;
        }).join('');
    }
}

function renderDedicatedAtvFisicaView() {
    const container = document.getElementById('dedicated-atv-cards');
    if (container) {
        const atvHabits = habits.map((h, i) => ({ ...h, _idx: i })).filter(h => h.category === 'atv_fisica');
        container.innerHTML = atvHabits.map(h => {
            const m = (typeof calcHabitMetrics === 'function') ? calcHabitMetrics(h) : { totalHours: 0, rate: 0 };
            return `
                <div class="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div>
                        <h4 class="text-sm font-bold text-white">${h.name}</h4>
                        <span class="text-xs font-mono text-slate-400">${Number(m.totalHours || 0).toFixed(1)}h / ${h.targetHours || 5}h (${Math.round(m.rate || 0)}%)</span>
                    </div>
                    <button onclick="openHabitModal(null, ${h._idx})" class="text-xs text-indigo-400 hover:underline">Configurar</button>
                </div>
            `;
        }).join('');
    }

    // Renderiza a Planilha Interativa Upper/Lower do módulo workout.js
    if (typeof WorkoutSheetUI !== 'undefined') {
        WorkoutSheetUI.render();
    }
}

function computeSleepMetrics(entry) {
    if (!entry || !entry.bedTime || !entry.sleepTime || !entry.wakeTime || !entry.upTime) return null;
    const toMin = (str) => {
        const [h, m] = str.split(':').map(Number);
        return h * 60 + m;
    };
    const diff = (s, e) => {
        let a = toMin(s), b = toMin(e);
        if (b <= a) b += 1440;
        return b - a;
    };
    const tib = diff(entry.bedTime, entry.upTime);
    const tst = diff(entry.sleepTime, entry.wakeTime);
    if (tib <= 0) return null;
    return {
        tibHours: (tib / 60).toFixed(2),
        tstHours: (tst / 60).toFixed(2),
        efficiency: Math.min(100, Math.max(0, (tst / tib) * 100)).toFixed(1)
    };
}

function renderDedicatedSleepView() {
    const tbody = document.getElementById('dedicated-sleep-tbody');
    if (!tbody) return;

    const daysList = (typeof getCurrentWeekDays === 'function') ? getCurrentWeekDays() : weekDays.map((d, i) => ({ label: d, iso: `dia-${i}` }));
    let sumEff = 0, sumTst = 0, sumTib = 0, count = 0;

    tbody.innerHTML = daysList.map((d, idx) => {
        const key = d.iso || String(idx);
        const entry = sleepJournal[key] || sleepJournal[idx];
        const m = computeSleepMetrics(entry);
        if (m) {
            sumEff += parseFloat(m.efficiency);
            sumTst += parseFloat(m.tstHours);
            sumTib += parseFloat(m.tibHours);
            count++;
        }
        return `
            <tr class="hover:bg-slate-800/40">
                <td class="py-3 px-4 font-semibold text-white">${d.label || weekDays[idx]}</td>
                <td class="py-3 px-3 text-center font-mono text-xs text-slate-300">${entry?.bedTime || '-'}</td>
                <td class="py-3 px-3 text-center font-mono text-xs text-slate-300">${entry?.sleepTime || '-'}</td>
                <td class="py-3 px-3 text-center font-mono text-xs text-slate-300">${entry?.wakeTime || '-'}</td>
                <td class="py-3 px-3 text-center font-mono text-xs text-slate-300">${entry?.upTime || '-'}</td>
                <td class="py-3 px-3 text-center font-mono text-xs text-sky-400">${m ? m.tibHours + 'h' : '-'}</td>
                <td class="py-3 px-3 text-center font-mono text-xs font-bold text-indigo-400">${m ? m.tstHours + 'h' : '-'}</td>
                <td class="py-3 px-3 text-center font-mono text-xs font-bold text-emerald-400">${m ? m.efficiency + '%' : '-'}</td>
                <td class="py-3 px-4 text-right">
                    <button onclick="openSleepJournalModal(${idx}, '${key}')" class="text-xs font-semibold text-indigo-400 hover:underline">
                        ${entry ? 'Editar' : '+ Registrar'}
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    const elEff = document.getElementById('sleep-kpi-efficiency');
    const elTst = document.getElementById('sleep-kpi-tst');
    const elTib = document.getElementById('sleep-kpi-tib');
    if (elEff) elEff.textContent = count > 0 ? `${(sumEff / count).toFixed(1)}%` : '--%';
    if (elTst) elTst.textContent = count > 0 ? `${(sumTst / count).toFixed(1)}h` : '--h';
    if (elTib) elTib.textContent = count > 0 ? `${(sumTib / count).toFixed(1)}h` : '--h';
}

const renderSleepJournalView = renderDedicatedSleepView;

function openSleepJournalModal(dayIdx = 0, key = '') {
    const modal = document.getElementById('sleep-journal-modal');
    document.getElementById('sleep-journal-day').value = key || String(dayIdx);
    const existing = sleepJournal[key] || sleepJournal[dayIdx] || {};
    document.getElementById('sleep-bedtime-input').value = existing.bedTime || '23:30';
    document.getElementById('sleep-sleeptime-input').value = existing.sleepTime || '23:50';
    document.getElementById('sleep-waketime-input').value = existing.wakeTime || '07:10';
    document.getElementById('sleep-uptime-input').value = existing.upTime || '07:30';
    document.getElementById('sleep-quality-input').value = existing.quality || '4';
    document.getElementById('sleep-notes-input').value = existing.notes || '';
    if (modal) modal.classList.remove('hidden');
}

function closeSleepJournalModal() {
    const modal = document.getElementById('sleep-journal-modal');
    if (modal) modal.classList.add('hidden');
}

function saveSleepJournalEntry(e) {
    if (e) e.preventDefault();
    const key = document.getElementById('sleep-journal-day').value || document.getElementById('sleep-date-input').value || '0';
    sleepJournal[key] = {
        bedTime: document.getElementById('sleep-bedtime-input').value,
        sleepTime: document.getElementById('sleep-sleeptime-input').value,
        wakeTime: document.getElementById('sleep-waketime-input').value,
        upTime: document.getElementById('sleep-uptime-input').value,
        quality: document.getElementById('sleep-quality-input').value,
        notes: document.getElementById('sleep-notes-input').value
    };
    saveData();
    closeSleepJournalModal();
    renderAll();
}

function populateSelects() {
    const habitSelectIds = ['timer-habit-select', 'manual-habit-select', 'event-habit-select', 'activity-chart-target'];
    habitSelectIds.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.innerHTML = habits.map((h, i) => `<option value="${i}">${h.name}</option>`).join('');
    });

    const daySelectIds = ['timer-day-select', 'manual-day-select', 'event-day-select'];
    daySelectIds.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.innerHTML = weekDays.map((d, i) => `<option value="${i}">${d}</option>`).join('');
    });
}

function openHabitModal(defaultCategory = null, editIndex = -1) {
    const modal = document.getElementById('habit-modal');
    document.getElementById('modal-habit-index').value = editIndex;
    const nameInput = document.getElementById('modal-habit-name');
    const catInput = document.getElementById('modal-habit-category');
    const targetInput = document.getElementById('modal-habit-target-hours');

    if (editIndex >= 0 && habits[editIndex]) {
        const h = habits[editIndex];
        nameInput.value = h.name;
        catInput.value = h.category || 'atv_fisica';
        targetInput.value = h.targetHours || 6;
    } else {
        nameInput.value = '';
        catInput.value = defaultCategory || 'atv_fisica';
        targetInput.value = 6;
    }
    if (modal) modal.classList.remove('hidden');
}

function closeHabitModal() {
    const modal = document.getElementById('habit-modal');
    if (modal) modal.classList.add('hidden');
}

function onHabitCategoryChange() {
    const cat = document.getElementById('modal-habit-category')?.value;
    const bedContainer = document.getElementById('modal-bedtime-container');
    if (bedContainer) bedContainer.classList.toggle('hidden', cat !== 'sono');
}

function renderCalendarView() {
    const headerGrid = document.getElementById('calendar-header-grid');
    const hoursGrid = document.getElementById('calendar-hours-grid');
    if (!headerGrid || !hoursGrid) return;

    headerGrid.innerHTML = `<div>Hora</div>` + weekDays.map(d => `<div>${d}</div>`).join('');
    let rowsHtml = '';
    for (let h = 6; h <= 22; h++) {
        rowsHtml += `<div class="grid grid-cols-8 gap-2 py-2 items-center">
            <div class="font-mono text-center text-slate-500">${String(h).padStart(2, '0')}:00</div>
            ${weekDays.map((_, dIdx) => {
                const ev = calendarEvents.find(e => Number(e.day) === dIdx && Number(e.startHour) === h);
                if (ev) {
                    return `<div class="p-1.5 rounded-lg bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 text-[11px] flex items-center justify-between">
                        <span class="truncate">${ev.title || 'Bloco'}</span>
                        <button onclick="deleteCalEvent('${ev.id}')" class="text-rose-400 ml-1">✕</button>
                    </div>`;
                }
                return `<div onclick="openEventModal(${dIdx},${h})" class="h-7 rounded-lg hover:bg-slate-800/60 cursor-pointer"></div>`;
            }).join('')}
        </div>`;
    }
    hoursGrid.innerHTML = rowsHtml;
}

function openEventModal(dayIdx = 0, hour = 16) {
    document.getElementById('event-day-select').value = dayIdx;
    document.getElementById('event-start-hour').value = hour;
    document.getElementById('event-modal').classList.remove('hidden');
}

function closeEventModal() {
    document.getElementById('event-modal').classList.add('hidden');
}

function saveEventFromModal() {
    const hIdx = document.getElementById('event-habit-select').value;
    const day = Number(document.getElementById('event-day-select').value);
    const startHour = Number(document.getElementById('event-start-hour').value);
    const duration = Number(document.getElementById('event-duration').value) || 1;
    const title = habits[hIdx] ? habits[hIdx].name : 'Sessão';

    calendarEvents.push({ id: 'ev-' + Date.now(), title, day, startHour, duration });
    saveData();
    closeEventModal();
    renderCalendarView();
}

function deleteCalEvent(id) {
    calendarEvents = calendarEvents.filter(e => e.id !== id);
    saveData();
    renderCalendarView();
}

function saveAndOpenGoogleCal() {
    saveEventFromModal();
    window.open('https://calendar.google.com/calendar/r/eventedit', '_blank');
}

function openCloudModal() {
    document.getElementById('gist-token-input').value = SafeStorage.getItem('hq_gist_token') || '';
    document.getElementById('gist-id-input').value = SafeStorage.getItem('hq_gist_id') || '';
    document.getElementById('cloud-modal').classList.remove('hidden');
}

function closeCloudModal() {
    document.getElementById('cloud-modal').classList.add('hidden');
}

function pushToGist() {
    SafeStorage.setItem('hq_gist_token', document.getElementById('gist-token-input').value.trim());
    SafeStorage.setItem('hq_gist_id', document.getElementById('gist-id-input').value.trim());
    autoPushToGist();
    closeCloudModal();
}

function pullFromGist() {
    SafeStorage.setItem('hq_gist_token', document.getElementById('gist-token-input').value.trim());
    SafeStorage.setItem('hq_gist_id', document.getElementById('gist-id-input').value.trim());
    autoPullFromGist(() => renderAll());
    closeCloudModal();
}

function exportToCSV() {
    if (typeof WorkoutSheetUI !== 'undefined') WorkoutSheetUI.exportCSV();
}

function exportCalendarICS() {
    alert('Arquivo .ICS gerado para importação na agenda.');
}

function resetAllData() {
    if (!confirm('Resetar todos os dados locais?')) return;
    SafeStorage.removeItem(STORAGE_KEY);
    location.reload();
}

function renderAll() {
    populateSelects();
    renderDashboardView();
    renderDedicatedAtvFisicaView();
    renderDedicatedSleepView();
    renderCalendarView();
    if (typeof renderMetricsView === 'function') renderMetricsView();
    if (typeof renderProfileUI === 'function') renderProfileUI();
    refreshIcons();
}

document.addEventListener('DOMContentLoaded', () => {
    loadData();

    const habitForm = document.getElementById('habit-modal-form');
    if (habitForm) {
        habitForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const idx = Number(document.getElementById('modal-habit-index').value);
            const name = document.getElementById('modal-habit-name').value.trim();
            const category = document.getElementById('modal-habit-category').value;
            const targetHours = parseFloat(document.getElementById('modal-habit-target-hours').value) || 6;
            if (!name) return;

            if (idx >= 0 && habits[idx]) {
                habits[idx].name = name;
                habits[idx].category = category;
                habits[idx].targetHours = targetHours;
            } else {
                habits.push({
                    name,
                    category,
                    targetHours,
                    days: [false, false, false, false, false, false, false],
                    hoursPerDay: [0, 0, 0, 0, 0, 0, 0]
                });
            }
            saveData();
            closeHabitModal();
            renderAll();
        });
    }

    const manualForm = document.getElementById('manual-hours-form');
    if (manualForm) {
        manualForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const hIdx = Number(document.getElementById('manual-habit-select').value);
            const dIdx = Number(document.getElementById('manual-day-select').value);
            const hrs = parseFloat(document.getElementById('manual-hours-input').value) || 0;
            if (habits[hIdx] && hrs > 0) {
                habits[hIdx].days[dIdx] = true;
                habits[hIdx].hoursPerDay[dIdx] = Number(((habits[hIdx].hoursPerDay[dIdx] || 0) + hrs).toFixed(2));
                saveData();
                renderAll();
            }
        });
    }

    const initialRoute = (window.location.hash || '#dashboard').replace('#', '');
    applyRoute(initialRoute);

    window.addEventListener('hashchange', () => {
        applyRoute((window.location.hash || '#dashboard').replace('#', ''));
    });

    autoPullFromGist(() => renderAll());
});

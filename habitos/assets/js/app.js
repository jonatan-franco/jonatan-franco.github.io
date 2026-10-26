let activeCategoryFilter = 'atv_fisica';
let isSidebarCollapsed = (typeof SafeStorage !== 'undefined' && SafeStorage.getItem('hq_sidebar_collapsed_v1') === '1');

function refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        try { window.lucide.createIcons(); } catch (e) {}
    }
}

function applyDesktopSidebarState() {
    const sb = document.getElementById('desktop-sidebar');
    const toggleBtn = document.getElementById('sidebar-toggle-btn');
    if (!sb) return;
    sb.classList.toggle('sidebar-expanded', !isSidebarCollapsed);
    sb.classList.toggle('sidebar-collapsed', isSidebarCollapsed);
    if (toggleBtn) {
        const iconName = isSidebarCollapsed ? 'panel-left-open' : 'panel-left-close';
        toggleBtn.innerHTML = `<i data-lucide="${iconName}" id="sidebar-toggle-icon" class="w-4 h-4"></i>`;
    }
    refreshIcons();
}

window.toggleDesktopSidebar = function() {
    isSidebarCollapsed = !isSidebarCollapsed;
    if (typeof SafeStorage !== 'undefined') {
        SafeStorage.setItem('hq_sidebar_collapsed_v1', isSidebarCollapsed ? '1' : '0');
    }
    applyDesktopSidebarState();
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
    calendar:   { eyebrow: 'AGENDA',    title: 'Calendário Semanal' },
    sobre:      { eyebrow: 'GUIA & TUTORIAL', title: 'Sobre o HaQt' }
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
    if (hh > 24) { const h1 = parseInt(digits.slice(0, 1), 10); let m1 = parseInt(digits.slice(1, 2), 10); if (digits.length === 2) { el.value = `0${h1}:${m1}`; return; } let m2 = parseInt(digits.slice(2, 3), 10); if (m1 > 5) m1 = 5; el.value = `0${h1}:${m1}${isNaN(m2) ? '' : m2}`; return; }
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
        const f2 = parseInt(digits.slice(0, 2), 10); if (f2 > 24) { hh = parseInt(digits.slice(0, 1), 10); mm = parseInt(digits.slice(1, 3), 10); } else { hh = f2; mm = parseInt(digits.slice(2, 3), 10) * 10; }
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

let selectedSleepRegDate = (typeof getLocalISODate === 'function') ? getLocalISODate() : formatLocalISO(new Date());
let sleepHistoryFilterMode = 'today'; // 'today' | 'yesterday' | '15d' | '30d' | 'custom'
let selectedSleepHistoryDate = selectedSleepRegDate;
let isSleepRegInitialized = false;

function getWeekdayShortFromIso(isoStr) {
    if (!isoStr) return '';
    const d = new Date(isoStr + 'T12:00:00');
    if (isNaN(d.getTime())) return '';
    const names = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return names[d.getDay()] || '';
}

function formatSleepDateDisplay(isoStr) {
    if (!isoStr || typeof isoStr !== 'string') return '';
    const parts = isoStr.split('-');
    if (parts.length !== 3) return isoStr;
    const ddmmyyyy = `${parts[2]}-${parts[1]}-${parts[0]}`;
    const wd = getWeekdayShortFromIso(isoStr);
    return wd ? `${ddmmyyyy} (${wd})` : ddmmyyyy;
}

function syncSleepHabitFromJournal(iso) {
    const dayIdx = weekDays.findIndex(d => d.iso === iso);
    const sleepHabit = habits.find(h => h.category === 'sono');
    if (!sleepHabit || dayIdx === -1) return;
    const entry = sleepJournal[iso];
    if (entry && entry.bed && entry.bed !== '—') {
        const { bedH, sleptH } = calcSleepJournalEntry(entry);
        if (Array.isArray(sleepHabit.dailyHours)) sleepHabit.dailyHours[dayIdx] = parseFloat(sleptH.toFixed(2));
        if (Array.isArray(sleepHabit.bedtimeHours)) sleepHabit.bedtimeHours[dayIdx] = parseFloat(bedH.toFixed(2));
        if (Array.isArray(sleepHabit.checks)) sleepHabit.checks[dayIdx] = sleptH > 0;
    } else {
        if (Array.isArray(sleepHabit.dailyHours)) sleepHabit.dailyHours[dayIdx] = 0;
        if (Array.isArray(sleepHabit.bedtimeHours)) sleepHabit.bedtimeHours[dayIdx] = 0;
        if (Array.isArray(sleepHabit.checks)) sleepHabit.checks[dayIdx] = false;
    }
}

window.updateInlineSleepPreview = function() {
    const bed = normalizeSleepTimeValue(document.getElementById('sleep-reg-bed')?.value || '');
    const slept = normalizeSleepTimeValue(document.getElementById('sleep-reg-slept')?.value || '');
    const wake = normalizeSleepTimeValue(document.getElementById('sleep-reg-wake')?.value || '');
    const getup = normalizeSleepTimeValue(document.getElementById('sleep-reg-getup')?.value || '');
    const previewEl = document.getElementById('sleep-reg-preview');
    if (!previewEl) return;

    if (!bed || !slept || !wake || !getup) {
        previewEl.innerHTML = `<span class="text-zinc-400">Preencha os 4 horários acima (HH:MM)</span>`;
        return;
    }
    const { bedH, sleptH, eff } = calcSleepJournalEntry({ bed, slept, wake, getup });
    previewEl.innerHTML = `
        <span class="px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-700 font-semibold">Cama: ${bedH > 0 ? bedH.toFixed(1) + 'h' : '—'}</span>
        <span class="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 font-semibold">Dormido: ${sleptH > 0 ? sleptH.toFixed(1) + 'h' : '—'}</span>
        <span class="px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 font-semibold">Eficiência: ${eff > 0 ? eff.toFixed(0) + '%' : '—'}</span>
    `;
};

function syncSleepRegUI(forceLoadFields = false) {
    const todayIso = (typeof getLocalISODate === 'function') ? getLocalISODate() : formatLocalISO(new Date());
    const yesterdayIso = (typeof getYesterdayISODate === 'function') ? getYesterdayISODate() : (() => { const d = new Date(); d.setDate(d.getDate() - 1); return formatLocalISO(d); })();

    const datePicker = document.getElementById('sleep-reg-date');
    if (datePicker && datePicker.value !== selectedSleepRegDate) {
        datePicker.value = selectedSleepRegDate;
    }

    const activeBtnCls = "px-3 py-1.5 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold shadow-xs transition";
    const inactiveBtnCls = "px-3 py-1.5 bg-white border border-zinc-200 text-zinc-700 hover:text-black rounded-xl text-xs font-semibold shadow-xs transition";

    const btnToday = document.getElementById('btn-sleep-reg-today');
    const btnYesterday = document.getElementById('btn-sleep-reg-yesterday');
    if (btnToday) btnToday.className = selectedSleepRegDate === todayIso ? activeBtnCls : inactiveBtnCls;
    if (btnYesterday) btnYesterday.className = selectedSleepRegDate === yesterdayIso ? activeBtnCls : inactiveBtnCls;

    const existing = sleepJournal[selectedSleepRegDate];
    const hasRecord = Boolean(existing && existing.bed && existing.bed !== '—');
    const statusBadge = document.getElementById('sleep-reg-status-badge');
    if (statusBadge) {
        statusBadge.textContent = hasRecord
            ? `✓ Registro existente em ${formatSleepDateDisplay(selectedSleepRegDate)}`
            : `Novo registro para ${formatSleepDateDisplay(selectedSleepRegDate)}`;
        statusBadge.className = hasRecord
            ? "text-[11px] font-mono text-emerald-600 font-semibold"
            : "text-[11px] font-mono text-zinc-500";
    }

    if (forceLoadFields || !isSleepRegInitialized) {
        isSleepRegInitialized = true;
        const bedEl = document.getElementById('sleep-reg-bed');
        const sleptEl = document.getElementById('sleep-reg-slept');
        const wakeEl = document.getElementById('sleep-reg-wake');
        const getupEl = document.getElementById('sleep-reg-getup');
        if (hasRecord) {
            if (bedEl) bedEl.value = existing.bed;
            if (sleptEl) sleptEl.value = existing.slept || '23:30';
            if (wakeEl) wakeEl.value = existing.wake || '07:00';
            if (getupEl) getupEl.value = existing.getup || '07:30';
        } else {
            if (bedEl) bedEl.value = '23:00';
            if (sleptEl) sleptEl.value = '23:30';
            if (wakeEl) wakeEl.value = '07:00';
            if (getupEl) getupEl.value = '07:30';
        }
    }
    window.updateInlineSleepPreview();
}

window.setSleepRegDate = function(dateStr) {
    if (!dateStr) return;
    selectedSleepRegDate = dateStr;
    syncSleepRegUI(true);
};

window.setSleepRegQuickDate = function(which) {
    const todayIso = (typeof getLocalISODate === 'function') ? getLocalISODate() : formatLocalISO(new Date());
    const yesterdayIso = (typeof getYesterdayISODate === 'function') ? getYesterdayISODate() : (() => { const d = new Date(); d.setDate(d.getDate() - 1); return formatLocalISO(d); })();
    selectedSleepRegDate = which === 'yesterday' ? yesterdayIso : todayIso;
    syncSleepRegUI(true);
};

window.submitInlineSleepForm = function(ev) {
    if (ev) ev.preventDefault();
    const iso = document.getElementById('sleep-reg-date')?.value || selectedSleepRegDate;
    const bed = normalizeSleepTimeValue(document.getElementById('sleep-reg-bed')?.value || '');
    const slept = normalizeSleepTimeValue(document.getElementById('sleep-reg-slept')?.value || '');
    const wake = normalizeSleepTimeValue(document.getElementById('sleep-reg-wake')?.value || '');
    const getup = normalizeSleepTimeValue(document.getElementById('sleep-reg-getup')?.value || '');
    if (!iso || !bed || !slept || !wake || !getup) return;

    selectedSleepRegDate = iso;
    sleepJournal[iso] = { bed, slept, wake, getup };
    syncSleepHabitFromJournal(iso);
    saveData();
    syncSleepRegUI(true);
};

window.setSleepHistoryFilter = function(mode) {
    const todayIso = (typeof getLocalISODate === 'function') ? getLocalISODate() : formatLocalISO(new Date());
    const yesterdayIso = (typeof getYesterdayISODate === 'function') ? getYesterdayISODate() : (() => { const d = new Date(); d.setDate(d.getDate() - 1); return formatLocalISO(d); })();
    sleepHistoryFilterMode = mode;
    if (mode === 'today') {
        selectedSleepHistoryDate = todayIso;
    } else if (mode === 'yesterday') {
        selectedSleepHistoryDate = yesterdayIso;
    }
    renderDedicatedSleepView();
};

window.setSleepHistoryCustomDate = function(dateStr) {
    if (!dateStr) return;
    const todayIso = (typeof getLocalISODate === 'function') ? getLocalISODate() : formatLocalISO(new Date());
    const yesterdayIso = (typeof getYesterdayISODate === 'function') ? getYesterdayISODate() : (() => { const d = new Date(); d.setDate(d.getDate() - 1); return formatLocalISO(d); })();
    selectedSleepHistoryDate = dateStr;
    if (dateStr === todayIso) {
        sleepHistoryFilterMode = 'today';
    } else if (dateStr === yesterdayIso) {
        sleepHistoryFilterMode = 'yesterday';
    } else {
        sleepHistoryFilterMode = 'custom';
    }
    renderDedicatedSleepView();
};

function buildSleepRecordRowHTML(isoStr, rowPaddingClass = 'py-3') {
    const entry = sleepJournal[isoStr] || { bed: '—', slept: '—', wake: '—', getup: '—' };
    const hasRecord = Boolean(sleepJournal[isoStr] && sleepJournal[isoStr].bed && sleepJournal[isoStr].bed !== '—');
    const { bedH, sleptH, eff } = calcSleepJournalEntry(sleepJournal[isoStr]);

    const delBtnHTML = hasRecord
        ? `<button type="button" onclick="deleteSleepJournalEntry('${isoStr}')" title="Excluir registro" class="p-1.5 text-rose-500 hover:text-rose-700 transition">🗑️</button>`
        : `<button type="button" disabled title="Sem registro para excluir" class="p-1.5 text-zinc-300 cursor-not-allowed">🗑️</button>`;

    return `
        <tr class="hover:bg-zinc-50 transition border-b border-zinc-100">
            <td class="${rowPaddingClass} px-3 font-mono text-[11px] font-semibold text-zinc-800 whitespace-nowrap">${formatSleepDateDisplay(isoStr)}</td>
            <td class="${rowPaddingClass} px-3 text-center font-mono">${entry.bed}</td>
            <td class="${rowPaddingClass} px-3 text-center font-mono">${entry.slept}</td>
            <td class="${rowPaddingClass} px-3 text-center font-mono">${entry.wake}</td>
            <td class="${rowPaddingClass} px-3 text-center font-mono">${entry.getup}</td>
            <td class="${rowPaddingClass} px-3 text-center font-mono font-bold text-indigo-600">${bedH > 0 ? bedH.toFixed(1) + 'h' : '—'}</td>
            <td class="${rowPaddingClass} px-3 text-center font-mono font-bold text-emerald-600">${sleptH > 0 ? sleptH.toFixed(1) + 'h' : '—'}</td>
            <td class="${rowPaddingClass} px-3 text-center font-mono font-bold text-purple-600">${eff > 0 ? eff.toFixed(0) + '%' : '—'}</td>
            <td class="${rowPaddingClass} px-3 text-right whitespace-nowrap">
                <button type="button" onclick="openSleepJournalModal('${isoStr}')" title="Editar horário" class="p-1.5 text-zinc-600 hover:text-black transition">✏️</button>
                ${delBtnHTML}
            </td>
        </tr>`;
}

function renderSleepJournalView() {
    const tbody = document.getElementById('sleep-journal-tbody');
    if (!tbody) return;
    tbody.innerHTML = weekDays.map(d => buildSleepRecordRowHTML(d.iso, 'py-2.5')).join('');
}

function renderDedicatedSleepView() {
    syncSleepRegUI(false);

    const tbody = document.getElementById('dedicated-sleep-tbody');
    if (!tbody) return;

    const todayIso = (typeof getLocalISODate === 'function') ? getLocalISODate() : formatLocalISO(new Date());
    const yesterdayIso = (typeof getYesterdayISODate === 'function') ? getYesterdayISODate() : (() => { const d = new Date(); d.setDate(d.getDate() - 1); return formatLocalISO(d); })();

    const histPicker = document.getElementById('sleep-history-date-picker');
    if (histPicker && histPicker.value !== selectedSleepHistoryDate) {
        histPicker.value = selectedSleepHistoryDate;
    }

    const activeBtnCls = "px-3 py-1.5 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold shadow-xs transition";
    const inactiveBtnCls = "px-3 py-1.5 bg-white border border-zinc-200 text-zinc-700 hover:text-black rounded-xl text-xs font-semibold shadow-xs transition";

    const btnToday = document.getElementById('btn-sleep-hist-today');
    const btnYesterday = document.getElementById('btn-sleep-hist-yesterday');
    const btn15d = document.getElementById('btn-sleep-hist-15d');
    const btn30d = document.getElementById('btn-sleep-hist-30d');

    if (btnToday) btnToday.className = sleepHistoryFilterMode === 'today' ? activeBtnCls : inactiveBtnCls;
    if (btnYesterday) btnYesterday.className = sleepHistoryFilterMode === 'yesterday' ? activeBtnCls : inactiveBtnCls;
    if (btn15d) btn15d.className = sleepHistoryFilterMode === '15d' ? activeBtnCls : inactiveBtnCls;
    if (btn30d) btn30d.className = sleepHistoryFilterMode === '30d' ? activeBtnCls : inactiveBtnCls;

    const titleEl = document.getElementById('sleep-history-title');
    const summaryEl = document.getElementById('sleep-history-summary');

    const allValidDatesDesc = Object.keys(sleepJournal || {}).filter(k => {
        const e = sleepJournal[k];
        if (!e || !e.bed || e.bed === '—') return false;
        const { sleptH } = calcSleepJournalEntry(e);
        return sleptH > 0;
    }).sort((a, b) => b.localeCompare(a));

    if (sleepHistoryFilterMode === '15d' || sleepHistoryFilterMode === '30d') {
        const daysSpan = sleepHistoryFilterMode === '15d' ? 15 : 30;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - (daysSpan - 1));
        const cutoffIso = formatLocalISO(cutoffDate);

        const filteredDates = allValidDatesDesc.filter(d => d >= cutoffIso && d <= todayIso);
        if (titleEl) titleEl.textContent = `Registros de Sono (Últimos ${daysSpan} dias)`;

        if (summaryEl) {
            if (filteredDates.length > 0) {
                let sumBed = 0, sumSlept = 0, sumEff = 0;
                filteredDates.forEach(d => {
                    const c = calcSleepJournalEntry(sleepJournal[d]);
                    sumBed += c.bedH;
                    sumSlept += c.sleptH;
                    sumEff += c.eff;
                });
                const avgBed = sumBed / filteredDates.length;
                const avgSlept = sumSlept / filteredDates.length;
                const esmPct = avgBed > 0 ? (avgSlept / avgBed) * 100 : (sumEff / filteredDates.length);
                const periodRvs = (typeof calcSleepRVS === 'function')
                    ? calcSleepRVS(
                        filteredDates.map(d => calcSleepJournalEntry(sleepJournal[d]).sleptH),
                        filteredDates.map(d => calcSleepJournalEntry(sleepJournal[d]).bedH)
                    )
                    : { valid: false, rvs: null, betaW: null };
                const rvsBadgeTxt = periodRvs.valid ? periodRvs.rvs.toFixed(2) : '—';
                const betaWBadgeTxt = periodRvs.valid ? periodRvs.betaW.toFixed(2) : '—';
                summaryEl.classList.remove('hidden');
                summaryEl.classList.add('flex');
                summaryEl.innerHTML = `
                    <span class="px-2.5 py-1 rounded-xl bg-zinc-100 text-zinc-800 font-semibold">${filteredDates.length} noite(s) registrada(s)</span>
                    <span class="px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-700 font-semibold">Média Cama: ${avgBed.toFixed(1)}h</span>
                    <span class="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 font-semibold">Média Dormida: ${avgSlept.toFixed(1)}h</span>
                    <span class="px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 font-semibold">ESM: ${esmPct.toFixed(0)}%</span>
                    <span class="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 font-semibold">ρ<sub>RVS</sub>: ${rvsBadgeTxt} • β<sub>W</sub>: ${betaWBadgeTxt}</span>
                `;
            } else {
                summaryEl.classList.add('hidden');
                summaryEl.classList.remove('flex');
            }
        }

        if (filteredDates.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" class="py-8 text-center text-zinc-400 text-xs">Nenhum registro de sono encontrado nos últimos ${daysSpan} dias.</td></tr>`;
        } else {
            tbody.innerHTML = filteredDates.map(iso => buildSleepRecordRowHTML(iso, 'py-3')).join('');
        }
    } else {
        // Modos: 'today' | 'yesterday' | 'custom'
        const targetDate = sleepHistoryFilterMode === 'today' ? todayIso
            : sleepHistoryFilterMode === 'yesterday' ? yesterdayIso
            : selectedSleepHistoryDate;

        if (titleEl) {
            titleEl.textContent = `Registros de Sono (${formatSleepDateDisplay(targetDate)})`;
        }
        if (summaryEl) {
            summaryEl.classList.add('hidden');
            summaryEl.classList.remove('flex');
        }

        const hasTargetRecord = allValidDatesDesc.includes(targetDate);
        let rowsHTML = '';
        if (hasTargetRecord) {
            rowsHTML += buildSleepRecordRowHTML(targetDate, 'py-3');
        }

        // Quando "Hoje" estiver selecionado, exibe também os últimos registros de sono anteriores
        let previousRowsHTML = '';
        if (sleepHistoryFilterMode === 'today') {
            const prevDates = allValidDatesDesc.filter(d => d < todayIso).slice(0, 10);
            if (prevDates.length > 0) {
                previousRowsHTML = prevDates.map(d => buildSleepRecordRowHTML(d, 'py-3')).join('');
            }
        }

        if (!hasTargetRecord && !previousRowsHTML) {
            tbody.innerHTML = `<tr><td colspan="9" class="py-8 text-center text-zinc-400 text-xs">Nenhum registro de sono nesta data (${formatSleepDateDisplay(targetDate)}).<br>Utilize o registrador acima para lançar os horários deste dia.</td></tr>`;
        } else if (!hasTargetRecord && previousRowsHTML) {
            tbody.innerHTML = `
                <tr><td colspan="9" class="py-4 text-center text-zinc-400 text-xs border-b border-zinc-100">Nenhum registro de sono hoje (${formatSleepDateDisplay(targetDate)}). Abaixo estão os últimos registros anteriores:</td></tr>
                <tr class="bg-zinc-50/90 border-b border-zinc-200">
                    <td colspan="9" class="py-2 px-3 text-[10px] font-mono uppercase tracking-wider font-bold text-zinc-500">🕒 Últimos Registros de Sono (Dias Anteriores)</td>
                </tr>
                ${previousRowsHTML}`;
        } else if (previousRowsHTML) {
            tbody.innerHTML = `
                ${rowsHTML}
                <tr class="bg-zinc-50/90 border-b border-zinc-200">
                    <td colspan="9" class="py-2 px-3 text-[10px] font-mono uppercase tracking-wider font-bold text-zinc-500">🕒 Últimos Registros de Sono (Dias Anteriores)</td>
                </tr>
                ${previousRowsHTML}`;
        } else {
            tbody.innerHTML = rowsHTML;
        }
    }
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
    const dayInput = document.getElementById('sleep-journal-day');
    const defaultIso = targetIso || selectedSleepHistoryDate || (weekDays[todayIndex !== -1 ? todayIndex : 0] || weekDays[0]).iso;
    if (dayInput) {
        dayInput.value = defaultIso;
    }
    window.onSleepJournalDayChange(defaultIso);
    const m = document.getElementById('sleep-journal-modal');
    if (m) { m.classList.remove('hidden'); m.classList.add('flex'); }
};

window.deleteSleepJournalEntry = function(iso) {
    if (!iso || !sleepJournal[iso]) return;
    if (confirm('Deseja excluir o registro de sono deste dia?')) {
        delete sleepJournal[iso];
        syncSleepHabitFromJournal(iso);
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
            if (sleepEffAggrEl) sleepEffAggrEl.textContent = `ESM: ${s.efficiency.toFixed(0)}%`;
            if (sleepEffMeanEl) sleepEffMeanEl.textContent = `μ(E): ${s.meanDailyEfficiency.toFixed(0)}%`;
            if (sleepSensEl) {
                const rvsStr = (s.rvs !== null && s.rvs !== undefined && !isNaN(s.rvs)) ? s.rvs.toFixed(2) : '—';
                const betaWStr = (s.betaW !== null && s.betaW !== undefined && !isNaN(s.betaW)) ? s.betaW.toFixed(2) : '—';
                sleepSensEl.innerHTML = `ρ<sub>RVS</sub> ${rvsStr} • β<sub>W</sub> ${betaWStr}`;
            }
            const rvsTipEl = document.getElementById('kpi-sleep-rvs-tooltip');
            if (rvsTipEl && s.rvsData && s.rvsData.valid) {
                rvsTipEl.innerHTML = `Var(TIB): ${s.rvsData.varTIB.toFixed(3)} • Var(TST): ${s.rvsData.varTST.toFixed(3)} • Var(W): ${s.rvsData.varW.toFixed(3)} • Cov(TIB,W): ${s.rvsData.covTIBW.toFixed(3)}<br><strong class="text-indigo-300">ρ (RVS) = ${s.rvs.toFixed(2)}</strong> &nbsp;|&nbsp; <strong class="text-emerald-300">β<sub>W</sub> = ${s.betaW.toFixed(2)}</strong> (β<sub>TST</sub> = ${s.betaTST.toFixed(2)})`;
            }
        } else {
            sleepMeanEl.textContent = '—';
            if (sleepSdEl) sleepSdEl.textContent = '± —';
            if (sleepBedEl) sleepBedEl.textContent = 'Tempo de cama: —';
            if (sleepEffAggrEl) sleepEffAggrEl.textContent = 'ESM: —';
            if (sleepEffMeanEl) sleepEffMeanEl.textContent = 'μ(E): —';
            if (sleepSensEl) sleepSensEl.innerHTML = 'ρ<sub>RVS</sub> — • β<sub>W</sub> —';
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
        captionEl.textContent = activeCategoryFilter === 'atv_fisica'
            ? 'Atividade Física baseada no registro de treinos'
            : 'Sono baseado nas horas dormidas registradas';
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
    let csv = "data:text/csv;charset=utf-8,habit_id,habit_name,category,target_hours_week,total_hours_week,mean_hours_day,sd_hours_week,freq_pct,sensitivity_deriv,rvs_rho,beta_w,day_of_week,date_iso,completed,hours_day\n";
    habits.forEach(h => {
        const m = calcHabitMetrics(h), cleanName = `"${h.name.replace(/"/g, '""')}"`;
        const rvsVal = (m.rvs !== null && m.rvs !== undefined && !isNaN(m.rvs)) ? m.rvs.toFixed(3) : '';
        const betaWVal = (m.betaW !== null && m.betaW !== undefined && !isNaN(m.betaW)) ? m.betaW.toFixed(3) : '';
        weekDays.forEach((day, dIdx) => {
            csv += `${h.id},${cleanName},${h.category},${h.targetHours},${m.totalHours.toFixed(2)},${m.meanHours.toFixed(2)},${m.sdHours.toFixed(2)},${m.freqPct.toFixed(1)},${m.sensitivityDerivative.toFixed(2)},${rvsVal},${betaWVal},${day.shortName},${day.iso},${h.checks[dIdx] ? 1 : 0},${h.dailyHours[dIdx] || 0}\n`;
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
    if (current === 'sobre') {
        if (typeof initSobreSimulators === 'function') initSobreSimulators();
    }
    refreshIcons();
}

window.addEventListener('DOMContentLoaded', () => {
    isSidebarCollapsed = (typeof SafeStorage !== 'undefined' && SafeStorage.getItem('hq_sidebar_collapsed_v1') === '1');
    applyDesktopSidebarState();
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
            syncSleepHabitFromJournal(iso);
            saveData();
            if (iso === selectedSleepRegDate) syncSleepRegUI(true);
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


// ============================================================================
// GUIA & TUTORIAL DIDÁTICO INTERATIVO — SOBRE O HAQT
// ============================================================================
let sobreActiveTab = 'sono';
let sobreCardioMode = 'mixed';

window.setSobreTab = function(tabId) {
    sobreActiveTab = tabId;
    const tabs = ['sono', 'forca', 'cardio', 'timer', 'nuvem', 'tutorial'];
    tabs.forEach(t => {
        const btn = document.getElementById('btn-sobre-tab-' + t);
        const panel = document.getElementById('sobre-panel-' + t);
        const isActive = t === tabId;
        if (btn) {
            btn.className = isActive
                ? "sobre-tab-btn px-4 py-2 rounded-full bg-white text-zinc-900 font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 shrink-0"
                : "sobre-tab-btn px-4 py-2 rounded-full text-zinc-600 hover:text-zinc-900 hover:bg-white/50 font-medium text-xs transition-all flex items-center gap-1.5 shrink-0";
        }
        if (panel) {
            panel.classList.toggle('hidden', !isActive);
        }
    });
    refreshIcons();
};

function parseTimeToMinutes(str) {
    if (!str) return 0;
    const [hh, mm] = str.split(':').map(Number);
    return ((hh || 0) * 60) + (mm || 0);
}

window.updateSobreSleepSim = function() {
    const bedStr = document.getElementById('sim-sleep-bed')?.value || '23:00';
    const sleptStr = document.getElementById('sim-sleep-slept')?.value || '23:30';
    const wakeStr = document.getElementById('sim-sleep-wake')?.value || '07:00';
    const getupStr = document.getElementById('sim-sleep-getup')?.value || '07:30';

    const bedMin = parseTimeToMinutes(bedStr);
    const sleptMin = parseTimeToMinutes(sleptStr);
    const wakeMin = parseTimeToMinutes(wakeStr);
    const getupMin = parseTimeToMinutes(getupStr);

    let tibMin = getupMin - bedMin;
    if (tibMin < 0) tibMin += 24 * 60;

    let tstMin = wakeMin - sleptMin;
    if (tstMin < 0) tstMin += 24 * 60;

    const wMin = Math.max(0, tibMin - tstMin);
    const eff = tibMin > 0 ? (tstMin / tibMin) * 100 : 0;

    // Métricas longitudinais reais calculadas sobre os dados de sono da semana
    const sleepHabit = (typeof state !== 'undefined' && state.habits)
        ? state.habits.find(h => h.category === 'sono')
        : null;
    let liveRvsData = null;
    if (sleepHabit && Array.isArray(sleepHabit.dailyHours) && Array.isArray(sleepHabit.bedtimeHours)) {
        liveRvsData = (typeof calcSleepRVS === 'function')
            ? calcSleepRVS(sleepHabit.dailyHours, sleepHabit.bedtimeHours)
            : null;
    }

    // β_W é o coeficiente angular de regressão: Cov(TIB, W) / Var(W)
    // ρ_RVS é a razão de variabilidade do sono: sqrt(Var(TST) / Var(TIB))
    let betaWVal = '1.08';
    let rvsVal = '0.78';
    if (liveRvsData && liveRvsData.valid && liveRvsData.betaW !== null) {
        betaWVal = liveRvsData.betaW.toFixed(2);
        rvsVal = liveRvsData.rvs.toFixed(2);
    } else {
        if (eff >= 85) {
            betaWVal = '1.04';
            rvsVal = '0.78';
        } else if (eff < 75) {
            betaWVal = '1.68';
            rvsVal = '1.42';
        } else {
            betaWVal = '1.18';
            rvsVal = '0.94';
        }
    }

    const elTib = document.getElementById('sim-sleep-res-tib');
    const elTst = document.getElementById('sim-sleep-res-tst');
    const elW = document.getElementById('sim-sleep-res-w');
    const elEff = document.getElementById('sim-sleep-res-eff');
    const elBeta = document.getElementById('sim-sleep-res-beta');
    const elRvs = document.getElementById('sim-sleep-res-rvs');
    const elDiag = document.getElementById('sim-sleep-diagnostic-text');

    if (elTib) elTib.textContent = `${(tibMin / 60).toFixed(1)}h`;
    if (elTst) elTst.textContent = `${(tstMin / 60).toFixed(1)}h`;
    if (elW) elW.textContent = `${(wMin / 60).toFixed(1)}h (${Math.round(wMin)}m)`;
    if (elEff) elEff.textContent = `${eff.toFixed(1)}%`;
    if (elBeta) elBeta.textContent = betaWVal;
    if (elRvs) elRvs.textContent = rvsVal;

    if (elDiag) {
        if (eff >= 85) {
            elDiag.innerHTML = `<strong class="text-emerald-700">🌟 Eficiência de Sono Excelente (${eff.toFixed(1)}%)!</strong> Acima do limiar clínico padrão (≥ 85%). O tempo de vigília no leito foi de apenas <strong>${Math.round(wMin)} min</strong>. Em modelos longitudinais, a estabilidade circadiana é preservada quando o coeficiente angular de regressão <span class="font-mono font-bold text-purple-700">β<sub>W</sub></span> se mantém próximo de 1, evitando estender excessivamente o leito para compensar vigília.`;
        } else if (eff < 80) {
            elDiag.innerHTML = `<strong class="text-amber-700">⚠️ Eficiência Reduzida (${eff.toFixed(1)}%).</strong> Você está passando <strong>${(wMin / 60).toFixed(1)}h acordado na cama</strong> (${Math.round(wMin)} min em vigília). Em TCC-I (Terapia Cognitivo-Comportamental para Insônia), a conduta indicada é a <em>restrição de tempo de leito</em> para consolidar o sono e manter o coeficiente de regressão <span class="font-mono font-bold text-purple-700">β<sub>W</sub> = Cov(TIB,W)/Var(W)</span> sob controle.`;
        } else {
            elDiag.innerHTML = `<strong class="text-indigo-700">✓ Padrão Estável (${eff.toFixed(1)}%).</strong> Eficiência dentro da faixa de normalidade clínica (${eff.toFixed(1)}%), com vigília e transições de sono controladas.`;
        }
    }
};

window.setSobreSleepPreset = function(preset) {
    const bed = document.getElementById('sim-sleep-bed');
    const slept = document.getElementById('sim-sleep-slept');
    const wake = document.getElementById('sim-sleep-wake');
    const getup = document.getElementById('sim-sleep-getup');

    if (preset === 'otimo') {
        if (bed) bed.value = '23:00';
        if (slept) slept.value = '23:30';
        if (wake) wake.value = '07:00';
        if (getup) getup.value = '07:30';
    } else if (preset === 'insonia') {
        if (bed) bed.value = '22:30';
        if (slept) slept.value = '00:30';
        if (wake) wake.value = '06:30';
        if (getup) getup.value = '07:30';
    } else if (preset === 'precoce') {
        if (bed) bed.value = '23:00';
        if (slept) slept.value = '23:15';
        if (wake) wake.value = '05:00';
        if (getup) getup.value = '07:00';
    }
    window.updateSobreSleepSim();
};

window.updateSobreForceSim = function() {
    const loadEl = document.getElementById('sim-force-load');
    const repsEl = document.getElementById('sim-force-reps');
    const setsEl = document.getElementById('sim-force-sets');

    const load = parseFloat(loadEl?.value || '80');
    const reps = parseInt(repsEl?.value || '8', 10);
    const sets = parseInt(setsEl?.value || '4', 10);

    const lblLoad = document.getElementById('sim-force-load-val');
    const lblReps = document.getElementById('sim-force-reps-val');
    const lblSets = document.getElementById('sim-force-sets-val');

    if (lblLoad) lblLoad.textContent = `${load.toFixed(1).replace('.0', '')} kg`;
    if (lblReps) lblReps.textContent = `${reps} reps`;
    if (lblSets) lblSets.textContent = `${sets} séries`;

    const oneRm = load * (1 + reps / 30);
    const totalVol = sets * reps * load;
    const load10rm = oneRm / (1 + 10 / 30);

    const res1rm = document.getElementById('sim-force-res-1rm');
    const resVol = document.getElementById('sim-force-res-vol');
    const res10rm = document.getElementById('sim-force-res-10rm');

    if (res1rm) res1rm.textContent = `${oneRm.toFixed(1)} kg`;
    if (resVol) resVol.textContent = `${Math.round(totalVol).toLocaleString('pt-BR')} kg`;
    if (res10rm) res10rm.textContent = `${load10rm.toFixed(1)} kg`;
};

window.setSobreCardioMode = function(mode) {
    sobreCardioMode = mode === 'simple' ? 'simple' : 'mixed';

    const btnSimple = document.getElementById('btn-sobre-cardio-simple');
    const btnMixed = document.getElementById('btn-sobre-cardio-mixed');
    const walkGroup = document.getElementById('sim-cardio-walk-group');
    const ratioGroup = document.getElementById('sim-cardio-ratio-group');
    const barCont = document.getElementById('sim-cardio-bar-container');
    const lblSpeed = document.getElementById('sim-cardio-speed-label');
    const subSpeed = document.getElementById('sim-cardio-res-speed-sub');

    if (sobreCardioMode === 'simple') {
        if (btnSimple) btnSimple.className = "px-3 py-1.5 rounded-xl bg-black text-white text-xs font-bold transition";
        if (btnMixed) btnMixed.className = "px-3 py-1.5 rounded-xl bg-white border border-zinc-200 text-zinc-700 text-xs font-semibold transition";
        if (walkGroup) walkGroup.classList.add('hidden');
        if (ratioGroup) ratioGroup.classList.add('hidden');
        if (barCont) barCont.classList.add('hidden');
        if (lblSpeed) lblSpeed.textContent = "Velocidade Contínua (km/h)";
        if (subSpeed) subSpeed.textContent = "Ritmo contínuo sem transições";
    } else {
        if (btnSimple) btnSimple.className = "px-3 py-1.5 rounded-xl bg-white border border-zinc-200 text-zinc-700 text-xs font-semibold transition";
        if (btnMixed) btnMixed.className = "px-3 py-1.5 rounded-xl bg-black text-white text-xs font-bold transition";
        if (walkGroup) walkGroup.classList.remove('hidden');
        if (ratioGroup) ratioGroup.classList.remove('hidden');
        if (barCont) barCont.classList.remove('hidden');
        if (lblSpeed) lblSpeed.textContent = "Velocidade Corrida (km/h)";
        if (subSpeed) subSpeed.textContent = "Com correção biomecânica η = 0,96";
    }
    window.updateSobreCardioSim();
};

window.updateSobreCardioSim = function() {
    const speed = parseFloat(document.getElementById('sim-cardio-speed')?.value || '10.0');
    const walk = parseFloat(document.getElementById('sim-cardio-walk')?.value || '5.5');
    const ratio = parseInt(document.getElementById('sim-cardio-ratio')?.value || '60', 10);
    const dur = parseInt(document.getElementById('sim-cardio-dur')?.value || '30', 10);

    const lblSpeed = document.getElementById('sim-cardio-speed-val');
    const lblWalk = document.getElementById('sim-cardio-walk-val');
    const lblRatio = document.getElementById('sim-cardio-ratio-val');
    const lblDur = document.getElementById('sim-cardio-dur-val');

    if (lblSpeed) lblSpeed.textContent = `${speed.toFixed(1)} km/h`;
    if (lblWalk) lblWalk.textContent = `${walk.toFixed(1)} km/h`;
    if (lblRatio) lblRatio.textContent = `${ratio}%`;
    if (lblDur) lblDur.textContent = `${dur} min`;

    let effSpeed = speed;
    if (sobreCardioMode === 'mixed') {
        const pRun = ratio / 100;
        const pWalk = 1 - pRun;
        effSpeed = (pRun * speed + pWalk * walk) * 0.96;

        const runMin = Math.round(dur * pRun);
        const walkMin = Math.max(0, dur - runMin);

        const txtRun = document.getElementById('sim-cardio-run-min-text');
        const txtWalk = document.getElementById('sim-cardio-walk-min-text');
        const barRun = document.getElementById('sim-cardio-run-bar');
        const barWalk = document.getElementById('sim-cardio-walk-bar');

        if (txtRun) txtRun.textContent = `${runMin} min`;
        if (txtWalk) txtWalk.textContent = `${walkMin} min`;
        if (barRun) barRun.style.width = `${ratio}%`;
        if (barWalk) barWalk.style.width = `${100 - ratio}%`;
    }

    const distKm = (effSpeed * dur) / 60;
    const paceDecimal = effSpeed > 0 ? (60 / effSpeed) : 0;
    const paceMin = Math.floor(paceDecimal);
    const paceSec = Math.round((paceDecimal - paceMin) * 60);
    const paceStr = `${paceMin}:${String(paceSec).padStart(2, '0')} min/km`;

    const resSpeed = document.getElementById('sim-cardio-res-speed');
    const resDist = document.getElementById('sim-cardio-res-dist');
    const resPace = document.getElementById('sim-cardio-res-pace');

    if (resSpeed) resSpeed.textContent = `${effSpeed.toFixed(2).replace('.', ',')} km/h`;
    if (resDist) resDist.textContent = `${distKm.toFixed(2).replace('.', ',')} km`;
    if (resPace) resPace.textContent = paceStr;
};

window.initSobreSimulators = function() {
    window.updateSobreSleepSim();
    window.updateSobreForceSim();
    window.updateSobreCardioSim();
};

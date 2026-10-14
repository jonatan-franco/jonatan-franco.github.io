/* ===================================================================
 * atv.js — Tabela Interativa de Atividade Física (Carga e Observações)
 * =================================================================== */

let atvLogs = {}; // { "YYYY-MM-DD": [ { id, habitId, exerciseName, weight, notes }, ... ] }
let selectedAtvDate = new Date().toISOString().split('T')[0];

function loadAtvLogs() {
    const raw = SafeStorage.getItem('hq_atv_logs_v1');
    if (raw) {
        try { atvLogs = JSON.parse(raw); } catch (e) { atvLogs = {}; }
    }
}

function saveAtvLogs() {
    SafeStorage.setItem('hq_atv_logs_v1', JSON.stringify(atvLogs));
}

window.setAtvDate = function(dateStr) {
    selectedAtvDate = dateStr;
    renderAtvFisicaInteractiveView();
};

window.setTodayAtvDate = function() {
    selectedAtvDate = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('atv-log-date');
    if (dateInput) dateInput.value = selectedAtvDate;
    renderAtvFisicaInteractiveView();
};

window.addAtvLogEntry = function(event) {
    event.preventDefault();
    const habitId = document.getElementById('atv-log-habit').value;
    const exerciseName = document.getElementById('atv-log-exercise').value.trim();
    const weight = parseFloat(document.getElementById('atv-log-weight').value) || 0;
    const notes = document.getElementById('atv-log-notes').value.trim();
    const dateVal = document.getElementById('atv-log-date').value || selectedAtvDate;

    if (!exerciseName) return;

    if (!atvLogs[dateVal]) atvLogs[dateVal] = [];
    atvLogs[dateVal].push({
        id: 'log_' + Date.now(),
        habitId,
        exerciseName,
        weight: parseFloat(weight.toFixed(2)),
        notes
    });

    saveAtvLogs();
    document.getElementById('atv-log-exercise').value = '';
    document.getElementById('atv-log-weight').value = '';
    document.getElementById('atv-log-notes').value = '';
    renderAtvFisicaInteractiveView();
};

window.deleteAtvLogEntry = function(dateStr, logId) {
    if (!atvLogs[dateStr]) return;
    atvLogs[dateStr] = atvLogs[dateStr].filter(item => item.id !== logId);
    saveAtvLogs();
    renderAtvFisicaInteractiveView();
};

function renderAtvFisicaInteractiveView() {
    const container = document.getElementById('atv-fisica-cards-grid');
    if (!container) return;

    loadAtvLogs();
    const atvHabits = habits.filter(h => h.category === 'atv_fisica');
    const dateInput = document.getElementById('atv-log-date');
    if (dateInput && !dateInput.value) dateInput.value = selectedAtvDate;

    // Popula o select de atividades físicas do formulário de log
    const habitSelect = document.getElementById('atv-log-habit');
    if (habitSelect) {
        habitSelect.innerHTML = '';
        if (atvHabits.length === 0) {
            habitSelect.innerHTML = `<option value="">Cadastre uma Atividade Física primeiro</option>`;
        } else {
            atvHabits.forEach(h => {
                habitSelect.innerHTML += `<option value="${h.id}">${h.name}</option>`;
            });
        }
    }

    const currentLogs = atvLogs[selectedAtvDate] || [];

    let logsTableHTML = '';
    if (currentLogs.length === 0) {
        logsTableHTML = `<tr><td colspan="5" class="py-6 text-center text-zinc-400 text-xs">Nenhum registro para esta data. Adicione abaixo.</td></tr>`;
    } else {
        currentLogs.forEach(log => {
            const hObj = habits.find(h => h.id === log.habitId);
            const hName = hObj ? hObj.name : 'Atividade';
            logsTableHTML += `
                <tr class="hover:bg-zinc-50 transition">
                    <td class="py-2.5 px-3 font-medium text-zinc-900">${hName}</td>
                    <td class="py-2.5 px-3 text-zinc-700">${log.exerciseName}</td>
                    <td class="py-2.5 px-3 text-center font-mono font-bold text-rose-600">${log.weight.toFixed(2)} kg</td>
                    <td class="py-2.5 px-3 text-zinc-500 italic">${log.notes || '—'}</td>
                    <td class="py-2.5 px-3 text-right"><button type="button" onclick="deleteAtvLogEntry('${selectedAtvDate}', '${log.id}')" class="text-rose-500 hover:text-rose-700">🗑️</button></td>
                </tr>`;
        });
    }

    // Renderiza o painel principal com carrossel adaptado para celular
    container.innerHTML = `
        <div class="col-span-full space-y-6">
            <!-- Seletor de Data Facilitado -->
            <div class="bg-zinc-50 p-4 rounded-2xl border border-zinc-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div class="flex items-center gap-2">
                    <span class="text-xs font-semibold text-zinc-700 uppercase">📅 Selecionar Dia:</span>
                    <input type="date" id="atv-date-picker" value="${selectedAtvDate}" onchange="setAtvDate(this.value)" class="bg-white border border-zinc-300 rounded-xl px-3 py-1.5 text-xs font-mono text-zinc-900">
                    <button type="button" onclick="setTodayAtvDate()" class="px-3 py-1.5 bg-black text-white rounded-xl text-xs font-semibold">Hoje</button>
                </div>
                <div class="text-xs text-zinc-500 font-mono">Exibindo registros para: <strong>${selectedAtvDate}</strong></div>
            </div>

            <!-- CARROSSEL PARA CELULAR (1 atividade por vez, arrastando para o lado) / GRID NO NOTEBOOK -->
            <div class="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin">
                ${atvHabits.length === 0 ? `<div class="text-xs text-zinc-400 p-4">Nenhuma atividade física configurada.</div>` : ''}
                ${atvHabits.map((habit, idx) => {
                    const m = calcHabitMetrics(habit);
                    const cat = CATEGORIES[habit.category];
                    return `
                        min-w-[280px] sm:min-w-[320px] md:min-w-0 snap-center
                        <div class="${cat.cardBg} p-5 rounded-3xl flex flex-col justify-between space-y-4 shadow-xs shrink-0 md:shrink">
                            <div class="flex justify-between items-start">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-full bg-white/70 flex items-center justify-center text-lg">${cat.emoji}</div>
                                    <div>
                                        <h3 class="font-bold text-zinc-900 text-sm leading-snug">${habit.name}</h3>
                                        <span class="text-[11px] font-mono text-zinc-600">Meta: ${habit.targetHours}h/sem</span>
                                    </div>
                                </div>
                                <button type="button" onclick="openHabitModal(${habits.indexOf(habit)})" class="p-1">✏️</button>
                            </div>
                            <div class="font-mono"><span class="text-2xl font-bold text-zinc-950">${m.totalHours.toFixed(1)}h</span> <span class="text-xs text-zinc-600">/ ${habit.targetHours}h</span></div>
                        </div>`;
                }).join('')}
            </div>

            <!-- TABELA INTERATIVA DO DIA SELECIONADO -->
            <div class="bg-white border border-zinc-200 rounded-2xl p-5 space-y-4 shadow-sm">
                <h3 class="text-sm font-bold text-zinc-900">📝 Registro de Exercícios, Carga e Observações (${selectedAtvDate})</h3>
                
                <form onsubmit="addAtvLogEntry(event)" class="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end bg-zinc-50 p-3.5 rounded-2xl border border-zinc-200">
                    <input type="hidden" id="atv-log-date" value="${selectedAtvDate}">
                    <div class="sm:col-span-3">
                        <label class="block text-[10px] uppercase text-zinc-500 mb-1 font-semibold">Atividade</label>
                        <select id="atv-log-habit" class="w-full bg-white border border-zinc-300 rounded-xl px-3 py-1.5 text-xs text-zinc-900"></select>
                    </div>
                    <div class="sm:col-span-3">
                        <label class="block text-[10px] uppercase text-zinc-500 mb-1 font-semibold">Exercício / Movimento</label>
                        <input type="text" id="atv-log-exercise" required placeholder="Ex: Supino Reto" class="w-full bg-white border border-zinc-300 rounded-xl px-3 py-1.5 text-xs text-zinc-900">
                    </div>
                    <div class="sm:col-span-2">
                        <label class="block text-[10px] uppercase text-zinc-500 mb-1 font-semibold">Carga (kg)</label>
                        <input type="number" id="atv-log-weight" step="0.01" min="0" placeholder="0.00" class="w-full bg-white border border-zinc-300 rounded-xl px-3 py-1.5 text-xs font-mono text-zinc-900">
                    </div>
                    <div class="sm:col-span-3">
                        <label class="block text-[10px] uppercase text-zinc-500 mb-1 font-semibold">Observações</label>
                        <input type="text" id="atv-log-notes" placeholder="Ex: 3x10 RPE 8" class="w-full bg-white border border-zinc-300 rounded-xl px-3 py-1.5 text-xs text-zinc-900">
                    </div>
                    <div class="sm:col-span-1">
                        <button type="submit" class="w-full py-1.5 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-bold">+</button>
                    </div>
                </form>

                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr class="border-b border-zinc-200 text-zinc-400 font-mono uppercase text-[10px]">
                                <th class="py-2.5 px-3">Atividade</th>
                                <th class="py-2.5 px-3">Exercício</th>
                                <th class="py-2.5 px-3 text-center">Carga (2 casas)</th>
                                <th class="py-2.5 px-3">Observações</th>
                                <th class="py-2.5 px-3 text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-zinc-100">${logsTableHTML}</tbody>
                    </table>
                </div>
            </div>
        </div>`;
}

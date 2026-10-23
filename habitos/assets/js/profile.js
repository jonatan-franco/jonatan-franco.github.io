/* ===================================================================
 * profile.js — Perfil, Avatar e Cumprimento — HaQt
 * =================================================================== */

const PROFILE_STORAGE_KEY = 'hq_profile_v1';

const AVATAR_ROLES = [
    { id: 'dev',        emoji: '🧑‍💻', label: 'Dev' },
    { id: 'medico',     emoji: '🧑‍⚕️', label: 'Médico(a)' },
    { id: 'professor',  emoji: '🧑‍🏫', label: 'Professor(a)' },
    { id: 'estudante',  emoji: '🧑‍🎓', label: 'Estudante' },
    { id: 'engenheiro', emoji: '🧑‍🔧', label: 'Engenheiro(a)' },
    { id: 'cientista',  emoji: '🧑‍🔬', label: 'Cientista' },
    { id: 'chef',       emoji: '🧑‍🍳', label: 'Chef' },
    { id: 'artista',    emoji: '🧑‍🎨', label: 'Artista' },
    { id: 'executivo',  emoji: '🧑‍💼', label: 'Executivo(a)' },
    { id: 'atleta',     emoji: '🏋️',   label: 'Atleta' },
    { id: 'astronauta', emoji: '🧑‍🚀', label: 'Astronauta' },
    { id: 'piloto',     emoji: '🧑‍✈️', label: 'Piloto' },
    { id: 'zen',        emoji: '🧘',   label: 'Zen' },
    { id: 'musico',     emoji: '🧑‍🎤', label: 'Músico' },
    { id: 'detetive',   emoji: '🕵️',   label: 'Investigador(a)' },
    { id: 'ninja',      emoji: '🥷',   label: 'Ninja' },
];

let currentProfile = { name: 'HaQt', gender: 'nb', role: 'dev', skinTone: '' };
let selectedRoleId   = 'dev';
let selectedSkinTone = '';
let isFirstRunModal  = false;

function applySkinToneToEmoji(baseEmoji, tone) {
    if (!tone) return baseEmoji;
    const cp = Array.from(baseEmoji);
    if (cp.length === 0) return baseEmoji;
    return cp[0] + tone + cp.slice(1).join('');
}

function buildAvatarEmoji(roleId, tone) {
    const rid = roleId || currentProfile.role || 'dev';
    const tk  = (tone !== undefined) ? tone : (currentProfile.skinTone || '');
    const role = AVATAR_ROLES.find(r => r.id === rid) || AVATAR_ROLES[0];
    return applySkinToneToEmoji(role.emoji, tk);
}

/* Fase da semana:
 *   Seg, Ter, Qua → "iniciar a semana"
 *   Qui, Sex, Sáb, Dom → "finalizar a semana" */
function getWeekPhaseAction() {
    const dow = new Date().getDay();
    if (dow >= 1 && dow <= 3) return 'iniciar';
    return 'finalizar';
}

function getReadyWordForGender(gender) {
    return gender === 'fem' ? 'Pronta' : 'Pronto';
}

/* Cumprimento conforme o horário local do dispositivo:
 *   05:00..11:59 -> Bom dia
 *   12:00..17:59 -> Boa tarde
 *   18:00..04:59 -> Boa noite */
function getDayPeriodGreeting() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Bom dia';
    if (hour >= 12 && hour < 18) return 'Boa tarde';
    return 'Boa noite';
}

window.getUserGreeting = function () {
    const hasName  = currentProfile && currentProfile.name && currentProfile.name !== 'HaQt';
    const salutation = getDayPeriodGreeting();
    const phase    = getWeekPhaseAction();
    const ready    = getReadyWordForGender(currentProfile.gender);
    if (hasName) {
        return `${salutation}, ${currentProfile.name}! ${ready} para ${phase} a semana?`;
    }
    return `${salutation}! ${ready} para ${phase} a semana?`;
};

function renderRoleGrid() {
    const grid = document.getElementById('avatar-role-grid');
    if (!grid) return;
    grid.innerHTML = '';
    AVATAR_ROLES.forEach(role => {
        const isActive = role.id === selectedRoleId;
        const cls = isActive
            ? 'flex flex-col items-center justify-center gap-1 py-2 rounded-xl border-2 border-black bg-zinc-100 transition text-center'
            : 'flex flex-col items-center justify-center gap-1 py-2 rounded-xl border border-zinc-200 bg-zinc-50 hover:border-zinc-400 transition text-center';
        grid.insertAdjacentHTML('beforeend', `
            <button type="button" onclick="selectAvatarRole('${role.id}')" class="${cls}">
                <span class="text-2xl leading-none">${role.emoji}</span>
                <span class="text-[10px] font-semibold text-zinc-700 truncate w-full px-1">${role.label}</span>
            </button>`);
    });
}

window.selectAvatarRole = function (roleId) {
    selectedRoleId = roleId;
    renderRoleGrid();
    updateAvatarPreview();
};

window.selectSkinTone = function (tone) {
    selectedSkinTone = tone || '';
    document.querySelectorAll('#skin-tone-selector .skin-btn').forEach(btn => {
        const btnTone = btn.getAttribute('data-tone') || '';
        const isActive = btnTone === selectedSkinTone;
        btn.className = isActive
            ? 'skin-btn py-2 rounded-xl border-2 border-black bg-zinc-50 text-xs font-semibold'
            : 'skin-btn py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-xs hover:border-zinc-400';
    });
    updateAvatarPreview();
};

window.updateAvatarPreview = function () {
    const nameInput   = document.getElementById('profile-name-input');
    const genderInput = document.getElementById('profile-gender-input');
    const name   = (nameInput?.value || '').trim() || 'Visitante';
    const gender = genderInput?.value || 'nb';

    const preview = document.getElementById('avatar-live-preview');
    if (preview) preview.textContent = buildAvatarEmoji(selectedRoleId, selectedSkinTone);

    const greet = document.getElementById('avatar-greeting-preview');
    if (greet) {
        const salutation = getDayPeriodGreeting();
        const phase = getWeekPhaseAction();
        const ready = getReadyWordForGender(gender);
        greet.textContent = `${salutation}, ${name}! ${ready} para ${phase} a semana?`;
    }
};

window.getAvatarDraft = () => ({ role: selectedRoleId, skinTone: selectedSkinTone });

window.openProfileModal = function (opts = {}) {
    isFirstRunModal = !!opts.firstRun;
    const m = document.getElementById('profile-modal');
    if (!m) return;

    const nameInput = document.getElementById('profile-name-input');
    if (nameInput) nameInput.value = (currentProfile.name && currentProfile.name !== 'HaQt') ? currentProfile.name : '';
    const genderInput = document.getElementById('profile-gender-input');
    if (genderInput) genderInput.value = currentProfile.gender || 'nb';

    selectedRoleId   = currentProfile.role || 'dev';
    selectedSkinTone = currentProfile.skinTone || '';

    renderRoleGrid();
    window.selectSkinTone(selectedSkinTone);
    updateAvatarPreview();

    const closeBtn = document.getElementById('profile-modal-close-btn');
    if (closeBtn) closeBtn.style.display = isFirstRunModal ? 'none' : '';

    m.classList.remove('hidden');
    m.classList.add('flex');
};

window.closeProfileModal = function () {
    if (isFirstRunModal) return;
    const m = document.getElementById('profile-modal');
    if (!m) return;
    m.classList.add('hidden');
    m.classList.remove('flex');
};

window.markFirstRunDone = function () { isFirstRunModal = false; };

window.loadProfile = function () {
    const raw = SafeStorage.getItem(PROFILE_STORAGE_KEY);
    if (raw) {
        try { currentProfile = { ...currentProfile, ...JSON.parse(raw) }; } catch (e) {}
    }
    applyProfileToUI();
};

window.saveProfile = function (patch) {
    currentProfile = { ...currentProfile, ...patch };
    SafeStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(currentProfile));
    applyProfileToUI();
};

window.hasProfile = function () {
    return !!(currentProfile.name && currentProfile.name !== 'HaQt');
};

function applyProfileToUI() {
    const avatarEmoji = buildAvatarEmoji(currentProfile.role, currentProfile.skinTone);
    ['sidebar-user-avatar', 'mobile-user-avatar'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = avatarEmoji;
    });
    ['sidebar-user-name', 'mobile-user-name'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = currentProfile.name || 'HaQt';
    });
    if (typeof window.refreshHeaderTitle === 'function') window.refreshHeaderTitle();
}

console.log('[profile.js] carregado. getUserGreeting:', typeof window.getUserGreeting);
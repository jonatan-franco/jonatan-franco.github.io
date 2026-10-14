/* ===================================================================
 * profile.js — Perfil, Avatar e Cumprimento — HabitQuant Pro
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

let currentProfile = { name: 'HabitQuant Pro', gender: 'nb', role: 'dev', skinTone: '' };
<<<<<<< HEAD
let selectedRoleId  = 'dev';
=======
let selectedRoleId = 'dev';
>>>>>>> 95c0572cb2534591be7539033a93de6aadb3f83b
let selectedSkinTone = '';
let isFirstRunModal = false;

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
<<<<<<< HEAD
}

/* -------------------------------------------------------------------
 * Fase da semana:
 *   Seg, Ter, Qua → "iniciar a semana"
 *   Qui, Sex, Sáb, Dom → "finalizar a semana"
 * ------------------------------------------------------------------- */
function getWeekPhaseAction() {
    const dow = new Date().getDay();   /* 0=Dom, 1=Seg, ..., 6=Sáb */
    if (dow >= 1 && dow <= 3) return 'iniciar';
    return 'finalizar';
}

function getReadyWordForGender(gender) {
    return gender === 'fem' ? 'Pronta' : 'Pronto';
}

/* Cumprimento OFICIAL — usado pelo header do dashboard
 * Formato: "Bom dia, [nome]! [Pronto|Pronta] para [iniciar|finalizar] a semana?" */
window.getUserGreeting = function () {
    const hasName = currentProfile && currentProfile.name && currentProfile.name !== 'HabitQuant Pro';
    const phase   = getWeekPhaseAction();
    const ready   = getReadyWordForGender(currentProfile.gender);
    if (hasName) {
        return `Bom dia, ${currentProfile.name}! ${ready} para ${phase} a semana?`;
    }
    return `Bom dia! ${ready} para ${phase} a semana?`;
=======
}

/* Cumprimento ESTÁVEL — sempre "Bom dia, [nome]!" */
window.getUserGreeting = function () {
    const hasName = currentProfile && currentProfile.name && currentProfile.name !== 'HabitQuant Pro';
    return hasName ? `Bom dia, ${currentProfile.name}!` : 'Bom dia, Semana Corrente';
>>>>>>> 95c0572cb2534591be7539033a93de6aadb3f83b
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

/* Prévia dentro do modal — mesma regra do cumprimento oficial,
 * usando o nome que o usuário está digitando no momento */
window.updateAvatarPreview = function () {
    const nameInput   = document.getElementById('profile-name-input');
    const genderInput = document.getElementById('profile-gender-input');
    const name   = (nameInput?.value || '').trim() || 'Visitante';
    const gender = genderInput?.value || 'nb';

    const preview = document.getElementById('avatar-live-preview');
    if (preview) preview.textContent = buildAvatarEmoji(selectedRoleId, selectedSkinTone);

    const greet = document.getElementById('avatar-greeting-preview');
    if (greet) {
<<<<<<< HEAD
        const phase = getWeekPhaseAction();
        const ready = getReadyWordForGender(gender);
        greet.textContent = `Bom dia, ${name}! ${ready} para ${phase} a semana?`;
=======
        const readyWord = gender === 'fem' ? 'Pronta' : 'Pronto';
        greet.textContent = `Bom dia, ${name}! ${readyWord} para o dia?`;
>>>>>>> 95c0572cb2534591be7539033a93de6aadb3f83b
    }
};

window.getAvatarDraft = () => ({ role: selectedRoleId, skinTone: selectedSkinTone });

<<<<<<< HEAD
/* -------------------------------------------------------------------
 * Modal do Perfil
 * ------------------------------------------------------------------- */
=======
>>>>>>> 95c0572cb2534591be7539033a93de6aadb3f83b
window.openProfileModal = function (opts = {}) {
    isFirstRunModal = !!opts.firstRun;
    const m = document.getElementById('profile-modal');
    if (!m) return;

    const nameInput = document.getElementById('profile-name-input');
    if (nameInput) nameInput.value = (currentProfile.name && currentProfile.name !== 'HabitQuant Pro') ? currentProfile.name : '';
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
<<<<<<< HEAD
    if (isFirstRunModal) return;   /* bloqueia fechamento APENAS no primeiro acesso */
=======
    if (isFirstRunModal) return;   /* bloqueia APENAS no primeiro acesso */
>>>>>>> 95c0572cb2534591be7539033a93de6aadb3f83b
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
    return !!(currentProfile.name && currentProfile.name !== 'HabitQuant Pro');
};

function applyProfileToUI() {
    const avatarEmoji = buildAvatarEmoji(currentProfile.role, currentProfile.skinTone);
    ['sidebar-user-avatar', 'mobile-user-avatar'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = avatarEmoji;
    });
    ['sidebar-user-name', 'mobile-user-name'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = currentProfile.name || 'HabitQuant Pro';
    });
    if (typeof window.refreshHeaderTitle === 'function') window.refreshHeaderTitle();
}

<<<<<<< HEAD
console.log('[profile.js] carregado. getUserGreeting:', typeof window.getUserGreeting);
=======
console.log('[profile.js] carregado. openProfileModal:', typeof window.openProfileModal);
>>>>>>> 95c0572cb2534591be7539033a93de6aadb3f83b

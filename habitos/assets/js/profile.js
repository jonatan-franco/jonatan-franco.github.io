/* ===================================================================
 * profile.js — Perfil, Avatar e Cumprimento — HabitQuant Pro
 * VERSÃO CORRIGIDA
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

let currentProfile = {
    name: 'HabitQuant Pro',
    gender: 'nb',
    role: 'dev',
    skinTone: ''
};

let selectedRoleId   = 'dev';
let selectedSkinTone = '';

function applySkinToneToEmoji(baseEmoji, tone) {
    if (!tone) return baseEmoji;
    const codepoints = Array.from(baseEmoji);
    if (codepoints.length === 0) return baseEmoji;
    const first = codepoints[0];
    const rest = codepoints.slice(1).join('');
    return first + tone + rest;
}

function buildAvatarEmoji(roleId, tone) {
    const rid = roleId || currentProfile.role || 'dev';
    const tk  = (tone !== undefined) ? tone : (currentProfile.skinTone || '');
    const role = AVATAR_ROLES.find(r => r.id === rid) || AVATAR_ROLES[0];
    return applySkinToneToEmoji(role.emoji, tk);
}

function getGreetingPhrase() {
    const h = new Date().getHours();
    if (h >= 12 && h < 18) return 'Boa tarde';
    if (h >= 18 || h < 6)  return 'Boa noite';
    return 'Bom dia';
}

function getReadyWord(gender) {
    return gender === 'fem' ? 'Pronta' : 'Pronto';
}

window.getUserGreeting = function () {
    const hasCustomName = currentProfile && currentProfile.name && currentProfile.name !== 'HabitQuant Pro';
    return hasCustomName
        ? `${getGreetingPhrase()}, ${currentProfile.name}!`
        : `${getGreetingPhrase()}!`;
};

function renderRoleGrid() {
    const grid = document.getElementById('avatar-role-grid');
    if (!grid) {
        console.warn('[profile.js] #avatar-role-grid não encontrado no DOM.');
        return;
    }
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
        greet.textContent = `${getGreetingPhrase()}, ${name}! ${getReadyWord(gender)} para o dia?`;
    }
};

window.getAvatarDraft = () => ({ role: selectedRoleId, skinTone: selectedSkinTone });

window.openProfileModal = function (opts = {}) {
    const m = document.getElementById('profile-modal');
    if (!m) {
        console.error('[profile.js] #profile-modal não encontrado no DOM.');
        return;
    }
    try {
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
        if (closeBtn) closeBtn.classList.toggle('hidden', !!opts.firstRun);

        m.classList.remove('hidden');
        m.classList.add('flex');
    } catch (err) {
        console.error('[profile.js] Erro ao abrir modal:', err);
    }
};

window.closeProfileModal = function () {
    if (!window.hasProfile()) return;
    const m = document.getElementById('profile-modal');
    if (!m) return;
    m.classList.add('hidden');
    m.classList.remove('flex');
};

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

console.log('[profile.js] carregado. openProfileModal:', typeof window.openProfileModal);

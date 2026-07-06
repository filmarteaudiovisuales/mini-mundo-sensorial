/* ============================================================
   Mini Mundo Sensorial — Filmarte Escuela Creativa
   Desarrollado por Digital Carmelo
   HTML + CSS + JavaScript puro. Sin frameworks, sin backend.
   Sonidos y canciones generados con Web Audio API (sin archivos externos).
   ============================================================ */
(() => {
  'use strict';

  /* ============================================================
     CONFIGURACIÓN DE MARCA (WHITE-LABEL)
     ------------------------------------------------------------
     Para vender una versión personalizada a un jardín, marca o
     emprendimiento: cambiá SOLO estos valores (nombre, colores,
     mascota, WhatsApp) y toda la app se actualiza sola. No hace
     falta tocar el resto del código para cada cliente nuevo.
     ============================================================ */
  const BRAND_CONFIG = {
    appName: 'Mini Mundo Sensorial',
    schoolName: 'Filmarte Escuela Creativa',
    developerCredit: 'Digital Carmelo',
    mascotName: 'Tuqui',
    colorPrimary: '#FF8A65',
    colorPrimaryDark: '#E96B45',
    colorSecondary: '#4FC3F7',
    colorSecondaryDark: '#2FA9E0',
    colorAccent: '#FFD54F',
    whatsappNumber: '5490000000000', // código país + número, sin espacios ni signos
    whatsappMessage: 'Hola! Vi Mini Mundo Sensorial y quiero una versión personalizada 💛'
  };

  function applyBrandConfig() {
    const root = document.documentElement.style;
    root.setProperty('--color-primary', BRAND_CONFIG.colorPrimary);
    root.setProperty('--color-primary-dark', BRAND_CONFIG.colorPrimaryDark);
    root.setProperty('--color-secondary', BRAND_CONFIG.colorSecondary);
    root.setProperty('--color-secondary-dark', BRAND_CONFIG.colorSecondaryDark);
    root.setProperty('--color-accent', BRAND_CONFIG.colorAccent);

    document.title = `${BRAND_CONFIG.appName} · ${BRAND_CONFIG.schoolName}`;

    const brandKicker = document.getElementById('brand-kicker');
    if (brandKicker) brandKicker.textContent = `Una experiencia de ${BRAND_CONFIG.schoolName}`;

    const mascotLabel = document.getElementById('mascot-name-label');
    if (mascotLabel) mascotLabel.textContent = BRAND_CONFIG.mascotName;

    document.querySelectorAll('.brand span').forEach((el) => { el.textContent = BRAND_CONFIG.schoolName; });
    document.querySelectorAll('.dev-credit, .diploma-dev').forEach((el) => {
      el.textContent = `Desarrollado por ${BRAND_CONFIG.developerCredit}`;
    });
  }

  /* ---------- Claves de localStorage (sin datos sensibles) ---------- */
  const KEYS = {
    age: 'mms_age',
    sound: 'mms_sound',
    music: 'mms_music',
    voice: 'mms_voice',
    contrast: 'mms_contrast',
    motion: 'mms_reduceMotion',
    data: 'mms_progress',
    players: 'mms_players',
    activePlayer: 'mms_active_player'
  };

  const AVATARS = ['👶', '👧', '👦', '🧒', '👸', '🤴', '🐻', '🦁', '🐰', '🌟'];

  const AGE_RANK = { '0-12': 0, '1-2': 1, '2-3': 2 };
  const AGE_LABELS = { '0-12': '0 a 12 meses', '1-2': '1 a 2 años', '2-3': '2 a 3 años' };

  function defaultData() {
    return {
      progress: { colors: false, animals: false, sounds: false, shapes: false, journey: false },
      visited: { colors: false, animals: false, sounds: false, shapes: false, song: false, calm: false, journey: false },
      activities: 0,
      journeyStep: 1,
      journeyCompleted: false,
      diplomaUnlocked: false
    };
  }

  function safeParseData(json) {
    const fallback = defaultData();
    try {
      const parsed = JSON.parse(json);
      if (!parsed || typeof parsed !== 'object') return fallback;
      return {
        progress: { ...fallback.progress, ...(parsed.progress || {}) },
        visited: { ...fallback.visited, ...(parsed.visited || {}) },
        activities: typeof parsed.activities === 'number' ? parsed.activities : 0,
        journeyStep: typeof parsed.journeyStep === 'number' ? parsed.journeyStep : 1,
        journeyCompleted: !!parsed.journeyCompleted,
        diplomaUnlocked: !!parsed.diplomaUnlocked
      };
    } catch (e) {
      return fallback;
    }
  }

  function safeParsePlayers(json) {
    try {
      const parsed = JSON.parse(json);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  /* ---------- Estado en memoria (reflejo de localStorage) ---------- */
  const state = {
    age: localStorage.getItem(KEYS.age) || null,
    sound: localStorage.getItem(KEYS.sound) !== 'false',
    music: localStorage.getItem(KEYS.music) !== 'false',
    voice: localStorage.getItem(KEYS.voice) !== 'false',
    contrast: localStorage.getItem(KEYS.contrast) === 'true',
    motion: localStorage.getItem(KEYS.motion) === 'true',
    data: safeParseData(localStorage.getItem(KEYS.data)),
    players: safeParsePlayers(localStorage.getItem(KEYS.players)),
    activePlayerId: localStorage.getItem(KEYS.activePlayer) || null,
    songSelected: null
  };

  function saveData() {
    localStorage.setItem(KEYS.data, JSON.stringify(state.data));
  }

  function markVisited(key) {
    if (state.data.visited[key]) return;
    state.data.visited[key] = true;
    saveData();
  }

  function markProgress(key) {
    const wasAlreadyDone = state.data.progress[key];
    state.data.progress[key] = true;
    saveData();
    updateProgressBadges();
    if (!wasAlreadyDone) addStars(1);
  }

  function incrementActivities() {
    state.data.activities += 1;
    saveData();
  }

  /* ============================================================
     JUGADORES (avatar + estrellas) — guardado local por dispositivo
     ------------------------------------------------------------
     No hay backend: cada tablet/celular guarda sus propios
     jugadores en localStorage. Si en algún momento se necesita que
     las estrellas se sincronicen entre varios dispositivos, hace
     falta sumar un servicio externo (Firebase, Supabase, etc.) —
     eso es un proyecto aparte.
     ============================================================ */
  function savePlayers() {
    localStorage.setItem(KEYS.players, JSON.stringify(state.players));
  }

  function getActivePlayer() {
    return state.players.find((p) => p.id === state.activePlayerId) || null;
  }

  function createPlayer(name, avatar) {
    const player = {
      id: 'p_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      name: name.slice(0, 15),
      avatar: avatar || '👶',
      stars: 0
    };
    state.players.push(player);
    savePlayers();
    selectPlayer(player.id);
    renderPlayersList();
  }

  function selectPlayer(id) {
    state.activePlayerId = id;
    localStorage.setItem(KEYS.activePlayer, id);
    updatePlayerBadge();
  }

  function addStars(amount) {
    const player = getActivePlayer();
    if (!player) return;
    player.stars = (player.stars || 0) + amount;
    savePlayers();
    updatePlayerBadge();
  }

  function updatePlayerBadge() {
    const badge = document.getElementById('player-badge');
    const avatarEl = document.getElementById('player-badge-avatar');
    const nameEl = document.getElementById('player-badge-name');
    const starsEl = document.getElementById('player-badge-stars');
    if (!badge) return;
    const player = getActivePlayer();
    if (player) {
      avatarEl.textContent = player.avatar;
      nameEl.textContent = player.name;
      starsEl.textContent = String(player.stars || 0);
    } else {
      avatarEl.textContent = '👶';
      nameEl.textContent = 'Elegir jugador';
      starsEl.textContent = '0';
    }
  }

  function renderPlayersList() {
    const list = document.getElementById('players-list');
    if (!list) return;
    list.innerHTML = '';
    if (state.players.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'game-instructions';
      empty.style.fontSize = '1rem';
      empty.textContent = 'Todavía no hay jugadores. ¡Creá el primero abajo!';
      list.appendChild(empty);
      return;
    }
    state.players.forEach((p) => {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'player-row' + (p.id === state.activePlayerId ? ' selected' : '');
      row.innerHTML = `<span class="player-row-name"><span aria-hidden="true">${p.avatar}</span> ${p.name}</span><span class="player-row-stars">⭐ ${p.stars || 0}</span>`;
      row.addEventListener('click', () => {
        selectPlayer(p.id);
        showScreen(state.age ? 'screen-menu' : 'screen-age');
        renderPlayersList();
      });
      list.appendChild(row);
    });
  }

  function setupAvatarPicker() {
    const container = document.getElementById('avatar-picker');
    if (!container) return;
    AVATARS.forEach((av, i) => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'avatar-option' + (i === 0 ? ' picked' : '');
      el.textContent = av;
      el.setAttribute('aria-label', 'Avatar ' + av);
      el.addEventListener('click', () => {
        container.querySelectorAll('.avatar-option').forEach((x) => x.classList.remove('picked'));
        el.classList.add('picked');
      });
      container.appendChild(el);
    });
  }

  const btnCreatePlayer = document.getElementById('btn-create-player');
  if (btnCreatePlayer) {
    btnCreatePlayer.addEventListener('click', () => {
      const input = document.getElementById('new-player-name');
      const name = input.value.trim();
      if (!name) { input.focus(); return; }
      const picked = document.querySelector('.avatar-option.picked');
      const avatar = picked ? picked.textContent : '👶';
      createPlayer(name, avatar);
      input.value = '';
    });
  }

  /* ============================================================
     VOZ — narración simple con Web Speech API (speechSynthesis)
     ------------------------------------------------------------
     Nativa del navegador, sin costo ni archivos, en español. Se
     puede apagar con el botón "Voz" de la barra superior. Distinta
     del botón "Sonido" (que controla los efectos/música).

     Elegimos automáticamente la mejor voz FEMENINA en español
     disponible en el dispositivo, con un tono cálido y alegre
     (tipo seño de jardín): pitch más agudo, ritmo relajado.
     Cada navegador/celular trae voces distintas instaladas, así
     que el resultado varía un poco de un dispositivo a otro, pero
     siempre prioriza español + femenina cuando existe.
     ============================================================ */
  const FEMALE_VOICE_HINTS = ['female', 'mujer', 'feminin', 'paulina', 'monica', 'mónica', 'lucia', 'lucía', 'helena', 'elvira', 'sabina', 'laura', 'catalina', 'esperanza', 'google español', 'microsoft sabina', 'microsoft helena', 'microsoft laura'];
  const MALE_VOICE_HINTS = ['male', 'hombre', 'masculin', 'diego', 'jorge', 'carlos', 'pablo', 'jorge', 'juan'];

  let cachedVoice = null;
  let voicesReady = false;

  function scoreVoice(voice) {
    const lang = (voice.lang || '').toLowerCase();
    const name = (voice.name || '').toLowerCase();
    let score = 0;
    if (lang.startsWith('es')) score += 10;
    if (lang === 'es-ar') score += 6; // acento rioplatense, el más cercano
    else if (lang === 'es-419' || lang === 'es-us' || lang === 'es-mx') score += 3;
    if (FEMALE_VOICE_HINTS.some((hint) => name.includes(hint))) score += 8;
    if (MALE_VOICE_HINTS.some((hint) => name.includes(hint))) score -= 8;
    if (voice.localService) score += 1; // suele sonar mejor que la remota
    return score;
  }

  function pickBestVoice() {
    if (!('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;
    const spanish = voices.filter((v) => (v.lang || '').toLowerCase().startsWith('es'));
    const pool = spanish.length ? spanish : voices;
    return pool.slice().sort((a, b) => scoreVoice(b) - scoreVoice(a))[0] || null;
  }

  function refreshVoice() {
    cachedVoice = pickBestVoice();
    voicesReady = true;
  }

  if ('speechSynthesis' in window) {
    refreshVoice();
    window.speechSynthesis.addEventListener('voiceschanged', refreshVoice);
  }

  function speak(text) {
    if (!state.voice) return;
    if (!('speechSynthesis' in window)) return;
    if (!voicesReady) refreshVoice();
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-AR';
    if (cachedVoice) utterance.voice = cachedVoice;
    utterance.rate = 0.95;   // relajado, ni apurada ni lenta
    utterance.pitch = 1.35;  // agudo y cálido, tono alegre de seño
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  }

  /* ============================================================
     RUTAS DE ARCHIVOS DE AUDIO REALES (OPCIONAL)
     ------------------------------------------------------------
     Si subís archivos de audio reales a la carpeta /assets/, la
     app los va a usar automáticamente en lugar de los sonidos
     sintetizados. Si un archivo no existe o falla, cae solo al
     sonido generado (no rompe nada).

     Estructura de carpetas esperada junto a index.html:
       assets/sounds/animals/*.mp3
       assets/sounds/fx/*.mp3
       assets/music/background.mp3   (música de fondo continua)
     ============================================================ */
  const SOUND_FILES = {
    // Animalitos
    duck: 'assets/sounds/animals/duck.mp3',
    dog: 'assets/sounds/animals/dog.mp3',
    cat: 'assets/sounds/animals/cat.mp3',
    cow: 'assets/sounds/animals/cow.mp3',
    frog: 'assets/sounds/animals/frog.mp3',
    sheep: 'assets/sounds/animals/sheep.mp3',
    bird: 'assets/sounds/animals/bird.mp3',
    horse: 'assets/sounds/animals/horse.mp3',
    // Sonidos / efectos
    bell: 'assets/sounds/fx/bell.mp3',
    drum: 'assets/sounds/fx/drum.mp3',
    rain: 'assets/sounds/fx/rain.mp3',
    bubble: 'assets/sounds/fx/bubble.mp3',
    clap: 'assets/sounds/fx/clap.mp3',
    wind: 'assets/sounds/fx/wind.mp3',
    laugh: 'assets/sounds/fx/laugh.mp3',
    sparkle: 'assets/sounds/fx/sparkle.mp3',
    correct: 'assets/sounds/fx/correct.mp3',
    error: 'assets/sounds/fx/error.mp3',
    applause: 'assets/sounds/fx/applause.mp3',
    endGame: 'assets/sounds/fx/endgame.mp3'
  };

  const fileAudioCache = {};

  /**
   * Intenta reproducir un archivo de audio real. Si no existe, no carga,
   * o el navegador lo bloquea, ejecuta automáticamente synthFn() (el
   * sonido generado por Web Audio) como respaldo. Nunca deja a la app
   * en silencio por un archivo faltante.
   */
  function playFileOrSynth(fileKey, synthFn) {
    if (!state.sound) return;
    const path = SOUND_FILES[fileKey];
    if (!path) { synthFn(); return; }

    let settled = false;
    const fallback = () => {
      if (settled) return;
      settled = true;
      synthFn();
    };

    try {
      let audio = fileAudioCache[fileKey];
      if (!audio) {
        audio = new Audio(path);
        audio.preload = 'none';
        fileAudioCache[fileKey] = audio;
      } else {
        audio.currentTime = 0;
      }
      audio.volume = 0.9;
      const playPromise = audio.play();
      if (playPromise && typeof playPromise.then === 'function') {
        playPromise.then(() => { settled = true; }).catch(fallback);
      } else {
        settled = true;
      }
      audio.onerror = fallback;
    } catch (e) {
      fallback();
    }
  }

  /* ============================================================
     SONIDOS — Web Audio API (respaldo sin archivos externos)
     ============================================================ */
  let audioCtx = null;
  function getCtx() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  function tone({ freq = 440, duration = 0.25, type = 'sine', delay = 0, volume = 0.18, glideTo = null }) {
    if (!state.sound) return;
    const ctx = getCtx();
    const start = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.05);
  }

  function noiseBurst({ duration = 0.15, delay = 0, volume = 0.15, filterFreq = 1200 }) {
    if (!state.sound) return;
    const ctx = getCtx();
    const start = ctx.currentTime + delay;
    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    noise.connect(filter).connect(gain).connect(ctx.destination);
    noise.start(start);
  }

  const Sounds = {
    correct() { playFileOrSynth('correct', () => { tone({ freq: 523.25, duration: 0.15 }); tone({ freq: 659.25, duration: 0.2, delay: 0.12 }); }); },
    discovery() {
      tone({ freq: 392, duration: 0.12 });
      tone({ freq: 494, duration: 0.12, delay: 0.1 });
      tone({ freq: 659, duration: 0.25, delay: 0.2 });
    },
    applause() {
      playFileOrSynth('applause', () => {
        for (let i = 0; i < 5; i++) {
          noiseBurst({ delay: i * 0.09, duration: 0.08, filterFreq: 1800 + Math.random() * 800, volume: 0.1 });
        }
      });
    },
    error() { playFileOrSynth('error', () => { tone({ freq: 320, duration: 0.22, type: 'sine', glideTo: 250, volume: 0.14 }); }); },
    endGame() { playFileOrSynth('endGame', () => { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone({ freq: f, duration: 0.2, delay: i * 0.15 })); }); },
    bell() { playFileOrSynth('bell', () => { tone({ freq: 1046.5, duration: 0.6, type: 'triangle', volume: 0.15 }); }); },
    drum() { playFileOrSynth('drum', () => { tone({ freq: 110, duration: 0.18, type: 'sine', volume: 0.3 }); noiseBurst({ duration: 0.1, volume: 0.1, filterFreq: 200 }); }); },
    rain() { playFileOrSynth('rain', () => { for (let i = 0; i < 6; i++) noiseBurst({ delay: i * 0.06, duration: 0.12, filterFreq: 3000 + Math.random() * 2000, volume: 0.06 }); }); },
    bird() { playFileOrSynth('bird', () => { tone({ freq: 1500, duration: 0.08, glideTo: 2200 }); tone({ freq: 1800, duration: 0.1, delay: 0.12, glideTo: 1400 }); }); },
    clap() { playFileOrSynth('clap', () => { noiseBurst({ duration: 0.06, filterFreq: 2500, volume: 0.2 }); }); },
    bubble() { playFileOrSynth('bubble', () => { tone({ freq: 300, duration: 0.2, glideTo: 900, volume: 0.15 }); }); },
    wind() { playFileOrSynth('wind', () => { for (let i = 0; i < 3; i++) noiseBurst({ delay: i * 0.25, duration: 0.5, filterFreq: 500 + Math.random() * 300, volume: 0.05 }); }); },
    laugh() { playFileOrSynth('laugh', () => { [700, 850, 750, 900].forEach((f, i) => tone({ freq: f, duration: 0.1, delay: i * 0.11, type: 'triangle', volume: 0.1 })); }); },
    sparkle() { playFileOrSynth('sparkle', () => { [1046, 1318, 1568, 2093].forEach((f, i) => tone({ freq: f, duration: 0.12, delay: i * 0.08, type: 'triangle', volume: 0.08 })); }); },
    duck() { playFileOrSynth('duck', () => { tone({ freq: 300, duration: 0.15, type: 'square', volume: 0.08, glideTo: 220 }); }); },
    dog() { playFileOrSynth('dog', () => { tone({ freq: 200, duration: 0.12, type: 'square', volume: 0.12 }); tone({ freq: 180, duration: 0.12, delay: 0.15, type: 'square', volume: 0.12 }); }); },
    cat() { playFileOrSynth('cat', () => { tone({ freq: 700, duration: 0.2, type: 'sine', glideTo: 900, volume: 0.12 }); }); },
    cow() { playFileOrSynth('cow', () => { tone({ freq: 150, duration: 0.4, type: 'sawtooth', volume: 0.08, glideTo: 130 }); }); },
    frog() { playFileOrSynth('frog', () => { tone({ freq: 250, duration: 0.1, type: 'square', volume: 0.1 }); tone({ freq: 250, duration: 0.1, delay: 0.13, type: 'square', volume: 0.1 }); }); },
    sheep() { playFileOrSynth('sheep', () => { tone({ freq: 320, duration: 0.14, type: 'sine', volume: 0.1, glideTo: 260 }); tone({ freq: 300, duration: 0.14, delay: 0.16, type: 'sine', volume: 0.1, glideTo: 240 }); }); },
    horse() { playFileOrSynth('horse', () => { tone({ freq: 180, duration: 0.18, type: 'sawtooth', volume: 0.1, glideTo: 280 }); tone({ freq: 260, duration: 0.15, delay: 0.2, type: 'sawtooth', volume: 0.08, glideTo: 160 }); }); },
    color(id) {
      const map = {
        yellow: () => tone({ freq: 880, duration: 0.3, type: 'triangle', volume: 0.12 }),
        blue: () => tone({ freq: 440, duration: 0.35, type: 'sine', volume: 0.14, glideTo: 500 }),
        red: () => { tone({ freq: 300, duration: 0.12, type: 'sine', volume: 0.14 }); tone({ freq: 300, duration: 0.12, delay: 0.2, type: 'sine', volume: 0.14 }); },
        green: () => noiseBurst({ duration: 0.3, volume: 0.08, filterFreq: 2200 }),
        purple: () => tone({ freq: 600, duration: 0.3, type: 'triangle', volume: 0.12, glideTo: 800 }),
        orange: () => { tone({ freq: 300, duration: 0.1, type: 'sine', volume: 0.14 }); tone({ freq: 220, duration: 0.15, delay: 0.12, type: 'sine', volume: 0.12 }); },
        skyblue: () => { tone({ freq: 500, duration: 0.3, type: 'sine', volume: 0.1, glideTo: 620 }); noiseBurst({ delay: 0.1, duration: 0.25, volume: 0.05, filterFreq: 2600 }); }
      };
      (map[id] || (() => {}))();
    }
  };

  const SONGS = {
    alegre: [
      { freq: 523.25, duration: 0.28, type: 'triangle', volume: 0.13 },
      { freq: 659.25, duration: 0.28, type: 'triangle', volume: 0.13 },
      { freq: 783.99, duration: 0.28, type: 'triangle', volume: 0.13 },
      { freq: 659.25, duration: 0.28, type: 'triangle', volume: 0.13 }
    ],
    suave: [
      { freq: 392, duration: 0.7, type: 'sine', volume: 0.1 },
      { freq: 440, duration: 0.7, type: 'sine', volume: 0.1 },
      { freq: 523.25, duration: 0.9, type: 'sine', volume: 0.1 },
      { freq: 440, duration: 0.7, type: 'sine', volume: 0.1 }
    ],
    animalitos: [
      { freq: 300, duration: 0.22, type: 'square', volume: 0.1 },
      { freq: 200, duration: 0.22, type: 'square', volume: 0.1 },
      { freq: 350, duration: 0.22, type: 'triangle', volume: 0.1 },
      { freq: 250, duration: 0.26, type: 'square', volume: 0.1 }
    ],
    calm: [
      { freq: 330, duration: 1.3, type: 'sine', volume: 0.07 },
      { freq: 392, duration: 1.5, type: 'sine', volume: 0.07 },
      { freq: 349, duration: 1.3, type: 'sine', volume: 0.07 }
    ]
  };

  /* ---------- Motor de melodías en loop (encendido solo por el adulto) ---------- */
  const LoopEngine = (() => {
    let timer = null;
    let active = false;
    let currentName = null;

    function step(sequence, i) {
      if (!active) return;
      const note = sequence[i % sequence.length];
      tone({ freq: note.freq, duration: note.duration, type: note.type, volume: note.volume });
      timer = setTimeout(() => step(sequence, i + 1), note.duration * 1000 + 90);
    }

    return {
      play(name) {
        this.stop();
        const sequence = SONGS[name];
        if (!sequence) return;
        active = true;
        currentName = name;
        step(sequence, 0);
      },
      stop() {
        active = false;
        currentName = null;
        if (timer) clearTimeout(timer);
        timer = null;
      },
      isPlaying(name) {
        return active && (!name || currentName === name);
      },
      current() {
        return active ? currentName : null;
      }
    };
  })();

  /* ============================================================
     MÚSICA DE FONDO CONTINUA (independiente del Modo Canción)
     ------------------------------------------------------------
     Reproduce en loop assets/music/background.mp3 en volumen bajo
     mientras se navega por la app. Se activa recién con el primer
     toque del usuario (los navegadores bloquean el autoplay sin
     interacción). Tiene su propio botón de silencio en la barra
     superior, independiente del botón de efectos de sonido.
     ============================================================ */
  const bgMusic = document.getElementById('bg-music');
  let bgMusicUnlocked = false;
  let bgMusicHasFile = true;

  if (bgMusic) {
    bgMusic.volume = 0.22;
    bgMusic.addEventListener('error', () => { bgMusicHasFile = false; });
  }

  function updateBgMusicPlayback() {
    if (!bgMusic || !bgMusicHasFile) return;
    if (state.music && bgMusicUnlocked) {
      bgMusic.play().catch(() => {});
    } else {
      bgMusic.pause();
    }
  }

  function unlockBgMusicOnce() {
    if (bgMusicUnlocked || !bgMusic) return;
    bgMusicUnlocked = true;
    if (bgMusic.preload === 'none') bgMusic.preload = 'auto';
    updateBgMusicPlayback();
  }
  document.addEventListener('click', unlockBgMusicOnce, { once: true, capture: true });

  /* ============================================================
     NAVEGACIÓN ENTRE PANTALLAS
     ============================================================ */
  function showScreen(id) {
    LoopEngine.stop();
    if (id !== 'screen-calm-mode') stopBreathing();

    document.querySelectorAll('.screen').forEach((s) => {
      const active = s.id === id;
      s.classList.toggle('hidden', !active);
      s.setAttribute('aria-hidden', String(!active));
    });
    const target = document.getElementById(id);
    if (target) {
      window.scrollTo({ top: 0, behavior: state.motion ? 'auto' : 'smooth' });
      target.focus({ preventScroll: true });
    }
  }

  /* ============================================================
     PREFERENCIAS: sonido / música / contraste / movimiento
     ============================================================ */
  const btnSound = document.getElementById('btn-sound');
  const btnMusic = document.getElementById('btn-music');
  const btnVoice = document.getElementById('btn-voice');
  const btnContrast = document.getElementById('btn-contrast');
  const btnMotion = document.getElementById('btn-motion');

  function applyPreferences() {
    document.body.classList.toggle('contrast', state.contrast);
    document.body.classList.toggle('reduce-motion', state.motion);

    btnSound.setAttribute('aria-pressed', String(state.sound));
    btnSound.querySelector('.tool-icon').textContent = state.sound ? '🔊' : '🔇';
    btnSound.setAttribute('aria-label', state.sound ? 'Sonido activado. Tocar para silenciar' : 'Sonido silenciado. Tocar para activar');

    if (btnMusic) {
      btnMusic.setAttribute('aria-pressed', String(state.music));
      btnMusic.querySelector('.tool-icon').textContent = state.music ? '🎵' : '🎵🚫';
      btnMusic.setAttribute('aria-label', state.music ? 'Música de fondo activada. Tocar para silenciar' : 'Música de fondo silenciada. Tocar para activar');
    }

    if (btnVoice) {
      btnVoice.setAttribute('aria-pressed', String(state.voice));
      btnVoice.querySelector('.tool-icon').textContent = state.voice ? '🗣️' : '🔇';
      btnVoice.setAttribute('aria-label', state.voice ? 'Voz activada. Tocar para silenciar' : 'Voz silenciada. Tocar para activar');
    }

    btnContrast.setAttribute('aria-pressed', String(state.contrast));
    btnContrast.setAttribute('aria-label', state.contrast ? 'Alto contraste activado. Tocar para desactivar' : 'Activar alto contraste');

    btnMotion.setAttribute('aria-pressed', String(state.motion));
    btnMotion.setAttribute('aria-label', state.motion ? 'Reducir movimiento activado. Tocar para desactivar' : 'Activar reducir movimiento');
  }

  btnSound.addEventListener('click', () => {
    state.sound = !state.sound;
    localStorage.setItem(KEYS.sound, String(state.sound));
    applyPreferences();
    if (!state.sound) LoopEngine.stop();
    if (state.sound) Sounds.discovery();
  });

  if (btnMusic) {
    btnMusic.addEventListener('click', () => {
      state.music = !state.music;
      localStorage.setItem(KEYS.music, String(state.music));
      applyPreferences();
      updateBgMusicPlayback();
    });
  }

  if (btnVoice) {
    btnVoice.addEventListener('click', () => {
      state.voice = !state.voice;
      localStorage.setItem(KEYS.voice, String(state.voice));
      applyPreferences();
      if (!state.voice && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    });
  }

  btnContrast.addEventListener('click', () => {
    state.contrast = !state.contrast;
    localStorage.setItem(KEYS.contrast, String(state.contrast));
    applyPreferences();
  });

  btnMotion.addEventListener('click', () => {
    state.motion = !state.motion;
    localStorage.setItem(KEYS.motion, String(state.motion));
    applyPreferences();
  });

  /* ============================================================
     NAVEGACIÓN GENÉRICA (data-nav) Y MUNDOS (data-world)
     ============================================================ */
  document.addEventListener('click', (e) => {
    const navEl = e.target.closest('[data-nav]');
    if (!navEl) return;
    const target = navEl.getAttribute('data-nav');
    showScreen(target);
    if (target === 'screen-players') renderPlayersList();
  });

  const WORLD_INIT = {
    'screen-world-colors': () => { markVisited('colors'); initColorsWorld(); },
    'screen-world-animals': () => { markVisited('animals'); initAnimalsWorld(); },
    'screen-world-sounds': () => { markVisited('sounds'); initSoundsWorld(); },
    'screen-world-shapes': () => { markVisited('shapes'); initShapesWorld(); },
    'screen-song-mode': () => { markVisited('song'); initSongMode(); },
    'screen-calm-mode': () => { markVisited('calm'); initCalmMode(); },
    'screen-journey': () => { markVisited('journey'); initJourney(); }
  };

  document.querySelectorAll('[data-world]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-world');
      showScreen(id);
      const init = WORLD_INIT[id];
      if (init) init();
    });
  });

  document.getElementById('btn-start').addEventListener('click', () => {
    showScreen(state.age ? 'screen-menu' : 'screen-age');
    if (state.age) renderMenu();
  });

  /* ============================================================
     SELECCIÓN DE EDAD
     ============================================================ */
  document.querySelectorAll('.age-card').forEach((card) => {
    card.addEventListener('click', () => {
      state.age = card.getAttribute('data-age');
      localStorage.setItem(KEYS.age, state.age);
      renderMenu();
    });
  });

  function renderMenu() {
    const label = document.getElementById('menu-age-label');
    label.textContent = state.age ? `Franja de edad: ${AGE_LABELS[state.age]}` : '';
    updateProgressBadges();
  }

  function updateProgressBadges() {
    document.querySelectorAll('.progress-badge').forEach((badge) => {
      const key = badge.getAttribute('data-progress');
      badge.hidden = !state.data.progress[key];
    });
  }

  /* ============================================================
     UTILIDADES
     ============================================================ */
  function shuffle(array) {
    const arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function pick(array, n) {
    return shuffle(array).slice(0, Math.min(n, array.length));
  }

  const POSITIVE_MESSAGES = ['¡Muy bien!', '¡Qué lindo!', '¡Otra vez!', '¡Descubriste una sorpresa!'];
  function randomPositive() {
    return POSITIVE_MESSAGES[Math.floor(Math.random() * POSITIVE_MESSAGES.length)];
  }

  function setMessage(el, text, isRetry) {
    if (!el) return;
    el.textContent = text;
    el.classList.toggle('is-retry', !!isRetry);
  }

  function ageAtLeast(minAge) {
    return AGE_RANK[state.age] >= AGE_RANK[minAge];
  }

  function renderModeSwitcher(containerId, modes, currentMode, onSelect) {
    const wrap = document.getElementById(containerId);
    wrap.innerHTML = '';
    modes.forEach((m) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mode-btn';
      btn.textContent = m.label;
      btn.setAttribute('aria-pressed', String(m.id === currentMode));
      btn.addEventListener('click', () => onSelect(m.id));
      wrap.appendChild(btn);
    });
  }

  /* ============================================================
     MUNDO DE COLORES
     Cada color está asociado a un objeto real y concreto (estilo
     Montessori: el color no es abstracto, se ancla a un objeto
     reconocible del mundo real).
     ============================================================ */
  const COLORS = [
    { id: 'yellow', name: 'Amarillo', icon: '🐥' },     // patito amarillo
    { id: 'blue', name: 'Azul', icon: '🟦' },           // cuadrado azul
    { id: 'red', name: 'Rojo', icon: '🎈' },            // globo rojo
    { id: 'green', name: 'Verde', icon: '🍃' },         // hoja verde
    { id: 'purple', name: 'Violeta', icon: '🍇' },      // uvas violetas
    { id: 'orange', name: 'Naranja', icon: '🍊' },      // naranja (fruta)
    { id: 'skyblue', name: 'Celeste', icon: '🌊' }      // mar celeste
  ];

  let colorsMode = 'explore';
  let colorsListenTarget = null;

  function colorsCountForAge() {
    if (state.age === '0-12') return 3;
    if (state.age === '1-2') return 4;
    return 7;
  }

  function initColorsWorld() {
    colorsMode = 'explore';
    renderColorsModeSwitcher();
    renderColorsBoard();
  }

  function renderColorsModeSwitcher() {
    const modes = [{ id: 'explore', label: 'Explorar' }];
    if (ageAtLeast('2-3')) modes.push({ id: 'listen', label: 'Tocá el color que suena' });
    renderModeSwitcher('colors-modes', modes, colorsMode, (id) => {
      colorsMode = id;
      renderColorsModeSwitcher();
      renderColorsBoard();
    });
  }

  function renderColorsBoard() {
    const instructions = document.getElementById('colors-instructions');
    const board = document.getElementById('colors-board');
    const message = document.getElementById('colors-message');
    const listenBtn = document.getElementById('btn-colors-listen');
    board.innerHTML = '';
    setMessage(message, '');

    const shown = pick(COLORS, colorsCountForAge());
    const touched = new Set();

    if (colorsMode === 'listen') {
      instructions.textContent = 'Tocá el color que suena';
      colorsListenTarget = shown[Math.floor(Math.random() * shown.length)];
      speak('Tocá el ' + colorsListenTarget.name);
      listenBtn.hidden = false;
      // Aseguramos que el contexto de audio esté "despierto" apenas se
      // arma el tablero, y de nuevo en cada click (fix del bug de
      // "Escuchar" sin sonido en el modo escucha).
      getCtx();
      listenBtn.onclick = () => { getCtx(); Sounds.color(colorsListenTarget.id); };
    } else {
      instructions.textContent = 'Tocá un color';
      listenBtn.hidden = true;
    }

    shown.forEach((color) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'color-btn';
      btn.setAttribute('aria-label', color.name);
      btn.innerHTML = `<span class="icon" aria-hidden="true">${color.icon}</span><span>${color.name}</span>`;
      btn.addEventListener('click', () => {
        getCtx();
        if (colorsMode === 'listen') {
          if (color.id === colorsListenTarget.id) {
            btn.classList.add('touched');
            Sounds.color(color.id);
            setTimeout(() => Sounds.correct(), 150);
            setMessage(message, '¡Lo encontraste!');
            incrementActivities();
            board.querySelectorAll('.color-btn').forEach((b) => (b.disabled = true));
            setTimeout(() => renderColorsBoard(), 900);
          } else {
            btn.classList.remove('retry');
            void btn.offsetWidth;
            btn.classList.add('retry');
            Sounds.error();
            setMessage(message, 'Probemos otra vez', true);
          }
          return;
        }
        btn.classList.remove('touched');
        void btn.offsetWidth;
        btn.classList.add('touched');
        Sounds.color(color.id);
        speak(color.name);
        touched.add(color.id);
        setMessage(message, randomPositive());
        if (touched.size === 1) incrementActivities();
        if (touched.size === shown.length) {
          setTimeout(() => {
            setMessage(message, '¡Descubriste todos los colores! 🎉');
            Sounds.endGame();
            markProgress('colors');
          }, 400);
        }
      });
      board.appendChild(btn);
    });
  }

  /* ============================================================
     MUNDO DE ANIMALITOS
     ============================================================ */
  const ANIMALS = [
    { id: 'duck', icon: '🦆', label: 'Pato', sound: Sounds.duck },
    { id: 'dog', icon: '🐶', label: 'Perro', sound: Sounds.dog },
    { id: 'cat', icon: '🐱', label: 'Gato', sound: Sounds.cat },
    { id: 'cow', icon: '🐮', label: 'Vaca', sound: Sounds.cow },
    { id: 'frog', icon: '🐸', label: 'Rana', sound: Sounds.frog },
    { id: 'sheep', icon: '🐑', label: 'Oveja', sound: Sounds.sheep },
    { id: 'bird', icon: '🐦', label: 'Pajarito', sound: Sounds.bird },
    { id: 'horse', icon: '🐴', label: 'Caballo', sound: Sounds.horse }
  ];

  const ANIMAL_PROMPTS = {
    duck: '¿Dónde está el pato?',
    dog: 'Buscá el perrito',
    cat: 'Tocá el gato',
    cow: '¿Dónde está la vaca?',
    frog: 'Buscá la rana',
    sheep: '¿Dónde está la oveja?',
    bird: 'Buscá el pajarito',
    horse: 'Tocá el caballo'
  };

  let animalsMode = 'explore';
  let animalGameOptions = [];
  let animalRoundQueue = [];
  let animalListenTarget = null;

  function animalOptionsCountForAge() {
    if (state.age === '2-3') return 3;
    return 2;
  }

  function initAnimalsWorld() {
    animalsMode = 'explore';
    renderAnimalsModeSwitcher();
    renderAnimalsForMode();
  }

  function renderAnimalsModeSwitcher() {
    const modes = [
      { id: 'explore', label: 'Explorar' },
      { id: 'find', label: 'Buscar animalito' },
      { id: 'listen', label: 'Escuchar y elegir' }
    ];
    renderModeSwitcher('animals-modes', modes, animalsMode, (id) => {
      animalsMode = id;
      renderAnimalsModeSwitcher();
      renderAnimalsForMode();
    });
  }

  function renderAnimalsForMode() {
    document.getElementById('btn-animals-listen').hidden = true;
    setMessage(document.getElementById('animals-message'), '');
    if (animalsMode === 'explore') renderAnimalsExplore();
    else if (animalsMode === 'find') { animalGameOptions = pick(ANIMALS, animalOptionsCountForAge()); animalRoundQueue = shuffle(animalGameOptions.map((a) => a.id)); nextAnimalFindRound(); }
    else if (animalsMode === 'listen') { animalGameOptions = pick(ANIMALS, animalOptionsCountForAge()); animalRoundQueue = shuffle(animalGameOptions.map((a) => a.id)); nextAnimalListenRound(); }
  }

  function renderAnimalsExplore() {
    const prompt = document.getElementById('animals-prompt');
    const board = document.getElementById('animals-board');
    const message = document.getElementById('animals-message');
    prompt.textContent = 'Tocá un animalito';
    board.innerHTML = '';
    const shown = pick(ANIMALS, animalOptionsCountForAge() + 1);
    const touched = new Set();
    shown.forEach((animal) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'animal-btn';
      btn.setAttribute('aria-label', animal.label);
      btn.innerHTML = `<span class="icon" aria-hidden="true">${animal.icon}</span><span>${animal.label}</span>`;
      btn.addEventListener('click', () => {
        btn.classList.remove('correct');
        void btn.offsetWidth;
        btn.classList.add('correct');
        animal.sound();
        touched.add(animal.id);
        setMessage(message, randomPositive());
        if (touched.size === 1) incrementActivities();
        if (touched.size === shown.length) {
          setTimeout(() => { setMessage(message, '¡Descubriste todos los animalitos! 🐾'); Sounds.endGame(); markProgress('animals'); }, 400);
        }
      });
      board.appendChild(btn);
    });
  }

  function nextAnimalFindRound() {
    const prompt = document.getElementById('animals-prompt');
    const message = document.getElementById('animals-message');
    setMessage(message, '');

    if (animalRoundQueue.length === 0) {
      prompt.textContent = '¡Encontraste todos los animalitos! 🐾';
      document.getElementById('animals-board').innerHTML = '';
      Sounds.endGame();
      markProgress('animals');
      return;
    }

    const targetId = animalRoundQueue.shift();
    const target = animalGameOptions.find((a) => a.id === targetId);
    prompt.textContent = ANIMAL_PROMPTS[targetId] || `Buscá el ${target.label.toLowerCase()}`;
    speak(prompt.textContent);

    const board = document.getElementById('animals-board');
    board.innerHTML = '';
    shuffle(animalGameOptions).forEach((animal) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'animal-btn';
      btn.setAttribute('aria-label', animal.label);
      btn.innerHTML = `<span class="icon" aria-hidden="true">${animal.icon}</span><span>${animal.label}</span>`;
      btn.addEventListener('click', () => {
        if (animal.id === targetId) {
          btn.classList.add('correct');
          animal.sound();
          setTimeout(() => Sounds.correct(), 150);
          setMessage(message, '¡Lo encontraste!');
          incrementActivities();
          board.querySelectorAll('.animal-btn').forEach((b) => (b.disabled = true));
          setTimeout(nextAnimalFindRound, 900);
        } else {
          btn.classList.remove('retry');
          void btn.offsetWidth;
          btn.classList.add('retry');
          Sounds.error();
          setMessage(message, 'Probemos otra vez', true);
        }
      });
      board.appendChild(btn);
    });
  }

  function nextAnimalListenRound() {
    const prompt = document.getElementById('animals-prompt');
    const message = document.getElementById('animals-message');
    const listenBtn = document.getElementById('btn-animals-listen');
    setMessage(message, '');

    if (animalRoundQueue.length === 0) {
      prompt.textContent = '¡Escuchaste y encontraste todos! 🐾';
      document.getElementById('animals-board').innerHTML = '';
      listenBtn.hidden = true;
      Sounds.endGame();
      markProgress('animals');
      return;
    }

    const targetId = animalRoundQueue.shift();
    animalListenTarget = animalGameOptions.find((a) => a.id === targetId);
    prompt.textContent = 'Escuchá y elegí el animalito';
    listenBtn.hidden = false;
    getCtx();
    listenBtn.onclick = () => { getCtx(); animalListenTarget.sound(); };

    const board = document.getElementById('animals-board');
    board.innerHTML = '';
    shuffle(animalGameOptions).forEach((animal) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'animal-btn';
      btn.setAttribute('aria-label', animal.label);
      btn.innerHTML = `<span class="icon" aria-hidden="true">${animal.icon}</span><span>${animal.label}</span>`;
      btn.addEventListener('click', () => {
        if (animal.id === targetId) {
          btn.classList.add('correct');
          animal.sound();
          setTimeout(() => Sounds.correct(), 150);
          setMessage(message, '¡Lo encontraste!');
          incrementActivities();
          listenBtn.hidden = true;
          board.querySelectorAll('.animal-btn').forEach((b) => (b.disabled = true));
          setTimeout(nextAnimalListenRound, 900);
        } else {
          btn.classList.remove('retry');
          void btn.offsetWidth;
          btn.classList.add('retry');
          Sounds.error();
          setMessage(message, 'Probemos otra vez', true);
        }
      });
      board.appendChild(btn);
    });
  }

  /* ============================================================
     MUNDO DE SONIDOS
     ============================================================ */
  const SOUND_OBJECTS = [
    { id: 'bell', icon: '🔔', label: 'Campanita', play: Sounds.bell },
    { id: 'drum', icon: '🥁', label: 'Tambor suave', play: Sounds.drum },
    { id: 'rain', icon: '🌧️', label: 'Lluvia', play: Sounds.rain },
    { id: 'bubble', icon: '🫧', label: 'Burbuja', play: Sounds.bubble },
    { id: 'clap', icon: '👏', label: 'Aplauso', play: Sounds.clap },
    { id: 'wind', icon: '🍃', label: 'Viento', play: Sounds.wind },
    { id: 'laugh', icon: '😄', label: 'Risa suave', play: Sounds.laugh },
    { id: 'sparkle', icon: '✨', label: 'Estrellita mágica', play: Sounds.sparkle }
  ];

  let soundsMode = 'free';
  let memorySequence = [];
  let memoryUserStep = 0;
  let memoryButtons = [];

  function soundsCountForAge() {
    if (state.age === '0-12') return 3;
    if (state.age === '1-2') return 4;
    return 6;
  }

  function initSoundsWorld() {
    soundsMode = 'free';
    renderSoundsModeSwitcher();
    renderSoundsForMode();
  }

  function renderSoundsModeSwitcher() {
    const modes = [{ id: 'free', label: 'Tocar y escuchar' }];
    if (!(state.age === '0-12')) modes.push({ id: 'memory', label: 'Memoria sonora' });
    renderModeSwitcher('sounds-modes', modes, soundsMode, (id) => {
      soundsMode = id;
      renderSoundsModeSwitcher();
      renderSoundsForMode();
    });
  }

  function renderSoundsForMode() {
    const memoryControls = document.getElementById('memory-controls');
    const instructions = document.getElementById('sounds-instructions');
    const message = document.getElementById('sounds-message');
    setMessage(message, '');
    if (soundsMode === 'memory') {
      instructions.textContent = 'Escuchá la secuencia y repetila';
      memoryControls.hidden = false;
      renderSoundsMemory();
    } else {
      instructions.textContent = 'Escuchá el sonido';
      memoryControls.hidden = true;
      renderSoundsFree();
    }
  }

  function renderSoundsFree() {
    const board = document.getElementById('sounds-board');
    const message = document.getElementById('sounds-message');
    board.innerHTML = '';
    const sounds = pick(SOUND_OBJECTS, soundsCountForAge());
    const played = new Set();

    sounds.forEach((snd) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sound-btn';
      btn.setAttribute('aria-label', snd.label);
      btn.innerHTML = `<span class="icon" aria-hidden="true">${snd.icon}</span><span>${snd.label}</span>`;
      btn.addEventListener('click', () => {
        btn.classList.remove('playing');
        void btn.offsetWidth;
        btn.classList.add('playing');
        snd.play();
        played.add(snd.id);
        btn.classList.add('done');
        setMessage(message, randomPositive());
        if (played.size === 1) incrementActivities();
        if (played.size === sounds.length) {
          setTimeout(() => {
            setMessage(message, '¡Escuchaste todos los sonidos! 🎶');
            Sounds.endGame();
            markProgress('sounds');
          }, 300);
        }
      });
      board.appendChild(btn);
    });
  }

  function memorySequenceLength() {
    return state.age === '2-3' ? 3 : 2;
  }

  function renderSoundsMemory() {
    const board = document.getElementById('sounds-board');
    const message = document.getElementById('sounds-message');
    board.innerHTML = '';
    const pool = pick(SOUND_OBJECTS, 4);
    memorySequence = [];
    const length = memorySequenceLength();
    for (let i = 0; i < length; i++) {
      memorySequence.push(pool[Math.floor(Math.random() * pool.length)]);
    }
    memoryUserStep = 0;
    memoryButtons = [];

    pool.forEach((snd) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sound-btn';
      btn.setAttribute('aria-label', snd.label);
      btn.dataset.soundId = snd.id;
      btn.innerHTML = `<span class="icon" aria-hidden="true">${snd.icon}</span><span>${snd.label}</span>`;
      btn.addEventListener('click', () => handleMemoryTap(snd, btn, message));
      board.appendChild(btn);
      memoryButtons.push(btn);
    });

    setMessage(message, 'Tocá "Escuchar secuencia" para empezar');
  }

  document.getElementById('btn-memory-play').addEventListener('click', () => {
    if (soundsMode !== 'memory') return;
    memoryUserStep = 0;
    const message = document.getElementById('sounds-message');
    setMessage(message, 'Escuchá con atención...');
    memorySequence.forEach((snd, i) => {
      setTimeout(() => {
        const btn = memoryButtons.find((b) => b.dataset.soundId === snd.id);
        snd.play();
        if (btn) {
          btn.classList.add('memory-highlight');
          setTimeout(() => btn.classList.remove('memory-highlight'), 350);
        }
        if (i === memorySequence.length - 1) {
          setTimeout(() => setMessage(message, 'Ahora repetí vos la secuencia'), 400);
        }
      }, i * 700);
    });
  });

  function handleMemoryTap(snd, btn, message) {
    const expected = memorySequence[memoryUserStep];
    if (!expected) return;
    if (snd.id === expected.id) {
      btn.classList.add('memory-correct');
      snd.play();
      memoryUserStep++;
      if (memoryUserStep === memorySequence.length) {
        setMessage(message, '¡Repetiste toda la secuencia! 🎉');
        Sounds.endGame();
        incrementActivities();
        markProgress('sounds');
        setTimeout(() => { memoryButtons.forEach((b) => b.classList.remove('memory-correct')); }, 900);
      } else {
        setMessage(message, randomPositive());
      }
    } else {
      Sounds.error();
      setMessage(message, 'Probemos otra vez: escuchá de nuevo la secuencia', true);
      memoryUserStep = 0;
      memoryButtons.forEach((b) => b.classList.remove('memory-correct'));
    }
  }

  /* ============================================================
     MUNDO DE FORMAS
     ============================================================ */
  const SHAPES = [
    { id: 'circle', icon: '⚪', label: 'Círculo' },
    { id: 'square', icon: '🟦', label: 'Cuadrado' },
    { id: 'triangle', icon: '🔺', label: 'Triángulo' },
    { id: 'star', icon: '⭐', label: 'Estrella' },
    { id: 'heart', icon: '❤️', label: 'Corazón' },
    { id: 'cloud', icon: '☁️', label: 'Nube' }
  ];

  let shapesMode = 'explore';
  let shapesFirstSelection = null;
  let shapesMatchedCount = 0;
  let shapesTotalPairs = 0;
  let shapesFindQueue = [];
  let shapesFindOptions = [];

  function initShapesWorld() {
    shapesMode = 'explore';
    renderShapesModeSwitcher();
    renderShapesForMode();
  }

  function renderShapesModeSwitcher() {
    const modes = [{ id: 'explore', label: 'Explorar' }];
    if (!(state.age === '0-12')) {
      modes.push({ id: 'find', label: 'Encontrar forma' });
      modes.push({ id: 'pairs', label: 'Parejas' });
      modes.push({ id: 'size', label: 'Grande y chiquito' });
    }
    renderModeSwitcher('shapes-modes', modes, shapesMode, (id) => {
      shapesMode = id;
      renderShapesModeSwitcher();
      renderShapesForMode();
    });
  }

  function renderShapesForMode() {
    setMessage(document.getElementById('shapes-message'), '');
    if (shapesMode === 'explore') renderShapesExplore();
    else if (shapesMode === 'find') initShapesFind();
    else if (shapesMode === 'pairs') renderShapesPairs();
    else if (shapesMode === 'size') renderShapesSize();
  }

  function renderShapesExplore() {
    const instructions = document.getElementById('shapes-instructions');
    const board = document.getElementById('shapes-board');
    const message = document.getElementById('shapes-message');
    instructions.textContent = 'Tocá una forma';
    board.innerHTML = '';
    const shapes = pick(SHAPES, state.age === '0-12' ? 3 : 5);
    const touched = new Set();
    shapes.forEach((shape) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'shape-btn';
      btn.setAttribute('aria-label', shape.label);
      btn.innerHTML = `<span aria-hidden="true">${shape.icon}</span>`;
      btn.addEventListener('click', () => {
        btn.classList.remove('touched');
        void btn.offsetWidth;
        btn.classList.add('touched');
        Sounds.discovery();
        touched.add(shape.id);
        setMessage(message, randomPositive());
        if (touched.size === 1) incrementActivities();
        if (touched.size === shapes.length) {
          setTimeout(() => { setMessage(message, '¡Descubriste todas las formas! 🧩'); Sounds.endGame(); markProgress('shapes'); }, 400);
        }
      });
      board.appendChild(btn);
    });
  }

  function shapesOptionsCountForAge() {
    return state.age === '2-3' ? 3 : 2;
  }

  function initShapesFind() {
    shapesFindOptions = pick(SHAPES, shapesOptionsCountForAge());
    shapesFindQueue = shuffle(shapesFindOptions.map((s) => s.id));
    nextShapesFindRound();
  }

  function nextShapesFindRound() {
    const instructions = document.getElementById('shapes-instructions');
    const message = document.getElementById('shapes-message');
    setMessage(message, '');

    if (shapesFindQueue.length === 0) {
      instructions.textContent = '¡Encontraste todas las formas! 🧩';
      document.getElementById('shapes-board').innerHTML = '';
      Sounds.endGame();
      markProgress('shapes');
      return;
    }

    const targetId = shapesFindQueue.shift();
    const target = shapesFindOptions.find((s) => s.id === targetId);
    instructions.textContent = `Encontrá la forma: ${target.label}`;
    speak(instructions.textContent);

    const board = document.getElementById('shapes-board');
    board.innerHTML = '';
    shuffle(shapesFindOptions).forEach((shape) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'shape-btn';
      btn.setAttribute('aria-label', shape.label);
      btn.innerHTML = `<span aria-hidden="true">${shape.icon}</span>`;
      btn.addEventListener('click', () => {
        if (shape.id === targetId) {
          btn.classList.add('touched');
          Sounds.correct();
          setMessage(message, '¡Lo encontraste!');
          incrementActivities();
          board.querySelectorAll('.shape-btn').forEach((b) => (b.disabled = true));
          setTimeout(nextShapesFindRound, 900);
        } else {
          btn.classList.remove('retry');
          void btn.offsetWidth;
          btn.classList.add('retry');
          Sounds.error();
          setMessage(message, 'Probemos otra vez', true);
        }
      });
      board.appendChild(btn);
    });
  }

  function renderShapesPairs() {
    const instructions = document.getElementById('shapes-instructions');
    const board = document.getElementById('shapes-board');
    const message = document.getElementById('shapes-message');
    instructions.textContent = 'Encontrá la pareja';
    board.innerHTML = '';
    shapesFirstSelection = null;
    shapesMatchedCount = 0;

    const typesCount = state.age === '1-2' ? 2 : 4;
    const chosenShapes = pick(SHAPES, typesCount);
    shapesTotalPairs = chosenShapes.length;
    const cards = shuffle([...chosenShapes, ...chosenShapes]);

    cards.forEach((shape, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'shape-btn';
      btn.setAttribute('aria-label', shape.label);
      btn.dataset.shapeId = shape.id;
      btn.dataset.cardIndex = String(index);
      btn.innerHTML = `<span aria-hidden="true">${shape.icon}</span>`;
      btn.addEventListener('click', () => handleShapePairClick(btn, shape, message));
      board.appendChild(btn);
    });
  }

  function handleShapePairClick(btn, shape, message) {
    if (btn.classList.contains('matched') || btn.classList.contains('selected')) return;

    if (!shapesFirstSelection) {
      shapesFirstSelection = { btn, shape };
      btn.classList.add('selected');
      setMessage(message, 'Buscá la otra forma igual');
      return;
    }

    if (shapesFirstSelection.btn === btn) return;

    if (shapesFirstSelection.shape.id === shape.id) {
      shapesFirstSelection.btn.classList.remove('selected');
      shapesFirstSelection.btn.classList.add('matched');
      btn.classList.add('matched');
      shapesFirstSelection = null;
      shapesMatchedCount++;
      Sounds.correct();
      incrementActivities();
      setMessage(message, '¡Encontraste la pareja!');
      if (shapesMatchedCount === shapesTotalPairs) {
        setTimeout(() => { setMessage(message, '¡Encontraste todas las parejas! 🧩'); Sounds.endGame(); markProgress('shapes'); }, 400);
      }
    } else {
      btn.classList.remove('retry');
      void btn.offsetWidth;
      btn.classList.add('retry');
      Sounds.error();
      setMessage(message, 'Probemos otra vez', true);
      const first = shapesFirstSelection.btn;
      setTimeout(() => {
        first.classList.remove('selected');
        btn.classList.remove('retry');
        shapesFirstSelection = null;
      }, 700);
    }
  }

  function renderShapesSize() {
    const instructions = document.getElementById('shapes-instructions');
    const board = document.getElementById('shapes-board');
    const message = document.getElementById('shapes-message');
    board.innerHTML = '';
    const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const wantBig = Math.random() < 0.5;
    instructions.textContent = `Tocá el ${shape.label.toLowerCase()} ${wantBig ? 'grande' : 'chiquito'}`;

    const options = shuffle([
      { size: 'big', label: 'grande' },
      { size: 'small', label: 'chiquito' }
    ]);

    options.forEach((opt) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'shape-btn' + (opt.size === 'small' ? ' shape-small' : '');
      btn.setAttribute('aria-label', `${shape.label} ${opt.label}`);
      btn.innerHTML = `<span aria-hidden="true">${shape.icon}</span>`;
      btn.addEventListener('click', () => {
        const correct = (opt.size === 'big') === wantBig;
        if (correct) {
          btn.classList.add('touched');
          Sounds.correct();
          setMessage(message, '¡Muy bien!');
          incrementActivities();
          markProgress('shapes');
          setTimeout(renderShapesSize, 900);
        } else {
          btn.classList.remove('retry');
          void btn.offsetWidth;
          btn.classList.add('retry');
          Sounds.error();
          setMessage(message, 'Probemos otra vez', true);
        }
      });
      board.appendChild(btn);
    });
  }

  /* ============================================================
     MODO CANCIÓN
     ============================================================ */
  function initSongMode() {
    LoopEngine.stop();
    updateSongUI();
  }

  function updateSongUI() {
    const status = document.getElementById('song-status');
    document.querySelectorAll('.song-track-btn').forEach((btn) => {
      const isCurrent = LoopEngine.isPlaying(btn.getAttribute('data-track'));
      btn.setAttribute('aria-pressed', String(isCurrent));
    });
    const labels = { alegre: 'Canción alegre', suave: 'Canción suave', animalitos: 'Canción de animalitos' };
    const current = LoopEngine.current();
    status.textContent = current ? `🎵 Sonando: ${labels[current] || current}` : 'Sin música por ahora.';
  }

  document.querySelectorAll('.song-track-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const track = btn.getAttribute('data-track');
      state.songSelected = track;
      LoopEngine.play(track);
      updateSongUI();
    });
  });

  document.getElementById('btn-song-on').addEventListener('click', () => {
    LoopEngine.play(state.songSelected || 'alegre');
    updateSongUI();
  });

  document.getElementById('btn-song-off').addEventListener('click', () => {
    LoopEngine.stop();
    updateSongUI();
  });

  /* ============================================================
     MODO CALMA
     ============================================================ */
  let breatheInterval = null;
  let breathePhaseInhale = true;

  function stopBreathing() {
    if (breatheInterval) clearInterval(breatheInterval);
    breatheInterval = null;
    const circle = document.getElementById('breathing-circle');
    if (circle) circle.classList.remove('breathing-active');
    const label = document.getElementById('breathing-label');
    if (label) label.textContent = 'Respirar juntitos';
    const btn = document.getElementById('btn-breathe-toggle');
    if (btn) btn.textContent = 'Respirar juntitos';
  }

  function initCalmMode() {
    stopBreathing();
    const melodyBtn = document.getElementById('btn-calm-melody');
    melodyBtn.setAttribute('aria-pressed', 'false');
    melodyBtn.textContent = '🎶 Melodía calma';
  }

  document.getElementById('btn-breathe-toggle').addEventListener('click', () => {
    const circle = document.getElementById('breathing-circle');
    const label = document.getElementById('breathing-label');
    const btn = document.getElementById('btn-breathe-toggle');
    const isActive = circle.classList.contains('breathing-active');
    if (isActive) {
      stopBreathing();
    } else {
      circle.classList.add('breathing-active');
      btn.textContent = 'Dejar de respirar';
      breathePhaseInhale = true;
      label.textContent = 'Inspirá...';
      breatheInterval = setInterval(() => {
        breathePhaseInhale = !breathePhaseInhale;
        label.textContent = breathePhaseInhale ? 'Inspirá...' : 'Espirá...';
      }, 4000);
    }
  });

  document.getElementById('btn-calm-melody').addEventListener('click', () => {
    const btn = document.getElementById('btn-calm-melody');
    if (LoopEngine.isPlaying('calm')) {
      LoopEngine.stop();
      btn.setAttribute('aria-pressed', 'false');
    } else {
      LoopEngine.play('calm');
      btn.setAttribute('aria-pressed', 'true');
    }
  });

  document.getElementById('btn-calm-mute').addEventListener('click', () => {
    LoopEngine.stop();
    const melodyBtn = document.getElementById('btn-calm-melody');
    melodyBtn.setAttribute('aria-pressed', 'false');
  });

  /* ============================================================
     MINI RECORRIDO SENSORIAL
     ============================================================ */
  const JOURNEY_TOTAL_STEPS = 5;

  function initJourney() {
    if (state.data.journeyCompleted) {
      state.data.journeyStep = 1;
      state.data.journeyCompleted = false;
      saveData();
    }
    renderJourneyStep();
  }

  function updateJourneyProgress() {
    const fill = document.getElementById('journey-bar-fill');
    const label = document.getElementById('journey-step-label');
    const step = Math.min(state.data.journeyStep, JOURNEY_TOTAL_STEPS);
    fill.style.width = `${((step - 1) / JOURNEY_TOTAL_STEPS) * 100}%`;
    label.textContent = `Paso ${step} de ${JOURNEY_TOTAL_STEPS}`;
  }

  function advanceJourney() {
    state.data.journeyStep += 1;
    saveData();
    if (state.data.journeyStep > JOURNEY_TOTAL_STEPS) {
      finishJourney();
    } else {
      renderJourneyStep();
    }
  }

  function finishJourney() {
    const fill = document.getElementById('journey-bar-fill');
    const label = document.getElementById('journey-step-label');
    fill.style.width = '100%';
    label.textContent = `Paso ${JOURNEY_TOTAL_STEPS} de ${JOURNEY_TOTAL_STEPS}`;
    document.getElementById('journey-step-content').innerHTML = '';
    setMessage(document.getElementById('journey-message'), '¡Recorriste todo el Mini Mundo Sensorial! 🎉');
    Sounds.endGame();
    state.data.journeyCompleted = true;
    state.data.diplomaUnlocked = true;
    saveData();
    markProgress('journey');
    addStars(2); // bono por completar el recorrido y desbloquear el diploma
    const content = document.getElementById('journey-step-content');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn-primary btn-large';
    btn.textContent = 'Ver mi diploma 🏆';
    btn.addEventListener('click', () => { showScreen('screen-final'); renderDiploma(); });
    content.appendChild(btn);
  }

  function renderJourneyStep() {
    updateJourneyProgress();
    setMessage(document.getElementById('journey-message'), '');
    const content = document.getElementById('journey-step-content');
    content.innerHTML = '';
    const step = state.data.journeyStep;

    if (step === 1) renderJourneyColorsStep(content);
    else if (step === 2) renderJourneyAnimalStep(content);
    else if (step === 3) renderJourneyShapeStep(content);
    else if (step === 4) renderJourneySoundStep(content);
    else if (step === 5) renderJourneyBreatheStep(content);
  }

  function journeyBoard(content) {
    const board = document.createElement('div');
    board.className = 'colors-board';
    content.appendChild(board);
    return board;
  }

  function renderJourneyColorsStep(content) {
    const p = document.createElement('p');
    p.className = 'game-instructions';
    p.textContent = 'Tocá un color';
    content.appendChild(p);
    const board = journeyBoard(content);
    pick(COLORS, 3).forEach((color) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'color-btn';
      btn.setAttribute('aria-label', color.name);
      btn.innerHTML = `<span class="icon" aria-hidden="true">${color.icon}</span><span>${color.name}</span>`;
      btn.addEventListener('click', () => {
        Sounds.color(color.id);
        incrementActivities();
        setMessage(document.getElementById('journey-message'), randomPositive());
        setTimeout(advanceJourney, 500);
      });
      board.appendChild(btn);
    });
  }

  function renderJourneyAnimalStep(content) {
    const p = document.createElement('p');
    p.className = 'game-instructions';
    p.textContent = 'Escuchá un animalito';
    content.appendChild(p);
    const board = journeyBoard(content);
    pick(ANIMALS, 3).forEach((animal) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'animal-btn';
      btn.setAttribute('aria-label', animal.label);
      btn.innerHTML = `<span class="icon" aria-hidden="true">${animal.icon}</span><span>${animal.label}</span>`;
      btn.addEventListener('click', () => {
        animal.sound();
        incrementActivities();
        setMessage(document.getElementById('journey-message'), randomPositive());
        setTimeout(advanceJourney, 500);
      });
      board.appendChild(btn);
    });
  }

  function renderJourneyShapeStep(content) {
    const p = document.createElement('p');
    p.className = 'game-instructions';
    const options = pick(SHAPES, 2);
    const target = options[Math.floor(Math.random() * options.length)];
    p.textContent = `Encontrá la forma: ${target.label}`;
    content.appendChild(p);
    const board = journeyBoard(content);
    shuffle(options).forEach((shape) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'shape-btn';
      btn.setAttribute('aria-label', shape.label);
      btn.innerHTML = `<span aria-hidden="true">${shape.icon}</span>`;
      btn.addEventListener('click', () => {
        if (shape.id === target.id) {
          Sounds.correct();
          incrementActivities();
          setMessage(document.getElementById('journey-message'), '¡Lo encontraste!');
          setTimeout(advanceJourney, 600);
        } else {
          btn.classList.remove('retry');
          void btn.offsetWidth;
          btn.classList.add('retry');
          Sounds.error();
          setMessage(document.getElementById('journey-message'), 'Probemos otra vez', true);
        }
      });
      board.appendChild(btn);
    });
  }

  function renderJourneySoundStep(content) {
    const p = document.createElement('p');
    p.className = 'game-instructions';
    p.textContent = 'Elegí un sonido';
    content.appendChild(p);
    const board = journeyBoard(content);
    pick(SOUND_OBJECTS, 3).forEach((snd) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sound-btn';
      btn.setAttribute('aria-label', snd.label);
      btn.innerHTML = `<span class="icon" aria-hidden="true">${snd.icon}</span><span>${snd.label}</span>`;
      btn.addEventListener('click', () => {
        snd.play();
        incrementActivities();
        setMessage(document.getElementById('journey-message'), randomPositive());
        setTimeout(advanceJourney, 500);
      });
      board.appendChild(btn);
    });
  }

  function renderJourneyBreatheStep(content) {
    const p = document.createElement('p');
    p.className = 'game-instructions';
    p.textContent = 'Respirá con la nube';
    content.appendChild(p);

    const scene = document.createElement('div');
    scene.className = 'calm-scene';
    scene.innerHTML = `
      <span class="calm-cloud" aria-hidden="true">☁️</span>
      <div class="breathing-circle breathing-active"><span>Respirá suave</span></div>
    `;
    content.appendChild(scene);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn-primary btn-large';
    btn.style.marginTop = '1em';
    btn.textContent = 'Ya respiré';
    btn.addEventListener('click', () => {
      incrementActivities();
      advanceJourney();
    });
    content.appendChild(btn);
  }

  /* ============================================================
     DIPLOMA / PANTALLA FINAL
     ============================================================ */
  function renderDiploma() {
    const locked = document.getElementById('diploma-locked');
    const unlocked = document.getElementById('diploma-unlocked');
    if (state.data.diplomaUnlocked) {
      locked.hidden = true;
      unlocked.hidden = false;
      Sounds.applause();
    } else {
      locked.hidden = false;
      unlocked.hidden = true;
    }
  }

  document.getElementById('btn-diploma').addEventListener('click', () => {
    showScreen('screen-final');
    renderDiploma();
  });

  document.getElementById('btn-print').addEventListener('click', () => {
    window.print();
  });

  /* ============================================================
     SISTEMA DE REINICIO — "Jugar de nuevo desde cero"
     ============================================================ */
  const resetModal = document.getElementById('reset-confirm');

  function openResetModal() {
    resetModal.classList.remove('hidden');
  }
  function closeResetModal() {
    resetModal.classList.add('hidden');
  }

  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-action="request-reset"]')) openResetModal();
  });
  document.getElementById('btn-reset-cancel').addEventListener('click', closeResetModal);
  document.getElementById('btn-reset-confirm').addEventListener('click', () => {
    resetExperience();
    closeResetModal();
  });

  function resetExperience() {
    LoopEngine.stop();
    stopBreathing();

    // Reinicia estados temporales de cada juego/mundo
    colorsMode = 'explore';
    colorsListenTarget = null;
    animalsMode = 'explore';
    animalGameOptions = [];
    animalRoundQueue = [];
    animalListenTarget = null;
    soundsMode = 'free';
    memorySequence = [];
    memoryUserStep = 0;
    memoryButtons = [];
    shapesMode = 'explore';
    shapesFirstSelection = null;
    shapesMatchedCount = 0;
    shapesTotalPairs = 0;
    shapesFindQueue = [];
    shapesFindOptions = [];
    state.songSelected = null;

    // Limpia mensajes de feedback visibles
    ['colors-message', 'animals-message', 'sounds-message', 'shapes-message', 'journey-message'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) { el.textContent = ''; el.classList.remove('is-retry'); }
    });
    const songStatus = document.getElementById('song-status');
    if (songStatus) songStatus.textContent = 'Sin música por ahora.';

    // Borra progreso, secciones visitadas, recorrido, actividades y diploma (mantiene preferencias)
    state.data = defaultData();
    saveData();
    state.age = null;
    localStorage.removeItem(KEYS.age);

    updateProgressBadges();
    showScreen('screen-welcome');
  }

  /* ============================================================
     CTA WHATSAPP (editable en BRAND_CONFIG, arriba del archivo)
     ============================================================ */
  const waHref = `https://wa.me/${BRAND_CONFIG.whatsappNumber}?text=${encodeURIComponent(BRAND_CONFIG.whatsappMessage)}`;
  const waLink = document.getElementById('cta-whatsapp');
  if (waLink) waLink.href = waHref;
  const guideBusinessLink = document.getElementById('guide-business-link');
  if (guideBusinessLink) guideBusinessLink.href = waHref;

  /* ============================================================
     INICIALIZACIÓN
     ============================================================ */
  applyBrandConfig();
  applyPreferences();
  updateBgMusicPlayback();
  setupAvatarPicker();
  updatePlayerBadge();
  if (state.age) renderMenu();
  showScreen('screen-welcome');
})();

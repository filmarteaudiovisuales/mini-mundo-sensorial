/* ============================================================
   Mini Mundo Sensorial — Filmarte Escuela Creativa
   Desarrollado por Digital Carmelo
   HTML + CSS + JavaScript puro. Sin frameworks, sin backend.
   Sonidos y canciones generados con Web Audio API (sin archivos externos).
   ============================================================ */
(() => {
  'use strict';

  /* ---------- EDITÁ ACÁ EL NÚMERO DE WHATSAPP ---------- */
  const WHATSAPP_NUMBER = '5490000000000'; // formato: código país + número, sin espacios ni signos
  const WHATSAPP_MESSAGE = 'Hola! Vi Mini Mundo Sensorial y quiero una versión personalizada 💛';

  /* ---------- Claves de localStorage (sin datos sensibles) ---------- */
  const KEYS = {
    age: 'mms_age',
    sound: 'mms_sound',
    contrast: 'mms_contrast',
    motion: 'mms_reduceMotion',
    data: 'mms_progress'
  };

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

  /* ---------- Estado en memoria (reflejo de localStorage) ---------- */
  const state = {
    age: localStorage.getItem(KEYS.age) || null,
    sound: localStorage.getItem(KEYS.sound) !== 'false',
    contrast: localStorage.getItem(KEYS.contrast) === 'true',
    motion: localStorage.getItem(KEYS.motion) === 'true',
    data: safeParseData(localStorage.getItem(KEYS.data)),
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
    state.data.progress[key] = true;
    saveData();
    updateProgressBadges();
  }

  function incrementActivities() {
    state.data.activities += 1;
    saveData();
  }

  /* ============================================================
     SONIDOS — Web Audio API (sin archivos externos)
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
    correct() {
      tone({ freq: 523.25, duration: 0.15 });
      tone({ freq: 659.25, duration: 0.2, delay: 0.12 });
    },
    discovery() {
      tone({ freq: 392, duration: 0.12 });
      tone({ freq: 494, duration: 0.12, delay: 0.1 });
      tone({ freq: 659, duration: 0.25, delay: 0.2 });
    },
    applause() {
      for (let i = 0; i < 5; i++) {
        noiseBurst({ delay: i * 0.09, duration: 0.08, filterFreq: 1800 + Math.random() * 800, volume: 0.1 });
      }
    },
    error() {
      tone({ freq: 320, duration: 0.22, type: 'sine', glideTo: 250, volume: 0.14 });
    },
    endGame() {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone({ freq: f, duration: 0.2, delay: i * 0.15 }));
    },
    bell() { tone({ freq: 1046.5, duration: 0.6, type: 'triangle', volume: 0.15 }); },
    drum() { tone({ freq: 110, duration: 0.18, type: 'sine', volume: 0.3 }); noiseBurst({ duration: 0.1, volume: 0.1, filterFreq: 200 }); },
    rain() { for (let i = 0; i < 6; i++) noiseBurst({ delay: i * 0.06, duration: 0.12, filterFreq: 3000 + Math.random() * 2000, volume: 0.06 }); },
    bird() { tone({ freq: 1500, duration: 0.08, glideTo: 2200 }); tone({ freq: 1800, duration: 0.1, delay: 0.12, glideTo: 1400 }); },
    clap() { noiseBurst({ duration: 0.06, filterFreq: 2500, volume: 0.2 }); },
    bubble() { tone({ freq: 300, duration: 0.2, glideTo: 900, volume: 0.15 }); },
    wind() { for (let i = 0; i < 3; i++) noiseBurst({ delay: i * 0.25, duration: 0.5, filterFreq: 500 + Math.random() * 300, volume: 0.05 }); },
    laugh() { [700, 850, 750, 900].forEach((f, i) => tone({ freq: f, duration: 0.1, delay: i * 0.11, type: 'triangle', volume: 0.1 })); },
    sparkle() { [1046, 1318, 1568, 2093].forEach((f, i) => tone({ freq: f, duration: 0.12, delay: i * 0.08, type: 'triangle', volume: 0.08 })); },
    duck() { tone({ freq: 300, duration: 0.15, type: 'square', volume: 0.08, glideTo: 220 }); },
    dog() { tone({ freq: 200, duration: 0.12, type: 'square', volume: 0.12 }); tone({ freq: 180, duration: 0.12, delay: 0.15, type: 'square', volume: 0.12 }); },
    cat() { tone({ freq: 700, duration: 0.2, type: 'sine', glideTo: 900, volume: 0.12 }); },
    cow() { tone({ freq: 150, duration: 0.4, type: 'sawtooth', volume: 0.08, glideTo: 130 }); },
    frog() { tone({ freq: 250, duration: 0.1, type: 'square', volume: 0.1 }); tone({ freq: 250, duration: 0.1, delay: 0.13, type: 'square', volume: 0.1 }); },
    sheep() { tone({ freq: 320, duration: 0.14, type: 'sine', volume: 0.1, glideTo: 260 }); tone({ freq: 300, duration: 0.14, delay: 0.16, type: 'sine', volume: 0.1, glideTo: 240 }); },
    horse() { tone({ freq: 180, duration: 0.18, type: 'sawtooth', volume: 0.1, glideTo: 280 }); tone({ freq: 260, duration: 0.15, delay: 0.2, type: 'sawtooth', volume: 0.08, glideTo: 160 }); },
    color(id) {
      const map = {
        yellow: () => tone({ freq: 880, duration: 0.3, type: 'triangle', volume: 0.12 }),
        blue: () => tone({ freq: 440, duration: 0.35, type: 'sine', volume: 0.14, glideTo: 500 }),
        red: () => { tone({ freq: 300, duration: 0.12, type: 'sine', volume: 0.14 }); tone({ freq: 300, duration: 0.12, delay: 0.2, type: 'sine', volume: 0.14 }); },
        green: () => noiseBurst({ duration: 0.3, volume: 0.08, filterFreq: 2200 }),
        purple: () => tone({ freq: 600, duration: 0.3, type: 'triangle', volume: 0.12, glideTo: 800 }),
        orange: () => { tone({ freq: 300, duration: 0.1, type: 'sine', volume: 0.14 }); tone({ freq: 220, duration: 0.15, delay: 0.12, type: 'sine', volume: 0.12 }); }
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
     PREFERENCIAS: sonido / contraste / movimiento
     ============================================================ */
  const btnSound = document.getElementById('btn-sound');
  const btnContrast = document.getElementById('btn-contrast');
  const btnMotion = document.getElementById('btn-motion');

  function applyPreferences() {
    document.body.classList.toggle('contrast', state.contrast);
    document.body.classList.toggle('reduce-motion', state.motion);

    btnSound.setAttribute('aria-pressed', String(state.sound));
    btnSound.querySelector('.tool-icon').textContent = state.sound ? '🔊' : '🔇';
    btnSound.setAttribute('aria-label', state.sound ? 'Sonido activado. Tocar para silenciar' : 'Sonido silenciado. Tocar para activar');

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
    if (navEl) showScreen(navEl.getAttribute('data-nav'));
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
     ============================================================ */
  const COLORS = [
    { id: 'yellow', name: 'Amarillo', icon: '☀️' },
    { id: 'blue', name: 'Azul', icon: '💧' },
    { id: 'red', name: 'Rojo', icon: '❤️' },
    { id: 'green', name: 'Verde', icon: '🍃' },
    { id: 'purple', name: 'Violeta', icon: '⭐' },
    { id: 'orange', name: 'Naranja', icon: '⚽' }
  ];

  let colorsMode = 'explore';
  let colorsListenTarget = null;

  function colorsCountForAge() {
    if (state.age === '0-12') return 3;
    if (state.age === '1-2') return 4;
    return 6;
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
      listenBtn.hidden = false;
      listenBtn.onclick = () => Sounds.color(colorsListenTarget.id);
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
    listenBtn.onclick = () => animalListenTarget.sound();

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
     CTA WHATSAPP (editable arriba en WHATSAPP_NUMBER)
     ============================================================ */
  const waLink = document.getElementById('cta-whatsapp');
  waLink.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

  /* ============================================================
     INICIALIZACIÓN
     ============================================================ */
  applyPreferences();
  if (state.age) renderMenu();
  showScreen('screen-welcome');
})();

/* ============================================================
   Mini Mundo Sensorial — lógica de la app
   HTML + CSS + JavaScript puro. Sin frameworks, sin backend.
   Sonidos generados con Web Audio API (sin archivos externos).
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
    progress: 'mms_progress'
  };

  /* ---------- Estado en memoria (reflejo de localStorage) ---------- */
  const state = {
    age: localStorage.getItem(KEYS.age) || null,
    sound: localStorage.getItem(KEYS.sound) !== 'false',
    contrast: localStorage.getItem(KEYS.contrast) === 'true',
    motion: localStorage.getItem(KEYS.motion) === 'true',
    progress: safeParse(localStorage.getItem(KEYS.progress), { touch: false, sounds: false, animal: false, shapes: false })
  };

  function safeParse(json, fallback) {
    try {
      const parsed = JSON.parse(json);
      return parsed && typeof parsed === 'object' ? { ...fallback, ...parsed } : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function saveProgress() {
    localStorage.setItem(KEYS.progress, JSON.stringify(state.progress));
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
    duck() { tone({ freq: 300, duration: 0.15, type: 'square', volume: 0.08, glideTo: 220 }); },
    cat() { tone({ freq: 700, duration: 0.2, type: 'sine', glideTo: 900, volume: 0.12 }); },
    dog() { tone({ freq: 200, duration: 0.12, type: 'square', volume: 0.12 }); tone({ freq: 180, duration: 0.12, delay: 0.15, type: 'square', volume: 0.12 }); },
    cow() { tone({ freq: 150, duration: 0.4, type: 'sawtooth', volume: 0.08, glideTo: 130 }); },
    frog() { tone({ freq: 250, duration: 0.1, type: 'square', volume: 0.1 }); tone({ freq: 250, duration: 0.1, delay: 0.13, type: 'square', volume: 0.1 }); }
  };

  /* ============================================================
     NAVEGACIÓN ENTRE PANTALLAS
     ============================================================ */
  function showScreen(id) {
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
     NAVEGACIÓN GENÉRICA (data-nav)
     ============================================================ */
  document.addEventListener('click', (e) => {
    const navEl = e.target.closest('[data-nav]');
    if (navEl) {
      showScreen(navEl.getAttribute('data-nav'));
    }
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

  const AGE_LABELS = {
    '0-12': '0 a 12 meses',
    '1-2': '1 a 2 años',
    '2-3': '2 a 3 años'
  };

  function renderMenu() {
    const label = document.getElementById('menu-age-label');
    label.textContent = state.age ? `Franja de edad: ${AGE_LABELS[state.age]}` : '';
    updateProgressBadges();
  }

  function updateProgressBadges() {
    document.querySelectorAll('.progress-badge').forEach((badge) => {
      const key = badge.getAttribute('data-progress');
      badge.hidden = !state.progress[key];
    });
  }

  /* ============================================================
     BOTONES DE JUEGO EN EL MENÚ
     ============================================================ */
  document.querySelectorAll('[data-game]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const screenId = btn.getAttribute('data-game');
      showScreen(screenId);
      if (screenId === 'screen-game-touch') initTouchGame();
      if (screenId === 'screen-game-sounds') initSoundsGame();
      if (screenId === 'screen-game-animal') initAnimalGame();
      if (screenId === 'screen-game-shapes') initShapesGame();
    });
  });

  function markProgress(key) {
    state.progress[key] = true;
    saveProgress();
    updateProgressBadges();
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
    return shuffle(array).slice(0, n);
  }

  const POSITIVE_MESSAGES = ['¡Muy bien!', '¡Qué lindo!', '¡Otra vez!', '¡Descubriste una sorpresa!'];
  function randomPositive() {
    return POSITIVE_MESSAGES[Math.floor(Math.random() * POSITIVE_MESSAGES.length)];
  }

  function setMessage(el, text, isRetry) {
    el.textContent = text;
    el.classList.toggle('is-retry', !!isRetry);
  }

  /* ============================================================
     JUEGO 1: TOCÁ Y DESCUBRÍ
     ============================================================ */
  const FIGURES = [
    { id: 'star', icon: '⭐', label: 'Estrella' },
    { id: 'heart', icon: '❤️', label: 'Corazón' },
    { id: 'circle', icon: '⚪', label: 'Círculo' },
    { id: 'cloud', icon: '☁️', label: 'Nube' },
    { id: 'sun', icon: '☀️', label: 'Sol' }
  ];

  function figuresCountForAge() {
    if (state.age === '0-12') return 2;
    if (state.age === '1-2') return 3;
    return 4;
  }

  function initTouchGame() {
    const board = document.getElementById('touch-board');
    const message = document.getElementById('touch-message');
    board.innerHTML = '';
    setMessage(message, '');

    const figures = pick(FIGURES, figuresCountForAge());
    const touched = new Set();

    figures.forEach((fig) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'figure-btn';
      btn.setAttribute('aria-label', fig.label);
      btn.innerHTML = `<span aria-hidden="true">${fig.icon}</span>`;
      btn.addEventListener('click', () => {
        btn.classList.remove('touched');
        void btn.offsetWidth; // reinicia animación
        btn.classList.add('touched');
        touched.add(fig.id);
        if (touched.size % 2 === 0) Sounds.discovery();
        else Sounds.correct();
        setMessage(message, randomPositive());
        if (touched.size === figures.length) {
          setTimeout(() => {
            setMessage(message, '¡Descubriste todas las figuras! 🎉');
            Sounds.endGame();
            markProgress('touch');
          }, 400);
        }
      });
      board.appendChild(btn);
    });
  }

  /* ============================================================
     JUEGO 2: SONIDOS MÁGICOS
     ============================================================ */
  const SOUND_OBJECTS = [
    { id: 'bell', icon: '🔔', label: 'Campanita', play: Sounds.bell },
    { id: 'drum', icon: '🥁', label: 'Tambor', play: Sounds.drum },
    { id: 'rain', icon: '🌧️', label: 'Lluvia', play: Sounds.rain },
    { id: 'bird', icon: '🐦', label: 'Pajarito', play: Sounds.bird },
    { id: 'clap', icon: '👏', label: 'Aplauso', play: Sounds.clap },
    { id: 'bubble', icon: '🫧', label: 'Burbuja', play: Sounds.bubble }
  ];

  function soundsCountForAge() {
    if (state.age === '0-12') return 3;
    if (state.age === '1-2') return 4;
    return 6;
  }

  function initSoundsGame() {
    const board = document.getElementById('sounds-board');
    const message = document.getElementById('sounds-message');
    const hint = document.getElementById('sounds-hint');
    board.innerHTML = '';
    setMessage(message, '');
    hint.hidden = state.age !== '2-3';

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

  /* ============================================================
     JUEGO 3: ENCONTRÁ EL ANIMALITO
     ============================================================ */
  const ANIMALS = [
    { id: 'duck', icon: '🦆', label: 'Pato', sound: Sounds.duck },
    { id: 'cat', icon: '🐱', label: 'Gato', sound: Sounds.cat },
    { id: 'dog', icon: '🐶', label: 'Perro', sound: Sounds.dog },
    { id: 'cow', icon: '🐮', label: 'Vaca', sound: Sounds.cow },
    { id: 'frog', icon: '🐸', label: 'Rana', sound: Sounds.frog }
  ];

  const ANIMAL_PROMPTS = {
    duck: '¿Dónde está el pato?',
    cat: 'Tocá el gato',
    dog: 'Buscá el perrito',
    cow: '¿Dónde está la vaca?',
    frog: 'Buscá la rana'
  };

  function animalOptionsCountForAge() {
    if (state.age === '2-3') return 3;
    return 2;
  }

  let animalGameOptions = [];
  let animalRoundQueue = [];

  function initAnimalGame() {
    const count = animalOptionsCountForAge();
    animalGameOptions = pick(ANIMALS, count);
    animalRoundQueue = shuffle(animalGameOptions.map((a) => a.id));
    nextAnimalRound();
  }

  function nextAnimalRound() {
    const message = document.getElementById('animal-message');
    setMessage(message, '');
    const prompt = document.getElementById('animal-prompt');

    if (animalRoundQueue.length === 0) {
      prompt.textContent = '¡Encontraste todos los animalitos! 🐾';
      document.getElementById('animal-board').innerHTML = '';
      Sounds.endGame();
      markProgress('animal');
      return;
    }

    const targetId = animalRoundQueue.shift();
    const target = animalGameOptions.find((a) => a.id === targetId);
    prompt.textContent = ANIMAL_PROMPTS[targetId] || `Buscá el ${target.label.toLowerCase()}`;

    const board = document.getElementById('animal-board');
    board.innerHTML = '';
    const order = shuffle(animalGameOptions);

    order.forEach((animal) => {
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
          board.querySelectorAll('.animal-btn').forEach((b) => (b.disabled = true));
          setTimeout(nextAnimalRound, 900);
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
     JUEGO 4: PAREJAS DE FORMAS
     ============================================================ */
  const SHAPES = [
    { id: 'circle', icon: '⚪', label: 'Círculo' },
    { id: 'star', icon: '⭐', label: 'Estrella' },
    { id: 'heart', icon: '❤️', label: 'Corazón' },
    { id: 'triangle', icon: '🔺', label: 'Triángulo' },
    { id: 'square', icon: '🟦', label: 'Cuadrado' }
  ];

  let shapesFirstSelection = null;
  let shapesMatchedCount = 0;
  let shapesTotalPairs = 0;

  function initShapesGame() {
    const board = document.getElementById('shapes-board');
    const message = document.getElementById('shapes-message');
    const instructions = document.getElementById('shapes-instructions');
    board.innerHTML = '';
    setMessage(message, '');
    shapesFirstSelection = null;
    shapesMatchedCount = 0;

    if (state.age === '0-12') {
      // Modo exploración: tocar formas libremente, sin obligación de emparejar.
      instructions.textContent = 'Tocá una forma';
      shapesTotalPairs = 0;
      const shapes = pick(SHAPES, 3);
      shapes.forEach((shape) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'shape-btn';
        btn.setAttribute('aria-label', shape.label);
        btn.innerHTML = `<span aria-hidden="true">${shape.icon}</span>`;
        btn.addEventListener('click', () => {
          btn.classList.remove('matched');
          void btn.offsetWidth;
          btn.classList.add('matched');
          Sounds.discovery();
          setMessage(message, randomPositive());
        });
        board.appendChild(btn);
      });
      return;
    }

    instructions.textContent = 'Encontrá la pareja';
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
      btn.addEventListener('click', () => handleShapeClick(btn, shape, message));
      board.appendChild(btn);
    });
  }

  function handleShapeClick(btn, shape, message) {
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
      setMessage(message, '¡Encontraste la pareja!');
      if (shapesMatchedCount === shapesTotalPairs) {
        setTimeout(() => {
          setMessage(message, '¡Encontraste todas las parejas! 🧩');
          Sounds.endGame();
          markProgress('shapes');
        }, 400);
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

  /* ============================================================
     PANTALLA FINAL / DIPLOMA
     ============================================================ */
  document.getElementById('btn-diploma').addEventListener('click', () => {
    showScreen('screen-final');
    Sounds.applause();
  });

  document.getElementById('btn-play-again').addEventListener('click', () => {
    state.progress = { touch: false, sounds: false, animal: false, shapes: false };
    saveProgress();
    updateProgressBadges();
    showScreen('screen-menu');
  });

  document.getElementById('btn-print').addEventListener('click', () => {
    window.print();
  });

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

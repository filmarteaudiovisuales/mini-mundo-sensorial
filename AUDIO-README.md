# Sistema de jugadores (avatar + estrellas)

Se agregó una pantalla "¿Quién está jugando?" con avatar a elección y contador de estrellas (una estrella por cada mundo completado, +2 de bono al terminar el Mini Recorrido y desbloquear el diploma).

Importante: esto se guarda en `localStorage`, igual que el resto del progreso — **es local a cada dispositivo/navegador**, no se sincroniza entre tablets distintas. Si más adelante hace falta que las estrellas viajen entre dispositivos (por ejemplo, un mismo peque jugando en varias tablets del jardín), hay que sumar un backend real (Firebase, Supabase, etc.), que es un desarrollo aparte.

También se agregó un botón "Voz" 🗣️ en la barra superior: usa la síntesis de voz nativa del navegador (Web Speech API, en español) para decir en voz alta las consignas ("Tocá el rojo", "Buscá el pato"). Es gratis, no necesita archivos, y se puede silenciar independientemente del sonido y la música.

# Cómo sumar sonidos y música reales a Mini Mundo Sensorial

El código ya está preparado: si subís los archivos con estos nombres exactos, la app los usa automáticamente. Si un archivo falta, sigue sonando el efecto sintetizado de siempre (no se rompe nada).

## Estructura de carpetas (junto a index.html)

```
mini-mundo-sensorial/
├── index.html
├── script.js
├── style.css
└── assets/
    ├── music/
    │   └── background.mp3      ← música de fondo continua (loop, todo el rato)
    └── sounds/
        ├── animals/
        │   ├── duck.mp3
        │   ├── dog.mp3
        │   ├── cat.mp3
        │   ├── cow.mp3
        │   ├── frog.mp3
        │   ├── sheep.mp3
        │   ├── bird.mp3
        │   └── horse.mp3
        └── fx/
            ├── bell.mp3
            ├── drum.mp3
            ├── rain.mp3
            ├── bubble.mp3
            ├── clap.mp3
            ├── wind.mp3
            ├── laugh.mp3
            ├── sparkle.mp3
            ├── correct.mp3
            ├── error.mp3
            ├── applause.mp3
            └── endgame.mp3
```

Recomendación: mp3 cortos (0.5–2 seg para efectos), volumen ya normalizado, sin silencios largos al inicio.

## Dónde conseguirlos gratis y con licencia clara

**Sonidos de animales**
- Mixkit – Animales: https://mixkit.co/free-sound-effects/animals/ (licencia Mixkit, gratis, sin atribución obligatoria)
- Zapsplat – Animales: https://www.zapsplat.com/sound-effect-category/animals/ (gratis con cuenta, mp3/wav)
- Freesound (filtro CC0, dominio público): https://freesound.org — buscar "duck", "dog bark", "cat meow", "cow moo", "frog", "sheep", "horse neigh"

**Efectos (campana, tambor, aplauso, burbuja, etc.)**
- Mixkit – Efectos generales: https://mixkit.co/free-sound-effects/ (buscar "bell", "drum", "bubble", "applause", "chime")
- Zapsplat: https://www.zapsplat.com

**Música de fondo / calma**
- Mixkit – Música calma: https://mixkit.co/free-stock-music/mood/calm/
- Mixkit – Música para niños: https://mixkit.co/free-stock-music/children/
- Chosic (filtros por mood, incluye licencias CC): https://www.chosic.com/free-music/lullaby/

## Importante sobre licencias
- Mixkit: gratis para proyectos propios, no permite reventa del audio suelto ni uso en TV/radio/videojuegos comerciales grandes — para una app educativa como esta, entra bien dentro del uso permitido, pero conviene leer los términos antes de publicar (https://mixkit.co/license/).
- Zapsplat: gratis con atribución o cuenta paga sin atribución; revisar su licencia según el plan.
- Freesound: cada sonido tiene su propia licencia (CC0, CC-BY, etc.) — filtrar por CC0 si querés evitar tener que citar autor.

Ninguno de estos links requiere pago para el uso que le vas a dar, pero como no soy abogado, vale la pena que alguien del equipo lea la licencia final antes de publicar la app.

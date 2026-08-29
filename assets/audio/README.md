# assets/audio/

Por defecto, **CodeCraft Workshop no usa archivos de audio**: los efectos (click, compra,
fabricación, éxito, error, subir de nivel, evento) se **sintetizan** con la Web Audio API en
`js/services/AudioManager.js`. Así el juego nunca se rompe en GitHub Pages por un archivo que
falte.

## Para usar tus propios sonidos

1. Coloca aquí archivos `.mp3` u `.ogg`, por ejemplo:
   ```
   assets/audio/click.mp3
   assets/audio/craft.mp3
   assets/audio/success.mp3
   assets/audio/error.mp3
   assets/audio/level.mp3
   ```
2. En `js/services/AudioManager.js`, sustituye la síntesis por reproducción de archivos:
   ```js
   play(name) {
     const a = new Audio(`./assets/audio/${name}.mp3`);
     a.volume = this._volume;
     a.play().catch(() => {});   // ignora bloqueo por falta de interacción
   }
   ```
3. Usa **rutas relativas** (`./assets/audio/…`) para que funcione en GitHub Pages.

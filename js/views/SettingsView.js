import { el, $ } from "./ui/dom.js";

/**
 * SettingsView — panel de AJUSTES. Se abre desde el menú y desde el botón ⚙️
 * del HUD. Audio (música / efectos + volúmenes), pantalla completa y reinicios.
 * Las preferencias de audio se guardan solas vía AudioManager.
 * El contenido es scrollable (.modal-frame) para caber en móviles pequeños.
 */
export class SettingsView {
  #audio; #save; #onIntro;

  constructor(audio, save, onIntro) {
    this.#audio = audio;
    this.#save = save ?? null;
    this.#onIntro = typeof onIntro === "function" ? onIntro : null;
    this.root = el("div", { class: "modal", attrs: { id: "settings" } });
    this.frame = el("div", { class: "modal-frame wood" });
    this.root.append(this.frame);
    // Cerrar tocando fuera SOLO si no se está en mitad de un formulario.
    this.root.addEventListener("click", (e) => { if (e.target === this.root) this.close(); });
    $("#ui").append(this.root);

    this.frame.addEventListener("input", (e) => {
      const t = e.target;
      if (t.id === "mvol") this.#audio.setMusicVol(t.value / 100);
      if (t.id === "svol") { this.#audio.setSfxVol(t.value / 100); this.#audio.play("click"); }
    });
    this.frame.addEventListener("click", (e) => {
      const act = e.target.closest("[data-act]")?.dataset.act;
      if (act === "music") { this.#audio.setMusicOn(!this.#audio.prefs.musicOn); this.#render(); }
      if (act === "sfx") { this.#audio.setSfxOn(!this.#audio.prefs.sfxOn); this.#audio.play("click"); this.#render(); }
      if (act === "fs") { toggleFullscreen(); }
      if (act === "intro" && this.#onIntro) { this.close(); this.#onIntro(() => this.open()); }
      if (act === "retut") this.#confirmReset(true);
      if (act === "reset") this.#confirmReset(false);
      if (act === "close") this.close();
    });

    // Redibujar el estado de "pantalla completa" cuando cambie.
    document.addEventListener("fullscreenchange", () => { if (this.isOpen) this.#render(); });
    document.addEventListener("webkitfullscreenchange", () => { if (this.isOpen) this.#render(); });
  }

  open() { this.#audio.unlock(); this.#render(); this.root.classList.add("open"); }
  close() { this.root.classList.remove("open"); }
  get isOpen() { return this.root.classList.contains("open"); }

  #confirmReset(tutorialOnly) {
    const msg = tutorialOnly
      ? "¿Volver a ver el tutorial guiado desde el principio? Tu progreso NO se borra."
      : "¿Borrar la partida y empezar de cero? Se perderá TODO el progreso.";
    if (!window.confirm(msg)) return;
    if (tutorialOnly) {
      try { this.#save?.patch?.({ tutorialCompleted: false, tutorialStep: 0 }); } catch { /* noop */ }
      sessionStorage.setItem("cc:tutorial", "1");
    } else {
      this.#save?.reset?.();
      sessionStorage.setItem("cc:tutorial", "1");
    }
    location.reload();
  }

  #render() {
    const p = this.#audio.prefs;
    const toggle = (on) => `<span class="set-toggle ${on ? "on" : ""}">${on ? "ON" : "OFF"}</span>`;
    const fsOn = !!(document.fullscreenElement || document.webkitFullscreenElement);
    const fsSupported = !!(document.documentElement.requestFullscreen ||
      document.documentElement.webkitRequestFullscreen);
    this.frame.innerHTML = `<div class="wood-panel set-panel">
      <h2>⚙️ Ajustes</h2>

      <div class="set-row">
        <span>🎵 Música</span>
        <button class="k sm" data-act="music">${toggle(p.musicOn)}</button>
      </div>
      <div class="set-row">
        <span>Volumen música</span>
        <input id="mvol" type="range" min="0" max="100" value="${Math.round(p.musicVol * 100)}"
          aria-label="Volumen de la música" />
      </div>
      <div class="set-row">
        <span>🔊 Efectos</span>
        <button class="k sm" data-act="sfx">${toggle(p.sfxOn)}</button>
      </div>
      <div class="set-row">
        <span>Volumen efectos</span>
        <input id="svol" type="range" min="0" max="100" value="${Math.round(p.sfxVol * 100)}"
          aria-label="Volumen de los efectos" />
      </div>

      ${fsSupported ? `<div class="set-row">
        <span>⛶ Pantalla completa</span>
        <button class="k sm" data-act="fs">${fsOn ? "SALIR" : "ACTIVAR"}</button>
      </div>` : ""}

      ${this.#onIntro ? `<div class="set-row">
        <span>🎓 Ver introducción educativa</span>
        <button class="k sm" data-act="intro">VER</button>
      </div>` : ""}

      ${this.#save ? `<div class="set-row">
        <span>↻ Reiniciar tutorial</span>
        <button class="k sm" data-act="retut">VER</button>
      </div>
      <div class="set-row">
        <span>🗑️ Reiniciar partida</span>
        <button class="k sm bad" data-act="reset">BORRAR</button>
      </div>` : ""}

      ${this.#audio.blocked ? `<p class="wp-sub">Toca "Activar sonido" o interactúa con el juego para habilitar el audio.</p>` : ""}
      <button class="k close" data-act="close">Cerrar [ESC]</button>
    </div>`;
  }
}

/** Fullscreen API con prefijo webkit (Safari/iOS). Requiere gesto del usuario. */
export function toggleFullscreen() {
  try {
    const on = document.fullscreenElement || document.webkitFullscreenElement;
    if (on) {
      (document.exitFullscreen || document.webkitExitFullscreen)?.call(document);
    } else {
      const e = document.documentElement;
      (e.requestFullscreen || e.webkitRequestFullscreen)?.call(e);
    }
  } catch { /* algunos navegadores móviles no lo permiten: se ignora sin error */ }
}

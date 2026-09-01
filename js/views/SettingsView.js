import { el, $ } from "./ui/dom.js";

/**
 * SettingsView — panel de AJUSTES (audio). Se abre desde el menú y desde el
 * botón ⚙️ del HUD. Guarda las preferencias en localStorage a través del
 * AudioManager.
 */
export class SettingsView {
  #audio;

  constructor(audio) {
    this.#audio = audio;
    this.root = el("div", { class: "modal", attrs: { id: "settings" } });
    this.frame = el("div", { class: "modal-frame wood" });
    this.root.append(this.frame);
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
      if (act === "close") this.close();
    });
  }

  open() { this.#audio.unlock(); this.#render(); this.root.classList.add("open"); }
  close() { this.root.classList.remove("open"); }
  get isOpen() { return this.root.classList.contains("open"); }

  #render() {
    const p = this.#audio.prefs;
    const toggle = (on) => `<span class="set-toggle ${on ? "on" : ""}">${on ? "ON" : "OFF"}</span>`;
    this.frame.innerHTML = `<div class="wood-panel set-panel">
      <h2>⚙️ Ajustes</h2>
      <div class="set-row">
        <span>🎵 Música</span>
        <button class="k sm" data-act="music">${toggle(p.musicOn)}</button>
      </div>
      <div class="set-row">
        <span>Volumen música</span>
        <input id="mvol" type="range" min="0" max="100" value="${Math.round(p.musicVol * 100)}" />
      </div>
      <div class="set-row">
        <span>🔊 Efectos</span>
        <button class="k sm" data-act="sfx">${toggle(p.sfxOn)}</button>
      </div>
      <div class="set-row">
        <span>Volumen efectos</span>
        <input id="svol" type="range" min="0" max="100" value="${Math.round(p.sfxVol * 100)}" />
      </div>
      ${this.#audio.blocked ? `<p class="wp-sub">Toca "Activar sonido" o interactúa con el juego para habilitar el audio.</p>` : ""}
      <button class="k close" data-act="close">Cerrar [ESC]</button>
    </div>`;
  }
}

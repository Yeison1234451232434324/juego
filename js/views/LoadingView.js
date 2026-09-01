import { el, $ } from "./ui/dom.js";
import { CONFIG } from "../config/gameConfig.js";

/**
 * LoadingView — pantalla de carga que aparece mientras se ESTÁ CREANDO algo:
 * fabricando un mueble en el banco o cortando material en la máquina.
 *
 * No bloquea el juego (no usa la clase .modal): el jugador puede seguir
 * moviéndose mientras Mario trabaja. Muestra el progreso real en tiempo real.
 */
export class LoadingView {
  #root; #fill; #pct; #title; #sub; #hideT = null;

  constructor(bus) {
    this.#root = el("div", { class: "loading-screen hidden" });
    this.#root.innerHTML = `
      <div class="ls-card">
        <div class="ls-spin">⚙️</div>
        <div class="ls-text">
          <b class="ls-title">Trabajando…</b>
          <div class="ls-bar"><i class="ls-fill"></i></div>
          <span class="ls-sub"></span>
        </div>
        <span class="ls-pct">0%</span>
      </div>`;
    $("#ui").append(this.#root);
    this.#fill = this.#root.querySelector(".ls-fill");
    this.#pct = this.#root.querySelector(".ls-pct");
    this.#title = this.#root.querySelector(".ls-title");
    this.#sub = this.#root.querySelector(".ls-sub");

    bus.on("craft:started", (job) => this.#start(
      `🔨 Fabricando ${CONFIG.MUEBLE_ES[job?.type] ?? "mueble"}…`,
      "Mario está trabajando. Puedes seguir con otras tareas."));
    bus.on("craft:progress", (p) => this.#progress(p?.ratio));
    bus.on("craft:done", (job) => {
      const n = CONFIG.MUEBLE_ES[job?.type] ?? "Mueble";
      const g = n === "Armario" ? "listo" : "lista";
      this.#done(`✓ ¡${n} ${g}!`, "Ahora entrégala al Cliente en el Mostrador 🧾.");
    });

    bus.on("workshop:ready", () => this.#hideNow());
    bus.on("menu:ready", () => this.#hideNow());
  }

  #start(title, sub) {
    clearTimeout(this.#hideT); this.#hideT = null;
    this.#title.textContent = title;
    this.#sub.textContent = sub;
    this.#root.classList.remove("hidden", "ls-ok");
    this.#progress(0);
  }

  #progress(ratio) {
    if (this.#root.classList.contains("hidden")) return;
    const r = Math.max(0, Math.min(1, ratio ?? 0));
    this.#fill.style.width = Math.round(r * 100) + "%";
    this.#pct.textContent = Math.round(r * 100) + "%";
  }

  #done(title, sub) {
    this.#title.textContent = title;
    this.#sub.textContent = sub;
    this.#root.classList.remove("hidden");
    this.#root.classList.add("ls-ok");
    this.#fill.style.width = "100%";
    this.#pct.textContent = "100%";
    clearTimeout(this.#hideT);
    this.#hideT = setTimeout(() => this.#hideNow(), 2400);
  }

  #hideNow() {
    clearTimeout(this.#hideT); this.#hideT = null;
    this.#root.classList.add("hidden");
    this.#root.classList.remove("ls-ok");
  }
}

import { el, $ } from "./ui/dom.js";

/**
 * DialogueView — diálogos cortos de NPC (BYTE, Ana, Mario, Carlos).
 * Integra la teoría dentro de la historia sin paneles enormes.
 */
const PORTRAIT = { BYTE: "🤖", Ana: "🧑‍💼", Mario: "🧑‍🔧", Carlos: "🧔" };

export class DialogueView {
  #i = 0; #lines = []; #name = "";

  constructor(bus) {
    this.bus = bus;
    // Nota: NO lleva la clase "modal" a propósito — su maquetación es propia
    // (caja abajo/centro) y no debe heredar los estilos responsive de .modal.
    // La pausa del juego se detecta con ".dialogue.open" en WorkshopScene.
    this.root = el("div", { class: "dialogue", attrs: { id: "dlg" } });
    $("#ui").append(this.root);
    this.root.addEventListener("click", (e) => {
      if (e.target.closest("[data-act='next']") || e.target === this.root) this.#next();
    });
    // Avanzar/cerrar también con teclado (E, Espacio, Enter). Se registra solo
    // mientras el diálogo está abierto para no interferir con nada más.
    this.onKey = (e) => {
      if (!this.root.classList.contains("open")) return;
      if (e.key === "e" || e.key === "E" || e.key === " " || e.key === "Enter") {
        e.preventDefault(); e.stopPropagation();
        this.#next();
      }
    };
    bus.on("dialogue:open", (d) => this.open(d.name, d.lines));
    bus.on("ui:close", () => this.#close());
  }

  open(name, lines) {
    this.#name = name; this.#lines = lines; this.#i = 0;
    this.root.classList.add("open");
    window.addEventListener("keydown", this.onKey, true);
    this.#render();
  }

  #render() {
    const last = this.#i >= this.#lines.length - 1;
    this.root.innerHTML = `
      <div class="dlg-box">
        <div class="dlg-face">${PORTRAIT[this.#name] ?? "🙂"}</div>
        <div class="dlg-body">
          <b>${this.#name}</b>
          <p>${this.#lines[this.#i]}</p>
          <div class="dlg-foot">
            <span>${this.#i + 1}/${this.#lines.length}</span>
            <button data-act="next">${last ? "Cerrar [E]" : "Continuar [E]"}</button>
          </div>
        </div>
      </div>`;
  }

  #next() {
    if (this.#i < this.#lines.length - 1) { this.#i++; this.#render(); }
    else this.#close();
  }
  #close() {
    this.root.classList.remove("open");
    window.removeEventListener("keydown", this.onKey, true);
    this.bus.emit("dialogue:closed");
  }
}

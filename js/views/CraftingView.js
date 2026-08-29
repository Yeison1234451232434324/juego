import { Modal } from "./ui/Modal.js";

/**
 * CraftingView — el Banco de Carpintería. Panel pequeño con estado de materiales
 * y botón FABRICAR. La regla (materiales, trabajador) la aplica el controlador.
 */
const LABEL = { wood: "Madera", nails: "Clavos", screws: "Tornillos", paint: "Pintura", metal: "Metal" };

export class CraftingView {
  #modal; #ctrl; #gs; #bus;

  constructor(ctrl, gs, bus) {
    this.#ctrl = ctrl; this.#gs = gs; this.#bus = bus;
    this.#modal = new Modal({ id: "crafting", variant: "wood" });
    this.#modal.bind({
      craft: (d) => { const r = this.#ctrl.craft(d.type); if (r?.ok) this.#modal.close(); else this.#render(); },
      close: () => this.#modal.close(),
    });
    bus.on("craft:done", () => this.#modal.isOpen && this.#render());
    bus.on("state:changed", () => this.#modal.isOpen && this.#render());
  }

  open() { this.#render(); this.#modal.open(); }

  #row(type) {
    const st = this.#ctrl.status(type);
    const inProgress = this.#ctrl.jobs.some((j) => j.type === type);
    const mats = Object.entries(st.recipe).map(([m, q]) => {
      const ok = st.have[m] >= q;
      return `<span class="m ${ok ? "ok" : "bad"}">${LABEL[m] ?? m} ${st.have[m]}/${q} ${ok ? "✓" : "✗"}</span>`;
    }).join(" ");
    const can = st.canCraft && st.workerFree && !inProgress;
    return `<div class="craft-row">
      <div class="cr-head"><b>${type === "Chair" ? "Silla" : type === "Table" ? "Mesa" : "Armario"}</b>
        <span class="cr-time">⏱ ${st.seconds}s</span></div>
      <div class="cr-mats">${mats}</div>
      <div class="cr-worker">Carpintero: ${st.workerFree ? "disponible ✓" : "ocupado ✗"}</div>
      <button class="k" data-act="craft" data-type="${type}" ${can ? "" : "disabled"}>
        ${inProgress ? "Fabricando…" : "FABRICAR"}</button>
    </div>`;
  }

  #render() {
    this.#modal.render(`
      <div class="wood-panel">
        <h2>🔨 Banco de carpintería</h2>
        <p class="wp-sub">Con los materiales necesarios, Mario fabrica la pieza en tiempo real.</p>
        ${["Chair", "Table", "Cabinet"].map((t) => this.#row(t)).join("")}
        <button class="k close" data-act="close">Salir [ESC]</button>
      </div>`);
  }
}

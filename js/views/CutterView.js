import { Modal } from "./ui/Modal.js";

/**
 * CutterView — Máquina de Corte: transforma 1 madera en 3 clavos (tiempo real).
 */
export class CutterView {
  #modal; #ctrl; #gs;

  constructor(workshopCtrl, gs, bus) {
    this.#ctrl = workshopCtrl; this.#gs = gs;
    this.#modal = new Modal({ id: "cutter", variant: "wood" });
    this.#modal.bind({
      nails: () => { const r = this.#ctrl.makeNails(); if (r?.ok) this.#modal.close(); else this.#render(); },
      close: () => this.#modal.close(),
    });
    bus.on("cut:done", () => this.#modal.isOpen && this.#render());
    bus.on("state:changed", () => this.#modal.isOpen && this.#render());
  }

  open() { this.#render(); this.#modal.open(); }

  #render() {
    const inv = this.#gs.workshop.inventory;
    const busy = this.#ctrl.cutJobs.length > 0;
    this.#modal.render(`<div class="wood-panel">
      <h2>🪚 Máquina de corte</h2>
      <p class="wp-sub">Transforma materiales. 1 Madera → 3 Clavos (4 s).</p>
      <div class="cut-state">Madera: <b>${inv.count("wood")}</b> · Clavos: <b>${inv.count("nails")}</b></div>
      <button class="k" data-act="nails" ${inv.has("wood", 1) && !busy ? "" : "disabled"}>
        ${busy ? "Cortando…" : "CORTAR (1 madera → 3 clavos)"}</button>
      <button class="k close" data-act="close">Salir [ESC]</button>
    </div>`);
  }
}

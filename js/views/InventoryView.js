import { Modal } from "./ui/Modal.js";
import { CONFIG } from "../config/gameConfig.js";

/**
 * InventoryView — mochila pequeña (tecla TAB o Estantería de Materiales).
 * Muestra materiales con barra, y al seleccionar uno: para qué sirve y cómo se obtiene.
 */
export class InventoryView {
  #modal; #gs; #sel = null;

  constructor(gs, bus) {
    this.#gs = gs;
    this.#modal = new Modal({ id: "inv", variant: "wood" });
    this.#modal.bind({
      sel: (d) => { this.#sel = d.type; this.#render(); },
      close: () => this.#modal.close(),
    });
    bus.on("state:changed", () => this.#modal.isOpen && this.#render());
  }

  open() { this.#render(); this.#modal.open(); }

  #render() {
    const mats = this.#gs.workshop.inventory.list();
    const stock = this.#gs.workshop.stock.reduce((a, s) => (a[s.type] = (a[s.type] ?? 0) + 1, a), {});
    const max = Math.max(6, ...mats.map((m) => m.quantity));
    const rows = mats.length ? mats.map((m) => `
      <button class="inv-item ${this.#sel === m.type ? "on" : ""}" data-act="sel" data-type="${m.type}">
        <span>${m.name}</span>
        <span class="ib"><i style="width:${Math.round((m.quantity / max) * 100)}%"></i></span>
        <b>${m.quantity}</b>
      </button>`).join("") : `<p class="wp-sub">Mochila vacía. Consigue materiales resolviendo retos.</p>`;

    const info = this.#sel && mats.find((m) => m.type === this.#sel);
    const detail = info ? `<div class="inv-detail">
      <b>${info.name}</b> — tienes ${info.quantity}<br><span class="wp-sub">${info.howToGet}</span></div>` : "";

    const stockHTML = Object.keys(stock).length
      ? Object.entries(stock).map(([t, n]) => `<span class="chip">${n}× ${CONFIG.MUEBLE_ES[t] ?? t}</span>`).join(" ")
      : `<span class="wp-sub">Sin muebles fabricados aún.</span>`;

    this.#modal.render(`<div class="wood-panel">
      <h2>🎒 Mochila</h2>
      <div class="inv-list">${rows}</div>${detail}
      <h3>Almacén de muebles</h3><p>${stockHTML}</p>
      <button class="k close" data-act="close">Salir [ESC / TAB]</button>
    </div>`);
  }
}

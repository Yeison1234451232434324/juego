import { Modal } from "./ui/Modal.js";
import { esc } from "./ui/dom.js";
import { CONFIG } from "../config/gameConfig.js";

const mueble = (t) => CONFIG.MUEBLE_ES[t] ?? t;
const matName = { wood: "Madera", nails: "Clavos" };

/**
 * RequirementView — el TABLÓN DE PEDIDOS.
 * El jugador lee cada trabajo (producto, materiales necesarios, pago) y decide
 * si lo acepta. El límite de trabajos activos lo aplica la regla de negocio;
 * aquí solo se muestra el resultado.
 */
export class RequirementView {
  #modal; #orderCtrl; #gs; #bus;

  constructor(orderCtrl, _unused, gs, bus) {
    this.#orderCtrl = orderCtrl; this.#gs = gs; this.#bus = bus;
    this.#modal = new Modal({ id: "req", variant: "paper" });
    this.#modal.bind({
      accept: (d) => { this.#orderCtrl.accept(d.id); this.#render(); },
      cancel: (d) => { this.#orderCtrl.cancel(d.id); this.#render(); },
      focus: (d) => { this.#gs.focusOrderId = d.id; this.#bus.emit("state:changed"); this.#render(); },
      close: () => this.#modal.close(),
    });
  }

  openOrders() { this.#render(); this.#modal.open(); }

  #matLine(o) {
    return Object.entries(o.materials)
      .map(([m, q]) => `${m === "wood" ? "🪵" : "🔩"} ${q} ${matName[m] ?? m}`).join("   ");
  }

  #render() {
    const active = this.#orderCtrl.active();
    const max = this.#orderCtrl.max();
    const full = active.length >= max;

    const disponibles = this.#orderCtrl.available().map((o) => `
      <div class="doc ${o.isFinal ? "final" : ""}">
        <div class="doc-pin"></div>
        <b>PEDIDO ${o.code}</b>
        <p>Cliente: ${esc(o.customer.name)}</p>
        <p>Producto: <b>${o.summary}</b></p>
        <p class="doc-mats">Materiales necesarios:  ${this.#matLine(o)}</p>
        <p class="doc-reward">Pago: 🪙 $${o.reward}</p>
        <button class="k" data-act="accept" data-id="${o.id}" ${full ? "disabled" : ""}>
          ${full ? "LÍMITE ALCANZADO" : "ACEPTAR TRABAJO"}</button>
      </div>`).join("");

    const activos = active.map((o) => {
      const isFocus = this.#gs.focusOrderId === o.id;
      const inv = this.#gs.workshop.inventory;
      const prog = Object.entries(o.materials)
        .map(([m, q]) => `${m === "wood" ? "🪵" : "🔩"} ${Math.min(inv.count(m), q)}/${q}`).join("  ");
      return `<div class="doc active ${isFocus ? "focus" : ""}">
        <b>${o.code} · ${esc(o.customer.name)}</b>
        <p>${o.summary} — materiales ${prog}</p>
        <div class="doc-btns">
          ${isFocus ? `<span class="doc-tag">TRABAJO ACTUAL</span>`
                    : `<button class="k sm" data-act="focus" data-id="${o.id}">Centrarme en este</button>`}
          <button class="k sm bad" data-act="cancel" data-id="${o.id}">Cancelar</button>
        </div>
      </div>`;
    }).join("");

    this.#modal.render(`<div class="paper-panel">
      <h2>📋 Tablón de Pedidos</h2>
      <p class="wp-sub">Trabajos activos: <b>${active.length} / ${max}</b>${full ? " — completa o cancela uno para aceptar otro." : ""}</p>
      <h3>Disponibles</h3>
      ${disponibles || `<p class="wp-sub">No hay pedidos nuevos ahora mismo.</p>`}
      ${activos ? `<h3>Tus trabajos</h3>${activos}` : ""}
      <button class="k close" data-act="close">Salir [ESC]</button>
    </div>`);
  }
}

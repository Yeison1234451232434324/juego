import { Modal } from "./ui/Modal.js";
import { esc } from "./ui/dom.js";
import { CONFIG } from "../config/gameConfig.js";

const mueble = (t) => CONFIG.MUEBLE_ES[t] ?? t;

/**
 * SalesView — el Mostrador de Ventas. Entrega de pedidos + demostración de la
 * regla de negocio "el precio no puede ser <= 0".
 */
export class SalesView {
  #modal; #orderCtrl; #gs; #bus;

  constructor(orderCtrl, gs, bus) {
    this.#orderCtrl = orderCtrl; this.#gs = gs; this.#bus = bus;
    this.#modal = new Modal({ id: "sales", variant: "wood" });
    this.#modal.bind({
      deliver: (d) => { this.#orderCtrl.deliver(d.id); this.#render(); },
      price: () => {
        const v = Number(this.#modal.frame.querySelector("#sp")?.value);
        const r = this.#orderCtrl.validateSellPrice("Chair", v);
        const out = this.#modal.frame.querySelector("#sp-out");
        out.textContent = r.ok ? `✓ Precio válido: $${v}` : `🚫 ${r.reason}`;
        out.className = r.ok ? "ok" : "bad";
      },
      close: () => this.#modal.close(),
    });
    bus.on("state:changed", () => this.#modal.isOpen && this.#render());
  }

  open() { this.#render(); this.#modal.open(); }

  #render() {
    const active = this.#gs.workshop.orders;
    const rows = active.length ? active.map((o) => {
      const canDeliver = o.lines.every((l) => this.#gs.workshop.countStock(l.type) + l.done >= l.qty);
      return `<div class="sale-row">
        <b>${o.code} · ${esc(o.customer.name)}</b>
        <p>${o.lines.map((l) => `${mueble(l.type)}: en almacén ${this.#gs.workshop.countStock(l.type)}/${l.qty}`).join(" · ")}</p>
        <p class="doc-reward">Pago: $${o.reward}</p>
        <button class="k" data-act="deliver" data-id="${o.id}" ${canDeliver ? "" : "disabled"}>ENTREGAR PEDIDO</button>
      </div>`;
    }).join("") : `<p class="wp-sub">No tienes pedidos aceptados. Ve a la Mesa de Pedidos.</p>`;

    this.#modal.render(`<div class="wood-panel">
      <h2>💰 Mostrador de ventas</h2>
      ${rows}
      <h3>Fijar precio de venta</h3>
      <p class="wp-sub">Regla de negocio: el precio de venta no puede ser ≤ 0.</p>
      <div class="price-row">
        <input id="sp" type="number" value="-20" />
        <button class="k" data-act="price">Validar precio</button>
      </div>
      <p id="sp-out"></p>
      <button class="k close" data-act="close">Salir [ESC]</button>
    </div>`);
  }
}

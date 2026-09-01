import { Modal } from "./ui/Modal.js";
import { esc } from "./ui/dom.js";
import { CONFIG } from "../config/gameConfig.js";

const mueble = (t) => CONFIG.MUEBLE_ES[t] ?? t;

/**
 * SalesView — el MOSTRADOR. El jugador entrega los pedidos ya fabricados y
 * cobra. La regla "no se entrega si faltan piezas" la aplica el controlador.
 */
export class SalesView {
  #modal; #orderCtrl; #gs; #bus;

  constructor(orderCtrl, gs, bus) {
    this.#orderCtrl = orderCtrl; this.#gs = gs; this.#bus = bus;
    this.#modal = new Modal({ id: "sales", variant: "wood" });
    this.#modal.bind({
      deliver: (d) => {
        const r = this.#orderCtrl.deliver(d.id);
        if (r?.ok) this.#delivered(r.order); else this.#render();
      },
      close: () => this.#modal.close(),
    });
    bus.on("state:changed", () => this.#modal.isOpen && this.#render());
  }

  open() { this.#render(); this.#modal.open(); }

  #render() {
    const active = this.#gs.workshop.orders;
    const rows = active.length ? active.map((o) => {
      const lines = o.lines.map((l) => {
        const made = Math.min(this.#gs.workshop.countStock(l.type) + l.done, l.qty);
        const ok = made >= l.qty;
        return `<span class="m ${ok ? "ok" : "bad"}">${mueble(l.type)} ${made}/${l.qty} ${ok ? "✓" : "✗"}</span>`;
      }).join(" ");
      const canDeliver = o.lines.every((l) => this.#gs.workshop.countStock(l.type) + l.done >= l.qty);
      return `<div class="sale-row">
        <b>${o.code} · ${esc(o.customer.name)}</b>
        <p>${o.summary}</p>
        <div class="cr-mats">${lines}</div>
        <p class="doc-reward">Pago: 🪙 $${o.reward}</p>
        <button class="k" data-act="deliver" data-id="${o.id}" ${canDeliver ? "" : "disabled"}>
          ${canDeliver ? "ENTREGAR PEDIDO" : "Faltan piezas por fabricar"}</button>
      </div>`;
    }).join("") : `<p class="wp-sub">No tienes trabajos aceptados. Ve al Tablón de Pedidos 📋.</p>`;

    this.#modal.render(`<div class="wood-panel">
      <h2>🧾 Mostrador — entregar pedidos</h2>
      <p class="wp-sub">Solo puedes entregar un pedido cuando TODAS sus piezas están fabricadas.</p>
      ${rows}
      <button class="k close" data-act="close">Salir [ESC]</button>
    </div>`);
  }

  #delivered(o) {
    this.#modal.render(`<div class="wood-panel">
      <h2>🧾 Pedido ${o.code}</h2>
      <p class="q-cust">${esc(o.customer.name)}:</p>
      <p style="font-size:1rem;margin:6px 0">"Perfecto. ¡Muchas gracias!"</p>
      <p class="doc-reward big">Recompensa:  🪙 +$${o.reward}   ⭐ +90 XP${o.metalReward ? `   🔩 +${o.metalReward} metal` : ""}</p>
      <p class="ok">✓ PEDIDO COMPLETADO</p>
      <button class="k run" data-act="close">Continuar [ESC]</button>
    </div>`);
  }
}

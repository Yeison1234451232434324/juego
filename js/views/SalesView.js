import { Modal } from "./ui/Modal.js";
import { esc } from "./ui/dom.js";
import { CONFIG } from "../config/gameConfig.js";
import { QualityService } from "../services/QualityService.js";

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
        if (r?.ok) this.#delivered(r); else this.#render();
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
      // calidad media de las piezas ya en stock para este pedido
      const pieces = o.lines.flatMap((l) => this.#gs.workshop.stock.filter((s) => s.type === l.type));
      const q = pieces.length ? Math.round(pieces.reduce((s, p) => s + (p.quality ?? 70), 0) / pieces.length) : null;
      return `<div class="sale-row">
        <b>${o.code} · ${esc(o.customer.name)}</b>
        <p>${o.summary}${o.priority !== "normal" ? ` · <span class="pri ${o.priority}">${o.priority === "urgente" ? "⚠️ urgente" : "💰 premium"}</span>` : ""}</p>
        <div class="cr-mats">${lines}</div>
        ${q != null ? `<p class="cr-worker">Calidad en stock: <b>${QualityService.stars(q / 20)}</b> ${q}/100</p>` : ""}
        <p class="doc-reward">Pago base: 🪙 $${o.reward} <span class="wp-sub">(según calidad)</span></p>
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

  #delivered(res) {
    const o = res.order, t = res.tier;
    const bonus = res.paid !== o.reward
      ? ` <span class="wp-sub">(base $${o.reward} × ${t.mult.toFixed(2)})</span>` : "";
    const recap = (res.learned && res.learned.length)
      ? `<div class="sat-recap"><b>📚 Aplicaste:</b> POO (${res.learned.join(", ")})
         · Requisitos ${res.rfDone} · Flujo <code>Vista → Controlador → Modelo</code></div>` : "";
    this.#modal.render(`<div class="wood-panel sat">
      <h2>👨‍💼 ${esc(o.customer.name)}</h2>
      <div class="sat-face">${t.face}</div>
      <div class="sat-stars">${QualityService.stars(res.stars)}</div>
      <p class="sat-quote">“${esc(res.quote)}”</p>
      <div class="sat-score">Calidad del pedido: <b>${res.quality}/100</b> · ${t.label}${res.late ? ' · <span class="bad">entrega tardía −12</span>' : ""}</div>
      <ul class="sat-break">
        ${res.breakdown.map((r) => `<li><span>${esc(r.label)}</span><b>${QualityService.stars(r.stars)}</b></li>`).join("")}
      </ul>
      <p class="doc-reward big">🪙 +$${res.paid}${bonus}   ⭐ +${res.xp} XP   👍 +${res.rep} reputación${o.metalReward ? `   🔩 +${o.metalReward}` : ""}</p>
      ${recap}
      <p class="ok">✓ PEDIDO COMPLETADO</p>
      <button class="k run" data-act="close">Continuar [ESC]</button>
    </div>`);
  }
}

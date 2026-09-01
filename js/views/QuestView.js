import { el, $ } from "./ui/dom.js";
import { CONFIG } from "../config/gameConfig.js";

const mueble = (t) => CONFIG.MUEBLE_ES[t] ?? t;
const ICON = { Chair: "🪑", Table: "🪵", Cabinet: "🗄️" };

/**
 * QuestView — el panel de OBJETIVOS (esquina superior derecha).
 * Siempre dice: cuántos trabajos tiene el jugador, en qué pedido se centra,
 * qué materiales le faltan y qué paso viene ahora. El jugador nunca debe
 * preguntarse "¿qué hago?".
 */
export class QuestView {
  #gs;

  constructor(gs, bus) {
    this.#gs = gs;
    this.box = el("div", { class: "quest hidden" });
    $("#ui").append(this.box);
    bus.on("state:changed", () => this.render());
    bus.on("objective:changed", () => this.render());
    bus.on("order:accepted", () => this.render());
    bus.on("order:delivered", () => this.render());
  }

  show(v) { this.box.classList.toggle("hidden", !v); }

  render() {
    const gs = this.#gs;
    const active = gs.workshop.orders;
    const max = CONFIG.GAMEPLAY.MAX_ACTIVE_ORDERS;
    const o = gs.focusOrder;

    let body = "";
    if (o) {
      const inv = gs.workshop.inventory;
      const need = o.materials;
      const mats = Object.entries(need).map(([m, q]) => {
        const have = inv.count(m);
        return `<span class="q-mat ${have >= q ? "ok" : ""}">${m === "wood" ? "🪵" : "🔩"} ${Math.min(have, q)}/${q}</span>`;
      }).join(" ");

      const haveMats = Object.entries(need).every(([m, q]) => inv.count(m) >= q);
      const madeAll = o.lines.every((l) => gs.workshop.countStock(l.type) + l.done >= l.qty);

      const step = (done, txt) => `<li class="${done ? "done" : ""}">${done ? "✓" : "○"} ${txt}</li>`;
      body = `
        <div class="q-order">
          <b>${ICON[o.lines[0]?.type] ?? "🪑"} ${o.summary}</b>
          <span class="q-cust">${o.customer.name}</span>
        </div>
        <div class="q-mats">${mats}</div>
        <ul class="q-steps">
          ${step(true, "Pedido aceptado")}
          ${step(haveMats, "Conseguir materiales")}
          ${step(madeAll, "Fabricar")}
          ${step(false, "Entregar al cliente")}
        </ul>`;
    } else {
      body = `<p class="q-empty">Sin trabajos. Acepta uno en el Tablón de Pedidos 📋.</p>`;
    }

    this.box.innerHTML = `
      <div class="q-head">TRABAJOS ACTIVOS <b>${active.length} / ${max}</b></div>
      ${body}
      <div class="q-next">👉 ${gs.objective}</div>`;
  }
}

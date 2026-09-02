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

      // Mejora "Organizador de materiales": estima cuántos retos faltan.
      let est = "";
      if (!haveMats && gs.upgrades.has("organizer")) {
        const per = gs.upgrades.has("supplier") ? 6 : 4;
        const short = Object.entries(need).reduce((s, [m, q]) => s + Math.max(0, q - inv.count(m)), 0);
        est = `<div class="q-remaining">≈ ${Math.ceil(short / per)} reto(s) más para completar materiales</div>`;
      }

      // Ciclo del taller — la etapa actual va resaltada.
      const cur = !haveMats ? 1 : !madeAll ? 3 : 4;
      const CYCLE = [["📋", "Pedido"], ["💻", "Programar"], ["📦", "Materiales"], ["🔨", "Fabricar"], ["🧾", "Entregar"], ["💰", "Cobrar"]];
      const cycle = CYCLE.map(([ic, t], i) => {
        const cls = i < cur ? "done" : i === cur || (cur === 1 && i === 2) ? "on" : "";
        return `<span class="q-cy ${cls}" title="${t}">${ic}</span>`;
      }).join('<i class="q-cyar">›</i>');

      const deadline = o.deadline
        ? `<span class="q-dl">⏳ ${o.deadline} día${o.deadline > 1 ? "s" : ""}</span>` : "";
      body = `
        <div class="q-order">
          <b>${ICON[o.lines[0]?.type] ?? "🪑"} ${o.summary}</b>
          <span class="q-cust">${o.customer.name} ${deadline}</span>
        </div>
        <div class="q-cycle">${cycle}</div>
        <div class="q-mats">${mats}</div>
        ${est}`;
    } else {
      body = `<p class="q-empty">Sin trabajos. Acepta uno en el Tablón de Pedidos 📋.</p>`;
    }

    this.box.innerHTML = `
      <div class="q-head">TRABAJOS ACTIVOS <b>${active.length} / ${max}</b></div>
      ${body}
      <div class="q-next">👉 ${gs.objective}</div>`;
  }
}

import { Modal } from "./ui/Modal.js";
import { CONFIG } from "../config/gameConfig.js";

const LABEL = { wood: "Madera", nails: "Clavos" };
const mueble = (t) => CONFIG.MUEBLE_ES[t] ?? t;

/**
 * CraftingView — el BANCO DE TRABAJO. Solo muestra los muebles que algún pedido
 * necesita. Con los materiales listos, Mario los fabrica en tiempo real.
 */
export class CraftingView {
  #modal; #ctrl; #gs; #bus;

  constructor(ctrl, gs, bus) {
    this.#ctrl = ctrl; this.#gs = gs; this.#bus = bus;
    this.#modal = new Modal({ id: "crafting", variant: "wood" });
    this.#modal.bind({
      craft: (d) => { const r = this.#ctrl.craft(d.type); if (r?.ok) this.#modal.close(); else this.#render(); },
      series: (d) => { this.#ctrl.craft(d.type, true); this.#render(); },
      close: () => this.#modal.close(),
    });
    bus.on("craft:done", () => this.#modal.isOpen && this.#render());
    bus.on("state:changed", () => this.#modal.isOpen && this.#render());
    // barra de lote en vivo (throttled para no re-renderizar cada frame)
    let last = 0;
    bus.on("craft:progress", () => {
      if (!this.#modal.isOpen) return;
      const now = Date.now();
      if (now - last > 380) { last = now; this.#render(); }
    });
  }

  open() { this.#render(); this.#modal.open(); }

  #row({ type, remaining }) {
    const st = this.#ctrl.status(type);
    const job = this.#ctrl.jobs.find((j) => j.type === type);
    const inProgress = !!job;
    const mats = Object.entries(st.recipe).map(([m, q]) => {
      const ok = st.have[m] >= q;
      return `<span class="m ${ok ? "ok" : "bad"}">${LABEL[m] ?? m} ${Math.min(st.have[m], q)}/${q} ${ok ? "✓" : "✗"}</span>`;
    }).join(" ");
    const ready = st.canCraft && st.workerFree && !inProgress;

    // PRODUCCIÓN POR LOTES: barra hechas/total del pedido
    const total = this.#gs.workshop.orders.reduce((s, o) => s + o.remainingOf(type), 0);
    const made = Math.max(0, total - remaining);
    const pct = total ? Math.round((made / total) * 100) : 0;
    const ratio = job ? Math.min(1, job.elapsed / job.total) : 0;
    const restante = job ? Math.max(0, Math.ceil(job.total - job.elapsed)) : 0;

    const estado = inProgress ? `FABRICANDO… ${Math.round(ratio * 100)}% · faltan ${restante}s`
      : !st.workerFree ? "Mario está ocupado"
      : st.canCraft ? "LISTO PARA FABRICAR"
      : "Faltan materiales";

    return `<div class="craft-row">
      <div class="cr-head"><b>${mueble(type)}</b>
        <span class="cr-time">${made}/${total} · ⏱ ${st.seconds}s/pieza</span></div>
      <div class="batch-bar"><i style="width:${job ? Math.round(ratio * 100) : pct}%"></i></div>
      <div class="cr-mats">${mats}</div>
      <div class="cr-worker">Estado: <b>${estado}</b>${job?.batch ? " · en serie 🔁" : ""}</div>
      <button class="k" data-act="craft" data-type="${type}" ${ready ? "" : "disabled"}>
        ${inProgress ? "Fabricando…" : `CONSTRUIR 1 ${mueble(type).toUpperCase()}`}</button>
      ${remaining > 1 && !inProgress
        ? `<button class="k sm" data-act="series" data-type="${type}" ${ready ? "" : "disabled"}>🔁 FABRICAR EN SERIE (${remaining})</button>`
        : ""}
    </div>`;
  }

  #render() {
    const needed = this.#ctrl.neededTypes();
    const body = needed.length
      ? needed.map((n) => this.#row(n)).join("")
      : `<p class="wp-sub">No tienes ningún pedido que requiera fabricación ahora mismo.
         Acepta un trabajo en el Tablón de Pedidos 📋.</p>`;

    this.#modal.render(`
      <div class="wood-panel">
        <h2>🔨 Banco de trabajo</h2>
        <p class="wp-sub">Mario fabrica aquí las piezas que necesitan tus pedidos.</p>
        ${body}
        <button class="k close" data-act="close">Salir [ESC]</button>
      </div>`);
  }
}

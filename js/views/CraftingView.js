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
      close: () => this.#modal.close(),
    });
    bus.on("craft:done", () => this.#modal.isOpen && this.#render());
    bus.on("state:changed", () => this.#modal.isOpen && this.#render());
  }

  open() { this.#render(); this.#modal.open(); }

  #row({ type, remaining }) {
    const st = this.#ctrl.status(type);
    const inProgress = this.#ctrl.jobs.some((j) => j.type === type);
    const mats = Object.entries(st.recipe).map(([m, q]) => {
      const ok = st.have[m] >= q;
      return `<span class="m ${ok ? "ok" : "bad"}">${LABEL[m] ?? m} ${Math.min(st.have[m], q)}/${q} ${ok ? "✓" : "✗"}</span>`;
    }).join(" ");
    const ready = st.canCraft && st.workerFree && !inProgress;
    const estado = inProgress ? "FABRICANDO…"
      : !st.workerFree ? "Mario está ocupado"
      : st.canCraft ? "LISTO PARA FABRICAR"
      : "Faltan materiales";

    return `<div class="craft-row">
      <div class="cr-head"><b>${mueble(type)}</b>
        <span class="cr-time">faltan ${remaining} · ⏱ ${st.seconds}s</span></div>
      <div class="cr-mats">${mats}</div>
      <div class="cr-worker">Estado: <b>${estado}</b></div>
      <button class="k" data-act="craft" data-type="${type}" ${ready ? "" : "disabled"}>
        ${inProgress ? "Fabricando…" : `CONSTRUIR ${mueble(type).toUpperCase()}`}</button>
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

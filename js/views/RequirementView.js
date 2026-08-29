import { Modal } from "./ui/Modal.js";
import { esc } from "./ui/dom.js";
import { CONFIG } from "../config/gameConfig.js";

const mueble = (t) => CONFIG.MUEBLE_ES[t] ?? t;

/**
 * RequirementView — dos estaciones:
 *  - Mesa de Pedidos (orders): documentos físicos que el jugador lee y acepta.
 *  - Mesa de Arquitectura (arch): el jugador lleva un RF y decide en qué capa MVC
 *    va cada cosa. MVC es GAMEPLAY: acertar da el material "núcleo".
 */
export class RequirementView {
  #modal; #orderCtrl; #reqCtrl; #gs; #bus;
  #mvcStep = 0;

  constructor(orderCtrl, reqCtrl, gs, bus) {
    this.#orderCtrl = orderCtrl; this.#reqCtrl = reqCtrl; this.#gs = gs; this.#bus = bus;
    this.#modal = new Modal({ id: "req", variant: "paper" });
    this.#modal.bind({
      accept: (d) => { this.#orderCtrl.accept(d.id); this.#renderOrders(); },
      mvc: (d) => this.#answer(Number(d.step), Number(d.opt)),
      close: () => this.#modal.close(),
      "next-mvc": () => { this.#mvcStep = 0; this.#renderArch(); },
    });
  }

  openOrders() { this.#renderOrders(); this.#modal.open(); }
  openArch() { this.#mvcStep = 0; this.#renderArch(); this.#modal.open(); }

  // ---- documentos de pedidos ----
  #renderOrders() {
    const docs = this.#orderCtrl.available().map((o) => `
      <div class="doc ${o.isFinal ? "final" : ""}">
        <div class="doc-pin"></div>
        <b>PEDIDO ${o.code}</b>
        <p>Cliente: ${esc(o.customer.name)}</p>
        <p>Solicita: ${o.lines.map((l) => `${l.qty} ${mueble(l.type)}`).join(", ")}</p>
        <p class="doc-notes">Requisitos: ${o.notes.map(esc).join(" · ")}</p>
        <p class="doc-reward">Pago: $${o.reward}${o.metalReward ? `  ·  +${o.metalReward} metal` : ""}</p>
        <button class="k" data-act="accept" data-id="${o.id}">Aceptar pedido</button>
      </div>`).join("");
    const active = this.#gs.workshop.orders.map((o) =>
      `<div class="doc active"><b>${o.code} · ${esc(o.customer.name)}</b>
        <p>${o.lines.map((l) => `${mueble(l.type)} ${l.done}/${l.qty}`).join(" · ")}</p>
        <p class="wp-sub">Fabrica las piezas y entrégalo en el Mostrador de Ventas.</p></div>`).join("");

    this.#modal.render(`<div class="paper-panel">
      <h2>🗂️ Mesa de pedidos</h2>
      <p class="wp-sub">Analiza cada requerimiento antes de aceptarlo.</p>
      ${docs}
      ${active ? `<h3>Aceptados</h3>${active}` : ""}
      <button class="k close" data-act="close">Salir [ESC]</button>
    </div>`);
  }

  // ---- Mesa de Arquitectura (MVC) ----
  #renderArch() {
    const ch = this.#reqCtrl.currentChallenge();
    if (!ch) {
      this.#modal.render(`<div class="paper-panel"><h2>🏛️ Mesa de arquitectura</h2>
        <p class="ok">✓ Has resuelto todos los retos de arquitectura disponibles.</p>
        <button class="k close" data-act="close">Salir [ESC]</button></div>`);
      return;
    }
    const done = Math.min(this.#mvcStep, ch.steps.length);
    const step = ch.steps[Math.min(done, ch.steps.length - 1)];
    const diagram = `
      <pre class="mvc-dia">
 ┌───────── VISTA ────────┐   botón "Fabricar"
 └───────────┬────────────┘
             ↓
 ┌─────── CONTROLADOR ────┐   coordina la operación
 └───────────┬────────────┘
             ↓
 ┌───────── MODELO ───────┐   Pedido · Silla · Inventario · reglas de negocio
 └────────────────────────┘</pre>`;

    if (done >= ch.steps.length) {
      this.#modal.render(`<div class="paper-panel">
        <h2>🏛️ ${esc(ch.requirement)}</h2>${diagram}
        <p class="ok">✓ Arquitectura resuelta. Recompensa: ${Object.entries(ch.rewards).map(([k, v]) => k === "xp" ? `+${v} XP` : `+${v} ${k}`).join("  ")}</p>
        <button class="k" data-act="next-mvc">Otro requerimiento</button>
        <button class="k close" data-act="close">Salir [ESC]</button>
      </div>`);
      return;
    }

    this.#modal.render(`<div class="paper-panel">
      <h2>🏛️ Mesa de arquitectura</h2>
      <p class="doc-reward">${esc(ch.requirement)}</p>
      ${diagram}
      <p class="mvc-q">${esc(step.q)}</p>
      <div class="mvc-opts">
        ${step.options.map((op, i) => `<button class="k" data-act="mvc" data-step="${done}" data-opt="${i}">${esc(op)}</button>`).join("")}
      </div>
      <p class="wp-sub">Progreso: ${done}/${ch.steps.length}</p>
      <button class="k close" data-act="close">Salir [ESC]</button>
    </div>`);
  }

  #answer(step, opt) {
    const ch = this.#reqCtrl.currentChallenge();
    const res = this.#reqCtrl.answer(ch.id, step, opt);
    if (res.correct) {
      this.#mvcStep = step + 1;
      this.#bus.emit("sfx", "ok");
    } else this.#bus.emit("sfx", "error");
    // mostrar explicación breve y avanzar
    this.#renderArch();
    const panel = this.#modal.frame.querySelector(".paper-panel");
    if (panel) {
      const p = document.createElement("p");
      p.className = res.correct ? "ok" : "bad";
      p.textContent = (res.correct ? "✓ Correcto. " : "✗ No exactamente. ") + res.explain;
      panel.insertBefore(p, panel.querySelector(".mvc-q") ?? panel.lastElementChild);
    }
  }
}

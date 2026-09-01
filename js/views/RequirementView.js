import { Modal } from "./ui/Modal.js";
import { esc } from "./ui/dom.js";
import { CONFIG } from "../config/gameConfig.js";

const matName = { wood: "Madera", nails: "Clavos", paint: "Pintura", screws: "Tornillos" };
const matIco = (m) => (m === "wood" ? "🪵" : m === "nails" ? "🔩" : m === "paint" ? "🎨" : "🔩");
const DIFF = {
  Chair:   { tag: "🟢 BÁSICO", cls: "b" },
  Table:   { tag: "🟡 INTERMEDIO", cls: "i" },
  Cabinet: { tag: "🔴 AVANZADO", cls: "a" },
};

/**
 * RequirementView — el TABLÓN DE PEDIDOS.
 * El jugador lee cada trabajo: producto, dificultad, MATERIALES, PAGO y —al
 * desplegar— sus REQUERIMIENTOS FUNCIONALES y REGLAS DE NEGOCIO. Decide si lo
 * acepta. El límite de trabajos lo aplica la regla de negocio; aquí solo se
 * muestra el resultado.
 */
export class RequirementView {
  #modal; #orderCtrl; #gs; #bus;
  #open = new Set();   // ids de pedidos con los requerimientos desplegados

  constructor(orderCtrl, _unused, gs, bus) {
    this.#orderCtrl = orderCtrl; this.#gs = gs; this.#bus = bus;
    this.#modal = new Modal({ id: "req", variant: "paper" });
    this.#modal.bind({
      accept: (d) => { this.#orderCtrl.accept(d.id); this.#render(); },
      cancel: (d) => { this.#orderCtrl.cancel(d.id); this.#render(); },
      focus: (d) => { this.#gs.focusOrderId = d.id; this.#bus.emit("state:changed"); this.#render(); },
      reqs: (d) => { this.#open.has(d.id) ? this.#open.delete(d.id) : this.#open.add(d.id); this.#render(); },
      trace: () => this.#bus.emit("open:traceability"),
      close: () => this.#modal.close(),
    });
  }

  openOrders() { this.#render(); this.#modal.open(); }

  #matLine(o) {
    return Object.entries(o.materials)
      .map(([m, q]) => `${matIco(m)} ${q} ${matName[m] ?? m}`).join("   ");
  }

  /** Bloque desplegable: requerimientos funcionales + reglas de negocio. */
  #specBlock(o) {
    if (!this.#open.has(o.id)) return "";
    const rf = o.functionalReqs.map((r) =>
      `<li><b>${r.id}</b> ${esc(r.text)} <span class="oreq-c">🧩 ${esc(r.concept)}</span></li>`).join("");
    const rn = o.businessRules.map((r) =>
      `<li><b>${r.id}</b> ${esc(r.text)} <code>${esc(r.fn)}</code></li>`).join("");
    return `<div class="oreq">
      <h4>Requerimientos funcionales</h4><ul class="oreq-list">${rf}</ul>
      <h4>Reglas de negocio</h4><ul class="oreq-list rn">${rn}</ul>
      <p class="oreq-foot">Analiza esto antes de fabricar: cada RF se convierte en código (POO) y cada RN vive en <code>BusinessRules</code>, no en la pantalla.</p>
    </div>`;
  }

  #render() {
    const active = this.#orderCtrl.active();
    const max = this.#orderCtrl.max();
    const full = active.length >= max;

    const disponibles = this.#orderCtrl.available().map((o) => {
      const d = DIFF[o.mainType] ?? DIFF.Chair;
      const openTag = this.#open.has(o.id);
      return `
      <div class="doc ${o.isFinal ? "final" : ""}">
        <div class="doc-pin"></div>
        <b>PEDIDO ${o.code}</b>
        <p>Cliente: ${esc(o.customer.name)} · <span class="diff ${d.cls}">${o.isFinal ? "🏨 PROYECTO FINAL" : d.tag}</span></p>
        <p>Producto: <b>${o.summary}</b></p>
        <p class="doc-mats">Materiales necesarios:  ${this.#matLine(o)}</p>
        <p class="doc-reward">Pago: 🪙 $${o.reward}</p>
        <div class="doc-btns">
          <button class="k sm" data-act="reqs" data-id="${o.id}">${openTag ? "▲ Ocultar" : "📋 Ver"} requerimientos</button>
          <button class="k" data-act="accept" data-id="${o.id}" ${full ? "disabled" : ""}>
            ${full ? "LÍMITE ALCANZADO" : "ACEPTAR TRABAJO"}</button>
        </div>
        ${this.#specBlock(o)}
      </div>`;
    }).join("");

    const activos = active.map((o) => {
      const isFocus = this.#gs.focusOrderId === o.id;
      const inv = this.#gs.workshop.inventory;
      const prog = Object.entries(o.materials)
        .map(([m, q]) => `${matIco(m)} ${Math.min(inv.count(m), q)}/${q}`).join("  ");
      const openTag = this.#open.has(o.id);
      return `<div class="doc active ${isFocus ? "focus" : ""}">
        <b>${o.code} · ${esc(o.customer.name)}</b>
        <p>${o.summary} — materiales ${prog}</p>
        <div class="doc-btns">
          ${isFocus ? `<span class="doc-tag">TRABAJO ACTUAL</span>`
                    : `<button class="k sm" data-act="focus" data-id="${o.id}">Centrarme en este</button>`}
          <button class="k sm" data-act="reqs" data-id="${o.id}">${openTag ? "▲" : "📋"} requerimientos</button>
          <button class="k sm bad" data-act="cancel" data-id="${o.id}">Cancelar</button>
        </div>
        ${this.#specBlock(o)}
      </div>`;
    }).join("");

    this.#modal.render(`<div class="paper-panel">
      <h2>📋 Tablón de Pedidos</h2>
      <p class="wp-sub">Trabajos activos: <b>${active.length} / ${max}</b>${full ? " — completa o cancela uno para aceptar otro." : ""}
        <button class="k sm" data-act="trace" style="float:right">🔎 Trazabilidad</button></p>
      <h3>Disponibles</h3>
      ${disponibles || `<p class="wp-sub">No hay pedidos nuevos ahora mismo.</p>`}
      ${activos ? `<h3>Tus trabajos</h3>${activos}` : ""}
      <button class="k close" data-act="close">Salir [ESC]</button>
    </div>`);
  }
}

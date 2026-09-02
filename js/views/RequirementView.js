import { Modal } from "./ui/Modal.js";
import { esc } from "./ui/dom.js";

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
      reqs: (d) => {
        if (this.#open.has(d.id)) this.#open.delete(d.id);
        else { this.#open.add(d.id); this.#bus.emit("requirements:viewed"); }
        this.#render();
      },
      trace: () => this.#bus.emit("open:traceability"),
      close: () => this.#modal.close(),
    });
    // La lista de requisitos se marca en vivo al resolver retos.
    bus.on("challenge:solved", () => this.#modal.isOpen && this.#render());
  }

  /** ¿El requisito funcional de este concepto ya está implementado? */
  #rfDone(concept) {
    const g = { clase: "clase", atributo: "clase", encapsulamiento: "encapsulamiento",
      polimorfismo: "polimorfismo", herencia: "herencia" }[concept];
    if (g) return this.#gs.challenges.groupSolved(g);
    if (concept === "regla") return !!this.#gs.requirements.get("RF-006")?.isDone;
    return false;
  }

  openOrders() { this.#render(); this.#modal.open(); }

  #matLine(o) {
    return Object.entries(o.materials)
      .map(([m, q]) => `${matIco(m)} ${q} ${matName[m] ?? m}`).join("   ");
  }

  /** Examen final: los 12 pasos del Proyecto Hotel Gran Roble, con estado real. */
  #finalSteps(o) {
    const gs = this.#gs, ch = gs.challenges, p = gs.player;
    const mats = Object.entries(o.materials).every(([m, q]) => gs.workshop.inventory.count(m) >= q);
    const made = o.lines.every((l) => gs.workshop.countStock(l.type) + l.done >= l.qty);
    const S = [
      ["Analizar los requerimientos del cliente", p.knows("Requerimientos")],
      ["Identificar las reglas de negocio", p.knows("Regla de negocio")],
      ["Crear las clases de los muebles", ch.groupSolved("clase")],
      ["Aplicar atributos y métodos", ch.groupSolved("clase")],
      ["Aplicar encapsulamiento", ch.groupSolved("encapsulamiento")],
      ["Aplicar herencia", ch.groupSolved("herencia")],
      ["Aplicar polimorfismo", ch.groupSolved("polimorfismo")],
      ["Aplicar abstracción / composición", ch.groupSolved("abstraccion") || ch.groupSolved("composicion")],
      ["Conseguir todos los materiales", mats],
      ["Fabricar todas las piezas", made],
      ["Entregar el pedido en el mostrador", o.isDelivered],
      ["Recibir la evaluación final", !!p.stats.finalDone],
    ];
    return `<div class="oreq final-steps">
      <h4>🏨 Examen final — 12 pasos</h4>
      <ol class="fs-list">${S.map(([t, done]) =>
        `<li class="${done ? "done" : ""}">${done ? "✅" : "▫"} ${esc(t)}</li>`).join("")}</ol>
      <p class="oreq-foot">Este pedido reúne <b>todo</b>: análisis, reglas, POO completa, materiales, fabricación y entrega.</p>
    </div>`;
  }

  /** Bloque desplegable: requerimientos funcionales + reglas de negocio. */
  #specBlock(o) {
    if (o.isFinal) return this.#finalSteps(o) + (this.#open.has(o.id) ? this.#specRows(o) : "");
    if (!this.#open.has(o.id)) return "";
    return this.#specRows(o);
  }

  #specRows(o) {
    const done = o.functionalReqs.filter((r) => this.#rfDone(r.concept)).length;
    const rf = o.functionalReqs.map((r) => {
      const ok = this.#rfDone(r.concept);
      return `<li class="${ok ? "done" : ""}">${ok ? "☑" : "☐"} <b>${r.id}</b> ${esc(r.text)}
        <span class="oreq-c">🧩 ${esc(r.concept)}</span></li>`;
    }).join("");
    const rn = o.businessRules.map((r) =>
      `<li><b>${r.id}</b> ${esc(r.text)} <code>${esc(r.fn)}</code></li>`).join("");
    return `<div class="oreq">
      <h4>Requerimientos funcionales <span class="oreq-prog">${done}/${o.functionalReqs.length}</span></h4>
      <ul class="oreq-list check">${rf}</ul>
      <h4>Reglas de negocio</h4><ul class="oreq-list rn">${rn}</ul>
      <p class="oreq-foot">Cada RF se cumple <b>escribiendo el código</b> en la computadora 💻; cada RN vive en <code>BusinessRules</code>, no en la pantalla.</p>
    </div>`;
  }

  #render() {
    const active = this.#orderCtrl.active();
    const max = this.#orderCtrl.max();
    const full = active.length >= max;

    const disponibles = this.#orderCtrl.available().map((o) => {
      const d = DIFF[o.mainType] ?? DIFF.Chair;
      const openTag = this.#open.has(o.id);
      const pri = o.priority === "urgente" ? `<span class="pri urgente">⚠️ URGENTE</span>`
        : o.priority === "premium" ? `<span class="pri premium">💰 PREMIUM</span>` : "";
      return `
      <div class="doc ${o.isFinal ? "final" : ""}">
        <div class="doc-pin"></div>
        <b>PEDIDO ${o.code}</b> ${pri}
        <p>Cliente: ${esc(o.customer.name)} · <span class="diff ${d.cls}">${o.isFinal ? "🏨 PROYECTO FINAL" : d.tag}</span></p>
        ${o.brief ? `<p class="doc-brief">${esc(o.brief)}</p>` : ""}
        <p>Producto: <b>${o.summary}</b></p>
        <p class="doc-mats">Materiales necesarios:  ${this.#matLine(o)}</p>
        <p class="doc-reward">Pago: 🪙 $${o.reward}${o.deadline ? ` · ⏳ ${o.deadline} día${o.deadline > 1 ? "s" : ""}` : ""}</p>
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

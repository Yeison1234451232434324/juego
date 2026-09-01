import { Modal } from "./ui/Modal.js";
import { esc } from "./ui/dom.js";

/**
 * TraceabilityView — 🔎 TRAZABILIDAD.
 * Muestra, para cada requerimiento funcional del sistema, la cadena:
 *   REQUERIMIENTO → REGLA DE NEGOCIO → CLASE → MÉTODO → CAPA → ESTADO
 * El estado se calcula con el PROGRESO REAL del jugador (retos resueltos,
 * conceptos aplicados, fallos de esta sesión). No es una pantalla decorativa.
 */
const TRACE = [
  { code: "RF-001", title: "Registrar un producto (clase de mueble)", group: "clase", concept: "clase",
    rule: "Un producto se define con una clase.", cls: "class Chair extends Furniture", method: "FurnitureFactory.create()", layer: "Modelo" },
  { code: "RF-002", title: "Crear una familia de muebles", group: "herencia", concept: "herencia",
    rule: "Las subclases heredan de Furniture con extends/super().", cls: "class Table extends Furniture", method: "super(...)", layer: "Modelo" },
  { code: "RF-003", title: "Calcular el tiempo de producción", group: "polimorfismo", concept: "polimorfismo",
    rule: "El mismo método responde distinto en cada mueble.", cls: "Chair / Table / Cabinet", method: "calculateProductionTime()", layer: "Modelo" },
  { code: "RF-004", title: "Modelar el taller como composición", group: "composicion", concept: "composición",
    rule: "El Taller TIENE inventario, trabajador y pedidos.", cls: "class Workshop", method: "#inventory · #worker · #orders", layer: "Modelo" },
  { code: "RF-005", title: "Validar el precio de venta", group: "encapsulamiento", concept: "encapsulamiento",
    rule: "El precio no puede ser <= 0; el dato es privado.", cls: "Furniture (#price)", method: "setPrice() / BusinessRules.validatePrice()", layer: "Modelo · Reglas" },
  { code: "RF-006", title: "Impedir fabricar sin materiales", group: "abstraccion", concept: "abstracción",
    rule: "No se fabrica si el inventario no cubre la receta.", cls: "BusinessRules", method: "canCraft() → CraftingController → CraftingView", layer: "Reglas → Controlador → Vista" },
  { code: "RF-007", title: "Entregar los pedidos por capas (MVC)", group: null, concept: "MVC",
    rule: "La Vista capta el clic, el Controlador coordina, el Modelo aplica las reglas.", cls: "Order", method: "SalesView → OrderController → Order.deliver()", layer: "Vista → Controlador → Modelo" },
];

export class TraceabilityView {
  #modal; #gs;

  constructor(gs, bus) {
    this.#gs = gs;
    this.#modal = new Modal({ id: "trace", variant: "paper" });
    this.#modal.bind({ close: () => this.#modal.close() });
    bus.on("open:traceability", () => this.open());
  }

  open() { this.#render(); this.#modal.open(); }

  #state(t) {
    const done = this.#gs.requirements.get(t.code)?.isDone || this.#gs.player.knows(t.concept)
      || (t.group && this.#gs.challenges.groupSolved(t.group));
    if (done) return { ico: "🟢", txt: "Cumplido", cls: "ok" };
    const failing = t.group && this.#gs.challenges.groupFails(t.group) > 0;
    if (failing) return { ico: "🔴", txt: "Con errores", cls: "bad" };
    return { ico: "🟡", txt: "Pendiente", cls: "pend" };
  }

  #render() {
    const rows = TRACE.map((t) => {
      const s = this.#state(t);
      return `<div class="trace-row ${s.cls}">
        <div class="trace-head"><b>${t.code}</b> ${esc(t.title)}<span class="trace-st">${s.ico} ${s.txt}</span></div>
        <div class="trace-chain">
          <span>⚖️ ${esc(t.rule)}</span>
          <i>↓</i><span>🧱 <code>${esc(t.cls)}</code></span>
          <i>↓</i><span>⚙️ <code>${esc(t.method)}</code></span>
          <i>↓</i><span>🗂️ ${esc(t.layer)}</span>
        </div>
      </div>`;
    }).join("");

    const done = TRACE.filter((t) => this.#state(t).cls === "ok").length;
    this.#modal.render(`<div class="paper-panel">
      <h2>🔎 Trazabilidad requerimiento → código</h2>
      <p class="wp-sub">Cumplidos: <b>${done} / ${TRACE.length}</b> · 🟢 cumplido · 🟡 pendiente · 🔴 con errores.
        El estado sale de tu progreso real (retos y conceptos aplicados).</p>
      ${rows}
      <button class="k close" data-act="close">Salir [ESC]</button>
    </div>`);
  }
}

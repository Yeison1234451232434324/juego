import { Requirement } from "../models/Requirement.js";

/**
 * RequirementService — los requerimientos funcionales (RF) como misiones.
 * Aparecen como documentos en el mundo; se completan al hacer la acción real.
 */
const DEFS = [
  { code: "RF-001", text: "El sistema debe permitir registrar un producto (una clase de mueble).",
    rule: "Un producto se define con una clase (nombre, precio y método fabricar())." },
  { code: "RF-002", text: "El sistema debe permitir crear una familia de muebles.",
    rule: "Las subclases heredan de Mueble usando extends y super()." },
  { code: "RF-003", text: "El sistema debe calcular el tiempo de producción de cada mueble.",
    rule: "Polimorfismo: el método calcularTiempo() responde distinto en cada mueble." },
  { code: "RF-004", text: "El sistema debe modelar el taller como composición de partes.",
    rule: "El Taller TIENE un inventario, trabajadores y pedidos." },
  { code: "RF-005", text: "El sistema debe validar el precio de venta.",
    rule: "El precio no puede ser menor o igual a cero." },
  { code: "RF-006", text: "El sistema debe impedir fabricar sin materiales.",
    rule: "No se fabrica si el inventario no cubre la receta." },
  { code: "RF-007", text: "El sistema debe entregar los pedidos por capas (Vista → Controlador → Modelo).",
    rule: "La Vista capta el clic, el Controlador coordina y el Modelo aplica las reglas." },
];

export class RequirementService {
  #reqs = DEFS.map((d) => new Requirement(d));
  #bus;

  constructor(bus) { this.#bus = bus; }

  all() { return this.#reqs; }
  get(code) { return this.#reqs.find((r) => r.code === code); }
  doneCount() { return this.#reqs.filter((r) => r.isDone).length; }
  total() { return this.#reqs.length; }

  complete(code) {
    const r = this.get(code);
    if (r && !r.isDone) { r.complete(); this.#bus.emit("requirement:done", r); }
  }

  hydrate(list = []) {
    for (const c of list) { const r = this.get(c); if (r) r.complete(); }
  }
  toJSON() { return this.#reqs.filter((r) => r.isDone).map((r) => r.code); }
}

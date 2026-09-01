import { Upgrade } from "../models/Upgrade.js";

/**
 * UpgradeService — la Tienda de Mejoras (Carlos).
 *
 * Cada mejora es un FLAG independiente. Los controladores lo consultan con
 * `upgrades.has(key)` para cambiar el gameplay. NINGUNA mejora marca retos,
 * materiales ni pedidos como completados: solo modifican velocidades,
 * cantidades o ayudas. El aprendizaje siempre hay que hacerlo.
 */
const DEFS = [
  { key: "supplier",  name: "Proveedor confiable",       cost: 120,
    desc: "Cada reto que resuelvas te da +2 materiales extra. Necesitarás menos retos por pedido." },
  { key: "toolkit",   name: "Kit de herramientas nuevo", cost: 220,
    desc: "Mario fabrica un 15% más rápido." },
  { key: "organizer", name: "Organizador de materiales", cost: 300,
    desc: "El panel de objetivos te dice cuántos retos te faltan para completar el pedido." },
  { key: "analyzer",  name: "Analizador de código",      cost: 450,
    desc: "Cuando fallas un reto, te muestra la pista concreta automáticamente." },
  { key: "bench",     name: "Banco reforzado",           cost: 700,
    desc: "Mario fabrica un 25% más rápido (se suma al kit de herramientas)." },
  { key: "auto",      name: "Producción automática",     cost: 1100,
    desc: "Cada 20 s aparece 1 material del que te falte para tu pedido actual." },
];

// Compatibilidad: mejoras de guardados antiguos que ya no existen.
const RETIRED = new Set(["template", "collector", "compiler"]);

export class UpgradeService {
  #ups = DEFS.map((d) => new Upgrade(d));

  all() { return this.#ups; }
  get(key) { return this.#ups.find((u) => u.key === key); }
  has(key) { return !!this.get(key)?.owned; }

  hydrate(list = []) {
    for (const k of list) {
      if (RETIRED.has(k)) continue;   // se ignoran; su dinero ya se gastó
      this.get(k)?.buy();
    }
  }
  toJSON() { return this.#ups.filter((u) => u.owned).map((u) => u.key); }
}

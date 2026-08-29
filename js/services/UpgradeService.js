import { Upgrade } from "../models/Upgrade.js";

/**
 * UpgradeService — la Tienda de Mejoras. Cada mejora es un flag que los
 * controladores consultan para cambiar realmente el gameplay.
 */
const DEFS = [
  { key: "template",  name: "Plantilla de clases",  cost: 150,
    desc: "Los retos de código muestran una plantilla inicial que puedes completar." },
  { key: "collector", name: "Recolector eficiente", cost: 300,
    desc: "Los retos entregan el DOBLE de materiales." },
  { key: "bench",     name: "Banco optimizado",     cost: 500,
    desc: "La fabricación tarda un 30% menos." },
  { key: "analyzer",  name: "Analizador de código", cost: 750,
    desc: "Muestra pistas concretas cuando tu código tiene errores." },
  { key: "auto",      name: "Automatización",        cost: 1200,
    desc: "Se produce 1 clavo automáticamente cada 12 s." },
  { key: "compiler",  name: "Compilador avanzado",   cost: 2000,
    desc: "Duplica la XP que ganas al resolver cada reto de programación." },
];

export class UpgradeService {
  #ups = DEFS.map((d) => new Upgrade(d));

  all() { return this.#ups; }
  get(key) { return this.#ups.find((u) => u.key === key); }
  has(key) { return !!this.get(key)?.owned; }

  hydrate(list = []) { for (const k of list) this.get(k)?.buy(); }
  toJSON() { return this.#ups.filter((u) => u.owned).map((u) => u.key); }
}

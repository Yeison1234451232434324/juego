import { Furniture } from "./Furniture.js";
import { CONFIG } from "../config/gameConfig.js";

/** Chair — HERENCIA de Furniture. Añade #comfort. POLIMORFISMO en el tiempo. */
export class Chair extends Furniture {
  #comfort;
  constructor(style = "rústico") {
    super("Silla", CONFIG.ECONOMY.sellBase.Chair, CONFIG.RECIPES.Chair, style);
    this.#comfort = style === "moderno" ? 8 : 6;
  }
  get comfort() { return this.#comfort; }
  calculateProductionTime() { return CONFIG.CRAFT_SECONDS.Chair; }   // 15
}

import { Furniture } from "./Furniture.js";
import { CONFIG } from "../config/gameConfig.js";

/** Cabinet — HERENCIA de Furniture. Añade #doors. Es el que más tarda. */
export class Cabinet extends Furniture {
  #doors;
  constructor(style = "clásico") {
    super("Armario", CONFIG.ECONOMY.sellBase.Cabinet, CONFIG.RECIPES.Cabinet, style);
    this.#doors = 2;
  }
  get doors() { return this.#doors; }
  calculateProductionTime() { return CONFIG.CRAFT_SECONDS.Cabinet; } // 45
}

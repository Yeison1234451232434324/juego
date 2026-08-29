import { Furniture } from "./Furniture.js";
import { CONFIG } from "../config/gameConfig.js";

/** Table — HERENCIA de Furniture. Añade #seats. */
export class Table extends Furniture {
  #seats;
  constructor(style = "comedor") {
    super("Mesa", CONFIG.ECONOMY.sellBase.Table, CONFIG.RECIPES.Table, style);
    this.#seats = 4;
  }
  get seats() { return this.#seats; }
  calculateProductionTime() { return CONFIG.CRAFT_SECONDS.Table; }   // 30
}

import { GameEntity } from "./GameEntity.js";

/**
 * Requirement — un requerimiento funcional (RF). Aparece como misión del juego.
 * Estados: pending → done  (o blocked).
 */
export class Requirement extends GameEntity {
  #code; #text; #rule; #status = "pending";

  constructor({ code, text, rule = "" }) {
    super(code);
    this.#code = code; this.#text = text; this.#rule = rule;
  }

  get code() { return this.#code; }
  get text() { return this.#text; }
  get rule() { return this.#rule; }
  get status() { return this.#status; }
  get isDone() { return this.#status === "done"; }

  complete() { this.#status = "done"; }
  block() { this.#status = "blocked"; }
}

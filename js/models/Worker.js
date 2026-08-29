import { GameEntity } from "./GameEntity.js";

/** Worker — el carpintero. Encapsula #status; ocupado no acepta otra tarea. */
export class Worker extends GameEntity {
  #status = "idle"; // idle | busy
  constructor(name = "Mario") { super(name); }

  get status() { return this.#status; }
  get isAvailable() { return this.#status === "idle"; }

  assign() { if (this.#status !== "idle") return false; this.#status = "busy"; return true; }
  release() { this.#status = "idle"; }
}

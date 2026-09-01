import { CodeValidator } from "../services/CodeValidator.js";

/**
 * ProgrammingController — CONTROLADOR de la computadora (retos de producción).
 *
 * Valida el código del jugador y, SI ES CORRECTO, entrega materiales para el
 * pedido actual y llama a challenges.registerSolved(id). Si falla, no entrega
 * nada y rota a otro reto del mismo tema.
 *
 * NADA aquí marca un reto como resuelto salvo un EJECUTAR correcto. Las mejoras
 * (supplier, auto) solo cambian CUÁNTO material se entrega, nunca si el reto
 * está resuelto.
 */
export class ProgrammingController {
  #gs; #bus;
  constructor(gs, bus) { this.#gs = gs; this.#bus = bus; }

  currentChallenge() {
    return this.#gs.challenges.current(this.#gs.player.level, this.#gs.focusOrder?.mainType);
  }

  failCount(id) { return this.#gs.challenges.failCount(id); }

  /** Texto inicial del editor: SIEMPRE el esqueleto con huecos (nunca la solución). */
  editorText(ch) { return ch.starter; }

  /** ¿Qué material y cuánto entregar por resolver este reto? */
  #award(ch) {
    const order = this.#gs.focusOrder;
    const inv = this.#gs.workshop.inventory;
    const extra = this.#gs.upgrades.has("supplier") ? 2 : 0;   // "Proveedor confiable": +2

    if (!order) return { material: "wood", amount: 3 + extra };

    const need = order.materials;
    let material = "wood", best = -1;
    for (const m of Object.keys(need)) {
      const s = Math.max(0, need[m] - inv.count(m));
      if (s > best) { best = s; material = m; }
    }
    let amount = (best > 0 ? Math.min(4, best) : 3) + extra;
    // "Producción automática" ya da bonus pasivo; aquí el bonus es de supplier.
    return { material, amount };
  }

  submit(code) {
    const ch = this.currentChallenge();
    if (!ch) return { ok: false, done: true };

    const result = CodeValidator.validate(code, ch.checks, this.#gs.upgrades.has("analyzer"));

    if (!result.ok) {
      this.#gs.challenges.registerFail(ch.id);
      const fails = this.#gs.challenges.failCount(ch.id);
      this.#bus.emit("challenge:failed", { challenge: ch, result, explain: ch.explainOnFail, fails });
      return { ok: false, result, fails };
    }

    // ---- éxito: SOLO ahora se marca el reto como resuelto ----
    const info = this.#gs.challenges.registerSolved(ch.id);
    const { material, amount } = this.#award(ch);
    this.#gs.workshop.inventory.add(material, amount);

    const xp = 50;
    const lvls = this.#gs.player.addXp(xp);

    if (info.concept) this.#gs.player.learn(info.concept);
    this.#gs.player.stats.classesImplemented++;
    (this.#gs.player.stats.challengesDone ??= []).push(ch.id);
    if (info.firstOfConcept && info.rf) this.#gs.requirements.complete(info.rf);

    const order = this.#gs.focusOrder;
    const need = order ? (order.materials[material] ?? 0) : 0;
    const have = this.#gs.workshop.inventory.count(material);

    this.#bus.emit("challenge:solved", {
      challenge: ch,
      award: { material, amount, have, need },
      xp,
      orderReady: order ? this.#hasAllMaterials(order) : false,
    });
    if (lvls) this.#bus.emit("player:levelup", this.#gs.player.level);
    this.#bus.emit("state:changed");
    return { ok: true, challenge: ch, award: { material, amount } };
  }

  #hasAllMaterials(order) {
    const inv = this.#gs.workshop.inventory;
    return Object.entries(order.materials).every(([m, q]) => inv.count(m) >= q);
  }
}

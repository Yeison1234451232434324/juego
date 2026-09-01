import { CodeValidator } from "../services/CodeValidator.js";
import { CONFIG } from "../config/gameConfig.js";

/**
 * ProgrammingController — CONTROLADOR de la computadora (retos de producción).
 * Valida el código del jugador y, si es correcto, entrega MATERIALES para el
 * pedido en el que está trabajando. Si falla, no da nada y rota a otro reto.
 */
export class ProgrammingController {
  #gs; #bus;
  constructor(gs, bus) { this.#gs = gs; this.#bus = bus; }

  currentChallenge() {
    return this.#gs.challenges.current(this.#gs.player.level);
  }

  failCount(id) { return this.#gs.challenges.failCount(id); }

  /** Texto inicial del editor (el ejemplo si se compró la mejora). */
  editorText(ch) {
    return this.#gs.upgrades.has("template") ? ch.ejemplo : ch.starter;
  }

  /** ¿Qué material y cuánto necesita el jugador para su pedido actual? */
  #materialToAward() {
    const order = this.#gs.focusOrder;
    const inv = this.#gs.workshop.inventory;
    const CAP = 4;
    if (!order) return { material: "wood", amount: 3 };

    const need = order.materials;
    const short = {};
    for (const m of Object.keys(need)) short[m] = Math.max(0, need[m] - inv.count(m));
    // el material con mayor déficit
    let material = "wood", best = -1;
    for (const [m, s] of Object.entries(short)) if (s > best) { best = s; material = m; }
    const amount = best > 0 ? Math.min(CAP, best) : 3;
    return { material, amount };
  }

  submit(code) {
    const ch = this.currentChallenge();
    if (!ch) return { ok: false, done: true };

    const result = CodeValidator.validate(code, ch.checks, this.#gs.upgrades.has("analyzer"));

    if (!result.ok) {
      this.#gs.challenges.registerFail(ch.id);
      const fails = this.#gs.challenges.failCount(ch.id);
      this.#bus.emit("challenge:failed", {
        challenge: ch, result,
        explain: ch.explainOnFail,
        fails,
        next: this.#gs.challenges.current(this.#gs.player.level),
      });
      return { ok: false, result, fails };
    }

    // ---- éxito: entregar materiales POR EL MODELO ----
    const info = this.#gs.challenges.registerSolved(ch.id);
    const { material, amount } = this.#materialToAward();
    const give = this.#gs.upgrades.has("collector") ? amount * 2 : amount;
    this.#gs.workshop.inventory.add(material, give);

    let xp = 50;
    if (this.#gs.upgrades.has("compiler")) xp *= 2;
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
      award: { material, amount: give, have, need },
      xp,
      orderReady: order ? this.#hasAllMaterials(order) : false,
    });
    if (lvls) this.#bus.emit("player:levelup", this.#gs.player.level);
    this.#bus.emit("state:changed");
    return { ok: true, challenge: ch, award: { material, amount: give } };
  }

  #hasAllMaterials(order) {
    const inv = this.#gs.workshop.inventory;
    return Object.entries(order.materials).every(([m, q]) => inv.count(m) >= q);
  }
}

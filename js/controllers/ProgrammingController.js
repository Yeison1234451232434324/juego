import { CodeValidator } from "../services/CodeValidator.js";
import { CONFIG } from "../config/gameConfig.js";

/**
 * ProgrammingController — CONTROLADOR de la Mesa de Código.
 * Recibe el código del jugador, lo valida con CodeValidator (servicio de
 * dominio), y si es correcto entrega materiales y XP a través del Modelo.
 */
export class ProgrammingController {
  #gs; #bus;
  constructor(gs, bus) { this.#gs = gs; this.#bus = bus; }

  currentChallenge() {
    return this.#gs.challenges.currentCodeChallenge(this.#gs.player.level);
  }

  /** Texto inicial del editor (plantilla completa si se compró la mejora). */
  editorText(ch) {
    return this.#gs.upgrades.has("template") ? ch.template : ch.starter;
  }

  submit(code) {
    const ch = this.currentChallenge();
    if (!ch) return { ok: false, done: true };

    const result = CodeValidator.validate(code, ch.checks, this.#gs.upgrades.has("analyzer"));
    if (!result.ok) {
      this.#bus.emit("challenge:failed", { challenge: ch, result });
      return { ok: false, result };
    }

    // --- éxito: aplicar recompensas por el MODELO ---
    this.#gs.challenges.markDone(ch.id);
    const dbl = this.#gs.upgrades.has("collector");
    const rewards = { ...ch.rewards };
    for (const [k, v] of Object.entries(rewards)) {
      if (k === "xp") continue;
      this.#gs.workshop.inventory.add(k, dbl ? v * 2 : v);
    }
    if (this.#gs.upgrades.has("compiler") && rewards.xp) rewards.xp *= 2;
    const lvls = this.#gs.player.addXp(rewards.xp ?? CONFIG.XP.challenge);
    this.#gs.player.learn(ch.concept);
    this.#gs.player.stats.classesImplemented++;
    if (ch.rf) this.#gs.requirements.complete(ch.rf);

    this.#bus.emit("challenge:solved", { challenge: ch, rewards, doubled: dbl });
    if (lvls) this.#bus.emit("player:levelup", this.#gs.player.level);
    this.#bus.emit("state:changed");
    return { ok: true, challenge: ch, rewards };
  }
}

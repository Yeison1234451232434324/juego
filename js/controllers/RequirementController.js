import { CONFIG } from "../config/gameConfig.js";

/**
 * RequirementController — CONTROLADOR de la Mesa de Arquitectura.
 * El jugador lleva un requerimiento y decide en qué capa MVC va cada cosa.
 * Aquí MVC es GAMEPLAY: acertar entrega el material "núcleo".
 */
export class RequirementController {
  #gs; #bus;
  progress = {}; // challengeId -> step index alcanzado

  constructor(gs, bus) { this.#gs = gs; this.#bus = bus; }

  currentChallenge() { return this.#gs.challenges.currentMvcChallenge(); }

  answer(challengeId, stepIndex, optionIndex) {
    const ch = this.#gs.challenges.mvcChallenges().find((c) => c.id === challengeId);
    if (!ch) return { ok: false, done: true };
    const step = ch.steps[stepIndex];
    const correct = optionIndex === step.correct;

    this.#gs.player.stats.mvcAnswered++;
    if (correct) {
      this.#gs.player.stats.mvcCorrect++;
      this.progress[challengeId] = Math.max(this.progress[challengeId] ?? 0, stepIndex + 1);
    }

    const finished = correct && (this.progress[challengeId] ?? 0) >= ch.steps.length;
    if (finished) this.#complete(ch);

    this.#bus.emit("mvc:answered", { challenge: ch, stepIndex, correct, explain: step.explain, finished });
    return { ok: correct, correct, explain: step.explain, finished };
  }

  #complete(ch) {
    this.#gs.challenges.markMvcDone(ch.id);
    for (const [k, v] of Object.entries(ch.rewards)) {
      if (k === "xp") continue;
      this.#gs.workshop.inventory.add(k, v);
    }
    const lvls = this.#gs.player.addXp(ch.rewards.xp ?? CONFIG.XP.mvc);
    this.#gs.player.learn("MVC");
    if (ch.rf) this.#gs.requirements.complete(ch.rf);
    this.#bus.emit("mvc:solved", ch);
    if (lvls) this.#bus.emit("player:levelup", this.#gs.player.level);
    this.#bus.emit("state:changed");
  }
}

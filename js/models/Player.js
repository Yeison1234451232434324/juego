import { CONFIG } from "../config/gameConfig.js";

/**
 * Player — modelo del jugador: posición en el mundo, monedas, XP, nivel,
 * reputación y estadísticas para la evaluación final.
 * Encapsula la subida de nivel (nivel = floor(xp / xpPerLevel) + 1).
 */
export class Player {
  #x; #y;
  #coins;
  #xp = 0;
  #level = 1;
  #reputation = 0;

  stats = {
    objectsCreated: 0,
    classesImplemented: 0,
    challengesDone: [],       // ids
    mvcAnswered: 0,
    mvcCorrect: 0,
    rulesRespected: 0,
    rulesTotal: 0,
    ordersDelivered: 0,
    startedAt: Date.now(),
    concepts: {},             // encapsulamiento, herencia... -> true
  };

  constructor(x = 480, y = 330) {
    this.#x = x; this.#y = y;
    this.#coins = CONFIG.ECONOMY.startCoins;
  }

  get x() { return this.#x; }
  get y() { return this.#y; }
  get coins() { return this.#coins; }
  get xp() { return this.#xp; }
  get level() { return this.#level; }
  get reputation() { return this.#reputation; }
  get xpInLevel() { return this.#xp - (this.#level - 1) * CONFIG.XP.perLevel; }
  get xpForNext() { return CONFIG.XP.perLevel; }

  setPosition(x, y) { this.#x = x; this.#y = y; }

  earn(n) { this.#coins += n; }
  spend(n) { if (n > this.#coins) return false; this.#coins -= n; return true; }
  addReputation(n) { this.#reputation += n; }

  /** Devuelve los niveles subidos. */
  addXp(n) {
    this.#xp += Math.max(0, n);
    const lvl = Math.floor(this.#xp / CONFIG.XP.perLevel) + 1;
    const gained = Math.max(0, lvl - this.#level);
    this.#level = lvl;
    return gained;
  }

  learn(concept) { this.stats.concepts[concept] = true; }
  knows(concept) { return !!this.stats.concepts[concept]; }

  /** Registra la calidad de una pieza fabricada (para medias y evaluación). */
  recordQuality(score) {
    this.stats.qualitySum = (this.stats.qualitySum || 0) + score;
    this.stats.qualityCount = (this.stats.qualityCount || 0) + 1;
    this.stats.bestQuality = Math.max(this.stats.bestQuality || 0, score);
  }
  get avgQuality() {
    return this.stats.qualityCount ? Math.round(this.stats.qualitySum / this.stats.qualityCount) : 0;
  }

  hydrate(d) {
    if (!d) return;
    this.#x = d.x ?? this.#x; this.#y = d.y ?? this.#y;
    this.#coins = d.coins ?? this.#coins;
    this.#xp = d.xp ?? 0; this.#level = d.level ?? 1;
    this.#reputation = d.reputation ?? 0;
    if (d.stats) this.stats = { ...this.stats, ...d.stats, concepts: { ...d.stats.concepts } };
  }

  toJSON() {
    return {
      x: this.#x, y: this.#y, coins: this.#coins, xp: this.#xp, level: this.#level,
      reputation: this.#reputation, stats: this.stats,
    };
  }
}

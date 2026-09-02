import { PlayerController } from "./PlayerController.js";
import { ProgrammingController } from "./ProgrammingController.js";
import { CraftingController } from "./CraftingController.js";
import { OrderController } from "./OrderController.js";
import { WorkshopController } from "./WorkshopController.js";
import { UpgradeController } from "./UpgradeController.js";
import { TutorialController } from "./TutorialController.js";
import { KnowledgeService } from "../services/KnowledgeService.js";

/**
 * GameController — CONTROLADOR PRINCIPAL.
 * Crea los sub-controladores, corre el reloj del juego y decide el OBJETIVO
 * del jugador. Durante el tutorial manda el TutorialController; después, el
 * objetivo se calcula a partir de los pedidos activos.
 */
export class GameController {
  #gs; #bus; #save;
  player; programming; crafting; orders; workshop; upgrades; tutorial;
  requirements;   // servicio RF (para la evaluación)

  #dayAcc = 0;
  #autoAcc = 0;
  #saveT = null;

  constructor(gs, bus, save) {
    this.#gs = gs; this.#bus = bus; this.#save = save;
    this.requirements = gs.requirements;
    this.player = new PlayerController(gs.player);
    this.programming = new ProgrammingController(gs, bus);
    this.crafting = new CraftingController(gs, bus);
    this.orders = new OrderController(gs, bus);
    this.workshop = new WorkshopController(gs, bus);
    this.upgrades = new UpgradeController(gs, bus);
    this.tutorial = new TutorialController(gs, bus);
    this.#wire();
  }

  get state() { return this.#gs; }

  /** Guarda como mucho una vez cada ~500 ms (evita N serializaciones al hilo). */
  #saveDebounced() {
    if (this.#saveT) return;
    this.#saveT = setTimeout(() => { this.#saveT = null; this.#save.save(this.#gs); }, 500);
  }
  /** Guardado inmediato (al cerrar la pestaña / cambiar de escena). */
  flush() { clearTimeout(this.#saveT); this.#saveT = null; this.#save.save(this.#gs); }

  #wire() {
    this.#bus.on("state:changed", () => {
      this.#gs.achievements.check(this.#gs.player);
      this.#saveDebounced();
    });
    // No perder los últimos cambios al recargar / cerrar la pestaña.
    window.addEventListener("pagehide", () => this.flush());
    window.addEventListener("beforeunload", () => this.flush());

    // El objetivo de juego LIBRE se recalcula ante cualquier avance.
    const recalc = () => { if (this.#gs.tutorialCompleted) this.#freeObjective(); };
    this.#bus.on("order:accepted", recalc);
    this.#bus.on("order:cancelled", recalc);
    this.#bus.on("challenge:solved", recalc);
    this.#bus.on("craft:done", recalc);
    this.#bus.on("order:delivered", recalc);
    this.#bus.on("tutorial:complete", () => this.#freeObjective());
    this.#bus.on("game:resume", () => { if (this.#gs.tutorialCompleted) this.#freeObjective(); });

    this.#bus.on("player:levelup", (lvl) => { if (lvl >= 5) this.#gs.offerFinalProject(); });

    // --- CONOCIMIENTO: los conceptos de MVC se aprenden HACIENDO ---
    const learn = (k) => { if (!this.#gs.player.knows(k)) { this.#gs.player.learn(k); this.#bus.emit("state:changed"); } };
    this.#bus.on("challenge:failed", () => { this.#gs.player.stats.errors = (this.#gs.player.stats.errors || 0) + 1; });
    this.#bus.on("station:open", () => learn("Vista"));
    this.#bus.on("order:accepted", () => learn("Controlador"));
    this.#bus.on("craft:started", () => learn("Controlador"));
    this.#bus.on("craft:done", () => learn("Modelo"));
    this.#bus.on("rule:blocked", () => learn("Regla de negocio"));
    this.#bus.on("open:traceability", () => learn("Requerimientos"));
    this.#bus.on("requirements:viewed", () => learn("Requerimientos"));
    this.#bus.on("mvcflow:shown", () => learn("Flujo MVC"));
    // Una vista puede PEDIR marcar un concepto (p. ej. la demo de polimorfismo);
    // la mutación del modelo la hace aquí, no la vista.
    this.#bus.on("concept:learned", (k) => learn(k));
  }

  /** Objetivo en juego libre: mira el pedido en el que se centra el jugador. */
  #freeObjective() {
    const gs = this.#gs;
    const o = gs.focusOrder;

    if (!o) {
      gs.setObjective("Acepta un trabajo en el Tablón de Pedidos 📋.", "orders", "orders");
      return;
    }

    const inv = gs.workshop.inventory;
    const need = o.materials;
    const faltaMat = Object.entries(need).filter(([m, q]) => inv.count(m) < q);
    const faltaFab = o.lines.filter((l) => gs.workshop.countStock(l.type) + l.done < l.qty);

    if (faltaMat.length) {
      const txt = Object.entries(need)
        .map(([m, q]) => `${m === "wood" ? "🪵" : "🔩"} ${inv.count(m)}/${q}`).join("  ");
      gs.setObjective(`Consigue materiales para ${o.summary} en la computadora 💻.  ${txt}`, "coding", "coding");
    } else if (faltaFab.length) {
      gs.setObjective(`Fabrica ${o.summary} en el Banco de trabajo 🔨.`, "bench", "bench");
    } else {
      gs.setObjective(`Entrega el pedido ${o.code} en el Mostrador 🧾.`, "sales", "sales");
    }
  }

  /** Reloj — lo llama la escena cada frame (dt en ms). */
  update(dtMs) {
    const dt = dtMs / 1000;
    this.crafting.tick(dt);
    this.workshop.tick(dt);
    this.#gs.events?.tick(dt);

    this.#dayAcc += dt;
    if (this.#dayAcc >= 60) {
      this.#dayAcc = 0;
      this.#gs.player.stats.day = (this.#gs.player.stats.day ?? 1) + 1;
      this.#bus.emit("state:changed");
    }

    // "Producción automática": cada 20 s, +1 del material que falte para el pedido.
    if (this.#gs.upgrades.has("auto")) {
      this.#autoAcc += dt;
      if (this.#autoAcc >= 20) {
        this.#autoAcc = 0;
        const o = this.#gs.focusOrder;
        const inv = this.#gs.workshop.inventory;
        let mat = "nails";
        if (o) {
          const need = o.materials;
          mat = Object.keys(need).find((m) => inv.count(m) < need[m]) ?? "wood";
        }
        inv.add(mat, 1);
        this.#bus.emit("state:changed");
      }
    }
  }

  /** Evaluación final basada en lo que REALMENTE hizo el jugador. */
  evaluation() {
    const p = this.#gs.player, gs = this.#gs;
    const rulesPct = p.stats.rulesTotal ? Math.round((p.stats.rulesRespected / p.stats.rulesTotal) * 100) : 100;
    const reqDone = gs.requirements.doneCount(), reqTotal = gs.requirements.total();
    const minutes = Math.max(1, Math.round((Date.now() - p.stats.startedAt) / 60000));

    // POO por concepto (%)
    const pooKeys = new Set(["clase", "objeto", "atributo", "metodo", "encapsulamiento", "herencia", "polimorfismo", "abstracción", "composición"]);
    const poo = {};
    for (const c of KnowledgeService.pooConcepts())
      if (pooKeys.has(c.key)) poo[c.name] = Math.round(KnowledgeService.pooProgress(gs, c) * 100);
    // MVC por concepto (%)
    const mvc = {};
    for (const m of KnowledgeService.mvcConcepts()) mvc[m.name] = p.knows(m.key) ? 100 : 0;

    const avg = (o) => { const v = Object.values(o); return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : 0; };
    const pooScore = avg(poo);
    const mvcScore = avg(mvc);
    const logicScore = Math.round((rulesPct + (reqDone / Math.max(1, reqTotal)) * 100) / 2);
    const qualityScore = p.avgQuality || Math.round((pooScore + mvcScore) / 2);
    const final = Math.round((pooScore + mvcScore + logicScore + qualityScore) / 4);
    const stars = Math.max(1, Math.min(5, Math.round(final / 20)));
    const lvl = final >= 90 ? 6 : final >= 75 ? 5 : final >= 55 ? 4 : Math.max(1, p.level);
    const rank = KnowledgeService.rank(lvl);

    return {
      objectsCreated: p.stats.objectsCreated,
      classesImplemented: p.stats.classesImplemented,
      challengesDone: (p.stats.challengesDone || []).length,
      errors: p.stats.errors || 0,
      rulesRespected: p.stats.rulesRespected, rulesTotal: p.stats.rulesTotal, rulesPct,
      requirements: `${reqDone}/${reqTotal}`,
      concepts: Object.fromEntries([...pooKeys, "MVC"].map((c) => [c, p.knows(c)])),
      poo, mvc, pooScore, mvcScore, logicScore, qualityScore, final,
      avgQuality: p.avgQuality, reputation: p.reputation,
      minutes, stars, rank,
      title: rank.name,
      finalDone: !!p.stats.finalDone,
    };
  }
}

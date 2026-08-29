import { PlayerController } from "./PlayerController.js";
import { ProgrammingController } from "./ProgrammingController.js";
import { CraftingController } from "./CraftingController.js";
import { OrderController } from "./OrderController.js";
import { WorkshopController } from "./WorkshopController.js";
import { RequirementController } from "./RequirementController.js";
import { UpgradeController } from "./UpgradeController.js";

/**
 * GameController — CONTROLADOR PRINCIPAL.
 * Crea los sub-controladores, corre el reloj del juego (fabricación, corte,
 * automatización, día), gestiona logros/objetivos y el guardado automático.
 */
export class GameController {
  #gs; #bus; #save;
  player; programming; crafting; orders; workshop; requirements; upgrades;

  #dayAcc = 0;
  #autoAcc = 0;

  constructor(gs, bus, save) {
    this.#gs = gs; this.#bus = bus; this.#save = save;
    this.player = new PlayerController(gs.player);
    this.programming = new ProgrammingController(gs, bus);
    this.crafting = new CraftingController(gs, bus);
    this.orders = new OrderController(gs, bus);
    this.workshop = new WorkshopController(gs, bus);
    this.requirements = new RequirementController(gs, bus);
    this.upgrades = new UpgradeController(gs, bus);
    this.#wire();
  }

  get state() { return this.#gs; }

  #wire() {
    // guardado automático + logros ante cualquier cambio
    this.#bus.on("state:changed", () => {
      this.#gs.achievements.check(this.#gs.player);
      this.#save.save(this.#gs);
    });

    this.#bus.on("challenge:solved", ({ challenge }) => this.#advanceObjective(challenge));
    this.#bus.on("craft:done", () => this.#advanceObjective());
    this.#bus.on("order:delivered", () => this.#advanceObjective());

    this.#bus.on("player:levelup", (lvl) => {
      if (lvl >= 5) this.#gs.offerFinalProject();
    });
  }

  #advanceObjective(challenge) {
    const gs = this.#gs;
    const inv = gs.workshop.inventory;
    if (challenge?.id === "chair")
      gs.setObjective("Con la madera y los clavos, fabrica la Silla en el Banco 🪚.", "bench");
    else if (gs.workshop.countStock("Chair") > 0 && gs.player.stats.ordersDelivered === 0)
      gs.setObjective("Acepta un pedido en el Tablón 📋 y entrégalo en el Mostrador 🏪.", "orders");
    else if (gs.player.stats.ordersDelivered >= 1 && !gs.upgrades.has("template"))
      gs.setObjective("Con tu dinero, compra una mejora en la Tienda 🏪 (Carlos).", "shop");
    else if (gs.player.stats.finalDone)
      gs.setObjective("¡Proyecto Final completado!", null);
    else if (gs.player.stats.finalOffered && !gs.player.stats.finalDone)
      gs.setObjective("Completa el Proyecto Final del Hotel Gran Roble 📋.", "orders");
    else if (!inv.has("wood", 4) || !inv.has("nails", 2))
      gs.setObjective("Necesitas materiales: resuelve retos en la Mesa de Código 💻.", "coding");
    else
      gs.setObjective("Sigue el ciclo: programa 💻 → fabrica 🪚 → vende 🏪.", "bench");
  }

  /** Reloj — lo llama la escena cada frame (dt en ms). */
  update(dtMs) {
    const dt = dtMs / 1000;
    this.crafting.tick(dt);
    this.workshop.tick(dt);

    this.#dayAcc += dt;
    if (this.#dayAcc >= 60) { this.#dayAcc = 0; this.#gs.player.stats.day = (this.#gs.player.stats.day ?? 1) + 1; this.#bus.emit("state:changed"); }

    if (this.#gs.upgrades.has("auto")) {
      this.#autoAcc += dt;
      if (this.#autoAcc >= 12) { this.#autoAcc = 0; this.#gs.workshop.inventory.add("nails", 1); this.#bus.emit("state:changed"); }
    }
  }

  /** Evaluación final basada en lo que REALMENTE hizo el jugador. */
  evaluation() {
    const p = this.#gs.player, gs = this.#gs;
    const rulesPct = p.stats.rulesTotal ? Math.round((p.stats.rulesRespected / p.stats.rulesTotal) * 100) : 100;
    const reqDone = gs.requirements.doneCount(), reqTotal = gs.requirements.total();
    const minutes = Math.max(1, Math.round((Date.now() - p.stats.startedAt) / 60000));
    const concepts = ["encapsulamiento", "herencia", "polimorfismo", "abstracción", "composición", "MVC"];
    const known = concepts.filter((c) => p.knows(c));
    const stars = Math.max(1, Math.min(5, Math.round(
      (reqDone / reqTotal) * 2 + (known.length / concepts.length) * 2 + (rulesPct / 100)
    )));
    return {
      objectsCreated: p.stats.objectsCreated,
      classesImplemented: p.stats.classesImplemented,
      rulesRespected: p.stats.rulesRespected, rulesTotal: p.stats.rulesTotal, rulesPct,
      requirements: `${reqDone}/${reqTotal}`,
      concepts: Object.fromEntries(concepts.map((c) => [c, p.knows(c)])),
      minutes, stars,
      title: stars >= 5 ? "Arquitecto del taller" : stars >= 4 ? "Maestro carpintero" : stars >= 3 ? "Oficial" : "Aprendiz",
      finalDone: !!p.stats.finalDone,
    };
  }
}

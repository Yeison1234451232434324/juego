import { PlayerController } from "./PlayerController.js";
import { ProgrammingController } from "./ProgrammingController.js";
import { CraftingController } from "./CraftingController.js";
import { OrderController } from "./OrderController.js";
import { WorkshopController } from "./WorkshopController.js";
import { UpgradeController } from "./UpgradeController.js";
import { TutorialController } from "./TutorialController.js";
import { CONFIG } from "../config/gameConfig.js";

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

  #wire() {
    this.#bus.on("state:changed", () => {
      this.#gs.achievements.check(this.#gs.player);
      this.#save.save(this.#gs);
    });

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
    const concepts = ["clase", "encapsulamiento", "herencia", "polimorfismo", "abstracción", "composición", "MVC"];
    const known = concepts.filter((c) => p.knows(c));
    const stars = Math.max(1, Math.min(5, Math.round(
      (reqDone / Math.max(1, reqTotal)) * 2 + (known.length / concepts.length) * 2 + (rulesPct / 100)
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

import { BusinessRules } from "../services/BusinessRules.js";
import { QualityService } from "../services/QualityService.js";
import { CONFIG } from "../config/gameConfig.js";

/**
 * CraftingController — CONTROLADOR del Banco de Carpintería.
 * Aplica las reglas de negocio (materiales, trabajador) y ejecuta la
 * fabricación con tiempo real.
 */
export class CraftingController {
  #gs; #bus;

  constructor(gs, bus) { this.#gs = gs; this.#bus = bus; }

  /** Las fabricaciones en curso viven en el MODELO (Workshop) para que
   *  persistan: recargar en mitad de una fabricación NO pierde los materiales. */
  get jobs() { return this.#gs.workshop.jobs; }

  /** Tipos de mueble que algún pedido activo necesita fabricar. */
  neededTypes() {
    const out = [];
    for (const t of Object.keys(CONFIG.RECIPES)) {
      const rem = this.#gs.workshop.orders.reduce((s, o) => s + o.remainingOf(t), 0);
      const inStock = this.#gs.workshop.countStock(t);
      if (rem - inStock > 0) out.push({ type: t, remaining: rem - inStock });
    }
    return out;
  }

  /** Info para la Vista (sin decidir nada). */
  status(type) {
    const recipe = CONFIG.RECIPES[type];
    const inv = this.#gs.workshop.inventory;
    return {
      type, recipe,
      have: Object.fromEntries(Object.keys(recipe).map((m) => [m, inv.count(m)])),
      canCraft: BusinessRules.canCraft(recipe, inv).ok,
      workerFree: this.#gs.workshop.worker.isAvailable,
      seconds: this.#craftSeconds(type),
    };
  }

  #craftSeconds(type) {
    const base = CONFIG.CRAFT_SECONDS[type] ?? 15;
    let mult = 1;
    if (this.#gs.upgrades.has("toolkit")) mult -= 0.15;   // Kit de herramientas
    if (this.#gs.upgrades.has("bench")) mult -= 0.25;     // Banco reforzado
    return Math.max(3, Math.round(base * mult));
  }

  /** Cuántas piezas de este tipo faltan aún para los pedidos activos. */
  pendingOf(type) {
    const rem = this.#gs.workshop.orders.reduce((s, o) => s + o.remainingOf(type), 0);
    return Math.max(0, rem - this.#gs.workshop.countStock(type) - this.jobs.filter((j) => j.type === type).length);
  }

  /** `batch` = seguir con la siguiente pieza automáticamente al terminar. */
  craft(type, batch = false) {
    const recipe = CONFIG.RECIPES[type];
    if (!recipe) return this.#deny({ reason: "Ese mueble no existe.", rule: "" });

    const r0 = BusinessRules.furnitureIsNeeded(type, this.#gs.workshop.orders);
    if (!r0.ok) return this.#deny(r0);
    const r1 = BusinessRules.canCraft(recipe, this.#gs.workshop.inventory);
    if (!r1.ok) return this.#deny(r1);
    const r2 = BusinessRules.workerAvailable(this.#gs.workshop.worker);
    if (!r2.ok) return this.#deny(r2);

    this.#gs.workshop.inventory.consume(recipe);
    this.#gs.workshop.worker.assign();
    const job = { id: `j${Date.now()}${Math.floor(Math.random() * 1000)}`, type, elapsed: 0, total: this.#craftSeconds(type), batch: !!batch };
    this.#gs.workshop.jobs.push(job);
    this.#bus.emit("craft:started", job);
    this.#bus.emit("state:changed");
    return { ok: true, job };
  }

  tick(dt) {
    const jobs = this.#gs.workshop.jobs;
    if (!jobs.length) return;
    const finished = [];
    for (const j of jobs) {
      j.elapsed += dt;
      this.#bus.emit("craft:progress", { id: j.id, ratio: Math.min(1, j.elapsed / j.total) });
      if (j.elapsed >= j.total) finished.push(j);
    }
    for (const j of finished) this.#finish(j);
  }

  #finish(job) {
    const ws = this.#gs.workshop;
    ws.jobs = ws.jobs.filter((x) => x !== job);
    ws.worker.release();

    // CALIDAD de la pieza (del progreso real del jugador)
    const q = QualityService.evaluatePiece(this.#gs);
    this.#gs.workshop.addStock(job.type, "rústico", q.score);
    this.#gs.player.recordQuality(q.score);

    this.#gs.player.stats.objectsCreated++;
    this.#gs.requirements.complete("RF-006");
    const lvls = this.#gs.player.addXp(CONFIG.XP.craft);
    this.#bus.emit("craft:done", { ...job, quality: q });
    if (lvls) this.#bus.emit("player:levelup", this.#gs.player.level);

    // PRODUCCIÓN POR LOTES: encadena la siguiente pieza si aún falta y se puede.
    if (job.batch && this.pendingOf(job.type) > 0
        && BusinessRules.canCraft(CONFIG.RECIPES[job.type], this.#gs.workshop.inventory).ok
        && this.#gs.workshop.worker.isAvailable) {
      this.craft(job.type, true);
    }
    this.#bus.emit("state:changed");
  }

  #deny(rule) { this.#bus.emit("rule:blocked", rule); return { ok: false, ...rule }; }
}

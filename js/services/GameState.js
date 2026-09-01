import { Player } from "../models/Player.js";
import { Workshop } from "../models/Workshop.js";
import { Order } from "../models/Order.js";
import { RequirementService } from "./RequirementService.js";
import { ChallengeService } from "./ChallengeService.js";
import { OrderService } from "./OrderService.js";
import { UpgradeService } from "./UpgradeService.js";
import { AchievementService } from "./AchievementService.js";

/**
 * GameState — ÚNICA FUENTE DE VERDAD del MODELO.
 * Reúne al jugador, el taller y los servicios de dominio. Los controladores
 * actúan sobre él; las vistas lo leen mediante el EventBus. No conoce Phaser.
 */
export class GameState {
  #bus;
  player = new Player();
  workshop = new Workshop();
  requirements;
  challenges = new ChallengeService();
  orders = new OrderService();
  upgrades = new UpgradeService();
  achievements;

  availableOrders = [];
  objective = "Habla con BYTE.";
  hintStation = "orders";
  nextArrow = "orders";        // estación a la que apunta la flecha 👉 contextual

  tutorialCompleted = false;
  tutorialStep = 0;            // 0..N — permite reanudar el tutorial tras recargar
  focusOrderId = null;         // el pedido en el que se centra el HUD/objetivos

  constructor(bus) {
    this.#bus = bus;
    this.requirements = new RequirementService(bus);
    this.achievements = new AchievementService(bus);
    this.availableOrders.push(this.orders.starter());
  }

  get bus() { return this.#bus; }

  /** El pedido activo en el que se centra el jugador (el más antiguo por defecto). */
  get focusOrder() {
    return this.workshop.orders.find((o) => o.id === this.focusOrderId)
      ?? this.workshop.orders[0]
      ?? null;
  }

  setObjective(text, hintStation, nextArrow) {
    this.objective = text;
    if (hintStation !== undefined) this.hintStation = hintStation;
    if (nextArrow !== undefined) this.nextArrow = nextArrow;
    this.#bus.emit("objective:changed", { text, hintStation: this.hintStation, nextArrow: this.nextArrow });
  }

  refillOrders() {
    const want = this.tutorialCompleted ? 3 : 1;
    while (this.availableOrders.length < want) {
      this.availableOrders.push(this.orders.generate(this.player.level));
    }
  }

  offerFinalProject() {
    if (this.availableOrders.some((o) => o.isFinal) || this.player.stats.finalOffered) return;
    this.player.stats.finalOffered = true;
    this.availableOrders.unshift(this.orders.finalProject());
    this.setObjective("Proyecto Final del Hotel Gran Roble disponible en el Tablón de Pedidos.");
  }

  /**
   * Carga un guardado. MIGRACIÓN SEGURA: cada sistema recibe SU parte; lo que
   * falte usa valores por defecto; un guardado corrupto no rompe el juego.
   */
  hydrate(d) {
    if (!d || typeof d !== "object") return;
    try {
      this.player.hydrate(d.player);
      this.workshop.hydrate(d.workshop);
      this.requirements.hydrate(d.requirements);
      this.challenges.hydrate(d.challenges);       // solo retos REALMENTE resueltos
      this.upgrades.hydrate(d.upgrades);           // mejoras (ignora las retiradas)
      this.achievements.hydrate(d.achievements);
    } catch (e) { console.warn("hydrate parcial:", e); }

    this.objective = d.objective ?? this.objective;
    this.hintStation = d.hintStation ?? this.hintStation;
    this.nextArrow = d.nextArrow ?? this.nextArrow;
    this.tutorialCompleted = !!d.tutorialCompleted;
    this.tutorialStep = Number.isFinite(d.tutorialStep) ? d.tutorialStep : 0;

    try {
      this.availableOrders = (Array.isArray(d.availableOrders) ? d.availableOrders : [])
        .map((od) => Order.fromJSON(od));
    } catch (e) { console.warn("pedidos disponibles:", e); this.availableOrders = []; }

    this.focusOrderId = d.focusOrderId ?? this.workshop.orders[0]?.id ?? null;
    if (!this.availableOrders.length && !this.workshop.orders.length) {
      this.availableOrders.push(this.orders.starter());
    }
    this.refillOrders();
  }

  toJSON() {
    return {
      // v6: piezas con calidad, pedidos con prioridad/cliente enriquecido, stats
      // de calidad. MISMA clave de guardado: los campos nuevos usan valores por
      // defecto al cargar un guardado v5 (migración segura, no se pierde nada).
      version: 6,
      player: this.player.toJSON(),
      workshop: this.workshop.toJSON(),
      requirements: this.requirements.toJSON(),
      challenges: this.challenges.toJSON(),
      upgrades: this.upgrades.toJSON(),
      achievements: this.achievements.toJSON(),
      availableOrders: this.availableOrders.map((o) => o.toJSON()),
      objective: this.objective,
      hintStation: this.hintStation,
      nextArrow: this.nextArrow,
      tutorialCompleted: this.tutorialCompleted,
      tutorialStep: this.tutorialStep,
      focusOrderId: this.focusOrderId,
    };
  }
}

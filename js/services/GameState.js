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

  hydrate(d) {
    if (!d) return;
    this.player.hydrate(d.player);
    this.workshop.hydrate(d.workshop);
    this.requirements.hydrate(d.requirements);
    this.challenges.hydrate(d.challenges);
    this.upgrades.hydrate(d.upgrades);
    this.achievements.hydrate(d.achievements);
    if (d.objective) this.objective = d.objective;
    if (d.hintStation) this.hintStation = d.hintStation;
    if (d.nextArrow) this.nextArrow = d.nextArrow;
    this.tutorialCompleted = !!d.tutorialCompleted;
    this.tutorialStep = d.tutorialStep ?? 0;
    this.focusOrderId = d.focusOrderId ?? this.workshop.orders[0]?.id ?? null;
    this.availableOrders = (d.availableOrders ?? []).map((od) => Order.fromJSON(od));
    if (!this.availableOrders.length && !this.workshop.orders.length) {
      this.availableOrders.push(this.orders.starter());
    }
    this.refillOrders();
  }

  toJSON() {
    return {
      version: 5,
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

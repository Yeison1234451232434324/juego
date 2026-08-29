import { Player } from "../models/Player.js";
import { Workshop } from "../models/Workshop.js";
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
  objective = "Acércate a la computadora 💻 y crea la clase Chair.";
  hintStation = "coding";   // estación hacia la que apunta el marcador de objetivo
  introSeen = false;

  constructor(bus) {
    this.#bus = bus;
    this.requirements = new RequirementService(bus);
    this.achievements = new AchievementService(bus);
    this.availableOrders.push(this.orders.starter());
  }

  get bus() { return this.#bus; }

  setObjective(text, hintStation) {
    this.objective = text;
    if (hintStation !== undefined) this.hintStation = hintStation;
    this.#bus.emit("objective:changed", { text, hintStation: this.hintStation });
  }

  refillOrders() {
    while (this.availableOrders.length < 3) this.availableOrders.push(this.orders.generate(this.player.level));
  }

  offerFinalProject() {
    if (this.availableOrders.some((o) => o.isFinal) || this.player.stats.finalOffered) return;
    this.player.stats.finalOffered = true;
    this.availableOrders.unshift(this.orders.finalProject());
    this.setObjective("Proyecto Final del Hotel Gran Roble disponible en la Mesa de Pedidos.");
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
    this.introSeen = !!d.introSeen;
    this.refillOrders();
  }

  toJSON() {
    return {
      player: this.player.toJSON(),
      workshop: this.workshop.toJSON(),
      requirements: this.requirements.toJSON(),
      challenges: this.challenges.toJSON(),
      upgrades: this.upgrades.toJSON(),
      achievements: this.achievements.toJSON(),
      objective: this.objective,
      hintStation: this.hintStation,
      introSeen: this.introSeen,
    };
  }
}

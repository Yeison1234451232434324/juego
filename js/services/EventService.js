/**
 * EventService — pequeños EVENTOS del taller (opcionales, no rompen el flujo).
 * Cada cierto tiempo de juego lanza un evento leve con un efecto de un solo uso
 * o temporal. El estado es transitorio (no se guarda): al recargar, sin eventos.
 */
const MIN_GAP = 110;   // segundos mínimos entre eventos
const RANGE = 90;      // + aleatorio

export class EventService {
  #gs; #bus;
  #acc = 0;
  #next = 60;
  shopMultiplier = 1;      // "proveedor retrasado" encarece los materiales
  #shopUntil = 0;
  premiumNext = false;     // "cliente premium": el próximo pedido será premium

  constructor(gs, bus) { this.#gs = gs; this.#bus = bus; }

  /** Lo llama GameController.update (dt en segundos). */
  tick(dt) {
    this.#acc += dt;
    if (this.#shopUntil && this.#acc >= this.#shopUntil) {
      this.#shopUntil = 0; this.shopMultiplier = 1;
    }
    if (this.#acc >= this.#next) {
      this.#next = this.#acc + MIN_GAP + Math.random() * RANGE;
      this.#fire();
    }
  }

  #emit(icon, title, desc) { this.#bus.emit("workshop:event", { icon, title, desc }); }

  #fire() {
    // solo tiene sentido con el tutorial terminado y algo de actividad
    if (!this.#gs.tutorialCompleted) return;
    const roll = Math.random();

    if (roll < 0.28) {
      // ⚠️ Pedido urgente: un pedido disponible se vuelve urgente (paga más, menos plazo)
      const o = this.#gs.availableOrders.find((x) => x.priority === "normal" && !x.isFinal);
      if (o) {
        o.priority = "urgente"; o.deadline = 1;
        this.#emit("⚠️", "Pedido urgente", `${o.customer.name} necesita el ${o.code} cuanto antes. Paga un 15 % más.`);
      }
    } else if (roll < 0.5) {
      // 💰 Cliente premium: el próximo pedido nuevo será premium
      this.premiumNext = true;
      this.#emit("💰", "Cliente premium en camino", "El próximo pedido del tablón pagará mucho mejor.");
    } else if (roll < 0.72) {
      // 📦 Proveedor retrasado: comprar materiales cuesta más durante un rato
      this.shopMultiplier = 1.5;
      this.#shopUntil = this.#acc + 60;
      this.#emit("📦", "Proveedor retrasado", "Comprarle materiales a Carlos cuesta un 50 % más durante 1 minuto. Mejor programa unos retos.");
    } else if (roll < 0.9) {
      // 🎁 Buen día: pequeña propina
      this.#gs.player.earn(25 + Math.floor(Math.random() * 25));
      this.#emit("🎁", "Buen día en el taller", "Un cliente satisfecho te ha dejado una propina.");
      this.#bus.emit("state:changed");
    } else {
      // 🐞 Error del sistema: recordatorio educativo, sin penalización
      this.#emit("🐞", "Aviso del sistema", "Recuerda: una regla de negocio puede rechazar tu acción. La Vista solo muestra el resultado.");
    }
  }
}

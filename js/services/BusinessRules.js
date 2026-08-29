/**
 * BusinessRules — SERVICIO DE DOMINIO. Toda la LÓGICA DEL NEGOCIO vive aquí,
 * nunca en la interfaz. Cada método devuelve { ok, reason, rule }.
 */
export class BusinessRules {
  /** No se puede fabricar sin materiales suficientes. */
  static canCraft(recipe, inventory) {
    const missing = Object.entries(recipe).filter(([m, q]) => !inventory.has(m, q));
    if (missing.length) {
      return { ok: false,
        reason: `Faltan materiales: ${missing.map(([m, q]) => `${q - inventory.count(m)} ${m}`).join(", ")}.`,
        rule: "No se puede fabricar un producto si no existen materiales suficientes." };
    }
    return { ok: true, reason: "", rule: "" };
  }

  /** No se puede fabricar una cantidad superior a los materiales disponibles. */
  static canCraftQuantity(recipe, inventory, qty) {
    for (const [m, q] of Object.entries(recipe)) {
      if (inventory.count(m) < q * qty) {
        return { ok: false,
          reason: `Solo puedes fabricar ${Math.floor(inventory.count(m) / q)} con el ${m} que tienes.`,
          rule: "No se puede fabricar una cantidad superior a los materiales disponibles." };
      }
    }
    return { ok: true, reason: "", rule: "" };
  }

  /** El trabajador ocupado no puede aceptar otra tarea. */
  static workerAvailable(worker) {
    return worker.isAvailable
      ? { ok: true, reason: "", rule: "" }
      : { ok: false, reason: "El carpintero está ocupado con otra pieza.",
          rule: "Un trabajador ocupado no puede ser asignado a otra tarea." };
  }

  /** No se entrega un pedido si faltan productos. */
  static canDeliver(order) {
    return order.isFulfilled
      ? { ok: true, reason: "", rule: "" }
      : { ok: false, reason: "Todavía faltan piezas de este pedido.",
          rule: "Un pedido no puede completarse si la cantidad fabricada es menor que la solicitada." };
  }

  /** No se compra ni se mejora sin dinero. */
  static canAfford(player, cost) {
    return player.coins >= cost
      ? { ok: true, reason: "", rule: "" }
      : { ok: false, reason: `Te faltan $${cost - player.coins}.`,
          rule: "No se puede comprar si no hay dinero suficiente." };
  }

  /** El precio de venta no puede ser <= 0 (delegado a Furniture.setPrice). */
  static validatePrice(furniture, value) {
    const r = furniture.setPrice(value);
    return { ok: r.ok, reason: r.reason,
      rule: r.ok ? "" : "El precio de venta no puede ser menor o igual a cero." };
  }
}

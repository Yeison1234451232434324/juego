import { CONFIG } from "../config/gameConfig.js";

const MAT_ES = { wood: "madera", nails: "clavos", screws: "tornillos", paint: "pintura", metal: "metal" };
const mat = (m) => MAT_ES[m] ?? m;
const mueble = (t) => CONFIG.MUEBLE_ES[t] ?? t;

/**
 * BusinessRules — SERVICIO DE DOMINIO. Toda la LÓGICA DEL NEGOCIO vive aquí,
 * nunca en la interfaz. Cada método devuelve { ok, reason, rule }.
 */
export class BusinessRules {
  /** No se pueden aceptar más trabajos de los que el taller puede gestionar. */
  static canAcceptOrder(workshop, order) {
    const max = CONFIG.GAMEPLAY.MAX_ACTIVE_ORDERS;
    if (!order || order.status !== "open") {
      return { ok: false, reason: "Este pedido ya no está disponible.",
        rule: "Solo se puede aceptar un pedido que sigue abierto." };
    }
    if (workshop.hasOrder(order.id)) {
      return { ok: false, reason: "Ya aceptaste este pedido.",
        rule: "Un mismo pedido no se acepta dos veces." };
    }
    if (workshop.orders.length >= max) {
      return { ok: false,
        reason: `Has alcanzado el límite de ${max} trabajos activos.`,
        rule: `Un taller no gestiona más de ${max} trabajos a la vez. Completa o cancela uno para aceptar otro.` };
    }
    return { ok: true, reason: "", rule: "" };
  }

  /** No se puede fabricar sin materiales suficientes. */
  static canCraft(recipe, inventory) {
    const missing = Object.entries(recipe).filter(([m, q]) => !inventory.has(m, q));
    if (missing.length) {
      return { ok: false,
        reason: `Te faltan: ${missing.map(([m, q]) => `${q - inventory.count(m)} ${mat(m)}`).join(", ")}.`,
        rule: "No se puede fabricar un producto si no hay materiales suficientes." };
    }
    return { ok: true, reason: "", rule: "" };
  }

  /** No se puede fabricar una cantidad superior a los materiales disponibles. */
  static canCraftQuantity(recipe, inventory, qty) {
    for (const [m, q] of Object.entries(recipe)) {
      if (inventory.count(m) < q * qty) {
        return { ok: false,
          reason: `Solo puedes fabricar ${Math.floor(inventory.count(m) / q)} con el/la ${mat(m)} que tienes.`,
          rule: "No se puede fabricar una cantidad superior a los materiales disponibles." };
      }
    }
    return { ok: true, reason: "", rule: "" };
  }

  /** Solo tiene sentido fabricar una pieza que algún pedido necesita. */
  static furnitureIsNeeded(type, orders) {
    const needed = orders.some((o) => o.remainingOf(type) > 0);
    return needed
      ? { ok: true, reason: "", rule: "" }
      : { ok: false, reason: `Ningún pedido necesita ${mueble(type)}s ahora mismo.`,
          rule: "Se fabrica para cumplir pedidos, no para acumular sin motivo." };
  }

  /** El trabajador ocupado no puede aceptar otra tarea. */
  static workerAvailable(worker) {
    return worker.isAvailable
      ? { ok: true, reason: "", rule: "" }
      : { ok: false, reason: "El carpintero ya está fabricando otra pieza.",
          rule: "Un trabajador ocupado no puede hacer dos piezas a la vez." };
  }

  /** No se entrega un pedido si faltan productos fabricados. */
  static canDeliver(order, workshop) {
    if (order.isFulfilled) return { ok: true, reason: "", rule: "" };
    const falta = order.lines
      .filter((l) => l.done < l.qty)
      .map((l) => {
        const n = l.qty - l.done - Math.min(workshop?.countStock(l.type) ?? 0, l.qty - l.done);
        return `${n} ${mueble(l.type)}${n > 1 ? "s" : ""}`;
      })
      .filter((s) => !s.startsWith("0 "));
    return { ok: false,
      reason: falta.length
        ? `Primero fabrica: ${falta.join(", ")}.`
        : "Todavía no has fabricado todas las piezas.",
      rule: "Un pedido no se entrega hasta que todas las piezas están fabricadas." };
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

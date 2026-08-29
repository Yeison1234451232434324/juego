import { Order } from "../models/Order.js";
import { Customer } from "../models/Customer.js";
import { CONFIG } from "../config/gameConfig.js";

/**
 * OrderService — genera los pedidos de clientes (documentos del mundo).
 */
const CLIENTES = [
  { name: "Restaurante El Roble", kind: "restaurante" },
  { name: "Cafetería Norte", kind: "cafetería" },
  { name: "Oficinas Lumen", kind: "oficina" },
  { name: "Hotel Aurora", kind: "hotel" },
  { name: "Biblioteca Municipal", kind: "oficina" },
];

export class OrderService {
  #n = 1;

  /** Primer pedido, siempre 1 silla (tutorial). */
  starter() {
    const o = new Order({
      customer: new Customer("Restaurante El Roble", "restaurante"),
      lines: [{ type: "Chair", qty: 1 }],
      notes: ["Estilo rústico", "Entrega cuando puedas"],
      reward: 75, metalReward: 1, code: `#${String(this.#n++).padStart(3, "0")}`,
    });
    return o;
  }

  generate(level) {
    const c = CLIENTES[Math.floor(Math.random() * CLIENTES.length)];
    const lines = [{ type: "Chair", qty: 1 + Math.floor(Math.random() * (2 + level)) }];
    if (level >= 2 && Math.random() < 0.6) lines.push({ type: "Table", qty: 1 + Math.floor(Math.random() * 2) });
    if (level >= 4 && Math.random() < 0.35) lines.push({ type: "Cabinet", qty: 1 });

    const reward = lines.reduce((s, l) => s + CONFIG.ECONOMY.sellBase[l.type] * l.qty, 0);
    return new Order({
      customer: new Customer(c.name, c.kind),
      lines,
      notes: ["Madera de roble", Math.random() < 0.5 ? "Estilo moderno" : "Estilo rústico", `Fecha límite: ${2 + Math.floor(Math.random() * 3)} días`],
      reward, metalReward: 1 + Math.floor(lines.reduce((s, l) => s + l.qty, 0) / 3),
      code: `#${String(this.#n++).padStart(3, "0")}`,
    });
  }

  finalProject() {
    const o = new Order({
      customer: new Customer("Hotel Gran Roble", "hotel"),
      lines: [{ type: "Chair", qty: 6 }, { type: "Table", qty: 3 }, { type: "Cabinet", qty: 1 }],
      notes: ["RF-001..RF-008 aplicados", "POO + reglas de negocio + MVC", "Proyecto Final"],
      reward: 1800, metalReward: 10, code: "#FINAL",
    });
    o.isFinal = true;
    return o;
  }
}

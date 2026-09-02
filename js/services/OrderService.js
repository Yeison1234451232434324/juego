import { Order } from "../models/Order.js";
import { Customer } from "../models/Customer.js";
import { CONFIG } from "../config/gameConfig.js";

/**
 * OrderService — genera los pedidos de clientes (documentos = requerimientos).
 * Cada cliente tiene una NECESIDAD típica: qué mueble suele pedir, en qué
 * cantidad, con qué prioridad y qué presupuesto. Así dos pedidos nunca son
 * iguales y el jugador tiene que analizar cada uno.
 */
const CLIENTES = [
  { name: "Hotel Aurora",          kind: "hotel",       pref: "resistentes",       bias: ["Chair", "Chair", "Table"],  budget: 1.12, verbo: "para las habitaciones" },
  { name: "Restaurante El Roble",  kind: "restaurante", pref: "mesas pequeñas",    bias: ["Table", "Table", "Chair"],  budget: 1.0,  verbo: "para el comedor" },
  { name: "Cafetería Norte",       kind: "cafetería",   pref: "cómodas",           bias: ["Chair", "Chair"],           budget: 0.95, verbo: "para la terraza" },
  { name: "Oficinas Lumen",        kind: "oficina",     pref: "funcionales",       bias: ["Table", "Cabinet"],         budget: 1.06, verbo: "para las salas" },
  { name: "Biblioteca Municipal",  kind: "oficina",     pref: "armarios amplios",  bias: ["Cabinet", "Cabinet"],       budget: 1.0,  verbo: "para el archivo" },
  { name: "Cliente particular",    kind: "particular",  pref: "económica",         bias: ["Chair"],                    budget: 0.85, verbo: "para casa" },
];

const MUEBLE = (t) => CONFIG.MUEBLE_ES[t] ?? t;

export class OrderService {
  #n = 1;

  #code() { return `#${String(this.#n++).padStart(3, "0")}`; }

  /** Primer pedido, siempre 1 silla (tutorial). */
  starter() {
    return new Order({
      customer: new Customer("Restaurante El Roble", "restaurante", "rústica"),
      lines: [{ type: "Chair", qty: 1 }],
      notes: ["Estilo rústico", "Entrega cuando puedas"],
      brief: "Necesito una silla rústica para el comedor.",
      reward: 75, metalReward: 1, code: this.#code(),
    });
  }

  generate(level, opts = {}) {
    const c = CLIENTES[Math.floor(Math.random() * CLIENTES.length)];
    const reputation = opts.reputation ?? 0;

    // líneas según la necesidad del cliente y el nivel del jugador
    const counts = {};
    for (const t of c.bias) {
      if (t === "Cabinet" && level < 4) continue;
      if (t === "Table" && level < 2) { counts.Chair = (counts.Chair ?? 0) + 1; continue; }
      counts[t] = (counts[t] ?? 0) + 1;
    }
    if (!Object.keys(counts).length) counts.Chair = 1;
    const lines = Object.entries(counts).map(([type, base]) => ({
      type, qty: base + Math.floor(Math.random() * (type === "Chair" ? 2 + level : 2)),
    }));

    const units = lines.reduce((s, l) => s + l.qty, 0);
    const priority = opts.premium ? "premium"
      : Math.random() < 0.16 ? "urgente" : Math.random() < 0.1 ? "premium" : "normal";
    // Más reputación → mejores presupuestos (tope +25 %).
    const repBonus = 1 + Math.min(0.25, reputation / 120);
    const budget = c.budget * repBonus * (priority === "premium" ? 1.4 : priority === "urgente" ? 1.1 : 1);
    const reward = Math.round(lines.reduce((s, l) => s + CONFIG.ECONOMY.sellBase[l.type] * l.qty, 0) * budget);
    const deadline = priority === "urgente" ? 1 : 2 + Math.floor(Math.random() * 3);

    const main = lines[0];
    const nombre = `${main.qty} ${MUEBLE(main.type).toLowerCase()}${main.qty > 1 ? "s" : ""}`;
    const extra = lines.length > 1 ? ` y algo más` : "";
    const brief = `${c.name}: "Necesito ${nombre}${extra} ${c.verbo}. Preferencia: ${c.pref}."`;

    return new Order({
      customer: new Customer(c.name, c.kind, c.pref),
      lines,
      notes: [
        `Preferencia: ${c.pref}`,
        priority === "urgente" ? "⚠️ Pedido urgente" : priority === "premium" ? "💰 Cliente premium" : "Sin prisa",
        `Fecha estimada: ${deadline} día${deadline > 1 ? "s" : ""}`,
      ],
      brief,
      priority, deadline,
      reward,
      metalReward: 1 + Math.floor(units / 3),
      code: this.#code(),
    });
  }

  finalProject() {
    const o = new Order({
      customer: new Customer("Hotel Gran Roble", "hotel", "de roble macizo"),
      lines: [{ type: "Chair", qty: 6 }, { type: "Table", qty: 3 }, { type: "Cabinet", qty: 1 }],
      notes: ["RF-001..RF-007 aplicados", "POO + reglas de negocio + MVC", "Proyecto Final — examen"],
      brief: "Hotel Gran Roble: \"Equipad el hotel entero: sillas, mesas y un armario, de roble macizo.\"",
      priority: "premium", deadline: 7,
      reward: 1800, metalReward: 10, code: "#FINAL",
    });
    o.isFinal = true;
    return o;
  }
}

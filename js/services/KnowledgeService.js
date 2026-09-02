import { CONFIG } from "../config/gameConfig.js";

/**
 * KnowledgeService — SERVICIO DE DOMINIO (solo datos + cálculo, sin Phaser ni
 * DOM). Reúne el "mapa de conocimientos": conceptos de POO y de MVC, su
 * progreso REAL, los rangos del jugador y las estadísticas.
 */

/* --- Conceptos de POO. `group` enlaza con el grupo de retos de ChallengeService --- */
const POO = [
  { key: "clase", name: "Clase", icon: "🧩", group: "clase",
    what: "El molde que define un tipo de objeto: sus datos y sus acciones.",
    code: `class Silla {\n  constructor() { this.nombre = "Silla"; }\n  fabricar() { return true; }\n}`,
    game: "Cada reto de la computadora te hace escribir la clase de un mueble." },
  { key: "objeto", name: "Objeto", icon: "📦", group: "clase",
    what: "Una instancia concreta creada a partir de una clase.",
    code: `const silla = new Silla();`,
    game: "La fábrica hace new Chair(), new Table()… al preparar un pedido." },
  { key: "atributo", name: "Atributo", icon: "🔖", group: "clase",
    what: "Un dato que describe al objeto (precio, materiales, estilo).",
    code: `this.precio = 75;`,
    game: "🪵 materiales y 💰 precio del mueble son atributos." },
  { key: "metodo", name: "Método", icon: "⚙️", group: "clase",
    what: "Una acción que el objeto sabe hacer.",
    code: `fabricar() { return true; }`,
    game: "🔨 fabricar() y calcularTiempo() son métodos." },
  { key: "encapsulamiento", name: "Encapsulamiento", icon: "🔐", group: "encapsulamiento",
    what: "El objeto protege sus datos: solo se cambian con validación.",
    code: `setPrice(v) {\n  if (v <= 0) return { ok: false };\n  this.#price = v;\n}`,
    game: "Por eso una mejora no puede alterar tu precio a la fuerza." },
  { key: "herencia", name: "Herencia", icon: "🧬", group: "herencia",
    what: "Una subclase reutiliza y extiende otra con extends / super().",
    code: `class Chair extends Furniture { }`,
    game: "Chair, Table y Cabinet heredan de Furniture." },
  { key: "polimorfismo", name: "Polimorfismo", icon: "🎭", group: "polimorfismo",
    what: "El mismo método responde distinto según el objeto.",
    code: `chair.calculateProductionTime()  // 12\ntable.calculateProductionTime()  // 20`,
    game: "Cada mueble tarda un tiempo distinto en fabricarse." },
  { key: "abstracción", name: "Abstracción", icon: "🧱", group: "abstraccion",
    what: "La clase base define QUÉ se hace, no CÓMO; no se instancia sola.",
    code: `class Furniture {\n  calculateProductionTime() { throw new Error("abstracto"); }\n}`,
    game: "Furniture es abstracta: solo existen sillas, mesas y armarios." },
  { key: "composición", name: "Composición", icon: "🧩", group: "composicion",
    what: "Un objeto se construye TENIENDO otros objetos.",
    code: `class Workshop {\n  #inventory; #worker; #orders;\n}`,
    game: "El Taller TIENE inventario, trabajador y pedidos." },
  { key: "factory", name: "Factory", icon: "🏭", group: null,
    what: "Un punto único que decide qué subclase concreta crear.",
    code: `FurnitureFactory.create("Chair")`,
    game: "La fábrica oculta qué clase se instancia al fabricar." },
];

/* --- Conceptos de MVC / requerimientos. Se aprenden HACIENDO --- */
const MVC = [
  { key: "Vista", name: "Vista", icon: "🖥️", what: "Muestra información y capta los clics. No decide reglas.", game: "Los paneles de cada estación." },
  { key: "Controlador", name: "Controlador", icon: "🎮", what: "Recibe la acción y coordina qué hacer.", game: "CraftingController, OrderController…" },
  { key: "Modelo", name: "Modelo", icon: "📦", what: "Guarda los datos y aplica las reglas.", game: "Order, Workshop, GameState." },
  { key: "Regla de negocio", name: "Regla de negocio", icon: "⚖️", what: "Qué está permitido y qué no (BusinessRules).", game: "«No se fabrica sin materiales»." },
  { key: "Requerimientos", name: "Requerimientos", icon: "📋", what: "Qué debe hacer el sistema (los RF del pedido).", game: "«Ver requerimientos» en PEDIDOS." },
  { key: "Flujo MVC", name: "Flujo MVC", icon: "🏗️", what: "Vista → Controlador → Modelo → Regla → Resultado.", game: "El overlay 🏗️ al fabricar." },
];

const RANKS = [
  { min: 1, name: "Aprendiz", icon: "🪵" },
  { min: 2, name: "Ayudante", icon: "🔨" },
  { min: 3, name: "Programador Junior", icon: "💻" },
  { min: 4, name: "Desarrollador", icon: "🧑‍💻" },
  { min: 5, name: "Arquitecto del Taller", icon: "🏗️" },
  { min: 6, name: "Maestro del Taller", icon: "👑" },
];

export class KnowledgeService {
  static pooConcepts() { return POO; }
  static mvcConcepts() { return MVC; }
  static ranks() { return RANKS; }

  static rank(level) {
    return [...RANKS].reverse().find((r) => level >= r.min) ?? RANKS[0];
  }
  static nextRank(level) { return RANKS.find((r) => r.min > level) ?? null; }

  /** Progreso 0..1 de un concepto POO, calculado del estado real del juego. */
  static pooProgress(gs, c) {
    const solved = c.group ? gs.challenges.groupSolved(c.group) : gs.player.knows("composición");
    if (solved || gs.player.knows(c.key)) return 1;
    const fails = c.group ? (gs.challenges.groupFails?.(c.group) ?? 0) : 0;
    return fails > 0 ? 0.5 : 0;
  }

  static mvcKnown(gs, key) { return gs.player.knows(key); }

  /** Demostración de polimorfismo con las clases REALES del juego. */
  static polymorphismRows() {
    return ["Chair", "Table", "Cabinet"].map((t) => ({
      type: t, es: CONFIG.MUEBLE_ES[t] ?? t, seconds: CONFIG.CRAFT_SECONDS[t] ?? 15,
    }));
  }

  static stats(gs) {
    const p = gs.player;
    return {
      ordersDelivered: p.stats.ordersDelivered || 0,
      objectsCreated: p.stats.objectsCreated || 0,
      challengesDone: (p.stats.challengesDone || []).length,
      labSolved: p.stats.labSolved || 0,
      errors: p.stats.errors || 0,
      coinsEarned: p.stats.coinsEarned || 0,
      avgQuality: p.avgQuality,
      bestQuality: p.stats.bestQuality || 0,
      reputation: p.reputation,
    };
  }

  /** Barras "por concepto" para la pantalla de progreso. */
  static progressBars(gs) {
    const out = [];
    for (const key of ["clase", "encapsulamiento", "herencia", "polimorfismo", "abstracción", "composición"]) {
      const c = POO.find((x) => x.key === key);
      out.push({ label: c.name, pct: Math.round(KnowledgeService.pooProgress(gs, c) * 100) });
    }
    const mvcKnown = MVC.filter((m) => gs.player.knows(m.key)).length;
    out.push({ label: "MVC", pct: Math.round((mvcKnown / MVC.length) * 100) });
    return out;
  }
}

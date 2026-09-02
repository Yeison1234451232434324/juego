import { CodeValidator } from "../services/CodeValidator.js";

/** Ejercicios del LABORATORIO: práctica libre, no afectan a pedidos ni materiales. */
const LAB = [
  { id: "lab-clase", icon: "🧩", concept: "clase", title: "Crea una clase",
    prompt: "Escribe una clase llamada Banco (con su { }).",
    starter: "class ______ {\n\n}",
    test: (c) => /class\s+[A-Za-z_]\w*\s*\{[\s\S]*\}/.test(c) },
  { id: "lab-atributo", icon: "🔖", concept: "atributo", title: "Crea un atributo",
    prompt: "Dentro del constructor, crea un atributo altura con valor 100.",
    starter: "class Mesa {\n  constructor() {\n    this._______ = 100;\n  }\n}",
    test: (c) => /this\.\w+\s*=\s*\d+/.test(c) },
  { id: "lab-metodo", icon: "⚙️", concept: "metodo", title: "Crea un método",
    prompt: "Crea un método usar() que devuelva true.",
    starter: "class Herramienta {\n  _______() {\n    return true;\n  }\n}",
    test: (c) => /\b\w+\s*\([^)]*\)\s*\{[\s\S]*return\s+true/.test(c) },
  { id: "lab-objeto", icon: "📦", concept: "objeto", title: "Crea un objeto",
    prompt: "Crea un objeto silla a partir de la clase Silla.",
    starter: "class Silla {}\nconst silla = new _______();",
    test: (c) => /new\s+[A-Za-z_]\w*\s*\(/.test(c) },
];

/**
 * ProgrammingController — CONTROLADOR de la computadora (retos de producción).
 *
 * Valida el código del jugador y, SI ES CORRECTO, entrega materiales para el
 * pedido actual y llama a challenges.registerSolved(id). Si falla, no entrega
 * nada y rota a otro reto del mismo tema.
 *
 * NADA aquí marca un reto como resuelto salvo un EJECUTAR correcto. Las mejoras
 * (supplier, auto) solo cambian CUÁNTO material se entrega, nunca si el reto
 * está resuelto.
 */
export class ProgrammingController {
  #gs; #bus;
  constructor(gs, bus) { this.#gs = gs; this.#bus = bus; }

  currentChallenge() {
    return this.#gs.challenges.current(this.#gs.player.level, this.#gs.focusOrder?.mainType);
  }

  failCount(id) { return this.#gs.challenges.failCount(id); }

  /** Texto inicial del editor: SIEMPRE el esqueleto con huecos (nunca la solución). */
  editorText(ch) { return ch.starter; }

  /** ¿Qué material y cuánto entregar por resolver este reto? */
  #award(ch) {
    const order = this.#gs.focusOrder;
    const inv = this.#gs.workshop.inventory;
    const extra = this.#gs.upgrades.has("supplier") ? 2 : 0;   // "Proveedor confiable": +2

    if (!order) return { material: "wood", amount: 3 + extra };

    const need = order.materials;
    let material = "wood", best = -1;
    for (const m of Object.keys(need)) {
      const s = Math.max(0, need[m] - inv.count(m));
      if (s > best) { best = s; material = m; }
    }
    let amount = (best > 0 ? Math.min(4, best) : 3) + extra;
    // "Producción automática" ya da bonus pasivo; aquí el bonus es de supplier.
    return { material, amount };
  }

  submit(code) {
    const ch = this.currentChallenge();
    if (!ch) return { ok: false, done: true };

    const result = CodeValidator.validate(code, ch.checks, this.#gs.upgrades.has("analyzer"));

    if (!result.ok) {
      this.#gs.challenges.registerFail(ch.id);
      const fails = this.#gs.challenges.failCount(ch.id);
      this.#bus.emit("challenge:failed", { challenge: ch, result, explain: ch.explainOnFail, fails });
      return { ok: false, result, fails };
    }

    // ---- éxito: SOLO ahora se marca el reto como resuelto ----
    const cd = (this.#gs.player.stats.challengesDone ??= []);
    const firstTime = !cd.includes(ch.id);

    const info = this.#gs.challenges.registerSolved(ch.id);
    const { material, amount } = this.#award(ch);
    this.#gs.workshop.inventory.add(material, amount);   // el grifo de materiales SIEMPRE fluye

    // XP: completa la 1.ª vez; simbólica al repetir un reto ya resuelto
    // (evita farmear niveles resolviendo el mismo reto en bucle).
    const xp = firstTime ? 50 : 8;
    const lvls = this.#gs.player.addXp(xp);

    if (info.concept) this.#gs.player.learn(info.concept);
    if (firstTime) {
      cd.push(ch.id);
      this.#gs.player.stats.classesImplemented++;
    }
    if (info.firstOfConcept && info.rf) this.#gs.requirements.complete(info.rf);

    const order = this.#gs.focusOrder;
    const need = order ? (order.materials[material] ?? 0) : 0;
    const have = this.#gs.workshop.inventory.count(material);

    this.#bus.emit("challenge:solved", {
      challenge: ch,
      award: { material, amount, have, need },
      xp,
      orderReady: order ? this.#hasAllMaterials(order) : false,
    });
    if (lvls) this.#bus.emit("player:levelup", this.#gs.player.level);
    this.#bus.emit("state:changed");
    return { ok: true, challenge: ch, award: { material, amount } };
  }

  #hasAllMaterials(order) {
    const inv = this.#gs.workshop.inventory;
    return Object.entries(order.materials).every(([m, q]) => inv.count(m) >= q);
  }

  // ---------- LABORATORIO (práctica libre) ----------
  labExercises() { return LAB.map((e) => ({ ...e, done: this.#gs.player.knows(e.concept) })); }

  /** Valida un ejercicio del laboratorio. Da XP y aprende el concepto; NUNCA
   *  entrega materiales ni toca los pedidos. */
  submitLab(id, code) {
    const ex = LAB.find((e) => e.id === id);
    if (!ex) return { ok: false, error: "Ejercicio desconocido." };

    const syntax = CodeValidator.checkSyntax(code);
    if (!syntax.ok) return { ok: false, error: syntax.message };
    let pass = false;
    try { pass = !!ex.test(String(code).replace(/\/\/[^\n]*/g, " ")); } catch { pass = false; }
    if (!pass) return { ok: false, error: `Aún no cumple: ${ex.title.toLowerCase()}.` };

    const xp = 12;
    const lvls = this.#gs.player.addXp(xp);
    this.#gs.player.learn(ex.concept);
    this.#gs.player.stats.labSolved = (this.#gs.player.stats.labSolved || 0) + 1;
    this.#bus.emit("lab:solved", { id, concept: ex.concept, xp });
    if (lvls) this.#bus.emit("player:levelup", this.#gs.player.level);
    this.#bus.emit("state:changed");
    return { ok: true, xp, concept: ex.concept };
  }
}

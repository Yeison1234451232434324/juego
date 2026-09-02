import { Achievement } from "../models/Achievement.js";

/** AchievementService — logros discretos que se comprueban con las stats del Player. */
const DEFS = [
  { key: "first",    name: "Primer objeto",           icon: "🏆", desc: "Creaste tu primera clase.",                 test: (p) => p.stats.classesImplemented >= 1 },
  { key: "classes",  name: "Maestro de clases",       icon: "🧩", desc: "Resolviste 3 retos de programación.",        test: (p) => (p.stats.challengesDone || []).length >= 3 },
  { key: "encap",    name: "Encapsulado",             icon: "🔒", desc: "Protegiste una propiedad.",                 test: (p) => p.knows("encapsulamiento") },
  { key: "heir",     name: "Heredero",                icon: "🧬", desc: "Implementaste herencia.",                   test: (p) => p.knows("herencia") },
  { key: "poly",     name: "Polimórfico",             icon: "🎭", desc: "Un método, varios comportamientos.",        test: (p) => p.knows("polimorfismo") },
  { key: "arch",     name: "Arquitecto MVC",          icon: "🏛️", desc: "Completaste un flujo MVC.",                 test: (p) => p.knows("MVC") },
  { key: "bughunter", name: "Cazador de bugs",        icon: "🐞", desc: "Fallaste 3 veces y aun así resolviste un reto.", test: (p) => (p.stats.errors || 0) >= 3 && (p.stats.challengesDone || []).length >= 1 },
  { key: "analyst",  name: "Analista de requerimientos", icon: "📋", desc: "Leíste los requerimientos y entregaste un pedido.", test: (p) => p.knows("Requerimientos") && p.stats.ordersDelivered >= 1 },
  { key: "cleancode", name: "Código limpio",          icon: "✨", desc: "Entregaste un producto con calidad 90+.",   test: (p) => (p.stats.bestQuality || 0) >= 90 },
  { key: "seller",   name: "Comerciante",             icon: "💰", desc: "Entregaste 3 pedidos.",                     test: (p) => p.stats.ordersDelivered >= 3 },
  { key: "master",   name: "Maestro del taller",      icon: "🎓", desc: "Completaste el proyecto final.",            test: (p) => p.stats.finalDone },
];

export class AchievementService {
  #list = DEFS.map((d) => new Achievement(d));
  #bus;
  constructor(bus) { this.#bus = bus; }

  all() { return this.#list; }

  check(player) {
    for (const a of this.#list) {
      let ok = false;
      try { ok = !!DEFS.find((d) => d.key === a.key).test(player); } catch { ok = false; }
      if (ok && a.unlock()) this.#bus.emit("achievement:unlocked", a);
    }
  }

  hydrate(list = []) { for (const k of list) this.#list.find((a) => a.key === k)?.unlock(); }
  toJSON() { return this.#list.filter((a) => a.unlocked).map((a) => a.key); }
}

/**
 * QualityService — SERVICIO DE DOMINIO. Calcula la CALIDAD (0-100) de una pieza
 * fabricada a partir del PROGRESO REAL del jugador: cuánta POO ha aplicado,
 * cuántos requerimientos cumple, cuántas reglas de negocio ha respetado, cómo
 * consiguió los materiales, cuánto tarda y cuántos errores lleva.
 *
 * Es educativo, no punitivo: casi todo cae entre 60 y 100. La calidad ajusta la
 * recompensa y la satisfacción del cliente (nunca bloquea una entrega ya hecha).
 */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const TIERS = [
  { min: 95, mult: 1.35, label: "Excelente", face: "🤩", quote: "¡Excelente trabajo! Justo lo que necesitábamos." },
  { min: 80, mult: 1.15, label: "Alta",      face: "😀", quote: "Muy buen trabajo. Gracias." },
  { min: 60, mult: 1.0,  label: "Normal",    face: "🙂", quote: "Correcto. Gracias." },
  { min: 40, mult: 0.75, label: "Justa",     face: "😐", quote: "Cumple, aunque esperaba algo mejor." },
  { min: 0,  mult: 0.45, label: "Muy baja",  face: "😕", quote: "Esto no es del todo lo que pedí…" },
];

const POO_GROUPS = ["clase", "encapsulamiento", "herencia", "polimorfismo", "abstraccion", "composicion"];

export class QualityService {
  /** Evalúa una pieza recién fabricada. `gs` = GameState. */
  static evaluatePiece(gs) {
    const p = gs.player;
    const known = Object.keys(p.stats.concepts || {}).length;
    const reqRatio = gs.requirements.total() ? gs.requirements.doneCount() / gs.requirements.total() : 0;
    const ruleRatio = p.stats.rulesTotal ? p.stats.rulesRespected / p.stats.rulesTotal : 1;
    const fails = POO_GROUPS.reduce((s, g) => s + (gs.challenges.groupFails?.(g) ?? 0), 0);
    const fast = gs.upgrades.has("toolkit") || gs.upgrades.has("bench");
    const shortcuts = p.stats.shortcutBuys || 0;

    const rows = [
      { label: "Código",            stars: clamp(2 + known, 2, 5) },
      { label: "Requerimientos",    stars: clamp(Math.round(3 + reqRatio * 2), 3, 5) },
      { label: "Reglas de negocio", stars: clamp(Math.round(3 + ruleRatio * 2), 3, 5) },
      { label: "Materiales",        stars: clamp(5 - (shortcuts >= 3 ? 1 : 0), 3, 5) },
      { label: "Tiempo",            stars: fast ? 5 : 4 },
    ];
    const avg = rows.reduce((s, r) => s + r.stars, 0) / rows.length;
    const penalty = Math.min(2, Math.floor(fails / 3)) * 5;
    const score = clamp(Math.round(avg * 20) - penalty, 0, 100);
    return { score, rows, stars: clamp(Math.round(score / 20), 1, 5) };
  }

  static tier(score) { return TIERS.find((t) => score >= t.min) ?? TIERS[TIERS.length - 1]; }

  static stars(n) {
    const k = clamp(Math.round(n), 0, 5);
    return "⭐".repeat(k) + "☆".repeat(5 - k);
  }
}

import { el, $ } from "./ui/dom.js";
import { CONFIG } from "../config/gameConfig.js";

const MAT_ES = { wood: "madera", nails: "clavos", screws: "tornillos", paint: "pintura", metal: "metal" };

/**
 * NotificationView — toasts discretos, reglas de negocio bloqueadas y logros.
 * Nada permanente en pantalla.
 */
export class NotificationView {
  constructor(bus) {
    this.stack = el("div", { class: "toasts" });
    $("#ui").append(this.stack);

    bus.on("challenge:solved", ({ award, xp }) =>
      this.toast(`✓ Reto resuelto · +${award?.amount ?? 0} ${MAT_ES[award?.material] ?? "materiales"} · +${xp} XP`, "ok"));
    bus.on("craft:done", (j) => {
      const q = j?.quality?.score;
      this.toast(`✓ ${CONFIG.MUEBLE_ES[j?.type] ?? "Mueble"} fabricada${Number.isFinite(q) ? ` · calidad ${q}/100` : ""}`,
        Number.isFinite(q) && q < 60 ? "info" : "ok");
    });
    bus.on("order:accepted", (o) => this.toast(`📋 Trabajo aceptado: ${o.summary}`, "info"));
    bus.on("order:cancelled", (o) => this.toast(`✖️ Trabajo cancelado: ${o.code}`, "info"));
    bus.on("order:delivered", (o) => this.toast(`✓ Pedido ${o.code} entregado`, "ok"));
    bus.on("shop:bought", (d) => this.toast(`🛒 +${d.qty} ${MAT_ES[d.type] ?? d.type} (−$${d.cost})`, "info"));
    bus.on("upgrade:bought", (u) => this.toast(`⭐ Mejora: ${u.name}`, "ok"));
    bus.on("player:levelup", (lvl) => this.toast(`⬆️ Nivel ${lvl}`, "level"));
    bus.on("requirement:done", (r) => this.toast(`📌 ${r.code ?? r} completado`, "info"));
    bus.on("rule:blocked", (r) => this.ruleBlocked(r));
    bus.on("achievement:unlocked", (a) => this.achievement(a));
    bus.on("lab:solved", (d) => this.toast(`🧪 Ejercicio resuelto · +${d.xp} XP · ${d.concept}`, "ok"));
    bus.on("workshop:event", (e) => this.event(e));
  }

  toast(text, kind = "info") {
    const t = el("div", { class: `toast ${kind}`, text });
    this.stack.append(t);
    requestAnimationFrame(() => t.classList.add("in"));
    setTimeout(() => { t.classList.remove("in"); setTimeout(() => t.remove(), 300); }, 3000);
  }

  ruleBlocked(r) {
    $(".rule-pop")?.remove();
    const card = el("div", { class: "rp-card" }, [
      el("div", { class: "rp-tag", text: "REGLA DE NEGOCIO" }),
      el("p", { class: "rp-reason", text: `🚫 ${r.reason}` }),
      el("p", { text: r.rule }),
    ]);
    if (r.fn) card.append(el("p", { class: "rp-fn", html: `⚙️ Regla ejecutada: <code>${r.fn}</code>` }));
    card.append(
      el("p", { class: "rp-note", html: "La regla vive en el <b>Modelo</b> (<code>BusinessRules</code>). La <b>Vista</b> solo muestra el resultado." }),
    );
    const pop = el("div", { class: "rule-pop" }, [card]);
    card.append(el("button", { text: "Entendido", on: { click: () => pop.remove() } }));
    pop.addEventListener("click", (e) => { if (e.target === pop) pop.remove(); });
    $("#ui").append(pop);
  }

  event(e) {
    const t = el("div", { class: "achieve wev",
      html: `<span>${e.icon}</span><div><b>${e.title}</b><br>${e.desc}</div>` });
    this.stack.append(t);
    requestAnimationFrame(() => t.classList.add("in"));
    setTimeout(() => { t.classList.remove("in"); setTimeout(() => t.remove(), 300); }, 5200);
  }

  achievement(a) {
    const t = el("div", { class: "achieve", html: `<span>${a.icon}</span><div><b>${a.name}</b><br>${a.desc}</div>` });
    this.stack.append(t);
    requestAnimationFrame(() => t.classList.add("in"));
    setTimeout(() => { t.classList.remove("in"); setTimeout(() => t.remove(), 300); }, 4200);
  }
}

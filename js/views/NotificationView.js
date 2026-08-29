import { el, $ } from "./ui/dom.js";
import { CONFIG } from "../config/gameConfig.js";

const MAT_ES = { wood: "madera", nails: "clavos", screws: "tornillos", paint: "pintura", metal: "metal", core: "núcleo" };
const rewardText = (rewards) => Object.entries(rewards)
  .map(([k, v]) => k === "xp" ? `+${v} XP` : `+${v} ${MAT_ES[k] ?? k}`).join(" · ");

/**
 * NotificationView — toasts discretos, reglas de negocio bloqueadas y logros.
 * Nada permanente en pantalla.
 */
export class NotificationView {
  constructor(bus) {
    this.stack = el("div", { class: "toasts" });
    $("#ui").append(this.stack);

    bus.on("challenge:solved", ({ rewards }) =>
      this.toast(`✓ Clase creada · ${rewardText(rewards)}`, "ok"));
    bus.on("craft:done", (j) => this.toast(`✓ ${CONFIG.MUEBLE_ES[j?.type] ?? "Mueble"} fabricada · +100 XP`, "ok"));
    bus.on("order:delivered", (o) => this.toast(`✓ Pedido ${o.code} entregado · +$${o.reward}`, "ok"));
    bus.on("cut:done", () => this.toast("🪚 +3 clavos", "info"));
    bus.on("shop:bought", (d) => this.toast(`🛒 +${d.qty} ${MAT_ES[d.type] ?? d.type} (−$${d.cost})`, "info"));
    bus.on("upgrade:bought", (u) => this.toast(`⭐ Mejora: ${u.name}`, "ok"));
    bus.on("player:levelup", (lvl) => this.toast(`⬆️ Nivel ${lvl}`, "level"));
    bus.on("requirement:done", (r) => this.toast(`📌 ${r.code} completado`, "info"));
    bus.on("mvc:solved", () => this.toast("🏛️ Arquitectura MVC resuelta", "ok"));
    bus.on("rule:blocked", (r) => this.ruleBlocked(r));
    bus.on("achievement:unlocked", (a) => this.achievement(a));
  }

  toast(text, kind = "info") {
    const t = el("div", { class: `toast ${kind}`, text });
    this.stack.append(t);
    requestAnimationFrame(() => t.classList.add("in"));
    setTimeout(() => { t.classList.remove("in"); setTimeout(() => t.remove(), 300); }, 3000);
  }

  ruleBlocked(r) {
    $(".rule-pop")?.remove();
    const pop = el("div", { class: "rule-pop" }, [
      el("div", { class: "rp-card" }, [
        el("div", { class: "rp-tag", text: "REGLA DE NEGOCIO" }),
        el("p", { class: "rp-reason", text: `🚫 ${r.reason}` }),
        el("p", { text: r.rule }),
        el("p", { class: "rp-note", html: "Esta regla vive en las <b>reglas de negocio</b> (el Modelo), no en la pantalla." }),
        el("button", { text: "Entendido", on: { click: () => pop.remove() } }),
      ]),
    ]);
    pop.addEventListener("click", (e) => { if (e.target === pop) pop.remove(); });
    $("#ui").append(pop);
  }

  achievement(a) {
    const t = el("div", { class: "achieve", html: `<span>${a.icon}</span><div><b>${a.name}</b><br>${a.desc}</div>` });
    this.stack.append(t);
    requestAnimationFrame(() => t.classList.add("in"));
    setTimeout(() => { t.classList.remove("in"); setTimeout(() => t.remove(), 300); }, 4200);
  }
}

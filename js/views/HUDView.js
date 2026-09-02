import { el, $ } from "./ui/dom.js";
import { CONFIG } from "../config/gameConfig.js";
import { KnowledgeService } from "../services/KnowledgeService.js";

/**
 * HUDView — HUD MÍNIMO en la esquina: monedas, nivel, XP y materiales. Todo lo
 * demás (qué hacer, qué pedido) lo dice el panel de objetivos (QuestView).
 */
export class HUDView {
  constructor() {
    this.box = el("div", { class: "hud hidden" });
    $("#ui").append(this.box);
  }
  show(v) { this.box.classList.toggle("hidden", !v); }

  render(gs) {
    const p = gs.player;
    const pct = Math.round((p.xpInLevel / p.xpForNext) * 100);
    const wood = gs.workshop.inventory.count("wood");
    const nails = gs.workshop.inventory.count("nails");
    const orders = gs.workshop.orders.length;
    const rk = KnowledgeService.rank(p.level);
    this.box.innerHTML =
      `<div class="hud-line"><span class="coin">🪙 ${p.coins}</span>` +
      `<span class="lvl">${rk.icon} Nvl ${p.level}</span></div>` +
      `<div class="hud-rank">${rk.name}</div>` +
      `<div class="hud-xp"><i style="width:${pct}%"></i></div>` +
      `<div class="hud-line"><span>🪵 ${wood}</span><span>🔩 ${nails}</span>` +
      `<span>📋 ${orders}/${CONFIG.GAMEPLAY.MAX_ACTIVE_ORDERS}</span></div>`;
  }
}

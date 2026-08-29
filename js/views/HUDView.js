import { el, $ } from "./ui/dom.js";

/**
 * HUDView — HUD MÍNIMO en una esquina: monedas, nivel, XP y 2 materiales clave.
 * Todo lo demás aparece contextualmente al interactuar con objetos del taller.
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
    this.box.innerHTML =
      `<div class="hud-line"><span class="coin">🪙 ${p.coins}</span>` +
      `<span class="lvl">⭐ Nivel ${p.level}</span></div>` +
      `<div class="hud-xp"><i style="width:${pct}%"></i></div>` +
      `<div class="hud-line"><span>🪵 ${wood}</span><span>🔩 ${nails}</span>` +
      `<span>⚙️ ${gs.workshop.inventory.count("core")}</span></div>`;
  }
}

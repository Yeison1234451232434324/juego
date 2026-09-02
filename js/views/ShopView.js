import { Modal } from "./ui/Modal.js";
import { CONFIG } from "../config/gameConfig.js";

/**
 * ShopView — la Tienda de Carlos: comprar materiales y mejoras.
 * Las mejoras cambian de verdad el gameplay (las consultan los controladores).
 */
export class ShopView {
  #modal; #wsCtrl; #upCtrl; #gs;

  constructor(workshopCtrl, upgradeCtrl, gs, bus) {
    this.#wsCtrl = workshopCtrl; this.#upCtrl = upgradeCtrl; this.#gs = gs;
    this.#modal = new Modal({ id: "shop", variant: "wood" });
    this.#modal.bind({
      buymat: (d) => { this.#wsCtrl.buy(d.type, 3); this.#render(); },
      buyup: (d) => { this.#upCtrl.buy(d.key); this.#render(); },
      close: () => this.#modal.close(),
    });
    bus.on("state:changed", () => this.#modal.isOpen && this.#render());
  }

  open() { this.#render(); this.#modal.open(); }

  #render() {
    const coins = this.#gs.player.coins;
    const evMult = this.#gs.events?.shopMultiplier ?? 1;
    const mat = (type, name) => {
      const cost = Math.round(3 * (CONFIG.ECONOMY.buyPrices[type] ?? 6) * evMult);
      return `<div class="shop-row"><span>${name} ×3</span>
        <button class="k" data-act="buymat" data-type="${type}" ${coins >= cost ? "" : "disabled"}>🪙 ${cost}${evMult > 1 ? " ⚠️" : ""}</button></div>`;
    };
    const ups = this.#upCtrl.list().map((u) => `
      <div class="shop-up ${u.owned ? "owned" : ""}">
        <div><b>${u.name}</b><br><span class="wp-sub">${u.desc}</span></div>
        <button class="k" data-act="buyup" data-key="${u.key}" ${u.owned ? "disabled" : coins >= u.cost ? "" : "disabled"}>
          ${u.owned ? "✓ Comprada" : `🪙 ${u.cost}`}</button>
      </div>`).join("");

    this.#modal.render(`<div class="wood-panel">
      <h2>🏪 Zona de Mejoras — Carlos</h2>
      <h3>Materiales sueltos</h3>
      <p class="wp-sub">Un atajo si tienes prisa. Lo normal es conseguirlos programando.</p>
      ${mat("wood", "Madera")}${mat("nails", "Clavos")}
      <h3>Mejoras del taller</h3>
      <p class="wp-sub">Cambian de verdad cómo juegas. Piénsalas bien.</p>
      ${ups}
      <button class="k close" data-act="close">Salir [ESC]</button>
    </div>`);
  }
}

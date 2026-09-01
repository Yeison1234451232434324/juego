import { el, $ } from "./ui/dom.js";

/**
 * MvcFlowView — 🏗️ FLUJO MVC.
 * Al realizar una acción importante muestra BREVEMENTE (≈3 s) la cadena real
 * Jugador → Vista → Controlador → Modelo → Regla de negocio → Resultado.
 * No bloquea (pointer-events:none), se auto-oculta y se puede desactivar en
 * Ajustes. También se consulta manualmente desde Ajustes.
 */
const FLOWS = {
  "order:accepted": {
    title: "Aceptar pedido",
    steps: [
      ["👤 Jugador", "pulsa ACEPTAR"],
      ["🖥️ Vista", "RequirementView"],
      ["🎮 Controlador", "OrderController.accept()"],
      ["⚙️ Regla de negocio", "BusinessRules.canAcceptOrder()"],
      ["📦 Modelo", "Workshop.addOrder()"],
      ["✅ Resultado", "pedido aceptado"],
    ],
  },
  "craft:started": {
    title: "Fabricar",
    steps: [
      ["👤 Jugador", "pulsa FABRICAR"],
      ["🖥️ Vista", "CraftingView"],
      ["🎮 Controlador", "CraftingController.craft()"],
      ["⚙️ Regla de negocio", "BusinessRules.canCraft()"],
      ["📦 Modelo", "Workshop.inventory.consume()"],
      ["✅ Resultado", "fabricación iniciada"],
    ],
  },
  "craft:done": {
    title: "Pieza terminada",
    steps: [
      ["🎮 Controlador", "CraftingController.tick()"],
      ["📦 Modelo", "Workshop.addStock()"],
      ["🖥️ Vista", "CraftingView / HUD"],
      ["✅ Resultado", "producto fabricado"],
    ],
  },
  "order:delivered": {
    title: "Entregar pedido",
    steps: [
      ["👤 Jugador", "pulsa ENTREGAR"],
      ["🖥️ Vista", "SalesView"],
      ["🎮 Controlador", "OrderController.deliver()"],
      ["⚙️ Regla de negocio", "BusinessRules.canDeliver()"],
      ["📦 Modelo", "Order.deliver() · Player.earn()"],
      ["✅ Resultado", "pedido entregado + evaluado"],
    ],
  },
  "challenge:solved": {
    title: "Reto resuelto",
    steps: [
      ["👤 Jugador", "pulsa EJECUTAR CÓDIGO"],
      ["🖥️ Vista", "CodingStationView"],
      ["🎮 Controlador", "ProgrammingController.submit()"],
      ["⚙️ Validación", "CodeValidator.validate()"],
      ["📦 Modelo", "Inventory.add() · Player.addXp()"],
      ["✅ Resultado", "materiales para el pedido"],
    ],
  },
};

export class MvcFlowView {
  #edu; #timer = null;

  constructor(bus, edu) {
    this.#edu = edu;
    this.box = el("div", { class: "mvc-flow hidden" });
    $("#ui").append(this.box);

    for (const key of Object.keys(FLOWS)) {
      bus.on(key, () => { if (this.#edu.get("mvcFlow")) this.show(key); });
    }
  }

  /** Muestra una cadena por su clave de evento; `manual` la deja visible más tiempo. */
  show(key, manual = false) {
    const flow = FLOWS[key];
    if (!flow) return;
    clearTimeout(this.#timer);
    this.box.innerHTML = `
      <div class="mvcf-card">
        <div class="mvcf-top">🏗️ FLUJO MVC · ${flow.title}</div>
        <ol class="mvcf-steps">
          ${flow.steps.map((s, i) =>
            `<li style="animation-delay:${i * 90}ms"><b>${s[0]}</b><span>${s[1]}</span></li>`).join("<i>↓</i>")}
        </ol>
        ${manual ? `<div class="mvcf-foot">La Vista muestra · el Controlador decide · el Modelo guarda datos y reglas</div>` : ""}
      </div>`;
    this.box.classList.remove("hidden");
    this.box.classList.add("in");
    this.#timer = setTimeout(() => this.hide(), manual ? 7000 : 3400);
  }

  showManual() { this.show("craft:started", true); }

  hide() {
    this.box.classList.remove("in");
    this.#timer = setTimeout(() => this.box.classList.add("hidden"), 320);
  }
}

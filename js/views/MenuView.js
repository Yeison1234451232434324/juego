import { el, $ } from "./ui/dom.js";

/** MenuView — menú principal (sobre el telón de MenuScene). */
export class MenuView {
  #onAction;
  constructor(onAction) {
    this.#onAction = onAction;
    this.root = el("div", { class: "menu-root" });
    $("#ui").append(this.root);
    this.root.onclick = (e) => {
      const a = e.target.closest("[data-act]")?.dataset.act;
      if (a) this.#onAction(a);
    };
  }

  render({ hasSave }) {
    this.root.innerHTML = `
      <h1>CODECRAFT<span>WORKSHOP</span></h1>
      <p class="tag">Programa · Consigue materiales · Fabrica · Vende · Mejora</p>
      <div class="menu-btns">
        <button class="mb prim" data-act="new">▶ Nueva partida</button>
        ${hasSave ? '<button class="mb" data-act="continue">⏵ Continuar</button>' : ""}
        <button class="mb" data-act="how">❔ Cómo se juega</button>
      </div>
      <p class="foot">HTML5 · CSS3 · JavaScript ES6 · Phaser 3 · Arquitectura MVC · POO · 100% GitHub Pages</p>`;
  }
  show() { this.root.classList.remove("hidden"); }
  hide() { this.root.classList.add("hidden"); }
}

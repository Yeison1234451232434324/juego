import { el, $ } from "./ui/dom.js";

/**
 * TouchView — controles táctiles (D-pad + A). Escriben en el vector `entrada`
 * compartido con la escena. Solo visibles cuando hace falta (pantalla táctil).
 */
export class TouchView {
  constructor(entrada, bus) {
    this.entrada = entrada;
    const dirs = new Set();
    const recalc = () => {
      entrada.x = (dirs.has("r") ? 1 : 0) - (dirs.has("l") ? 1 : 0);
      entrada.y = (dirs.has("d") ? 1 : 0) - (dirs.has("u") ? 1 : 0);
    };

    this.pad = el("div", { class: "touch dpad hidden" });
    for (const [d, s] of [["u", "▲"], ["l", "◀"], ["r", "▶"], ["d", "▼"]]) {
      const b = el("button", { class: `t-${d}`, text: s });
      b.addEventListener("pointerdown", (e) => { e.preventDefault(); dirs.add(d); recalc(); });
      ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => b.addEventListener(ev, () => { dirs.delete(d); recalc(); }));
      this.pad.append(b);
    }
    window.addEventListener("pointerup", () => { dirs.clear(); recalc(); });

    this.a = el("button", { class: "touch a-btn hidden", text: "E", on: { click: () => bus.emit("ui:activate") } });
    $("#ui").append(this.pad, this.a);

    if (window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window) this.show(false);
  }

  show(v) {
    const on = v && (window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window || window.innerWidth < 900);
    this.pad.classList.toggle("hidden", !on);
    this.a.classList.toggle("hidden", !on);
  }
}

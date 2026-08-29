import { el, $ } from "./ui/dom.js";

/**
 * TouchView — controles táctiles (D-pad + botón A). Escriben en el vector
 * `entrada` compartido con la escena. Se muestran en pantallas táctiles o
 * estrechas; en un PC con ratón quedan ocultos.
 */
export class TouchView {
  #wanted = false;

  constructor(entrada, bus) {
    this.entrada = entrada;
    const dirs = new Set();
    const recalc = () => {
      entrada.x = (dirs.has("r") ? 1 : 0) - (dirs.has("l") ? 1 : 0);
      entrada.y = (dirs.has("d") ? 1 : 0) - (dirs.has("u") ? 1 : 0);
    };
    this.clear = () => { dirs.clear(); recalc(); };

    this.pad = el("div", { class: "touch dpad hidden" });
    for (const [d, s] of [["u", "▲"], ["l", "◀"], ["r", "▶"], ["d", "▼"]]) {
      const b = el("button", { class: `t-${d}`, attrs: { "aria-label": d } });
      b.textContent = s;
      const press = (e) => { e.preventDefault(); dirs.add(d); recalc(); };
      const release = () => { dirs.delete(d); recalc(); };
      b.addEventListener("pointerdown", press);
      ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => b.addEventListener(ev, release));
      this.pad.append(b);
    }
    window.addEventListener("pointerup", () => { dirs.clear(); recalc(); });
    window.addEventListener("blur", () => { dirs.clear(); recalc(); });

    this.a = el("button", { class: "touch a-btn hidden", attrs: { "aria-label": "Interactuar" } });
    this.a.textContent = "E";
    this.a.addEventListener("pointerdown", (e) => { e.preventDefault(); bus.emit("ui:activate"); });
    $("#ui").append(this.pad, this.a);

    // Reevaluar si el dispositivo/tamaño cambia (rotar el móvil, redimensionar).
    ["resize", "orientationchange"].forEach((ev) =>
      window.addEventListener(ev, () => this.#apply()));
  }

  /** ¿Este dispositivo se beneficia de controles en pantalla? */
  #touchLike() {
    return (window.matchMedia?.("(pointer: coarse)").matches ?? false) ||
      "ontouchstart" in window ||
      window.innerWidth < 820;
  }

  show(v) { this.#wanted = v; this.#apply(); }

  #apply() {
    const on = this.#wanted && this.#touchLike();
    this.pad.classList.toggle("hidden", !on);
    this.a.classList.toggle("hidden", !on);
    if (!on) this.clear?.();
  }
}

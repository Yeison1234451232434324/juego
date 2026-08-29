import { el, $ } from "./ui/dom.js";

/**
 * PromptView — el aviso discreto "[E] ..." que aparece cerca del borde inferior
 * cuando el jugador está junto a una estación o NPC. Y el rastreador de objetivo.
 */
export class PromptView {
  constructor(bus) {
    this.prompt = el("div", { class: "prompt hidden" });
    this.objective = el("div", { class: "objective hidden" });
    $("#ui").append(this.prompt, this.objective);
    bus.on("workshop:prompt", (t) => this.setPrompt(t));
    bus.on("objective:changed", (o) => this.setObjective(typeof o === "string" ? o : o?.text ?? ""));
  }

  show(v) {
    this.objective.classList.toggle("hidden", !v);
    if (!v) this.prompt.classList.add("hidden");
  }

  setPrompt(t) {
    this.prompt.classList.toggle("hidden", !t);
    if (t) this.prompt.textContent = t.label;
  }

  setObjective(txt) {
    this.objective.innerHTML = `<b>Objetivo</b> · ${txt}`;
  }
}

import { el, $ } from "./ui/dom.js";

/**
 * PromptView — el aviso discreto "[E] ..." que aparece cerca del borde inferior
 * SOLO cuando el jugador está junto a una estación o NPC. El panel de objetivos
 * lo gestiona QuestView.
 */
export class PromptView {
  constructor(bus) {
    this.prompt = el("div", { class: "prompt hidden" });
    $("#ui").append(this.prompt);
    bus.on("workshop:prompt", (t) => this.setPrompt(t));
  }

  show(v) { if (!v) this.prompt.classList.add("hidden"); }

  setPrompt(t) {
    this.prompt.classList.toggle("hidden", !t);
    if (t) this.prompt.textContent = t.label;
  }
}

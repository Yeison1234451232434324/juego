import { Modal } from "./ui/Modal.js";
import { esc } from "./ui/dom.js";

/**
 * EvaluationView — 🎓 EVALUACIÓN FINAL, basada en lo que el jugador REALMENTE
 * hizo: POO por concepto, MVC por concepto y cuatro notas globales
 * (POO / MVC / lógica de negocio / calidad del producto) + rango final.
 */
export class EvaluationView {
  #modal; #gameCtrl;

  constructor(gameCtrl) {
    this.#gameCtrl = gameCtrl;
    this.#modal = new Modal({ id: "eval", variant: "paper" });
    this.#modal.bind({ close: () => this.#modal.close() });
  }

  #bars(obj) {
    return Object.entries(obj).map(([k, v]) =>
      `<div class="ev-bar"><span>${esc(k)}</span><i><b style="width:${v}%"></b></i><em>${v}%</em></div>`).join("");
  }

  open() {
    const e = this.#gameCtrl.evaluation();
    this.#modal.render(`<div class="paper-panel ev">
      <h2>🎓 Evaluación final — Proyecto Hotel Gran Roble</h2>

      <h3>🧩 Programación Orientada a Objetos</h3>
      ${this.#bars(e.poo)}

      <h3>🏗️ MVC + requerimientos</h3>
      ${this.#bars(e.mvc)}

      <h3>📊 Resultado</h3>
      <div class="ev-scores">
        <div><b>${e.pooScore}</b><span>POO</span></div>
        <div><b>${e.mvcScore}</b><span>MVC</span></div>
        <div><b>${e.logicScore}</b><span>Lógica de negocio</span></div>
        <div><b>${e.qualityScore}</b><span>Calidad producto</span></div>
      </div>

      <p class="ev-final">Nota final: <b>${e.final}/100</b></p>
      <p class="eval-stars">${"★".repeat(e.stars)}${"☆".repeat(5 - e.stars)}</p>
      <p class="eval-title">${e.rank.icon} ${esc(e.rank.name)}</p>
      <p class="eval-time">Retos: ${e.challengesDone} · Errores: ${e.errors} · Reglas: ${e.rulesRespected}/${e.rulesTotal} · Reputación: ${e.reputation} · ${e.minutes} min</p>

      <button class="k close" data-act="close">Cerrar [ESC]</button>
    </div>`);
    this.#modal.open();
  }
}

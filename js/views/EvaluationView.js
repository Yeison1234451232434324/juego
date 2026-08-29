import { Modal } from "./ui/Modal.js";

/**
 * EvaluationView — evaluación final basada en lo que el jugador REALMENTE hizo.
 */
export class EvaluationView {
  #modal; #gameCtrl;

  constructor(gameCtrl) {
    this.#gameCtrl = gameCtrl;
    this.#modal = new Modal({ id: "eval", variant: "paper" });
    this.#modal.bind({ close: () => this.#modal.close() });
  }

  open() {
    const e = this.#gameCtrl.evaluation();
    const check = (k) => e.concepts[k] ? "✓" : "—";
    this.#modal.render(`<div class="paper-panel">
      <h2>📊 PROYECTO FINAL — evaluación</h2>
      <ul class="eval-list">
        <li>Objetos creados: <b>${e.objectsCreated}</b></li>
        <li>Clases implementadas: <b>${e.classesImplemented}</b></li>
        <li>Reglas de negocio respetadas: <b>${e.rulesRespected}/${e.rulesTotal}</b> (${e.rulesPct}%)</li>
        <li>Requerimientos completados: <b>${e.requirements}</b></li>
      </ul>
      <ul class="eval-checks">
        <li>Encapsulamiento: ${check("encapsulamiento")}</li>
        <li>Herencia: ${check("herencia")}</li>
        <li>Polimorfismo: ${check("polimorfismo")}</li>
        <li>Abstracción: ${check("abstracción")}</li>
        <li>Composición: ${check("composición")}</li>
        <li>MVC: ${check("MVC")}</li>
      </ul>
      <p class="eval-time">Tiempo: ${e.minutes} min</p>
      <p class="eval-stars">${"★".repeat(e.stars)}${"☆".repeat(5 - e.stars)}</p>
      <p class="eval-title">"${e.title}"</p>
      <button class="k close" data-act="close">Cerrar [ESC]</button>
    </div>`);
    this.#modal.open();
  }
}

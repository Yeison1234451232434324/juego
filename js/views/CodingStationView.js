import { Modal } from "./ui/Modal.js";
import { esc } from "./ui/dom.js";
import { CodeValidator } from "../services/CodeValidator.js";

const MAT_ES = { wood: "madera", nails: "clavos", screws: "tornillos", paint: "pintura", metal: "metal" };

/**
 * CodingStationView — la COMPUTADORA. El jugador escribe código JavaScript real
 * siguiendo instrucciones numeradas muy explícitas. Si acierta, gana materiales
 * para su pedido. Si falla: ve el error, una explicación del concepto, una pista
 * y puede pedir OTRO reto del mismo tema (nunca se queda atrapado).
 */
export class CodingStationView {
  #modal; #ctrl; #bus; #ch; #hintsShown = 0; #busy = false;

  constructor(ctrl, bus) {
    this.#ctrl = ctrl; this.#bus = bus;
    this.#modal = new Modal({ id: "coding", variant: "terminal" });
    this.#modal.bind({
      run: () => this.#run(),
      hint: () => this.#showHint(),
      example: () => this.#fillExample(),
      other: () => this.open(),          // otro reto (ya rotado tras el fallo)
      close: () => this.#modal.close(),
    });
    bus.on("challenge:solved", (d) => this.#solved(d));
    bus.on("challenge:failed", (d) => this.#failed(d));
  }

  open() {
    this.#ch = this.#ctrl.currentChallenge();
    this.#hintsShown = 0;
    this.#busy = false;
    if (!this.#ch) {
      this.#modal.render(`<div class="term"><p class="ok">✓ No hay más retos ahora mismo.</p>
        <button class="k" data-act="close">Salir [ESC]</button></div>`);
      this.#modal.open();
      return;
    }

    const fails = this.#ctrl.failCount(this.#ch.id);
    const pasos = (this.#ch.pasos ?? []).map((p) => `<li>${esc(p)}</li>`).join("");
    const reqs = this.#ch.requirements
      .map((r) => `<li><span class="rq-mark">▫</span> ${esc(r)}</li>`).join("");
    // tras 2 fallos, empieza con el ejemplo ya puesto
    const startCode = fails >= 2 ? this.#ch.ejemplo : this.#ctrl.editorText(this.#ch);

    this.#modal.render(`
      <div class="term">
        <div class="term-top">━━━ ${esc(this.#ch.title)} ━━━</div>
        <p class="term-brief">${esc(this.#ch.brief)}</p>
        ${this.#ch.objetivo ? `<p class="term-goal">🎯 ${esc(this.#ch.objetivo)}</p>` : ""}
        ${pasos ? `<div class="term-steps"><b>INSTRUCCIONES — hazlas en orden:</b><ul class="term-steps-list">${pasos}</ul></div>` : ""}
        <p class="term-h">Requisitos que revisará la computadora:</p>
        <ul class="term-reqs" id="term-reqs">${reqs}</ul>
        <textarea id="editor" spellcheck="false" rows="10">${esc(startCode)}</textarea>
        <div id="term-out" class="term-out">${fails >= 2
          ? "&gt; Te dejo el ejemplo resuelto. Ajústalo si quieres y pulsa EJECUTAR CÓDIGO."
          : "&gt; Escribe tu código siguiendo las INSTRUCCIONES y pulsa EJECUTAR CÓDIGO."}</div>
        <div class="term-btns">
          <button class="k run" data-act="run">▶ EJECUTAR CÓDIGO</button>
          <button class="k" data-act="hint">💡 Pista</button>
          <button class="k" data-act="example">Ver ejemplo</button>
          <button class="k" data-act="close">Salir [ESC]</button>
        </div>
      </div>`);
    this.#modal.open();
    setTimeout(() => {
      const ed = this.#modal.frame.querySelector("#editor");
      if (!ed) return;
      ed.focus();
      this.#refreshChecklist(ed.value);
      ed.addEventListener("input", () => this.#refreshChecklist(ed.value));
      ed.addEventListener("keydown", (e) => {
        e.stopPropagation();
        if (e.key === "Tab") {
          e.preventDefault();
          const s = ed.selectionStart, en = ed.selectionEnd;
          ed.value = ed.value.slice(0, s) + "  " + ed.value.slice(en);
          ed.selectionStart = ed.selectionEnd = s + 2;
        }
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); this.#run(); }
        if (e.key === "Escape") { e.preventDefault(); this.#modal.close(); }
      });
    }, 60);
  }

  #refreshChecklist(code) {
    const list = this.#modal.frame.querySelector("#term-reqs");
    if (!list || !this.#ch) return;
    let res;
    try { res = CodeValidator.validate(code, this.#ch.checks, false); } catch { return; }
    const okLabels = new Set(res.passed);
    [...list.querySelectorAll("li")].forEach((li, i) => {
      const ok = okLabels.has(this.#ch.checks[i]?.label);
      li.classList.toggle("done", ok);
      const mk = li.querySelector(".rq-mark");
      if (mk) mk.textContent = ok ? "✓" : "▫";
    });
  }

  #fillExample() {
    const ed = this.#modal.frame.querySelector("#editor");
    if (ed && this.#ch) {
      ed.value = this.#ch.ejemplo;
      this.#refreshChecklist(ed.value);
      const out = this.#modal.frame.querySelector("#term-out");
      if (out) { out.className = "term-out hint"; out.textContent = "💡 Este es un ejemplo válido. Púlsalo EJECUTAR o adáptalo a tu manera."; }
    }
  }

  #showHint() {
    if (!this.#ch) return;
    const out = this.#modal.frame.querySelector("#term-out");
    const code = this.#modal.frame.querySelector("#editor")?.value ?? "";
    const res = CodeValidator.validate(code, this.#ch.checks, true);
    const pend = res.failed.filter((f) => f.hint);
    if (!pend.length) {
      out.className = "term-out ok";
      out.textContent = "✓ Ya cumples todos los requisitos. Pulsa EJECUTAR CÓDIGO.";
      return;
    }
    const n = Math.min(this.#hintsShown, pend.length - 1);
    this.#hintsShown = n + 1;
    out.className = "term-out hint";
    out.textContent = `💡 Pista (${n + 1}/${pend.length}) · ${pend[n].label}\n${pend[n].hint}`;
  }

  #run() {
    if (this.#busy) return;
    const code = this.#modal.frame.querySelector("#editor")?.value ?? "";
    const out = this.#modal.frame.querySelector("#term-out");
    this.#busy = true;
    if (out) { out.className = "term-out loading"; out.textContent = "⏳ Compilando y revisando tu código…"; }
    this.#bus.emit("sfx", "compile");
    setTimeout(() => { this.#busy = false; this.#ctrl.submit(code); }, 600);
  }

  #failed({ result, explain, fails }) {
    const out = this.#modal.frame.querySelector("#term-out");
    if (!out) return;
    const code = this.#modal.frame.querySelector("#editor")?.value ?? "";
    this.#refreshChecklist(code);
    const first = result.failed[0];
    out.className = "term-out bad";
    let txt = `❌ RESPUESTA INCORRECTA\n> ${first?.error ?? "Revisa tu código."}`;
    if (explain) txt += `\n\n${explain}`;
    // la pista siempre disponible (aquí no depende de la mejora)
    let hint = result.failed.find((f) => f.hint)?.hint;
    if (!hint) {
      try { hint = CodeValidator.validate(code, this.#ch.checks, true).failed.find((f) => f.hint)?.hint; } catch { /* noop */ }
    }
    if (hint) txt += `\n\n💡 PISTA: ${hint}`;
    out.textContent = txt;

    // botón para probar otro reto del mismo concepto (ya rotado)
    const btns = this.#modal.frame.querySelector(".term-btns");
    if (btns && !btns.querySelector("[data-act='other']")) {
      const b = document.createElement("button");
      b.className = "k"; b.dataset.act = "other"; b.textContent = "↻ Probar otro reto";
      btns.appendChild(b);
    }
    if (fails >= 2) {
      const ed = this.#modal.frame.querySelector("#editor");
      if (ed) { ed.value = this.#ch.ejemplo; this.#refreshChecklist(ed.value); }
      out.textContent += `\n\n(Te he puesto un ejemplo válido en el editor. Ajústalo y pulsa EJECUTAR.)`;
    }
  }

  #solved({ challenge, award, xp, orderReady }) {
    const matEs = MAT_ES[award?.material] ?? award?.material ?? "materiales";
    const progreso = award?.need
      ? `\n${award.material === "wood" ? "🪵" : "🔩"} ${matEs}: ${Math.min(award.have, award.need)}/${award.need}`
      : "";
    this.#modal.render(`
      <div class="term">
        <div class="term-top ok">✓ RETO COMPLETADO</div>
        <p>Aplicaste: <b>${esc(challenge.concept)}</b>${challenge.rf ? ` · ${challenge.rf} ✓` : ""}</p>
        <p class="term-reward big">Recompensa:  +${award?.amount ?? 0} ${matEs}   ·   +${xp} XP</p>
        <pre class="term-progress">${esc(progreso.trim())}</pre>
        ${orderReady
          ? `<p class="ok">✓ MATERIALES COMPLETOS. Ya puedes fabricar tu pedido en el Banco de trabajo 🔨.</p>`
          : `<p class="wp-sub">Aún faltan materiales para tu pedido. Resuelve otro reto.</p>`}
        <div class="term-btns">
          ${orderReady ? "" : `<button class="k run" data-act="other">Siguiente reto</button>`}
          <button class="k" data-act="close">Salir [ESC]</button>
        </div>
      </div>`);
    this.#bus.emit("sfx", "ok");
  }
}

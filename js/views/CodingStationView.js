import { Modal } from "./ui/Modal.js";
import { esc } from "./ui/dom.js";
import { CodeValidator } from "../services/CodeValidator.js";

const MAT_ES = { wood: "madera", nails: "clavos", screws: "tornillos", paint: "pintura", metal: "metal" };

/** Tipos de error: enseñan que "compila" ≠ "cumple el requisito". */
const ERR = {
  sintaxis: { tag: "ERROR DE SINTAXIS", note: "El código no puede ejecutarse.", cls: "e-syn" },
  poo:      { tag: "ERROR DE POO", note: "El código se ejecuta, pero la clase no está bien definida.", cls: "e-poo" },
  logica:   { tag: "ERROR DE LÓGICA", note: "El código se ejecuta, pero el resultado no es el pedido.", cls: "e-log" },
};

/** Qué código real del proyecto satisface cada concepto (para el "requisito cumplido"). */
const IMPL = {
  clase: "class Chair extends Furniture { … }",
  atributo: 'this.nombre = "Silla"; this.precio = 75;',
  encapsulamiento: "setPrice(v) { if (v <= 0) return { ok:false }; this.#price = v; }",
  herencia: "class Table extends Furniture { … }",
  polimorfismo: "calculateProductionTime() { return CONFIG.CRAFT_SECONDS.Chair; }",
  abstracción: "Furniture.calculateProductionTime() → throw (abstracto)",
  composición: "class Workshop { #inventory; #worker; #orders; }",
};

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
      lab: () => { this.#modal.close(); this.#bus.emit("open:knowledge", { tab: "lab" }); },
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
        <p class="term-h">Requisitos que revisará la computadora ${this.#ch.rf ? `· <b>${esc(this.#ch.rf)}</b>` : ""}:</p>
        <ul class="term-reqs" id="term-reqs">${reqs}</ul>
        <div class="editor-wrap"><div class="editor-gutter" id="ed-gutter"></div><textarea id="editor" spellcheck="false" rows="10">${esc(startCode)}</textarea></div>
        <div id="term-out" class="term-out">${fails >= 2
          ? "&gt; Te dejo el ejemplo resuelto. Ajústalo si quieres y pulsa EJECUTAR CÓDIGO."
          : "&gt; Escribe tu código siguiendo las INSTRUCCIONES y pulsa EJECUTAR CÓDIGO."}</div>
        <div class="term-btns">
          <button class="k run" data-act="run">▶ EJECUTAR CÓDIGO</button>
          <button class="k" data-act="hint">💡 Pista</button>
          <button class="k" data-act="example">Ver ejemplo</button>
          <button class="k" data-act="lab">🧪 Laboratorio</button>
          <button class="k" data-act="close">Salir [ESC]</button>
        </div>
      </div>`);
    this.#modal.open();
    setTimeout(() => {
      const ed = this.#modal.frame.querySelector("#editor");
      if (!ed) return;
      ed.focus();
      this.#refreshChecklist(ed.value);
      this.#syncGutter(ed);
      ed.addEventListener("input", () => { this.#refreshChecklist(ed.value); this.#syncGutter(ed); });
      ed.addEventListener("scroll", () => this.#syncGutter(ed));
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

  /** Números de línea del editor; `errLine` resalta la línea con el error. */
  #syncGutter(ed, errLine = 0) {
    const g = this.#modal.frame.querySelector("#ed-gutter");
    if (!g || !ed) return;
    const n = ed.value.split("\n").length;
    g.innerHTML = Array.from({ length: n }, (_, i) =>
      `<span class="${i + 1 === errLine ? "err" : ""}">${i + 1}</span>`).join("");
    g.scrollTop = ed.scrollTop;
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
    out.className = "term-out bad";

    // ---- DEBUGGER: localiza el problema y lo explica (no resuelve el reto) ----
    let dbg = null;
    try { dbg = CodeValidator.diagnose(code, this.#ch.checks, this.#ch); } catch { /* noop */ }
    // pista: básica siempre; más específica si tiene el Analizador de código
    let hint = dbg?.hint || result.failed.find((f) => f.hint)?.hint || "";
    if (!hint) {
      try { hint = CodeValidator.validate(code, this.#ch.checks, true).failed.find((f) => f.hint)?.hint || ""; } catch { /* noop */ }
    }

    if (dbg) {
      const ed = this.#modal.frame.querySelector("#editor");
      if (ed && dbg.line) this.#syncGutter(ed, dbg.line);
      const kind = ERR[dbg.kind] ?? ERR.sintaxis;
      const pointer = dbg.line
        ? `<div class="dbg-code"><span class="dbg-ln">L${dbg.line}</span><code>${esc(dbg.snippet)}</code>` +
          (dbg.col ? `<div class="dbg-caret" style="--c:${dbg.col}">↑</div>` : "") + `</div>`
        : "";
      out.innerHTML = `<div class="dbg">
        <div class="dbg-top ${kind.cls}">❌ ${kind.tag}${dbg.line ? ` · Línea ${dbg.line}` : ""}</div>
        <p class="dbg-kind">${esc(kind.note)}</p>
        ${pointer}
        <p class="dbg-problem"><b>Problema:</b> ${esc(dbg.problem)}</p>
        <p class="dbg-concept"><b>Concepto:</b> ${esc(dbg.concept)}${dbg.rf ? ` &nbsp;·&nbsp; <b>Requisito:</b> ${esc(dbg.rf)}` : ""}</p>
        ${explain ? `<p class="dbg-explain">${esc(explain)}</p>` : ""}
        ${hint ? `<p class="dbg-hint">💡 <b>Pista:</b> ${esc(hint)}</p>` : ""}
      </div>`;
    } else {
      let txt = `❌ RESPUESTA INCORRECTA\n> ${result.failed[0]?.error ?? "Revisa tu código."}`;
      if (explain) txt += `\n\n${explain}`;
      if (hint) txt += `\n\n💡 PISTA: ${hint}`;
      out.textContent = txt;
    }

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
      const note = document.createElement("p");
      note.className = "dbg-note";
      note.textContent = "Te he puesto un ejemplo válido en el editor. Ajústalo y pulsa EJECUTAR.";
      out.appendChild(note);
    }
  }

  #solved({ challenge, award, xp, orderReady }) {
    const matEs = MAT_ES[award?.material] ?? award?.material ?? "materiales";
    const progreso = award?.need
      ? `${award.material === "wood" ? "🪵" : "🔩"} ${matEs}: ${Math.min(award.have, award.need)}/${award.need}`
      : "";
    const impl = IMPL[challenge.concept] ?? "";
    const prod = challenge.product ?? "Chair";
    const inst = { Chair: "silla01", Table: "mesa01", Cabinet: "armario01" }[prod] ?? "obj01";

    this.#modal.render(`
      <div class="term">
        <div class="term-top ok">✓ RETO COMPLETADO</div>

        ${challenge.rf ? `<div class="rf-done">
          <div class="rf-done-h">✅ REQUISITO CUMPLIDO · <b>${esc(challenge.rf)}</b></div>
          <div class="rf-done-c">implementado mediante <code>${esc(impl)}</code></div>
        </div>` : ""}

        <div class="obj-insp">
          <div class="oi-h">🔬 INSPECTOR DE OBJETO</div>
          <div class="oi-tree">Furniture <i>↑</i> ${esc(prod)} <i>↓</i> <b>${esc(inst)}</b></div>
          <div class="oi-grid">
            <span>Clase</span><code>${esc(prod)}</code>
            <span>Hereda de</span><code>Furniture</code>
            <span>Atributos</span><code>nombre · precio · materiales</code>
            <span>Métodos</span><code>setPrice() · calculateProductionTime()</code>
          </div>
        </div>

        <p class="term-reward big">Recompensa:  +${award?.amount ?? 0} ${matEs}   ·   +${xp} XP</p>
        ${progreso ? `<pre class="term-progress">${esc(progreso)}</pre>` : ""}
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

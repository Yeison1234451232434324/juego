import { Modal } from "./ui/Modal.js";
import { esc } from "./ui/dom.js";
import { CodeValidator } from "../services/CodeValidator.js";

/**
 * CodingStationView — la "computadora" del taller. Aquí el jugador escribe
 * código JavaScript REAL y lo ejecuta. Si es correcto, el ProgrammingController
 * entrega materiales. Muestra instrucciones paso a paso, una lista de requisitos
 * que se marca en verde, pistas siempre disponibles y una pantalla de carga
 * mientras "compila".
 */
export class CodingStationView {
  #modal; #ctrl; #bus; #ch; #hintsShown = 0; #busy = false;

  constructor(ctrl, bus) {
    this.#ctrl = ctrl; this.#bus = bus;
    this.#modal = new Modal({ id: "coding", variant: "terminal" });
    this.#modal.bind({
      run: () => this.#run(),
      hint: () => this.#showHint(),
      close: () => this.#modal.close(),
      tpl: () => {
        const t = this.#modal.frame.querySelector("#editor");
        if (t && this.#ch) { t.value = this.#ch.template; this.#refreshChecklist(t.value); }
      },
    });
    bus.on("challenge:solved", ({ challenge, rewards, doubled }) => this.#solved(challenge, rewards, doubled));
    bus.on("challenge:failed", ({ result }) => this.#failed(result));
  }

  open() {
    this.#ch = this.#ctrl.currentChallenge();
    this.#hintsShown = 0;
    this.#busy = false;
    if (!this.#ch) {
      this.#modal.render(`<div class="term"><p class="ok">✓ Has resuelto todos los retos de programación disponibles.</p>
        <button class="k" data-act="close">Salir [ESC]</button></div>`);
      this.#modal.open();
      return;
    }

    const pasos = this.#ch.pasos?.map((p) => `<li>${esc(p)}</li>`).join("") ?? "";
    const reqs = this.#ch.requirements
      .map((r, i) => `<li data-req="${i}"><span class="rq-mark">▫</span> ${esc(r)}</li>`).join("");

    this.#modal.render(`
      <div class="term">
        <div class="term-top">━━━ ${esc(this.#ch.title)} ━━━</div>
        <p class="term-brief">${esc(this.#ch.brief)}</p>
        ${this.#ch.objetivo ? `<p class="term-goal">🎯 ${esc(this.#ch.objetivo)}</p>` : ""}
        ${pasos ? `<div class="term-steps"><b>Instrucciones:</b><ol>${pasos}</ol></div>` : ""}
        <p class="term-h">Requisitos que debe cumplir tu código:</p>
        <ul class="term-reqs" id="term-reqs">${reqs}</ul>
        <textarea id="editor" spellcheck="false" rows="10">${esc(this.#ctrl.editorText(this.#ch))}</textarea>
        <div id="term-out" class="term-out">&gt; Escribe tu código siguiendo los PASOS y pulsa EJECUTAR.</div>
        <div class="term-btns">
          <button class="k run" data-act="run">▶ EJECUTAR CÓDIGO</button>
          <button class="k" data-act="hint">💡 Pedir una pista</button>
          <button class="k" data-act="tpl">Ver ejemplo resuelto</button>
          <button class="k" data-act="close">Salir [ESC]</button>
        </div>
        <p class="term-reward">Recompensa: ${this.#rewardText(this.#ch.rewards)}</p>
      </div>`);
    this.#modal.open();
    setTimeout(() => {
      const ed = this.#modal.frame.querySelector("#editor");
      if (!ed) return;
      ed.focus();
      this.#refreshChecklist(ed.value);
      ed.addEventListener("input", () => this.#refreshChecklist(ed.value));
      ed.addEventListener("keydown", (e) => {
        e.stopPropagation();                       // que Phaser no lo vea
        if (e.key === "Tab") {                     // Tab inserta 2 espacios
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

  /** Marca en verde cada requisito ya cumplido (sin ejecutar código del jugador). */
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

  #rewardText(r) {
    const MAT = { wood: "madera", nails: "clavos", screws: "tornillos", paint: "pintura", metal: "metal", core: "núcleo" };
    return Object.entries(r).map(([k, v]) => k === "xp" ? `+${v} XP` : `+${v} ${MAT[k] ?? k}`).join("  ·  ");
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
    // pequeña pausa para que se vea la "carga" y no parezca instantáneo
    setTimeout(() => {
      this.#busy = false;
      this.#ctrl.submit(code);
    }, 650);
  }

  #failed(result) {
    const out = this.#modal.frame.querySelector("#term-out");
    if (!out) return;
    this.#refreshChecklist(this.#modal.frame.querySelector("#editor")?.value ?? "");
    const fails = result.failed;
    out.className = "term-out bad";
    let txt = `✗ Todavía no compila / no cumple.\n> ${fails[0]?.error ?? "Revisa tu código."}`;
    // pista de la primera pendiente, siempre
    const firstHint = fails.find((f) => f.hint);
    if (firstHint?.hint) txt += `\n💡 ${firstHint.hint}`;
    if (result.passed.length)
      txt += `\n\nYa cumples:\n` + result.passed.map((p) => `  ✓ ${p}`).join("\n");
    out.textContent = txt;
  }

  #solved(challenge, rewards, doubled) {
    this.#modal.render(`
      <div class="term">
        <div class="term-top ok">✓ CLASE CREADA</div>
        <p>"${esc(challenge.title.replace(/^PROYECTO:\s*/i, ""))}" quedó registrada correctamente.</p>
        <p class="term-concept">Concepto aplicado: <b>${esc(challenge.concept)}</b>${challenge.rf ? ` · ${challenge.rf} ✓` : ""}</p>
        <p class="term-reward big">Recompensa${doubled ? " (x2)" : ""}: ${this.#rewardText(rewards)}</p>
        <button class="k run" data-act="close">Continuar [ESC]</button>
      </div>`);
    this.#bus.emit("sfx", "ok");
  }
}

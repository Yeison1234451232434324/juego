import { Modal } from "./ui/Modal.js";
import { esc } from "./ui/dom.js";
import { KnowledgeService } from "../services/KnowledgeService.js";
import { FurnitureFactory } from "../services/FurnitureFactory.js";

/**
 * KnowledgeView — 🧠 MI CONOCIMIENTO.
 * Panel educativo con pestañas:
 *   🌳 Árbol POO · 🧠 Conceptos · 🎭 Polimorfismo · 🧪 Laboratorio · 📊 Progreso
 * Todo el progreso que muestra es REAL (retos resueltos, conceptos aplicados,
 * acciones hechas). El laboratorio delega en ProgrammingController; esta vista
 * no contiene lógica de negocio.
 */
export class KnowledgeView {
  #modal; #prog; #gs; #bus;
  #tab = "arbol";
  #labId = null;
  #detail = null;

  constructor(programming, gs, bus) {
    this.#prog = programming; this.#gs = gs; this.#bus = bus;
    this.#modal = new Modal({ id: "knowledge", variant: "paper" });
    this.#modal.bind({
      tab: (d) => { this.#tab = d.tab; this.#labId = null; this.#render(); },
      concept: (d) => { this.#detail = d.k; this.#render(); },
      back: () => { this.#detail = null; this.#render(); },
      poly: (d) => this.#runPoly(d.type),
      lab: (d) => { this.#labId = d.id; this.#render(); },
      labrun: () => this.#runLab(),
      labback: () => { this.#labId = null; this.#render(); },
      close: () => this.#modal.close(),
    });
    bus.on("open:knowledge", (o) => this.open(o?.tab));
    // Solo refrescamos pestañas NO interactivas (poly y lab mantienen su estado en el DOM).
    bus.on("state:changed", () => {
      if (this.#modal.isOpen && !this.#labId && this.#tab !== "poly" && this.#tab !== "lab") this.#render();
    });
  }

  open(tab) { if (tab) this.#tab = tab; this.#detail = null; this.#labId = null; this.#render(); this.#modal.open(); }

  // ---------- pestañas ----------
  #tabsBar() {
    const T = [["arbol", "🌳 Árbol"], ["conceptos", "🧠 Conceptos"], ["poly", "🎭 Polimorfismo"],
      ["lab", "🧪 Laboratorio"], ["progreso", "📊 Progreso"]];
    return `<div class="kv-tabs">${T.map(([k, l]) =>
      `<button class="kv-tab ${this.#tab === k ? "on" : ""}" data-act="tab" data-tab="${k}">${l}</button>`).join("")}</div>`;
  }

  #arbol() {
    const kids = ["Chair", "Table", "Cabinet"].map((t) => {
      const es = ({ Chair: "Chair", Table: "Table", Cabinet: "Cabinet" })[t];
      return `<div class="tree-leaf"><b>${es}</b><span>hereda de Furniture</span></div>`;
    }).join("");
    const list = KnowledgeService.pooConcepts().map((c) => {
      const pct = Math.round(KnowledgeService.pooProgress(this.#gs, c) * 100);
      const mark = pct >= 100 ? "✅" : pct > 0 ? "🟡" : "🔒";
      return `<button class="kv-chip ${pct >= 100 ? "on" : ""}" data-act="concept" data-k="${c.key}">${mark} ${c.icon} ${esc(c.name)}</button>`;
    }).join("");
    return `<div class="tree">
        <div class="tree-root">🪑 Furniture <span>(abstracta)</span></div>
        <div class="tree-branch">${kids}</div>
      </div>
      <p class="wp-sub">Conceptos de POO — se desbloquean al usarlos de verdad:</p>
      <div class="kv-chips">${list}</div>`;
  }

  #conceptDetail(key) {
    const c = KnowledgeService.pooConcepts().find((x) => x.key === key);
    if (!c) return this.#conceptsList();
    const pct = Math.round(KnowledgeService.pooProgress(this.#gs, c) * 100);
    return `<button class="k sm" data-act="back">◀ Volver</button>
      <h3>${c.icon} ${esc(c.name)} ${pct >= 100 ? "✅" : ""}</h3>
      <p class="kv-what">📖 ${esc(c.what)}</p>
      <pre class="intro-code"><code>${esc(c.code)}</code></pre>
      <p class="kv-game">🎮 <b>En el juego:</b> ${esc(c.game)}</p>
      <p class="kv-used">✅ <b>Tú:</b> ${pct >= 100 ? "lo has aplicado resolviendo retos."
        : pct > 0 ? "lo has intentado; te falta acertar un reto de este tipo."
        : "aún no lo has usado."}</p>`;
  }

  #conceptsList() {
    const poo = KnowledgeService.pooConcepts().map((c) => {
      const pct = Math.round(KnowledgeService.pooProgress(this.#gs, c) * 100);
      return `<button class="kv-row ${pct >= 100 ? "on" : ""}" data-act="concept" data-k="${c.key}">
        <span>${pct >= 100 ? "✅" : pct > 0 ? "🟡" : "🔒"} ${c.icon} ${esc(c.name)}</span>
        <i class="kv-mini"><b style="width:${pct}%"></b></i></button>`;
    }).join("");
    const mvc = KnowledgeService.mvcConcepts().map((m) => {
      const on = KnowledgeService.mvcKnown(this.#gs, m.key);
      return `<div class="kv-row ${on ? "on" : ""}"><span>${on ? "✅" : "🔒"} ${m.icon} ${esc(m.name)}</span>
        <span class="wp-sub">${esc(m.what)}</span></div>`;
    }).join("");
    return `<h3>🧩 POO</h3>${poo}<h3>🏗️ MVC + requerimientos</h3>${mvc}`;
  }

  #poly() {
    const rows = KnowledgeService.polymorphismRows().map((r) => `
      <div class="poly-row" id="poly-${r.type}">
        <b>${r.es}</b>
        <code>${r.type.toLowerCase()}.calculateProductionTime()</code>
        <button class="k sm" data-act="poly" data-type="${r.type}">▶ Ejecutar</button>
        <span class="poly-out" data-for="${r.type}">—</span>
      </div>`).join("");
    return `<h3>🎭 Polimorfismo</h3>
      <p class="wp-sub">El <b>mismo</b> método, <code>calculateProductionTime()</code>, se comporta distinto según el objeto.
        Pulsa cada botón y compara.</p>
      ${rows}
      <p class="kv-game" id="poly-note"></p>`;
  }

  #runPoly(type) {
    let secs = 0;
    try { secs = FurnitureFactory.create(type).calculateProductionTime(); } catch { secs = 0; }
    const out = this.#modal.frame.querySelector(`.poly-out[data-for="${type}"]`);
    if (out) { out.textContent = `→ ${secs} s`; out.classList.add("done"); }
    this.#bus.emit("sfx", "type");
    const done = ["Chair", "Table", "Cabinet"].every((t) =>
      this.#modal.frame.querySelector(`.poly-out[data-for="${t}"]`)?.classList.contains("done"));
    if (done) {
      const note = this.#modal.frame.querySelector("#poly-note");
      if (note) note.innerHTML = "✅ Una sola llamada, tres resultados: <b>eso es polimorfismo</b>. Cada subclase implementa su propio <code>calculateProductionTime()</code>.";
      this.#bus.emit("concept:learned", "polimorfismo");   // la mutación la hace el controlador
    }
  }

  #lab() {
    if (this.#labId) return this.#labDetail();
    const rows = this.#prog.labExercises().map((e) => `
      <button class="kv-row ${e.done ? "on" : ""}" data-act="lab" data-id="${e.id}">
        <span>${e.done ? "✅" : "▫"} ${e.icon} ${esc(e.title)}</span>
        <span class="wp-sub">${esc(e.prompt)}</span></button>`).join("");
    return `<h3>🧪 Laboratorio</h3>
      <p class="wp-sub">Practica sin gastar materiales ni afectar a tus pedidos. Cada ejercicio da algo de XP y desbloquea un concepto.</p>
      ${rows}`;
  }

  #labDetail() {
    const ex = this.#prog.labExercises().find((e) => e.id === this.#labId);
    if (!ex) return this.#lab();
    return `<button class="k sm" data-act="labback">◀ Volver</button>
      <h3>${ex.icon} ${esc(ex.title)}</h3>
      <p class="term-goal">🎯 ${esc(ex.prompt)}</p>
      <textarea id="lab-editor" spellcheck="false" rows="6">${esc(ex.starter)}</textarea>
      <div id="lab-out" class="term-out">&gt; Completa el hueco y pulsa COMPROBAR.</div>
      <div class="term-btns">
        <button class="k run" data-act="labrun">▶ COMPROBAR</button>
        <button class="k" data-act="labback">Salir</button>
      </div>`;
  }

  #runLab() {
    const ed = this.#modal.frame.querySelector("#lab-editor");
    const out = this.#modal.frame.querySelector("#lab-out");
    if (!ed || !out) return;
    const r = this.#prog.submitLab(this.#labId, ed.value);
    if (r.ok) {
      out.className = "term-out ok";
      out.textContent = `✓ ¡Correcto!  +${r.xp} XP · concepto desbloqueado: ${r.concept}`;
      this.#bus.emit("sfx", "ok");
      setTimeout(() => { this.#labId = null; this.#render(); }, 1400);
    } else {
      out.className = "term-out bad";
      out.textContent = `✗ ${r.error}`;
      this.#bus.emit("sfx", "error");
    }
  }

  #progreso() {
    const s = KnowledgeService.stats(this.#gs);
    const rk = KnowledgeService.rank(this.#gs.player.level);
    const nx = KnowledgeService.nextRank(this.#gs.player.level);
    const bars = KnowledgeService.progressBars(this.#gs).map((b) =>
      `<div class="kv-bar"><span>${esc(b.label)}</span><i><b style="width:${b.pct}%"></b></i><em>${b.pct}%</em></div>`).join("");
    const stat = (l, v) => `<div class="kv-stat"><b>${v}</b><span>${l}</span></div>`;
    return `<div class="kv-rank">${rk.icon} <b>${esc(rk.name)}</b> · Nivel ${this.#gs.player.level}
        ${nx ? `<span class="wp-sub">— siguiente: ${nx.icon} ${esc(nx.name)} (nivel ${nx.min})</span>` : ""}</div>
      <div class="kv-stats">
        ${stat("Pedidos completados", s.ordersDelivered)}
        ${stat("Productos fabricados", s.objectsCreated)}
        ${stat("Retos resueltos", s.challengesDone)}
        ${stat("Laboratorio", s.labSolved)}
        ${stat("Errores", s.errors)}
        ${stat("Dinero ganado", "$" + s.coinsEarned)}
        ${stat("Calidad media", s.avgQuality + "/100")}
        ${stat("Reputación", s.reputation)}
      </div>
      <h3>Dominio por concepto</h3>${bars}
      <h3>🏆 Logros ${this.#achv().filter((a) => a.unlocked).length}/${this.#achv().length}</h3>
      <div class="kv-achv">${this.#achv().map((a) =>
        `<div class="kv-ach ${a.unlocked ? "on" : ""}" title="${esc(a.desc)}">${a.unlocked ? a.icon : "🔒"} ${esc(a.name)}</div>`).join("")}</div>`;
  }

  #achv() {
    try { return this.#gs.achievements.all(); } catch { return []; }
  }

  #body() {
    if (this.#tab === "arbol") return this.#detail ? this.#conceptDetail(this.#detail) : this.#arbol();
    if (this.#tab === "conceptos") return this.#detail ? this.#conceptDetail(this.#detail) : this.#conceptsList();
    if (this.#tab === "poly") return this.#poly();
    if (this.#tab === "lab") return this.#lab();
    return this.#progreso();
  }

  #render() {
    this.#modal.render(`<div class="paper-panel kv">
      <h2>🧠 Mi conocimiento</h2>
      ${this.#tabsBar()}
      <div class="kv-content">${this.#body()}</div>
      <button class="k close" data-act="close">Salir [ESC]</button>
    </div>`);
    const ed = this.#modal.frame.querySelector("#lab-editor");
    if (ed) ed.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (e.key === "Tab") { e.preventDefault(); const s = ed.selectionStart; ed.value = ed.value.slice(0, s) + "  " + ed.value.slice(ed.selectionEnd); ed.selectionStart = ed.selectionEnd = s + 2; }
    });
  }
}

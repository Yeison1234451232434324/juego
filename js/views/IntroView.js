import { el, $, esc } from "./ui/dom.js";

/**
 * IntroView — INTRODUCCIÓN EDUCATIVA CINEMÁTICA (solo HTML/CSS/JS, sin vídeo ni
 * dependencias externas). Explica los dos temas del juego con ejemplos de código
 * REALES del proyecto:
 *
 *   🧩 POO         — clase, objeto, atributo, método, encapsulamiento, herencia
 *   🏗️ MVC + reglas — requerimiento, regla de negocio, Modelo · Vista · Controlador
 *
 * NO toca el GameState ni el guardado de partida: solo escribe la preferencia
 * `codecraft-workshop:introSeen` en localStorage. El AudioManager es el mismo del
 * juego (respeta musicOn / sfxOn / volúmenes).
 */
const SEEN_KEY = "codecraft-workshop:introSeen";
export const introSeen = () => { try { return localStorage.getItem(SEEN_KEY) === "1"; } catch { return false; } };
export const markIntroSeen = () => { try { localStorage.setItem(SEEN_KEY, "1"); } catch { /* noop */ } };

const chips = (arr) => `<div class="intro-flow">${arr.map((c) => `<span>${c}</span>`).join("<i>→</i>")}</div>`;
const cards = (arr) => `<div class="intro-cards">${arr.map((c) =>
  `<div class="intro-cd"><b>${c.h}</b><span>${c.p}</span></div>`).join("")}</div>`;

/* ---- 12 escenas: imagen → concepto → ejemplo → código corto → relación con el juego ---- */
const SCENES = [
  {
    key: "welcome", tag: "CODECRAFT WORKSHOP",
    title: "Bienvenido al taller",
    sub: "Un taller donde <b>programar bien</b> significa <b>producir mejor</b>.",
    art: `<div class="intro-shop">🪚 🔨 📋 💻 📦 🧾 🔧</div>`,
    body: cards([
      { h: "🧩 Programación Orientada a Objetos", p: "Cómo se representan los productos del taller en código." },
      { h: "🏗️ Requerimientos + Lógica de negocio + MVC", p: "Cómo el sistema decide qué está permitido y cómo se organiza." },
    ]) + `<p class="intro-note">Aprenderás los dos <b>mientras juegas</b>, no en una clase teórica.</p>`,
    sfx: "level",
  },
  {
    key: "flow", tag: "El ciclo del taller",
    title: "¿Qué vas a hacer?",
    sub: "Cada trabajo sigue <b>siempre</b> el mismo ciclo.",
    art: `<div class="intro-ticket">
      <b>📋 PEDIDO</b><span>Silla rústica</span>
      <div class="it-req">🪵 4 madera · 🔩 2 clavos · 💰 75</div></div>`,
    body: chips(["📋 Pedido", "📝 Requisitos", "💻 Programación", "📦 Materiales", "🔨 Fabricación", "🧾 Cliente"]) +
      `<p class="intro-link">Este flujo es exactamente el del juego real.</p>`,
    sfx: "open",
  },
  {
    key: "poo", tag: "🧩 Tema 1 · POO",
    title: "Los productos son objetos",
    sub: "Un mueble del taller se representa como un <b>objeto de código</b>.",
    code:
`class Silla {
  constructor() {
    this.nombre = "Silla";
  }
  fabricar() {
    return true;
  }
}`,
    marks: [
      { token: "class Silla", label: "una CLASE: el molde de un tipo de objeto" },
      { token: "this.nombre", label: "un ATRIBUTO: un dato que describe al objeto" },
      { token: "fabricar()", label: "un MÉTODO: una acción del objeto" },
    ],
    link: "Esto es literalmente lo que escribes en el primer reto con BYTE, en la computadora.",
  },
  {
    key: "objeto", tag: "🧩 POO · Clase y objeto",
    title: "La clase es el molde; el objeto, la pieza",
    sub: "Con un molde puedes fabricar muchas piezas iguales.",
    code:
`// el molde
class Silla { /* ... */ }

// un objeto concreto hecho con el molde
const silla = new Silla();`,
    marks: [
      { token: "class Silla", label: "el molde (se define una vez)" },
      { token: "new Silla()", label: "crea un OBJETO (una instancia) del molde" },
    ],
    link: "En el código del juego la fábrica hace new Chair(), new Table()… (FurnitureFactory).",
  },
  {
    key: "attrs", tag: "🧩 POO · Atributos y métodos",
    title: "Datos y acciones",
    art: `<div class="intro-two">
      <div><b>PROPIEDADES</b><span>nombre</span><span>precio</span><span>materiales</span><span>estilo</span></div>
      <div><b>MÉTODOS</b><span>fabricar()</span><span>calculateProductionTime()</span><span>describe()</span></div>
    </div>`,
    code:
`class Furniture {
  #price;                       // atributo (dato)
  get materials() { /* receta */ }
  calculateProductionTime() { } // método (acción)
}`,
    marks: [
      { token: "#price", label: "ATRIBUTO — un dato del objeto" },
      { token: "calculateProductionTime()", label: "MÉTODO — una acción del objeto" },
    ],
    link: "🪵 materiales y 💰 precio son atributos; 🔨 fabricar es un método.",
  },
  {
    key: "encap", tag: "🧩 POO · Encapsulamiento",
    title: "El objeto protege sus propios datos",
    art: `<div class="intro-reject">💰 precio = <s>-500</s> &nbsp;→&nbsp; <b>❌ OPERACIÓN RECHAZADA</b></div>`,
    code:
`setPrice(value) {
  if (value <= 0)
    return { ok: false, reason: "..." };
  this.#price = Math.round(value);
}`,
    marks: [
      { token: "#price", label: "privado: solo la clase puede cambiarlo" },
      { token: "if (value <= 0)", label: "valida ANTES de tocar el dato" },
    ],
    link: "Por eso comprar una mejora no puede alterar tus retos ni tu inventario a la fuerza: cada dato tiene su guardián.",
    sfx: "error", markSfx: "ok",
  },
  {
    key: "herencia", tag: "🧩 POO · Herencia",
    title: "Compartir lo común, especializar lo propio",
    sub: "Silla, Mesa y Armario parten de la misma base.",
    code:
`class Chair extends Furniture {
  #comfort;
  calculateProductionTime() {
    return CONFIG.CRAFT_SECONDS.Chair; // 15
  }
}`,
    marks: [
      { token: "extends Furniture", label: "HEREDA precio, materiales y sus validaciones" },
      { token: "calculateProductionTime()", label: "POLIMORFISMO: cada mueble da su propio tiempo" },
    ],
    link: "Chair, Table y Cabinet son subclases reales de Furniture en js/models.",
  },
  {
    key: "tema2", tag: "🏗️ Tema 2",
    title: "Requerimientos + lógica de negocio + MVC",
    sub: "Programar una clase no basta: el taller debe cumplir las <b>reglas del negocio</b>.",
    art: `<div class="intro-ticket">
      <b>📋 PEDIDO DE CLIENTE</b><span>Silla rústica</span>
      <div class="it-req">4 madera · 2 clavos</div>
      <div class="it-rule">⚖️ No se entrega una silla que no se haya fabricado.</div></div>`,
    sfx: "open",
  },
  {
    key: "req", tag: "🏗️ Requerimientos",
    title: "De requerimiento a código",
    body: chips(["REQUERIMIENTO", "REGLA DE NEGOCIO", "IMPLEMENTACIÓN"]) +
      `<p class="intro-doc">RF-006 — “El sistema debe impedir fabricar sin materiales.”</p>`,
    code:
`// regla de negocio
SI  materiales >= requeridos
    → permitir fabricar
SI NO
    → ❌ impedir la fabricación`,
    marks: [{ token: "materiales >= requeridos", label: "la condición que decide si se permite la acción" }],
    link: "Los RF-001 … RF-007 viven en RequirementService.js y se marcan cumplidos al jugar.",
    markSfx: "ok",
  },
  {
    key: "mvc", tag: "🏗️ MVC",
    title: "Modelo · Controlador · Vista",
    art: `<div class="intro-mvc">
      <div class="mv-m"><b>MODELO</b><span>Order · GameState · Workshop · Furniture</span><i>datos + reglas</i></div>
      <div class="mv-arrow">▼</div>
      <div class="mv-c"><b>CONTROLADOR</b><span>CraftingController · ProgrammingController · TutorialController</span><i>decide qué hacer</i></div>
      <div class="mv-arrow">▼</div>
      <div class="mv-v"><b>VISTA</b><span>Pedidos · Programación · Fabricación · Mejoras · Clientes</span><i>solo muestra</i></div>
    </div>`,
    body: `<p class="intro-link">La Vista muestra. El Controlador decide. El Modelo guarda los datos y las reglas.</p>`,
  },
  {
    key: "mvcflow", tag: "🏗️ MVC en acción",
    title: "Qué pasa al pulsar “Fabricar”",
    art: `<ol class="intro-steps">
      <li><b>Vista</b> · pulsas 🔨 FABRICAR</li>
      <li><b>Controlador</b> · CraftingController.craft("Chair")</li>
      <li><b>Regla</b> · BusinessRules.canCraft(receta, inventario) → ¿hay materiales?</li>
      <li><b>Modelo</b> · Workshop.inventory.consume(receta)</li>
      <li><b>Vista</b> · “Fabricando Silla…”</li>
    </ol>`,
    code:
`craft(type) {
  const r1 = BusinessRules.canCraft(recipe, inventory);
  if (!r1.ok) return this.#deny(r1);
  this.#gs.workshop.inventory.consume(recipe);
}`,
    marks: [{ token: "BusinessRules.canCraft", label: "la REGLA vive en el Modelo, nunca en la pantalla" }],
    link: "Fragmento real de CraftingController.js.",
  },
  {
    key: "end", tag: "Ya puedes empezar",
    title: "Ahora sabes qué representa cada cosa",
    body: cards([
      { h: "🧩 POO", p: "Defines y organizas los objetos: clases, atributos, métodos, encapsulamiento, herencia." },
      { h: "🏗️ MVC + Requerimientos", p: "Defines cómo funciona el negocio y cómo se comunican Vista, Controlador y Modelo." },
    ]) +
      chips(["📋 Aceptar", "💻 Retos", "📦 Materiales", "🔨 Fabricar", "🧾 Entregar", "💰 Cobrar", "🔧 Mejorar"]) +
      `<div class="intro-labels">${["REQUERIMIENTO", "REGLA DE NEGOCIO", "MVC", "CLASE", "OBJETO", "MÉTODO", "ENCAPSULAMIENTO"]
        .map((l) => `<span>${l}</span>`).join("")}</div>
      <p class="intro-sub">Ahora construye tu primera silla.</p>`,
    sfx: "level",
  },
];

export class IntroView {
  #audio; #i = 0; #onDone = null; #typing = null;

  constructor(audio) {
    this.#audio = audio;
    this.root = el("div", { class: "intro-root hidden", attrs: { "aria-hidden": "true" } });
    $("#ui").append(this.root);

    this.root.addEventListener("click", (e) => {
      const act = e.target.closest("[data-act]")?.dataset.act;
      if (act === "next") this.#next();
      else if (act === "prev") this.#prev();
      else if (act === "skip" || act === "done") this.#finish();
    });
    window.addEventListener("keydown", (e) => {
      if (this.root.classList.contains("hidden")) return;
      if (["Enter", " ", "ArrowRight"].includes(e.key)) { e.preventDefault(); this.#next(); }
      else if (e.key === "ArrowLeft") this.#prev();
      else if (e.key === "Escape") this.#finish();
    });
  }

  get isOpen() { return !this.root.classList.contains("hidden"); }

  /** Abre la introducción. `onDone` se llama al terminar u omitir. */
  open(onDone) {
    this.#onDone = typeof onDone === "function" ? onDone : null;
    this.#i = 0;
    this.root.classList.remove("hidden");
    this.root.setAttribute("aria-hidden", "false");
    try { this.#audio?.unlock?.(); } catch { /* noop */ }
    this.#render();
  }

  #finish() {
    clearInterval(this.#typing); this.#typing = null;
    this.root.classList.add("hidden");
    this.root.setAttribute("aria-hidden", "true");
    this.root.innerHTML = "";
    markIntroSeen();
    try { this.#audio?.play?.("level"); } catch { /* noop */ }
    const cb = this.#onDone; this.#onDone = null;
    cb?.();
  }

  #next() {
    if (this.#finishTyping()) return;   // 1.ª pulsación: completa la animación de tecleo
    if (this.#i >= SCENES.length - 1) return this.#finish();
    this.#i++; this.#render();
  }

  #prev() {
    clearInterval(this.#typing); this.#typing = null;
    if (this.#i > 0) { this.#i--; this.#render(); }
  }

  #render() {
    clearInterval(this.#typing); this.#typing = null;
    const s = SCENES[this.#i];
    const last = this.#i === SCENES.length - 1;
    const dots = SCENES.map((_, k) =>
      `<i class="${k === this.#i ? "on" : k < this.#i ? "done" : ""}"></i>`).join("");

    this.root.innerHTML = `
      <div class="intro-card intro-scene-${s.key}">
        <button class="intro-skip" data-act="skip" aria-label="Omitir introducción">⏭ Omitir</button>
        <div class="intro-count">${this.#i + 1} / ${SCENES.length}</div>

        <div class="intro-body">
          ${s.tag ? `<div class="intro-tag">${s.tag}</div>` : ""}
          <h2>${s.title}</h2>
          ${s.sub ? `<p class="intro-sub">${s.sub}</p>` : ""}
          ${s.art ? `<div class="intro-stage">${s.art}</div>` : ""}
          ${s.body ?? ""}
          ${s.code ? `<pre class="intro-code"><code></code><span class="intro-caret">▏</span></pre>` : ""}
          ${s.marks ? `<div class="intro-marks"></div>` : ""}
          ${s.link ? `<p class="intro-link">${s.link}</p>` : ""}
        </div>

        <div class="intro-foot">
          <div class="intro-dots">${dots}</div>
          <div class="intro-nav">
            <button class="intro-btn ghost" data-act="prev" ${this.#i === 0 ? "disabled" : ""} aria-label="Anterior">◀</button>
            ${last
              ? `<button class="intro-btn prim pulse" data-act="done">🚀 Comenzar a jugar</button>`
              : `<button class="intro-btn prim pulse" data-act="next">Continuar ▶</button>`}
          </div>
        </div>
      </div>`;

    try { this.#audio?.play?.(s.sfx ?? "click"); } catch { /* noop */ }
    if (s.code) this.#typeCode(s); else if (s.marks) this.#applyMarks(s);
  }

  /** Efecto de tecleo del código (cancelable con Continuar). */
  #typeCode(s) {
    const codeEl = this.root.querySelector(".intro-code code");
    const pre = this.root.querySelector(".intro-code");
    if (!codeEl) return;
    const full = s.code;
    let n = 0, beat = 0;
    this.#typing = setInterval(() => {
      n += 2;
      codeEl.textContent = full.slice(0, n);
      if ((beat++ % 4) === 0) { try { this.#audio?.play?.("type"); } catch { /* noop */ } }
      if (n >= full.length) {
        clearInterval(this.#typing); this.#typing = null;
        codeEl.textContent = full;
        pre?.classList.add("done");
        this.#applyMarks(s);
      }
    }, 16);
  }

  /** Si hay tecleo en curso, lo completa y devuelve true. */
  #finishTyping() {
    if (!this.#typing) return false;
    clearInterval(this.#typing); this.#typing = null;
    const s = SCENES[this.#i];
    const codeEl = this.root.querySelector(".intro-code code");
    if (codeEl) codeEl.textContent = s.code;
    this.root.querySelector(".intro-code")?.classList.add("done");
    this.#applyMarks(s);
    return true;
  }

  /** Resalta tokens del código y lista su significado. */
  #applyMarks(s) {
    if (!s.marks?.length) return;
    const codeEl = this.root.querySelector(".intro-code code");
    if (codeEl) {
      let html = esc(s.code);
      for (const m of s.marks) {
        const safe = esc(m.token);
        html = html.replace(safe, `<mark>${safe}</mark>`);   // 1.ª aparición
      }
      codeEl.innerHTML = html;
    }
    const box = this.root.querySelector(".intro-marks");
    if (box) {
      box.innerHTML = s.marks.map((m) =>
        `<span><b>${esc(m.token)}</b> — ${esc(m.label)}</span>`).join("");
    }
    try { this.#audio?.play?.(s.markSfx ?? "ok"); } catch { /* noop */ }
  }
}

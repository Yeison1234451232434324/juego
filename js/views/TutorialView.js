import { el, $ } from "./ui/dom.js";

/**
 * TutorialView — pantalla GRANDE de aprendizaje. Explica, antes de jugar:
 *   1. Qué es el juego y su ciclo.
 *   2. Reglas de negocio.
 *   3. Programación Orientada a Objetos (POO).
 *   4. Modelo–Vista–Controlador (MVC).
 *   5. Controles y estaciones del taller.
 *
 * Es solo presentación: no toca el Modelo. Se puede saltar. Si algo falla,
 * el flujo de arranque continúa igual (main.js hace fallback a startGame).
 */
const PAGES = [
  {
    ico: "🛠️",
    title: "Bienvenido a CodeCraft Workshop",
    html: `
      <p>Diriges un pequeño taller de muebles. Para fabricar algo, primero hay que
      <b>enseñarle al taller cómo hacerlo</b>: eso se hace <b>programando</b>.</p>
      <p class="tut-cycle">
        <span>1 · PROGRAMAR</span> ➜ <span>2 · MATERIALES</span> ➜
        <span>3 · FABRICAR</span> ➜ <span>4 · VENDER</span> ➜ <span>5 · MEJORAR</span>
      </p>
      <ul>
        <li>En la <b>computadora 💻</b> escribes clases de JavaScript reales. Si compilan
        y cumplen los requisitos, ganas materiales.</li>
        <li>Con materiales <b>fabricas muebles</b> en el banco y los <b>vendes</b> en el mostrador.</li>
        <li>Con el dinero compras <b>mejoras</b> que cambian de verdad cómo juegas.</li>
      </ul>
      <p class="tut-note">Sigue siempre el marcador <b>💡</b>: te señala la siguiente estación.</p>`,
  },
  {
    ico: "📋",
    title: "1 · Reglas de negocio",
    html: `
      <p>Una <b>regla de negocio</b> es una condición que el negocio <i>obliga</i> a cumplir,
      pase lo que pase. No es un detalle visual: es parte de la lógica.</p>
      <div class="tut-ex">
        <b>Ejemplos en tu taller:</b>
        <ul>
          <li>El <b>precio</b> de un mueble no puede ser <b>0 ni negativo</b>.</li>
          <li>No puedes fabricar si <b>faltan materiales</b>.</li>
          <li>Un trabajador <b>no hace dos piezas a la vez</b>.</li>
          <li>No puedes entregar un pedido que <b>aún no tienes en stock</b>.</li>
        </ul>
      </div>
      <p>En el juego estas reglas se aplican <b>de verdad</b>: si las rompes, la acción se
      bloquea y aparece el motivo. La pantalla nunca "hace la vista gorda".</p>`,
  },
  {
    ico: "🧱",
    title: "2 · Programación Orientada a Objetos (POO)",
    html: `
      <p>La POO organiza el programa en <b>objetos</b>: cosas con <b>datos</b> (propiedades)
      y <b>acciones</b> (métodos). El molde de un objeto es una <b>clase</b>.</p>
      <pre class="tut-code">class Silla {
  constructor() {
    this.nombre = "Silla";   <span class="c">// propiedad</span>
    this.precio = 75;
  }
  fabricar() {               <span class="c">// método</span>
    return "silla lista";
  }
}</pre>
      <p class="tut-note">Las palabras <code>class</code>, <code>constructor</code>, <code>return</code>,
      <code>this</code> y <code>new</code> son de JavaScript. Los demás nombres
      (<code>Silla</code>, <code>nombre</code>, <code>fabricar</code>) los eliges tú, en español.</p>
      <div class="tut-ex">
        <b>Los 5 pilares que practicarás:</b>
        <ul>
          <li><b>Encapsulamiento:</b> proteger un dato y validarlo antes de cambiarlo (el precio).</li>
          <li><b>Herencia:</b> <code>Silla extends Mueble</code> reutiliza lo común.</li>
          <li><b>Polimorfismo:</b> el mismo método, <code>calcularTiempo()</code>, responde distinto en cada mueble.</li>
          <li><b>Abstracción:</b> <code>Mueble</code> define la idea general; no se fabrica sola.</li>
          <li><b>Composición:</b> un <code>Taller</code> <i>tiene</i> un inventario, trabajadores y pedidos.</li>
        </ul>
      </div>`,
  },
  {
    ico: "🏛️",
    title: "3 · Modelo – Vista – Controlador (MVC)",
    html: `
      <p>MVC separa el programa en <b>tres responsabilidades</b>:</p>
      <div class="tut-mvc">
        <div><b>Modelo</b><span>Datos + reglas de negocio. Sabe qué es válido.</span></div>
        <div><b>Vista</b><span>Muestra e informa. Capta clics. No decide reglas.</span></div>
        <div><b>Controlador</b><span>Recibe la acción de la Vista, aplica reglas con el Modelo y responde.</span></div>
      </div>
      <p class="tut-flow">Clic en la Vista ➜ Controlador ➜ Modelo (valida) ➜ Controlador ➜ la Vista muestra el resultado</p>
      <p class="tut-note">Regla de oro: <b>la Vista nunca valida</b>. Si escribes un precio inválido,
      la Vista solo <i>muestra</i> el error que el Modelo detectó. En la <b>Mesa de Arquitectura 🏛️</b>
      decidirás en qué capa va cada cosa.</p>`,
  },
  {
    ico: "🎮",
    title: "4 · Cómo se juega",
    html: `
      <div class="tut-keys">
        <div><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> o <kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd><span>caminar</span></div>
        <div><kbd>E</kbd> / <kbd>Espacio</kbd><span>interactuar / hablar / continuar diálogo</span></div>
        <div><kbd>Tab</kbd><span>abrir la mochila (inventario)</span></div>
        <div><kbd>Esc</kbd><span>cerrar cualquier ventana</span></div>
        <div>📱<span>en móvil: cruceta y botón <b>A</b> en pantalla</span></div>
      </div>
      <div class="tut-ex">
        <b>Estaciones del taller:</b>
        <ul>
          <li>💻 <b>Programar</b> · 🏛️ <b>Arquitectura</b> · 📋 <b>Pedidos</b></li>
          <li>🪚 <b>Fabricar</b> · ⚙️ <b>Máquina</b> (cortar material) · 🧾 <b>Vender</b></li>
          <li>🏪 <b>Mejoras</b> · 📦 <b>Inventario</b></li>
        </ul>
      </div>
      <p class="tut-note">El marcador <b>💡</b> siempre te lleva al siguiente paso. ¡Empieza con el pedido de la silla!</p>`,
  },
];

export class TutorialView {
  #i = 0; #startMode = false; #keyHandler = null;

  constructor(bus) {
    this.bus = bus;
    this.root = el("div", { class: "tutorial-root hidden", attrs: { id: "tutorial" } });
    $("#ui").append(this.root);
    this.root.addEventListener("click", (e) => {
      const act = e.target.closest("[data-act]")?.dataset.act;
      if (act === "next") this.#go(1);
      else if (act === "prev") this.#go(-1);
      else if (act === "skip" || act === "start") this.#finish();
      else if (act === "dot") this.#jump(+e.target.dataset.n);
    });
  }

  /** @param {boolean} startMode  true = viene de "Nueva partida" (botón "¡Empezar!"). */
  open(startMode = false) {
    this.#startMode = startMode;
    this.#i = 0;
    this.root.classList.remove("hidden");
    this.#render();
    this.#keyHandler = (e) => {
      if (e.key === "ArrowRight" || e.key === "Enter" || e.key === "e" || e.key === "E") { e.preventDefault(); this.#go(1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); this.#go(-1); }
      else if (e.key === "Escape") { e.preventDefault(); this.#finish(); }
    };
    window.addEventListener("keydown", this.#keyHandler, true);
  }

  #go(d) {
    const n = this.#i + d;
    if (n < 0) return;
    if (n >= PAGES.length) { this.#finish(); return; }
    this.#i = n; this.#render();
  }
  #jump(n) { if (n >= 0 && n < PAGES.length) { this.#i = n; this.#render(); } }

  #render() {
    const p = PAGES[this.#i];
    const first = this.#i === 0;
    const last = this.#i === PAGES.length - 1;
    const dots = PAGES.map((_, n) =>
      `<button class="tut-dot ${n === this.#i ? "on" : ""}" data-act="dot" data-n="${n}" aria-label="Página ${n + 1}"></button>`).join("");
    const nextLabel = last
      ? (this.#startMode ? "¡Empezar a jugar! ▶" : "Cerrar ✓")
      : "Siguiente ▶";
    this.root.innerHTML = `
      <div class="tut-card">
        <header class="tut-head">
          <span class="tut-ico">${p.ico}</span>
          <h2>${p.title}</h2>
          <span class="tut-count">${this.#i + 1} / ${PAGES.length}</span>
        </header>
        <div class="tut-body">${p.html}</div>
        <footer class="tut-foot">
          <button class="tut-btn ghost" data-act="skip">${this.#startMode ? "Saltar tutorial" : "Cerrar"}</button>
          <div class="tut-dots">${dots}</div>
          <div class="tut-nav">
            <button class="tut-btn" data-act="prev" ${first ? "disabled" : ""}>◀ Atrás</button>
            <button class="tut-btn prim" data-act="${last ? "start" : "next"}">${nextLabel}</button>
          </div>
        </footer>
      </div>`;
  }

  #finish() {
    if (this.#keyHandler) { window.removeEventListener("keydown", this.#keyHandler, true); this.#keyHandler = null; }
    this.root.classList.add("hidden");
    this.root.innerHTML = "";
    if (this.#startMode) {
      this.#startMode = false;
      this.bus.emit("tutorial:done");
    }
  }
}

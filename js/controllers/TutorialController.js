/**
 * TutorialController — GUÍA de la primera partida.
 *
 * Máquina de estados. Va marcando el objetivo, resaltando suavemente el puesto
 * y poniendo frases de BYTE + del NPC de cada estación, en este orden:
 *
 *   0  aceptar el primer trabajo         (Ana, revisando papeles)
 *   1  conseguir materiales programando  (BYTE, tecleando)
 *   2  fabricar la silla                 (Mario, martillando)
 *   3  entregar la silla                 (Cliente, esperando)
 *   4  comprar la primera mejora         (Carlos, reparando)
 *   5  ¡completado! → juego libre
 *
 * Solo actúa mientras gs.tutorialCompleted === false.
 */
export class TutorialController {
  #gs; #bus; #greeted = new Set();

  constructor(gs, bus) {
    this.#gs = gs; this.#bus = bus;
    if (this.#gs.tutorialCompleted) return;

    bus.on("order:accepted", () => this.#onAccepted());
    bus.on("challenge:solved", () => this.#onMaterials());
    bus.on("craft:done", () => this.#onCrafted());
    bus.on("order:delivered", () => this.#onDelivered());
    bus.on("upgrade:bought", () => this.#onUpgrade());
    bus.on("station:open", (id) => this.#onStationOpen(id));
    bus.on("tutorial:begin", () => this.begin());
  }

  get #done() { return this.#gs.tutorialCompleted; }
  #step() { return this.#gs.tutorialStep; }
  #setStep(n) { this.#gs.tutorialStep = n; this.#bus.emit("state:changed"); }

  #say(name, lines, delay = 350) {
    setTimeout(() => this.#bus.emit("dialogue:open", { name, lines }), delay);
  }

  begin() {
    if (this.#done) return;
    const s = this.#step();
    if (s === 0) {
      this.#say("BYTE", [
        "¡Bienvenido al taller! Soy BYTE, tu asistente.",
        "Antes de fabricar nada hay que ACEPTAR un pedido.",
        "Busca a Ana, que está revisando papeles junto al tablón. Acércate y pulsa E.",
      ]);
      this.#gs.setObjective("Acércate a Ana (la del tablón de papeles) y acepta el trabajo.", "orders", "orders");
    } else if (s === 1) {
      this.#materialsObjective();
    } else if (s === 2) {
      this.#gs.setObjective("Ya tienes los materiales. Ve con Mario, en el banco de trabajo.", "bench", "bench");
    } else if (s === 3) {
      this.#gs.setObjective("Lleva la silla al cliente que está esperando en el mostrador.", "sales", "sales");
    } else if (s === 4) {
      this.#gs.setObjective("Compra tu primera mejora con Carlos, en MEJORAS 🔧.", "shop", "shop");
    }
  }

  #materialsObjective() {
    const o = this.#gs.focusOrder;
    const need = o ? o.materials : { wood: 4, nails: 2 };
    const inv = this.#gs.workshop.inventory;
    const txt = Object.entries(need)
      .map(([m, q]) => `${m === "wood" ? "🪵" : "🔩"} ${inv.count(m)}/${q}`).join("  ");
    this.#gs.setObjective(`Resuelve retos con BYTE, en la computadora.  ${txt}`, "coding", "coding");
  }

  #hasAllMaterials(o) {
    const inv = this.#gs.workshop.inventory;
    return o && Object.entries(o.materials).every(([m, q]) => inv.count(m) >= q);
  }

  // ---------- reacciones ----------
  #onAccepted() {
    if (this.#done || this.#step() !== 0) return;
    this.#setStep(1);
    this.#say("BYTE", [
      "¡Perfecto! Ya sabemos qué fabricar: una silla.",
      "Necesita MADERA 🪵 y CLAVOS 🔩. Se consiguen resolviendo retos de programación.",
      "Ve a la computadora: verás a BYTE (a mí) tecleando. Acércate y pulsa E.",
    ]);
    this.#materialsObjective();
  }

  #onMaterials() {
    if (this.#done || this.#step() !== 1) return;
    const o = this.#gs.focusOrder;
    if (this.#hasAllMaterials(o)) {
      this.#setStep(2);
      this.#say("BYTE", [
        "¡Ya tienes TODOS los materiales!",
        "Llévaselos a Mario, el carpintero del banco (el que está martillando).",
        "Acércate a su banco y pulsa E para que fabrique la silla.",
      ]);
      this.#gs.setObjective("Ve con Mario, en el banco de trabajo, y fabrica la silla.", "bench", "bench");
    } else {
      this.#materialsObjective();
    }
  }

  #onCrafted() {
    if (this.#done || this.#step() !== 2) return;
    this.#setStep(3);
    this.#say("Mario", [
      "¡Listo! Aquí tienes tu silla, recién fabricada.",
      "El cliente lleva un rato esperándola en el mostrador. Llévasela.",
    ]);
    this.#gs.setObjective("Lleva la silla al cliente que espera en el mostrador.", "sales", "sales");
  }

  #onDelivered() {
    if (this.#done || this.#step() !== 3) return;
    this.#setStep(4);
    this.#gs.player.learn("MVC");
    this.#say("BYTE", [
      "🎉 ¡Tu primer trabajo completado! Ya tienes dinero.",
      "Antes de soltarte: gástalo en tu PRIMERA MEJORA.",
      "Ve a MEJORAS y habla con Carlos (el que repara herramientas). Pulsa E y compra una.",
    ]);
    this.#gs.setObjective("Compra tu primera mejora con Carlos, en MEJORAS 🔧.", "shop", "shop");
    this.#bus.emit("state:changed");
  }

  #onUpgrade() {
    if (this.#done || this.#step() !== 4) return;
    this.#setStep(5);
    this.#gs.tutorialCompleted = true;
    this.#gs.refillOrders();
    this.#say("Carlos", [
      "¡Buena elección! Esa mejora te durará para siempre.",
      "Y ojo: comprar mejoras NO te resuelve los retos. El código siempre lo escribes tú.",
    ]);
    setTimeout(() => this.#say("BYTE", [
      "El ciclo es siempre igual: aceptar → programar para conseguir materiales → fabricar → entregar → cobrar.",
      "Aplicaste POO (definiste CLASES, protegiste un dato) y viviste el flujo Vista→Controlador→Modelo (MVC).",
      "Ahora tú mandas: acepta hasta 3 trabajos y decide el orden. ¡A trabajar!",
    ], 200), 2500);
    this.#bus.emit("tutorial:complete");
    this.#bus.emit("state:changed");
  }

  /** Al abrir la estación correcta por primera vez, su NPC saluda una vez. */
  #onStationOpen(id) {
    if (this.#done) return;
    const s = this.#step();

    const GREET = {
      orders: ["Ana", ["Aquí llegan los pedidos de los clientes.", "Elige el de la silla y pulsa ACEPTAR."]],
      coding: ["BYTE", ["Resuelve estos retos y conseguirás madera y clavos para tu pedido."]],
      bench:  ["Mario", ["Trae los materiales al banco y yo te fabrico la pieza."]],
      sales:  ["Cliente", ["¡Por fin! Dame mi silla, por favor."]],
      shop:   ["Carlos", ["Con tu dinero mejoro tu taller: más velocidad, más materiales…", "Ninguna mejora te resuelve los retos: eso es cosa tuya."]],
    };
    const rightStation = { 0: "orders", 1: "coding", 2: "bench", 3: "sales", 4: "shop" }[s];

    if (id === rightStation && !this.#greeted.has(id) && GREET[id]) {
      this.#greeted.add(id);
      this.#say(GREET[id][0], GREET[id][1], 120);
      return;
    }

    // Empujoncitos si va al puesto equivocado (guía, no obliga).
    if (s === 0 && id !== "orders") this.#say("BYTE", ["Primero hay que aceptar el pedido con Ana, en el tablón."]);
    else if (s === 1 && id === "bench") this.#say("BYTE", ["Todavía no tienes materiales. Consíguelos con los retos de la computadora."]);
    else if (s === 2 && id === "coding") this.#say("BYTE", ["¡Ya tienes los materiales! Llévaselos a Mario, en el banco."]);
    else if (s === 3 && id !== "sales") this.#say("BYTE", ["La silla ya está lista. Llévala al cliente del mostrador."]);
    else if (s === 4 && id !== "shop") this.#say("BYTE", ["Ve a MEJORAS y compra tu primera mejora con Carlos."]);
  }
}

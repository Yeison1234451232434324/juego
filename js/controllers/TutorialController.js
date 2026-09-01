/**
 * TutorialController — GUÍA de la primera partida.
 *
 * Es una pequeña máquina de estados. Escucha hechos del juego y va marcando el
 * objetivo + la flecha 👉 + las frases de BYTE, EXACTAMENTE en este orden:
 *
 *   0  aceptar el primer trabajo
 *   1  conseguir los materiales resolviendo retos
 *   2  fabricar la silla en el banco
 *   3  entregar la silla al cliente
 *   4  ¡tutorial completado! → juego libre
 *
 * Solo actúa mientras gs.tutorialCompleted === false. Después NO vuelve a
 * obligar a nada: el jugador gestiona sus trabajos libremente.
 */
export class TutorialController {
  #gs; #bus;

  constructor(gs, bus) {
    this.#gs = gs; this.#bus = bus;
    if (this.#gs.tutorialCompleted) return;

    bus.on("order:accepted", () => this.#onAccepted());
    bus.on("challenge:solved", () => this.#onMaterials());
    bus.on("craft:done", () => this.#onCrafted());
    bus.on("order:delivered", () => this.#onDelivered());
    bus.on("station:open", (id) => this.#onStationOpen(id));
    bus.on("tutorial:begin", () => this.begin());
  }

  get #done() { return this.#gs.tutorialCompleted; }
  #step() { return this.#gs.tutorialStep; }
  #setStep(n) { this.#gs.tutorialStep = n; this.#bus.emit("state:changed"); }

  #say(lines) {
    setTimeout(() => this.#bus.emit("dialogue:open", { name: "BYTE", lines }), 350);
  }

  /** Arranca (o reanuda) el tutorial al entrar al taller. */
  begin() {
    if (this.#done) return;
    const s = this.#step();
    if (s === 0) {
      this.#say([
        "¡Bienvenido al taller! Soy BYTE, tu asistente.",
        "Tenemos nuestro PRIMER TRABAJO esperando.",
        "Antes de fabricar nada, hay que ACEPTAR el pedido.",
        "Camina hasta el Tablón de Pedidos 📋 (arriba, a la izquierda) y pulsa E.",
      ]);
      this.#gs.setObjective("Ve al Tablón de Pedidos 📋 y acepta el trabajo de la silla.", "orders", "orders");
    } else if (s === 1) {
      this.#materialsObjective();
    } else if (s === 2) {
      this.#gs.setObjective("Ya tienes los materiales. Fabrica la Silla en el Banco 🔨.", "bench", "bench");
    } else if (s === 3) {
      this.#gs.setObjective("Lleva la Silla al Cliente 🧾 y entrégala.", "sales", "sales");
    }
  }

  #materialsObjective() {
    const o = this.#gs.focusOrder;
    const need = o ? o.materials : { wood: 4, nails: 2 };
    const inv = this.#gs.workshop.inventory;
    const txt = Object.entries(need)
      .map(([m, q]) => `${m === "wood" ? "🪵" : "🔩"} ${inv.count(m)}/${q}`).join("  ");
    this.#gs.setObjective(`Consigue materiales en la computadora 💻.  ${txt}`, "coding", "coding");
  }

  #hasAllMaterials(o) {
    const inv = this.#gs.workshop.inventory;
    return o && Object.entries(o.materials).every(([m, q]) => inv.count(m) >= q);
  }

  // ---------- reacciones ----------
  #onAccepted() {
    if (this.#done || this.#step() !== 0) return;
    this.#setStep(1);
    this.#say([
      "¡Perfecto! Ahora sabemos QUÉ fabricar: una Silla.",
      "Necesitamos MATERIALES: madera 🪵 y clavos 🔩.",
      "Para conseguirlos hay que resolver RETOS DE PROGRAMACIÓN.",
      "Camina hasta la computadora 💻 (sobre el escritorio) y pulsa E.",
    ]);
    this.#materialsObjective();
  }

  #onMaterials() {
    if (this.#done || this.#step() !== 1) return;
    const o = this.#gs.focusOrder;
    if (this.#hasAllMaterials(o)) {
      this.#setStep(2);
      this.#say([
        "¡Ya tienes TODOS los materiales para la silla!",
        "Ahora ve al Banco de trabajo 🔨 y pulsa E para fabricarla.",
        "Mario, el carpintero, la construirá en unos segundos.",
      ]);
      this.#gs.setObjective("Fabrica la Silla en el Banco de trabajo 🔨.", "bench", "bench");
    } else {
      this.#materialsObjective();   // actualiza el contador 🪵 x/y
    }
  }

  #onCrafted() {
    if (this.#done || this.#step() !== 2) return;
    this.#setStep(3);
    this.#say([
      "¡Excelente! La silla está TERMINADA.",
      "Ahora entrégasela al cliente. Ve al Mostrador 🧾 (abajo a la derecha) y pulsa E.",
    ]);
    this.#gs.setObjective("Entrega la Silla al Cliente en el Mostrador 🧾.", "sales", "sales");
  }

  #onDelivered() {
    if (this.#done || this.#step() < 3) return;
    this.#gs.tutorialCompleted = true;
    this.#setStep(4);
    this.#gs.player.learn("MVC");
    this.#gs.refillOrders();     // ahora habrá hasta 3 pedidos disponibles
    this.#say([
      "🎉 ¡LO HICISTE! Completaste tu primer trabajo.",
      "Aprendiste el ciclo: aceptar pedido → conseguir materiales programando → fabricar → entregar → cobrar.",
      "Y de paso aplicaste POO: definiste CLASES y protegiste datos (encapsulamiento).",
      "Ahora puedes aceptar hasta 3 trabajos y decidir tú el orden. ¡A trabajar!",
    ]);
    this.#bus.emit("tutorial:complete");
    this.#bus.emit("state:changed");
  }

  #onStationOpen(id) {
    if (this.#done) return;
    const s = this.#step();
    // Empujoncitos si el jugador va a la estación equivocada.
    if (s === 0 && id !== "orders") {
      this.#say(["Primero hay que ACEPTAR el pedido.", "Ve al Tablón de Pedidos 📋 y pulsa E."]);
    } else if (s === 1 && id === "bench") {
      this.#say(["Todavía no tienes materiales.", "Resuelve retos en la computadora 💻 para conseguir madera y clavos."]);
    } else if (s === 2 && id === "coding") {
      this.#say(["¡Ya tienes los materiales!", "Ve al Banco de trabajo 🔨 para fabricar la silla."]);
    } else if (s === 3 && id !== "sales") {
      this.#say(["La silla está lista.", "Llévala al Mostrador 🧾 y entrégala al cliente."]);
    }
  }
}

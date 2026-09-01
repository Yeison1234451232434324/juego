/* global Phaser */
import { CONFIG } from "../config/gameConfig.js";
import { CHAR_SCALE } from "./art.js";

const W = CONFIG.WORLD.width, H = CONFIG.WORLD.height;
// Margen a cada lado: el lienzo (VIEW) es más ancho que el taller (WORLD).
const MX = Math.max(0, Math.round((CONFIG.VIEW.width - W) / 2));

/**
 * Un solo taller compacto. Cámara fija: todo se ve a la vez.
 *
 * NADA de etiquetas de estación. Cada puesto tiene su MUEBLE + un NPC HACIENDO
 * la actividad (revisar papeles, teclear, martillar, cargar, esperar, reparar):
 * el mundo explica el juego. El único texto es el aviso contextual "[E] ..."
 * que aparece SOLO al acercarse.
 *
 * `solid` = caja de colisión del mueble (ajustada, no una pared invisible).
 */
const STATIONS = [
  { id: "orders", label: "[E] Revisar pedidos",   x: 190, y: 116, icon: "📋", kind: "board",    npc: "ana",    solid: { w: 60, h: 14, dy: 12 } },
  { id: "coding", label: "[E] Programar",          x: 470, y: 118, icon: "💻", kind: "pc",       npc: "byte",   solid: { w: 60, h: 14, dy: 14 } },
  { id: "shelf",  label: "[E] Revisar materiales", x: 806, y: 128, icon: "📦", kind: "shelf",    npc: "beto",   solid: { w: 74, h: 30, dy: 12 } },
  { id: "bench",  label: "[E] Fabricar",           x: 300, y: 430, icon: "🔨", kind: "bench",    npc: "mario",  solid: { w: 80, h: 16, dy: 4 } },
  { id: "shop",   label: "[E] Mejorar taller",     x: 130, y: 476, icon: "🏪", kind: "shop",     npc: "carlos", solid: { w: 66, h: 14, dy: 10 } },
  { id: "sales",  label: "[E] Entregar pedido",    x: 792, y: 486, icon: "🧾", kind: "register", npc: "client", solid: { w: 44, h: 14, dy: 6 } },
];

// Frases cortas que dice el NPC de cada estación (solo en el tutorial).
const NPC_HINT = {
  ana:    "Aquí llegan los pedidos de los clientes.",
  byte:   "Resuelve estos retos y conseguirás madera y clavos.",
  beto:   "Aquí guardo todos los materiales del taller.",
  mario:  "Trae los materiales y yo te fabrico la pieza.",
  carlos: "Con dinero puedo mejorar tus herramientas y tu banco.",
  client: "¡Estaba esperando mi pedido! Muchas gracias.",
};

export class WorkshopScene extends Phaser.Scene {
  constructor() { super("Workshop"); }

  create() {
    this.bus = this.registry.get("bus");
    this.gs = this.registry.get("gs");
    this.entrada = this.registry.get("entrada");
    this.tick = this.registry.get("tick");
    this.facing = "d"; this.animT = 0; this.target = null; this.tKey = "";

    // La cámara ve todo el lienzo (VIEW) y centra el taller (WORLD) dentro.
    this.cameras.main.setBounds(-MX, 0, W + MX * 2, H).setBackgroundColor("#20140a");
    // El ÚNICO límite del jugador: los bordes del taller. Nada de paredes sueltas.
    this.physics.world.setBounds(30, 66, W - 60, H - 100);
    this.solids = this.physics.add.staticGroup();

    this.#floor();
    this.#wallsAndWindows();
    this.#wallDecor();
    this.#decor();
    this.#stations();
    this.#npcs();
    this.#player();
    this.#lighting();
    this.#dust();
    this.#objectiveMarker();

    // IMPORTANTE: enableCapture = false → las teclas SÍ llegan al editor de código.
    // El teclado de Phaser queda SIEMPRE activo (nunca lo desactivamos por frame:
    // eso provocaba teclas "perdidas" en las transiciones). El movimiento y las
    // interacciones se filtran con this.paused en su lugar.
    this.k = this.input.keyboard.addKeys("W,A,S,D,UP,DOWN,LEFT,RIGHT,E,SPACE,TAB,ESC", true, false);
    this.input.keyboard.clearCaptures();
    this.input.keyboard.on("keydown-E", () => { if (!this.paused) this.#interact(); });
    this.input.keyboard.on("keydown-SPACE", () => { if (!this.paused) this.#interact(); });
    this.input.keyboard.on("keydown-TAB", (e) => {
      e?.preventDefault?.();
      if (!this.paused) this.bus.emit("open:inventory");
    });

    // Al perder el foco (cambiar de pestaña, abrir un modal HTML, alt-tab) las
    // teclas se quedaban "pegadas". Las soltamos siempre que eso ocurra.
    this._release = () => { this.input.keyboard.resetKeys(); this.entrada.x = 0; this.entrada.y = 0; };
    window.addEventListener("blur", this._release);
    this.input.on("gameout", this._release);
    this.events.once("shutdown", () => {
      window.removeEventListener("blur", this._release);
      this.input.off("gameout", this._release);
    });
    this._wasPaused = false;

    const bench = STATIONS.find((s) => s.id === "bench");
    this.bus.on("craft:progress", (p) => this.#bar("bench", p.ratio));
    this.bus.on("craft:done", () => { this.#bar("bench", 0, true); this.#burst(bench.x, bench.y - 10); });
    this.bus.on("objective:changed", (o) => this.#setHint(o?.hintStation ?? this.gs.hintStation));

    const p = this.gs.player;
    if (p.x && p.y) this.pj.setPosition(p.x, p.y);
    this.#setHint(this.gs.hintStation);

    this.game.events.emit("workshop:ready", this);
  }

  activateFromButton() { this.#interact(); }

  // ---------- suelo ----------
  // Se "hornean" los ~570 azulejos en UNA sola textura: 1 draw call por frame
  // en vez de 570. Es la mayor optimización para móviles.
  #floor() {
    const x0 = -Math.ceil(MX / 32) * 32;            // alinear a la rejilla
    const x1 = W + Math.ceil(MX / 32) * 32;
    const rt = this.add.renderTexture(x0, 0, x1 - x0, H).setOrigin(0).setDepth(-20);
    for (let y = 0; y < H; y += 32)
      for (let x = x0; x < x1; x += 32) {
        const t = (Math.abs((x * 7 + y * 13) % 97) % 10 < 2) ? 2 : (((x / 32) + (y / 32)) % 2 ? 1 : 0);
        rt.draw("floor" + t, x - x0, y);
      }
    const rug = this.textures.get("rug").getSourceImage();
    rt.draw("rug", W / 2 - rug.width / 2 - x0, 330 - rug.height / 2);
  }

  #wallsAndWindows() {
    // La pared superior es solo DECORACIÓN: el límite lo pone physics.world.
    const wx0 = -Math.ceil(MX / 32) * 32, wx1 = W + Math.ceil(MX / 32) * 32;
    const wallRT = this.add.renderTexture(wx0, 0, wx1 - wx0, 48).setOrigin(0).setDepth(6);
    for (let i = wx0; i < wx1; i += 32) wallRT.draw("wall", i - wx0, 0);
    this.#floorTrim(0, H - 26, W);
    // ventanas en la pared superior
    [[220, 0], [640, 0]].forEach(([wx]) => {
      this.add.rectangle(wx + 70, 24, 108, 34, 0x0d1a26).setDepth(7);
      this.add.rectangle(wx + 70, 24, 100, 26, 0xbfe3ff).setDepth(8);
      this.add.rectangle(wx + 70, 24, 4, 26, 0x0d1a26).setDepth(9);
      this.add.rectangle(wx + 70, 24, 100, 3, 0x0d1a26).setDepth(9);
    });
  }

  #floorTrim(x, y, w) {
    const g = this.add.graphics().setDepth(-5);
    g.fillStyle(0x2a1a0e, 1); g.fillRect(x, y, w, 4);
  }

  #wallDecor() {
    const g = this.add.graphics().setDepth(7);
    // panel de corcho con notas ENCIMA del tablón de pedidos (izquierda)
    g.fillStyle(0x8a6a3a, 1); g.fillRoundedRect(120, 6, 120, 34, 3);
    [[130, 12], [158, 10], [186, 14], [210, 9]].forEach(([nx, ny]) => {
      g.fillStyle(0xfdf6e3, 1); g.fillRect(nx, ny, 18, 14);
      g.fillStyle(0xc0392b, 1); g.fillCircle(nx + 9, ny, 1.6);
    });
    // reloj de pared (centro)
    g.fillStyle(0x1c1c1c, 1); g.fillCircle(600, 24, 13); g.fillStyle(0xf3e6cc, 1); g.fillCircle(600, 24, 10);
    g.lineStyle(2, 0x1c1c1c, 1); g.lineBetween(600, 24, 600, 17); g.lineBetween(600, 24, 606, 24);
    // pegboard con herramientas ENCIMA del banco (Mario, x300)
    g.fillStyle(0x6b4a2a, 1); g.fillRoundedRect(230, 8, 150, 32, 3);
    g.fillStyle(0xc9c9d2, 1); g.fillTriangle(255, 34, 245, 14, 265, 14);       // sierra
    g.fillStyle(0x8a5a30, 1); g.fillRect(300, 12, 5, 22); g.fillStyle(0x9aa3af, 1); g.fillRect(294, 10, 17, 7); // martillo
    g.lineStyle(4, 0xc9c9d2, 1); g.beginPath(); g.arc(345, 22, 11, 0, Math.PI); g.strokePath(); // llave
    // vigas del techo
    g.fillStyle(0x3a2412, 1);
    [140, 470, 800].forEach((x) => g.fillRect(x, 48, 24, 14));
  }

  #shelfDraw(x, y) {
    const g = this.add.graphics().setDepth(2);
    g.fillStyle(0x000000, 0.22); g.fillEllipse(x, y + 34, 74, 12);
    g.fillStyle(0x5a3a1e, 1); g.fillRect(x - 40, y - 46, 80, 78);
    g.fillStyle(0x6b4423, 1); g.fillRect(x - 36, y - 42, 72, 70);
    g.fillStyle(0x3a2412, 1); g.fillRect(x - 36, y - 16, 72, 5); g.fillRect(x - 36, y + 10, 72, 5);
    // objetos
    g.fillStyle(0x9ecae1, 0.85); g.fillRect(x - 30, y - 36, 12, 16);
    g.fillStyle(0xc8a46c, 1); g.fillRect(x - 14, y - 32, 12, 12);
    g.fillStyle(0xe0a92b, 0.85); g.fillRect(x + 2, y - 34, 12, 14);
    g.fillStyle(0x8a5a30, 1); g.fillRect(x + 18, y - 34, 12, 14);
    g.fillStyle(0xa5763f, 1); for (let i = 0; i < 3; i++) g.fillRect(x - 30 + i * 4, y - 8, 3, 12);
    g.fillStyle(0xb23c2e, 1); g.fillRect(x + 6, y - 10, 20, 12);
  }

  #stationDraw(kind, x, y) {
    const g = this.add.graphics().setDepth(2);
    g.fillStyle(0x000000, 0.24); g.fillEllipse(x, y + 20, 62, 15);
    if (kind === "shelf") { this.#shelfDraw(x, y); return; }
    // base madera
    g.fillStyle(0x5a3a1e, 1); g.fillRoundedRect(x - 32, y - 8, 64, 30, 4);
    g.fillStyle(0x7a4a24, 1); g.fillRoundedRect(x - 28, y - 6, 56, 24, 3);
    g.fillStyle(0x000000, 0.1); g.fillRect(x - 28, y + 8, 56, 3);
    if (kind === "pc") {
      g.fillStyle(0x101418, 1); g.fillRoundedRect(x - 24, y - 40, 48, 34, 3);
      g.fillStyle(0x0e3a2e, 1); g.fillRect(x - 20, y - 36, 40, 26);
      g.fillStyle(0x7dffb0, 1);
      for (let i = 0; i < 4; i++) g.fillRect(x - 17, y - 33 + i * 5, (16 - i * 3), 2);
      g.fillStyle(0x333, 1); g.fillRect(x - 6, y - 6, 12, 6);
      g.fillStyle(0x1c1c1c, 1); g.fillRect(x - 16, y + 2, 32, 4);            // teclado
    } else if (kind === "mvc") {
      ["#3b6ea5", "#e0a92b", "#4c8b3f"].forEach((c, i) => {
        g.fillStyle(Phaser.Display.Color.HexStringToColor(c).color, 1);
        g.fillRoundedRect(x - 26 + i * 18, y - 40, 15, 30, 2);
      });
      g.fillStyle(0xf3e6cc, 1); g.fillRect(x - 24, y - 4, 48, 10);
    } else if (kind === "board") {
      g.fillStyle(0xb9884e, 1); g.fillRoundedRect(x - 34, y - 46, 68, 54, 4);
      g.lineStyle(5, 0x5a3a1e, 1); g.strokeRoundedRect(x - 34, y - 46, 68, 54, 4);
      [[-18, -34, -6], [12, -30, 5], [-4, -8, -2]].forEach(([dx, dy, rot]) => {
        g.fillStyle(0xfdf6e3, 1); g.fillRect(x + dx, y + dy, 22, 18);
        g.fillStyle(0xc0392b, 1); g.fillCircle(x + dx + 11, y + dy, 2);
      });
    } else if (kind === "bench") {
      g.fillStyle(0x8a5a30, 1); g.fillRoundedRect(x - 40, y - 16, 80, 14, 2);
      g.fillStyle(0x6b7280, 1); g.fillRect(x - 44, y - 14, 8, 9);           // tornillo
      g.fillStyle(0xa5763f, 1); g.fillRect(x + 8, y - 30, 16, 14);          // pieza en curso
      g.fillStyle(0xe8dcc0, 0.7); g.fillCircle(x - 20, y - 2, 2); g.fillCircle(x + 24, y, 2);
    } else if (kind === "saw") {
      g.fillStyle(0x6b7280, 1); g.fillRoundedRect(x - 34, y - 18, 68, 18, 2);
      g.fillStyle(0x9aa3af, 1); g.fillRect(x - 30, y - 22, 60, 6);
      g.fillStyle(0xcbd5e1, 1); g.slice(x, y - 22, 13, Phaser.Math.DegToRad(200), Phaser.Math.DegToRad(340)); g.fillPath();
      g.fillStyle(0x374151, 1); g.fillRoundedRect(x + 22, y - 12, 16, 14, 2);
      g.fillStyle(0xa5763f, 1); g.fillRect(x - 30, y - 8, 30, 5);
    } else if (kind === "shop") {
      g.fillStyle(0x7a3b2e, 1); g.fillRoundedRect(x - 36, y - 44, 72, 34, 4);
      g.fillStyle(0xf3e6cc, 1); g.fillRect(x - 30, y - 38, 60, 4);
      g.fillStyle(0x2a1a0e, 1); g.fillRect(x - 20, y - 30, 40, 3); g.fillRect(x - 20, y - 24, 30, 3);
      g.fillStyle(0xe0a92b, 1); g.fillCircle(x - 18, y + 2, 3); g.fillCircle(x, y + 4, 3); g.fillCircle(x + 16, y + 2, 3);
    } else if (kind === "register") {
      g.fillStyle(0x374151, 1); g.fillRoundedRect(x - 18, y - 30, 36, 24, 3);
      g.fillStyle(0x1c1c1c, 1); g.fillRect(x - 14, y - 26, 28, 10);
      g.fillStyle(0xe0a92b, 1); g.fillCircle(x, y - 8, 3);
      g.fillStyle(0xfdf6e3, 1); g.fillRect(x - 26, y - 2, 14, 10);          // recibos
    }
  }

  #stations() {
    this.bars = {};
    for (const s of STATIONS) {
      this.#stationDraw(s.kind, s.x, s.y);
      if (s.solid) {
        const r = this.add.rectangle(s.x, s.y + s.solid.dy, s.solid.w, s.solid.h, 0, 0);
        this.physics.add.existing(r, true); this.solids.add(r);
      }
      // SIN etiquetas de texto. El NPC + el mueble explican qué es el puesto.
    }
  }

  /** Un NPC en cada estación, HACIENDO su actividad (animación de 2 fotogramas). */
  #npcs() {
    this.npc = {};
    const DY = { board: 26, pc: 24, shelf: 28, bench: -34, shop: -30, register: -30 };
    for (const s of STATIONS) {
      const id = s.npc;
      const ny = s.y + (DY[s.kind] ?? 22);
      const sp = this.add.sprite(s.x, ny, `${id}_work_0`).setScale(CHAR_SCALE);
      sp._t = Math.random() * 900;
      sp.setDepth(8 + ny * 0.02);
      this.npc[id] = sp;
      this.npc[id]._home = ny;
      // respiración sutil para que nunca se vea 100% estático
      this.tweens.add({ targets: sp, y: ny - 1.4, duration: 1500 + Math.random() * 700,
        yoyo: true, repeat: -1, ease: "Sine.inOut" });
    }
  }

  #player() {
    this.pj = this.physics.add.sprite(480, 320, "pj_d_0").setDepth(9).setScale(CHAR_SCALE);
    // La textura mide 44x60. El cuerpo va a los PIES del personaje.
    this.pj.body.setSize(20, 12);
    this.pj.body.setOffset(12, 46);
    this.pj.setCollideWorldBounds(true);
    this.physics.add.collider(this.pj, this.solids);
    // DEBUG_COLLISIONS (en gameConfig) activa el dibujo de cajas de Arcade Physics.
    if (CONFIG.GAMEPLAY.DEBUG_COLLISIONS) this.physics.world.createDebugGraphic();
  }

  #decor() {
    // estufa (esquina superior izquierda) con brillo
    const g = this.add.graphics().setDepth(2);
    g.fillStyle(0x3a3a42, 1); g.fillRoundedRect(40, 70, 44, 54, 4);
    g.fillStyle(0x1c1c1c, 1); g.fillRect(52, 96, 20, 16);
    g.fillStyle(0xff7a1a, 1); g.fillRect(55, 100, 14, 10);
    g.fillStyle(0x5a5a62, 1); g.fillRect(58, 30, 8, 44);
    this.stoveGlow = this.add.rectangle(62, 105, 16, 12, 0xffb14a).setDepth(3);
    this.tweens.add({ targets: this.stoveGlow, alpha: 0.4, scaleX: 1.3, yoyo: true, repeat: -1, duration: 700 });

    // solid()  = objeto físico real (caja de colisión ajustada al dibujo)
    // deco()   = decoración pura, se puede atravesar (nada de paredes invisibles)
    const solid = (tex, x, y, d = 3) => {
      const s = this.add.image(x, y, tex).setDepth(d);
      const r = this.add.rectangle(x, y + s.height / 4, s.width - 10, s.height / 2.4, 0, 0);
      this.physics.add.existing(r, true); this.solids?.add(r); return s;
    };
    const deco = (tex, x, y, d = 3) => this.add.image(x, y, tex).setDepth(d);

    // esquinas y paredes: cajas y barriles reales (colisionan, pegados a los bordes)
    solid("crate", 58, 470); solid("crate", 86, 450, 4); solid("crate", 74, 428, 5);
    solid("barrel", 912, 100); solid("barrel", 40, 300);
    solid("crate", 910, 466); solid("barrel", 890, 430, 4);

    // decoración ambiental (atravesable, llena el taller sin estorbar el paso)
    deco("planks", 470, 486); deco("planks", 700, 300);
    deco("chair_done", 636, 486); deco("chair_done", 672, 476, 4);
    deco("chair_done", 150, 250); deco("planks", 850, 300); deco("planks", 150, 486);
    // montones de aserrín repartidos
    const s = this.add.graphics().setDepth(3);
    [[300, 458, 34], [190, 420, 24], [760, 452, 28]].forEach(([x, y, w]) => {
      s.fillStyle(0xd8c49a, 0.75); s.fillEllipse(x, y, w, w * 0.35);
      s.fillStyle(0xc8b184, 0.75); s.fillEllipse(x, y - 2, w * 0.6, w * 0.22);
    });
    // clavos y tablas sueltas cerca de la computadora
    const t = this.add.graphics().setDepth(3);
    t.fillStyle(0x6b7280, 1); for (let i = 0; i < 5; i++) t.fillRect(410 + i * 5, 168, 2, 9);
    t.fillStyle(0xa5763f, 1); t.fillRect(400, 182, 46, 5); t.fillRect(404, 189, 40, 5);
  }

  #lighting() {
    // lámpara colgante
    this.add.line(0, 0, W / 2, 48, W / 2, 150, 0x2a1a0e).setLineWidth(2).setDepth(7).setOrigin(0);
    const shade = this.add.triangle(W / 2, 150, -16, 0, 16, 0, 0, 18, 0x3a2412).setDepth(8);
    const bulb = this.add.circle(W / 2, 158, 5, 0xffe6a8).setDepth(8);
    this.tweens.add({ targets: [shade, bulb], x: W / 2 + 4, yoyo: true, repeat: -1, duration: 2600, ease: "Sine.inOut" });
    this.tweens.add({ targets: bulb, alpha: 0.7, yoyo: true, repeat: -1, duration: 1800 });
  }

  #dust() {
    this.add.particles(0, 0, "spark", {
      x: { min: 40, max: W - 40 }, y: { min: 60, max: H - 60 },
      lifespan: 6000, speedY: { min: -4, max: 6 }, speedX: { min: -3, max: 3 },
      scale: { start: 0.5, end: 0 }, alpha: { start: 0.16, end: 0 }, frequency: 1100, quantity: 1,
    }).setDepth(38);
  }

  #objectiveMarker() {
    // Nada de flechas gigantes: un aro suave que late en el suelo del puesto
    // activo y una lucecita 💡 pequeña encima del NPC.
    this.markRing = this.add.ellipse(0, 0, 46, 20).setStrokeStyle(2.5, 0xffd98a, 0.8).setDepth(1).setVisible(false);
    this.markIco = this.add.text(0, 0, "💡", { fontSize: "14px" }).setOrigin(0.5).setDepth(53).setVisible(false);
    this.tweens.add({ targets: this.markRing, scaleX: 1.25, scaleY: 1.25, alpha: 0.15, duration: 1100, repeat: -1, ease: "Sine.out" });
    this.tweens.add({ targets: this.markIco, y: "+=4", yoyo: true, repeat: -1, duration: 640, ease: "Sine.inOut" });
  }

  #setHint(id) {
    const s = STATIONS.find((x) => x.id === id);
    const on = !!s;
    this.markRing?.setVisible(on);
    this.markIco?.setVisible(on);
    if (!on) return;
    const sp = this.npc?.[s.npc];
    const ny = sp ? sp.y : s.y;
    this.markRing.setPosition(s.x, ny + 22);
    this.markIco.setPosition(s.x, ny - 26);
    // pequeño "salto" del NPC de ese puesto para llamar la atención
    if (sp) {
      this.tweens.add({ targets: sp, scaleX: CHAR_SCALE * 1.13, scaleY: CHAR_SCALE * 1.13,
        duration: 170, yoyo: true, repeat: 2, ease: "Sine.inOut" });
    }
  }

  // ---------- bucle ----------
  update(_t, dt) {
    this.paused = !!document.querySelector(
      ".modal.open, .menu-root:not(.hidden), .rule-pop, .dialogue.open, .tutorial-root:not(.hidden)");
    // Al REANUDAR (se cerró la ventana) soltamos cualquier tecla que quedara
    // marcada mientras el jugador escribía en un campo HTML.
    if (this._wasPaused && !this.paused) this._release();
    this._wasPaused = this.paused;
    if (this.tick && !this.paused) this.tick(dt);

    let vx = 0, vy = 0;
    if (!this.paused) {
      const k = this.k, e = this.entrada;
      if (k.A.isDown || k.LEFT.isDown || e.x < 0) vx = -1;
      else if (k.D.isDown || k.RIGHT.isDown || e.x > 0) vx = 1;
      if (k.W.isDown || k.UP.isDown || e.y < 0) vy = -1;
      else if (k.S.isDown || k.DOWN.isDown || e.y > 0) vy = 1;
    }
    const v = new Phaser.Math.Vector2(vx, vy);
    const moving = v.lengthSq() > 0;
    if (moving) v.normalize().scale(CONFIG.PLAYER.speed);
    this.pj.setVelocity(v.x, v.y);

    if (moving) {
      this.facing = Math.abs(vx) > Math.abs(vy) ? (vx > 0 ? "r" : "l") : (vy > 0 ? "d" : "u");
      this.animT += dt;
      const f = Math.floor(this.animT / 130) % 2;
      const d = this.facing === "r" || this.facing === "l" ? "s" : this.facing;
      this.pj.setTexture(`pj_${d}_${f}`).setFlipX(this.facing === "l");
    } else this.pj.setTexture("pj_idle");
    this.pj.setDepth(10 + this.pj.y * 0.02);

    // Cada NPC hace su actividad (2 fotogramas). Mario más rápido (martillo).
    const rate = { mario: 260, carlos: 420, byte: 300, beto: 520, ana: 640, client: 900 };
    for (const id in this.npc) {
      const sp = this.npc[id]; sp._t += dt;
      const per = rate[id] ?? 500;
      sp.setTexture(`${id}_work_${Math.floor(sp._t / per) % 2}`);
    }
    this.gs.player.setPosition(Math.round(this.pj.x), Math.round(this.pj.y));
    this.#resolveTarget();
  }

  #resolveTarget() {
    let best = null, bd = 999;
    for (const s of STATIONS) {
      const d = Phaser.Math.Distance.Between(this.pj.x, this.pj.y, s.x, s.y);
      if (d < 66 && d < bd) { bd = d; best = { id: s.id, label: s.label }; }
    }
    const key = best ? best.id : "";
    if (key !== this.tKey) {
      this.tKey = key;
      this.target = best ? { kind: "station", ...best } : null;
      this.bus.emit("workshop:prompt", this.target);
    }
  }

  #interact() {
    if (this.paused || !this.target) return;
    this.bus.emit("station:open", this.target.id);
  }

  #bar(id, ratio, done = false) {
    const s = STATIONS.find((x) => x.id === id);
    if (!this.bars[id] && !done) {
      const bg = this.add.rectangle(s.x, s.y - 40, 58, 8, 0x1a1109).setStrokeStyle(2, 0xe0a92b).setDepth(51);
      const fl = this.add.rectangle(s.x - 27, s.y - 40, 2, 4, 0x6fae4f).setOrigin(0, 0.5).setDepth(52);
      this.bars[id] = { bg, fl };
    }
    const b = this.bars[id];
    if (!b) return;
    b.fl.width = Math.max(2, 54 * ratio);
    if (done) { b.bg.destroy(); b.fl.destroy(); delete this.bars[id]; }
  }

  #burst(x, y) {
    const p = this.add.particles(x, y, "spark", {
      speed: { min: 40, max: 130 }, lifespan: 480, quantity: 16, scale: { start: 1, end: 0 }, emitting: false,
    }).setDepth(35);
    p.explode(16);
    this.time.delayedCall(600, () => p.destroy());
  }
}

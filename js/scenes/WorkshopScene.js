/* global Phaser */
import { CONFIG } from "../config/gameConfig.js";
import { CHAR_SCALE } from "./art.js";

const W = CONFIG.WORLD.width, H = CONFIG.WORLD.height;
// Margen a cada lado: el lienzo (VIEW) es más ancho que el taller (WORLD).
const MX = Math.max(0, Math.round((CONFIG.VIEW.width - W) / 2));

/** Un solo taller compacto. Cámara fija: todo se ve a la vez. */
const STATIONS = [
  { id: "shelf",  label: "[E] Inventario",   x: 108, y: 150, icon: "📦", kind: "shelf" },
  { id: "coding", label: "[E] Programar",    x: 420, y: 120, icon: "💻", kind: "pc" },
  { id: "arch",   label: "[E] Arquitectura", x: 600, y: 132, icon: "🏛️", kind: "mvc" },
  { id: "orders", label: "[E] Pedidos",      x: 832, y: 130, icon: "📋", kind: "board" },
  { id: "bench",  label: "[E] Fabricar",     x: 182, y: 402, icon: "🪚", kind: "bench" },
  { id: "cutter", label: "[E] Máquina",      x: 792, y: 392, icon: "⚙️", kind: "saw" },
  { id: "shop",   label: "[E] Mejoras",      x: 150, y: 520, icon: "🏪", kind: "shop" },
  { id: "sales",  label: "[E] Vender",       x: 800, y: 520, icon: "🧾", kind: "register" },
];

const NPCS = [
  { id: "byte", name: "BYTE", tex: "byte", x: 498, y: 158, dir: "d", lines: [
    "Tenemos nuestro primer pedido.",
    "Pero antes de fabricar nada... hay que enseñarle al taller cómo hacerlo.",
    "Eso se parece mucho a definir una CLASE. Acércate a la computadora 💻 y pulsa E." ] },
  { id: "mario", name: "Mario", tex: "mario", x: 252, y: 382, dir: "d", work: true, lines: [
    "Soy Mario. Yo fabrico, pero necesito los materiales encima del banco.",
    "Y no puedo hacer dos piezas a la vez." ] },
  { id: "carlos", name: "Carlos", tex: "carlos", x: 236, y: 502, dir: "d", lines: [
    "Vendo materiales y mejoras. Con tu dinero puedes hacerte más fuerte.",
    "Decide bien: ¿materiales ahora o una mejora para siempre?" ] },
  { id: "client", name: "Cliente", tex: "client", x: 728, y: 502, dir: "l", lines: [
    "Vengo del Restaurante El Roble.",
    "Cuando tengas mi silla, tráemela al mostrador." ] },
];

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
    this.physics.world.setBounds(28, 52, W - 56, H - 84);

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

    this.bus.on("craft:progress", (p) => this.#bar("bench", p.ratio));
    this.bus.on("craft:done", () => { this.#bar("bench", 0, true); this.#burst(182, 392); });
    this.bus.on("cut:started", () => { this.cutting = true; });
    this.bus.on("cut:progress", (p) => this.#bar("cutter", p.ratio));
    this.bus.on("cut:done", () => { this.#bar("cutter", 0, true); this.cutting = false; this.#burst(792, 380); });
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
    this.solids = this.physics.add.staticGroup();
    const wx0 = -Math.ceil(MX / 32) * 32, wx1 = W + Math.ceil(MX / 32) * 32;
    const wallRT = this.add.renderTexture(wx0, 0, wx1 - wx0, 48).setOrigin(0).setDepth(6);
    const seg = (x, y, w, h, draw = true) => {
      if (draw) for (let i = 0; i < w; i += 32) for (let j = 0; j < h; j += 48)
        wallRT.draw("wall", x + i - wx0, y + j);
      const r = this.add.rectangle(x + w / 2, y + h / 2, w, h, 0, 0);
      this.physics.add.existing(r, true); this.solids.add(r);
    };
    seg(wx0, 0, wx1 - wx0, 48);
    seg(0, H - 24, W, 24, false); this.#floorTrim(0, H - 26, W);
    seg(0, 0, 24, H, false); seg(W - 24, 0, 24, H, false);
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
    // pegboard con herramientas (encima del banco)
    g.fillStyle(0x6b4a2a, 1); g.fillRoundedRect(90, 6, 150, 34, 3);
    g.fillStyle(0xc9c9d2, 1); g.fillTriangle(110, 34, 100, 12, 120, 12);       // sierra
    g.fillStyle(0x8a5a30, 1); g.fillRect(150, 10, 5, 24); g.fillStyle(0x9aa3af, 1); g.fillRect(144, 8, 17, 7); // martillo
    g.lineStyle(4, 0xc9c9d2, 1); g.beginPath(); g.arc(200, 22, 12, 0, Math.PI); g.strokePath(); // llave
    // cuadro
    g.fillStyle(0x2f5c86, 1); g.fillRect(430, 8, 60, 30); g.lineStyle(3, 0xe0a92b, 1); g.strokeRect(430, 8, 60, 30);
    // reloj
    g.fillStyle(0x1c1c1c, 1); g.fillCircle(560, 24, 13); g.fillStyle(0xf3e6cc, 1); g.fillCircle(560, 24, 10);
    g.lineStyle(2, 0x1c1c1c, 1); g.lineBetween(560, 24, 560, 17); g.lineBetween(560, 24, 566, 24);
    // vigas del techo
    g.fillStyle(0x3a2412, 1);
    [140, 480, 820].forEach((x) => g.fillRect(x, 48, 24, 14));
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
    this.bars = {}; this.marks = {};
    for (const s of STATIONS) {
      this.#stationDraw(s.kind, s.x, s.y);
      if (s.kind !== "board" && s.kind !== "shop" && s.kind !== "shelf") {
        const r = this.add.rectangle(s.x, s.y + 6, 60, 26, 0, 0);
        this.physics.add.existing(r, true); this.solids.add(r);
      } else {
        const r = this.add.rectangle(s.x, s.y, 66, 30, 0, 0);
        this.physics.add.existing(r, true); this.solids.add(r);
      }
      this.add.text(s.x, s.y + 30, s.label, {
        fontFamily: "Verdana", fontSize: "10px", fontStyle: "bold", color: "#ffe7b0",
        backgroundColor: "#1a1109cc", padding: { x: 4, y: 2 },
      }).setOrigin(0.5).setDepth(50).setName("lbl-" + s.id).setAlpha(0.55);
    }
  }

  #npcs() {
    this.npc = {};
    for (const n of NPCS) {
      const key = n.dir === "l" ? `${n.tex}_s_0` : `${n.tex}_${n.dir === "r" ? "s" : n.dir}_0`;
      const sp = this.add.sprite(n.x, n.y, key).setDepth(9).setScale(CHAR_SCALE);
      if (n.dir === "l") sp.setFlipX(true);
      sp._t = Math.random() * 500; sp._def = n;
      this.add.text(n.x, n.y - 34, n.name, {
        fontFamily: "Verdana", fontSize: "9px", fontStyle: "bold", color: "#fff",
        backgroundColor: "#0008", padding: { x: 3, y: 1 },
      }).setOrigin(0.5).setDepth(20);
      this.npc[n.id] = sp;
    }
  }

  #player() {
    this.pj = this.physics.add.sprite(480, 330, "pj_d_0").setDepth(9).setScale(CHAR_SCALE);
    this.pj.body.setSize(24, 16).setOffset(32, 96);
    this.pj.setCollideWorldBounds(true);
    this.physics.add.collider(this.pj, this.solids);
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

    const put = (tex, x, y, d = 3) => { const s = this.add.image(x, y, tex).setDepth(d);
      const r = this.add.rectangle(x, y + 4, s.width - 6, s.height - 12, 0, 0);
      this.physics.add.existing(r, true); this.solids?.add(r); return s; };
    put("crate", 70, 470); put("crate", 96, 452, 4); put("planks", 300, 470);
    put("barrel", 900, 90); put("barrel", 60, 300); put("planks", 640, 470);
    put("chair_done", 700, 470); put("chair_done", 736, 456, 4);
    // pila de aserrín cerca del banco (no sólido)
    const s = this.add.graphics().setDepth(3);
    s.fillStyle(0xd8c49a, 0.8); s.fillEllipse(230, 430, 34, 12);
    s.fillStyle(0xc8b184, 0.8); s.fillEllipse(230, 428, 22, 8);
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
    this.mark = this.add.container(0, 0).setDepth(52).setVisible(false);
    const halo = this.add.circle(0, -6, 16, 0xffd98a, 0.25);
    const arrow = this.add.text(0, 6, "▼", { fontSize: "22px", color: "#ffd98a", stroke: "#3a2412", strokeThickness: 3 }).setOrigin(0.5);
    this.markIco = this.add.text(0, -14, "💡", { fontSize: "20px" }).setOrigin(0.5);
    this.mark.add([halo, this.markIco, arrow]);
    this.tweens.add({ targets: this.mark, y: "+=7", yoyo: true, repeat: -1, duration: 520, ease: "Sine.inOut" });
    this.tweens.add({ targets: halo, scale: 1.4, alpha: 0, yoyo: false, repeat: -1, duration: 900 });
  }

  #setHint(id) {
    const s = STATIONS.find((x) => x.id === id);
    if (!s) { this.mark?.setVisible(false); return; }
    this.mark.setVisible(true);
    this.mark.setPosition(s.x, s.y - 34);
    this.markIco.setText(s.icon);
    this.tweens.killTweensOf(this.mark);
    this.tweens.add({ targets: this.mark, y: s.y - 34 + 7, yoyo: true, repeat: -1, duration: 520, ease: "Sine.inOut" });
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

    // Mario trabajando + otros NPC idle (respiran / se mueven un poco)
    for (const id in this.npc) {
      const sp = this.npc[id]; sp._t += dt;
      if (sp._def.work) sp.setTexture(`mario_work_${Math.floor(sp._t / 300) % 2}`);
      else {
        const base = sp._def.dir === "l" || sp._def.dir === "r" ? "s" : sp._def.dir;
        sp.setTexture(`${sp._def.tex}_${base}_${Math.floor(sp._t / 900) % 2}`);
      }
      sp.setDepth(10 + sp.y * 0.02);
    }
    // humo de la máquina cuando corta
    if (this.cutting && Math.random() < 0.3) {
      const s = this.add.image(792, 372, "smoke").setDepth(20).setAlpha(0.5);
      this.tweens.add({ targets: s, y: 340, alpha: 0, scale: 2, duration: 900, onComplete: () => s.destroy() });
    }

    this.gs.player.setPosition(Math.round(this.pj.x), Math.round(this.pj.y));
    this.#resolveTarget();
  }

  #resolveTarget() {
    let best = null, bd = 999, kind = null;
    for (const n of NPCS) {
      const d = Phaser.Math.Distance.Between(this.pj.x, this.pj.y, n.x, n.y);
      if (d < 44 && d < bd) { bd = d; best = { id: n.id, label: `[E] Hablar con ${n.name}` }; kind = "npc"; }
    }
    for (const s of STATIONS) {
      const d = Phaser.Math.Distance.Between(this.pj.x, this.pj.y, s.x, s.y);
      if (d < 54 && d < bd) { bd = d; best = { id: s.id, label: s.label }; kind = "station"; }
    }
    for (const s of STATIONS)
      this.children.getByName("lbl-" + s.id)?.setAlpha(best && kind === "station" && best.id === s.id ? 1 : 0.55);

    const key = best ? kind + best.id : "";
    if (key !== this.tKey) {
      this.tKey = key;
      this.target = best ? { kind, ...best } : null;
      this.bus.emit("workshop:prompt", this.target);
    }
  }

  #interact() {
    if (this.paused || !this.target) return;
    if (this.target.kind === "npc") {
      const n = NPCS.find((x) => x.id === this.target.id);
      this.bus.emit("dialogue:open", { name: n.name, lines: n.lines });
    } else this.bus.emit("station:open", this.target.id);
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

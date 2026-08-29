/* global Phaser */
import { artManifest } from "./art.js";

/**
 * BootScene — carga los SVG de art.js como imágenes (data URI) → texturas de
 * Phaser (personajes con degradados y sombreado, suelo, paredes, props). Genera
 * los efectos (chispas, humo, luz) con Graphics. Sin imágenes externas.
 */
export class BootScene extends Phaser.Scene {
  constructor() { super("Boot"); }

  preload() {
    const { width: W, height: H } = this.scale;
    this.add.rectangle(0, 0, W, H, 0x161009).setOrigin(0);
    this.add.text(W / 2, H / 2 - 26, "CARGANDO TALLER…", {
      fontFamily: "Trebuchet MS", fontSize: "20px", color: "#e0a92b",
    }).setOrigin(0.5);

    // barra de progreso real (para que no parezca congelado en móvil)
    const bw = Math.min(320, W * 0.6);
    this.add.rectangle(W / 2, H / 2 + 8, bw, 12, 0x000000).setStrokeStyle(2, 0x8a5a30);
    const bar = this.add.rectangle(W / 2 - bw / 2 + 2, H / 2 + 8, 2, 8, 0xe0a92b).setOrigin(0, 0.5);
    this.load.on("progress", (v) => { bar.width = Math.max(2, (bw - 4) * v); });

    for (const a of artManifest()) {
      this.load.image(a.key, "data:image/svg+xml;charset=utf-8," + encodeURIComponent(a.svg));
    }
    this.load.on("loaderror", (f) => console.warn("no cargó:", f.key));
  }

  create() {
    this.#fx();
    this.scene.start("Menu");
  }

  #fx() {
    const g = () => this.make.graphics({ add: false });
    let x = g(); x.fillStyle(0xffe6a8, 1); x.fillCircle(3, 3, 3); x.generateTexture("spark", 6, 6); x.destroy();
    x = g(); x.fillStyle(0x140c05, 1); x.fillRect(0, 0, 8, 8); x.generateTexture("dark", 8, 8); x.destroy();
    x = g(); x.fillStyle(0xcfcfcf, 1); x.fillCircle(5, 5, 5); x.generateTexture("smoke", 10, 10); x.destroy();
  }
}

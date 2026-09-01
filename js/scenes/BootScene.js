/* global Phaser */
import { artManifest } from "./art.js";

/**
 * BootScene — convierte los SVG de art.js en texturas de Phaser.
 *
 * Carga las imágenes A MANO (new Image + textures.addImage) en vez de usar el
 * LoaderPlugin de Phaser: su cola se atascaba en algunos navegadores con ~50
 * data-URIs SVG. Así el navegador gestiona la concurrencia y nunca hay deadlock.
 */
export class BootScene extends Phaser.Scene {
  constructor() { super("Boot"); }

  create() {
    const { width: W, height: H } = this.scale;
    this.add.rectangle(0, 0, W, H, 0x161009).setOrigin(0);
    this.add.text(W / 2, H / 2 - 26, "CARGANDO TALLER…", {
      fontFamily: "Trebuchet MS", fontSize: "20px", color: "#e0a92b",
    }).setOrigin(0.5);
    const bw = Math.min(320, W * 0.6);
    this.add.rectangle(W / 2, H / 2 + 8, bw, 12, 0x000000).setStrokeStyle(2, 0x8a5a30);
    const bar = this.add.rectangle(W / 2 - bw / 2 + 2, H / 2 + 8, 2, 8, 0xe0a92b).setOrigin(0, 0.5);

    this.#fx();

    const manifest = artManifest();
    const total = manifest.length;
    let done = 0;
    let started = false;

    const advance = () => {
      done++;
      bar.width = Math.max(2, (bw - 4) * (done / total));
      if (done >= total && !started) { started = true; this.scene.start("Menu"); }
    };

    for (const a of manifest) {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        try { if (!this.textures.exists(a.key)) this.textures.addImage(a.key, img); }
        catch (e) { console.warn("textura:", a.key, e); }
        advance();
      };
      img.onerror = () => { console.warn("no cargó:", a.key); advance(); };
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(a.svg);
    }

    // Red de seguridad: si algo tarda demasiado, arranca con lo que haya.
    this.time.delayedCall(12000, () => {
      if (!started) { started = true; console.warn(`Boot: ${done}/${total} texturas`); this.scene.start("Menu"); }
    });
  }

  #fx() {
    const g = () => this.make.graphics({ add: false });
    let x = g(); x.fillStyle(0xffe6a8, 1); x.fillCircle(3, 3, 3); x.generateTexture("spark", 6, 6); x.destroy();
    x = g(); x.fillStyle(0x140c05, 1); x.fillRect(0, 0, 8, 8); x.generateTexture("dark", 8, 8); x.destroy();
    x = g(); x.fillStyle(0xcfcfcf, 1); x.fillCircle(5, 5, 5); x.generateTexture("smoke", 10, 10); x.destroy();
  }
}

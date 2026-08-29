/* global Phaser */
import { CONFIG } from "../config/gameConfig.js";
import { CHAR_SCALE } from "./art.js";

/** MenuScene — telón del menú principal. Los botones son HTML (MenuView). */
export class MenuScene extends Phaser.Scene {
  constructor() { super("Menu"); }

  create() {
    const { width: W, height: H } = CONFIG.VIEW;
    // Suelo + pared "horneados" en una sola textura (1 draw call).
    const rt = this.add.renderTexture(0, 0, W, H).setOrigin(0);
    for (let y = 0; y < H; y += 32)
      for (let x = 0; x < W; x += 32) rt.draw(`floor${(x / 32 + y / 32) % 2 | 0}`, x, y);
    for (let x = 0; x < W; x += 32) rt.draw("wall", x, H * 0.42 - 48);


    const pj = this.add.sprite(140, H * 0.72, "pj_s_0").setScale(CHAR_SCALE * 2.4).setDepth(20);
    this.tweens.add({
      targets: pj, x: W - 150, duration: 5200, yoyo: true, repeat: -1, ease: "Sine.inOut",
      onYoyo: () => pj.setFlipX(true), onRepeat: () => pj.setFlipX(false),
    });
    this.time.addEvent({ delay: 170, loop: true, callback: () => {
      pj._f = ((pj._f ?? 0) + 1) % 2;
      pj.setTexture("pj_s_" + pj._f);
    }});

    this.add.particles(0, 0, "spark", {
      x: { min: 0, max: W }, y: { min: 0, max: H * 0.42 },
      lifespan: 4200, speedY: { min: 3, max: 10 }, scale: { start: 0.6, end: 0 },
      alpha: { start: 0.28, end: 0 }, frequency: 700,
    }).setDepth(42);

    this.game.events.emit("menu:ready");
  }
}

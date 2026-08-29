import { CONFIG } from "../config/gameConfig.js";

/**
 * PlayerController — traduce la entrada (teclado / D-pad) en un vector de
 * movimiento y mantiene sincronizada la posición del Player (modelo) con la
 * posición del sprite (vista). No dibuja nada.
 */
export class PlayerController {
  #player;
  constructor(player) { this.#player = player; }

  /** Vector normalizado a partir de teclas booleanas y el vector del D-pad. */
  moveVector(keys, dpad) {
    let x = (keys.right ? 1 : 0) - (keys.left ? 1 : 0) + (dpad?.x ?? 0);
    let y = (keys.down ? 1 : 0) - (keys.up ? 1 : 0) + (dpad?.y ?? 0);
    x = Math.max(-1, Math.min(1, x));
    y = Math.max(-1, Math.min(1, y));
    const len = Math.hypot(x, y) || 1;
    return { x: (x / len) * CONFIG.PLAYER.speed, y: (y / len) * CONFIG.PLAYER.speed, moving: x !== 0 || y !== 0 };
  }

  /** La escena informa de la posición real tras la física. */
  syncPosition(x, y) { this.#player.setPosition(Math.round(x), Math.round(y)); }
}

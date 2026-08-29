import { el, $ } from "./dom.js";

/**
 * Modal — marco reutilizable para las estaciones. Se abre solo cuando el jugador
 * interactúa; ESC lo cierra. Tiene aspecto de objeto del taller, no de dashboard.
 */
export class Modal {
  constructor({ id, variant = "wood", onClose } = {}) {
    this.id = id;
    this.onClose = onClose;
    this.root = el("div", { class: "modal", attrs: { id } });
    this.frame = el("div", { class: `modal-frame ${variant}` });
    this.root.append(this.frame);
    this.root.addEventListener("click", (e) => { if (e.target === this.root) this.close(); });
    $("#ui").append(this.root);
  }

  render(html) { this.frame.innerHTML = html; }

  bind(map) {
    this.frame.onclick = (e) => {
      const t = e.target.closest("[data-act]");
      if (!t) return;
      (map[t.dataset.act])?.(t.dataset, t);
    };
  }

  open() { this.root.classList.add("open"); this.visible = true; }
  close() { this.root.classList.remove("open"); this.visible = false; this.onClose?.(); }
  get isOpen() { return this.root.classList.contains("open"); }
}

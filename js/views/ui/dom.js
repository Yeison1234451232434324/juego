/** dom.js — utilidades mínimas de interfaz (sin frameworks). */
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

export function el(tag, o = {}, kids = []) {
  const n = document.createElement(tag);
  if (o.class) n.className = o.class;
  if (o.text != null) n.textContent = o.text;
  if (o.html != null) n.innerHTML = o.html;
  for (const [k, v] of Object.entries(o.attrs ?? {})) n.setAttribute(k, v);
  for (const [k, v] of Object.entries(o.on ?? {})) n.addEventListener(k, v);
  for (const c of [].concat(kids)) if (c) n.append(c);
  return n;
}
export const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

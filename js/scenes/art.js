/**
 * art.js — generador de gráficos vectoriales (SVG) del juego.
 * Los personajes y los props se dibujan como SVG con degradados y sombreado
 * (mucho más detallado que rectángulos) y se rasterizan a texturas de Phaser en
 * el BootScene. Todo va embebido: no hay imágenes externas → funciona en Pages.
 */

// ---------- paletas de personaje ----------
const PAL = {
  pj:     { skin: "#f2ceac", skinS: "#deb389", hair: "#5b3a22", hairH: "#7a5133", shirt: "#3f9a63", shirtS: "#2e6f46", pants: "#3d5878", shoe: "#3a2a1c", acc: "goggles", ac: "#ffd98a" },
  byte:   { skin: "#e4f3fa", skinS: "#c3dfea", hair: "#9fe0ff", hairH: "#c9f0ff", shirt: "#1f88ab", shirtS: "#166079", pants: "#12566a", shoe: "#0e3542", acc: "visor", ac: "#9fe0ff" },
  mario:  { skin: "#e6b58a", skinS: "#cf9c72", hair: "#241610", hairH: "#3a271a", shirt: "#b0402f", shirtS: "#872f23", pants: "#4a3a24", shoe: "#241608", acc: "cap", ac: "#e6b58a" },
  client: { skin: "#ecc9a4", skinS: "#d6ac81", hair: "#3a2a1e", hairH: "#4d3826", shirt: "#41539a", shirtS: "#2c3a6e", pants: "#232f4c", shoe: "#161616", acc: "tophat", ac: "#c9b48a" },
  carlos: { skin: "#d6a26e", skinS: "#bd8955", hair: "#241610", hairH: "#3a271a", shirt: "#7a5230", shirtS: "#5f3f22", pants: "#3a2a18", shoe: "#2a1a0e", acc: "beardcap", ac: "#d6a26e" },
  // Ana — recepcionista de pedidos
  ana:    { skin: "#f0c9a4", skinS: "#dcb187", hair: "#6b3b1f", hairH: "#8a5533", shirt: "#c86a86", shirtS: "#a04a66", pants: "#3a3f52", shoe: "#2a2a2a", acc: "bun", ac: "#f0c9a4" },
  // Beto — almacenista
  beto:   { skin: "#c98d5c", skinS: "#ad7346", hair: "#1c130c", hairH: "#2e2114", shirt: "#3d7a4a", shirtS: "#2c5a37", pants: "#4a3a24", shoe: "#241608", acc: "beanie", ac: "#c98d5c" },
};

/** Actividad de cada NPC de estación (el mundo explica el juego sin texto). */
export const NPC_WORK = {
  ana: "read", byte: "type", beto: "carry", mario: "hammer",
  client: "wait", carlos: "fix",
};

// RENDER = supersampling de los personajes. 1 = rasteriza al tamaño final
// (mucho más rápido de decodificar en móvil, misma resolución en pantalla).
const VB_W = 44, VB_H = 60, RENDER = 1;

const G = (id, a, b) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
     <stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;

function head(p, cx, cy, side, back) {
  const r = 8.5;
  let s = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#sk)"/>`;
  if (!back) {
    if (side) {
      s += `<ellipse cx="${cx + 3}" cy="${cy + 1}" rx="1.6" ry="2.1" fill="#fff"/>
            <circle cx="${cx + 3.4}" cy="${cy + 1.3}" r="1.1" fill="#26201a"/>
            <path d="M${cx + 6} ${cy} q2 1 0.6 3" stroke="${p.skinS}" stroke-width="1.1" fill="none"/>
            <path d="M${cx + 1} ${cy + 4.4} q2.5 1.6 4.6 0" stroke="#7a4a30" stroke-width="1.2" fill="none"/>`;
    } else {
      s += `<ellipse cx="${cx - 3}" cy="${cy + 1}" rx="1.7" ry="2.3" fill="#fff"/>
            <ellipse cx="${cx + 3}" cy="${cy + 1}" rx="1.7" ry="2.3" fill="#fff"/>
            <circle cx="${cx - 2.6}" cy="${cy + 1.4}" r="1.15" fill="#26201a"/>
            <circle cx="${cx + 3.4}" cy="${cy + 1.4}" r="1.15" fill="#26201a"/>
            <path d="M${cx - 5} ${cy - 1.5} q2 -1.4 3.6 0" stroke="${p.hair}" stroke-width="1" fill="none"/>
            <path d="M${cx + 1.4} ${cy - 1.5} q2 -1.4 3.6 0" stroke="${p.hair}" stroke-width="1" fill="none"/>
            <path d="M${cx - 0.6} ${cy + 3} q1.2 1.4 0 2.6" stroke="${p.skinS}" stroke-width="1" fill="none"/>
            <path d="M${cx - 2.6} ${cy + 5.4} q2.6 2 5.2 0" stroke="#7a4a30" stroke-width="1.3" fill="none"/>
            <circle cx="${cx - 5.4}" cy="${cy + 3.6}" r="1.7" fill="#e88" opacity=".3"/>
            <circle cx="${cx + 5.4}" cy="${cy + 3.6}" r="1.7" fill="#e88" opacity=".3"/>`;
    }
  }
  // pelo
  if (back) {
    s += `<circle cx="${cx}" cy="${cy - 0.5}" r="${r + 0.6}" fill="${p.hair}"/>
          <path d="M${cx - r} ${cy} q0 8 ${r} 9 q${r} -1 ${r} -9Z" fill="${p.hairH}"/>`;
  } else if (side) {
    s += `<path d="M${cx - r} ${cy - 2} q0 -${r + 1} ${r} -${r + 1} q${r} 0 ${r} ${r + 1}
             q0 3 -2 4 l-3 -3 q-4 -3 -9 0Z" fill="${p.hair}"/>
          <path d="M${cx - r - 1} ${cy - 2} q4 -5 9 -2" stroke="${p.hairH}" stroke-width="1.4" fill="none"/>`;
  } else {
    s += `<path d="M${cx - r} ${cy - 1} q0 -${r + 2} ${r} -${r + 2} q${r} 0 ${r} ${r + 2}
             q0 3 -1.6 4 l0 -4 q-${r - 1.5} -4.5 -${2 * (r - 1.5)} 0 l0 4 q-1.6 -1 -1.6 -4Z" fill="${p.hair}"/>
          <path d="M${cx - r + 1} ${cy - 5} q${r - 1} -5 ${2 * (r - 1)} 0" stroke="${p.hairH}" stroke-width="1.4" fill="none"/>`;
  }
  // accesorios
  const a = p.acc;
  if (a === "goggles") s += `<rect x="${cx - r}" y="${cy - r - 1}" width="${2 * r}" height="3" rx="1.5" fill="#2a1a0e"/>
    <circle cx="${cx - 3}" cy="${cy - r + 0.5}" r="1.8" fill="#bfe3ff" opacity=".8"/>
    <circle cx="${cx + 3}" cy="${cy - r + 0.5}" r="1.8" fill="#bfe3ff" opacity=".8"/>`;
  if (a === "visor") s += `<rect x="${cx - r}" y="${cy - 3}" width="${2 * r}" height="4.4" rx="2" fill="#0e3542"/>
    <rect x="${cx - r + 1}" y="${cy - 2.4}" width="${2 * r - 2}" height="1.7" rx="0.8" fill="#8fd8ff"/>
    <line x1="${cx}" y1="${cy - r}" x2="${cx}" y2="${cy - r - 5}" stroke="#0e3542" stroke-width="1.4"/>
    <circle cx="${cx}" cy="${cy - r - 6}" r="2" fill="${p.ac}"/>`;
  if (a === "cap" || a === "beardcap") s += `<path d="M${cx - r - 1} ${cy - 4} q${r + 1} -9 ${2 * r + 2} 0 l0 2.5 q-${r + 1} -5.5 -${2 * r + 2} 0Z" fill="${p.shirt}"/>
    <rect x="${cx - r - 3}" y="${cy - 2}" width="7" height="2.4" rx="1" fill="${p.shirtS}"/>`;
  if (a === "beardcap" && !back) s += `<path d="M${cx - 5.5} ${cy + 3} q5.5 7 11 0 l0 3 q-5.5 6 -11 0Z" fill="${p.hair}"/>`;
  if (a === "tophat") s += `<rect x="${cx - r - 1}" y="${cy - r - 1}" width="${2 * r + 2}" height="2.6" rx="1" fill="#1c1c1c"/>
    <rect x="${cx - r + 2}" y="${cy - r - 9}" width="${2 * r - 4}" height="9" fill="#222"/>
    <rect x="${cx - r + 2}" y="${cy - r - 3}" width="${2 * r - 4}" height="2" fill="${p.ac}"/>`;
  if (a === "bun") s += `<circle cx="${cx}" cy="${cy - r - 1.5}" r="3.6" fill="${p.hair}"/>
    <circle cx="${cx}" cy="${cy - r - 1.5}" r="1.8" fill="${p.hairH}"/>`;
  if (a === "beanie") s += `<path d="M${cx - r} ${cy - 2} q0 -${r + 3} ${r} -${r + 3} q${r} 0 ${r} ${r + 3}Z" fill="#c85a3a"/>
    <rect x="${cx - r}" y="${cy - 4} " width="${2 * r}" height="3" rx="1.4" fill="#a8482e"/>
    <circle cx="${cx}" cy="${cy - r - 3}" r="2" fill="#e8b98a"/>`;
  return s;
}

/* ---------- posturas de TRABAJO (NPCs de estación) ---------- */
function torsoOf(p) {
  return `<rect x="13" y="22" width="18" height="20" rx="6" fill="url(#sh)"/>
    <rect x="13" y="35" width="18" height="3" fill="#000" opacity=".1"/>
    <rect x="14" y="23" width="5" height="18" rx="3" fill="#fff" opacity=".08"/>`;
}
function legPair(p) {
  const l = (x) => `<rect x="${x}" y="38" width="7" height="15" rx="3.2" fill="${p.pants}"/>
    <rect x="${x - 2}" y="50" width="11" height="5.5" rx="2.5" fill="${p.shoe}"/>`;
  return l(14) + l(23);
}
function workPose(p, type, frame) {
  const t = frame ? 1 : 0;
  const hand = (x, y) => `<circle cx="${x}" cy="${y}" r="3.1" fill="url(#sk)"/>`;
  const armL = (x, y, w = 6, h = 13) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${p.shirtS}"/>`;
  const armR = (x, y, w = 6, h = 13) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${p.shirt}"/>`;
  let tool = "";

  if (type === "type") {                       // teclear
    const dy = t ? 0 : -1.6;
    tool = `<g transform="translate(0 ${dy})">
      ${armL(10, 26)}${armR(28, 26)}${hand(13, 39)}${hand(31, 39)}
      <rect x="9" y="40" width="26" height="4" rx="1.5" fill="#1c1c1c"/>
      <rect x="10" y="40.6" width="24" height="1.2" fill="#3a3a3a"/></g>`;
  } else if (type === "hammer") {               // martillar
    const up = t ? -52 : -6;
    tool = `${armL(9, 25)}${hand(12, 37)}
      <g transform="rotate(${up} 32 25)">
        ${armR(29, 20, 6, 15)}${hand(32, 34)}
        <rect x="30.5" y="5" width="4" height="16" rx="1.5" fill="#6b4423"/>
        <rect x="26.5" y="3" width="12" height="6.5" rx="1.5" fill="#8a8f99"/>
        <rect x="26.5" y="3" width="12" height="2" rx="1" fill="#c3c8cf"/></g>
      <rect x="10" y="44" width="24" height="6" rx="1" fill="#b9884e" stroke="#6b4423" stroke-width="1"/>`;
  } else if (type === "read") {                  // revisar documentos
    const flip = t ? 2.5 : 0;
    tool = `${armL(11, 27, 6, 11)}${armR(27, 27, 6, 11)}
      <g transform="translate(${flip} 0)">
        <rect x="13" y="30" width="18" height="21" rx="1.5" fill="#efe6cf" stroke="#8a7350" stroke-width="1"/>
        <rect x="17" y="27.5" width="10" height="4" rx="1" fill="#9aa3af"/>
        <line x1="16" y1="35" x2="28" y2="35" stroke="#8a7350" stroke-width="0.8"/>
        <line x1="16" y1="39" x2="28" y2="39" stroke="#8a7350" stroke-width="0.8"/>
        <line x1="16" y1="43" x2="25" y2="43" stroke="#8a7350" stroke-width="0.8"/>
      </g>${hand(14, 39)}${hand(30, 39)}`;
  } else if (type === "carry") {                 // cargar materiales
    const bob = t ? 0 : -1.3;
    tool = `<g transform="translate(0 ${bob})">
      ${armL(9, 24)}${armR(29, 24)}
      <rect x="7" y="29" width="30" height="13" rx="2" fill="#b9884e" stroke="#6b4423" stroke-width="1"/>
      <rect x="7" y="32" width="30" height="1.4" fill="#00000022"/>
      <rect x="7" y="36" width="30" height="1.4" fill="#00000022"/>
      ${hand(10, 42)}${hand(34, 42)}</g>`;
  } else if (type === "fix") {                   // reparar herramienta
    const tw = t ? 22 : -12;
    tool = `${armL(10, 26)}${hand(13, 39)}
      <g transform="rotate(${tw} 30 33)">
        ${armR(27, 24, 6, 14)}${hand(30, 37)}
        <rect x="28" y="29" width="4" height="13" fill="#9aa3af"/>
        <path d="M25.5 42 h9 v2.6 h-3.3 v-1.6 h-2.4 v1.6 h-3.3Z" fill="#c3c8cf"/></g>
      <rect x="10" y="44" width="16" height="5" rx="1" fill="#6b7280"/>
      <circle cx="14" cy="46.5" r="2.6" fill="#4a5158"/>`;
  } else {                                       // "wait" — cliente esperando
    const sh = t ? 1 : -1;
    tool = `<g transform="translate(${sh} 0)">
      <rect x="11" y="26" width="22" height="6" rx="3" fill="${p.shirt}"/>
      <rect x="11" y="26" width="22" height="6" rx="3" fill="#00000012"/>
      ${hand(13, 29)}${hand(31, 29)}</g>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VB_W} ${VB_H}">
  <defs>
    <radialGradient id="sk" cx="0.38" cy="0.32" r="0.75">
      <stop offset="0" stop-color="${p.skin}"/><stop offset="1" stop-color="${p.skinS}"/></radialGradient>
    ${G("sh", p.shirt, p.shirtS)}
  </defs>
  <ellipse cx="22" cy="55" rx="12" ry="3.2" fill="#000" opacity=".2"/>
  ${legPair(p)}
  ${torsoOf(p)}
  ${tool}
  <rect x="20" y="19" width="4" height="4" fill="url(#sk)"/>
  ${head(p, 22, type === "read" || type === "fix" ? 15 : 14, false, false)}
</svg>`;
}

function person(key, dir, frame, work = false) {
  const p = PAL[key];
  // Los NPC de estación se dibujan en una POSTURA DE TRABAJO (de frente).
  if (work) return workPose(p, typeof work === "string" ? work : "hammer", frame);

  const side = dir === "s", back = dir === "u";
  const bob = frame === 1 ? -2 : 0;
  const legSw = [7, 0, -7][frame];
  const armSw = [-16, 0, 16][frame];

  const leg = (x, sw) => `<g transform="rotate(${sw} ${x + 3} 40)">
      <rect x="${x}" y="38" width="7" height="15" rx="3.2" fill="${p.pants}"/>
      <rect x="${x - 2}" y="50" width="11" height="5.5" rx="2.5" fill="${p.shoe}"/>
      <rect x="${x - 1}" y="50" width="9" height="1.6" rx="0.8" fill="#ffffff" opacity=".12"/></g>`;

  let legs;
  if (side) legs = `${leg(19, legSw * 0.7)}<g opacity=".82">${leg(21, -legSw * 0.7)}</g>`;
  else legs = `${leg(15, legSw)}${leg(23, -legSw)}`;

  const arm = (x, sw, front) => `<g transform="rotate(${sw} ${x + 3} 25)">
      <rect x="${x}" y="23" width="6.5" height="16" rx="3.2" fill="${front ? p.shirt : p.shirtS}"/>
      <circle cx="${x + 3}" cy="${x < 22 ? 40 : 40}" r="3.3" fill="url(#sk)"/></g>`;

  let arms;
  if (side) {
    arms = `<g transform="rotate(${armSw} 24 25)"><rect x="21" y="23" width="6.5" height="16" rx="3.2" fill="${p.shirt}"/><circle cx="24" cy="40" r="3.3" fill="url(#sk)"/></g>`;
  } else {
    arms = `${arm(9, armSw, true)}${arm(29, -armSw, true)}`;
  }

  const torso = `<rect x="13" y="22" width="18" height="20" rx="6" fill="url(#sh)"/>
    <rect x="13" y="35" width="18" height="3" fill="#000" opacity=".1"/>
    <rect x="14" y="23" width="5" height="18" rx="3" fill="#fff" opacity=".08"/>
    ${(p.acc === "cap" || p.acc === "beardcap") ? `<rect x="16" y="26" width="12" height="15" rx="2" fill="#6b4423" opacity=".92"/><rect x="16" y="26" width="12" height="2" fill="#00000022"/>` : ""}`;

  const headG = head(p, 22, 14, side, back);

  // Sin filtros SVG (feGaussianBlur es lentísimo de rasterizar en móvil).
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VB_W} ${VB_H}">
  <defs>
    <radialGradient id="sk" cx="0.38" cy="0.32" r="0.75">
      <stop offset="0" stop-color="${p.skin}"/><stop offset="1" stop-color="${p.skinS}"/></radialGradient>
    ${G("sh", p.shirt, p.shirtS)}
  </defs>
  <ellipse cx="22" cy="55" rx="12" ry="3.2" fill="#000" opacity=".2"/>
  ${legs}
  <g transform="translate(0 ${bob})">
    ${side ? arms : ""}
    ${torso}
    ${!side ? arms : ""}
    <rect x="20" y="19" width="4" height="4" fill="url(#sk)"/>
    ${headG}
  </g>
</svg>`;
}

// ---------- entorno ----------
function floorTile(v) {
  const base = ["#6f4b2c", "#74512f", "#684628"][v];
  const dark = ["#513620", "#573b22", "#4c331d"][v];
  const knot = v === 2 ? `<ellipse cx="20" cy="16" rx="3" ry="4" fill="${dark}"/><ellipse cx="20" cy="16" rx="1.6" ry="2.4" fill="#5a3a22"/>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <rect width="32" height="32" fill="${base}"/>
    <rect width="32" height="2" fill="#ffffff" opacity=".05"/>
    <rect x="0" width="1.4" height="32" fill="${dark}"/>
    ${[6, 13, 20, 27].map((y) => `<path d="M0 ${y} q16 ${1.5 - Math.random()} 32 0" stroke="#00000018" stroke-width="1" fill="none"/>`).join("")}
    ${knot}
  </svg>`;
}
function wallTile() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 48">
    <defs><linearGradient id="w" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3a2412"/><stop offset="0.35" stop-color="#4a3018"/><stop offset="1" stop-color="#3f2814"/></linearGradient></defs>
    <rect width="32" height="48" fill="url(#w)"/>
    <rect y="8" width="32" height="3" fill="#5a3a1e"/>
    <rect y="11" width="32" height="1.5" fill="#00000030"/>
    <rect y="44" width="32" height="4" fill="#00000040"/>
    ${[0, 8, 16, 24].map((x) => `<rect x="${x}" y="12" width="1" height="36" fill="#00000020"/>`).join("")}
  </svg>`;
}
function rug() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 100">
    <defs><radialGradient id="r" cx="0.5" cy="0.5" r="0.6">
      <stop offset="0" stop-color="#9a3a40"/><stop offset="1" stop-color="#7a2f34"/></radialGradient></defs>
    <rect x="4" y="4" width="142" height="92" rx="12" fill="url(#r)"/>
    <rect x="14" y="14" width="122" height="72" rx="8" fill="none" stroke="#e0a92b" stroke-width="3" opacity=".55"/>
    <rect x="22" y="22" width="106" height="56" rx="6" fill="none" stroke="#e0a92b" stroke-width="1.5" opacity=".35"/>
  </svg>`;
}
function crate() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 44">
    <defs>${G("c", "#9a6a3c", "#6b4423")}</defs>
    <ellipse cx="20" cy="40" rx="17" ry="4" fill="#000" opacity=".22"/>
    <rect x="4" y="6" width="32" height="30" rx="2" fill="url(#c)" stroke="#5a3a1e" stroke-width="2"/>
    <path d="M4 6 L36 36 M36 6 L4 36" stroke="#5a3a1e" stroke-width="2" opacity=".7"/>
    <rect x="4" y="6" width="32" height="5" fill="#b9884e"/>
    <rect x="4" y="34" width="32" height="2" fill="#00000030"/>
  </svg>`;
}
function barrel() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 46">
    <defs>${G("b", "#8a5a30", "#5f3f22")}</defs>
    <ellipse cx="16" cy="42" rx="13" ry="3.6" fill="#000" opacity=".22"/>
    <path d="M4 8 Q1 24 4 40 L28 40 Q31 24 28 8 Q16 4 4 8Z" fill="url(#b)"/>
    <ellipse cx="16" cy="8" rx="12" ry="4" fill="#9a6a3c"/>
    <rect x="3" y="14" width="26" height="3" fill="#3a2412"/><rect x="1.5" y="26" width="29" height="3" fill="#3a2412"/>
    <path d="M8 8 Q6 24 8 38 M16 6 L16 40 M24 8 Q26 24 24 38" stroke="#00000022" stroke-width="1" fill="none"/>
  </svg>`;
}
function planks() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 34">
    <ellipse cx="30" cy="30" rx="27" ry="4" fill="#000" opacity=".2"/>
    ${[0, 1, 2, 3, 4].map((i) => `<rect x="3" y="${24 - i * 4}" width="54" height="4.4" rx="1" fill="${i % 2 ? "#b9884e" : "#a5763f"}" stroke="#6b4423" stroke-width="0.6"/>`).join("")}
    <circle cx="7" cy="22" r="2.2" fill="#5a3a1e"/><circle cx="53" cy="22" r="2.2" fill="#5a3a1e"/>
  </svg>`;
}
function chairDone() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 34 40">
    <defs>${G("cd", "#b9884e", "#8a5a30")}</defs>
    <ellipse cx="17" cy="36" rx="14" ry="3.6" fill="#000" opacity=".2"/>
    <rect x="5" y="4" width="4" height="20" rx="2" fill="url(#cd)"/><rect x="25" y="4" width="4" height="20" rx="2" fill="url(#cd)"/>
    <rect x="5" y="6" width="24" height="3.5" rx="1.5" fill="url(#cd)"/><rect x="5" y="11" width="24" height="3.5" rx="1.5" fill="url(#cd)"/>
    <rect x="4" y="18" width="26" height="5" rx="2" fill="url(#cd)"/>
    <rect x="7" y="23" width="3.5" height="13" rx="1.5" fill="#7a4a24"/><rect x="23" y="23" width="3.5" height="13" rx="1.5" fill="#7a4a24"/>
  </svg>`;
}

export const CHAR_SCALE = 1 / RENDER;   // los sprites de personaje se muestran a esta escala

export function artManifest() {
  const list = [];
  const push = (key, svg) => list.push({ key, svg, w: VB_W, h: VB_H, s: RENDER });

  // El JUGADOR camina en 3 orientaciones (d/u/s), 2 fotogramas cada una.
  for (const dir of ["d", "u", "s"]) for (const f of [0, 1]) push(`pj_${dir}_${f}`, person("pj", dir, f));
  push("pj_idle", person("pj", "d", 1));

  // Los NPC de estación NO caminan: solo postura estática + 2 de trabajo.
  for (const [key, act] of Object.entries(NPC_WORK)) {
    push(`${key}_d_0`, person(key, "d", 0));
    push(`${key}_d_1`, person(key, "d", 1));
    push(`${key}_idle`, person(key, "d", 1));
    push(`${key}_work_0`, person(key, "d", 0, act));
    push(`${key}_work_1`, person(key, "d", 1, act));
  }
  // props: se rasterizan a 1x (tamaño final)
  list.push({ key: "floor0", svg: floorTile(0), w: 32, h: 32, s: 1 });
  list.push({ key: "floor1", svg: floorTile(1), w: 32, h: 32, s: 1 });
  list.push({ key: "floor2", svg: floorTile(2), w: 32, h: 32, s: 1 });
  list.push({ key: "wall", svg: wallTile(), w: 32, h: 48, s: 1 });
  list.push({ key: "rug", svg: rug(), w: 150, h: 100, s: 1 });
  list.push({ key: "crate", svg: crate(), w: 40, h: 44, s: 1 });
  list.push({ key: "barrel", svg: barrel(), w: 32, h: 46, s: 1 });
  list.push({ key: "planks", svg: planks(), w: 60, h: 34, s: 1 });
  list.push({ key: "chair_done", svg: chairDone(), w: 34, h: 40, s: 1 });
  return list.map((it) => {
    const rw = it.w * it.s, rh = it.h * it.s;
    return { key: it.key, rw, rh, svg: it.svg.replace("<svg ", `<svg width="${rw}" height="${rh}" `) };
  });
}

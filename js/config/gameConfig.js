/**
 * gameConfig.js — constantes del juego (solo datos, sin lógica).
 */
export const CONFIG = Object.freeze({
  // Un solo taller compacto que cabe entero en pantalla (cámara fija).
  // VIEW (lienzo) es más ancho que WORLD para llenar mejor las pantallas
  // panorámicas de los móviles; el contenido del taller vive en WORLD y la
  // cámara lo centra, extendiendo el suelo a los lados.
  VIEW: { width: 1200, height: 600, zoom: 1 },
  WORLD: { width: 960, height: 600 },
  PLAYER: { speed: 132 },
  SAVE_KEY: "codecraft-workshop:v4",

  ECONOMY: Object.freeze({
    startCoins: 100,
    // precio de compra a Carlos (materiales que se compran)
    buyPrices: { paint: 8, screws: 5, wood: 6, nails: 4 },
    // recompensa base por vender cada mueble
    sellBase: { Chair: 75, Table: 140, Cabinet: 260 },
    reputationPerOrder: 3,
  }),

  RECIPES: Object.freeze({
    Chair:   { wood: 4, nails: 2 },
    Table:   { wood: 8, nails: 4, screws: 2 },
    Cabinet: { wood: 12, nails: 6, screws: 4, paint: 2 },
    // en la Máquina de Corte se transforman materiales:
    nails:   { input: { wood: 1 }, output: { nails: 3 }, seconds: 4 },
  }),

  CRAFT_SECONDS: Object.freeze({ Chair: 15, Table: 30, Cabinet: 45 }),

  // Nombre en español de cada mueble (las claves internas están en inglés).
  MUEBLE_ES: Object.freeze({ Chair: "Silla", Table: "Mesa", Cabinet: "Armario" }),

  XP: Object.freeze({ perLevel: 260, craft: 100, order: 90, challenge: 50, mvc: 40 }),

  MATERIAL_META: Object.freeze({
    wood:  { name: "Madera",  source: "Resuelve retos de programación en la Mesa de Código." },
    nails: { name: "Clavos",  source: "Fabrícalos en la Máquina de Corte (1 madera → 3 clavos)." },
    metal: { name: "Metal",   source: "Se obtiene al completar pedidos de clientes." },
    screws:{ name: "Tornillos",source: "Cómprale a Carlos en la Tienda." },
    paint: { name: "Pintura", source: "Cómprale a Carlos en la Tienda." },
    core:  { name: "Núcleo",  source: "Resuelve retos de arquitectura MVC en la Mesa de Arquitectura." },
  }),

  PALETTE: Object.freeze({
    floor: 0x9a6c40, floorAlt: 0x8f6238, wall: 0x4a3018, wallTop: 0x33210f,
    gold: 0xe0a92b, cream: 0xf3e6cc, screen: 0x0e3a2e, screenText: 0x7dffb0,
    ok: 0x4c8b3f, bad: 0xb23c2e, byte: 0x4db6e6,
    wood2: 0x8a5a30, metal: 0x6b7280,
  }),
});

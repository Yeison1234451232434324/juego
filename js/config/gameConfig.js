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
  SAVE_KEY: "codecraft-workshop:v5",

  // --- Reglas de gameplay (datos; la lógica vive en BusinessRules) ---
  GAMEPLAY: Object.freeze({
    MAX_ACTIVE_ORDERS: 3,       // trabajos que el jugador puede tener a la vez
    DEBUG_COLLISIONS: false,    // pinta las cajas de colisión en rojo
  }),

  ECONOMY: Object.freeze({
    startCoins: 100,
    // precio de compra a Carlos (materiales que se compran)
    buyPrices: { paint: 8, screws: 5, wood: 6, nails: 4 },
    // recompensa base por vender cada mueble
    sellBase: { Chair: 75, Table: 140, Cabinet: 260 },
    reputationPerOrder: 3,
  }),

  // Receta de cada mueble: SOLO madera y clavos. La madera se consigue con
  // retos de CLASES; los clavos, con retos de PROPIEDADES / MÉTODOS.
  RECIPES: Object.freeze({
    Chair:   { wood: 4, nails: 2 },
    Table:   { wood: 6, nails: 4 },
    Cabinet: { wood: 10, nails: 6 },
  }),

  CRAFT_SECONDS: Object.freeze({ Chair: 12, Table: 20, Cabinet: 30 }),

  // Nombre en español de cada mueble (las claves internas están en inglés).
  MUEBLE_ES: Object.freeze({ Chair: "Silla", Table: "Mesa", Cabinet: "Armario" }),

  XP: Object.freeze({
    perLevel: 260, craft: 100, order: 90, challenge: 50, mvc: 40,
    // Bonus de XP por dificultad del pedido (se suma por unidad pedida).
    difficulty: Object.freeze({ Chair: 0, Table: 20, Cabinet: 40 }),
  }),

  MATERIAL_META: Object.freeze({
    wood:  { name: "Madera",  source: "Resuelve retos de CLASES en la computadora 💻." },
    nails: { name: "Clavos",  source: "Resuelve retos de PROPIEDADES y MÉTODOS en la computadora 💻." },
    metal: { name: "Metal",   source: "Se obtiene al entregar pedidos a los clientes." },
    screws:{ name: "Tornillos",source: "Cómprale a Carlos en la Zona de Mejoras 🏪." },
    paint: { name: "Pintura", source: "Cómprale a Carlos en la Zona de Mejoras 🏪." },
  }),

  PALETTE: Object.freeze({
    floor: 0x9a6c40, floorAlt: 0x8f6238, wall: 0x4a3018, wallTop: 0x33210f,
    gold: 0xe0a92b, cream: 0xf3e6cc, screen: 0x0e3a2e, screenText: 0x7dffb0,
    ok: 0x4c8b3f, bad: 0xb23c2e, byte: 0x4db6e6,
    wood2: 0x8a5a30, metal: 0x6b7280,
  }),
});

# 🪚 CODECRAFT WORKSHOP

**Programa · Consigue materiales · Fabrica · Vende · Mejora**

Videojuego 2D top-down en **un solo taller pequeño y compacto** (cámara fija, se ve todo a la
vez — caminas poco, interactúas mucho). La **programación es la herramienta con la que
progresas**: escribes clases de JavaScript reales en la Mesa de Código; si compilan y cumplen
los requisitos, el taller te entrega materiales. Con esos materiales fabricas muebles, los
vendes a clientes y con el dinero compras mejoras que cambian de verdad cómo se juega.

Un marcador (💡) siempre señala tu siguiente objetivo, así que no te pierdes.

Los conceptos de **POO** y **arquitectura MVC** no son botones de menú: aparecen dentro del
mundo (Mesa de Código, Mesa de Arquitectura, reglas de negocio que bloquean acciones).

---

## Cómo se juega

| Tecla | Acción |
|---|---|
| **WASD / flechas** | Caminar por el taller (cámara que te sigue) |
| **E / Espacio** | Interactuar con la estación o NPC más cercano |
| **TAB** | Mochila (materiales + almacén de muebles) |
| **ESC** | Cerrar |

En móvil/tablet hay un D-pad y un botón **E** en pantalla.

### El ciclo del juego

```
PROGRAMAR  →  OBTENER MATERIALES  →  FABRICAR  →  VENDER  →  GANAR DINERO
   ↑                                                              │
   └──────  DESBLOQUEAR / MEJORAR  ←──────  COMPRAR MEJORAS  ←────┘
```

### Estaciones del taller

| Estación | Qué haces | Concepto |
|---|---|---|
| 🖥️ **Mesa de Código** (BYTE) | Escribes clases JS reales; se validan y te dan materiales | Clases, herencia, encapsulamiento, polimorfismo, abstracción, composición |
| 🏛️ **Mesa de Arquitectura** | Llevas un requerimiento y decides en qué capa MVC va cada cosa | Model / View / Controller |
| 🗂️ **Mesa de Pedidos** (Ana) | Lees documentos de pedidos y los aceptas | Requerimientos funcionales |
| 💰 **Mostrador de Ventas** | Entregas pedidos; validas precios de venta | Regla de negocio: precio > 0 |
| 🔨 **Banco de Carpintería** (Mario) | Fabricas muebles en tiempo real | Regla: no fabricar sin materiales |
| 🪚 **Máquina de Corte** | Transformas 1 madera → 3 clavos | Materiales derivados |
| 🎒 **Estantería / Almacén** | Ves tus materiales y muebles | Inventario (composición) |
| 🏪 **Tienda de Carlos** | Compras materiales y **6 mejoras** que alteran el gameplay | Economía y decisiones |

## Aprendizaje integrado

- **Requerimientos funcionales** (`RF-001…RF-008`): son los pedidos y los proyectos.
  Se completan al hacer la acción real (crear la clase, validar el precio, resolver el flujo MVC).
- **Lógica de negocio**: vive en `js/services/BusinessRules.js` y en las clases del Modelo,
  **nunca en la interfaz**. Si intentas vender a −50 o fabricar sin madera, el sistema lo
  **bloquea de verdad** y te muestra la regla.
- **POO**: la jerarquía `GameEntity → Furniture → Chair/Table/Cabinet` es real. Los retos de
  código te hacen escribir `class Chair`, `extends Furniture`, `setPrice()` con validación,
  `calculateProductionTime()` polimórfico, `class Workshop` compuesto…
- **MVC**: el juego internamente ES MVC (ver `ARCHITECTURE.md`), y además lo enseña en la
  Mesa de Arquitectura como parte del gameplay.

## Tecnologías

HTML5 · CSS3 · JavaScript ES6+ (módulos) · **Phaser 3.80** (incluido en `./vendor/`, sin CDN).
Sin backend · sin frameworks de UI · persistencia con `localStorage`. **100% GitHub Pages.**

## Estructura

```
/
├── index.html · css/game.css · vendor/phaser.min.js
└── js/
    ├── main.js                     (composición)
    ├── config/gameConfig.js
    ├── models/       Player · GameEntity · Furniture · Chair · Table · Cabinet
    │                 Material · Inventory · Order · Customer · Workshop · Worker
    │                 Upgrade · Requirement · Achievement
    ├── services/     EventBus · GameState · BusinessRules · CodeValidator
    │                 ChallengeService · RequirementService · OrderService
    │                 UpgradeService · AchievementService · FurnitureFactory
    │                 SaveManager · AudioManager
    ├── controllers/  Player · Programming · Crafting · Order · Workshop
    │                 Requirement · Upgrade · Game
    ├── views/        HUD · Prompt · Dialogue · Notification · Menu · Touch
    │                 CodingStation · Crafting · Cutter · Inventory · Shop
    │                 Requirement · Sales · Evaluation  (+ ui/Modal, ui/dom)
    └── scenes/       Boot · Menu · Workshop  (Phaser)
```

Ver [`ARCHITECTURE.md`](./ARCHITECTURE.md), [`OOP.md`](./OOP.md) y [`REQUIREMENTS.md`](./REQUIREMENTS.md).

## Ejecutar en local

Necesita un servidor estático (los módulos ES no cargan con `file://`):

```bash
node server.js          # http://localhost:8000
# o:  npx serve .        |   python -m http.server 8000
```

## Publicar en GitHub Pages

1. Crea un repositorio y sube **todos** los archivos (incluida `vendor/`).
2. **Settings → Pages → Deploy from a branch → main → / (root) → Save**.
3. Abre `https://TU_USUARIO.github.io/TU_REPO/`.

Todo usa rutas relativas (`./js`, `./css`, `./vendor`), así que funciona igual en local y en
un subdirectorio de Pages.

## Cómo modificar

| Quiero cambiar… | Archivo |
|---|---|
| Recetas, precios, tiempos, XP | `js/config/gameConfig.js` |
| Reglas de negocio | `js/services/BusinessRules.js` |
| Retos de código y de MVC | `js/services/ChallengeService.js` |
| Requerimientos (RF) | `js/services/RequirementService.js` |
| Mejoras de la tienda | `js/services/UpgradeService.js` |
| Nuevo mueble | crea `js/models/Sofa.js` (`extends Furniture`) y regístralo en `FurnitureFactory.js` |
| Sonido propio | pon archivos en `assets/audio/` y amplía `AudioManager.js` (por defecto los efectos se **sintetizan**) |

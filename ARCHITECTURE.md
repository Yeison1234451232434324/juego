# ARCHITECTURE.md — MVC en CodeCraft Workshop

## El juego ES MVC (no solo lo enseña)

```
   entrada del jugador
   (WASD / E / clic)
          │
 ┌────────▼──────────────────────── VIEW ─────────────────────────────┐
 │  Scenes (Phaser):   BootScene · MenuScene · WorkshopScene          │
 │  Views (HTML/DOM):   HUDView · PromptView · DialogueView           │
 │                      CodingStationView · CraftingView · CutterView  │
 │                      InventoryView · ShopView · RequirementView     │
 │                      SalesView · EvaluationView · NotificationView  │
 └───────────────┬───────────────────────────────▲───────────────────┘
                 │ intención (llamada a método)   │ evento (EventBus)
 ┌───────────────▼──────────────────── CONTROLLER ┴───────────────────┐
 │  GameController  (reloj, día, automatización, logros, autosave)     │
 │  PlayerController · ProgrammingController · CraftingController       │
 │  OrderController · WorkshopController · RequirementController        │
 │  UpgradeController                                                  │
 └───────────────┬───────────────────────────────▲───────────────────┘
                 │ consulta reglas + muta         │ publica hechos
 ┌───────────────▼──────────────────────── MODEL ─┴───────────────────┐
 │  GameState  (única fuente de verdad)                               │
 │  Player · Workshop → Inventory · Worker · (stock) · Order[]         │
 │  Furniture → Chair · Table · Cabinet     (GameEntity abstracta)     │
 │  Material · Customer · Upgrade · Requirement · Achievement          │
 │  Servicios de dominio:                                              │
 │    BusinessRules · CodeValidator · ChallengeService                 │
 │    RequirementService · OrderService · UpgradeService               │
 │    AchievementService · FurnitureFactory · SaveManager              │
 └────────────────────────────────────────────────────────────────────┘
```

## Reglas de la arquitectura (se cumplen en el código)

1. **La lógica de negocio NO está en la interfaz.** Ejemplo prohibido:
   ```js
   button.onclick = () => { if (wood >= 4) wood -= 4; }   // ❌ NUNCA
   ```
   En su lugar: la View llama al Controller; el Controller consulta `BusinessRules` y muta el
   Model.
   ```js
   // CraftingView
   craft: (d) => this.#ctrl.craft(d.type)          // solo delega
   // CraftingController.craft()
   const r = BusinessRules.canCraft(recipe, inventory);   // regla de dominio
   if (!r.ok) return this.#deny(r);
   inventory.consume(recipe); worker.assign(); ...        // muta el Model
   ```
2. **El Model no conoce la View.** Se comunican solo por `EventBus`
   (`bus.emit("state:changed")`, `bus.emit("rule:blocked", rule)`).
3. **La View solo muestra.** No calcula precios, tiempos ni valida materiales.

## Flujo real de "Fabricar una silla"

| Capa | Qué ocurre |
|---|---|
| **PLAYER** | Camina al Banco de Carpintería y pulsa E. |
| **VIEW** | `WorkshopScene` emite `station:open`; `CraftingView` muestra el panel y, al pulsar FABRICAR, llama a `CraftingController.craft("Chair")`. |
| **CONTROLLER** | `craft()` pide a `BusinessRules.canCraft(recipe, inventory)` y `BusinessRules.workerAvailable(worker)`. |
| **MODEL** | Si las reglas pasan: `Inventory.consume(recipe)`, `Worker.assign()`, se crea el *Job*. El `GameController` avanza el Job en `tick(dt)`; al terminar, `Workshop.addStock(...)` y `Player.addXp(100)`. |
| **VIEW** | Los eventos `craft:started` / `craft:progress` / `craft:done` repintan la barra en el mundo, el HUD y las notificaciones. |

## El flujo obligatorio — la lógica de negocio NUNCA vive en la Vista

```
Jugador
  ↓
Vista        (CraftingView, SalesView, RequirementView…) — solo muestra y capta el clic
  ↓
Controlador  (CraftingController, OrderController…) — decide qué hacer
  ↓
Modelo       (Order, Workshop, GameState) — datos
  ↓
BusinessRules  — { ok, reason, rule, fn } · aquí y solo aquí están las reglas
  ↓
Resultado    → la Vista lo muestra
```

Cada método de `BusinessRules` se auto-etiqueta con `fn: "BusinessRules.xxx()"`, que aparece
en el aviso de "regla ejecutada" y en el visualizador **🏗️ Flujo MVC** (`MvcFlowView`).

## Servicios de dominio nuevos

| Servicio | Responsabilidad |
|---|---|
| `QualityService` | Calidad 0-100 de una pieza a partir del progreso real; tramos de recompensa. |
| `KnowledgeService` | Conceptos POO/MVC, progreso, rangos, datos del árbol y de la evaluación. |
| `EventService` | Eventos del taller ocasionales (estado transitorio, no se guarda). |
| `EduPrefs` | Preferencias educativas (`codecraft-workshop:edu`, clave aparte, sin migración). |

## Persistencia — `codecraft-workshop:v5` (esquema **v6**)

`SaveManager` serializa `GameState.toJSON()` a `localStorage` tras cada `state:changed`.
**La clave no cambia**: un guardado v5 se carga sin perder nada; los campos nuevos usan
valores por defecto (migración segura en `Workshop.hydrate` / `Player.hydrate`).

Incluye: jugador (monedas, XP, nivel, reputación, `concepts`, `errors`, `labSolved`,
`coinsEarned`, calidad media), taller (inventario, **piezas con `quality`**, pedidos con
`priority`/`deadline`/`brief`/`pref`), retos resueltos, requerimientos, mejoras, logros,
objetivo y paso del tutorial.

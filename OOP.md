# OOP.md — POO en CodeCraft Workshop

Todo es **código real** de `js/models/`. Además, en la **Mesa de Código** el jugador escribe
estas mismas estructuras y el juego las valida (`js/services/CodeValidator.js`).

## Jerarquía

```
GameEntity            (abstracta — models/GameEntity.js)
 ├── Furniture         (abstracta — models/Furniture.js)
 │    ├── Chair        (+ comfort)   calculateProductionTime() → 15
 │    ├── Table        (+ seats)     calculateProductionTime() → 30
 │    └── Cabinet      (+ doors)     calculateProductionTime() → 45
 ├── Material          (encapsula #quantity ≥ 0)
 ├── Worker            (encapsula #status: idle | busy)
 ├── Customer · Order · Upgrade · Requirement · Achievement
```

## 1. Abstracción

`GameEntity` y `Furniture` no se pueden instanciar; obligan a las subclases.

```js
export class Furniture extends GameEntity {
  constructor(name, price, materials, style) {
    if (new.target === Furniture) throw new Error("Furniture es abstracta.");
    super(name); ...
  }
  calculateProductionTime() { throw new Error("Implementar en la subclase."); }
}
```
**Reto en el juego (nivel 5):** escribe `class Furniture` con un `build()` que lance un `Error`.

## 2. Clases y objetos

```js
const silla = new Chair("rústico");   // objeto
silla.describe();  // 'Chair "Silla" · rústico · $75 · 15s'
```
**Reto (nivel 1):** crea `class Chair` con `name`, `price` y `craft()`. Recompensa: +3 madera.

## 3. Herencia (`extends`, `super`)

```js
export class Chair extends Furniture {
  #comfort;
  constructor(style = "rústico") {
    super("Silla", 75, { wood: 4, nails: 2 }, style);   // constructor de Furniture
    this.#comfort = style === "moderno" ? 8 : 6;
  }
}
```
`Chair` hereda `setPrice()`, `canBuildWith()`, `productionCost()`. Añade `#comfort`.
**Reto (nivel 3):** `class Chair extends Furniture` con `super(...)` y `this.style`.

## 4. Polimorfismo

Un método, varias respuestas según el objeto real:

```js
new Chair().calculateProductionTime();    // 15
new Table().calculateProductionTime();    // 30
new Cabinet().calculateProductionTime();  // 45
```
La `CraftingController` usa ese método sin saber qué subclase es.
**Reto (nivel 4):** implementa `Cabinet.calculateProductionTime()` que devuelva 45.

## 5. Encapsulamiento

El estado interno es privado y solo cambia por métodos que **validan reglas de negocio**:

```js
class Furniture {
  #price;
  setPrice(value) {
    if (typeof value !== "number" || Number.isNaN(value)) return { ok: false, ... };
    if (value <= 0) return { ok: false, reason: "El precio de venta no puede ser ≤ 0." };
    this.#price = Math.round(value);
    return { ok: true };
  }
}
```
En el **Mostrador de Ventas** puedes intentar poner `-20` y el objeto se protege.
`Worker.#status` y `Material.#quantity` encapsulan igual.
**Reto (nivel 2):** `class Table` con `this._price` y `setPrice(newPrice)` que valide `> 0`.

## 6. Composición ("tiene un")

```js
class Workshop {
  #inventory = new Inventory();        // Workshop TIENE un Inventory
  #worker = new Worker("Mario");       //           TIENE un Worker
  #stock = [];                         //           TIENE muebles
  #orders = [];                        //           TIENE pedidos
}
class Order {
  #customer;   // Order TIENE un Customer
  #lines;      //       TIENE productos requeridos
  #notes;      //       TIENE requisitos
}
```
`Inventory` a su vez se compone de `Material`.
**Reto (nivel 6):** `class Workshop` cuyo constructor haga `this.inventory = new Inventory()`,
`this.workers = []`, `this.orders = []`.

## 7. Patrón Factory

```js
FurnitureFactory.create("Cabinet");   // devuelve un Cabinet, sin exponer la clase concreta
```

## Dónde aparece cada concepto en el juego

| Concepto | En el juego |
|---|---|
| Clase / objeto | Reto "SILLA" (nivel 1) + `FurnitureFactory.create()` en cada fabricación |
| Atributo / método | Retos de clase + ficha del concepto en 🧠 Mi conocimiento |
| Encapsulamiento | Reto "precio protegido" + `Furniture.setPrice()` valida `#price` |
| Herencia | Reto "FAMILIA DE MUEBLES" + `class Chair extends Furniture` |
| Polimorfismo | Reto "TIEMPOS DE PRODUCCIÓN" + **demo interactiva** (pestaña 🎭) que ejecuta `calculateProductionTime()` real sobre las 3 clases |
| Abstracción | Reto "MUEBLE ABSTRACTO"; `Furniture` no se instancia sola |
| Composición | Reto "EL TALLER COMO SISTEMA"; `Workshop` TIENE inventario, trabajador y pedidos |
| Factory | `FurnitureFactory` oculta qué subclase se crea |

## 🧠 Mi conocimiento (botón 🧠 del HUD)

- **🌳 Árbol**: `Furniture → Chair / Table / Cabinet` + fichas de los 10 conceptos, que se
  desbloquean **al usarlos de verdad** (retos resueltos, acciones hechas).
- **🧠 Conceptos**: cada ficha → qué es · ejemplo de código · cómo aparece en el juego · cómo
  lo has usado tú. MVC (Vista/Controlador/Modelo/Regla/Requerimientos/Flujo) se aprende HACIENDO.
- **🧪 Laboratorio**: 4 ejercicios de práctica (clase, atributo, método, objeto). Dan XP y
  desbloquean el concepto; **no** dan materiales ni tocan pedidos.
- **📊 Progreso**: estadísticas reales, barras por concepto, rangos y logros.

Los conceptos también se puntúan en la **evaluación final** (nota por concepto + POO global).

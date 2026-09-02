# REQUIREMENTS.md — Requerimientos y reglas de negocio

Los requerimientos son **misiones del juego** (documentos y proyectos). Se completan al
realizar la acción real, no al pulsar un botón. Están en
`js/services/RequirementService.js` y se ven en la **Mesa de Pedidos** y la
**Mesa de Arquitectura**.

## Requerimientos funcionales

| Código | Requerimiento | Regla asociada | Se completa cuando… |
|---|---|---|---|
| RF-001 | Registrar un producto (clase de mueble) | Un producto se define con una clase (name, price, craft()). | Resuelves el reto "SILLA" en la Mesa de Código |
| RF-002 | Crear una familia de muebles | Las subclases heredan de Furniture con extends/super. | Resuelves el reto "FAMILIA DE MUEBLES" |
| RF-003 | Calcular el tiempo de producción | Polimorfismo: calculateProductionTime() por tipo. | Resuelves el reto "TIEMPOS DE PRODUCCIÓN" |
| RF-004 | Modelar el taller como composición | Workshop TIENE Inventory, Workers y Orders. | Resuelves el reto "EL TALLER COMO SISTEMA" |
| RF-005 | Validar el precio de venta | El precio no puede ser ≤ 0. | Resuelves el reto "MESA — precio protegido" |
| RF-006 | Impedir fabricar sin materiales | No se fabrica si el inventario no cubre la receta. | Resuelves el reto "MUEBLE ABSTRACTO" |
| RF-007 | Entregar los pedidos por capas (MVC) | View → Controller → Model. La View no aplica reglas. | Entregas un pedido en el Mostrador (`OrderController.deliver`) |

### Requerimientos por pedido (generados)

Además de los RF globales, **cada pedido** trae sus propios RF y RN, derivados de su producto
y cantidad, consultables con "📋 Ver requerimientos" en 📋 PEDIDOS
(`Order.functionalReqs` / `Order.businessRules`):

- `RF·1` registrar la clase del mueble · `RF·2` atributo propio (respaldo/tablero/puertas) ·
  `RF·3` precio protegido · `RF·4` calcular el tiempo · `RF·5` no fabricar sin materiales ·
  `RF·6` producir N unidades sin exceder materiales (lotes) · `RF·7` familia de muebles (herencia).
- `RN-001…RN-006` = las reglas de `BusinessRules` que se aplicarán, con su método real.

**Trazabilidad** (🔎): para RF-001…RF-007 muestra regla → clase → método → capa → estado
(🟢 cumplido / 🟡 pendiente / 🔴 con errores), calculado con el progreso real.

## Reglas de negocio (dominio) — `js/services/BusinessRules.js`

Cada regla está **implementada de verdad**. Si la violas, la acción se **bloquea** y aparece
un aviso "REGLA DE NEGOCIO" con el texto real.

1. **No se puede fabricar un producto sin materiales suficientes.**
   `BusinessRules.canCraft(recipe, inventory)`
2. **No se puede fabricar una cantidad superior a los materiales disponibles.**
   `BusinessRules.canCraftQuantity(recipe, inventory, qty)`
3. **Un trabajador ocupado no puede aceptar otra tarea.**
   `BusinessRules.workerAvailable(worker)` + `Worker.assign()` (encapsulado)
4. **Un pedido no se completa si la cantidad fabricada < solicitada.**
   `BusinessRules.canDeliver(order)`
5. **No se puede comprar / mejorar sin dinero suficiente.**
   `BusinessRules.canAfford(player, cost)`
6. **El precio de venta no puede ser menor o igual a cero.**
   `BusinessRules.validatePrice(furniture, value)` → `Furniture.setPrice()`

## Requisitos no funcionales

| Código | Descripción | Cómo se cumple |
|---|---|---|
| RNF-001 | Navegadores modernos | HTML5 + ES Modules + Phaser 3 |
| RNF-002 | Compatible con GitHub Pages | Rutas relativas, sin build, Phaser incluido |
| RNF-003 | Arquitectura MVC | `models`/`services` · `controllers` · `views`/`scenes` |
| RNF-004 | POO | Jerarquía `GameEntity → Furniture → …` con `#` privados |
| RNF-005 | Persistencia local | `SaveManager` + `localStorage` (incluye posición del jugador) |
| RNF-006 | Responsive | `Phaser.Scale.FIT` + cámara que sigue al jugador + D-pad táctil |
| RNF-007 | Sin backend | Todo en el navegador; el código del jugador se valida sin servidor |
| RNF-008 | Código modularizado | ~50 archivos, una responsabilidad por archivo |

## Calidad del producto y dificultad

- **Calidad (0-100)** por pieza — `QualityService`: sale de la POO aplicada, los
  requerimientos, las reglas respetadas, los atajos de materiales, el tiempo y los errores.
  Ajusta la recompensa (×0.45 … ×1.35) y la satisfacción del cliente.
- **Dificultad** por producto: 🟢 Silla · 🟡 Mesa · 🔴 Armario. Sube la recompensa
  (presupuesto del cliente) y la XP de entrega (`CONFIG.XP.difficulty`).
- **Producción por lotes**: `CraftingController.craft(type, batch)` encadena las piezas
  respetando materiales, trabajador y reglas.

## Proyecto final

**Hotel Gran Roble** — 6 sillas, 3 mesas, 1 armario. Es el examen: reúne análisis de
requerimientos, reglas de negocio, POO completa (clase, atributos/métodos, encapsulamiento,
herencia, polimorfismo, abstracción/composición), materiales, fabricación y entrega. En 📋
PEDIDOS aparece con su **checklist de 12 pasos** y estado real.

Al entregarlo se abre la **🎓 evaluación final** (`GameController.evaluation()` +
`EvaluationView`): nota por cada concepto de POO y de MVC, y cuatro notas globales —
**POO / MVC / lógica de negocio / calidad del producto** — con nota final y **rango**.

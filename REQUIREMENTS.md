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
| RF-007 | Fabricar una silla (flujo MVC) | View → Controller → Model. La View no aplica reglas. | Resuelves el reto MVC del RF-007 en la Mesa de Arquitectura |
| RF-008 | Procesar los pedidos por capas | La regla de precio vive en el Model, no en la View. | Resuelves el reto MVC del RF-008 |

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

## Proyecto final

**Hotel Gran Roble** — 6 sillas, 3 mesas, 1 armario. Aplica POO + reglas de negocio + MVC +
requerimientos. Al entregarlo se abre la **evaluación final** con métricas reales
(objetos creados, clases implementadas, reglas respetadas, requerimientos, conceptos, tiempo,
estrellas).

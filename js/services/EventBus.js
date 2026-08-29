/**
 * EventBus — canal de eventos Modelo → Vista.
 * El Modelo publica hechos; las Vistas se suscriben. El Modelo nunca conoce a la Vista.
 */
export class EventBus {
  #map = new Map();

  on(evt, fn) {
    (this.#map.get(evt) ?? this.#map.set(evt, new Set()).get(evt)).add(fn);
    return () => this.off(evt, fn);
  }
  off(evt, fn) { this.#map.get(evt)?.delete(fn); }
  emit(evt, data) {
    this.#map.get(evt)?.forEach((fn) => { try { fn(data); } catch (e) { console.error(evt, e); } });
    this.#map.get("*")?.forEach((fn) => fn({ evt, data }));
  }
}

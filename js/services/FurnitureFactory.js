import { Chair } from "../models/Chair.js";
import { Table } from "../models/Table.js";
import { Cabinet } from "../models/Cabinet.js";

/**
 * FurnitureFactory — patrón FACTORY. Centraliza la creación de muebles y oculta
 * qué subclase concreta se instancia.
 */
const REG = { Chair, Table, Cabinet };

export class FurnitureFactory {
  static types() { return Object.keys(REG); }
  static create(type, style) {
    const C = REG[type];
    if (!C) throw new Error(`Mueble desconocido: ${type}`);
    return style ? new C(style) : new C();
  }
}

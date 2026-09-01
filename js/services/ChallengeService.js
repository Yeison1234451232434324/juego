/**
 * ChallengeService — los RETOS DE PRODUCCIÓN de la computadora.
 *
 * Cada reto enseña un concepto de POO con INSTRUCCIONES paso a paso muy
 * explícitas y requisitos verificables. Al resolver un reto, el
 * ProgrammingController entrega materiales para el pedido actual.
 *
 * Los retos NO se agotan: son un grifo de materiales. El servicio los rota,
 * evita repetir el mismo inmediatamente y, si el jugador falla, ofrece OTRO
 * reto del mismo concepto para que nunca quede atrapado.
 *
 * Nota: `class`, `constructor`, `extends`, `super`, `return`, `this`, `new`,
 * `throw` y `true` son de JavaScript. Los nombres (Silla, nombre, fabricar…)
 * están en español.
 */

const inBody = (flat, name, pat) => {
  const m = new RegExp(`${name}\\s*\\([^)]*\\)\\s*\\{([\\s\\S]*?)\\}`, "i").exec(flat);
  return m ? pat.test(m[1]) : false;
};
const hasMethod = (flat, name) =>
  new RegExp(`(^|[^.\\w])${name}\\s*\\([^)]*\\)\\s*\\{`, "i").test(flat);
const hasClass = (flat, name) => new RegExp(`class\\s+${name}\\b`, "i").test(flat);
const assigns = (flat, prop, valPat) =>
  new RegExp(`this\\.${prop}\\s*=\\s*${valPat}`, "i").test(flat);

/** Grupos de retos: cada grupo enseña UN concepto y tiene 1+ variantes. */
export const CHALLENGE_GROUPS = [
  // ────────────────────────────────  CLASE  ────────────────────────────────
  {
    group: "clase", concept: "clase", rf: "RF-001", minLevel: 1,
    variants: [
      {
        id: "clase-silla", product: "Chair",
        title: "RETO DE PRODUCCIÓN — LA SILLA",
        brief: 'BYTE: "Para fabricar una silla, primero define QUÉ ES una silla. Eso es una CLASE: un molde con datos y acciones."',
        objetivo: "Crea la clase Silla con una propiedad y un método.",
        pasos: [
          "1. Escribe una clase llamada Silla:  class Silla { }",
          '2. Dentro del constructor, crea la propiedad nombre:  this.nombre = "Silla";',
          "3. Debajo del constructor, crea un método llamado fabricar().",
          "4. El método fabricar() debe devolver true:  return true;",
          "5. Cuando termines, pulsa EJECUTAR CÓDIGO.",
        ],
        requirements: [
          "Una clase llamada Silla",
          'Propiedad nombre con el valor "Silla"',
          "Método fabricar()",
          "fabricar() devuelve true",
        ],
        starter:
`class Silla {
  constructor() {
    // PASO 2 · this.nombre = "Silla";

  }

  // PASOS 3 y 4 · método fabricar() que devuelva true

}
`,
        ejemplo:
`class Silla {
  constructor() {
    this.nombre = "Silla";
  }

  fabricar() {
    return true;
  }
}
`,
        explainOnFail:
          "Una CLASE es el molde de un objeto. La clase Silla necesita una PROPIEDAD (nombre, que la describe) y un MÉTODO (fabricar, que devuelve true cuando la silla se puede construir).",
        checks: [
          { label: "clase Silla", test: (f) => hasClass(f, "Silla"), error: 'Falta la clase. Empieza con:  class Silla {', hint: "class Silla {" },
          { label: 'propiedad nombre = "Silla"', test: (f) => assigns(f, "nombre", '["’\']?Silla'), error: 'La propiedad nombre debe valer "Silla".', hint: 'En el constructor:  this.nombre = "Silla";' },
          { label: "método fabricar()", test: (f) => hasMethod(f, "fabricar"), error: "Falta el método fabricar().", hint: "fabricar() { ... }" },
          { label: "fabricar() devuelve true", test: (f) => inBody(f, "fabricar", /return\s+true\b/), error: "fabricar() debe devolver true.", hint: "return true;" },
        ],
      },
      {
        id: "clase-mesa", product: "Table",
        title: "RETO DE PRODUCCIÓN — LA MESA",
        brief: 'BYTE: "Otra pieza, mismo concepto. Define la clase Mesa igual que hiciste con la Silla."',
        objetivo: "Crea la clase Mesa con una propiedad y un método.",
        pasos: [
          "1. Escribe una clase llamada Mesa:  class Mesa { }",
          '2. En el constructor, crea la propiedad nombre:  this.nombre = "Mesa";',
          "3. Crea un método llamado fabricar().",
          "4. fabricar() debe devolver true.",
          "5. Pulsa EJECUTAR CÓDIGO.",
        ],
        requirements: [
          "Una clase llamada Mesa",
          'Propiedad nombre con el valor "Mesa"',
          "Método fabricar()",
          "fabricar() devuelve true",
        ],
        starter:
`class Mesa {
  constructor() {
    // this.nombre = "Mesa";

  }

  // método fabricar() que devuelva true

}
`,
        ejemplo:
`class Mesa {
  constructor() {
    this.nombre = "Mesa";
  }

  fabricar() {
    return true;
  }
}
`,
        explainOnFail:
          "Cada mueble es una CLASE: un molde con una propiedad que lo describe (nombre) y un método que dice cómo se fabrica (fabricar).",
        checks: [
          { label: "clase Mesa", test: (f) => hasClass(f, "Mesa"), error: "Falta:  class Mesa {", hint: "class Mesa {" },
          { label: 'propiedad nombre = "Mesa"', test: (f) => assigns(f, "nombre", '["’\']?Mesa'), error: 'this.nombre debe valer "Mesa".', hint: 'this.nombre = "Mesa";' },
          { label: "método fabricar()", test: (f) => hasMethod(f, "fabricar"), error: "Falta fabricar().", hint: "fabricar() { ... }" },
          { label: "fabricar() devuelve true", test: (f) => inBody(f, "fabricar", /return\s+true\b/), error: "fabricar() debe devolver true.", hint: "return true;" },
        ],
      },
      {
        id: "clase-armario", product: "Cabinet",
        title: "RETO DE PRODUCCIÓN — EL ARMARIO",
        brief: 'BYTE: "Mismo concepto, un armario. Define la clase Armario."',
        objetivo: "Crea la clase Armario con una propiedad y un método.",
        pasos: [
          "1. Escribe una clase llamada Armario:  class Armario { }",
          '2. En el constructor:  this.nombre = "Armario";',
          "3. Crea un método fabricar() que haga  return true;",
          "4. Pulsa EJECUTAR CÓDIGO.",
        ],
        requirements: ["Una clase llamada Armario", 'Propiedad nombre con el valor "Armario"', "Método fabricar()", "fabricar() devuelve true"],
        starter:
`class Armario {
  constructor() {
    // this.nombre = "Armario";

  }

  // método fabricar() que devuelva true

}
`,
        ejemplo:
`class Armario {
  constructor() {
    this.nombre = "Armario";
  }

  fabricar() {
    return true;
  }
}
`,
        explainOnFail:
          "Cada mueble es una CLASE: una propiedad que lo describe (nombre) y un método que dice cómo se fabrica (fabricar).",
        checks: [
          { label: "clase Armario", test: (f) => hasClass(f, "Armario"), error: "Falta:  class Armario {", hint: "class Armario {" },
          { label: 'propiedad nombre = "Armario"', test: (f) => assigns(f, "nombre", '["’\']?Armario'), error: 'this.nombre debe valer "Armario".', hint: 'this.nombre = "Armario";' },
          { label: "método fabricar()", test: (f) => hasMethod(f, "fabricar"), error: "Falta fabricar().", hint: "fabricar() { ... }" },
          { label: "fabricar() devuelve true", test: (f) => inBody(f, "fabricar", /return\s+true\b/), error: "fabricar() debe devolver true.", hint: "return true;" },
        ],
      },
    ],
  },

  // ──────────────────────────  ENCAPSULAMIENTO  ────────────────────────────
  {
    group: "encapsulamiento", concept: "encapsulamiento", rf: "RF-005", minLevel: 1,
    variants: [
      {
        id: "encap-precio",
        title: "RETO DE PRODUCCIÓN — PRECIO PROTEGIDO",
        brief: 'BYTE: "El precio NUNCA puede ser negativo. Guárdalo dentro de la clase y créale un método que lo valide antes de cambiarlo."',
        objetivo: "ponerPrecio() solo debe aceptar precios mayores que 0.",
        pasos: [
          "1. La clase Silla ya guarda el precio en this._precio. No lo toques.",
          "2. Dentro de ponerPrecio(nuevo), escribe un if:  if (nuevo > 0) { }",
          "3. Dentro del if, asigna el precio:  this._precio = nuevo;",
          "4. Pulsa EJECUTAR CÓDIGO.",
        ],
        requirements: [
          "Clase llamada Silla",
          "El constructor guarda this._precio",
          "Método ponerPrecio(nuevo)",
          "ponerPrecio solo asigna si nuevo > 0",
        ],
        starter:
`class Silla {
  constructor() {
    this._precio = 0;
  }

  ponerPrecio(nuevo) {
    // PASOS 2 y 3 · si nuevo > 0, haz this._precio = nuevo

  }
}
`,
        ejemplo:
`class Silla {
  constructor() {
    this._precio = 0;
  }

  ponerPrecio(nuevo) {
    if (nuevo > 0) {
      this._precio = nuevo;
    }
  }
}
`,
        explainOnFail:
          "ENCAPSULAR es proteger un dato. El precio vive en this._precio y solo se cambia a través de ponerPrecio(), que comprueba que el nuevo valor sea MAYOR QUE 0 antes de guardarlo.",
        checks: [
          { label: "clase Silla", test: (f) => hasClass(f, "Silla"), error: "Falta:  class Silla {", hint: "class Silla {" },
          { label: "this._precio en el constructor", test: (f) => /this\._precio\s*=/i.test(f), error: "El constructor debe guardar el precio en this._precio.", hint: "this._precio = 0;" },
          { label: "método ponerPrecio(nuevo)", test: (f) => /ponerPrecio\s*\(\s*\w+\s*\)/i.test(f), error: "Falta el método ponerPrecio(nuevo).", hint: "ponerPrecio(nuevo) { ... }" },
          { label: "valida nuevo > 0", test: (f) => inBody(f, "ponerPrecio", />\s*0/) && inBody(f, "ponerPrecio", /this\._precio\s*=\s*nuevo/i), error: "Dentro de ponerPrecio(): if (nuevo > 0) { this._precio = nuevo; }", hint: "if (nuevo > 0) { this._precio = nuevo; }" },
        ],
      },
      {
        id: "encap-stock",
        title: "RETO DE PRODUCCIÓN — STOCK PROTEGIDO",
        brief: 'BYTE: "El stock no puede bajar de cero. Protégelo con un método que valide antes de restar."',
        objetivo: "quitar(n) solo debe restar si queda stock suficiente.",
        pasos: [
          "1. this._stock ya vale 10. No lo toques.",
          "2. Dentro de quitar(n), escribe un if:  if (n <= this._stock) { }",
          "3. Dentro del if:  this._stock = this._stock - n;",
          "4. Pulsa EJECUTAR CÓDIGO.",
        ],
        requirements: [
          "Clase llamada Almacen",
          "El constructor guarda this._stock",
          "Método quitar(n)",
          "quitar solo resta si n <= this._stock",
        ],
        starter:
`class Almacen {
  constructor() {
    this._stock = 10;
  }

  quitar(n) {
    // si n <= this._stock, haz this._stock = this._stock - n

  }
}
`,
        ejemplo:
`class Almacen {
  constructor() {
    this._stock = 10;
  }

  quitar(n) {
    if (n <= this._stock) {
      this._stock = this._stock - n;
    }
  }
}
`,
        explainOnFail:
          "ENCAPSULAR es proteger un dato. El stock vive en this._stock y solo cambia a través de quitar(), que comprueba que haya suficiente ANTES de restar.",
        checks: [
          { label: "clase Almacen", test: (f) => hasClass(f, "Almacen"), error: "Falta:  class Almacen {", hint: "class Almacen {" },
          { label: "this._stock en el constructor", test: (f) => /this\._stock\s*=/i.test(f), error: "El constructor debe guardar this._stock.", hint: "this._stock = 10;" },
          { label: "método quitar(n)", test: (f) => /quitar\s*\(\s*\w+\s*\)/i.test(f), error: "Falta el método quitar(n).", hint: "quitar(n) { ... }" },
          { label: "valida n <= this._stock", test: (f) => inBody(f, "quitar", /<=?\s*this\._stock/i) && inBody(f, "quitar", /this\._stock\s*=/i), error: "Dentro de quitar(): if (n <= this._stock) { this._stock = this._stock - n; }", hint: "if (n <= this._stock) { this._stock = this._stock - n; }" },
        ],
      },
    ],
  },

  // ────────────────────────────────  HERENCIA  ────────────────────────────
  {
    group: "herencia", concept: "herencia", rf: "RF-002", minLevel: 2,
    variants: [
      {
        id: "herencia-silla",
        title: "RETO DE PRODUCCIÓN — FAMILIA DE MUEBLES",
        brief: 'BYTE: "Silla y Mesa comparten nombre y precio. En vez de repetirlo, que HEREDEN de Mueble."',
        objetivo: "Silla debe heredar de Mueble, llamar a super(...) y añadir sus patas.",
        pasos: [
          "1. La clase Mueble ya existe. Su constructor recibe (nombre, precio).",
          '2. Haz que Silla herede:  class Silla extends Mueble {',
          '3. Primera línea del constructor:  super("Silla", 75);',
          "4. Debajo, añade:  this.patas = 4;",
          "5. Pulsa EJECUTAR CÓDIGO.",
        ],
        requirements: [
          "class Silla extends Mueble",
          "El constructor llama a super(...)",
          "Añade la propiedad patas",
        ],
        starter:
`// La clase Mueble ya existe: constructor(nombre, precio)

class Silla extends Mueble {
  constructor() {
    // super("Silla", 75);

    // this.patas = 4;

  }
}
`,
        ejemplo:
`class Silla extends Mueble {
  constructor() {
    super("Silla", 75);
    this.patas = 4;
  }
}
`,
        explainOnFail:
          "HERENCIA: Silla extends Mueble reutiliza lo común. El constructor de Silla debe llamar primero a super(...) para que Mueble prepare nombre y precio, y luego añade lo propio de una silla (las patas).",
        checks: [
          { label: "class Silla extends Mueble", test: (f) => /class\s+Silla\s+extends\s+Mueble\b/i.test(f), error: "Silla debe heredar de Mueble usando extends.", hint: "class Silla extends Mueble {" },
          { label: "llamada a super(...)", test: (f) => /super\s*\([^)]*\)/i.test(f), error: "El constructor de Silla debe llamar a super(...).", hint: 'super("Silla", 75);' },
          { label: "propiedad patas", test: (f) => /this\.patas\s*=/i.test(f), error: "Añade this.patas = 4;", hint: "this.patas = 4;" },
        ],
      },
      {
        id: "herencia-armario",
        title: "RETO DE PRODUCCIÓN — EL ARMARIO HEREDA",
        brief: 'BYTE: "Mismo concepto, otra pieza. Que Armario también herede de Mueble."',
        objetivo: "Armario debe heredar de Mueble, llamar a super(...) y añadir sus puertas.",
        pasos: [
          "1. La clase Mueble ya existe: constructor(nombre, precio).",
          "2. Haz que Armario herede:  class Armario extends Mueble {",
          '3. Primera línea del constructor:  super("Armario", 250);',
          "4. Debajo, añade:  this.puertas = 2;",
          "5. Pulsa EJECUTAR CÓDIGO.",
        ],
        requirements: ["class Armario extends Mueble", "El constructor llama a super(...)", "Añade la propiedad puertas"],
        starter:
`// La clase Mueble ya existe: constructor(nombre, precio)

class Armario extends Mueble {
  constructor() {
    // super("Armario", 250);

    // this.puertas = 2;

  }
}
`,
        ejemplo:
`class Armario extends Mueble {
  constructor() {
    super("Armario", 250);
    this.puertas = 2;
  }
}
`,
        explainOnFail:
          "HERENCIA: Armario extends Mueble reutiliza nombre y precio. super(...) llama al constructor del padre; luego añades lo propio del armario (las puertas).",
        checks: [
          { label: "class Armario extends Mueble", test: (f) => /class\s+Armario\s+extends\s+Mueble\b/i.test(f), error: "Armario debe heredar de Mueble usando extends.", hint: "class Armario extends Mueble {" },
          { label: "llamada a super(...)", test: (f) => /super\s*\([^)]*\)/i.test(f), error: "El constructor debe llamar a super(...).", hint: 'super("Armario", 250);' },
          { label: "propiedad puertas", test: (f) => /this\.puertas\s*=/i.test(f), error: "Añade this.puertas = 2;", hint: "this.puertas = 2;" },
        ],
      },
    ],
  },

  // ──────────────────────────────  POLIMORFISMO  ──────────────────────────
  {
    group: "polimorfismo", concept: "polimorfismo", rf: "RF-003", minLevel: 3,
    variants: [
      {
        id: "poly-tiempo",
        title: "RETO DE PRODUCCIÓN — TIEMPOS DISTINTOS",
        brief: 'BYTE: "El mismo método responde distinto en cada mueble. Un armario tarda 30 segundos."',
        objetivo: "Añade a Armario el método calcularTiempo() para que devuelva 30.",
        pasos: [
          "1. Armario ya hereda de Mueble.",
          "2. Escribe el método:  calcularTiempo() { }",
          "3. Dentro:  return 30;",
          "4. Pulsa EJECUTAR CÓDIGO.",
        ],
        requirements: ["class Armario extends Mueble", "Método calcularTiempo()", "calcularTiempo() devuelve 30"],
        starter:
`class Armario extends Mueble {

  // método calcularTiempo() que devuelva 30

}
`,
        ejemplo:
`class Armario extends Mueble {
  calcularTiempo() {
    return 30;
  }
}
`,
        explainOnFail:
          "POLIMORFISMO: el mismo método (calcularTiempo) existe en varios muebles pero devuelve un valor distinto en cada uno. En Armario debe devolver 30.",
        checks: [
          { label: "class Armario extends Mueble", test: (f) => /class\s+Armario\s+extends\s+Mueble\b/i.test(f), error: "Armario debe heredar de Mueble.", hint: "class Armario extends Mueble {" },
          { label: "método calcularTiempo()", test: (f) => hasMethod(f, "calcularTiempo"), error: "Falta calcularTiempo().", hint: "calcularTiempo() { return 30; }" },
          { label: "devuelve 30", test: (f) => inBody(f, "calcularTiempo", /return\s+30\b/), error: "calcularTiempo() debe devolver 30.", hint: "return 30;" },
        ],
      },
    ],
  },

  // ───────────────────────────────  ABSTRACCIÓN  ─────────────────────────
  {
    group: "abstraccion", concept: "abstracción", rf: "RF-006", minLevel: 4,
    variants: [
      {
        id: "abstract-mueble",
        title: "RETO DE PRODUCCIÓN — MUEBLE ABSTRACTO",
        brief: 'BYTE: "Mueble es la IDEA de mueble: tiene lo común, pero obliga a cada subclase a decir cómo se construye."',
        objetivo: "describir() devuelve un texto; construir() lanza un error.",
        pasos: [
          '1. Dentro de describir(), devuelve un texto:  return "Soy un mueble";',
          '2. Dentro de construir(), lanza un error:  throw new Error("Impleméntalo en la subclase");',
          "3. Pulsa EJECUTAR CÓDIGO.",
        ],
        requirements: ["Clase llamada Mueble", "describir() devuelve un texto", "construir() lanza un Error"],
        starter:
`class Mueble {
  describir() {
    // return "Soy un mueble";

  }

  construir() {
    // throw new Error("...");

  }
}
`,
        ejemplo:
`class Mueble {
  describir() {
    return "Soy un mueble";
  }

  construir() {
    throw new Error("Impleméntalo en la subclase");
  }
}
`,
        explainOnFail:
          "ABSTRACCIÓN: Mueble define lo común (describir) pero construir() lanza un Error para OBLIGAR a cada subclase a implementarlo. No se puede fabricar un 'mueble' genérico.",
        checks: [
          { label: "clase Mueble", test: (f) => hasClass(f, "Mueble"), error: "Falta:  class Mueble {", hint: "class Mueble {" },
          { label: "describir() devuelve un texto", test: (f) => hasMethod(f, "describir") && inBody(f, "describir", /return\s+["'’]/), error: "describir() debe devolver un texto entre comillas.", hint: 'describir() { return "Soy un mueble"; }' },
          { label: "construir() lanza un Error", test: (f) => inBody(f, "construir", /throw\s+new\s+Error/), error: "construir() debe lanzar un Error.", hint: 'construir() { throw new Error("..."); }' },
        ],
      },
    ],
  },

  // ──────────────────────────────  COMPOSICIÓN  ──────────────────────────
  {
    group: "composicion", concept: "composición", rf: "RF-004", minLevel: 5,
    variants: [
      {
        id: "compose-taller",
        title: "RETO DE PRODUCCIÓN — EL TALLER COMO SISTEMA",
        brief: 'BYTE: "Un taller NO es un inventario: TIENE un inventario y una lista de pedidos. Eso es COMPOSICIÓN."',
        objetivo: "En el constructor de Taller, crea el inventario y la lista de pedidos.",
        pasos: [
          "1. La clase Inventario ya existe.",
          "2. En el constructor:  this.inventario = new Inventario();",
          "3. Añade una lista vacía:  this.pedidos = [];",
          "4. Pulsa EJECUTAR CÓDIGO.",
        ],
        requirements: ["Clase llamada Taller", "this.inventario = new Inventario()", "this.pedidos = []"],
        starter:
`// La clase Inventario ya existe.

class Taller {
  constructor() {
    // this.inventario = new Inventario();

    // this.pedidos = [];

  }
}
`,
        ejemplo:
`class Taller {
  constructor() {
    this.inventario = new Inventario();
    this.pedidos = [];
  }
}
`,
        explainOnFail:
          "COMPOSICIÓN: un objeto grande se construye juntando otros. El Taller TIENE un Inventario y una lista de pedidos; no ES ninguno de ellos.",
        checks: [
          { label: "clase Taller", test: (f) => hasClass(f, "Taller"), error: "Falta:  class Taller {", hint: "class Taller {" },
          { label: "this.inventario = new Inventario()", test: (f) => /this\.inventario\s*=\s*new\s+Inventario\s*\(/i.test(f), error: "Compón el Taller con un Inventario.", hint: "this.inventario = new Inventario();" },
          { label: "this.pedidos = []", test: (f) => /this\.pedidos\s*=\s*\[/i.test(f), error: "Falta la lista this.pedidos = [].", hint: "this.pedidos = [];" },
        ],
      },
    ],
  },
];

/** Índice plano id → {challenge, group}. */
const BY_ID = new Map();
for (const g of CHALLENGE_GROUPS) for (const v of g.variants) BY_ID.set(v.id, { v, g });

export class ChallengeService {
  #solvedGroups = new Set();   // grupos con al menos 1 reto resuelto
  #variantIdx = new Map();     // group -> índice de variante actual
  #groupRot = 0;               // rotación entre grupos
  #lastId = null;
  #fails = new Map();          // id -> nº de fallos seguidos
  #totalSolved = 0;

  #groupsForLevel(level) {
    return CHALLENGE_GROUPS.filter((g) => g.minLevel <= Math.max(1, level));
  }

  /** Elige la variante del grupo; si hay una para `product`, esa. */
  #variantOf(g, product) {
    if (product && g.variants.length > 1) {
      const match = g.variants.find((v) => v.product === product);
      if (match) return match;
    }
    const idx = (this.#variantIdx.get(g.group) ?? 0) % g.variants.length;
    return g.variants[idx];
  }

  /**
   * El reto actual. `product` = tipo de mueble del pedido en curso (Chair/Table/
   * Cabinet) para elegir un reto relacionado con ese producto.
   */
  current(level = 1, product = null) {
    const groups = this.#groupsForLevel(level);
    if (!groups.length) return null;

    // Prioridad: grupos que aún no ha resuelto (progresión del currículo).
    const pending = groups.filter((g) => !this.#solvedGroups.has(g.group));
    const pool = pending.length ? pending : groups;

    let pick = pool[this.#groupRot % pool.length];
    let v = this.#variantOf(pick, product);
    if (v.id === this.#lastId && pool.length > 1) {
      pick = pool[(this.#groupRot + 1) % pool.length];
      v = this.#variantOf(pick, product);
    }
    return { ...v, group: pick.group, concept: pick.concept, rf: pick.rf, minLevel: pick.minLevel };
  }

  byId(id) {
    const e = BY_ID.get(id);
    return e ? { ...e.v, group: e.g.group, concept: e.g.concept, rf: e.g.rf, minLevel: e.g.minLevel } : null;
  }

  failCount(id) { return this.#fails.get(id) ?? 0; }

  /** El jugador falló: cuenta el fallo y rota a otro reto del mismo concepto. */
  registerFail(id) {
    this.#fails.set(id, (this.#fails.get(id) ?? 0) + 1);
    this.#lastId = id;
    const e = BY_ID.get(id);
    if (!e) return;
    if (e.g.variants.length > 1) {
      this.#variantIdx.set(e.g.group, (this.#variantIdx.get(e.g.group) ?? 0) + 1);
    } else {
      this.#groupRot++;   // sin otra variante: cambia de tema
    }
  }

  /** El jugador resolvió un reto. */
  registerSolved(id) {
    const e = BY_ID.get(id);
    if (!e) return { firstOfConcept: false, concept: null, rf: null };
    const firstOfConcept = !this.#solvedGroups.has(e.g.group);
    this.#solvedGroups.add(e.g.group);
    this.#fails.delete(id);
    this.#lastId = id;
    this.#variantIdx.set(e.g.group, (this.#variantIdx.get(e.g.group) ?? 0) + 1);
    this.#groupRot++;
    this.#totalSolved++;
    return { firstOfConcept, concept: e.g.concept, rf: e.g.rf };
  }

  conceptsLearned() { return [...this.#solvedGroups].map((g) => CHALLENGE_GROUPS.find((x) => x.group === g)?.concept); }
  groupSolved(group) { return this.#solvedGroups.has(group); }
  doneCount() { return this.#totalSolved; }

  /** Fallos acumulados (esta sesión) en cualquier variante de un grupo. */
  groupFails(group) {
    const g = CHALLENGE_GROUPS.find((x) => x.group === group);
    if (!g) return 0;
    return g.variants.reduce((s, v) => s + (this.#fails.get(v.id) ?? 0), 0);
  }

  hydrate(d) {
    this.#solvedGroups = new Set(d?.solvedGroups ?? []);
    this.#totalSolved = d?.totalSolved ?? this.#solvedGroups.size;
    this.#groupRot = d?.groupRot ?? 0;
  }
  toJSON() {
    return { solvedGroups: [...this.#solvedGroups], totalSolved: this.#totalSolved, groupRot: this.#groupRot };
  }
}

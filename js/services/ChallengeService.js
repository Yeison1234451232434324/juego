/**
 * ChallengeService — los RETOS de programación (Mesa de Código) y de
 * arquitectura (Mesa de Arquitectura).
 *
 * Cada reto de código enseña un concepto de POO con instrucciones paso a paso,
 * requisitos verificables y pistas siempre disponibles. Al resolverlo entrega
 * materiales. Los retos de arquitectura enseñan MVC (Modelo–Vista–Controlador).
 *
 * Nota: las palabras `class`, `constructor`, `extends`, `super`, `return`,
 * `this`, `new` y `throw` son de JavaScript y no se traducen. Todo lo demás
 * (nombres de clases, métodos y propiedades) está en español.
 */

// helper: ¿aparece `pat` dentro del cuerpo del método `name`?
const inMethod = (flat, name, pat) => {
  const m = new RegExp(`${name}\\s*\\([^)]*\\)\\s*\\{([\\s\\S]*?)\\}`, "i").exec(flat);
  return m ? pat.test(m[1]) : false;
};
const hasMethod = (flat, name) => new RegExp(`(^|[^.\\w])${name}\\s*\\([^)]*\\)\\s*\\{`, "i").test(flat);
const hasProp = (flat, name) =>
  new RegExp(`this\\.${name}\\s*=`, "i").test(flat) ||
  new RegExp(`(^|[{;,\\n\\s])${name}\\s*[:=]`, "i").test(flat) ||
  new RegExp(`#?${name}\\s*;`, "i").test(flat);

export const CODE_CHALLENGES = [
  {
    id: "chair", level: 1, concept: "clase", rf: "RF-001",
    title: "PROYECTO: LA SILLA",
    brief: 'BYTE: "Antes de fabricar una silla, hay que decirle al taller qué ES una silla: su nombre, su precio y qué sabe hacer. Eso es una CLASE."',
    objetivo: "Crea la clase Silla con su nombre, su precio y un método para fabricarla.",
    pasos: [
      'El nombre ya está escrito: this.nombre = "Silla";',
      "PASO 1 · Debajo del nombre, escribe el precio:  this.precio = 75;",
      'PASO 2 · Debajo del constructor, añade el método fabricar() que devuelva un texto:  fabricar() { return "silla lista"; }',
    ],
    requirements: ["Una clase llamada Silla", "Propiedad nombre", "Propiedad precio", "Método fabricar()"],
    starter:
`class Silla {
  constructor() {
    this.nombre = "Silla";
    // PASO 1 · escribe aquí:  this.precio = 75;

  }

  // PASO 2 · escribe aquí el método fabricar()

}
`,
    template:
`class Silla {
  constructor() {
    this.nombre = "Silla";
    this.precio = 75;
  }

  fabricar() {
    return "silla lista";
  }
}
`,
    rewards: { wood: 3, nails: 1, xp: 50 },
    checks: [
      { label: "clase Silla", test: (f) => /class\s+Silla\b/i.test(f), error: 'No encuentro "class Silla".', hint: "Escribe en la primera línea:  class Silla {" },
      { label: "propiedad nombre", test: (f) => /this\.nombre\s*=/i.test(f), error: "Falta la propiedad nombre.", hint: 'En el constructor:  this.nombre = "Silla";' },
      { label: "propiedad precio", test: (f) => /this\.precio\s*=/i.test(f), error: "Falta la propiedad precio.", hint: "En el constructor, debajo del nombre:  this.precio = 75;" },
      { label: "método fabricar()", test: (f) => hasMethod(f, "fabricar"), error: "No encuentro el método fabricar().", hint: 'Debajo del constructor:  fabricar() { return "silla lista"; }' },
    ],
  },

  {
    id: "table", level: 2, concept: "encapsulamiento", rf: "RF-005",
    title: "PROYECTO: LA MESA — precio protegido",
    brief: 'BYTE: "El precio nunca puede ser 0 ni negativo. Guárdalo en _precio y créale un método que lo valide antes de cambiarlo. Eso es ENCAPSULAR."',
    objetivo: "Haz que ponerPrecio() solo acepte precios mayores que 0.",
    pasos: [
      "El constructor ya guarda el precio en this._precio. No lo toques.",
      "PASO 1 · Dentro de ponerPrecio(nuevo), escribe un if que compruebe:  if (nuevo > 0) { ... }",
      "PASO 2 · Dentro de ese if, asigna el nuevo precio:  this._precio = nuevo;",
    ],
    requirements: ["Una clase llamada Mesa", "El constructor guarda this._precio", "Método ponerPrecio(nuevo)", "ponerPrecio solo acepta valores mayores que 0"],
    starter:
`class Mesa {
  constructor() {
    this._precio = 100;
  }

  ponerPrecio(nuevo) {
    // PASO 1 y 2 · si nuevo > 0, haz this._precio = nuevo

  }
}
`,
    template:
`class Mesa {
  constructor() {
    this._precio = 100;
  }

  ponerPrecio(nuevo) {
    if (nuevo > 0) {
      this._precio = nuevo;
    }
  }

  obtenerPrecio() {
    return this._precio;
  }
}
`,
    rewards: { wood: 4, nails: 2, xp: 60 },
    checks: [
      { label: "clase Mesa", test: (f) => /class\s+Mesa\b/i.test(f), error: 'No encuentro "class Mesa".', hint: "class Mesa {" },
      { label: "this._precio en el constructor", test: (f) => /this\._precio\s*=/i.test(f), error: "El constructor debe guardar el precio en this._precio.", hint: "constructor() { this._precio = 100; }" },
      { label: "método ponerPrecio(nuevo)", test: (f) => /ponerPrecio\s*\(\s*\w+\s*\)/i.test(f), error: "Falta el método ponerPrecio(nuevo).", hint: "ponerPrecio(nuevo) { ... }" },
      { label: "valida que nuevo sea mayor que 0", test: (f) => inMethod(f, "ponerPrecio", />\s*0/), error: "ponerPrecio() no valida el precio: debe comprobar que nuevo sea mayor que 0.", hint: "if (nuevo > 0) { this._precio = nuevo; }" },
    ],
  },

  {
    id: "inherit", level: 3, concept: "herencia", rf: "RF-002",
    title: "PROYECTO: FAMILIA DE MUEBLES",
    brief: 'BYTE: "Silla, Mesa y Armario comparten nombre y precio. En vez de repetirlo, que HEREDEN de Mueble."',
    objetivo: "Haz que Silla herede de Mueble, llame a super(...) y añada su propio estilo.",
    pasos: [
      "La clase Mueble ya existe. Su constructor recibe (nombre, precio).",
      'PASO 1 · Como primera línea del constructor de Silla, llama a la clase padre:  super("Silla", 75);',
      "PASO 2 · Debajo, guarda el estilo que llega por parámetro:  this.estilo = estilo;",
    ],
    requirements: ["class Silla extends Mueble", "El constructor llama a super(...)", "Añade la propiedad estilo"],
    starter:
`// La clase Mueble ya existe. Su constructor recibe (nombre, precio).

class Silla extends Mueble {
  constructor(estilo) {
    // PASO 1 · llama a la clase padre:  super("Silla", 75);

    // PASO 2 · guarda el estilo:  this.estilo = estilo;

  }
}
`,
    template:
`class Silla extends Mueble {
  constructor(estilo) {
    super("Silla", 75);
    this.estilo = estilo;
  }
}
`,
    rewards: { wood: 3, metal: 1, xp: 70 },
    checks: [
      { label: "class Silla extends Mueble", test: (f) => /class\s+Silla\s+extends\s+Mueble\b/i.test(f), error: "Silla debe heredar de Mueble usando extends.", hint: "class Silla extends Mueble {" },
      { label: "llamada a super(...)", test: (f) => /super\s*\([^)]*\)/i.test(f), error: "El constructor de Silla debe llamar a super(...) en la primera línea.", hint: 'super("Silla", 75);' },
      { label: "propiedad estilo", test: (f) => /this\.estilo\s*=/i.test(f), error: "Silla debe añadir la propiedad estilo.", hint: "this.estilo = estilo;" },
    ],
  },

  {
    id: "poly", level: 4, concept: "polimorfismo", rf: "RF-003",
    title: "PROYECTO: TIEMPOS DE PRODUCCIÓN",
    brief: 'BYTE: "El mismo método puede responder distinto en cada mueble. Un armario tarda 45 segundos en fabricarse. Eso es POLIMORFISMO."',
    objetivo: "Añade a Armario el método calcularTiempo() para que devuelva 45.",
    pasos: [
      "Armario ya hereda de Mueble (está escrito).",
      "PASO 1 · Dentro de la clase, escribe el método:  calcularTiempo() { }",
      "PASO 2 · Dentro del método:  return 45;",
    ],
    requirements: ["class Armario extends Mueble", "Método calcularTiempo()", "calcularTiempo() devuelve 45"],
    starter:
`class Armario extends Mueble {

  // PASO 1 y 2 · método calcularTiempo() que haga  return 45;

}
`,
    template:
`class Armario extends Mueble {
  calcularTiempo() {
    return 45;
  }
}
`,
    rewards: { wood: 5, screws: 2, xp: 80 },
    checks: [
      { label: "class Armario extends Mueble", test: (f) => /class\s+Armario\s+extends\s+Mueble\b/i.test(f), error: "Armario debe heredar de Mueble.", hint: "class Armario extends Mueble {" },
      { label: "método calcularTiempo()", test: (f) => hasMethod(f, "calcularTiempo"), error: "Falta el método calcularTiempo().", hint: "calcularTiempo() { return 45; }" },
      { label: "devuelve 45", test: (f) => inMethod(f, "calcularTiempo", /return\s+45\b/), error: "calcularTiempo() debe devolver 45.", hint: "return 45;" },
    ],
  },

  {
    id: "abstract", level: 5, concept: "abstracción", rf: "RF-006",
    title: "PROYECTO: EL MUEBLE ABSTRACTO",
    brief: 'BYTE: "Mueble es la IDEA general de mueble. Tiene lo común (describir), pero obliga a cada subclase a definir cómo se construye. Eso es ABSTRACCIÓN."',
    objetivo: "describir() devuelve un texto común; construir() lanza un error para obligar a las subclases.",
    pasos: [
      'PASO 1 · Dentro de describir(), devuelve un texto común:  return "Soy un mueble";',
      'PASO 2 · Dentro de construir(), lanza un error:  throw new Error("Impleméntalo en la subclase");',
    ],
    requirements: ["Una clase llamada Mueble", "Método describir() con un return", "construir() lanza un Error"],
    starter:
`class Mueble {
  describir() {
    // PASO 1 · devuelve un texto común

  }

  construir() {
    // PASO 2 · throw new Error("...")

  }
}
`,
    template:
`class Mueble {
  constructor(nombre) {
    this.nombre = nombre;
  }

  describir() {
    return "Soy un mueble: " + this.nombre;
  }

  construir() {
    throw new Error("Método abstracto: impleméntalo en la subclase");
  }
}
`,
    rewards: { core: 1, wood: 3, xp: 90 },
    checks: [
      { label: "clase Mueble", test: (f) => /class\s+Mueble\b/i.test(f), error: 'No encuentro "class Mueble".', hint: "class Mueble {" },
      { label: "método describir() con return", test: (f) => hasMethod(f, "describir") && inMethod(f, "describir", /return\s+/), error: "describir() debe existir y devolver un texto con return.", hint: 'describir() { return "Soy un mueble"; }' },
      { label: "construir() lanza un Error", test: (f) => inMethod(f, "construir", /throw\s+new\s+Error/), error: "construir() debe lanzar un Error para obligar a las subclases a implementarlo.", hint: 'construir() { throw new Error("Impleméntalo en la subclase"); }' },
    ],
  },

  {
    id: "compose", level: 6, concept: "composición", rf: "RF-004",
    title: "PROYECTO: EL TALLER COMO SISTEMA",
    brief: 'BYTE: "Un taller NO es un inventario: TIENE un inventario, trabajadores y pedidos. Construir algo grande juntando piezas es COMPOSICIÓN."',
    objetivo: "En el constructor de Taller, crea el inventario y dos listas vacías.",
    pasos: [
      "La clase Inventario ya existe.",
      "PASO 1 · En el constructor:  this.inventario = new Inventario();",
      "PASO 2 · Añade dos listas vacías:  this.trabajadores = [];  y  this.pedidos = [];",
    ],
    requirements: ["Una clase llamada Taller", "this.inventario = new Inventario()", "this.trabajadores = []", "this.pedidos = []"],
    starter:
`// La clase Inventario ya existe.

class Taller {
  constructor() {
    // PASO 1 · this.inventario = new Inventario();

    // PASO 2 · this.trabajadores = [];  y  this.pedidos = [];

  }
}
`,
    template:
`class Taller {
  constructor() {
    this.inventario = new Inventario();
    this.trabajadores = [];
    this.pedidos = [];
  }
}
`,
    rewards: { core: 1, metal: 2, xp: 100 },
    checks: [
      { label: "clase Taller", test: (f) => /class\s+Taller\b/i.test(f), error: 'No encuentro "class Taller".', hint: "class Taller {" },
      { label: "this.inventario = new Inventario()", test: (f) => /this\.inventario\s*=\s*new\s+Inventario\s*\(/i.test(f), error: "Taller debe COMPONERSE con un Inventario.", hint: "this.inventario = new Inventario();" },
      { label: "this.trabajadores = []", test: (f) => /this\.trabajadores\s*=\s*\[/i.test(f), error: "Falta la lista this.trabajadores = [].", hint: "this.trabajadores = [];" },
      { label: "this.pedidos = []", test: (f) => /this\.pedidos\s*=\s*\[/i.test(f), error: "Falta la lista this.pedidos = [].", hint: "this.pedidos = [];" },
    ],
  },
];

/**
 * Retos de ARQUITECTURA (Mesa de Arquitectura). MVC como parte del gameplay:
 * el jugador lleva un requerimiento y decide en qué capa va cada cosa.
 */
export const MVC_CHALLENGES = [
  {
    id: "mvc-rf007", rf: "RF-007", concept: "MVC",
    requirement: 'RF-007 — "El sistema debe permitir fabricar una silla."',
    steps: [
      { q: "El jugador pulsa el botón «Fabricar». ¿Quién recibe primero esa acción?",
        options: ["El Modelo", "La Vista", "La base de datos"], correct: 1,
        explain: "La Vista capta lo que hace el usuario y se lo pasa al Controlador. Ella no decide nada." },
      { q: "¿Dónde se procesa la acción de fabricar (aplicar reglas, coordinar el trabajo)?",
        options: ["En la Vista", "En el Controlador", "En el Modelo"], correct: 1,
        explain: "El Controlador (el de fabricación) recibe la orden y organiza la operación." },
      { q: "¿Dónde se guarda el estado de la silla y del inventario?",
        options: ["En la Vista", "En el Controlador", "En el Modelo"], correct: 2,
        explain: "El Modelo (Silla, Inventario, Taller) guarda el estado y las reglas del negocio." },
    ],
    rewards: { core: 2, xp: 120 },
  },
  {
    id: "mvc-rf005", rf: "RF-008", concept: "MVC",
    requirement: 'RF-008 — "El sistema debe validar el precio de venta."',
    steps: [
      { q: "La regla «el precio no puede ser menor o igual a 0», ¿en qué capa vive?",
        options: ["En la Vista", "En el Modelo (reglas de negocio)", "En el CSS"], correct: 1,
        explain: "Las reglas de negocio viven en el Modelo (las validaciones de dominio, el método ponerPrecio)." },
      { q: "Si el jugador escribe un precio inválido, ¿qué hace la Vista?",
        options: ["Corrige el precio ella misma", "Muestra el mensaje de error que le devuelve el Controlador", "Ignora el error"], correct: 1,
        explain: "La Vista solo muestra; la validación la hizo el Modelo y se la pasó a través del Controlador." },
    ],
    rewards: { core: 2, xp: 100 },
  },
];

export class ChallengeService {
  #done = new Set();          // ids de retos de código resueltos
  #mvcDone = new Set();       // ids de retos MVC resueltos

  codeChallenges() { return CODE_CHALLENGES; }
  mvcChallenges() { return MVC_CHALLENGES; }

  /** Reto de código disponible según el nivel del jugador. */
  currentCodeChallenge(level) {
    return CODE_CHALLENGES.find((c) => {
      if (this.#done.has(c.id)) return false;
      return c.level <= level + 1;
    }) ?? CODE_CHALLENGES.find((c) => !this.#done.has(c.id)) ?? null;
  }

  currentMvcChallenge() {
    return MVC_CHALLENGES.find((c) => !this.#mvcDone.has(c.id)) ?? null;
  }

  isDone(id) { return this.#done.has(id) || this.#mvcDone.has(id); }
  markDone(id) { this.#done.add(id); }
  markMvcDone(id) { this.#mvcDone.add(id); }
  doneCount() { return this.#done.size + this.#mvcDone.size; }

  hydrate(d) {
    this.#done = new Set(d?.code ?? []);
    this.#mvcDone = new Set(d?.mvc ?? []);
  }
  toJSON() { return { code: [...this.#done], mvc: [...this.#mvcDone] }; }
}

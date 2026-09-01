/**
 * CodeValidator — SERVICIO DE DOMINIO que valida el código JavaScript que el
 * jugador escribe en la Mesa de Código.
 *
 * Estrategia (sin backend, segura):
 *  1. Comprobación de sintaxis con `new Function(code)` SOLO para compilar
 *     (nunca se ejecuta) — si el código tiene un error de sintaxis, lanza aquí.
 *  2. Validadores específicos por ejercicio mediante análisis de texto /
 *     expresiones regulares (no se ejecuta código del jugador).
 *
 * Devuelve: { ok, syntaxError, passed:[label], failed:[{label, error, hint}] }
 */
export class CodeValidator {
  /**
   * Normaliza el código para que las regex sean estables:
   * quita comentarios (para que un `// this.precio = 75` NO cuente como hecho)
   * y colapsa los espacios.
   */
  static #flatten(code) {
    return String(code ?? "")
      .replace(/\r/g, "")
      .replace(/\/\*[\s\S]*?\*\//g, " ")   // comentarios de bloque
      .replace(/\/\/[^\n]*/g, " ")          // comentarios de línea
      .replace(/[ \t]+/g, " ")
      .trim();
  }

  /** Traduce los mensajes de error del motor de JavaScript al español. */
  static #traducir(msg) {
    const m = String(msg || "");
    if (/Unexpected end of input|missing \) after|Unexpected token '?\}'?/i.test(m))
      return "Te falta cerrar una llave } o un paréntesis ). Revisa que cada { tenga su }.";
    if (/Unexpected token/i.test(m))
      return "Hay un símbolo fuera de lugar. Revisa llaves { }, paréntesis ( ), comas y punto y coma.";
    if (/Unexpected identifier|Unexpected string|Unexpected number/i.test(m))
      return "Falta algo entre dos palabras (quizá un operador, una coma o un punto y coma).";
    if (/is not defined/i.test(m))
      return "Usaste un nombre que no existe. Revisa que esté bien escrito.";
    if (/Identifier '.*' has already been declared/i.test(m))
      return "Declaraste dos veces el mismo nombre.";
    return "Hay un error de escritura en el código. Revisa llaves { }, paréntesis ( ), comillas \" \" y comas.";
  }

  /** Comprobación de sintaxis: compila (no ejecuta). */
  static checkSyntax(code) {
    try {
      // eslint-disable-next-line no-new-func
      new Function(`${code}\n;`);   // solo compila; jamás se invoca
      return { ok: true, message: "" };
    } catch (e) {
      return { ok: false, message: CodeValidator.#traducir(e.message) };
    }
  }

  /**
   * @param {string} code
   * @param {{label:string, test:(flat:string, raw:string)=>boolean, error:string, hint:string}[]} checks
   * @param {boolean} showHints  (mejora "Analizador de código")
   */
  static validate(code, checks, showHints = false) {
    const raw = String(code ?? "");
    const flat = CodeValidator.#flatten(code);

    if (!flat) {
      return { ok: false, syntaxError: "", passed: [], failed: [{ label: "código", error: "El editor está vacío.", hint: "Escribe el código del reto." }] };
    }

    const syntax = CodeValidator.checkSyntax(raw);
    if (!syntax.ok) {
      return {
        ok: false, syntaxError: syntax.message, passed: [],
        failed: [{ label: "escritura del código", error: syntax.message, hint: "Compara tu código con los PASOS de arriba, línea por línea." }],
      };
    }

    const passed = [], failed = [];
    for (const c of checks) {
      let ok = false;
      try { ok = !!c.test(flat, raw); } catch { ok = false; }
      if (ok) passed.push(c.label);
      else failed.push({ label: c.label, error: c.error, hint: showHints ? c.hint : "" });
    }
    return { ok: failed.length === 0, syntaxError: "", passed, failed };
  }

  /**
   * DEBUGGER educativo: localiza el PRIMER problema del código y lo explica.
   * Nunca resuelve el reto; solo señala dónde y por qué falla.
   * @returns {{line:number, col:number, snippet:string, problem:string, concept:string, hint:string}|null}
   */
  static diagnose(code, checks = [], challenge = null) {
    const raw = String(code ?? "").replace(/\r/g, "");
    const lines = raw.split("\n");
    const conceptLabel = ({
      clase: "🧩 Clases", encapsulamiento: "🔐 Encapsulamiento", herencia: "🧬 Herencia",
      polimorfismo: "🎭 Polimorfismo", abstracción: "🧱 Abstracción", composición: "🧩 Composición",
    })[challenge?.concept] ?? "🧩 Programación";

    const at = (i, col, problem, hint) => ({
      line: i + 1, col: Math.max(1, col),
      snippet: (lines[i] ?? "").trimEnd(),
      problem, concept: conceptLabel,
      hint: hint || checks.find((c) => c.hint)?.hint || "",
    });

    // 1) asignación sin valor:  this.precio = ;   |   const x =
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(/=\s*(;|$)/);
      if (m && !/[=!<>]=/.test(lines[i].slice(0, m.index + 1))) {
        return at(i, m.index + 2, "Falta un valor a la derecha del `=`. No hay nada que asignar.",
          "Escribe el valor después del `=` (por ejemplo un número, un texto entre comillas o un parámetro).");
      }
    }

    // 2) return sin valor cuando el reto pide devolver algo
    if (/devuelv|return true|return this/i.test(JSON.stringify(checks))) {
      for (let i = 0; i < lines.length; i++) {
        if (/\breturn\s*;/.test(lines[i])) {
          return at(i, lines[i].indexOf("return") + 1, "`return` no devuelve ningún valor.",
            "Pon el valor justo después de `return` (por ejemplo `return true;`).");
        }
      }
    }

    // 3) llaves / paréntesis descompensados
    const pairs = { "}": "{", ")": "(" };
    const stack = [];
    for (let i = 0; i < lines.length; i++) {
      for (let j = 0; j < lines[i].length; j++) {
        const ch = lines[i][j];
        if (ch === "{" || ch === "(") stack.push({ ch, i, j });
        else if (ch === "}" || ch === ")") {
          const top = stack.pop();
          if (!top || top.ch !== pairs[ch]) {
            return at(i, j + 1, `Hay un \`${ch}\` que no corresponde a ninguna apertura.`,
              "Revisa que cada `{` tenga su `}` y cada `(` su `)`, en el orden correcto.");
          }
        }
      }
    }
    if (stack.length) {
      const o = stack[0];
      return at(o.i, o.j + 1, `Falta cerrar este \`${o.ch}\`.`,
        `Añade el \`${o.ch === "{" ? "}" : ")"}\` que falta.`);
    }

    // 4) error de sintaxis genérico (compila y falla)
    const s = CodeValidator.checkSyntax(raw);
    if (!s.ok) {
      const i = Math.max(0, lines.map((l) => l.trim()).lastIndexOf("") - 1);
      return at(Math.min(i, lines.length - 1), 1, s.message,
        "Compara tu código con los PASOS del reto, línea por línea.");
    }

    // 5) compila pero no cumple un requisito: señala el concepto
    const firstFail = checks.find((c) => {
      try { return !c.test(CodeValidator.#flatten(raw), raw); } catch { return true; }
    });
    if (firstFail) {
      return {
        line: 0, col: 0, snippet: "",
        problem: `Aún no se cumple: ${firstFail.label}. ${firstFail.error}`,
        concept: conceptLabel,
        hint: firstFail.hint || "Vuelve a leer el PASO correspondiente del reto.",
      };
    }
    return null;
  }
}

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
}

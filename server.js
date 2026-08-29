/**
 * Servidor estático mínimo (sin dependencias) para desarrollo local.
 * Uso:  node server.js       ->  http://localhost:8000
 * No es necesario para GitHub Pages; solo para probar el juego en tu PC.
 */
const http = require("http");
const fs = require("fs");
const path = require("path");

const PUERTO = process.env.PORT || 8000;
const RAIZ = __dirname;

const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

http.createServer((req, res) => {
  let ruta = decodeURIComponent(req.url.split("?")[0]);
  if (ruta === "/") ruta = "/index.html";

  const archivo = path.join(RAIZ, path.normalize(ruta));
  if (!archivo.startsWith(RAIZ)) {
    res.writeHead(403).end("Prohibido");
    return;
  }

  fs.readFile(archivo, (err, datos) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("404 - No encontrado: " + ruta);
      return;
    }
    res.writeHead(200, {
      "Content-Type": TIPOS[path.extname(archivo)] || "application/octet-stream",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    });
    res.end(datos);
  });
}).listen(PUERTO, () => {
  console.log(`Mercado de Artesanías corriendo en  http://localhost:${PUERTO}`);
  console.log("Pulsa Ctrl+C para detener.");
});

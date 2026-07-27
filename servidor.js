/**
 * Servidor de Toxichat (app completa).
 * Ejecutar desde la ra├¡z del proyecto:
 *   node servidor.js
 * Luego abre: http://localhost:3000
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const PUERTO = Number(process.env.PORT) || 3000;
const CARPETA = __dirname;

const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

const servidor = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  let rutaRelativa = decodeURIComponent(url.pathname);
  if (rutaRelativa === "/") rutaRelativa = "/index.html";

  const rutaAbsoluta = path.normalize(path.join(CARPETA, rutaRelativa));
  if (!rutaAbsoluta.startsWith(CARPETA)) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Prohibido");
    return;
  }

  fs.readFile(rutaAbsoluta, (error, datos) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("No encontrado: " + rutaRelativa);
      return;
    }
    const ext = path.extname(rutaAbsoluta).toLowerCase();
    res.writeHead(200, { "Content-Type": TIPOS[ext] || "application/octet-stream" });
    res.end(datos);
  });
});

servidor.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`\n Error: El puerto ${PUERTO} ya está en uso por otro proceso.`);
    console.error(` Puedes liberar el puerto 3000 o iniciar en otro puerto especificando PORT=3001 (ej: $env:PORT=3001; node servidor.js)\n`);
  } else {
    console.error("Error en el servidor:", error);
  }
});

servidor.listen(PUERTO, () => {
  console.log(`Toxichat en http://localhost:${PUERTO}`);
});

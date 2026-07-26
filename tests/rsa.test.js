/**
 * Pruebas del módulo RSA de Toxichat.
 */

const path = require("path");
const crypto = require(path.join(__dirname, "..", "Criptografia", "critografia.js"));

let pasaron = 0;
let fallaron = 0;

function afirmar(condicion, nombre) {
  if (condicion) {
    console.log("OK  ", nombre);
    pasaron += 1;
  } else {
    console.log("FAIL", nombre);
    fallaron += 1;
  }
}

function afirmarIgual(obtenido, esperado, nombre) {
  const ok = obtenido === esperado;
  afirmar(ok, nombre);
  if (!ok) {
    console.log("     esperado:", String(esperado));
    console.log("     obtenido:", String(obtenido));
  }
}

console.log("=== Tests RSA Toxichat ===\n");

// Utilidades
afirmar(crypto.esPrimo(1000000007n) === true, "P es primo");
afirmar(crypto.esPrimo(1000000009n) === true, "Q es primo");
afirmar(crypto.esPrimo(15n) === false, "15 no es primo");
afirmarIgual(crypto.maximoComunDivisor(48n, 18n), 6n, "mcd(48, 18) = 6");
afirmarIgual(crypto.potenciaModular(2n, 10n, 1000n), 24n, "2^10 mod 1000 = 24");

// Claves fijas del proyecto
afirmarIgual(crypto.P, 1000000007n, "constante P");
afirmarIgual(crypto.Q, 1000000009n, "constante Q");
afirmar(crypto.CLAVE_PUBLICA.n === crypto.P * crypto.Q, "n = P * Q");
afirmar(
  crypto.maximoComunDivisor(crypto.CLAVE_PUBLICA.e, (crypto.P - 1n) * (crypto.Q - 1n)) === 1n,
  "e es coprimo con fi(n)"
);

// Inverso: (e * d) mod fi(n) = 1
const fiDeN = (crypto.P - 1n) * (crypto.Q - 1n);
afirmarIgual(
  (crypto.CLAVE_PUBLICA.e * crypto.CLAVE_PRIVADA.d) % fiDeN,
  1n,
  "(e * d) mod fi(n) = 1"
);

// Cifrado / descifrado de un número
const mensaje = 72n; // 'H'
const cifrado = crypto.cifrarNumero(mensaje);
const recuperado = crypto.descifrarNumero(cifrado);
afirmarIgual(recuperado, mensaje, "cifrarNumero/descifrarNumero recuperan m");
afirmar(cifrado !== mensaje, "el cifrado no es el mensaje en claro");

// Texto completo
const texto = "Hola Toxichat";
const bloques = crypto.cifrarTexto(texto);
const textoRecuperado = crypto.descifrarTexto(bloques);
afirmarIgual(textoRecuperado, texto, "cifrarTexto/descifrarTexto recuperan el texto");
afirmar(Array.isArray(bloques), "cifrarTexto devuelve un arreglo");
afirmar(bloques.length === texto.length, "un bloque cifrado por carácter");

// Texto vacío
afirmarIgual(crypto.descifrarTexto(crypto.cifrarTexto("")), "", "texto vacío");

// clavePublicaParaBd serializa BigInt a texto
const publicaBd = crypto.clavePublicaParaBd();
afirmar(typeof publicaBd.e === "string" && typeof publicaBd.n === "string", "clavePublicaParaBd usa strings");
afirmarIgual(publicaBd.e, String(crypto.CLAVE_PUBLICA.e), "clavePublicaParaBd.e coincide");
afirmarIgual(publicaBd.n, String(crypto.CLAVE_PUBLICA.n), "clavePublicaParaBd.n coincide");

// generarClaves con primos inválidos
let lanzoError = false;
try {
  crypto.generarClaves(4n, 9n);
} catch (error) {
  lanzoError = true;
}
afirmar(lanzoError, "generarClaves rechaza no primos");

// mensaje >= n debe fallar
lanzoError = false;
try {
  crypto.cifrarNumero(crypto.CLAVE_PUBLICA.n);
} catch (error) {
  lanzoError = true;
}
afirmar(lanzoError, "cifrarNumero rechaza m >= n");

console.log("\n=== Resultado ===");
console.log("Pasaron:", pasaron);
console.log("Fallaron:", fallaron);

if (fallaron > 0) {
  process.exit(1);
}

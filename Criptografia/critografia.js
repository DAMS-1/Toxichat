/**
 * Criptografía RSA
 */

const P = 1000000007n;
const Q = 1000000009n;

// Utilidades matemáticas

/** Máximo común divisor (Euclides) */
function maximoComunDivisor(a, b) {
  while (b !== 0n) {
    const temporal = b;
    b = a % b;
    a = temporal;
  }
  return a;
}

/* Exponenciación modular: (base^exponente) mod modulo */
/* Usamos n al final para denotar BigInt */
/* W */
function potenciaModular(base, exponente, modulo) {
  let resultado = 1n;
  base = base % modulo;
  while (exponente > 0n) {
    if (exponente % 2n === 1n) {
      resultado = (resultado * base) % modulo;
    }
    exponente = exponente / 2n;
    base = (base * base) % modulo;
  }
  return resultado;
}

/** Inverso modular de 'a' módulo 'm', euclides extendido*/
function inversoModular(a, m) {
  let m0 = m;
  let x0 = 0n;
  let x1 = 1n;
  if (m === 1n) return 0n;
  while (a > 1n) {
    const cociente = a / m;
    let temporal = m;
    m = a % m;
    a = temporal;
    temporal = x0;
    x0 = x1 - cociente * x0;
    x1 = temporal;
  }
  if (x1 < 0n) x1 += m0;
  return x1;
}

/** Comprueba si un número es primo (prueba simple) */
/* Cómo los divisores vienen en parejas, se prueba hasta \sqrt{n} 
(i<=\sqrt{n}), o lo que es lo mismo i*i<=n 

*/
function esPrimo(numero) {
  if (numero < 2n) return false;
  if (numero === 2n || numero === 3n) return true;
  if (numero % 2n === 0n) return false;
  for (let i = 3n; i * i <= numero; i += 2n) {
    if (numero % i === 0n) return false;
  }
  return true;
}

// Generación de claves RSA

/**
 * Busca un exponente público e válido: 1 < e < fi(n) y gcd(e, fi(n)) = 1.
 * Prueba candidatos habituales (Fermat) y, si ninguno sirve, sigue con impares.
 */
function generarExponentePublico(fiDeN, preferido = 65537n) {
  // Candidatos típicos de RSA
  const candidatos = [preferido, 65537n, 257n, 17n, 5n, 3n];

  for (const candidato of candidatos) {
    if (candidato > 1n && candidato < fiDeN && maximoComunDivisor(candidato, fiDeN) === 1n) {
      return candidato;
    }
  }

  // Si ninguno de los habituales es coprimo, busca el siguiente impar válido
  let e;
  if (preferido % 2n === 0n) {
    e = preferido + 1n;
  } else {
    e = preferido;
  }
  if (e <= 2n) e = 3n;
  if (e >= fiDeN) e = fiDeN - 1n;
  if (e % 2n === 0n) e -= 1n;

  while (e > 2n) {
    if (maximoComunDivisor(e, fiDeN) === 1n) {
      return e;
    }
    e -= 2n; // solo impares (e par nunca es coprimo con fi(n) par)
  }
  //Este error nunca debería saltar:
  throw new Error("No se encontró un exponente e válido para este fi(n).");
}

/**
 * Genera un par de claves RSA a partir de dos primos p y q.
 * Clave pública:  (e, n)
 * Clave privada:  (d, n)
 * Si el e propuesto no es coprimo con fi(n), se genera otro automáticamente.
 */
function generarClaves(p = P, q = Q, ePreferido = 65537n) {
  if (!esPrimo(p) || !esPrimo(q)) {
    throw new Error("p y q deben ser números primos.");
  }

  const n = p * q; // módulo RSA
  const fiDeN = (p - 1n) * (q - 1n); // fi(n) = (p-1)(q-1)

  // Elige un e válido (coprimo con fi(n)) sin fallar en la app de mensajería
  const e = generarExponentePublico(fiDeN, ePreferido);
  const d = inversoModular(e, fiDeN); // d ≡ e-1 (mod fi(n))

  return {
    clavePublica: { e, n },
    clavePrivada: { d, n },
  };
}

const { clavePublica: CLAVE_PUBLICA, clavePrivada: CLAVE_PRIVADA } = generarClaves();

// Texto a números 

/**
 * Convierte cada carácter del texto a su código Unicode.
 */
function textoANumeros(texto) {
  const numeros = [];
  for (let i = 0; i < texto.length; i++) {
    //charCodeAt devuelve el valor unicode en js.
    //La parte anterior, simplemente cambia el tipo de dato a BigInt
    numeros.push(BigInt(texto.charCodeAt(i)));
  }
  return numeros;
}

/** 
 * Convierte un arreglo decódigos Unicode de vuelta a texto.
 */
function numerosATexto(numeros) {
  // pega (.join) el arreglo resultante de preguntarse por el carácter de un código.
  return numeros.map((codigo) => String.fromCharCode(Number(codigo))).join("");
}

// Cifrado y descifrado RSA

/**
 * Cifra un número m con la clave pública: c = m^e (mod n)
 */
function cifrarNumero(mensajeNumerico, clavePublica = CLAVE_PUBLICA) {
  const { e, n } = clavePublica;
  if (mensajeNumerico >= n) {
    throw new Error("El mensaje debe ser menor que n.");
  }
  return potenciaModular(mensajeNumerico, e, n);
}

/**
 * Descifra un número c con la clave privada: m = c^d (mod n)
 */
function descifrarNumero(cifrado, clavePrivada = CLAVE_PRIVADA) {
  const { d, n } = clavePrivada;
  return potenciaModular(cifrado, d, n);
}

/**
 * Cifra un texto completo:
 * 1) texto -> números (Unicode)
 * 2) cada carácter se cifra con RSA: c = m^e (mod n)
 */
function cifrarTexto(texto, clavePublica = CLAVE_PUBLICA) {
  const numeros = textoANumeros(texto);
  return numeros.map((numero) => cifrarNumero(numero, clavePublica));
}

/**
 * Descifra un arreglo de bloques RSA y reconstruye el texto.
 */
function descifrarTexto(bloquesCifrados, clavePrivada = CLAVE_PRIVADA) {
  const numeros = bloquesCifrados.map((bloque) =>
    descifrarNumero(bloque, clavePrivada)
  );
  return numerosATexto(numeros);
}

// Demostración 

function demostrar() {
  // Primos de ejemplo+
  const p = 1000000007n;
  const q = 1000000009n;
  const { clavePublica, clavePrivada } = generarClaves(p, q, 65537n);

  const textoOriginal = "Hola";
  console.log("Texto original:", textoOriginal);
  console.log("Como números:", textoANumeros(textoOriginal).map(String));

  const cifrado = cifrarTexto(textoOriginal, clavePublica);
  console.log("Bloques cifrados (RSA):", cifrado.map(String));

  const recuperado = descifrarTexto(cifrado, clavePrivada);
  console.log("Texto descifrado:", recuperado);
}

demostrar();
// Exporta las funciones por si se usan desde otro módulo
module.exports = {
  P,
  Q,
  CLAVE_PUBLICA,
  CLAVE_PRIVADA,
  maximoComunDivisor,
  potenciaModular,
  inversoModular,
  esPrimo,
  generarExponentePublico,
  generarClaves,
  textoANumeros,
  numerosATexto,
  cifrarNumero,
  descifrarNumero,
  cifrarTexto,
  descifrarTexto,
};

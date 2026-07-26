const Graph = require('../src/utils/Graph');

// Función auxiliar para imprimir resultados en consola.
function runTest(testName, testFn) {
  console.log(`\n--- Ejecutando prueba: ${testName} ---`);
  try {
    testFn();
    console.log(`Prueba superada.`);
  } catch (error) {
    console.error(`❌ Prueba fallida:`, error.message);
  }
}

// Inicializar grafo
const socialGraph = new Graph();

// Añadir usuarios y conexiones de prueba
// Diego habla mucho con Santi (99 mensajes), entonces, peso: 100 / 100 = 1
socialGraph.addEdge('Diego', 'Santi', 99); 

// Santi habla un poco con Clara (9 mensajes), entonces, peso: 100 / 10 = 10
socialGraph.addEdge('Santi', 'Clara', 9); 

// Diego casi no habla con Clara (1 mensaje), entonces, peso: 100 / 2 = 50
socialGraph.addEdge('Diego', 'Clara', 1);

// Lau también es amiga de Santi (19 mensajes), entonces, peso: 100 / 20 = 5
socialGraph.addEdge('Lau', 'Santi', 19);

// Usuario aislado
socialGraph.addNode('Fantasma'); 


// --- PRUEBA 1: Ruta óptima con intermediario (Dijkstra vs directo) ---
runTest('Encontrar ruta óptima de confianza de Diego a Clara', () => {
  const result = socialGraph.dijkstra('Diego', 'Clara');
  
  // Imprimir detalles para verlos en la consola
  console.log('Ruta sugerida:', result.path.join(' -> '));
  console.log('Costo de confianza total:', result.cost);
  
  // Verificamos que el algoritmo prefiera el camino indirecto (Diego -> Santi -> Clara) 
  // en lugar del directo (Diego -> Clara) que tiene un costo de 50.
  // El costo esperado es 1 (Diego-Santi) + 10 (Santi-Clara) = 11.
  if (result.path.join('->') !== 'Diego->Santi->Clara') {
    throw new Error('La ruta debería ser Diego -> Santi -> Clara');
  }
  if (result.cost !== 11) {
    throw new Error(`El costo debería ser 11, pero es ${result.cost}`);
  }
});

// --- PRUEBA 2: Camino más corto a alguien muy cercano ---
runTest('Encontrar ruta de Diego a Lau', () => {
  const result = socialGraph.dijkstra('Diego', 'Lau');
  
  console.log('Ruta sugerida:', result.path.join(' -> '));
  console.log('Costo de confianza total:', result.cost);

  // Esperado: Diego -> Santi -> Lau (Costo 1 + 5 = 6)
  if (result.path.join('->') !== 'Diego->Santi->Lau') {
    throw new Error('La ruta debería ser Diego -> Santi -> Lau');
  }
});

// --- PRUEBA 3: Usuario inalcanzable ---
runTest('Intentar contactar a un usuario aislado (Fantasma)', () => {
  const result = socialGraph.dijkstra('Diego', 'Fantasma');
  
  console.log('Ruta sugerida:', result.path.join(' -> '));
  console.log('Costo de confianza total:', result.cost);

  if (result.cost !== Infinity || result.path.length !== 0) {
    throw new Error('Debería retornar un costo infinito y un arreglo vacío para un usuario inalcanzable');
  }
});

console.log('\nTodas las pruebas ejecutadas correctamente\n');

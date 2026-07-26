/**
 * Clase que representa la red social como un Grafo.
 * Usa una lista de adyacencia para almacenar los usuarios como nodos y sus relaciones como aristas.
 */
class Graph {
  constructor() {
    this.nodes = {}; //Diccionario que almacenast los nodos y sus conexiones
  }

  /**
   * Añadir nuevo usuario al grafo.
   * @param {string} user - nombreo ID usuario.
   */
  addNode(user) {
    if (!this.nodes[user]) {
      this.nodes[user] = {}; // Inicalizar conexiones del usuario vacías
    }
  }

  /**
   * Calcular peso (distancia) de una conexión basado en los mensajes intercambiados.
   * Fórmula: W = 100 / (mensajes + 1). 
   * Mayor cantidad de mensajes, menor distancia (mayor confianza).
   * @param {number} messages - Cantidad de mensajes intercambiados.
   * @returns {number} - El peso calculado de la arista.
   */
  calculateWeight(messages) {
    // Si los mensajes son negativos por algún error, lo tratamos como 0
    const validMessages = Math.max(0, messages);
    return 100 / (validMessages + 1);
  }

  /**
   * Añadir conexión bidireccional de amistad/interacción entre dos usuarios.
   * @param {string} userA - Usuario A.
   * @param {string} userB - Usuario B.
   * @param {number} messages - Mensajes intercambiados entre ellos.
   */
  addEdge(userA, userB, messages) {
    // Verificar existencia de ambos nodos.
    this.addNode(userA);
    this.addNode(userB);

    const weight = this.calculateWeight(messages);

    // Es un grafo no dirigido/bidireccional, la confianza va en ambos sentidos
    this.nodes[userA][userB] = weight;
    this.nodes[userB][userA] = weight;
  }

  /**
   * Algoritmo de Dijkstra para encontrar la ruta de mayor confianza (menor peso acumulado).
   * @param {string} startNode - Usuario origen.
   * @param {string} endNode - Usuario destino.
   * @returns {Object} - Retorna un objeto con el costo total y el camino (arreglo de usuarios).
   */
  dijkstra(startNode, endNode) {
    if (!this.nodes[startNode] || !this.nodes[endNode]) {
      return { cost: Infinity, path: [] };
    }

    const distances = {};
    const previous = {};
    const unvisited = new Set(Object.keys(this.nodes));

    // Inicializar distancias al infinito, excepto el nodo de inicio
    for (let node in this.nodes) {
      distances[node] = Infinity;
      previous[node] = null;
    }
    distances[startNode] = 0;

    while (unvisited.size > 0) {
      // 1. Encontrar el nodo no visitado con la menor distancia actual
      let currentNode = null;
      let minDistance = Infinity;
      for (let node of unvisited) {
        if (distances[node] < minDistance) {
          minDistance = distances[node];
          currentNode = node;
        }
      }

      // Si el nodo actual es null o si llegamos al destino, podemos detenernos
      if (currentNode === null || currentNode === endNode) {
        break; 
      }

      unvisited.delete(currentNode);

      // 2. Evaluar vecinos del nodo actual
      for (let neighbor in this.nodes[currentNode]) {
        if (unvisited.has(neighbor)) {
          // Calcular la nueva distancia desde el inicio hasta el vecino pasando por el nodo actual
          const newDistance = distances[currentNode] + this.nodes[currentNode][neighbor];
          
          // Si encontramos una ruta más corta, actualizamos
          if (newDistance < distances[neighbor]) {
            distances[neighbor] = newDistance;
            previous[neighbor] = currentNode;
          }
        }
      }
    }

    // 3. Reconstruir el camino desde el destino hasta el origen
    const path = [];
    let current = endNode;

    // Si no hay forma de llegar al destino (distancia sigue siendo Infinity)
    if (distances[endNode] === Infinity) {
        return { cost: Infinity, path: [] };
    }

    while (current !== null) {
      path.unshift(current); // Insertar al principio para que quede en el orden correcto
      current = previous[current];
    }

    return {
      cost: distances[endNode],
      path: path
    };
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = Graph;
}

if (typeof window !== "undefined") {
  window.Graph = Graph;
}

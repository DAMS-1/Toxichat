// --- ESTRUCTURA DE DATOS: PILA (STACK) ---
class PilaMensajes {
    constructor() {
        this.elementos = [];
    }

    // Apilar: Inserta un elemento al final de la estructura
    push(item) {
        this.elementos.push(item);
        this.actualizarDOM();
    }

    // Método para renderizar los mensajes en el HTML
    actualizarDOM() {
        const panel = document.getElementById("panel-mensajes");
        panel.innerHTML = "";

        // Recorremos la pila de la cima hacia abajo (LIFO: Last In, First Out)
        for (let i = this.elementos.length - 1; i >= 0; i--) {
            const msg = this.elementos[i];
            const div = document.createElement("div");
            div.className = "mensaje-item";
            div.textContent = `${msg.remitente}: ${msg.texto}`;
            panel.appendChild(div);
        }
    }
}

// Instanciamos nuestra pila para los chats
const pilaChats = new PilaMensajes();

// --- SIMULACIÓN DEL MÓDULO DE DIEGO (GRAFO SOCIAL) ---
function esAmigoEnGrafo(remitenteId) {
    // Simulamos una lista de amigos permitidos
    const amigosPermitidos = ["usuario1", "amigo_diego", "santi_dev"];
    return amigosPermitidos.includes(remitenteId);
}

// --- LÓGICA DE RECEPCIÓN DE MENSAJES ---
function recibirMensajeEntrante(remitenteId, remitenteNombre, textoMensaje) {
    console.log(`Mensaje recibido de ID: ${remitenteId}`);

    // 1. Validar si es amigo usando la lógica del grafo
    if (esAmigoEnGrafo(remitenteId)) {
        // 2. Si es amigo, se procesa (aquí más adelante entrará el RSA de Yop)
        const mensajeValido = {
            remitente: remitenteNombre,
            texto: textoMensaje
        };
        
        // 3. Se añade a la Pila
        pilaChats.push(mensajeValido);
        console.log("Mensaje apilado exitosamente.");
    } else {
        console.warn(`Mensaje bloqueado de ${remitenteNombre}: No es amigo en el grafo social.`);
    }
}

// --- PRUEBAS AUTOMÁTICAS EN CONSOLA ---
// Simre de prueba al cargar la página:
setTimeout(() => {
    recibirMensajeEntrante("usuario1", "Carlos", "¡Hola Lau, probando la pila de chats!");
    recibirMensajeEntrante("hacker_malintencionado", "Desconocido", "Spam o ataque de red");
    recibirMensajeEntrante("santi_dev", "Santi", "Ya quedó lista la base de datos.");
}, 500);
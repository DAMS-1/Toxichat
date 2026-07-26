// --- ESTRUCTURA DE DATOS: PILA (STACK) ---
class PilaMensajes {
    constructor() {
        this.elementos = [];
    }

    // Apilar: Se inserta un elemento al final de la estructura
    push(item) {
        this.elementos.push(item);
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

// Diccionario para almacenar la pila de mensajes independiente de cada chat/usuario
const pilasPorChat = {};

function obtenerPilaChat(idChat) {
    if (!pilasPorChat[idChat]) {
        pilasPorChat[idChat] = new PilaMensajes();
    }
    return pilasPorChat[idChat];
}

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
        // 2. Si es amigo, se procesa
        const mensajeValido = {
            remitente: remitenteNombre,
            texto: textoMensaje
        };
        
        // 3. Se añade a la Pila del remitente
        const pila = obtenerPilaChat(remitenteId);
        pila.push(mensajeValido);

        // Si el chat actualmente abierto es el del remitente, actualizamos la vista
        const destinatarioActual = document.getElementById("destinatario-input").value;
        if (destinatarioActual === remitenteId) {
            pila.actualizarDOM();
        }

        console.log("Mensaje apilado exitosamente.");
    } else {
        console.warn(`Mensaje bloqueado de ${remitenteNombre}: No es amigo en el grafo social.`);
    }
}

// --- PRUEBAS EN CONSOLA ---
setTimeout(() => {
    recibirMensajeEntrante("usuario1", "Carlos", "¡Hola Lau, probando la pila de chats!");
    recibirMensajeEntrante("hacker_malintencionado", "Desconocido", "Spam o ataque de red");
    recibirMensajeEntrante("santi_dev", "Santi", "Ya quedó lista la base de datos.");
}, 500);

// =========================================================
// --- LÓGICA DE INTERFAZ GRÁFICA (LAU) ---
// =========================================================

let usuarioActual = null; // Guardará los datos de quien inicie sesión

function iniciarSesion() {
    const email = document.getElementById("email-input").value;
    const password = document.getElementById("password-input").value;

    // Conectamos con el módulo de Santi (Hueco)
    const loginExitoso = loginDB_SANTI(email, password);

    if (loginExitoso) {
        // Simulamos que la DB nos devuelve los datos del perfil
        usuarioActual = { id: email.split("@")[0], nombre: email.split("@")[0] }; 
        
        // Transición de interfaz: Ocultar login, mostrar app
        document.getElementById("pantalla-login").style.display = "none";
        document.getElementById("pantalla-app").style.display = "block";
        document.getElementById("nombre-usuario-activo").textContent = usuarioActual.nombre;
    } else {
        alert("Credenciales incorrectas o error en la BD.");
    }
}

function enviarMensaje() {
    const destinatario = document.getElementById("destinatario-input").value;
    const texto = document.getElementById("mensaje-input").value;

    if (!destinatario || !texto) {
        alert("Por favor, llena el destinatario y el mensaje.");
        return;
    }

    // 1. Validar conexión usando el módulo de Diego (Hueco)
    const rutaValida = validarRuta_DIEGO(usuarioActual.id, destinatario);

    if (rutaValida) {
        // 2. Cifrar y guardar usando el módulo de Santi (Hueco)
        const guardadoExitoso = enviarMensajeDB_SANTI(usuarioActual.id, destinatario, texto);
        
        if (guardadoExitoso) {
            // 3. Renderizar en la pila específica del destinatario
            const pila = obtenerPilaChat(destinatario);
            pila.push({ remitente: "Yo", texto: texto });
            pila.actualizarDOM();
            
            document.getElementById("mensaje-input").value = ""; // Limpiamos la caja de texto
        }
    } else {
        alert("No tienes conexión en el grafo con este usuario (Costo: Infinity).");
    }
}

// =========================================================
// --- FUNCIONES HUECAS PARA INTEGRACIÓN (SANTI Y DIEGO) ---
// =========================================================

/**
 * @SANTI: Lógica de Autenticación con Supabase
 * @param {string} email - Correo extraído del input.
 * @param {string} password - Contraseña extraída del input.
 * @returns {boolean} - Debes retornar TRUE si las credenciales coinciden en BD, FALSE si fallan.
 */
function loginDB_SANTI(email, password) {
    // TODO (Santi): Implementar consulta a Supabase.
    console.warn(`[Mock Santi] Validando login para: ${email}`);
    return true; // Simulado en true para que la UI funcione mientras tanto.
}

/**
 * @DIEGO: Validación de confianza en el Grafo Social
 * @param {string} origenId - ID de quien envía el mensaje.
 * @param {string} destinoId - ID del destinatario.
 * @returns {boolean} - Debes retornar TRUE si el costo en Dijkstra es diferente de Infinity, FALSE si están desconectados.
 */

function validarRuta_DIEGO(origenId, destinoId) {
    // 1. Si no hay origen o destino definidos, no hay ruta
    if (!origenId || !destinoId) return false;

    // 2. Ejecutar Dijkstra usando la clase Graph que construimos
    const resultado = socialGraph.dijkstra(origenId, destinoId);

    // 3. Si el costo es diferente de Infinito y la ruta no está vacía, hay conexión
    const hayConexion = resultado.cost !== Infinity && resultado.path.length > 0;

    console.log(`[Dijkstra Diego] Evaluando ruta ${origenId} -> ${destinoId}:`, {
        camino: resultado.path,
        costo: resultado.cost,
        esValida: hayConexion
    });

    return hayConexion;
}

/**
 * @SANTI: Cifrado RSA e Inserción en Base de Datos
 * @param {string} remitenteId - ID del usuario actual.
 * @param {string} destinatarioId - ID del receptor.
 * @param {string} mensajePlano - Mensaje recolectado de la interfaz.
 * @returns {boolean} - Retornar TRUE si el insert() en Supabase fue exitoso.
 */
function enviarMensajeDB_SANTI(remitenteId, destinatarioId, mensajePlano) {
    // TODO (Santi): 1. Usar cifrarTexto(mensajePlano) de tu módulo RSA. 2. Subir el array de bloques a Supabase.
    console.warn(`[Mock Santi] Cifrando y enviando a DB: "${mensajePlano}"`);
    return true; // Simulado en true para que se apile visualmente el mensaje.
}

// =========================================================
// --- LÓGICA DE NAVEGACIÓN Y UI REDISEÑADA ---
// =========================================================

/** Navegación entre las vistas principales (Chats / Perfil) */
function cambiarVista(idVistaActiva, idBotonActivo) {
    // 1. Ocultar todas las vistas
    document.getElementById("vista-chats").classList.add("oculta");
    document.getElementById("vista-chats").classList.remove("activa");
    document.getElementById("vista-perfil").classList.add("oculta");
    document.getElementById("vista-perfil").classList.remove("activa");
    document.getElementById("vista-chat-individual").classList.add("oculta");
    document.getElementById("vista-chat-individual").classList.remove("activa");

    // 2. Mostrar la vista seleccionada
    document.getElementById(idVistaActiva).classList.remove("oculta");
    document.getElementById(idVistaActiva).classList.add("activa");

    // 3. Cambiar estilos de los botones de la barra inferior
    if(idBotonActivo) {
        document.getElementById("nav-chats").classList.remove("activo");
        document.getElementById("nav-perfil").classList.remove("activo");
        document.getElementById(idBotonActivo).classList.add("activo");
    }
}

/** Funcionalidad para agregar un nuevo amigo */
function agregarAmigo() {
    const correoAmigo = prompt("Ingresa el CORREO ELECTRÓNICO (único) de tu nuevo amigo:");
    if (correoAmigo && correoAmigo.trim() !== "") {
        // TODO (Santi/Diego): Conectar con la BD para buscar el correo y añadir nodo al Grafo.
        alert(`Solicitud enviada o amigo agregado con el correo: ${correoAmigo}`);
    }
}

/** Abre la vista individual de un chat específico */
function abrirChat(amigoId, alias, correo) {
    // Configuramos los datos internos del chat actual
    document.getElementById("destinatario-input").value = amigoId;
    document.getElementById("chat-actual-alias").innerText = alias;
    document.getElementById("correo-amigo-actual").value = correo; // Lo guardamos oculto para el modal
    
    // Renderizamos la pila de mensajes específica de este amigo
    const pila = obtenerPilaChat(amigoId);
    pila.actualizarDOM();

    // Cambiamos a la vista del chat (quitando el foco de la barra inferior)
    cambiarVista("vista-chat-individual", null);
}

/** Retorna a la lista principal de chats */
function volverAChats() {
    cambiarVista("vista-chats", "nav-chats");
}

/** Cambia el alias local (Lápiz en la cabecera) */
function cambiarAlias() {
    const aliasActual = document.getElementById("chat-actual-alias").innerText;
    const nuevoAlias = prompt("Cambiar el alias de este contacto:", aliasActual);
    
    if (nuevoAlias && nuevoAlias.trim() !== "") {
        document.getElementById("chat-actual-alias").innerText = nuevoAlias;
        // Aquí se podría guardar el alias localmente.
    }
}

/** Abre la ventana Modal con los detalles del amigo */
function abrirModalAmigo() {
    const aliasActual = document.getElementById("chat-actual-alias").innerText;
    const correoActual = document.getElementById("correo-amigo-actual").value;
    
    // Inyectar datos en el modal
    document.getElementById("modal-amigo-nombre").innerText = aliasActual;
    document.getElementById("modal-amigo-correo").innerText = correoActual;
    document.getElementById("modal-amigo-avatar").innerText = aliasActual.charAt(0).toUpperCase();
    
    // Mostrar modal
    document.getElementById("modal-amigo").classList.remove("oculta");
}

/** Cierra la ventana Modal */
function cerrarModalAmigo() {
    document.getElementById("modal-amigo").classList.add("oculta");
}

/** Guardar información de mi perfil */
function guardarPerfil() {
    const nuevoNombre = document.getElementById("perfil-nombre").value;
    const nuevoEstado = document.getElementById("perfil-estado").value;
    
    if(nuevoNombre.trim() === "") {
        alert("El nombre no puede estar vacío.");
        return;
    }

    // TODO (Santi): Actualizar perfil en Supabase
    usuarioActual.nombre = nuevoNombre;
    alert(`Perfil guardado con éxito.\nNombre: ${nuevoNombre}\nEstado: ${nuevoEstado}`);
}
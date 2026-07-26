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

<<<<<<< HEAD
// --- ESTRUCTURA DE DATOS: PILA DE SOLICITUDES DE AMISTAD (SANTI) ---
// Reutiliza el patrón LIFO de PilaMensajes para las notificaciones de amistad.
// La cima de la pila es la solicitud más reciente (última en llegar).
class PilaSolicitudes {
    constructor() {
        this.elementos = [];
    }

    // Apilar: inserta una solicitud en la cima
    push(solicitud) {
        this.elementos.push(solicitud);
    }

    // Desapilar: extrae la solicitud de la cima
    pop() {
        return this.elementos.pop();
    }

    estaVacia() {
        return this.elementos.length === 0;
    }

    get tamaño() {
        return this.elementos.length;
    }

    // Elimina una solicitud específica por su ID (tras aceptar o rechazar)
    eliminar(solicitudId) {
        const idx = this.elementos.findIndex(s => s.solicitud_id === solicitudId);
        if (idx !== -1) this.elementos.splice(idx, 1);
    }

    // Renderiza la pila en el DOM (LIFO: cima primero)
    actualizarDOM() {
        const panel = document.getElementById("panel-solicitudes");
        const badge = document.getElementById("badge-solicitudes");

        if (badge) {
            badge.textContent = this.elementos.length > 0 ? this.elementos.length : "";
            badge.style.display = this.elementos.length > 0 ? "inline" : "none";
        }

        if (!panel) return;
        panel.innerHTML = "";

        if (this.estaVacia()) {
            panel.innerHTML = "<p class='solicitudes-vacia'>No tienes solicitudes pendientes.</p>";
            return;
        }

        // Recorremos de la cima hacia abajo (LIFO)
        for (let i = this.elementos.length - 1; i >= 0; i--) {
            const sol = this.elementos[i];
            const div = document.createElement("div");
            div.className = "solicitud-item";
            div.dataset.solicitudId = sol.solicitud_id;
            div.innerHTML = `
                <div class="solicitud-avatar">${(sol.alias || sol.email || "?").charAt(0).toUpperCase()}</div>
                <div class="solicitud-info">
                    <strong>${sol.alias || sol.email}</strong>
                    <small>${sol.email}</small>
                </div>
                <div class="solicitud-acciones">
                    <button class="btn-sol-aceptar" onclick="aceptarSolicitud('${sol.solicitud_id}')">✓</button>
                    <button class="btn-sol-rechazar" onclick="rechazarSolicitud('${sol.solicitud_id}')">✗</button>
                </div>
            `;
            panel.appendChild(div);
        }
    }
}

// Instancia global de la pila de solicitudes
const pilaSolicitudes = new PilaSolicitudes();

// --- SIMULACIÓN DEL MÓDULO DE DIEGO (GRAFO SOCIAL) ---
=======
// --- MÓDULO DE DIEGO (GRAFO SOCIAL) ---
window.socialGraph = window.Graph ? new window.Graph() : null;

async function cargarGrafoSocial() {
    if (!window.socialGraph) return;
    console.log("[Diego] Inicializando Grafo Social y cargando conexiones...");
    
    // Mock de conexiones y usuarios para que Dijkstra funcione
    if (usuarioActual && usuarioActual.id) {
        window.socialGraph.addNode(usuarioActual.id);
        
        // Asignamos una red de prueba:
        window.socialGraph.addEdge(usuarioActual.id, "santi_dev", 99);
        window.socialGraph.addEdge("santi_dev", "lau_ui", 15);
        window.socialGraph.addEdge("santi_dev", "carlos_test", 5);
    }
}

>>>>>>> origin/main
function esAmigoEnGrafo(remitenteId) {
    if (!usuarioActual || !window.socialGraph) return false;
    const res = window.socialGraph.dijkstra(remitenteId, usuarioActual.id);
    return res.cost !== Infinity && res.path.length > 0;
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

function mostrarAppAutenticada(sesion) {
    usuarioActual = {
        id: sesion.email,
        nombre: sesion.email,
        email: sesion.email,
        uuid: sesion.id,
        rsa_e: sesion.rsa_e,
        rsa_n: sesion.rsa_n,
    };

    // Al autenticarnos, poblamos el grafo social del usuario
    cargarGrafoSocial();

    document.getElementById("pantalla-login").style.display = "none";
    document.getElementById("pantalla-app").style.display = "block";

    const etiqueta = document.getElementById("nombre-usuario-activo");
    if (etiqueta) etiqueta.textContent = usuarioActual.nombre;

    const perfilNombre = document.getElementById("perfil-nombre");
    if (perfilNombre) perfilNombre.value = usuarioActual.nombre;

    // Cargar solicitudes pendientes e iniciar escucha en tiempo real (Santi)
    cargarSolicitudesPendientes();
    iniciarRealtime();
}

async function iniciarSesion() {
    const email = document.getElementById("email-input").value;
    const password = document.getElementById("password-input").value;
    const mensaje = document.getElementById("auth-mensaje");

    if (mensaje) mensaje.textContent = "Validando credenciales...";

    const resultado = await loginDB_SANTI(email, password);

    if (resultado && resultado.ok && resultado.sesion) {
        if (mensaje) mensaje.textContent = resultado.mensaje;
        mostrarAppAutenticada(resultado.sesion);
    } else {
        const texto = (resultado && resultado.mensaje) || "Credenciales incorrectas o error en la BD.";
        if (mensaje) mensaje.textContent = texto;
        alert(texto);
    }
}

async function registrarCuenta() {
    const email = document.getElementById("email-input").value;
    const password = document.getElementById("password-input").value;
    const mensaje = document.getElementById("auth-mensaje");

    if (mensaje) mensaje.textContent = "Creando cuenta...";

    const resultado = await registrarDB_SANTI({
        email,
        contrasena: password,
    });

    if (resultado && resultado.ok) {
        if (mensaje) mensaje.textContent = resultado.mensaje;
        if (resultado.sesion) {
            mostrarAppAutenticada(resultado.sesion);
        } else {
            alert(resultado.mensaje);
        }
    } else {
        const texto = (resultado && resultado.mensaje) || "No se pudo registrar el usuario.";
        if (mensaje) mensaje.textContent = texto;
        alert(texto);
    }
}

async function enviarMensaje() {
    const destinatario = document.getElementById("destinatario-input").value;
    const texto = document.getElementById("mensaje-input").value;
    const correoDestino = document.getElementById("correo-amigo-actual").value;

    if (!destinatario || !texto) {
        alert("Por favor, llena el destinatario y el mensaje.");
        return;
    }

    // 1. Validar conexión usando el módulo de Diego
    const rutaValida = validarRuta_DIEGO(usuarioActual.id, destinatario);

    if (rutaValida) {
        // 2. Cifrar y guardar (Santi: RSA + Supabase)
        const guardadoExitoso = await enviarMensajeDB_SANTI(
            usuarioActual.id,
            destinatario,
            texto,
            correoDestino
        );

        if (guardadoExitoso) {
            const pila = obtenerPilaChat(destinatario);
            pila.push({ remitente: "Yo", texto: texto });
            pila.actualizarDOM();
            document.getElementById("mensaje-input").value = "";
        }
    } else {
        alert("No tienes conexión en el grafo con este usuario (Costo: Infinity).");
    }
}

// =========================================================
// --- FUNCIONES HUECAS PARA INTEGRACIÓN (SANTI Y DIEGO) ---
// =========================================================

/**
 * @SANTI: Login con Supabase Auth + perfil SQL (perfiles).
 * @returns {Promise<{ok:boolean, mensaje:string, sesion:object|null}>}
 */
async function loginDB_SANTI(email, password) {
    if (!window.ToxichatAuth || typeof window.ToxichatAuth.iniciarSesion !== "function") {
        return { ok: false, mensaje: "Módulo de autenticación no cargado.", sesion: null };
    }
    if (!window.ToxichatDB || !window.ToxichatDB.estaConfigurado()) {
        return {
            ok: false,
            mensaje: "Configura config.js con tu SUPABASE_URL y SUPABASE_ANON_KEY.",
            sesion: null,
        };
    }
    return window.ToxichatAuth.iniciarSesion(email, password);
}

/**
 * @SANTI: Registro de usuario (Auth + perfiles + clave RSA pública).
 */
async function registrarDB_SANTI(datos) {
    if (!window.ToxichatAuth || typeof window.ToxichatAuth.registrarUsuario !== "function") {
        return { ok: false, mensaje: "Módulo de autenticación no cargado.", sesion: null };
    }
    if (!window.ToxichatDB || !window.ToxichatDB.estaConfigurado()) {
        return {
            ok: false,
            mensaje: "Configura config.js con tu SUPABASE_URL y SUPABASE_ANON_KEY.",
            sesion: null,
        };
    }
    return window.ToxichatAuth.registrarUsuario(datos);
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
 * @SANTI: Cifrado RSA e inserción en BD (rpc enviar_mensaje).
 * @returns {Promise<boolean>}
 */
async function enviarMensajeDB_SANTI(remitenteId, destinatarioId, mensajePlano, emailDestino) {
    try {
        if (!window.ToxichatCrypto || typeof window.ToxichatCrypto.cifrarTexto !== "function") {
            console.error("[Santi] ToxichatCrypto no está disponible.");
            return false;
        }
        if (!window.ToxichatDB || !window.ToxichatDB.estaConfigurado()) {
            console.warn("[Santi] Supabase no configurado; solo se muestra en UI local.");
            return true;
        }

        const bloques = window.ToxichatCrypto.cifrarTexto(mensajePlano);
        const contenidoCifrado = JSON.stringify(bloques.map(String));
        const destino = emailDestino || destinatarioId;

        const { error } = await window.ToxichatDB.cliente.rpc("enviar_mensaje", {
            p_email_destino: destino,
            p_contenido: mensajePlano,
            p_contenido_cifrado: contenidoCifrado,
        });

        if (error) {
            console.error("[Santi] Error al guardar mensaje:", error.message);
            alert("No se pudo guardar el mensaje en la BD: " + error.message);
            return false;
        }

        console.log(`[Santi] Mensaje cifrado y guardado (${remitenteId} -> ${destino}).`);
        return true;
    } catch (error) {
        console.error("[Santi] enviarMensajeDB_SANTI:", error);
        alert(error.message || String(error));
        return false;
    }
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
    if (idBotonActivo) {
        document.getElementById("nav-chats").classList.remove("activo");
        document.getElementById("nav-perfil").classList.remove("activo");
        document.getElementById(idBotonActivo).classList.add("activo");
    }
}

/** Envía una solicitud de amistad buscando al usuario por email en la BD (Santi) */
async function agregarAmigo() {
    const correoAmigo = prompt("Ingresa el CORREO ELECTRÓNICO (único) de tu nuevo amigo:");
    if (!correoAmigo || correoAmigo.trim() === "") return;

    if (!window.ToxichatDB || !window.ToxichatDB.estaConfigurado()) {
        alert("La base de datos no está configurada.");
        return;
    }

    const correoLimpio = correoAmigo.trim().toLowerCase();

    const { data, error } = await window.ToxichatDB.cliente.rpc("enviar_solicitud_amistad", {
        p_email_destino: correoLimpio,
    });

    if (error) {
        console.error("[Santi] enviar_solicitud_amistad:", error.message);
        alert("No se pudo enviar la solicitud: " + error.message);
    } else {
        console.log("[Santi] Solicitud enviada a:", correoLimpio, data);
        alert(`Solicitud de amistad enviada a ${correoLimpio}.`);
    }
}

// =========================================================
// --- SOLICITUDES DE AMISTAD (SANTI) ---
// =========================================================

/**
 * Carga las solicitudes pendientes desde Supabase y las coloca en la pila.
 * La pila queda lista para que Lau llame a pilaSolicitudes.actualizarDOM().
 */
async function cargarSolicitudesPendientes() {
    if (!window.ToxichatDB || !window.ToxichatDB.estaConfigurado()) return;

    const { data, error } = await window.ToxichatDB.cliente.rpc("obtener_solicitudes_pendientes");
    if (error) {
        console.error("[Santi] obtener_solicitudes_pendientes:", error.message);
        return;
    }

    // Vaciar la pila y recargar desde la BD (más reciente → cima)
    pilaSolicitudes.elementos = [];
    const lista = Array.isArray(data) ? data : (data ? [data] : []);
    // Las insertamos de más antigua a más reciente, así la más nueva queda en la cima
    lista.slice().reverse().forEach(s => pilaSolicitudes.push(s));

    pilaSolicitudes.actualizarDOM();
    console.log(`[Santi] ${pilaSolicitudes.tamaño} solicitudes pendientes cargadas.`);
}

/**
 * Acepta una solicitud de amistad → crea arista en el grafo (tabla amistades).
 * @param {string} solicitudId - UUID de la solicitud.
 */
async function aceptarSolicitud(solicitudId) {
    if (!window.ToxichatDB || !window.ToxichatDB.estaConfigurado()) return;

    const { error } = await window.ToxichatDB.cliente.rpc("aceptar_solicitud_amistad", {
        p_solicitud_id: solicitudId,
    });

    if (error) {
        console.error("[Santi] aceptar_solicitud_amistad:", error.message);
        alert("Error al aceptar la solicitud: " + error.message);
        return;
    }

    console.log("[Santi] Solicitud aceptada:", solicitudId);
    pilaSolicitudes.eliminar(solicitudId);
    pilaSolicitudes.actualizarDOM();
    alert("¡Solicitud aceptada! Ya son amigos.");
}

/**
 * Rechaza una solicitud de amistad.
 * @param {string} solicitudId - UUID de la solicitud.
 */
async function rechazarSolicitud(solicitudId) {
    if (!window.ToxichatDB || !window.ToxichatDB.estaConfigurado()) return;

    const { error } = await window.ToxichatDB.cliente.rpc("rechazar_solicitud_amistad", {
        p_solicitud_id: solicitudId,
    });

    if (error) {
        console.error("[Santi] rechazar_solicitud_amistad:", error.message);
        alert("Error al rechazar la solicitud: " + error.message);
        return;
    }

    console.log("[Santi] Solicitud rechazada:", solicitudId);
    pilaSolicitudes.eliminar(solicitudId);
    pilaSolicitudes.actualizarDOM();
}

/** Muestra u oculta el panel de solicitudes pendientes */
function togglePanelSolicitudes() {
    const contenedor = document.getElementById("contenedor-solicitudes");
    if (!contenedor) return;

    const estaOculto = contenedor.classList.contains("oculta");
    if (estaOculto) {
        contenedor.classList.remove("oculta");
        // Refrescar desde BD al abrir
        cargarSolicitudesPendientes();
    } else {
        contenedor.classList.add("oculta");
    }
}


function iniciarRealtime() {
    if (!window.ToxichatDB || !window.ToxichatDB.estaConfigurado()) return;
    if (!usuarioActual || !usuarioActual.uuid) return;

    const cliente = window.ToxichatDB.cliente;

    // --- Canal 1: Solicitudes de amistad en tiempo real ---
    // Filtramos por para_usuario_id = UUID del usuario autenticado.
    // Cada vez que alguien te envíe una solicitud, la pila se actualiza sola.
    cliente
        .channel("canal-solicitudes")
        .on(
            "postgres_changes",
            {
                event: "INSERT",
                schema: "public",
                table: "solicitudes_amistad",
                filter: `para_usuario_id=eq.${usuarioActual.uuid}`,
            },
            (payload) => {
                console.log("[Realtime] Nueva solicitud de amistad recibida:", payload.new);
                // Recargamos desde BD para obtener también el alias/email del remitente
                cargarSolicitudesPendientes();
            }
        )
        .subscribe((status) => {
            console.log("[Realtime] Estado canal solicitudes:", status);
        });

    // --- Canal 2: Mensajes entrantes en tiempo real
    cliente
        .channel("canal-mensajes")
        .on(
            "postgres_changes",
            {
                event: "INSERT",
                schema: "public",
                table: "mensajes",
                filter: `destinatario_id=eq.${usuarioActual.uuid}`,
            },
            (payload) => {
                console.log("[Realtime] Nuevo mensaje recibido:", payload.new);
                // Hook para Diego/Lau: si definen window.onMensajeRealtime, se llama aquí.
                if (typeof window.onMensajeRealtime === "function") {
                    window.onMensajeRealtime(payload.new);
                }
            }
        )
        .subscribe((status) => {
            console.log("[Realtime] Estado canal mensajes:", status);
        });
}

/** Abre la vista individual de un chat específico */
function abrirChat(amigoId, alias, correo) {
    document.getElementById("destinatario-input").value = amigoId;
    document.getElementById("correo-amigo-actual").value = correo;
    document.getElementById("chat-actual-alias").innerText = obtenerAliasLocal(correo, alias || correo);

    const pila = obtenerPilaChat(amigoId);
    pila.actualizarDOM();

    cambiarVista("vista-chat-individual", null);
}

/** Retorna a la lista principal de chats */
function volverAChats() {
    cambiarVista("vista-chats", "nav-chats");
}

const CLAVE_ALIAS_LOCAL = "toxichat_alias_contactos";

function leerAliasLocales() {
    try {
        return JSON.parse(localStorage.getItem(CLAVE_ALIAS_LOCAL) || "{}");
    } catch (error) {
        return {};
    }
}

function guardarAliasLocal(correoAmigo, alias) {
    const mapa = leerAliasLocales();
    mapa[String(correoAmigo).toLowerCase()] = alias;
    localStorage.setItem(CLAVE_ALIAS_LOCAL, JSON.stringify(mapa));
}

function obtenerAliasLocal(correoAmigo, fallback) {
    const mapa = leerAliasLocales();
    return mapa[String(correoAmigo).toLowerCase()] || fallback;
}

/** Cambia el alias local del contacto (solo en este navegador) */
function cambiarAlias() {
    const aliasActual = document.getElementById("chat-actual-alias").innerText;
    const correoActual = document.getElementById("correo-amigo-actual").value;
    const nuevoAlias = prompt("Cambiar el alias de este contacto:", aliasActual);

    if (nuevoAlias && nuevoAlias.trim() !== "") {
        const limpio = nuevoAlias.trim();
        document.getElementById("chat-actual-alias").innerText = limpio;
        if (correoActual) guardarAliasLocal(correoActual, limpio);
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

    if (nuevoNombre.trim() === "") {
        alert("El nombre no puede estar vacío.");
        return;
    }

    usuarioActual.nombre = nuevoNombre;
    document.getElementById("nombre-usuario-activo").textContent = nuevoNombre;
    alert(`Perfil guardado localmente.\nNombre: ${nuevoNombre}\nEstado: ${nuevoEstado}`);
}

/** Restaura sesión si ya hay token de Supabase */
async function intentarRestaurarSesion() {
    if (!window.ToxichatAuth || typeof window.ToxichatAuth.obtenerSesion !== "function") return;
    if (!window.ToxichatDB || !window.ToxichatDB.estaConfigurado()) return;

    const sesion = await window.ToxichatAuth.obtenerSesion();
    if (sesion) mostrarAppAutenticada(sesion);
}

document.addEventListener("DOMContentLoaded", function () {
    intentarRestaurarSesion();
});

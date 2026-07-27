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

// Diccionario para almacenar la informacion del amigo indexada por su UUID
const amigosPorId = {};

function obtenerPilaChat(idChat) {
    if (!pilasPorChat[idChat]) {
        pilasPorChat[idChat] = new PilaMensajes();
    }
    return pilasPorChat[idChat];
}

// Referencia al canal Realtime activo (para desuscribirse al cerrar sesion)
let canalMensajes = null;
let canalSolicitudes = null;

// --- MÓDULO DE DIEGO (GRAFO SOCIAL) ---
window.socialGraph = window.Graph ? new window.Graph() : null;

async function cargarGrafoSocial() {
    if (!window.socialGraph || !usuarioActual || !usuarioActual.id) return;
    console.log("[Grafo Social] Cargando conexiones reales desde la base de datos...");

    window.socialGraph.addNode(usuarioActual.id);

    if (!window.ToxichatDB || !window.ToxichatDB.estaConfigurado()) {
        return;
    }

    try {
        const { data, error } = await window.ToxichatDB.cliente.rpc('obtener_grafo_amistades');
        if (error) {
            console.error("[Grafo Social] Error al obtener el grafo de la BD:", error.message);
            return;
        }

        if (Array.isArray(data)) {
            data.forEach(arista => {
                // arista: { usuario_a, usuario_b, mensajes, peso }
                window.socialGraph.addEdge(arista.usuario_a, arista.usuario_b, arista.mensajes || 0);
            });
        }
    } catch (error) {
        console.error("[Grafo Social] Excepción al cargar conexiones:", error);
    }
}

async function cargarListaChats() {
    const listaChats = document.getElementById("lista-chats-container");
    if (!listaChats) return;

    if (!window.ToxichatDB || !window.ToxichatDB.estaConfigurado()) {
        return;
    }

    try {
        const { data, error } = await window.ToxichatDB.cliente.rpc('obtener_mis_amigos');
        if (error) {
            console.error("[Chats] Error al cargar mis amigos:", error.message);
            return;
        }

        listaChats.innerHTML = "";

        if (!data || data.length === 0) {
            listaChats.innerHTML = '<p style="color: #666; padding: 15px; font-size: 13px;">No tienes chats activos aún. ¡Agrega un amigo!</p>';
            return;
        }

        data.forEach(amigo => {
            // Guardar en cache el objeto amigo usando su UUID
            amigosPorId[amigo.id] = amigo;

            const div = document.createElement("div");
            div.className = "chat-item";
            div.id = `chat-${amigo.id}`;
            const nombreMostrar = amigo.alias || amigo.nombre_usuario || amigo.email;
            const inicial = nombreMostrar.charAt(0).toUpperCase();

            div.onclick = () => abrirChat(amigo.id, nombreMostrar, amigo.email);
            div.innerHTML = `
                <div class="avatar">${inicial}</div>
                <div class="chat-info">
                    <h4>${nombreMostrar}</h4>
                    <p>${amigo.email}</p>
                </div>
                <span class="badge-no-leido" id="badge-${amigo.id}">0</span>
            `;
            listaChats.appendChild(div);
        });
    } catch (error) {
        console.error("[Chats] Excepción en cargarListaChats:", error);
    }
}

async function cargarSolicitudesPendientes() {
    const listaSolicitudes = document.getElementById("lista-solicitudes");
    if (!listaSolicitudes) return;

    if (!window.ToxichatDB || !window.ToxichatDB.estaConfigurado()) {
        return;
    }

    try {
        const { data, error } = await window.ToxichatDB.cliente.rpc('obtener_solicitudes_pendientes');
        if (error) {
            console.error("[Solicitudes] Error al obtener solicitudes pendientes:", error.message);
            return;
        }

        listaSolicitudes.innerHTML = "";

        if (!data || data.length === 0) {
            listaSolicitudes.innerHTML = '<p style="color: #666; font-size: 13px;">No tienes solicitudes pendientes.</p>';
            return;
        }

        data.forEach(sol => {
            const div = document.createElement("div");
            div.className = "solicitud-item";
            div.id = `solicitud-${sol.solicitud_id}`;
            const nombreMostrar = sol.alias || sol.email;

            div.innerHTML = `
                <span>${nombreMostrar}</span>
                <div>
                    <button class="btn-aceptar" onclick="aceptarAmigo('${sol.solicitud_id}', '${nombreMostrar}', '${sol.email}')">Aceptar</button>
                    <button class="btn-rechazar" onclick="rechazarSolicitud('${sol.solicitud_id}', 'solicitud-${sol.solicitud_id}')">Rechazar</button>
                </div>
            `;
            listaSolicitudes.appendChild(div);
        });
    } catch (error) {
        console.error("[Solicitudes] Excepción en cargarSolicitudesPendientes:", error);
    }
}

async function cargarDatosIniciales() {
    await cargarGrafoSocial();
    await cargarListaChats();
    await cargarSolicitudesPendientes();
    actualizarListaAmigos();
}

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

// =========================================================
// --- LÓGICA DE INTERFAZ GRÁFICA (LAU) ---
// =========================================================

let usuarioActual = null; // Guardará los datos de quien inicie sesión

function mostrarAppAutenticada(sesion) {
    // Cargar perfil guardado localmente si existe
    let perfilLocal = null;
    try {
        const raw = localStorage.getItem("perfil_" + sesion.email);
        if (raw) perfilLocal = JSON.parse(raw);
    } catch (_) { }

    usuarioActual = {
        id: sesion.email,
        nombre: (perfilLocal && perfilLocal.nombre) || sesion.email,
        estado: (perfilLocal && perfilLocal.estado) || "",
        email: sesion.email,
        uuid: sesion.id,
        rsa_e: sesion.rsa_e,
        rsa_n: sesion.rsa_n,
        contactoClavePub: null, // clave publica del chat activo
    };

    document.getElementById("pantalla-login").style.display = "none";
    document.getElementById("pantalla-app").style.display = "flex";

    const etiqueta = document.getElementById("nombre-usuario-activo");
    if (etiqueta) etiqueta.textContent = usuarioActual.nombre;

    const perfilNombre = document.getElementById("perfil-nombre");
    if (perfilNombre) perfilNombre.value = usuarioActual.nombre;

    const perfilEstado = document.getElementById("perfil-estado");
    if (perfilEstado) perfilEstado.value = usuarioActual.estado;

    if (window.socialGraph && usuarioActual.id) {
        window.socialGraph.addNode(usuarioActual.id);
    }

    cargarDatosIniciales();
    suscribirseAMensajes();
    suscribirseASolicitudes();
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
async function cerrarSesionApp() {
    // Desuscribirse del canal Realtime antes de limpiar
    if (canalMensajes && window.ToxichatDB && window.ToxichatDB.cliente) {
        await window.ToxichatDB.cliente.removeChannel(canalMensajes);
        canalMensajes = null;
    }
    if (canalSolicitudes && window.ToxichatDB && window.ToxichatDB.cliente) {
        await window.ToxichatDB.cliente.removeChannel(canalSolicitudes);
        canalSolicitudes = null;
    }

    usuarioActual = null;

    document.getElementById("pantalla-app").style.display = "none";
    document.getElementById("pantalla-login").style.display = "block";

    document.getElementById("email-input").value = "";
    document.getElementById("password-input").value = "";

    const mensaje = document.getElementById("auth-mensaje");
    if (mensaje) mensaje.textContent = "Sesion cerrada correctamente.";

    if (window.ToxichatAuth && typeof window.ToxichatAuth.cerrarSesion === "function") {
        await window.ToxichatAuth.cerrarSesion();
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
    const inputEl = document.getElementById("mensaje-input");
    const texto = inputEl ? inputEl.value.trim() : "";
    const correoDestino = document.getElementById("correo-amigo-actual").value;

    if (!destinatario || !texto) return;

    const rutaValida = validarRuta_DIEGO(usuarioActual.id, correoDestino);
    if (!rutaValida) {
        mostrarMensajeUI("No tienes conexion en el grafo con este usuario.", "error");
        return;
    }

    const btnEnviar = document.querySelector("#vista-chat-individual button[onclick='enviarMensaje()']");
    if (btnEnviar) { btnEnviar.disabled = true; btnEnviar.textContent = "Enviando..."; }

    const guardadoExitoso = await enviarMensajeDB_SANTI(
        usuarioActual.id,
        destinatario,
        texto,
        correoDestino
    );

    if (btnEnviar) { btnEnviar.disabled = false; btnEnviar.textContent = "Enviar"; }

    if (guardadoExitoso) {
        const pila = obtenerPilaChat(destinatario);
        renderizarMensaje(pila, "Yo", texto, true);
        if (inputEl) inputEl.value = "";
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
            console.error("[Crypto] ToxichatCrypto no esta disponible.");
            return false;
        }
        if (!window.ToxichatDB || !window.ToxichatDB.estaConfigurado()) {
            console.warn("[DB] Supabase no configurado.");
            return true;
        }

        const destino = emailDestino || destinatarioId;

        // E1/E2: Cifrar con la clave publica del destinatario si esta disponible
        let contenidoCifrado = null;
        const claveDest = usuarioActual && usuarioActual.contactoClavePub;
        if (claveDest && claveDest.e && claveDest.n) {
            try {
                const bloques = window.ToxichatCrypto.cifrarTexto(mensajePlano, claveDest);
                contenidoCifrado = JSON.stringify(bloques.map(String));
            } catch (eCipher) {
                console.warn("[Crypto] No se pudo cifrar con clave del destinatario:", eCipher.message);
            }
        } else {
            console.warn("[Crypto] Clave publica del destinatario no disponible, enviando sin cifrar.");
        }

        const { error } = await window.ToxichatDB.cliente.rpc("enviar_mensaje", {
            p_email_destino: destino,
            p_contenido: mensajePlano,
            p_contenido_cifrado: contenidoCifrado,
        });

        if (error) {
            console.error("[DB] Error al guardar mensaje:", error.message);
            mostrarMensajeUI("No se pudo guardar el mensaje: " + error.message, "error");
            return false;
        }

        return true;
    } catch (error) {
        console.error("[enviarMensajeDB_SANTI]", error);
        mostrarMensajeUI(error.message || String(error), "error");
        return false;
    }
}

// =========================================================
// --- LÓGICA DE NAVEGACIÓN Y UI REDISEÑADA ---
// =========================================================

/** Navegación entre las vistas principales (Chats / Perfil / Social) */
function cambiarVista(idVistaActiva, idBotonActivo) {
    // 1. Ocultar todas las vistas
    document.getElementById("vista-chats").classList.add("oculta");
    document.getElementById("vista-chats").classList.remove("activa");
    document.getElementById("vista-perfil").classList.add("oculta");
    document.getElementById("vista-perfil").classList.remove("activa");
    document.getElementById("vista-chat-individual").classList.add("oculta");
    document.getElementById("vista-chat-individual").classList.remove("activa");
    document.getElementById("vista-social").classList.add("oculta");
    document.getElementById("vista-social").classList.remove("activa");

    // 2. Mostrar la vista seleccionada
    document.getElementById(idVistaActiva).classList.remove("oculta");
    document.getElementById(idVistaActiva).classList.add("activa");

    // 3. Cambiar estilos de los botones de la barra inferior
    if (idBotonActivo) {
        document.getElementById("nav-chats").classList.remove("activo");
        document.getElementById("nav-perfil").classList.remove("activo");
        document.getElementById("nav-social").classList.remove("activo");
        document.getElementById(idBotonActivo).classList.add("activo");
    }

    // Dibujar grafo si se abre la vista social
    if (idVistaActiva === "vista-social") {
        dibujarGrafoUI();
    }
}

/** Funcionalidad para agregar un nuevo amigo */
async function agregarAmigo() {
    const correoAmigo = prompt("Ingresa el CORREO ELECTRONICO (unico) de tu nuevo amigo:");
    if (!correoAmigo || correoAmigo.trim() === "") return;

    if (!window.ToxichatDB || !window.ToxichatDB.estaConfigurado()) {
        alert("La base de datos no esta configurada.");
        return;
    }

    try {
        const { error } = await window.ToxichatDB.cliente.rpc('enviar_solicitud_amistad', { p_email_destino: correoAmigo.trim() });
        if (error) {
            alert("Error al enviar solicitud: " + error.message);
        } else {
            alert("Solicitud enviada a: " + correoAmigo);
        }
    } catch (err) {
        alert("Excepcion al enviar solicitud: " + err.message);
    }
}

/** D1: Descifra un bloque cifrado RSA usando la clave privada local. */
function descifrarMensajeLocal(contenidoCifradoStr) {
    try {
        if (!window.ToxichatCrypto) return "[cifrado]";
        const bloques = JSON.parse(contenidoCifradoStr).map(BigInt);
        return window.ToxichatCrypto.descifrarTexto(bloques);
    } catch (_) {
        return "[cifrado]";
    }
}

/** M3: Renderiza un mensaje en la pila y el DOM. */
function renderizarMensaje(pila, remitente, texto, esMio) {
    pila.push({ remitente, texto });

    const panel = document.getElementById("panel-mensajes");
    if (!panel) return;

    const div = document.createElement("div");
    div.className = "mensaje-item" + (esMio ? " mio" : "");
    div.textContent = esMio ? texto : `${remitente}: ${texto}`;
    // panel-mensajes es column-reverse, insertamos al principio = aparece abajo
    panel.insertBefore(div, panel.firstChild);
    panel.scrollTop = panel.scrollHeight; // Asegurar scroll al fondo al renderizar
}

/** M2: Carga el historial de mensajes desde la BD para el chat abierto. */
async function cargarHistorialChat(correoAmigo) {
    const panel = document.getElementById("panel-mensajes");
    if (!panel) return;
    panel.innerHTML = "<p style='color:#555; font-size:12px; text-align:center;'>Cargando historial...</p>";

    if (!window.ToxichatDB || !window.ToxichatDB.estaConfigurado()) {
        panel.innerHTML = "";
        return;
    }

    try {
        const { data, error } = await window.ToxichatDB.cliente.rpc("obtener_conversacion", {
            p_email_otro: correoAmigo
        });

        panel.innerHTML = "";

        if (error) {
            console.error("[Historial] Error:", error.message);
            return;
        }

        if (!data || data.length === 0) return;

        const amigoId = document.getElementById("destinatario-input").value;
        const pila = obtenerPilaChat(amigoId);
        pila.elementos = []; // limpiar pila antes de recargar

        // Los mensajes vienen en orden ascendente; renderizamos desde el mas antiguo
        data.forEach(msg => {
            const esMio = msg.remitente_id === (usuarioActual && usuarioActual.uuid);
            let texto;
            if (msg.contenido_cifrado) {
                texto = descifrarMensajeLocal(msg.contenido_cifrado);
            } else {
                texto = msg.contenido;
            }
            const remitente = esMio ? "Yo" : correoAmigo;
            renderizarMensaje(pila, remitente, texto, esMio);
        });
    } catch (err) {
        console.error("[Historial] Excepcion:", err);
        panel.innerHTML = "";
    }
}

/** M1: Abre la vista individual de un chat y carga su historial. */
async function abrirChat(amigoId, nombreMostrar, correo) {
    // Resetear UI
    document.getElementById("destinatario-input").value = amigoId;
    document.getElementById("correo-amigo-actual").value = correo;
    document.getElementById("chat-actual-alias").innerText = nombreMostrar;
    document.getElementById("modal-amigo").classList.add("oculta");

    // Resetear la pila local para este chat
    pilasPorChat[amigoId] = new PilaMensajes();

    // Limpio panel de mensajes
    const panel = document.getElementById("panel-mensajes");
    if (panel) panel.innerHTML = "";

    // E1: Cargar clave publica RSA del destinatario desde la BD
    if (usuarioActual) {
        usuarioActual.contactoClavePub = null;
        if (window.ToxichatDB && window.ToxichatDB.estaConfigurado()) {
            try {
                const { data: perfData } = await window.ToxichatDB.cliente
                    .rpc("obtener_clave_publica_por_email", { p_email: correo });
                if (perfData && perfData.length > 0) {
                    const clave = perfData[0];
                    if (clave.rsa_e && clave.rsa_n) {
                        usuarioActual.contactoClavePub = {
                            e: BigInt(clave.rsa_e),
                            n: BigInt(clave.rsa_n)
                        };
                    }
                }
            } catch (_) {
                console.warn("[E1] No se pudo cargar la clave publica del destinatario.");
            }
        }
    }

    // M2: Cargar historial desde BD
    await cargarHistorialChat(correo);

    // Renderizar mensajes pendientes en la pila (Realtime que llegaron antes de abrir)
    const pila = obtenerPilaChat(amigoId);
    if (pila) {
        pila.actualizarDOM();
    }

    // N2: Resetear el badge de mensajes no leídos
    const badge = document.getElementById("badge-" + amigoId);
    if (badge) {
        badge.textContent = "0";
        badge.style.display = "none";
    }

    cambiarVista("vista-chat-individual", "nav-chats");
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

/** Actualiza la lista de amigos en la interfaz de perfil */
function actualizarListaAmigos() {
    const contenedor = document.getElementById("lista-amigos-perfil");
    if (!contenedor) return;
    contenedor.innerHTML = "";

    if (!usuarioActual || !window.socialGraph || !window.socialGraph.nodes || !window.socialGraph.nodes[usuarioActual.id]) {
        contenedor.innerHTML = '<p style="color: #666; font-size: 13px;">Aún no tienes amigos agregados.</p>';
        return;
    }

    const misConexiones = window.socialGraph.nodes[usuarioActual.id] || {};
    const amigosIds = Object.keys(misConexiones);

    if (amigosIds.length === 0) {
        contenedor.innerHTML = '<p style="color: #666; font-size: 13px;">Aún no tienes amigos agregados.</p>';
        return;
    }

    amigosIds.forEach(idAmigo => {
        const div = document.createElement("div");
        div.className = "solicitud-item";
        div.id = `amigo-perfil-${idAmigo}`;
        div.innerHTML = `
            <span style="color: #39ff14;">${idAmigo}</span>
            <button class="btn-rechazar" onclick="eliminarAmigo('${idAmigo}')">Eliminar</button>
        `;
        contenedor.appendChild(div);
    });
}

/** Guardar información de mi perfil */
function guardarPerfil() {
    const nuevoNombreInput = document.getElementById("perfil-nombre");
    const nuevoEstadoInput = document.getElementById("perfil-estado");
    if (!nuevoNombreInput || !nuevoEstadoInput) return;

    const nuevoNombre = nuevoNombreInput.value.trim();
    const nuevoEstado = nuevoEstadoInput.value.trim();

    if (nuevoNombre === "") {
        alert("El nombre no puede estar vacío.");
        return;
    }

    if (usuarioActual) {
        usuarioActual.nombre = nuevoNombre;
        usuarioActual.estado = nuevoEstado;
        const etiqueta = document.getElementById("nombre-usuario-activo");
        if (etiqueta) etiqueta.textContent = usuarioActual.nombre;
    }

    // Persistir en localStorage
    const perfil = {
        nombre: nuevoNombre,
        estado: nuevoEstado
    };
    try {
        localStorage.setItem("perfil_" + usuarioActual.email, JSON.stringify(perfil));
        alert("Perfil guardado correctamente.");
    } catch (e) {
        console.error("Error guardando perfil en localStorage", e);
        alert("No se pudo guardar el perfil en el navegador.");
    }

    actualizarListaAmigos();
}

async function aceptarAmigo(solicitudId, nombre, correo) {
    if (!usuarioActual || !window.ToxichatDB) return;

    try {
        const { error } = await window.ToxichatDB.cliente.rpc('aceptar_solicitud_amistad', { p_solicitud_id: solicitudId });

        if (error) {
            alert("Error al aceptar amigo: " + error.message);
            return;
        }

        // Recargar datos actualizados desde la BD
        await cargarDatosIniciales();
        alert(nombre + " ha sido agregado a tu lista de amigos.");
    } catch (err) {
        alert("Excepcion al aceptar amigo: " + err.message);
    }
}

async function rechazarSolicitud(solicitudId, idDOM) {
    if (!window.ToxichatDB) return;
    try {
        const { error } = await window.ToxichatDB.cliente.rpc('rechazar_solicitud_amistad', { p_solicitud_id: solicitudId });
        if (error) {
            alert("Error al rechazar solicitud: " + error.message);
            return;
        }
        const el = document.getElementById(idDOM);
        if (el) el.remove();
    } catch (err) {
        alert("Excepcion al rechazar solicitud: " + err.message);
    }
}

async function eliminarAmigo(nombreUsuario) {
    if (!window.ToxichatDB || !window.ToxichatDB.estaConfigurado()) {
        mostrarMensajeUI("La base de datos no esta configurada.", "error");
        return;
    }

    try {
        const { error } = await window.ToxichatDB.cliente.rpc('eliminar_amistad', { p_nombre_usuario: nombreUsuario });
        if (error) {
            mostrarMensajeUI("Error al eliminar amigo: " + error.message, "error");
            return;
        }

        // Recargar datos actualizados desde la BD para mantener sincronizado
        await cargarDatosIniciales();
        mostrarMensajeUI("Amigo eliminado correctamente.", "exito");
    } catch (err) {
        mostrarMensajeUI("Excepcion al eliminar amigo: " + err.message, "error");
    }
}

// R1: Suscripcion a mensajes entrantes via Supabase Realtime
function suscribirseAMensajes() {
    if (!window.ToxichatDB || !window.ToxichatDB.estaConfigurado() || !usuarioActual) return;

    // Evitar suscripciones duplicadas
    if (canalMensajes) {
        window.ToxichatDB.cliente.removeChannel(canalMensajes);
    }

    canalMensajes = window.ToxichatDB.cliente
        .channel("mensajes-entrantes")
        .on("postgres_changes", {
            event: "INSERT",
            schema: "public",
            table: "mensajes",
            filter: `destinatario_id=eq.${usuarioActual.uuid}`
        }, manejarMensajeEntrante)
        .subscribe();
}

// R2: Manejar un mensaje entrante en tiempo real
function manejarMensajeEntrante(payload) {
    const msg = payload.new;
    if (!msg || !usuarioActual) return;

    const remitenteId = msg.remitente_id;
    const amigo = amigosPorId[remitenteId];
    if (!amigo) {
        console.warn("[Realtime] Mensaje de remitente desconocido:", remitenteId);
        return;
    }

    // Filtrar por grafo: solo aceptar de amigos (validado con su correo)
    if (!esAmigoEnGrafo(amigo.email)) {
        console.warn("[Realtime] Mensaje ignorado de no-amigo:", amigo.email);
        return;
    }

    let texto;
    if (msg.contenido_cifrado) {
        texto = descifrarMensajeLocal(msg.contenido_cifrado);
    } else {
        texto = msg.contenido;
    }

    const remitente = amigo.alias || amigo.nombre_usuario || amigo.email;

    // Encontrar el amigoId (UUID) para la pila
    const pila = obtenerPilaChat(remitenteId);

    // Si el chat activo es del remitente, mostrar en DOM
    const chatActivoId = document.getElementById("destinatario-input").value;
    if (chatActivoId === remitenteId) {
        renderizarMensaje(pila, remitente, texto, false);
    } else {
        pila.push({ remitente, texto });

        // N2: Incrementar badge de no leídos
        const badge = document.getElementById("badge-" + remitenteId);
        if (badge) {
            let num = parseInt(badge.textContent) || 0;
            badge.textContent = num + 1;
            badge.style.display = "inline-block";
        }
    }
}

// S1: Suscripcion a solicitudes entrantes
function suscribirseASolicitudes() {
    if (!window.ToxichatDB || !window.ToxichatDB.estaConfigurado() || !usuarioActual) return;

    if (canalSolicitudes) {
        window.ToxichatDB.cliente.removeChannel(canalSolicitudes);
    }

    canalSolicitudes = window.ToxichatDB.cliente
        .channel("solicitudes-entrantes")
        .on("postgres_changes", {
            event: "INSERT",
            schema: "public",
            table: "solicitudes_amistad",
            filter: `para_usuario_id=eq.${usuarioActual.uuid}`
        }, (payload) => {
            console.log("[Realtime] Nueva solicitud recibida");
            cargarSolicitudesPendientes(); // Recargar la lista de solicitudes visualmente
        })
        .subscribe();
}

/** DIBUJAR EL GRAFO SOCIAL EN EL CANVAS */
function dibujarGrafoUI() {
    const canvas = document.getElementById("grafo-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    if (!window.socialGraph || Object.keys(window.socialGraph.nodes).length === 0) {
        ctx.fillStyle = "#aaa";
        ctx.font = "14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("El grafo esta vacio o no se ha cargado.", width / 2, height / 2);
        return;
    }

    const nodes = Object.keys(window.socialGraph.nodes);
    const positions = {};

    // Asignar posiciones: el usuarioActual al centro, el resto en un circulo
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(cx, cy) - 50;

    let idx = 0;
    const numAmigos = nodes.length > 1 ? nodes.length - 1 : 1;

    nodes.forEach(node => {
        if (usuarioActual && node === usuarioActual.id) {
            positions[node] = { x: cx, y: cy };
        } else {
            const angle = (idx / numAmigos) * 2 * Math.PI;
            positions[node] = {
                x: cx + radius * Math.cos(angle),
                y: cy + radius * Math.sin(angle)
            };
            idx++;
        }
    });

    // Dibujar aristas (líneas)
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(138, 43, 226, 0.5)"; // Morado toxico

    const drawnEdges = new Set();

    nodes.forEach(u => {
        const neighbors = window.socialGraph.nodes[u];
        for (let v in neighbors) {
            const edgeId = [u, v].sort().join("-");
            if (drawnEdges.has(edgeId)) continue;
            drawnEdges.add(edgeId);

            if (positions[u] && positions[v]) {
                ctx.beginPath();
                ctx.moveTo(positions[u].x, positions[u].y);
                ctx.lineTo(positions[v].x, positions[v].y);
                ctx.stroke();

                // Escribir el peso
                const weight = neighbors[v].toFixed(1);
                const mx = (positions[u].x + positions[v].x) / 2;
                const my = (positions[u].y + positions[v].y) / 2;
                ctx.fillStyle = "#fff";
                ctx.font = "12px sans-serif";
                ctx.fillText(weight, mx, my);
            }
        }
    });

    // Dibujar nodos (círculos)
    nodes.forEach(node => {
        const { x, y } = positions[node];
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, 2 * Math.PI);
        const isMe = (usuarioActual && node === usuarioActual.id);
        ctx.fillStyle = isMe ? "#39ff14" : "#8a2be2";
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.stroke();

        ctx.fillStyle = isMe ? "#000" : "#fff";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        // Mostrar inicial o las primeras letras
        ctx.fillText(node.substring(0, 3).toUpperCase(), x, y);
    });
}

async function intentarRestaurarSesion() {
    if (!window.ToxichatAuth || typeof window.ToxichatAuth.obtenerSesion !== "function") return;
    try {
        const sesion = await window.ToxichatAuth.obtenerSesion();
        if (sesion) {
            mostrarAppAutenticada(sesion);
        }
    } catch (error) {
        console.warn("Error al intentar restaurar sesion:", error);
    }
}

document.addEventListener("DOMContentLoaded", function () {
    // E6: listener Enter para enviar mensaje
    const inputMensaje = document.getElementById("mensaje-input");
    if (inputMensaje) {
        inputMensaje.addEventListener("keydown", function (e) {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                enviarMensaje();
            }
        });
    }
    intentarRestaurarSesion();
});

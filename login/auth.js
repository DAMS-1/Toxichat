/**
 * Autenticación Toxichat con Supabase Auth + tabla perfiles.
 * Login/registro por email (identificador único en la BD).
 */

const CLAVE_SESION = "toxichat_sesion";

function db() {
  if (!window.ToxichatDB || !window.ToxichatDB.cliente) {
    throw new Error(
      "Supabase no está configurado. Copia config.example.js a config.js y pega tu URL y anon key."
    );
  }
  return window.ToxichatDB.cliente;
}

function guardarSesionDesdePerfil(perfil, authUser) {
  const sesion = {
    id: perfil.id,
    email: perfil.email,
    rsa_e: perfil.rsa_e || null,
    rsa_n: perfil.rsa_n || null,
    authId: authUser ? authUser.id : perfil.id,
    iniciadoEn: new Date().toISOString(),
  };
  localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
  return sesion;
}

function obtenerSesionLocal() {
  const raw = localStorage.getItem(CLAVE_SESION);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    localStorage.removeItem(CLAVE_SESION);
    return null;
  }
}

/**
 * Sincroniza la clave pública RSA del módulo de criptografía con el perfil en BD.
 */
async function sincronizarClaveRsaEnBd() {
  if (!window.ToxichatCrypto || typeof window.ToxichatCrypto.clavePublicaParaBd !== "function") {
    return null;
  }
  const publica = window.ToxichatCrypto.clavePublicaParaBd();
  const { data, error } = await db().rpc("guardar_clave_rsa_publica", {
    p_rsa_e: publica.e,
    p_rsa_n: publica.n,
  });
  if (error) {
    console.warn("No se pudo guardar la clave RSA en BD:", error.message);
    return null;
  }
  return data;
}

async function cargarPerfilAutenticado() {
  const { data, error } = await db().rpc("obtener_mi_perfil");
  if (error) throw error;
  if (Array.isArray(data)) return data[0] || null;
  return data || null;
}

/**
 * Registro: solo email + contraseña.
 * El correo es el identificador; alias/nombre en BD se rellenan desde el email
 * (el alias visible de contactos lo pone el otro usuario en localStorage).
 */
async function registrarUsuario({ email, contrasena }) {
  const correo = String(email || "").trim().toLowerCase();
  const pass = String(contrasena || "");

  if (!correo || !pass) {
    return { ok: false, mensaje: "Email y contraseña son obligatorios.", sesion: null };
  }

  const base = correo.split("@")[0] || "usuario";

  try {
    const { data, error } = await db().auth.signUp({
      email: correo,
      password: pass,
      options: {
        data: {
          alias: base,
          nombre_usuario: correo,
        },
      },
    });

    if (error) {
      return { ok: false, mensaje: error.message, sesion: null };
    }

    if (!data.session) {
      return {
        ok: true,
        mensaje:
          "Cuenta creada. Si Supabase pide confirmar email, confírmalo y luego inicia sesión.",
        sesion: null,
      };
    }

    await db().rpc("registrar_perfil", {
      p_alias: base,
      p_nombre_usuario: correo,
    });

    await sincronizarClaveRsaEnBd();
    let perfil = await cargarPerfilAutenticado();
    if (!perfil) {
      return {
        ok: false,
        mensaje: "Cuenta creada pero no se encontró el perfil en la BD.",
        sesion: null,
      };
    }

    const sesion = guardarSesionDesdePerfil(perfil, data.user);
    return { ok: true, mensaje: "Registro e inicio de sesión correctos.", sesion };
  } catch (error) {
    return { ok: false, mensaje: error.message || String(error), sesion: null };
  }
}

/**
 * Login con email + contraseña (Supabase Auth).
 */
async function iniciarSesion(email, contrasena) {
  const correo = String(email || "").trim().toLowerCase();
  const pass = String(contrasena || "");

  if (!correo) {
    return { ok: false, mensaje: "Ingresa tu correo.", sesion: null };
  }
  if (!pass) {
    return { ok: false, mensaje: "Ingresa una contraseña.", sesion: null };
  }

  try {
    const { data, error } = await db().auth.signInWithPassword({
      email: correo,
      password: pass,
    });

    if (error) {
      return { ok: false, mensaje: error.message, sesion: null };
    }

    let perfil = await cargarPerfilAutenticado();
    if (!perfil) {
      const base = correo.split("@")[0];
      await db().rpc("registrar_perfil", {
        p_alias: base,
        p_nombre_usuario: correo,
      });
      perfil = await cargarPerfilAutenticado();
    }

    if (!perfil) {
      return {
        ok: false,
        mensaje: "Login OK en Auth, pero no hay fila en perfiles.",
        sesion: null,
      };
    }

    if (!perfil.rsa_e || !perfil.rsa_n) {
      await sincronizarClaveRsaEnBd();
      perfil = (await cargarPerfilAutenticado()) || perfil;
    }

    const sesion = guardarSesionDesdePerfil(perfil, data.user);
    return { ok: true, mensaje: "Inicio de sesión correcto.", sesion };
  } catch (error) {
    return { ok: false, mensaje: error.message || String(error), sesion: null };
  }
}

/**
 * Restaura sesión desde Supabase (si el token sigue válido).
 */
async function obtenerSesion() {
  try {
    if (!window.ToxichatDB || !window.ToxichatDB.estaConfigurado()) {
      return obtenerSesionLocal();
    }

    const { data, error } = await db().auth.getSession();
    if (error || !data.session) {
      localStorage.removeItem(CLAVE_SESION);
      return null;
    }

    let perfil = await cargarPerfilAutenticado();
    if (!perfil) return obtenerSesionLocal();

    return guardarSesionDesdePerfil(perfil, data.session.user);
  } catch (error) {
    console.warn("obtenerSesion:", error.message);
    return obtenerSesionLocal();
  }
}

async function cerrarSesion() {
  try {
    if (window.ToxichatDB && window.ToxichatDB.estaConfigurado()) {
      await db().auth.signOut();
    }
  } catch (error) {
    console.warn("cerrarSesion:", error.message);
  }
  localStorage.removeItem(CLAVE_SESION);
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    CLAVE_SESION,
    registrarUsuario,
    iniciarSesion,
    obtenerSesion,
    cerrarSesion,
    obtenerSesionLocal,
    sincronizarClaveRsaEnBd,
  };
}

if (typeof window !== "undefined") {
  window.ToxichatAuth = {
    CLAVE_SESION,
    registrarUsuario,
    iniciarSesion,
    obtenerSesion,
    cerrarSesion,
    obtenerSesionLocal,
    sincronizarClaveRsaEnBd,
  };
}

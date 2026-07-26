/**
 * Cliente Supabase para Toxichat (navegador).
 */
(function (global) {
  function normalizarUrl(url) {
    return String(url || "")
      .trim()
      .replace(/\/+$/, "")
      .replace(/\/rest\/v1$/i, "")
      .replace(/\/auth\/v1$/i, "");
  }

  function crearCliente() {
    const config = global.TOXICHAT_CONFIG || {};
    const url = normalizarUrl(config.SUPABASE_URL);
    const key = config.SUPABASE_ANON_KEY || "";

    if (!url || url.includes("TU_PROYECTO") || !key || key === "tu_anon_key") {
      console.warn(
        "Toxichat: configura SUPABASE_URL y SUPABASE_ANON_KEY en config.js"
      );
      return null;
    }

    if (!global.supabase || typeof global.supabase.createClient !== "function") {
      console.error("Toxichat: no se carg├│ el SDK de Supabase.");
      return null;
    }

    return global.supabase.createClient(url, key);
  }

  const cliente = crearCliente();

  global.ToxichatDB = {
    cliente,
    estaConfigurado: function () {
      return cliente !== null;
    },
  };
})(window);

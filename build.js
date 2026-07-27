const fs = require('fs');

// Si ya existe localmente y no estamos en Vercel, no lo sobreescribimos
if (!process.env.VERCEL && fs.existsSync('config.js')) {
  console.log('config.js ya existe localmente. Omitiendo generacion para evitar sobrescribir tus claves.');
  process.exit(0);
}

// Generar config.js dinámicamente usando variables de entorno en Vercel
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";

const content = `// Generado automáticamente en el build step
window.TOXICHAT_CONFIG = {
  SUPABASE_URL: "${supabaseUrl}",
  SUPABASE_ANON_KEY: "${supabaseAnonKey}"
};
`;

fs.writeFileSync('config.js', content);
console.log('config.js generado exitosamente con variables de entorno.');

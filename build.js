const fs = require('fs');

const esVercel = !!process.env.VERCEL;

if (!esVercel && fs.existsSync('config.js')) {
  console.log('config.js ya existe localmente. Omitiendo generacion para evitar sobrescribir tus claves.');
} else {
  // Generar config.js dinámicamente usando variables de entorno
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
}

// Si estamos en Vercel, preparamos la carpeta dist para que sea el output de produccion
if (esVercel) {
  console.log('Detectado entorno Vercel. Preparando carpeta "dist"...');
  
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
  }
  fs.mkdirSync('dist');
  
  // Copiar archivos individuales
  fs.copyFileSync('config.js', 'dist/config.js');
  fs.copyFileSync('index.html', 'dist/index.html');
  fs.copyFileSync('app.js', 'dist/app.js');
  
  // Copiar directorios
  fs.cpSync('Criptografia', 'dist/Criptografia', { recursive: true });
  fs.cpSync('login', 'dist/login', { recursive: true });
  fs.cpSync('src', 'dist/src', { recursive: true });
  
  console.log('Carpeta "dist" generada con exito.');
}


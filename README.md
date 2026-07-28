# ToxiChat

## Descripción
ToxiChat es una aplicación web de mensajería (Single Page Application) diseñada con un enfoque único: poner a prueba la confianza y explorar dinámicas interpersonales de manera divertida y, a veces, polémica. Aunque actualmente se encuentra en su primera fase de desarrollo y faltan diversas mecánicas interactivas por integrar, el núcleo de la aplicación ya establece las bases de este ecosistema.

Para lograr este objetivo, ToxiChat incorpora de manera práctica los conceptos de **Matemáticas Discretas**:
- Utiliza **Grafos Sociales** y el **Algoritmo de Dijkstra** para calcular los niveles de confianza y las rutas de conexión válidas entre usuarios. Si dos personas no tienen un vínculo directo o indirecto establecido en el grafo, el sistema bloquea su comunicación.
- Implementa **Criptografía RSA** para asegurar que los mensajes viajen cifrados de extremo a extremo, manteniendo la total privacidad.
- **Análisis y Conteo de Interacciones**: Permite visualizar de forma clara la cantidad exacta de mensajes que cada usuario ha intercambiado con sus diferentes amigos, ofreciendo métricas transparentes sobre la frecuencia y cercanía en la red de contactos.
- Cuenta con el módulo **"ToxiPreguntas"**, una herramienta interactiva pensada para romper el hielo a través de dilemas morales y relacionales, fomentando debates intensos.

## Integrantes
- **Laura Soto**: Diseño de la interfaz de usuario (UI), panel de chats, módulo generador de conversaciones "ToxiPreguntas" e integración general del front-end.
- **Santiago Amado**: Backend, base de datos (Supabase), autenticación de usuarios y lógica de criptografía (RSA).
- **Diego Mejia**: Lógica de estructuras de datos (Grafo Social) y algoritmo de Dijkstra para calcular la confianza y las rutas más cortas entre los nodos (usuarios).

## Requisitos
Para instalar y ejecutar este proyecto localmente desde cero, necesitas contar con lo siguiente:
- Un navegador web moderno (Google Chrome, Firefox, Edge, Safari).
- **[Node.js](https://nodejs.org/es/)** instalado en tu computadora (necesario para ejecutar comandos de instalación y levantar el servidor local).
- Una cuenta gratuita en **[Supabase](https://supabase.com/)** para alojar tu propia base de datos (si deseas probar el registro y el envío de mensajes en tu propio entorno).

## Instalación y Configuración

Sigue estos pasos cuidadosamente para configurar el proyecto en tu máquina local:

1. **Clonar el repositorio:**
   Abre tu terminal (o símbolo del sistema) y ejecuta el siguiente comando:
   ```bash
   git clone https://github.com/DAMS-1/Toxichat.git

### Acceder a la carpeta del proyecto:
```bash
cd Toxichat
```

### Configurar la conexión a la Base de Datos
Para que la aplicación pueda guardar usuarios y mensajes, necesita credenciales de Supabase:
* Dentro de la carpeta del proyecto, busca el archivo llamado `config.example.js`.
* Cópialo y renombra la copia exactamente a `config.js`.
* Abre este nuevo archivo `config.js` en cualquier editor de texto y reemplaza los textos de muestra por la URL y la API Key pública de tu proyecto de Supabase. *(Nota: Por seguridad, este archivo está excluido del control de versiones en GitHub).*

## Ejecución y Acceso
Puedes acceder y probar la aplicación de dos formas:

### Opción 1: Acceso Directo en Línea (Vercel)
Si no deseas realizar una instalación local ni clonar el repositorio, la aplicación se encuentra desplegada en producción a través de Vercel y lista para usarse:
 [Haga clic aqui para ingresar a la app](https://toxichat-mu.vercel.app/) 

### Opción 2: Ejecución Local
Si has clonado el repositorio y configurado el archivo `config.js`:

1. **Instalar una herramienta para servir archivos estáticos** (solo debes hacerlo una vez):
   ```bash
   npm install -g serve
   ```
2. **Ejecutar el servidor** en la raíz del proyecto:
   ```bash
   serve .
   ```
3. **Abrir la aplicación:** La terminal te mostrará una dirección web (por lo general, `http://localhost:3000`). Abre ese enlace en tu navegador para empezar a usar la aplicación.

> **Alternativa rápida:** Si usas Visual Studio Code, puedes instalar la extensión "Live Server", dar clic derecho sobre el archivo `index.html` y seleccionar "Open with Live Server".

## Ejemplo de uso
* **Inicio de Sesión:** Abre la aplicación. Registra una cuenta nueva o inicia sesión si ya posees una.
* **La Red de Confianza (Grafo Social):** Dirígete a la pestaña "Social". Aquí el algoritmo de Dijkstra analiza tu cercanía con otros usuarios en la red. Si intentas enviarle un mensaje a un usuario con quien no tienes ninguna conexión válida (Costo: Infinito), el envío será rechazado.
* **Conversación Privada y Segura:** Si tienes conexión matemática con un usuario, ve a la pestaña "Chats". Escribe tu mensaje; la aplicación utilizará matemáticas discretas (RSA) para cifrar tu texto antes de enviarlo a la nube.
* **Métricas de Interacción:** Dentro del perfil o modal de contacto, podrás visualizar el conteo total de interacciones registradas para analizar el nivel de cercanía con tus amigos.
* **Dinámicas de Conversación:** Dentro de un chat individual, presiona el botón con el icono del extraterrestre (👾). Se abrirá el panel de "ToxiPreguntas". Selecciona la categoría "Amigos" o "Pareja" y navega por las tarjetas para hacerle preguntas difíciles a tu contacto y ver cómo reacciona.

## Estado actual del proyecto
El proyecto se entrega como una versión estable funcional para la asignatura de Matemáticas Discretas I, sentando las bases algorítmicas de la aplicación.
* **Despliegue Continuo:** Desplegado activamente en Vercel para acceso libre desde cualquier navegador.
* **Backend:** Registro y autenticación operando de forma exitosa mediante Supabase.
* **Grafo Social Integrado:** El algoritmo de Dijkstra valida matemáticamente la conectividad para permitir o denegar el flujo de mensajes en la interfaz.
* **Criptografía Matemática:** Los mensajes viajan protegidos hacia la base de datos gracias a la implementación en código del algoritmo RSA.
* **Trabajo Futuro:** Aunque el ecosistema funcional principal está desarrollado (SPA, bases de datos y algoritmos), en futuras versiones se irán integrando más mecánicas interactivas y dinámicas de gamificación relacional.

# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Comunidad de la Universidad Autónoma de Santo Domingo (estudiantes, docentes, personal administrativo)
que necesita saber qué dice el Estatuto Orgánico sobre un tema concreto: quién integra un organismo,
qué derechos o deberes tiene, cómo se organiza una facultad. Llegan con una duda puntual, muchas veces
desde el teléfono, y quieren una respuesta breve y verificable (artículo citado) sin leer 113 páginas.

Audiencia secundaria confirmada: el profesor y el jurado de INF-5170, que evalúan el proyecto viendo
ese caso de uso en una demostración de pocos minutos.

## Product Purpose

«Primada» es un asistente conversacional que responde en lenguaje natural preguntas sobre el Estatuto
Orgánico de la UASD, fundamentando cada respuesta en los artículos del documento oficial y diciendo
con claridad cuándo el Estatuto no cubre lo preguntado. Éxito: una persona obtiene en segundos la
respuesta correcta, con el artículo que la respalda, y puede abrir el texto original para comprobarla.

## Positioning

A diferencia de un chat genérico, Primada solo responde desde el Estatuto: recupera los artículos
pertinentes antes de redactar, cita `[Art. N]` y enlaza la página exacta del PDF oficial. Funciona
sin servidor propio (GitHub Pages) y sigue siendo útil aunque el modelo de IA no esté disponible,
mostrando los artículos encontrados.

## Operating Context

- Documento fuente: Estatuto Orgánico de la UASD, edición actualizada 2012 (146 artículos, 22
  capítulos, glosario de 65 términos), descargado del sitio oficial de Postgrado UASD y versionado en
  `public/docs/ESTATUTO-ORGANICO-UASD.pdf`.
- Uso típico: pregunta escrita o elegida entre 35 preguntas sugeridas, conversación de varios turnos,
  historial por usuario en el navegador.
- Entorno de la demostración: proyector o portátil, posible conexión inestable; también móvil.
- Acceso con las mismas cuentas del Portafolio del curso: `mconcepcion` (Marlenis Concepción, revisora)
  y `admin` (configura proveedor de IA y claves).

## Capabilities and Constraints

- Debe: recibir preguntas, responder solo sobre el Estatuto, citar artículos, indicar cuando no hay
  información suficiente, permitir consultas consecutivas, mostrar preguntas sugeridas, guardar un
  historial básico, ser responsive.
- Arquitectura: Vue 3 + TypeScript, 100 % cliente; recuperación híbrida (BM25 + embeddings) en el
  navegador; generación con Gemini Flash-Lite vía REST con streaming; respaldo Groq y modo extractivo
  sin IA. Sin backend ni base de datos.
- Claves de API: nunca en texto plano en el repositorio; restringidas por dominio; el admin puede
  ingresarlas desde la app (cifradas por dispositivo).
- Terminología del dominio: Claustro Mayor / Menor, Consejo Universitario, Rectoría, Vicerrectorías,
  Facultades, Escuelas, Recintos / Centros / Subcentros, Personal Académico, Representación Estudiantil,
  Fuero Universitario.
- Fuera de alcance (decidido): responder temas ajenos al Estatuto, reglamentos complementarios,
  autenticación real, persistencia compartida entre dispositivos.
- Entregables adicionales: presentación (reveal.js) y documento técnico editable, enlazados desde la app.

## Brand Commitments

- Nombre del asistente: **Primada** (alusión a «Primada de América»), con el subtítulo
  «Asistente del Estatuto Orgánico de la UASD».
- Voz: institucional, clara y breve; trato de **usted**; sin emojis; cita artículos; cuando no sabe,
  lo dice con una frase fija y propone reformular.
- Identidad visual heredada del Portafolio del curso (azul UASD `#17499f`, blanco, dorado de acento,
  logo oficial UASD, tipografías Bricolage Grotesque / Public Sans). No se rediseña; se extiende.

## Evidence on Hand

- Texto íntegro del Estatuto (`src/data/estatuto.json`, generado desde el PDF).
- Las 35 preguntas sugeridas del enunciado oficial del proyecto.
- Capturas y métricas se generarán durante el desarrollo; no existen testimonios ni datos de uso
  reales y no deben inventarse.

## Product Principles

1. Ninguna afirmación sin artículo: si no hay cita, no hay respuesta.
2. Degradar, no fallar: la demostración sigue siendo útil sin IA o sin red.
3. Verificable en un clic: cada cita abre el artículo y la página del PDF oficial.
4. La conversación es el centro; todo lo demás (configuración, historial) cede espacio.
5. Lo que el usuario aprende construyéndolo importa: el código muestra las piezas del RAG con nombres claros.

## Accessibility & Inclusion

Teclado completo (enviar, cancelar, navegar citas), foco visible, `prefers-reduced-motion`, contraste
AA sobre el azul institucional, lectura en móvil con una mano.

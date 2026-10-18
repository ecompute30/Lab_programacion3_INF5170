# Primada — Asistente del Estatuto Orgánico de la UASD

Proyecto final de INF-5170 Laboratorio de Programación III. Chatbot web que responde en lenguaje
natural preguntas sobre el **Estatuto Orgánico de la Universidad Autónoma de Santo Domingo**,
fundamentando cada respuesta en los artículos del documento oficial y citándolos (`[Art. 16]`).

👉 **En línea**: https://ecompute30.github.io/Lab_programacion3_INF5170/ProyectoFinal_ChatbotEstatutoUASD/dist/
· [Presentación](https://ecompute30.github.io/Lab_programacion3_INF5170/ProyectoFinal_ChatbotEstatutoUASD/dist/presentacion/)
· [Documento técnico](docs/Documento-tecnico.docx)

| Usuario       | Contraseña inicial | Rol           |
|---------------|--------------------|---------------|
| `mconcepcion` | `12345`            | Revisora: conversa, consulta artículos, cambia su contraseña |
| `admin`       | `admin`            | Administrador: además configura proveedores de IA y claves |

Las cuentas son las mismas del [Portafolio](../Portafolio/) y, como ambas apps se sirven desde el
mismo origen de GitHub Pages, comparten el `localStorage`: la sesión y los cambios de contraseña
valen para las dos.

## Cómo funciona (RAG en el navegador)

```
 BUILD (una vez, Node)                        NAVEGADOR (en cada pregunta)
 ─────────────────────────                    ─────────────────────────────────────────────
 PDF oficial ──► construir-corpus.mjs ──►     1. Recuperar: BM25 (léxico) + coseno sobre
                 estatuto.json (146 art.,        embeddings precalculados, fusión RRF
                 65 términos, páginas)        2. Aumentar: prompt con reglas + artículos
 estatuto.json ► generar-embeddings.mjs ──►   3. Generar: Gemini Flash-Lite (streaming SSE)
                 embeddings.json (Int8)          ↓ si falla: Groq ↓ si falla: artículos sin IA
```

No hay backend. Todo corre en el cliente: la recuperación, el cifrado de claves, el historial.

### Recuperación (`src/services/recuperacion/`)
- `normalizar.ts`: sin tildes, sin palabras vacías, raíces ligeras en español.
- `bm25.ts`: índice invertido BM25 sobre 222 unidades (artículos largos subdivididos + glosario).
- `vectorial.ts`: similitud de coseno con vectores `gemini-embedding-2` (768 dims, cuantizados Int8).
- `hibrida.ts` + `recuperar.ts`: fusión por rango recíproco, penalización del glosario, refuerzo de
  artículos definitorios ("Las Facultades son…"), presupuesto de ~3 500 tokens de contexto.

### Generación (`src/services/llm/`)
- `promptSistema.ts`: reglas (solo el Estatuto, citar `[Art. N]`, frase fija cuando no hay
  información, trato de usted) y el contexto en bloques `<articulo numero="N">`.
- `proveedorGemini.ts`: REST directo (`streamGenerateContent?alt=sse`), sin SDK.
- `proveedorOpenAICompatible.ts`: formato `chat/completions`, usado con Groq como respaldo.
- `proveedorExtractivo.ts`: sin red; muestra los artículos recuperados.
- `cadenaProveedores.ts`: intenta en orden y degrada ante cuota, clave inválida, red o bloqueo.

### Claves de API y seguridad
- La app es 100 % cliente: cualquier clave que use **viaja en las peticiones del navegador**.
  Por eso la clave de Gemini debe estar **restringida** en Google Cloud (API Generative Language +
  referrers `https://ecompute30.github.io/*`, `http://localhost:*`) y en capa gratuita o con
  presupuesto con tope.
- El admin pega la clave en **Configuración**; se guarda cifrada con AES-GCM usando una `CryptoKey`
  no extraíble que vive en IndexedDB de ese navegador (`src/services/configStorage.ts`). Copiar el
  `localStorage` a otra máquina no revela nada.
- Opcionalmente, `VITE_GEMINI_API_KEY_B64` en `.env` incluye una clave por defecto en base64 en el
  build. Es ofuscación, no seguridad; solo tiene sentido con una clave restringida.
- Las respuestas se renderizan con `marked` + `DOMPurify` (lista blanca de etiquetas).

## Cómo ejecutar

```bash
npm install
npm run corpus       # PDF → public/corpus/estatuto.json (no necesita clave)
cp .env.example .env # coloque GEMINI_API_KEY para el siguiente paso
npm run embeddings   # → public/corpus/embeddings.json (una llamada por lote de 20 unidades)
npm run evaluar      # acierto@5 de la recuperación con las 35 preguntas sugeridas
npm run dev          # desarrollo
npm run build        # dist/ (lo que publica GitHub Pages)
```

Sin `embeddings.json` la app funciona igual con búsqueda léxica; sin ninguna clave, responde en
modo extractivo (artículos sin redactar) y lo avisa.

## Estructura

```
scripts/           construir-corpus.mjs · generar-embeddings.mjs · evaluar-recuperacion.ts
public/corpus/     estatuto.json · embeddings.json
public/docs/       ESTATUTO-ORGANICO-UASD.pdf (las citas enlazan a la página exacta)
public/presentacion/  reveal.js
docs/              Documento técnico (Word)
src/data/          preguntasSugeridas.ts (35 del enunciado, por tema) · marca.ts
src/services/      recuperacion/ · llm/ · corpus.ts · configStorage.ts · conversacionesStorage.ts · authStorage.ts
src/composables/   useChat · useConversaciones · useConfiguracion · useAuth
src/components/    chat/ (burbujas, compositor, citas, panel de artículo, traza RAG) · AppHeader · BannerModo
src/views/         ChatView · ConfiguracionView (admin) · LoginView · CuentaView
```

## Verificación

- `npm run evaluar`: con BM25 solo, 35/35 preguntas sugeridas tienen un artículo del capítulo
  esperado entre los 5 primeros (la regla definitoria se ajustó con estas mismas preguntas, por lo
  que la cifra es optimista; con embeddings se mide también la búsqueda híbrida).
- Playwright (Chromium) con la API de Gemini simulada: login y permisos, estado vacío, respuesta con
  citas y streaming, panel de artículo con enlace al PDF, preguntas de seguimiento con historial,
  persistencia al recargar, respaldo ante 429, modal de 35 preguntas, cifrado de la clave, móvil.
- Detector de `impeccable` sobre la UI: solo señala el acento dorado lateral, heredado a propósito
  del design system del Portafolio.

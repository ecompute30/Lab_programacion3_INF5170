# Práctica 9 — Servicios Web: Validador de Cédula Dominicana

Aplicación web que valida una cédula dominicana con el **algoritmo del módulo 10** y, además,
la contrasta con la [API oficial del gobierno dominicano](https://api.digital.gob.do/v3/cedulas/40225999348/validate).

## Stack

- **Frontend**: HTML + CSS + JavaScript plano (vanilla JS), con máscara de entrada
  (`000-0000000-0`) y animaciones de resultado (rebote en válido, sacudida en inválido).
- **Backend**: Node.js + TypeScript + Express. Sirve el frontend y expone
  `GET /api/validar/:cedula`.

## ¿Por qué un backend si el frontend es "vanilla JS"?

La API oficial del gobierno (`api.digital.gob.do`) no envía cabeceras CORS, así que una
llamada directa desde el navegador (JavaScript del cliente) sería bloqueada. Por eso el
pequeño backend en Node/TypeScript actúa como *proxy* del mismo origen: el navegador solo
habla con nuestro propio servidor, y es el servidor quien llama a la API oficial. El frontend
en sí sigue siendo HTML/CSS/JS plano, sin ningún framework.

## Algoritmo del módulo 10

Implementado en [`src/modulo10.ts`](src/modulo10.ts): cada uno de los primeros 10 dígitos se
multiplica alternadamente por 1 y 2 (si el producto tiene dos cifras, se suman sus dígitos);
la suma total determina el dígito verificador esperado, que se compara contra el dígito 11.

**Verificación empírica**: antes de integrarlo, se probó este algoritmo contra la API oficial
con 60 cédulas construidas aleatoriamente (dígito verificador calculado localmente) — las 60
coincidieron exactamente con el resultado de la API real, confirmando que la implementación
es correcta.

## Cómo ejecutar

```bash
npm install
npm run dev     # modo desarrollo
# o bien:
npm run build && npm start
```

Abre `http://localhost:3001`, escribe una cédula (el formato se aplica automáticamente) y
pulsa "Validar".

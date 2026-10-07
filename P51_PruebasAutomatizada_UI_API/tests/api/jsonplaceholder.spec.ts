import { test, expect } from '@playwright/test';

/**
 * Suite de API contra JSONPlaceholder (https://jsonplaceholder.typicode.com),
 * API pública de prueba, sin autenticación, usada como alternativa estable
 * a la Countries API (cuya versión v3.1 sugerida está deprecada).
 */

const BASE_URL = 'https://jsonplaceholder.typicode.com';

test.describe('GET /posts/:id', () => {
  test('responde 200 y devuelve un post en formato JSON con los campos esperados', async ({ request }) => {
    const respuesta = await request.get(`${BASE_URL}/posts/1`);

    expect(respuesta.status()).toBe(200);
    expect(respuesta.headers()['content-type']).toContain('application/json');

    const post = await respuesta.json();
    expect(post).toMatchObject({
      id: 1,
      userId: expect.any(Number),
      title: expect.any(String),
      body: expect.any(String),
    });
    expect(post.title.length).toBeGreaterThan(0);
  });

  test('responde 404 al solicitar un recurso inexistente', async ({ request }) => {
    const respuesta = await request.get(`${BASE_URL}/posts/999999`);

    expect(respuesta.status()).toBe(404);
    const cuerpo = await respuesta.json();
    expect(cuerpo).toEqual({});
  });
});

test.describe('GET /posts?userId=', () => {
  test('responde 200 y devuelve solo los posts del usuario solicitado', async ({ request }) => {
    const respuesta = await request.get(`${BASE_URL}/posts`, { params: { userId: 1 } });

    expect(respuesta.status()).toBe(200);
    const posts = await respuesta.json();

    expect(Array.isArray(posts)).toBe(true);
    expect(posts.length).toBeGreaterThan(0);
    for (const post of posts) {
      expect(post.userId).toBe(1);
    }
  });
});

test.describe('POST /posts', () => {
  test('crea un recurso y responde 201 devolviendo los datos enviados', async ({ request }) => {
    const nuevoPost = {
      title: 'Práctica 5.1 - Pruebas automatizadas',
      body: 'Caso de prueba de creación vía API',
      userId: 7,
    };

    const respuesta = await request.post(`${BASE_URL}/posts`, { data: nuevoPost });

    expect(respuesta.status()).toBe(201);
    const creado = await respuesta.json();
    expect(creado).toMatchObject(nuevoPost);
    expect(creado.id).toBeDefined();
  });
});

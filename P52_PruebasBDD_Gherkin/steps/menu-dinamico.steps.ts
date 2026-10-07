import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';

const { Given, When, Then } = createBdd();

const URL_APP = 'https://ecompute30.github.io/Lab_programacion3_INF5170/P4_MenuDinamico_Vue/dist/';

Given('que el usuario está en la página principal del Menú Dinámico Uastiano', async ({ page }) => {
  await page.goto('');
});

When('completa el formulario de alta con el nombre {string} y el enlace {string}', async ({ page }, nombre: string, enlace: string) => {
  await page.getByLabel('Nombre').fill(nombre);
  await page.getByLabel('Enlace').fill(enlace);
});

When('pulsa el botón {string}', async ({ page }, textoBoton: string) => {
  await page.getByRole('button', { name: textoBoton }).click();
});

When('elimina la opción {string} del menú', async ({ page }, nombre: string) => {
  const fila = page.locator('li.nodo-menu', { has: page.getByRole('link', { name: nombre, exact: true }) }).first();
  await fila.hover();
  // Se restringe al <div class="fila-opcion"> hijo directo: si el ítem tiene
  // submenú, al pasar el mouse también se revelan los botones de sus hijos.
  await fila.locator('> .fila-opcion').getByTitle('Eliminar').click();
});

When('selecciona la opción {string} del menú', async ({ page }, nombre: string) => {
  await page.getByRole('navigation').getByRole('link', { name: nombre, exact: true }).click();
});

When('pega en el panel de importación un JSON válido con una única opción llamada {string}', async ({ page }, nombre: string) => {
  const json = JSON.stringify({ menu: [{ id: 1, nombre, enlace: `/${nombre.toLowerCase()}` }] });
  await page.getByLabel('O pega el JSON aquí').fill(json);
});

When('pega en el panel de importación un JSON con dos opciones que comparten el mismo id', async ({ page }) => {
  const json = JSON.stringify({
    menu: [
      { id: 1, nombre: 'Uno', enlace: '/uno' },
      { id: 1, nombre: 'Dos', enlace: '/dos' },
    ],
  });
  await page.getByLabel('O pega el JSON aquí').fill(json);
});

When('pega en el panel de importación el texto {string}', async ({ page }, texto: string) => {
  await page.getByLabel('O pega el JSON aquí').fill(texto);
});

Then('la opción {string} aparece visible en el menú principal', async ({ page }, nombre: string) => {
  await expect(page.getByRole('navigation').getByRole('link', { name: nombre })).toBeVisible();
});

Then('la opción {string} ya no aparece en el menú principal', async ({ page }, nombre: string) => {
  await expect(page.getByRole('navigation').getByRole('link', { name: nombre, exact: true })).toHaveCount(0);
});

Then('la opción {string} no aparece en el menú', async ({ page }, nombre: string) => {
  await expect(page.getByRole('navigation').getByRole('link', { name: nombre })).toHaveCount(0);
});

Then('la opción {string} sigue apareciendo en el menú', async ({ page }, nombre: string) => {
  await expect(page.getByRole('navigation').getByRole('link', { name: nombre, exact: true })).toBeVisible();
});

Then('el panel de contenido muestra el título {string} y la ruta {string}', async ({ page }, titulo: string, ruta: string) => {
  await expect(page.getByRole('heading', { name: new RegExp(titulo) })).toBeVisible();
  await expect(page.locator('code', { hasText: ruta })).toBeVisible();
});

Then('la dirección del navegador no cambia', async ({ page }) => {
  expect(page.url()).toBe(URL_APP);
});

Then('el menú se reemplaza y muestra únicamente la opción {string}', async ({ page }, nombre: string) => {
  const nav = page.getByRole('navigation');
  await expect(nav.getByRole('link', { name: nombre })).toBeVisible();
  await expect(nav.getByRole('link')).toHaveCount(1);
});

Then('se muestra en el formulario un mensaje de error que contiene {string}', async ({ page }, mensaje: string) => {
  await expect(page.locator('form').getByRole('alert')).toContainText(mensaje);
});

Then('se muestra en el panel de importación un mensaje de error que contiene {string}', async ({ page }, mensaje: string) => {
  await expect(page.locator('.importador-json').getByRole('alert')).toContainText(mensaje);
});

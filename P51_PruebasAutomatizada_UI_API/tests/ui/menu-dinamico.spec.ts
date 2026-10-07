import { test, expect } from '@playwright/test';

/**
 * Suite de UI para "Menú Dinámico Uastiano" (Práctica 4 — Vue 3 + TypeScript).
 * Aplicación bajo prueba: https://ecompute30.github.io/Lab_programacion3_INF5170/P4_MenuDinamico_Vue/dist/
 */

test.describe('Carga inicial y estructura del menú', () => {
  test('la página carga con el encabezado, el logo de la UASD y las opciones principales del menú', async ({ page }) => {
    await page.goto('');

    await expect(page).toHaveTitle(/Menú Dinámico Uastiano/);
    await expect(page.getByRole('img', { name: 'Universidad Autónoma de Santo Domingo' })).toBeVisible();

    const nav = page.getByRole('navigation');
    for (const opcion of ['Inicio', 'Cuentas', 'Tarjetas', 'Sobre Nosotros', 'Contacto']) {
      await expect(nav.getByRole('link', { name: opcion, exact: true })).toBeVisible();
    }

    await expect(page.getByRole('heading', { name: 'Bienvenido al Menú Dinámico Uastiano' })).toBeVisible();
  });
});

test.describe('Navegación entre opciones del menú', () => {
  test('seleccionar una opción de nivel principal actualiza el panel de contenido sin recargar la página', async ({ page }) => {
    await page.goto('');
    const urlInicial = page.url();

    await page.getByRole('navigation').getByRole('link', { name: 'Inicio', exact: true }).click();

    await expect(page.getByRole('heading', { name: /Inicio/ })).toBeVisible();
    await expect(page.getByText('Ruta:')).toBeVisible();
    await expect(page.locator('code', { hasText: '/inicio' })).toBeVisible();
    // La navegación es del lado del cliente: la URL del documento no cambia.
    expect(page.url()).toBe(urlInicial);
  });

  test('un submenú se despliega al pasar el mouse y navega a la opción anidada', async ({ page }) => {
    await page.goto('');

    const opcionCuentas = page.getByRole('navigation').getByRole('link', { name: 'Cuentas', exact: true });
    await opcionCuentas.hover();

    const opcionSubmenu = page.getByRole('link', { name: 'Cuenta de Ahorro Estudiantil' });
    await expect(opcionSubmenu).toBeVisible();
    await opcionSubmenu.click();

    await expect(page.getByRole('heading', { name: /Cuenta de Ahorro Estudiantil/ })).toBeVisible();
    await expect(page.locator('code', { hasText: '/cuentas/ahorro-estudiantil' })).toBeVisible();
  });
});

test.describe('Formulario para agregar opciones de menú', () => {
  test('agregar una opción válida la refleja de inmediato en el menú', async ({ page }) => {
    await page.goto('');

    await page.getByLabel('Nombre').fill('Preguntas Frecuentes');
    await page.getByLabel('Enlace').fill('/faq');
    await page.getByRole('button', { name: 'Agregar opción' }).click();

    await expect(page.getByRole('navigation').getByRole('link', { name: 'Preguntas Frecuentes' })).toBeVisible();
  });

  test('rechaza un enlace no válido (esquema javascript:) y no agrega la opción', async ({ page }) => {
    await page.goto('');

    await page.getByLabel('Nombre').fill('Enlace malicioso');
    await page.getByLabel('Enlace').fill('javascript:alert(1)');
    await page.getByRole('button', { name: 'Agregar opción' }).click();

    // El mensaje de error es un estado compartido y se refleja tanto en el formulario
    // de alta como en el panel de importación JSON; validamos el del formulario.
    await expect(page.locator('form').getByRole('alert')).toContainText('El enlace debe ser una ruta interna');
    await expect(page.getByRole('navigation').getByRole('link', { name: 'Enlace malicioso' })).toHaveCount(0);
  });
});

test.describe('Comportamiento responsivo', () => {
  test('en viewport móvil el menú se oculta tras un botón de hamburguesa y se puede desplegar', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('');

    const botonMenu = page.getByRole('button', { name: 'Abrir o cerrar el menú' });
    await expect(botonMenu).toBeVisible();
    await expect(page.getByRole('navigation').getByRole('link', { name: 'Inicio', exact: true })).not.toBeVisible();

    await botonMenu.click();
    await expect(page.getByRole('navigation').getByRole('link', { name: 'Inicio', exact: true })).toBeVisible();
  });
});

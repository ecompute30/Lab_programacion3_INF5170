# language: es
Característica: Gestión de opciones del Menú Dinámico Uastiano
  Como administrador del sitio
  Quiero agregar, eliminar e importar opciones del menú de navegación
  Para mantener actualizada la estructura del sitio sin modificar el código fuente

  Antecedentes:
    Dado que el usuario está en la página principal del Menú Dinámico Uastiano

  Escenario: Agregar una nueva opción de menú válida
    Cuando completa el formulario de alta con el nombre "Preguntas Frecuentes" y el enlace "/faq"
    Y pulsa el botón "Agregar opción"
    Entonces la opción "Preguntas Frecuentes" aparece visible en el menú principal

  Escenario: Eliminar una opción existente del menú
    Cuando elimina la opción "Tarjetas" del menú
    Entonces la opción "Tarjetas" ya no aparece en el menú principal

  Escenario: Seleccionar una opción actualiza el panel de contenido sin recargar la página
    Cuando selecciona la opción "Inicio" del menú
    Entonces el panel de contenido muestra el título "Inicio" y la ruta "/inicio"
    Y la dirección del navegador no cambia

  Escenario: Importar una estructura de menú válida en formato JSON
    Cuando pega en el panel de importación un JSON válido con una única opción llamada "Noticias"
    Y pulsa el botón "Importar texto"
    Entonces el menú se reemplaza y muestra únicamente la opción "Noticias"

  Esquema del escenario: Rechazar un enlace no válido al agregar una opción
    Cuando completa el formulario de alta con el nombre "<nombre>" y el enlace "<enlace>"
    Y pulsa el botón "Agregar opción"
    Entonces se muestra en el formulario un mensaje de error que contiene "El enlace debe ser una ruta interna"
    Y la opción "<nombre>" no aparece en el menú

    Ejemplos:
      | nombre               | enlace                        |
      | Enlace malicioso     | javascript:alert(1)           |
      | Enlace con otro esquema | data:text/html,hola         |
      | Enlace sin barra inicial | sin-barra-inicial          |

  Escenario: Rechazar la importación de un texto que no es JSON válido
    Cuando pega en el panel de importación el texto "esto no es json {{{"
    Y pulsa el botón "Importar texto"
    Entonces se muestra en el panel de importación un mensaje de error que contiene "no contiene un JSON válido"
    Y la opción "Inicio" sigue apareciendo en el menú

  Escenario: Rechazar la importación de un JSON con identificadores duplicados
    Cuando pega en el panel de importación un JSON con dos opciones que comparten el mismo id
    Y pulsa el botón "Importar texto"
    Entonces se muestra en el panel de importación un mensaje de error que contiene "identificadores"
    Y la opción "Inicio" sigue apareciendo en el menú

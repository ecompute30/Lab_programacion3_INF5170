const URL_API_OFICIAL = 'https://api.digital.gob.do/v3/cedulas';

const formulario = document.getElementById('formulario-cedula');
const campoCedula = document.getElementById('campo-cedula');
const botonValidar = document.getElementById('boton-validar');
const divResultado = document.getElementById('resultado');
const iconoResultado = document.getElementById('icono-resultado');
const textoResultado = document.getElementById('texto-resultado');
const detalleResultado = document.getElementById('detalle-resultado');

/** Máscara de cédula dominicana: NNN-NNNNNNN-N (11 dígitos). */
function aplicarMascara(valor) {
  const digitos = valor.replace(/\D/g, '').slice(0, 11);
  const parte1 = digitos.slice(0, 3);
  const parte2 = digitos.slice(3, 10);
  const parte3 = digitos.slice(10, 11);

  let resultado = parte1;
  if (parte2) resultado += '-' + parte2;
  if (parte3) resultado += '-' + parte3;
  return resultado;
}

campoCedula.addEventListener('input', () => {
  const posicionCursorAlFinal = campoCedula.selectionEnd === campoCedula.value.length;
  campoCedula.value = aplicarMascara(campoCedula.value);
  if (posicionCursorAlFinal) {
    campoCedula.setSelectionRange(campoCedula.value.length, campoCedula.value.length);
  }
});

/**
 * Intenta consultar la API oficial directamente desde el navegador. Esa API
 * no envía cabeceras CORS, así que el navegador bloqueará esta llamada
 * cuando la página se sirva desde un origen distinto (como GitHub Pages).
 * Por eso se captura el error y se trata como "no disponible" en vez de
 * fallar: el resultado del algoritmo módulo 10 (local, siempre disponible)
 * sigue siendo la fuente de verdad para decidir si la cédula es válida.
 */
async function consultarApiOficial(cedula) {
  try {
    const respuesta = await fetch(`${URL_API_OFICIAL}/${cedula}/validate`);
    if (!respuesta.ok) return { disponible: false };
    const datos = await respuesta.json();
    return { disponible: true, valida: Boolean(datos.valid) };
  } catch (error) {
    // Típicamente un bloqueo de CORS (TypeError: Failed to fetch) o falta de
    // conexión; ambos se muestran igual: "API oficial no disponible".
    console.warn('No se pudo consultar la API oficial (posible bloqueo CORS):', error.message);
    return { disponible: false };
  }
}

function mostrarResultado({ formatoValido, modulo10Valida, mensaje, cedula }, resultadoApi) {
  divResultado.hidden = false;
  divResultado.classList.remove('valido', 'invalido');

  const esValida = formatoValido && modulo10Valida;
  divResultado.classList.add(esValida ? 'valido' : 'invalido');

  iconoResultado.textContent = esValida ? '✅' : '❌';
  textoResultado.textContent = esValida ? 'Cédula válida' : 'Cédula inválida';

  detalleResultado.innerHTML = '';
  const agregarDetalle = (texto) => {
    const li = document.createElement('li');
    li.textContent = texto;
    detalleResultado.appendChild(li);
  };

  if (!formatoValido) {
    agregarDetalle(mensaje);
    return;
  }

  agregarDetalle(`Algoritmo módulo 10: ${modulo10Valida ? 'cumple ✓' : 'no cumple ✗'}`);

  if (!resultadoApi || !resultadoApi.disponible) {
    agregarDetalle('⚠️ API oficial: no disponible desde este navegador (bloqueada por CORS o sin conexión).');
  } else {
    agregarDetalle(`API oficial del gobierno: ${resultadoApi.valida ? 'válida ✓' : 'inválida ✗'}`);
  }

  agregarDetalle(`Cédula consultada: ${cedula}`);
}

formulario.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const resultadoLocal = validarModulo10(campoCedula.value);

  if (!resultadoLocal.formatoValido) {
    mostrarResultado(resultadoLocal, null);
    return;
  }

  botonValidar.disabled = true;
  botonValidar.textContent = 'Validando...';

  const resultadoApi = await consultarApiOficial(resultadoLocal.cedula);
  mostrarResultado(resultadoLocal, resultadoApi);

  botonValidar.disabled = false;
  botonValidar.textContent = 'Validar';
});

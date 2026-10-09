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

function mostrarResultado({ formatoValido, modulo10Valida, apiOficialValida, mensaje, cedula }) {
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

  if (apiOficialValida === null) {
    agregarDetalle('API oficial del gobierno: no disponible en este momento.');
  } else {
    agregarDetalle(`API oficial del gobierno: ${apiOficialValida ? 'válida ✓' : 'inválida ✗'}`);
  }

  agregarDetalle(`Cédula consultada: ${cedula}`);
}

formulario.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const digitos = campoCedula.value.replace(/\D/g, '');
  if (digitos.length !== 11) {
    mostrarResultado({
      formatoValido: false,
      modulo10Valida: false,
      apiOficialValida: null,
      mensaje: 'La cédula debe tener exactamente 11 dígitos (formato 000-0000000-0).',
      cedula: digitos,
    });
    return;
  }

  botonValidar.disabled = true;
  botonValidar.textContent = 'Validando...';

  try {
    const respuesta = await fetch(`/api/validar/${digitos}`);
    const datos = await respuesta.json();
    mostrarResultado(datos);
  } catch (error) {
    mostrarResultado({
      formatoValido: false,
      modulo10Valida: false,
      apiOficialValida: null,
      mensaje: 'No se pudo contactar al servidor de validación.',
      cedula: digitos,
    });
  } finally {
    botonValidar.disabled = false;
    botonValidar.textContent = 'Validar';
  }
});

/**
 * Práctica 9 — Validación de cédula dominicana mediante el algoritmo del
 * módulo 10 (la misma variante del checksum de Luhn que usa la Junta
 * Central Electoral).
 *
 * El dígito verificador (posición 11) se calcula a partir de los primeros
 * 10 dígitos: cada dígito se multiplica alternadamente por 1 y 2; si el
 * producto es de dos cifras, se suman sus dígitos (equivalente a restarle
 * 9). La suma total, llevada al múltiplo de 10 más cercano por encima,
 * determina el dígito verificador esperado.
 */

const PATRON_MULTIPLICADORES = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2];

export function soloDigitos(cedula: string): string {
  return cedula.replace(/\D/g, '');
}

export function calcularDigitoVerificador(primerosDiezDigitos: string): number {
  let total = 0;
  for (let i = 0; i < 10; i++) {
    let producto = Number(primerosDiezDigitos[i]) * PATRON_MULTIPLICADORES[i];
    if (producto >= 10) producto -= 9;
    total += producto;
  }
  return (10 - (total % 10)) % 10;
}

export interface ResultadoValidacion {
  cedula: string;
  formatoValido: boolean;
  modulo10Valida: boolean;
  mensaje: string;
}

export function validarModulo10(cedulaEntrada: string): ResultadoValidacion {
  const digitos = soloDigitos(cedulaEntrada);

  if (digitos.length !== 11) {
    return {
      cedula: digitos,
      formatoValido: false,
      modulo10Valida: false,
      mensaje: 'La cédula debe tener exactamente 11 dígitos (formato 000-0000000-0).',
    };
  }

  const primerosDiez = digitos.slice(0, 10);
  const verificadorIngresado = Number(digitos[10]);
  const verificadorEsperado = calcularDigitoVerificador(primerosDiez);
  const modulo10Valida = verificadorIngresado === verificadorEsperado;

  return {
    cedula: digitos,
    formatoValido: true,
    modulo10Valida,
    mensaje: modulo10Valida
      ? 'La cédula cumple con el algoritmo del módulo 10.'
      : 'El dígito verificador no corresponde a los primeros 10 dígitos (algoritmo módulo 10).',
  };
}

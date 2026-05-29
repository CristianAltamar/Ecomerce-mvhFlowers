import { describe, it, expect } from 'vitest';
import { formatCOP, slugify, truncate, errorMessage } from '@mvh/utils';

describe('formatCOP', () => {
  it('formatea pesos colombianos', () => {
    expect(formatCOP(150_000)).toMatch(/150\.000/);
    expect(formatCOP(90_000)).toMatch(/90\.000/);
  });

  it('maneja el cero', () => {
    expect(formatCOP(0)).toMatch(/0/);
  });
});

describe('slugify', () => {
  it('convierte texto con acentos y espacios', () => {
    expect(slugify('Sembrado Floral Primavera Radiante')).toBe(
      'sembrado-floral-primavera-radiante',
    );
    expect(slugify('Arcoíris de Rosas')).toBe('arcoiris-de-rosas');
    expect(slugify('Día de las Madres')).toBe('dia-de-las-madres');
  });

  it('colapsa guiones múltiples', () => {
    expect(slugify('Hola    mundo')).toBe('hola-mundo');
    expect(slugify('  Hola ---  mundo  ')).toBe('hola-mundo');
  });

  it('elimina caracteres especiales', () => {
    expect(slugify('¡Hola! ¿Qué tal?')).toBe('hola-que-tal');
  });
});

describe('truncate', () => {
  it('no modifica textos cortos', () => {
    expect(truncate('Hola', 10)).toBe('Hola');
  });

  it('trunca y añade elipsis', () => {
    expect(truncate('Hola mundo cruel', 8)).toBe('Hola mu…');
  });
});

describe('errorMessage', () => {
  it('extrae mensaje de Error', () => {
    expect(errorMessage(new Error('falló'))).toBe('falló');
  });

  it('devuelve string si recibe string', () => {
    expect(errorMessage('boom')).toBe('boom');
  });

  it('devuelve genérico para tipos extraños', () => {
    expect(errorMessage({ x: 1 })).toBe('Error desconocido');
    expect(errorMessage(null)).toBe('Error desconocido');
  });
});

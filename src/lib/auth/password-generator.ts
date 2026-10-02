import { randomInt } from "node:crypto";

const GRUPOS = [
  "ABCDEFGHJKLMNPQRSTUVWXYZ",
  "abcdefghijkmnopqrstuvwxyz",
  "23456789",
  "!#%+-=?@_",
];

/**
 * Contraseña aleatoria (CSPRNG) con al menos una mayúscula, una minúscula,
 * un número y un símbolo. Se omiten caracteres ambiguos (0/O, 1/l/I) porque
 * la contraseña se entrega a una persona.
 */
export function generarContrasena(longitud = 20): string {
  const todos = GRUPOS.join("");
  const caracteres = GRUPOS.map((g) => g[randomInt(g.length)]);
  while (caracteres.length < longitud) caracteres.push(todos[randomInt(todos.length)]);
  // Mezcla Fisher-Yates para que los obligatorios no queden siempre al inicio.
  for (let i = caracteres.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [caracteres[i], caracteres[j]] = [caracteres[j], caracteres[i]];
  }
  return caracteres.join("");
}

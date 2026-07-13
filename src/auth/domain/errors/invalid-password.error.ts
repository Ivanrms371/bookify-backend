export class InvalidPasswordError extends Error {
  constructor() {
    super('La contraseña es incorrecta');
    this.name = 'InvalidPasswordError';
  }
}

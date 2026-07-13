export class UserAlreadyExistsError extends Error {
  constructor() {
    super('El usuario ya existe');
    this.name = 'UserAlreadyExistsError';
  }
}

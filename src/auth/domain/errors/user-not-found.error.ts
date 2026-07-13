export class UserNotFoundError extends Error {
  constructor() {
    super('El usuario no existe');
    this.name = 'UserNotFoundError';
  }
}

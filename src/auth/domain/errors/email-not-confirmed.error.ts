export class EmailNotConfirmedError extends Error {
  constructor() {
    super('El correo electrónico no ha sido confirmado');
    this.name = 'EmailNotConfirmedError';
  }
}

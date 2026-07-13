export class SocialLoginRequiredError extends Error {
  constructor() {
    super(`Porfavor prueba otra forma de iniciar sesión.`);
    this.name = 'SocialLoginRequiredError';
  }
}

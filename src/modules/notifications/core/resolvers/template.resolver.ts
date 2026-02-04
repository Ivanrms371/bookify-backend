import { Injectable } from '@nestjs/common';
import { render } from '@react-email/render';
import { NotificationType } from 'src/generated/prisma/enums';
import { WelcomeTemplate } from '../emails/templates/welcome.template';
import { AccountConfirmationTemplate } from '../emails/templates/account-confirmation.template';
import { PasswordResetTemplate } from '../emails/templates/password-reset.template';
import { PlanExpires7dTemplate } from '../emails/templates/plan-expires-7d.template';
import { PlanExpires3dTemplate } from '../emails/templates/plan-expires-3d.template';
import { PlanExpiredTemplate } from '../emails/templates/plan-expired.template';

@Injectable()
export class TemplateResolver {
  constructor() {}

  async resolve(type: NotificationType, variables: any) {
    switch (type) {
      // welcome
      case NotificationType.WELCOME:
        return {
          component: await render(
            WelcomeTemplate({ name: variables.name, confirmLink: variables.confirmLink }),
          ),
          subject: 'Bienvenido a Turnify',
        };

      // account confirmation
      case NotificationType.ACCOUNT_CONFIRMATION:
        return {
          component: AccountConfirmationTemplate({
            name: variables.name,
            confirmLink: variables.confirmLink,
          }),
          subject: 'Confirma tu cuenta',
        };

      // password reset
      case NotificationType.PASSWORD_RESET:
        return {
          component: PasswordResetTemplate({
            name: variables.name,
            resetLink: variables.resetLink,
          }),
          subject: 'Restablece tu contraseña',
        };

      // Plan expires templates
      case NotificationType.PLAN_EXPIRES_7D:
        return {
          component: PlanExpires7dTemplate(),
          subject: 'Tu plan expira en 7 días',
        };
      case NotificationType.PLAN_EXPIRES_3D:
        return {
          component: PlanExpires3dTemplate(),
          subject: 'Tu plan expira en 3 días',
        };
      case NotificationType.PLAN_EXPIRED:
        return {
          component: PlanExpiredTemplate(),
          subject: 'Tu plan ha expirado',
        };

      default:
        throw new Error(`Template not found for type: ${type}`);
    }
  }
}

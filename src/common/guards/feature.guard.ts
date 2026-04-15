import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/tenant-roles.decorator';
import { MembershipRole, SubscriptionStatus } from 'src/generated/prisma/enums';
import { AuthenticatedRequest } from 'src/auth/types/express-request.type';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { Subscription } from 'src/generated/prisma/client';
import { FEATURE_KEY } from '../decorators/requires-feature.decorator';

@Injectable()
export class Featureguard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    
    const feature = this.reflector.getAllAndOverride<string>(
        FEATURE_KEY,
        [context.getHandler(), context.getClass()],
    );

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const tenantId = request.params.tenantId || (request.body.tenantId as string);

    if (!tenantId) {
        throw new BadRequestException('No hemos encontrado el negocio.');
    }

    const sub = await this.prisma.subscription.findUnique({
        where: {
            tenantId,
            deletedAt: null,
        },
        select: {
            id: true,
            status: true,
            currentPeriodEnd: true,
            trialEndsAt: true,
            plan: {
                select: {
                    id: true,
                    planType: true,
                    isActive: true,
                    limits: {
                        select: {
                            professionalLimit: true,
                            appointmentLimit: true,
                            emailLimit: true,
                            whatsappLimit: true,
                        }
                    }
                }
            }
        }
    })

    if(!sub) {
        throw new BadRequestException('No hemos encontrado la suscripción.');
    }

    if(!sub.plan.isActive) {
        throw new ForbiddenException('Tu plan no está activo');
    }

    if(!sub.plan.limits) {
        throw new BadRequestException('Plan mal configurado.');
    }

    this.assertSubValid(sub.status, sub.currentPeriodEnd, sub.trialEndsAt);

    request.tenant.subscription = {
        id: sub.id,
        plan: {
            id: sub.plan.id,
            planType: sub.plan.planType,
            isActive: sub.plan.isActive,
            limits: {
                professionalLimit: sub.plan.limits.professionalLimit,
                appointmentLimit: sub.plan.limits.appointmentLimit,
                emailLimit: sub.plan.limits.emailLimit,
                whatsappLimit: sub.plan.limits.whatsappLimit,
            }
        }
    }

    return true;
  }

  private assertSubValid(status: SubscriptionStatus, currentPeriodEnd: Date | null, trialEndsAt: Date | null) {
    const now = new Date();

    if(status === SubscriptionStatus.ACTIVE) {
        if(!currentPeriodEnd || currentPeriodEnd <= now) {
            throw new BadRequestException('Tu suscripción ha finalizado.');
        }
        return;
    }

    if(status === SubscriptionStatus.TRIAL) {
        if(!trialEndsAt || trialEndsAt <= now) {
            throw new BadRequestException('Tu prueba ha finalizado.');
        }
        return;
    }

    throw new ForbiddenException('Tu suscripción no está activa');
  }
}

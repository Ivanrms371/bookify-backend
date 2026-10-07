import { randomBytes } from 'crypto';
import { addDays, addMonths, differenceInCalendarDays, endOfDay, getDay, startOfMonth } from 'date-fns';
import { PrismaClient } from '../../src/generated/prisma/client';
import {
  AppointmentStatus,
  CreatedByType,
  MembershipRole,
  OnboardingStatus,
  TenantType,
  WorkspaceType,
} from '../../src/generated/prisma/enums';
import { PasswordService } from '../../src/auth/services/password.service';
import { PLANS } from '../../src/modules/subscriptions/plans.config';
import {
  CUSTOMERS,
  DEVELOPMENT_PASSWORD,
  fixtureId,
  PROFESSIONALS,
  SEED_MARKER,
  SERVICES,
  SLUG,
  TENANT_HOURS,
  TENANT_ID,
} from './fixtures';
import { TZDate } from '@date-fns/tz';
import { TIME_ZONE } from './fixtures';
import { localDay, planAppointments, PlannerInput, validateBookings } from './planner';
import { reconcileStatistics } from './statistics';
import { removeDevelopmentDemo } from './cleanup';

export function assertDevelopmentEnvironment(environment: NodeJS.ProcessEnv) {
  if (environment.NODE_ENV !== 'development') throw new Error('The development seed requires NODE_ENV=development.');
  if (!environment.DATABASE_URL) throw new Error('DATABASE_URL is required for the development seed.');
}
export async function seedDevelopment(prisma: PrismaClient, now = new Date()) {
  const historyStart = startOfMonth(addMonths(new TZDate(now, TIME_ZONE), -2));
  const customerCreationDays = differenceInCalendarDays(localDay(now, 0, TIME_ZONE), historyStart) + 1;
  const password = await new PasswordService().hash(DEVELOPMENT_PASSWORD);
  return prisma.$transaction(
    async (tx) => {
      await removeDevelopmentDemo(tx);
      const tenants = await tx.tenant.findMany({ where: { OR: [{ id: TENANT_ID }, { slug: SLUG }] } });
      if (tenants.some((t) => t.id !== TENANT_ID || t.slug !== SLUG))
        throw new Error('Demo tenant identity collides with an existing tenant.');
      const business = {
        slug: SLUG,
        name: 'Brisa Estudio — Demo',
        type: TenantType.HAIRDRESSING_SALON,
        workspaceType: WorkspaceType.TEAM,
        description: 'Estudio de peluquería ficticio para desarrollo. Todos los datos de contacto son de demostración.',
        isActive: true,
        isPublic: true,
        onboardingStatus: OnboardingStatus.COMPLETED,
        addressLine1: 'Pasaje Brisa 123 (dirección ficticia)',
        city: 'Montevideo',
        province: 'Montevideo',
        colorTheme: '#9333ea',
      };
      await tx.tenant.upsert({
        where: { id: TENANT_ID },
        create: { id: TENANT_ID, ...business, createdAt: historyStart },
        update: business,
      });
      const settings = await tx.tenantSettings.upsert({
        where: { tenantId: TENANT_ID },
        create: { tenantId: TENANT_ID, slotIntervalMinutes: 15 },
        update: {
          slotIntervalMinutes: 15,
          timeZone: 'America/Montevideo',
          bufferTimeMinutes: 0,
          minAdvancedMinutes: 30,
          maxAdvancedDays: 30,
        },
      });
      const trial = { planId: PLANS.pro_plus.id, trialStartedAt: now, trialEndsAt: addDays(now, 14), amount: null, billingCycle: null };
      await tx.subscription.upsert({
        where: { tenantId: TENANT_ID },
        create: { tenantId: TENANT_ID, ...trial },
        update: { ...trial, status: 'TRIAL', cancelledAt: null, endsAt: null, deletedAt: null },
      });
      for (const hour of TENANT_HOURS) {
        const id = fixtureId(`tenant-hour:${hour.dayOfWeek}:${hour.opensAt}`);
        const existing = await tx.tenantWorkingHours.findUnique({ where: { id } });
        if (existing && existing.tenantId !== TENANT_ID) throw new Error('Tenant hours fixture collision.');
        await tx.tenantWorkingHours.upsert({ where: { id }, create: { id, tenantId: TENANT_ID, ...hour }, update: hour });
      }
      for (const service of SERVICES) {
        const data = {
          id: service.id,
          name: service.name,
          description: service.description,
          price: service.price,
          durationMinutes: service.durationMinutes,
          displayOrder: service.displayOrder,
        };
        const existing = await tx.service.findUnique({ where: { id: service.id } });
        if (existing && existing.tenantId !== TENANT_ID) throw new Error('Service fixture collision.');
        await tx.service.upsert({
          where: { id: service.id },
          create: { tenantId: TENANT_ID, ...data, createdAt: historyStart },
          update: { ...data, isActive: true, deletedAt: null, discountFixed: 0, discountPercentage: 0 },
        });
      }
      for (const [index, professional] of PROFESSIONALS.entries()) {
        const users = await tx.user.findMany({ where: { OR: [{ id: professional.userId }, { email: professional.email }] } });
        if (users.some((user) => user.id !== professional.userId || user.email !== professional.email))
          throw new Error('User fixture identity collision.');
        await tx.user.upsert({
          where: { id: professional.userId },
          create: {
            id: professional.userId,
            name: professional.name,
            email: professional.email,
            password,
            emailVerifiedAt: now,
            createdAt: historyStart,
          },
          update: { name: professional.name, emailVerifiedAt: now },
        });
        await tx.membership.upsert({
          where: { userId_tenantId: { userId: professional.userId, tenantId: TENANT_ID } },
          create: { userId: professional.userId, tenantId: TENANT_ID, role: index === 0 ? MembershipRole.OWNER : MembershipRole.STAFF },
          update: { role: index === 0 ? MembershipRole.OWNER : MembershipRole.STAFF, isActive: true },
        });
        const profile = {
          id: professional.id,
          userId: professional.userId,
          name: professional.name,
          email: professional.email,
          phoneNumber: professional.phoneNumber,
          profession: professional.profession,
          bio: professional.bio,
          colorTheme: professional.colorTheme,
        };
        const existing = await tx.professional.findFirst({ where: { OR: [{ id: professional.id }, { userId: professional.userId }] } });
        if (existing && (existing.id !== professional.id || existing.tenantId !== TENANT_ID || existing.userId !== professional.userId))
          throw new Error('Professional fixture identity collision.');
        await tx.professional.upsert({
          where: { id: professional.id },
          create: { tenantId: TENANT_ID, ...profile, phoneCountryCode: '598', slotIntervalMinutes: 15, createdAt: historyStart },
          update: {
            ...profile,
            phoneCountryCode: '598',
            slotIntervalMinutes: 15,
            minAdvancedMinutes: 30,
            maxAdvancedDays: 30,
            isActive: true,
            deletedAt: null,
          },
        });
        for (const hour of professional.hours) {
          const id = fixtureId(`professional-hour:${professional.key}:${hour.dayOfWeek}:${hour.opensAt}`);
          const existingHour = await tx.professionalWorkingHours.findUnique({ where: { id } });
          if (existingHour && (existingHour.tenantId !== TENANT_ID || existingHour.professionalId !== professional.id))
            throw new Error('Professional hours fixture collision.');
          await tx.professionalWorkingHours.upsert({
            where: { id },
            create: { id, tenantId: TENANT_ID, professionalId: professional.id, ...hour },
            update: hour,
          });
        }
        for (const serviceKey of professional.services) {
          const serviceId = SERVICES.find((s) => s.key === serviceKey)!.id;
          await tx.serviceAssignment.upsert({
            where: { professionalId_serviceId: { professionalId: professional.id, serviceId } },
            create: { professionalId: professional.id, serviceId },
            update: { isActive: true },
          });
        }
      }
      for (const [customerIndex, customer] of CUSTOMERS.entries()) {
        const existing = await tx.customer.findMany({
          where: { OR: [{ id: customer.id }, { tenantId: TENANT_ID, phoneCountryCode: '598', phoneNumber: customer.phoneNumber }] },
        });
        if (
          existing.some(
            (c) =>
              c.id !== customer.id || c.tenantId !== TENANT_ID || c.phoneCountryCode !== '598' || c.phoneNumber !== customer.phoneNumber,
          )
        )
          throw new Error('Customer fixture identity collision.');
        await tx.customer.upsert({
          where: { id: customer.id },
          create: { tenantId: TENANT_ID, ...customer, createdAt: addDays(historyStart, customerIndex % customerCreationDays) },
          update: { ...customer, deletedAt: null },
        });
      }
      const exceptionId = fixtureId('professional-closure');
      const exceptionDay = localDay(now, 4, settings.timeZone);
      const closedProfessional = PROFESSIONALS.find((p) => p.hours.some((h) => h.dayOfWeek === getDay(exceptionDay)))!;
      const existingException = await tx.scheduleException.findUnique({ where: { id: exceptionId } });
      if (existingException && existingException.tenantId !== TENANT_ID) throw new Error('Exception fixture collision.');
      const exception = {
        startDate: new Date(exceptionDay),
        endDate: new Date(endOfDay(exceptionDay)),
        isClosed: true,
        reason: 'Capacitación del equipo (demo)',
      };
      await tx.scheduleException.upsert({
        where: { id: exceptionId },
        create: {
          id: exceptionId,
          tenantId: TENANT_ID,
          ...exception,
          professionals: { create: { professionalId: closedProfessional.id } },
        },
        update: {
          ...exception,
          blocks: { deleteMany: {} },
          professionals: { deleteMany: {}, create: { professionalId: closedProfessional.id } },
        },
      });

      const owned = { tenantId: TENANT_ID, internalNotes: { startsWith: SEED_MARKER } };
      await tx.appointmentBlock.deleteMany({ where: { appointment: owned } });
      await tx.appointment.deleteMany({ where: owned });
      const [tenantHours, professionals, exceptions, existing] = await Promise.all([
        tx.tenantWorkingHours.findMany({ where: { tenantId: TENANT_ID } }),
        tx.professional.findMany({
          where: { tenantId: TENANT_ID, id: { in: PROFESSIONALS.map((p) => p.id) } },
          include: { workingHours: true, assignments: true },
        }),
        tx.scheduleException.findMany({ where: { tenantId: TENANT_ID }, include: { professionals: true, blocks: true } }),
        tx.appointment.findMany({ where: { tenantId: TENANT_ID }, include: { blocks: true } }),
      ]);
      const input: PlannerInput = {
        now,
        timeZone: settings.timeZone,
        bufferMinutes: settings.bufferTimeMinutes,
        tenantHours,
        services: SERVICES,
        customerIds: CUSTOMERS.map((c) => c.id),
        existing,
        professionals: PROFESSIONALS.map((fixture) => {
          const p = professionals.find((row) => row.id === fixture.id)!;
          return {
            id: p.id,
            hours: p.workingHours,
            serviceIds: p.assignments.filter((a) => a.isActive).map((a) => a.serviceId),
            slotIntervalMinutes: p.slotIntervalMinutes,
            minAdvancedMinutes: p.minAdvancedMinutes,
            maxAdvancedDays: p.maxAdvancedDays,
          };
        }),
        exceptions: exceptions.map((e) => ({
          startsAt: e.startDate,
          endsAt: e.endDate,
          isClosed: e.isClosed,
          blocks: e.blocks,
          professionalIds: e.professionals.map((p) => p.professionalId),
        })),
      };
      const plan = planAppointments(input);
      for (const appointment of plan.appointments) {
        const { dayOffset } = appointment;
        const booking = {
          professionalId: appointment.professionalId,
          serviceId: appointment.serviceId,
          customerId: appointment.customerId,
          startsAt: appointment.startsAt,
          endsAt: appointment.endsAt,
          durationMinutes: appointment.durationMinutes,
          status: appointment.status,
        };
        const customer = CUSTOMERS.find((c) => c.id === booking.customerId)!;
        const service = SERVICES.find((s) => s.id === booking.serviceId)!;
        const historical = dayOffset < 0;
        const staff = historical || booking.status === AppointmentStatus.PENDING;
        await tx.appointment.create({
          data: {
            ...booking,
            tenantId: TENANT_ID,
            customerName: customer.name,
            customerPhone: customer.phoneNumber,
            customerEmail: customer.email,
            price: service.price,
            manageToken: randomBytes(32).toString('hex'),
            createdBy: staff ? CreatedByType.STAFF : CreatedByType.CUSTOMER,
            internalNotes: `${SEED_MARKER} Datos ficticios de desarrollo.`,
            ...(booking.status === AppointmentStatus.CANCELLED
              ? { cancelledAt: new Date(booking.startsAt.getTime() - 60 * 60 * 1000), cancellationReason: 'Cambio de planes (demo)' }
              : {
                  blocks: { create: { startsAt: booking.startsAt, endsAt: booking.endsAt } },
                }),
            ...(historical ? { createdAt: addDays(booking.startsAt, -2) } : {}),
          },
        });
      }
      const persisted = await tx.appointment.findMany({
        where: { tenantId: TENANT_ID },
        include: { blocks: true, service: true, customer: true, professional: true },
      });
      const generated = persisted.filter((a) => a.internalNotes?.startsWith(SEED_MARKER));
      validateBookings(input, persisted, generated);
      for (const appointment of generated) {
        if (
          appointment.service.tenantId !== TENANT_ID ||
          appointment.professional.tenantId !== TENANT_ID ||
          appointment.customer?.tenantId !== TENANT_ID ||
          appointment.customerName !== appointment.customer.name ||
          appointment.customerPhone !== appointment.customer.phoneNumber ||
          appointment.customerEmail !== appointment.customer.email ||
          !appointment.price.equals(appointment.service.price) ||
          (appointment.status !== AppointmentStatus.CANCELLED &&
            (appointment.blocks.length !== 1 ||
              appointment.blocks[0].startsAt.getTime() !== appointment.startsAt.getTime() ||
              appointment.blocks[0].endsAt.getTime() !== appointment.endsAt.getTime()))
        ) {
          throw new Error('Persisted seed relationship, snapshot, or appointment block validation failed.');
        }
      }
      await reconcileStatistics(tx, TENANT_ID, settings.timeZone, now);
      return plan.days;
    },
    { maxWait: 10000, timeout: 120000 },
  );
}

import { Decimal } from '@prisma/client/runtime/client';
import { AppointmentStatus, BillingCycle, BusinessRole, BusinessType, SubscriptionStatus } from 'src/generated/prisma/client';
import { SeedContext } from '../types';
import { tomorrow, daysFromNow, generateConfirmationCode } from '../helpers';

export async function seedSalonBellaVita(ctx: SeedContext) {
  const { prisma, passwordHash, plans } = ctx;
  const now = new Date();

  // ─── Users ─────────────────────────────────────────────────────────────────
  const ownerUser = await prisma.user.create({
    data: {
      name: 'Lucía Fernández',
      email: 'lucia@bellavita.uy',
      emailVerifiedAt: new Date(),
      phone: '+598 92 345 678',
      phoneVerifiedAt: new Date(),
      password: passwordHash,
      lastLoginAt: new Date(),
    },
  });

  const staffUser = await prisma.user.create({
    data: {
      name: 'Camila Suárez',
      email: 'camila@bellavita.uy',
      emailVerifiedAt: new Date(),
      phone: '+598 93 456 789',
      password: passwordHash,
    },
  });

  // ─── Business ──────────────────────────────────────────────────────────────
  const business = await prisma.business.create({
    data: {
      ownerId: ownerUser.id,
      name: 'Salón Bella Vita',
      slug: 'salon-bella-vita',
      type: BusinessType.BEAUTY_SALON,
      description: 'Salón de belleza integral. Peluquería, maquillaje, uñas y tratamientos faciales.',
      addressLine1: 'Bvar. España 2456',
      addressLine2: 'Piso 1, Pocitos',
      phone: '+598 2 712 5678',
      onboardingStep: 5,
      onboardingCompleted: true,
      isActive: true,
    },
  });

  // ─── Business Settings ─────────────────────────────────────────────────────
  await prisma.businessSettings.create({
    data: {
      businessId: business.id,
      slotIntervalMinutes: 15,
      maxAdvancedDays: 60,
      minAdvancedMinutes: 30,
      bufferTimeMinutes: 10,
      cancellationWindowMinutes: 60,
      timezone: 'America/Montevideo',
      currency: 'UYU',
      maxPendingApptsPerClient: 5,
      requireConfirmation: true,
    },
  });

  // ─── Business Limits ───────────────────────────────────────────────────────
  await prisma.businessLimits.create({
    data: {
      businessId: business.id,
      whatsappLimit: 300,
      professionalLimit: 1,
      whatsappCount: 45,
      emailCount: 78,
      whatsappCost: new Decimal(0.035),
      periodMonth: now.getMonth() + 1,
      periodYear: now.getFullYear(),
      lastResetAt: now,
      appointmentCount: 87,
      appointmentLimit: -1,
      emailCost: new Decimal(0.001),
      emailLimit: 500,
      professionalCount: 1,
    },
  });

  // ─── Business Lifetime Stats ───────────────────────────────────────────────
  await prisma.businessLifetimeStats.create({
    data: {
      businessId: business.id,
      totalAppointments: 423,
      totalRevenue: new Decimal(315000),
      totalCustomers: 120,
      cancellationRate: new Decimal(5.8),
      noShowRate: new Decimal(2.1),
    },
  });

  // ─── Business Members ──────────────────────────────────────────────────────
  await prisma.businessMember.create({
    data: {
      businessId: business.id,
      userId: ownerUser.id,
      role: BusinessRole.OWNER,
    },
  });

  await prisma.businessMember.create({
    data: {
      businessId: business.id,
      userId: staffUser.id,
      role: BusinessRole.STAFF,
    },
  });

  // ─── Subscription (Pro Trial) ──────────────────────────────────────────────
  await prisma.subscription.create({
    data: {
      businessId: business.id,
      planId: plans.pro.id,
      status: SubscriptionStatus.TRIAL,
      amount: new Decimal(590),
      currency: 'UYU',
      billingCycle: BillingCycle.MONTHLY,
      currentPeriodStart: daysFromNow(-7),
      currentPeriodEnd: daysFromNow(23),
      trialEndsAt: daysFromNow(7),
      trialUsedAt: daysFromNow(-7),
    },
  });

  // ─── Staff ─────────────────────────────────────────────────────────────────
  const staffLucia = await prisma.staff.create({
    data: {
      userId: ownerUser.id,
      businessId: business.id,
      displayName: 'Lucía',
      title: 'Estilista Senior',
      bio: 'Especialista en colorimetría y cortes de tendencia.',
      slotIntervalMinutes: 15,
      maxAdvancedDays: 60,
      minAdvancedMinutes: 30,
      isActive: true,
      displayOrder: 0,
      colorTheme: '#EC4899',
    },
  });

  const staffCamila = await prisma.staff.create({
    data: {
      userId: staffUser.id,
      businessId: business.id,
      displayName: 'Camila',
      title: 'Manicura & Pedicura',
      bio: 'Experta en nail art y tratamientos de uñas.',
      slotIntervalMinutes: 15,
      maxAdvancedDays: 30,
      minAdvancedMinutes: 30,
      isActive: true,
      displayOrder: 1,
      colorTheme: '#8B5CF6',
    },
  });

  // ─── Staff Lifetime Stats ──────────────────────────────────────────────────
  await prisma.staffLifetimeStats.create({
    data: {
      staffId: staffLucia.id,
      totalRevenue: new Decimal(210000),
      totalAppointments: 280,
      noShowCount: 8,
    },
  });

  await prisma.staffLifetimeStats.create({
    data: {
      staffId: staffCamila.id,
      totalRevenue: new Decimal(105000),
      totalAppointments: 143,
      noShowCount: 3,
    },
  });

  // ─── Services ──────────────────────────────────────────────────────────────
  const serviceCorteFem = await prisma.service.create({
    data: {
      businessId: business.id,
      name: 'Corte femenino',
      description: 'Corte, lavado y secado',
      price: new Decimal(800),
      initialActiveMinutes: 35,
      passiveTimeMinutes: 0,
      finalActiveMinutes: 10,
      durationMinutes: 45,
      isActive: true,
      displayOrder: 0,
    },
  });

  const serviceColoracion = await prisma.service.create({
    data: {
      businessId: business.id,
      name: 'Coloración completa',
      description: 'Tinte completo con productos premium',
      price: new Decimal(1800),
      initialActiveMinutes: 20,
      passiveTimeMinutes: 30,
      finalActiveMinutes: 15,
      durationMinutes: 65,
      isActive: true,
      displayOrder: 1,
    },
  });

  const serviceManicura = await prisma.service.create({
    data: {
      businessId: business.id,
      name: 'Manicura semipermanente',
      description: 'Manicura con esmaltado semipermanente',
      price: new Decimal(600),
      initialActiveMinutes: 35,
      passiveTimeMinutes: 0,
      finalActiveMinutes: 10,
      durationMinutes: 45,
      isActive: true,
      displayOrder: 2,
    },
  });

  const servicePedicura = await prisma.service.create({
    data: {
      businessId: business.id,
      name: 'Pedicura spa',
      description: 'Pedicura completa con exfoliación y masaje',
      price: new Decimal(700),
      initialActiveMinutes: 40,
      passiveTimeMinutes: 10,
      finalActiveMinutes: 10,
      durationMinutes: 60,
      isActive: true,
      displayOrder: 3,
    },
  });

  // ─── Service Assignments ───────────────────────────────────────────────────
  await prisma.serviceAssignment.createMany({
    data: [
      { staffId: staffLucia.id, serviceId: serviceCorteFem.id, isActive: true },
      { staffId: staffLucia.id, serviceId: serviceColoracion.id, isActive: true },
      { staffId: staffCamila.id, serviceId: serviceManicura.id, isActive: true },
      { staffId: staffCamila.id, serviceId: servicePedicura.id, isActive: true },
    ],
  });

  // ─── Working Hours (Lun-Vie 10:00-19:00, Sáb 10:00-15:00) ─────────────────
  for (const staff of [staffLucia, staffCamila]) {
    for (const day of [1, 2, 3, 4, 5]) {
      await prisma.workingHours.create({
        data: {
          businessId: business.id,
          staffId: staff.id,
          dayOfWeek: day,
          startMinutes: 600, // 10:00
          endMinutes: 1140, // 19:00
          isActive: true,
        },
      });
    }
    await prisma.workingHours.create({
      data: {
        businessId: business.id,
        staffId: staff.id,
        dayOfWeek: 6,
        startMinutes: 600, // 10:00
        endMinutes: 900, // 15:00
        isActive: true,
      },
    });
  }

  // ─── Schedule Exception ────────────────────────────────────────────────────
  await prisma.scheduleException.create({
    data: {
      businessId: business.id,
      staffId: staffCamila.id,
      isClosed: true,
      reason: 'Día libre personal',
      startDate: daysFromNow(3),
      endDate: daysFromNow(3),
      daysOfWeek: [],
    },
  });

  // ─── Customers ─────────────────────────────────────────────────────────────
  const customerValentina = await prisma.customer.create({
    data: {
      businessId: business.id,
      name: 'Valentina Acosta',
      phone: '099111222',
      phoneCountryCode: '+598',
      email: 'vale.acosta@gmail.com',
      emailVerified: true,
      acceptsWhatsapp: true,
      totalAppointments: 15,
      completedAppointments: 14,
      cancelledAppointments: 1,
      totalSpent: 12000,
      firstAppointmentAt: daysFromNow(-90),
      lastAppointmentAt: daysFromNow(-5),
      notes: 'Clienta frecuente, prefiere turno de mañana',
    },
  });

  const customerMajo = await prisma.customer.create({
    data: {
      businessId: business.id,
      name: 'María José Pereyra',
      phone: '099333444',
      phoneCountryCode: '+598',
      email: 'majo.pereyra@gmail.com',
      totalAppointments: 5,
      completedAppointments: 5,
      totalSpent: 4200,
      firstAppointmentAt: daysFromNow(-45),
      lastAppointmentAt: daysFromNow(-10),
    },
  });

  const customerCarolina = await prisma.customer.create({
    data: {
      businessId: business.id,
      name: 'Carolina López',
      phone: '098222333',
      phoneCountryCode: '+598',
      email: 'caro.lopez@outlook.com',
      totalAppointments: 2,
      completedAppointments: 2,
      totalSpent: 1400,
    },
  });

  const customerAnaPaula = await prisma.customer.create({
    data: {
      businessId: business.id,
      name: 'Ana Paula Menéndez',
      phone: '099555666',
      phoneCountryCode: '+598',
      totalAppointments: 0,
      completedAppointments: 0,
      totalSpent: 0,
      notes: 'Nueva clienta, referida por Valentina',
    },
  });

  // ─── Appointments for tomorrow ─────────────────────────────────────────────
  await prisma.appointment.create({
    data: {
      businessId: business.id,
      serviceId: serviceCorteFem.id,
      customerId: customerValentina.id,
      staffId: staffLucia.id,
      startTime: tomorrow(10, 0),
      endTime: tomorrow(10, 45),
      status: AppointmentStatus.CONFIRMED,
      customerName: 'Valentina Acosta',
      customerPhone: '099111222',
      customerEmail: 'vale.acosta@gmail.com',
      confirmationCode: generateConfirmationCode(),
      price: new Decimal(800),
      durationMinutes: 45,
      initialActiveMinutes: 35,
      passiveMinutes: 0,
      finalActiveMinutes: 10,
      blocks: {
        create: [
          {
            staffId: staffLucia.id,
            startTime: tomorrow(10, 0),
            endTime: tomorrow(10, 45),
          },
        ],
      },
    },
  });

  await prisma.appointment.create({
    data: {
      businessId: business.id,
      serviceId: serviceColoracion.id,
      customerId: customerMajo.id,
      staffId: staffLucia.id,
      startTime: tomorrow(11, 0),
      endTime: tomorrow(12, 5),
      status: AppointmentStatus.CONFIRMED,
      customerName: 'María José Pereyra',
      customerPhone: '099333444',
      customerEmail: 'majo.pereyra@gmail.com',
      confirmationCode: generateConfirmationCode(),
      price: new Decimal(1800),
      durationMinutes: 65,
      initialActiveMinutes: 20,
      passiveMinutes: 30,
      finalActiveMinutes: 15,
      blocks: {
        create: [
          {
            staffId: staffLucia.id,
            startTime: tomorrow(11, 0),
            endTime: tomorrow(11, 20),
          },
          {
            staffId: staffLucia.id,
            startTime: tomorrow(11, 50),
            endTime: tomorrow(12, 5),
          },
        ],
      },
    },
  });

  await prisma.appointment.create({
    data: {
      businessId: business.id,
      serviceId: serviceManicura.id,
      customerId: customerCarolina.id,
      staffId: staffCamila.id,
      startTime: tomorrow(10, 30),
      endTime: tomorrow(11, 15),
      status: AppointmentStatus.CONFIRMED,
      customerName: 'Carolina López',
      customerPhone: '098222333',
      customerEmail: 'caro.lopez@outlook.com',
      confirmationCode: generateConfirmationCode(),
      price: new Decimal(600),
      durationMinutes: 45,
      initialActiveMinutes: 35,
      passiveMinutes: 0,
      finalActiveMinutes: 10,
      blocks: {
        create: [
          {
            staffId: staffCamila.id,
            startTime: tomorrow(10, 30),
            endTime: tomorrow(11, 15),
          },
        ],
      },
    },
  });

  await prisma.appointment.create({
    data: {
      businessId: business.id,
      serviceId: servicePedicura.id,
      customerId: customerAnaPaula.id,
      staffId: staffCamila.id,
      startTime: tomorrow(14, 0),
      endTime: tomorrow(15, 0),
      status: AppointmentStatus.CONFIRMED,
      customerName: 'Ana Paula Menéndez',
      customerPhone: '099555666',
      confirmationCode: generateConfirmationCode(),
      price: new Decimal(700),
      durationMinutes: 60,
      initialActiveMinutes: 40,
      passiveMinutes: 10,
      finalActiveMinutes: 10,
      blocks: {
        create: [
          {
            staffId: staffCamila.id,
            startTime: tomorrow(14, 0),
            endTime: tomorrow(14, 40),
          },
          {
            staffId: staffCamila.id,
            startTime: tomorrow(14, 50),
            endTime: tomorrow(15, 0),
          },
        ],
      },
    },
  });
}

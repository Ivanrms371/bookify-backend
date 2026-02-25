import { Decimal } from '@prisma/client/runtime/client';
import { AppointmentStatus, BusinessRole, BusinessType, SubscriptionStatus } from 'src/generated/prisma/client';
import { SeedContext } from '../types';
import { tomorrow, daysFromNow, generateConfirmationCode } from '../helpers';

export async function seedBarberiaElCorte(ctx: SeedContext) {
  const { prisma, passwordHash, plans } = ctx;
  const now = new Date();

  // ─── Owner User ────────────────────────────────────────────────────────────
  const ownerUser = await prisma.user.create({
    data: {
      name: 'Martín López',
      email: 'martin@elcorte.uy',
      emailVerifiedAt: new Date(),
      phone: '+598 91 234 567',
      phoneVerifiedAt: new Date(),
      password: passwordHash,
      lastLoginAt: new Date(),
    },
  });

  // ─── Business ──────────────────────────────────────────────────────────────
  const business = await prisma.business.create({
    data: {
      ownerId: ownerUser.id,
      name: 'Barbería El Corte',
      slug: 'barberia-el-corte',
      type: BusinessType.BARBERSHOP,
      description: 'La mejor barbería de Montevideo. Cortes clásicos y modernos con atención personalizada.',
      addressLine1: 'Av. 18 de Julio 1234',
      addressLine2: 'Local 3, Montevideo',
      phone: '+598 2 908 1234',
      onboardingStep: 5,
      onboardingCompleted: true,
      isActive: true,
    },
  });

  // ─── Business Settings ─────────────────────────────────────────────────────
  await prisma.businessSettings.create({
    data: {
      businessId: business.id,
      slotIntervalMinutes: 30,
      maxAdvancedDays: 30,
      minAdvancedMinutes: 60,
      bufferTimeMinutes: 5,
      cancellationWindowMinutes: 120,
      timezone: 'America/Montevideo',
      currency: 'UYU',
      maxPendingApptsPerClient: 3,
      requireConfirmation: false,
    },
  });

  // ─── Business Limits ───────────────────────────────────────────────────────
  await prisma.businessLimits.create({
    data: {
      businessId: business.id,
      whatsappLimit: 0,
      professionalLimit: 1,
      whatsappCount: 0,
      emailCount: 0,
      whatsappCost: new Decimal(0),
      periodMonth: now.getMonth() + 1,
      periodYear: now.getFullYear(),
      lastResetAt: now,
      appointmentCount: 12,
      appointmentLimit: -1,
      emailCost: new Decimal(0),
      emailLimit: 0,
      professionalCount: 1,
    },
  });

  // ─── Business Lifetime Stats ───────────────────────────────────────────────
  await prisma.businessLifetimeStats.create({
    data: {
      businessId: business.id,
      totalAppointments: 156,
      totalRevenue: new Decimal(78000),
      totalCustomers: 45,
      cancellationRate: new Decimal(8.5),
      noShowRate: new Decimal(3.2),
    },
  });

  // ─── Business Member (Owner) ───────────────────────────────────────────────
  await prisma.businessMember.create({
    data: {
      businessId: business.id,
      userId: ownerUser.id,
      role: BusinessRole.OWNER,
    },
  });

  // ─── Subscription (Free) ──────────────────────────────────────────────────
  await prisma.subscription.create({
    data: {
      businessId: business.id,
      planId: plans.free.id,
      status: SubscriptionStatus.ACTIVE,
      amount: new Decimal(0),
      currency: 'UYU',
      currentPeriodStart: new Date(),
      currentPeriodEnd: daysFromNow(30),
    },
  });

  // ─── Staff ─────────────────────────────────────────────────────────────────
  const staff = await prisma.staff.create({
    data: {
      userId: ownerUser.id,
      businessId: business.id,
      displayName: 'Martín',
      title: 'Barbero Principal',
      bio: 'Barbero con 10 años de experiencia en cortes clásicos y modernos.',
      slotIntervalMinutes: 30,
      maxAdvancedDays: 30,
      minAdvancedMinutes: 60,
      isActive: true,
      displayOrder: 0,
      colorTheme: '#2563EB',
    },
  });

  await prisma.staffLifetimeStats.create({
    data: {
      staffId: staff.id,
      totalRevenue: new Decimal(78000),
      totalAppointments: 156,
      noShowCount: 5,
    },
  });

  // ─── Services ──────────────────────────────────────────────────────────────
  const serviceCorte = await prisma.service.create({
    data: {
      businessId: business.id,
      name: 'Corte de pelo',
      description: 'Corte clásico o moderno a elección',
      price: new Decimal(450),
      initialActiveMinutes: 25,
      passiveTimeMinutes: 0,
      finalActiveMinutes: 5,
      durationMinutes: 30,
      isActive: true,
      displayOrder: 0,
    },
  });

  const serviceBarba = await prisma.service.create({
    data: {
      businessId: business.id,
      name: 'Barba completa',
      description: 'Recorte y perfilado de barba con navaja',
      price: new Decimal(350),
      initialActiveMinutes: 20,
      passiveTimeMinutes: 0,
      finalActiveMinutes: 5,
      durationMinutes: 25,
      isActive: true,
      displayOrder: 1,
    },
  });

  const serviceCombo = await prisma.service.create({
    data: {
      businessId: business.id,
      name: 'Corte + Barba',
      description: 'Combo completo de corte y barba',
      price: new Decimal(700),
      discountPercentage: 10,
      initialActiveMinutes: 40,
      passiveTimeMinutes: 0,
      finalActiveMinutes: 10,
      durationMinutes: 50,
      isActive: true,
      displayOrder: 2,
    },
  });

  // ─── Service Assignments ───────────────────────────────────────────────────
  await prisma.serviceAssignment.createMany({
    data: [
      { staffId: staff.id, serviceId: serviceCorte.id, isActive: true },
      { staffId: staff.id, serviceId: serviceBarba.id, isActive: true },
      { staffId: staff.id, serviceId: serviceCombo.id, isActive: true },
    ],
  });

  // ─── Working Hours (Lun-Vie 9:00-18:00, Sáb 9:00-14:00) ──────────────────
  for (const day of [1, 2, 3, 4, 5]) {
    await prisma.workingHours.create({
      data: {
        businessId: business.id,
        staffId: staff.id,
        dayOfWeek: day,
        startMinutes: 540, // 9:00
        endMinutes: 1080, // 18:00
        isActive: true,
      },
    });
  }
  await prisma.workingHours.create({
    data: {
      businessId: business.id,
      staffId: staff.id,
      dayOfWeek: 6, // Saturday
      startMinutes: 540, // 9:00
      endMinutes: 840, // 14:00
      isActive: true,
    },
  });

  // ─── Schedule Exception ────────────────────────────────────────────────────
  await prisma.scheduleException.create({
    data: {
      businessId: business.id,
      staffId: staff.id,
      isClosed: false,
      reason: 'Horario reducido - turno médico',
      startDate: daysFromNow(1),
      endDate: daysFromNow(1),
      daysOfWeek: [],
      blocks: {
        create: [
          {
            startMinutes: 540, // 9:00
            endMinutes: 780, // 13:00
          },
        ],
      },
    },
  });

  // ─── Customers ─────────────────────────────────────────────────────────────
  const customerFede = await prisma.customer.create({
    data: {
      businessId: business.id,
      name: 'Federico Gómez',
      phone: '099123456',
      phoneCountryCode: '+598',
      email: 'fede.gomez@gmail.com',
      emailVerified: true,
      totalAppointments: 8,
      completedAppointments: 7,
      cancelledAppointments: 1,
      totalSpent: 3600,
      firstAppointmentAt: daysFromNow(-60),
      lastAppointmentAt: daysFromNow(-7),
    },
  });

  const customerSantiago = await prisma.customer.create({
    data: {
      businessId: business.id,
      name: 'Santiago Rodríguez',
      phone: '099654321',
      phoneCountryCode: '+598',
      email: 'santiago.rod@hotmail.com',
      totalAppointments: 3,
      completedAppointments: 3,
      totalSpent: 1350,
      firstAppointmentAt: daysFromNow(-30),
      lastAppointmentAt: daysFromNow(-14),
    },
  });

  const customerAndres = await prisma.customer.create({
    data: {
      businessId: business.id,
      name: 'Andrés Martínez',
      phone: '098765432',
      phoneCountryCode: '+598',
      totalAppointments: 1,
      completedAppointments: 0,
      totalSpent: 0,
      notes: 'Cliente nuevo, prefiere corte moderno',
    },
  });

  // ─── Appointments for tomorrow ─────────────────────────────────────────────
  await prisma.appointment.create({
    data: {
      businessId: business.id,
      serviceId: serviceCorte.id,
      customerId: customerFede.id,
      staffId: staff.id,
      startTime: tomorrow(9, 0),
      endTime: tomorrow(9, 30),
      status: AppointmentStatus.CONFIRMED,
      customerName: 'Federico Gómez',
      customerPhone: '099123456',
      customerEmail: 'fede.gomez@gmail.com',
      confirmationCode: generateConfirmationCode(),
      price: new Decimal(450),
      durationMinutes: 30,
      initialActiveMinutes: 25,
      passiveMinutes: 0,
      finalActiveMinutes: 5,
      blocks: {
        create: [
          {
            staffId: staff.id,
            startTime: tomorrow(9, 0),
            endTime: tomorrow(9, 30),
          },
        ],
      },
    },
  });

  await prisma.appointment.create({
    data: {
      businessId: business.id,
      serviceId: serviceCombo.id,
      customerId: customerSantiago.id,
      staffId: staff.id,
      startTime: tomorrow(10, 0),
      endTime: tomorrow(10, 50),
      status: AppointmentStatus.CONFIRMED,
      customerName: 'Santiago Rodríguez',
      customerPhone: '099654321',
      customerEmail: 'santiago.rod@hotmail.com',
      confirmationCode: generateConfirmationCode(),
      price: new Decimal(630),
      discountPercentage: 10,
      durationMinutes: 50,
      initialActiveMinutes: 40,
      passiveMinutes: 0,
      finalActiveMinutes: 10,
      blocks: {
        create: [
          {
            staffId: staff.id,
            startTime: tomorrow(10, 0),
            endTime: tomorrow(10, 50),
          },
        ],
      },
    },
  });

  await prisma.appointment.create({
    data: {
      businessId: business.id,
      serviceId: serviceCorte.id,
      customerId: customerAndres.id,
      staffId: staff.id,
      startTime: tomorrow(11, 0),
      endTime: tomorrow(11, 30),
      status: AppointmentStatus.CONFIRMED,
      customerName: 'Andrés Martínez',
      customerPhone: '098765432',
      confirmationCode: generateConfirmationCode(),
      price: new Decimal(450),
      durationMinutes: 30,
      initialActiveMinutes: 25,
      passiveMinutes: 0,
      finalActiveMinutes: 5,
      notes: 'Corte moderno fade',
      blocks: {
        create: [
          {
            staffId: staff.id,
            startTime: tomorrow(11, 0),
            endTime: tomorrow(11, 30),
          },
        ],
      },
    },
  });
}

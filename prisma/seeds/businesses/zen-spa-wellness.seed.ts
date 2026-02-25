import { Decimal } from '@prisma/client/runtime/client';
import { AppointmentStatus, BillingCycle, BusinessRole, BusinessType, SubscriptionStatus } from 'src/generated/prisma/client';
import { SeedContext } from '../types';
import { tomorrow, daysFromNow, generateConfirmationCode } from '../helpers';

export async function seedZenSpaWellness(ctx: SeedContext) {
  const { prisma, passwordHash, plans } = ctx;
  const now = new Date();

  // ─── Users ─────────────────────────────────────────────────────────────────
  const ownerUser = await prisma.user.create({
    data: {
      name: 'Alejandra Vidal',
      email: 'alejandra@zenspa.uy',
      emailVerifiedAt: new Date(),
      phone: '+598 94 567 890',
      phoneVerifiedAt: new Date(),
      password: passwordHash,
      lastLoginAt: new Date(),
    },
  });

  const staffUserDiego = await prisma.user.create({
    data: {
      name: 'Diego Ramírez',
      email: 'diego@zenspa.uy',
      emailVerifiedAt: new Date(),
      phone: '+598 95 678 901',
      password: passwordHash,
    },
  });

  const staffUserSofia = await prisma.user.create({
    data: {
      name: 'Sofía Méndez',
      email: 'sofia@zenspa.uy',
      emailVerifiedAt: new Date(),
      phone: '+598 96 789 012',
      password: passwordHash,
    },
  });

  // ─── Business ──────────────────────────────────────────────────────────────
  const business = await prisma.business.create({
    data: {
      ownerId: ownerUser.id,
      name: 'Zen Spa & Wellness',
      slug: 'zen-spa-wellness',
      type: BusinessType.SPA_SALON,
      description: 'Centro de bienestar integral. Masajes, tratamientos faciales y corporales en un ambiente de relax total.',
      addressLine1: 'Rambla República del Perú 1089',
      addressLine2: 'Punta Carretas',
      phone: '+598 2 614 9012',
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
      maxAdvancedDays: 90,
      minAdvancedMinutes: 120,
      bufferTimeMinutes: 15,
      cancellationWindowMinutes: 240,
      timezone: 'America/Montevideo',
      currency: 'UYU',
      maxPendingApptsPerClient: 2,
      requireConfirmation: true,
      allowPassiveTimeBooking: false,
    },
  });

  // ─── Business Limits ───────────────────────────────────────────────────────
  await prisma.businessLimits.create({
    data: {
      businessId: business.id,
      whatsappLimit: 1200,
      professionalLimit: 5,
      whatsappCount: 234,
      emailCount: 189,
      whatsappCost: new Decimal(0.035),
      periodMonth: now.getMonth() + 1,
      periodYear: now.getFullYear(),
      lastResetAt: now,
      appointmentCount: 156,
      appointmentLimit: -1,
      emailCost: new Decimal(0.001),
      emailLimit: 1500,
      professionalCount: 3,
    },
  });

  // ─── Business Lifetime Stats ───────────────────────────────────────────────
  await prisma.businessLifetimeStats.create({
    data: {
      businessId: business.id,
      totalAppointments: 1250,
      totalRevenue: new Decimal(1875000),
      totalCustomers: 380,
      cancellationRate: new Decimal(4.2),
      noShowRate: new Decimal(1.8),
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
      userId: staffUserDiego.id,
      role: BusinessRole.ADMIN,
    },
  });

  await prisma.businessMember.create({
    data: {
      businessId: business.id,
      userId: staffUserSofia.id,
      role: BusinessRole.STAFF,
    },
  });

  // ─── Subscription (Team Active) ────────────────────────────────────────────
  await prisma.subscription.create({
    data: {
      businessId: business.id,
      planId: plans.team.id,
      status: SubscriptionStatus.ACTIVE,
      amount: new Decimal(1190),
      currency: 'UYU',
      billingCycle: BillingCycle.MONTHLY,
      currentPeriodStart: daysFromNow(-15),
      currentPeriodEnd: daysFromNow(15),
      nextPaymentDate: daysFromNow(15),
      trialEndsAt: daysFromNow(-30),
      trialUsedAt: daysFromNow(-44),
      paymentMethod: 'credit_card',
      paymentProvider: 'mercadopago',
    },
  });

  // ─── Staff ─────────────────────────────────────────────────────────────────
  const staffAlejandra = await prisma.staff.create({
    data: {
      userId: ownerUser.id,
      businessId: business.id,
      displayName: 'Alejandra',
      title: 'Directora & Masajista',
      bio: 'Terapeuta holística con 15 años de trayectoria en masajes y bienestar.',
      slotIntervalMinutes: 30,
      maxAdvancedDays: 90,
      minAdvancedMinutes: 120,
      isActive: true,
      displayOrder: 0,
      colorTheme: '#059669',
    },
  });

  const staffDiego = await prisma.staff.create({
    data: {
      userId: staffUserDiego.id,
      businessId: business.id,
      displayName: 'Diego',
      title: 'Masajista Deportivo',
      bio: 'Especialista en masajes deportivos y descontracturantes.',
      slotIntervalMinutes: 30,
      maxAdvancedDays: 60,
      minAdvancedMinutes: 60,
      isActive: true,
      displayOrder: 1,
      colorTheme: '#D97706',
      commissionPercent: new Decimal(15),
    },
  });

  const staffSofia = await prisma.staff.create({
    data: {
      userId: staffUserSofia.id,
      businessId: business.id,
      displayName: 'Sofía',
      title: 'Esteticista Facial',
      bio: 'Especialista en tratamientos faciales y cuidado de la piel.',
      slotIntervalMinutes: 30,
      maxAdvancedDays: 60,
      minAdvancedMinutes: 60,
      isActive: true,
      displayOrder: 2,
      colorTheme: '#DC2626',
      commissionPercent: new Decimal(12),
    },
  });

  // ─── Staff Lifetime Stats ──────────────────────────────────────────────────
  await prisma.staffLifetimeStats.create({
    data: {
      staffId: staffAlejandra.id,
      totalRevenue: new Decimal(750000),
      totalAppointments: 500,
      noShowCount: 12,
    },
  });

  await prisma.staffLifetimeStats.create({
    data: {
      staffId: staffDiego.id,
      totalRevenue: new Decimal(625000),
      totalAppointments: 420,
      noShowCount: 7,
    },
  });

  await prisma.staffLifetimeStats.create({
    data: {
      staffId: staffSofia.id,
      totalRevenue: new Decimal(500000),
      totalAppointments: 330,
      noShowCount: 4,
    },
  });

  // ─── Services ──────────────────────────────────────────────────────────────
  const serviceMasajeDesc = await prisma.service.create({
    data: {
      businessId: business.id,
      name: 'Masaje descontracturante',
      description: 'Masaje terapéutico para liberar tensiones musculares',
      price: new Decimal(1500),
      initialActiveMinutes: 55,
      passiveTimeMinutes: 0,
      finalActiveMinutes: 5,
      durationMinutes: 60,
      isActive: true,
      displayOrder: 0,
    },
  });

  const servicePiedras = await prisma.service.create({
    data: {
      businessId: business.id,
      name: 'Masaje con piedras calientes',
      description: 'Masaje relajante con piedras volcánicas',
      price: new Decimal(2200),
      initialActiveMinutes: 10,
      passiveTimeMinutes: 30,
      finalActiveMinutes: 50,
      durationMinutes: 90,
      isActive: true,
      displayOrder: 1,
    },
  });

  const serviceLimpiezaFacial = await prisma.service.create({
    data: {
      businessId: business.id,
      name: 'Limpieza facial profunda',
      description: 'Tratamiento completo de limpieza y nutrición facial',
      price: new Decimal(1200),
      initialActiveMinutes: 25,
      passiveTimeMinutes: 15,
      finalActiveMinutes: 20,
      durationMinutes: 60,
      isActive: true,
      displayOrder: 2,
    },
  });

  const serviceAntiage = await prisma.service.create({
    data: {
      businessId: business.id,
      name: 'Tratamiento antiage',
      description: 'Tratamiento facial con ácido hialurónico y colágeno',
      price: new Decimal(2500),
      initialActiveMinutes: 30,
      passiveTimeMinutes: 20,
      finalActiveMinutes: 25,
      durationMinutes: 75,
      isActive: true,
      displayOrder: 3,
    },
  });

  const serviceCircuito = await prisma.service.create({
    data: {
      businessId: business.id,
      name: 'Circuito spa',
      description: 'Sauna, jacuzzi y masaje relajante completo',
      price: new Decimal(3500),
      discountPercentage: 15,
      initialActiveMinutes: 20,
      passiveTimeMinutes: 60,
      finalActiveMinutes: 40,
      durationMinutes: 120,
      isActive: true,
      displayOrder: 4,
    },
  });

  // ─── Service Assignments ───────────────────────────────────────────────────
  await prisma.serviceAssignment.createMany({
    data: [
      { staffId: staffAlejandra.id, serviceId: serviceMasajeDesc.id, isActive: true },
      { staffId: staffAlejandra.id, serviceId: servicePiedras.id, isActive: true },
      { staffId: staffAlejandra.id, serviceId: serviceCircuito.id, isActive: true },
      { staffId: staffDiego.id, serviceId: serviceMasajeDesc.id, isActive: true },
      { staffId: staffDiego.id, serviceId: servicePiedras.id, isActive: true },
      { staffId: staffSofia.id, serviceId: serviceLimpiezaFacial.id, isActive: true },
      { staffId: staffSofia.id, serviceId: serviceAntiage.id, isActive: true },
    ],
  });

  // ─── Working Hours (Lun-Vie 9:00-20:00, Sáb 10:00-16:00) ──────────────────
  for (const staff of [staffAlejandra, staffDiego, staffSofia]) {
    for (const day of [1, 2, 3, 4, 5]) {
      await prisma.workingHours.create({
        data: {
          businessId: business.id,
          staffId: staff.id,
          dayOfWeek: day,
          startMinutes: 540, // 9:00
          endMinutes: 1200, // 20:00
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
        endMinutes: 960, // 16:00
        isActive: true,
      },
    });
  }

  // ─── Schedule Exceptions ───────────────────────────────────────────────────
  await prisma.scheduleException.create({
    data: {
      businessId: business.id,
      staffId: staffDiego.id,
      isClosed: true,
      reason: 'Capacitación profesional',
      startDate: daysFromNow(5),
      endDate: daysFromNow(5),
      daysOfWeek: [],
    },
  });

  await prisma.scheduleException.create({
    data: {
      businessId: business.id,
      staffId: staffSofia.id,
      isClosed: false,
      reason: 'Horario especial - evento privado',
      startDate: daysFromNow(1),
      endDate: daysFromNow(1),
      daysOfWeek: [],
      blocks: {
        create: [
          {
            startMinutes: 540, // 9:00
            endMinutes: 720, // 12:00
          },
        ],
      },
    },
  });

  // ─── Customers ─────────────────────────────────────────────────────────────
  const customerPatricia = await prisma.customer.create({
    data: {
      businessId: business.id,
      name: 'Patricia Hernández',
      phone: '099888999',
      phoneCountryCode: '+598',
      email: 'patricia.h@gmail.com',
      emailVerified: true,
      acceptsWhatsapp: true,
      totalAppointments: 22,
      completedAppointments: 21,
      cancelledAppointments: 1,
      totalSpent: 38500,
      firstAppointmentAt: daysFromNow(-180),
      lastAppointmentAt: daysFromNow(-3),
      notes: 'VIP - clienta frecuente',
    },
  });

  const customerRoberto = await prisma.customer.create({
    data: {
      businessId: business.id,
      name: 'Roberto Sánchez',
      phone: '098444555',
      phoneCountryCode: '+598',
      email: 'roberto.sanchez@empresa.uy',
      emailVerified: true,
      totalAppointments: 10,
      completedAppointments: 9,
      noShowCount: 1,
      totalSpent: 15000,
      firstAppointmentAt: daysFromNow(-120),
      lastAppointmentAt: daysFromNow(-14),
    },
  });

  const customerLaura = await prisma.customer.create({
    data: {
      businessId: business.id,
      name: 'Laura Gutiérrez',
      phone: '099777888',
      phoneCountryCode: '+598',
      email: 'laura.g@icloud.com',
      totalAppointments: 4,
      completedAppointments: 4,
      totalSpent: 6800,
      firstAppointmentAt: daysFromNow(-60),
      lastAppointmentAt: daysFromNow(-8),
    },
  });

  const customerMarcos = await prisma.customer.create({
    data: {
      businessId: business.id,
      name: 'Marcos Silveira',
      phone: '098333222',
      phoneCountryCode: '+598',
      totalAppointments: 2,
      completedAppointments: 2,
      totalSpent: 3000,
      internalNotes: 'Prefiere masajes fuertes',
    },
  });

  const customerDaniela = await prisma.customer.create({
    data: {
      businessId: business.id,
      name: 'Daniela Ribeiro',
      phone: '099666777',
      phoneCountryCode: '+598',
      email: 'daniela.rib@gmail.com',
      totalAppointments: 0,
      completedAppointments: 0,
      totalSpent: 0,
      notes: 'Consulta inicial pendiente',
    },
  });

  // ─── Appointments for tomorrow ─────────────────────────────────────────────
  await prisma.appointment.create({
    data: {
      businessId: business.id,
      serviceId: servicePiedras.id,
      customerId: customerPatricia.id,
      staffId: staffAlejandra.id,
      startTime: tomorrow(9, 0),
      endTime: tomorrow(10, 30),
      status: AppointmentStatus.CONFIRMED,
      customerName: 'Patricia Hernández',
      customerPhone: '099888999',
      customerEmail: 'patricia.h@gmail.com',
      confirmationCode: generateConfirmationCode(),
      price: new Decimal(2200),
      durationMinutes: 90,
      initialActiveMinutes: 10,
      passiveMinutes: 30,
      finalActiveMinutes: 50,
      blocks: {
        create: [
          {
            staffId: staffAlejandra.id,
            startTime: tomorrow(9, 0),
            endTime: tomorrow(9, 10),
          },
          {
            staffId: staffAlejandra.id,
            startTime: tomorrow(9, 40),
            endTime: tomorrow(10, 30),
          },
        ],
      },
    },
  });

  await prisma.appointment.create({
    data: {
      businessId: business.id,
      serviceId: serviceMasajeDesc.id,
      customerId: customerRoberto.id,
      staffId: staffDiego.id,
      startTime: tomorrow(10, 0),
      endTime: tomorrow(11, 0),
      status: AppointmentStatus.CONFIRMED,
      customerName: 'Roberto Sánchez',
      customerPhone: '098444555',
      customerEmail: 'roberto.sanchez@empresa.uy',
      confirmationCode: generateConfirmationCode(),
      price: new Decimal(1500),
      durationMinutes: 60,
      initialActiveMinutes: 55,
      passiveMinutes: 0,
      finalActiveMinutes: 5,
      blocks: {
        create: [
          {
            staffId: staffDiego.id,
            startTime: tomorrow(10, 0),
            endTime: tomorrow(11, 0),
          },
        ],
      },
    },
  });

  await prisma.appointment.create({
    data: {
      businessId: business.id,
      serviceId: serviceLimpiezaFacial.id,
      customerId: customerLaura.id,
      staffId: staffSofia.id,
      startTime: tomorrow(9, 30),
      endTime: tomorrow(10, 30),
      status: AppointmentStatus.CONFIRMED,
      customerName: 'Laura Gutiérrez',
      customerPhone: '099777888',
      customerEmail: 'laura.g@icloud.com',
      confirmationCode: generateConfirmationCode(),
      price: new Decimal(1200),
      durationMinutes: 60,
      initialActiveMinutes: 25,
      passiveMinutes: 15,
      finalActiveMinutes: 20,
      blocks: {
        create: [
          {
            staffId: staffSofia.id,
            startTime: tomorrow(9, 30),
            endTime: tomorrow(9, 55),
          },
          {
            staffId: staffSofia.id,
            startTime: tomorrow(10, 10),
            endTime: tomorrow(10, 30),
          },
        ],
      },
    },
  });

  await prisma.appointment.create({
    data: {
      businessId: business.id,
      serviceId: serviceMasajeDesc.id,
      customerId: customerMarcos.id,
      staffId: staffDiego.id,
      startTime: tomorrow(14, 0),
      endTime: tomorrow(15, 0),
      status: AppointmentStatus.CONFIRMED,
      customerName: 'Marcos Silveira',
      customerPhone: '098333222',
      confirmationCode: generateConfirmationCode(),
      price: new Decimal(1500),
      durationMinutes: 60,
      initialActiveMinutes: 55,
      passiveMinutes: 0,
      finalActiveMinutes: 5,
      notes: 'Masaje fuerte, zona lumbar y cervical',
      blocks: {
        create: [
          {
            staffId: staffDiego.id,
            startTime: tomorrow(14, 0),
            endTime: tomorrow(15, 0),
          },
        ],
      },
    },
  });

  await prisma.appointment.create({
    data: {
      businessId: business.id,
      serviceId: serviceCircuito.id,
      customerId: customerDaniela.id,
      staffId: staffAlejandra.id,
      startTime: tomorrow(15, 0),
      endTime: tomorrow(17, 0),
      status: AppointmentStatus.CONFIRMED,
      customerName: 'Daniela Ribeiro',
      customerPhone: '099666777',
      customerEmail: 'daniela.rib@gmail.com',
      confirmationCode: generateConfirmationCode(),
      price: new Decimal(2975),
      discountPercentage: 15,
      durationMinutes: 120,
      initialActiveMinutes: 20,
      passiveMinutes: 60,
      finalActiveMinutes: 40,
      notes: 'Primera visita - circuito spa completo',
      blocks: {
        create: [
          {
            staffId: staffAlejandra.id,
            startTime: tomorrow(15, 0),
            endTime: tomorrow(15, 20),
          },
          {
            staffId: staffAlejandra.id,
            startTime: tomorrow(16, 20),
            endTime: tomorrow(17, 0),
          },
        ],
      },
    },
  });
}

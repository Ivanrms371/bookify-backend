import type { Plan, PlanId } from './types/plan.types';
export type { WorkspaceType, BillingCycle, PlanId, PlanPrice, Plan } from './types/plan.types';

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: 'free',
    title: 'Free',
    description: 'Ideal para empezar tu negocio',
    compatibleWorkspaces: ['INDIVIDUAL'],
    maxProfessionals: 1,
    maxServices: 10,
    sortOrder: 1,
    isPopular: false,
    cta: 'Comenzar gratis',
    features: [
      '1 profesional',
      'Hasta 10 servicios',
      'Reservas ilimitadas',
      'Página de reservas',
      'Estadísticas básicas',
      'Sin recordatorios',
    ],
    pricing: {
      MONTHLY: {
        price: 0,
        compareAtPrice: null,
      },
    },
  },
  pro: {
    id: 'pro',
    title: 'Pro',
    description: 'Ideal para pequeños equipos',
    compatibleWorkspaces: ['INDIVIDUAL', 'TEAM'],
    maxProfessionals: 3,
    maxServices: 30,
    sortOrder: 2,
    isPopular: true,
    cta: 'Elegir Pro',
    features: [
      'Todo lo del plan Free',
      'Hasta 3 profesionales',
      'Hasta 30 servicios',
      'Recordatorios automáticos',
      'Estadísticas avanzadas',
      'Soporte prioritario',
      'Hasta 200 WhatsApp/mes',
      'Hasta 400 emails/mes',
    ],
    pricing: {
      MONTHLY: {
        price: 14.99,
        compareAtPrice: null,
        lemonVariantId: process.env.LEMON_VARIANT_PRO_MONTHLY ?? '',
      },
      ANNUAL: {
        price: 143.88,
        compareAtPrice: 179.88,
        equivalentMonthlyPrice: 11.99,
        lemonVariantId: process.env.LEMON_VARIANT_PRO_ANNUAL ?? '',
      },
    },
  },
  pro_plus: {
    id: 'pro_plus',
    title: 'Pro+',
    description: 'Ideal para equipos de hasta 8 profesionales',
    compatibleWorkspaces: ['INDIVIDUAL', 'TEAM'],
    maxProfessionals: 8,
    maxServices: 60,
    sortOrder: 3,
    isPopular: false,
    cta: 'Elegir Pro+',
    features: [
      'Todo lo del plan Pro',
      'Hasta 8 profesionales',
      'Hasta 60 servicios',
      'Gestión de profesionales',
      'Panel de administración',
      'Hasta 1200 emails/mes',
      'Hasta 500 WhatsApp/mes',
    ],
    pricing: {
      MONTHLY: {
        price: 24.99,
        compareAtPrice: null,
        lemonVariantId: process.env.LEMON_VARIANT_PRO_PLUS_MONTHLY ?? '',
      },
      ANNUAL: {
        price: 239.88,
        compareAtPrice: 299.88,
        equivalentMonthlyPrice: 19.99,
        lemonVariantId: process.env.LEMON_VARIANT_PRO_PLUS_ANNUAL ?? '',
      },
    },
  },
};

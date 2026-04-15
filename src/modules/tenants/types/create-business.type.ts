export type CreateTenantInput = {
  ownerId: string;
  plan: PlanFree;
};

type PlanFree = {
  id: string;
  limits: {
    whatsappLimit: number;
    professionalLimit: number;
    emailLimit: number;
    appointmentLimit: number;
  };
};

export type AcceptInviteInput = {
  name: string;
  phone: string;
  password: string;
  workingHours: {
    dayOfWeek: number;
    opensAt: number;
    closesAt: number;
    isActive: boolean;
    name?: string;
  }[];
  serviceIds: string[];
};

export type WorkingHourInput = {
  dayOfWeek: number;
  opensAt: number;
  closesAt: number;
  isActive: boolean;
  name?: string;
};

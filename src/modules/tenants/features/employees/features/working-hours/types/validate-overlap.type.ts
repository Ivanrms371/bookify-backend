export type ValidateOverlapParams = {
  employeeId: string;
  dayOfWeek: number;
  opensAt: number;
  closesAt: number;
  excludeWorkingHourId?: string;
};
